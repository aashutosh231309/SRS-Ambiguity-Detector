# API Contract

> **Status:** BINDING as of Stage 01. Routers for these resources do NOT exist yet (they are
> built in their owning stages); this contract exists so frontend/backend/database work cannot
> drift. Any deviation requires a contract amendment (`CHANGELOG.md` + version bump if breaking).

## 1. Base + versioning

- Base URL (browser): `NEXT_PUBLIC_API_URL`, default `http://localhost:8000/api/v1`.
- All paths below are relative to `/api/v1`. Breaking changes require `/api/v2` + dual-serve
  window; additive changes (new optional fields/endpoints) do not.
- `Content-Type: application/json; charset=utf-8` for JSON bodies. Multipart only for uploads.
- Auth: httpOnly cookies (`access_token`, `refresh_token`) sent with `credentials: "include"`.
  Same-origin + `SameSite=Lax` + origin allowlist (see `SECURITY_SPEC.md`).

## 2. Envelopes (uniform — no exceptions)

**Success (single resource):** return the resource object directly, `2xx`.

**Success (collection):**
```json
{ "items": [ { } ], "page": 1, "page_size": 20, "total": 137 }
```

**Error (all failures, including validation):**
```json
{ "error": { "code": "analysis_not_found", "message": "Analysis not found.", "details": null } }
```
- `code`: stable `snake_case` machine code (frontend switches on this, NEVER on `message`).
- `message`: human-readable, safe to display (already redacted server-side).
- `details`: optional object (e.g. per-field validation errors). Never secrets/stack traces.
- FastAPI's default `{"detail": …}` MUST be converted by exception handlers in `main.py`.
- Server mapping: services raise `AppError` subclasses (`backend/app/exceptions/`);
  `SQLAlchemyError` and unknown failures → `500 internal_error`, sanitized (never
  SQL/DSN/traces in responses — server-side logs only).

**Standard codes (extend per resource, keep this table current):**

| HTTP | `code` | Meaning |
|------|--------|---------|
| 400 | `bad_request` / `validation_error` / `invalid_token` / `password_too_weak` / `current_password_incorrect` / `text_too_large` / `no_requirements_detected` / `document_analysis_unavailable` / `unsupported_file_type` / `invalid_filename` / `empty_file` / `file_too_large` / `extracted_text_too_large` / `too_many_files` | Malformed input / schema failure / bad link-token / weak password / wrong current password / text over budget or requirements over cap (with counts) / segmentable text yielded zero requirements / by-id re-analysis still unavailable / extension+MIME+magic disagree or type outside pdf/docx/txt / filename missing/unusable / zero bytes / bytes/pages/members over budget (reason + limit in details) / extracted text over chars (`max_chars` in details) / more than one file part (`max_files` in details) |
| 401 | `unauthenticated` / `invalid_credentials` | Missing/invalid session / bad email+password (indistinguishable) |
| 403 | `forbidden` / `email_unverified` / `account_disabled` | Not owner / unverified / deactivated |
| 404 | `<resource>_not_found` | e.g. `analysis_not_found`, `document_not_found`, `ai_provider_not_found` (missing AND foreign ids identical — no oracle) |
| 409 | `conflict` | e.g. duplicate provider key |
| 413 | (reserved — never emitted) | Size budgets refuse with 400 `file_too_large` / `extracted_text_too_large` instead (reason + limit in details) |
| 415 | (reserved — never emitted) | Unacceptable files refuse with 400 `unsupported_file_type` instead |
| 422 | `extraction_failed` / `no_extractable_text` | File passed validation but the parser could not read it / parsed fine with zero usable text (image-only PDF, empty DOCX/TXT) |
| 429 | `rate_limited` | With `Retry-After` header |
| 5xx | `internal_error` / `provider_error` / `ai_unavailable` / `document_processing_timeout` | Never leak internals / validate+extract past the 60 s budget (temp cleaned, nothing persisted — retryable) |

## 3. Pagination / filtering / sorting (collections)

Query params: `page` (≥1, default 1), `page_size` (1–100, default 20),
`sort` (`created_at` | `-created_at` | `score` | `-score`, default `-created_at`),
resource-specific `q` (search), `band`, `category`, `severity`, `source_type`.
Unknown params are ignored (forward-compatible). `q` semantics are
endpoint-defined — see §4.3 for the analysis list (the only `q` consumer).

## 4. Endpoints

### 4.1 Health (IMPLEMENTED — Stage 01)

```
GET /health/live    → 200 {"status":"ok","service":"srs-ambiguity-detector","version":"0.1.0"}
GET /health/ready   → 200 {"status":"ready"|"degraded","checks":{"database":"not_configured"|"ok"|"error",…}}
```
- No auth. `live` = process up. `ready` runs a live `SELECT 1` when `DATABASE_URL`
  is set (`not_configured` without it, `degraded` on failure) — implemented Stage 02.
  Business endpoints below remain PLANNED until their stages land.
- Frontend `ApiStatus` component polls `live` (proves the envelope + CORS wiring).
- Infra alias (IMPLEMENTED): `GET /health` (unversioned, outside `/api/v1`) returns the
  exact `live` payload for load balancers / uptime checks / PaaS probes. It is NOT part of
  the versioned product API and MUST NOT gain product fields; OpenAPI-excluded.

### 4.2 Auth — backend ✅ Stage 04 / frontend ✅ Stage 05

```
POST /auth/register            {name, email, password, turnstile_token?} → 201 {id,email,is_verified:false}
POST /auth/verify-email        {token} → 200 {id,email,is_verified:true} (+ sets session cookies)
POST /auth/resend-verification {email} → 202 {} (always 202: no account enumeration)
POST /auth/login               {email, password, turnstile_token?} → 200 {id,email,is_verified} (+ cookies)
POST /auth/refresh             (refresh cookie) → 200 {id,email,is_verified} (+ rotates cookies)
POST /auth/logout              (refresh cookie, optional) → 204 (clears cookies, revokes refresh)
GET  /auth/me                  → 200 {id,email,display_name,is_verified,is_active,created_at} | 401
POST /auth/forgot-password     {email} → 202 {} (always 202)
POST /auth/reset-password      {token, new_password} → 200 {}
POST /auth/change-password     {current_password, new_password} → 200 {} (auth required)
DELETE /auth/account           {confirmation:"DELETE"} → 204 (full cascade delete, auth required)
```
- Amendment (Stage 04, additive): `POST /auth/refresh` is the explicit rotation
  endpoint — the Stage 00 contract implied silent rotation but named no endpoint.
  Re-presenting a rotated refresh token revokes its whole family (theft response).
- `/me` also returns `display_name` / `is_active` (additive); `register` takes `name`.
- Validation (server): email format; password 12–256 chars + common-password denylist
  + must not contain the email local part; link tokens 16–128 chars. `turnstile_token`
  is accepted-and-ignored until Stage 22 verifies it.
- Anti-enumeration: duplicate register → synthetic `201` (+ `account_exists` notice to
  the real inbox); forgot/resend → always `202` (+ uniform timing); token endpoints
  (256-bit, unguessable) return honest `400 invalid_token`.
- Unverified accounts CAN log in (sessions issued); app resources gate on verification
  per-endpoint (`403 email_unverified`). Logout works with an expired access token
  (the refresh cookie is the credential) and is idempotent.
- Emailed links point at frontend routes `/verify-email?token=…` and
  `/reset-password?token=…` (✅ Stage 05).
- Frontend assumptions (Stage 05, verified live against this contract): `register`
  sets NO cookies (register never logs in — the session starts at verify or login);
  unverified accounts CAN log in (200 + cookies); login/register/verify/refresh
  return `{id,email,is_verified}`; `/me` returns the full identity row; logout is
  `204` (empty body); resend/forgot are `202 {}`; reset/change are `200 {}`.
  `validation_error` details are `[{loc:[…], msg}]` — the UI maps known `loc` tails
  to fields. The UI sends NO `turnstile_token` field and implements NO remember-me
  (neither exists server-side). Outstanding access JWTs survive reset/logout until
  TTL expiry (stateless bearers); revocation applies to refresh — the UI never
  assumes otherwise.

### 4.3 Analysis — POST + GET/list/DELETE live (Stage 07: deterministic detection + scoring)

```
POST /analysis                  Text → segment + detect + score → 201 AnalysisDetail ✅ (TEXT ONLY)
GET  /analysis                  List own analyses (paginated, §3) → 200 Collection<AnalysisSummary> ✅
GET  /analysis/{id}             Full detail incl. requirements+issues → 200 AnalysisDetail | 404 ✅
DELETE /analysis/{id}           Delete own analysis (cascade) → 204 | 404 ✅
POST /analysis/{id}/retry-ai    Re-run ONLY the AI enhancement step → 200 {ai_status,…} (Stage 20)
```

**POST /analysis request:**
```json
{ "title": "optional ≤200 chars", "text": "past requirement text…", "document_id": null,
  "options": { "ai_enhance": true } }
```
- Exactly one of `text` / `document_id`. Limits: `text` ≤ 200 000 chars; requirements cap
  enforced after segmentation (excess → `400 text_too_large` with counts).
- `ai_enhance:false` skips AI even if configured (deterministic-only run —
  `ai_status: "skipped"`); `true` runs the shared post-commit AI step
  (deterministic commits first, AI can never block it) and reports honestly
  — `ok` / `failed` + user-safe `ai_error` / `unconfigured` (Stage 14
  amendment below).
- Stage 07 reality (TEXT ONLY): `text` is required, 1–200 000 chars after app-side
  normalization (empty/whitespace-only → `400 validation_error`); non-null
  `document_id` → `400 document_analysis_unavailable`; `options.ai_enhance` is
  LIVE since Stage 14 (was accepted-and-ignored through Stage 13 — see the amendment below).
  No `user_id` is accepted — the analysis belongs to the session user.
  Segmentable text that yields zero requirements → `400
  no_requirements_detected`; nothing is persisted on any 4xx. On success the
  pipeline runs synchronously (segment → 11 detectors → score → persist) and
  returns `201` with `status: "analyzed"` and fully populated
  scores/issues/breakdown — `GET /analysis/{id}` returns the byte-identical
  detail. Verified-users-only (`401 unauthenticated` / `403 email_unverified`,
  same as every analysis route).

**AnalysisDetail (response + GET):**
```json
{
  "id": "uuid", "title": "…", "source_type": "text", "score": 72, "band": "moderate",
  "score_breakdown": { "base": 100, "deductions": [ {"issue_id": "uuid", "severity": "medium", "points": 10} ] },
  "requirements_count": 3, "issues_count": 4, "health": { "clarity": 70, "specificity": 65, "measurability": 58, "completeness": 80 },
  "ai_overview": "…|null", "ai_status": "ok|failed|skipped|unconfigured", "ai_error": "…|null",
  "created_at": "iso", "requirements": [
    { "id": "uuid", "position": 0, "identifier": "FR-001", "text": "…", "score": 65,
      "suggested_rewrite": "…|null", "suggestion_source": "rule|ai|null",
      "issues": [
        { "id": "uuid", "detector_id": "vague-quantifier", "category": "Vague quantifiers",
          "severity": "medium", "phrase": "quickly", "start_offset": 41, "end_offset": 48,
          "reason": "…", "recommendation": "…", "ai_explanation": null }
      ] }
  ]
}
```
`AnalysisSummary` = detail minus `requirements[]`, plus `source_excerpt`.

**Stage 07 amendment (shape changes vs the example above):** `status: "analyzed"` is
present (`"segmented"`/`"failed"` remain legal values for future async/document
stages). `score`/`band`/`health` are populated; `score_breakdown` is `{base,
deductions[{issue_id, severity, points}], counts{low, medium, high, critical}}`
— every deducted point links back to its issue id. Each requirement additionally
carries `severity` (worst issue severity, `null` when clean), `issues_count`,
`section`, and a `segmentation` evidence block (`strategy`, `confidence`,
`start/end_offset`, `line_start/line_end`). Nested issues additionally carry
`ai_explanation` (`null` — no provider call produces per-issue explanations
yet); `suggested_rewrite` is `null` until the Stage 14 AI enhancement stamps
one (`suggestion_source: "ai"`; `"rule"` reserved for future rule rewrites). There is NO top-level
`issues` (nested-only — PROJECT_SPEC §7's `issues[]` shorthand materializes
inside each requirement, not beside `requirements[]`) and NO `overall_severity`
(the band already interprets the score). Issue offsets are
**requirement-relative** (index into the requirement's own `text`, not the
source). `requirements_count` always equals `len(requirements)`.

**Stage 09 amendment (report polish):** detail gains a `document` pointer —
`{filename, file_type}` (`file_type` ∈ `pdf | docx | txt`, server-validated)
when `source_type` is `"document"`, `null` for pasted-text analyses. Display
metadata ONLY: no document id, no storage key/path, no binary, ever. The
upload endpoint's analysis-half is byte-identical to `GET /analysis/{id}` for
the same row (asserted in tests). `status: "failed"` rows (never completed)
read back with `score`/`band`/`health` `null`, `score_breakdown` `{}`, and an
empty `requirements[]`; pre-Stage-07 `"segmented"` rows list requirements
without scores. If the linked document row is absent, `document` degrades to
`null` (never a 500, never a filename leak).

**Stage 14 amendment (AI enhancement live — roadmap-18/19/20 slice):**
`options.ai_enhance: true` runs the shared post-commit AI step on TEXT and
upload analyses alike (deterministic row commits FIRST; provider calls run
outside any transaction; the AI outcome lands in one short follow-up txn —
`POST` returns `201` with the deterministic detail whatever AI does).
`ai_status` vocabulary: `skipped` (not requested — no credential read);
`unconfigured` (requested, no ENABLED credential — `ai_error` stays `null`,
it is not an error); `ok` (`ai_overview` + `ai_provider` id + up to 10
`suggested_rewrite`/`"ai"` stamps on requirements WITH issues — originals
immutable); `failed` (attempted — user-safe `ai_error` ≤300 chars,
deterministic scores/issues intact, `ai_overview`/`ai_provider` null).
Chain: default → fallbacks in rank order, max 3 attempts, failover on
overview failure only (improvements are best-effort on the winning
provider — attribution never mixes). Stored credentials WITHOUT an
adapter yet (anthropic, huggingface — deferred, AI_PROVIDER_SPEC §4)
report `failed` with "<Label> integration isn't available yet." (a key IS
stored, so `unconfigured` would lie). `POST /analysis/{id}/retry-ai` stays
future (no Retry button ships until it exists).

**Scoring (deterministic — PROJECT_SPEC §6):** base 100; Low −5, Medium −10,
High −15, Critical −20; requirement score clamped 0–100; analysis score =
arithmetic mean of requirement scores (half-up rounding); bands 80–100 low ·
60–79 moderate · 40–59 high · 0–39 very_high. Health dimensions are the same
deductions partitioned, with each detector feeding exactly one dimension:
`measurability` ← subjective-term, missing-measurable-criteria;
`specificity` ← vague-quantifier, undefined-terminology, absolute-language;
`clarity` ← pronoun-reference, ambiguous-operator, optional-language,
passive-actor; `completeness` ← missing-constraint, incomplete-requirement.
No hidden weighting exists anywhere. Same text + same code version ⇒
identical scores, severities, offsets, and health (modulo generated ids).

**Detector registry (fixed severities; pattern-level detail in code):**

| `detector_id` | category | severity |
|---|---|---|
| `vague-quantifier` | Vague quantifiers | medium |
| `subjective-term` | Subjective terms | medium |
| `missing-measurable-criteria` | Missing measurable criteria | high |
| `optional-language` | Optional language | low |
| `pronoun-reference` | Pronoun references | medium (low for bare demonstratives) |
| `ambiguous-operator` | Ambiguous operators | high multiword (`and/or`, `etc.`); low bare `or` / `as well as` |
| `undefined-terminology` | Undefined terminology | low |
| `absolute-language` | Absolute language | medium strong (`always`, `never`…); low bare `any`/`all` |
| `passive-actor` | Passive voice / unclear actor | medium |
| `missing-constraint` | Missing constraints | high |
| `incomplete-requirement` | Incomplete requirements | critical dangling modal / placeholder; high fragment |

Dedup: exact duplicates (same detector + span) collapse; identical spans from
different detectors collapse to the higher severity (registry order breaks
ties); overlapping-but-distinct spans are KEPT (e.g. `quickly` is vague AND
`respond quickly` is untestable — two genuine concerns).

**Honest limits (false positives are EXPECTED — the UI says so):** the detectors
are lexical heuristics with no semantic understanding. They cannot tell a precise
domain term from jargon (`undefined-terminology`), a deliberate choice from
hedging (`optional-language`), or an idiom from a hedge (`could` is exempted only
in known-safe frames like `could not`). Severity reflects pattern fixity, not
measured impact — a HIGH is "this pattern usually needs a rewrite", never "this
requirement is 15 points worse" in any validated sense. Scores are ranking /
triage aids inside one analysis, not comparable quality measurements across
documents, teams, or tool versions.

**GET /analysis (list):** `§3` paging (`page` ≥ 1, `page_size` 1–100, default
20) + `sort` ∈ `created_at | -created_at | score | -score` (default
`-created_at`) + `band` ∈ `low | moderate | high | very_high` and `source_type`
∈ `text | document` filters; unknown params ignored; misuse → `400
validation_error`. Returns `Collection<AnalysisSummary>` (summary = detail
minus `requirements[]`, plus `source_excerpt`).

**GET /analysis/{id} and DELETE /analysis/{id}:** both resolve the id ONLY
within the caller's analyses — missing AND foreign ids return identical `404
analysis_not_found` (no existence oracle, §5 IDOR rule). GET returns the full
detail; DELETE removes the analysis with requirements + issues cascading
(verified by row-count, not just status) and returns `204` with no body. GETs
are identity-authed only; DELETE additionally requires the CSRF double-submit
(like every state-changing route). Malformed ids (non-UUID) fail closed with
`400 validation_error` — the report UI maps them to the same not-found panel
as a 404, so no existence signal leaks through copy or status.

### 4.4 Documents — Stage 08 ✅ (upload+analyze + metadata read)

(As-built: absorbs roadmap-09 EXCEPT signed-URL downloads and the document
list/delete-by-id endpoints, which stay future; absorbs roadmap-10 fully.)

```
POST /documents/upload   multipart (EXACTLY 1 file, each ≤10 MB; pdf/docx/txt only)
                         → 201 {document: Document, analysis: AnalysisDetail}
GET  /documents/{id}     own metadata → 200 Document | 404 document_not_found
```

`Document`: `{id, filename, file_type, mime_type, byte_size, sha256,
extracted_chars, extraction_status, created_at}`. `mime_type` is the
server-DETECTED canonical MIME (never the client claim); `extraction_status`
is `ok` on every Stage 08 row (`pending`/`failed` are future async states).
The storage key and the binary are NEVER exposed; downloads (if added later)
use short-lived signed URLs.

Request parts: `files` (exactly one; more → `400 too_many_files` with
`{max_files: 1}` — extra parts are rejected, never silently dropped) +
optional `title` form field (≤200 chars; blank/missing falls back to the
sanitized filename) + optional `ai_enhance` form field (`true`/`false`,
default `false` — Stage 14: opts the shared post-commit AI step in, same
vocabulary as the text path). Verified-user + CSRF guarded with its own
10/min per-user bucket.

Validation pipeline (all 4xx, nothing persisted on rejection): streamed byte
budget on the TRUE count → filename sanitization (traversal, absolute
paths, drive letters, and control characters NEUTRALIZED — rejects only when
nothing usable remains or >255 chars) → extension ∈ pdf/docx/txt → declared
MIME must agree (exact match or generic `application/octet-stream`) → magic
bytes (PDF `%PDF-` header with BOM/whitespace tolerance; DOCX ZIP
local-file header) → format structure (OOXML required members
`[Content_Types].xml` + `word/document.xml`; TXT NUL sniff rejects renamed
binaries). Empty files → `400 empty_file`; over-budget bytes → `400
file_too_large` (`{reason: "byte_size"}`).

Extraction (bounded, worker thread + 60 s timeout → `503
document_processing_timeout`, temp always cleaned): PDF via pypdf (≤500
pages, else `400 file_too_large` `{reason: "pdf_pages"}`; pages join with
blank lines); DOCX via python-docx (≤2000 members / ≤50 MB inflated, else
`400 file_too_large`; TRUE document order incl. headings; table rows join
cells with ` | `); TXT via utf-8-sig → windows-1252 → latin-1 (total — never
discards bytes; CRLF/CR normalized; NUL stripped everywhere for Postgres).
Output budget 200 000 chars enforced DURING accumulation → `400
extracted_text_too_large` (never silent truncation). Unreadable-but-
correctly-typed files → `422 extraction_failed` (parser internals stay
server-side); parsed-but-textless (image-only PDF, empty DOCX/TXT) → `422
no_extractable_text` — OCR does not exist and the copy says what IS
supported, never implying otherwise.

The extracted text flows into the SAME segmentation + detection + scoring
pipeline as pasted text (equivalence guarantee: identical text ⇒ identical
requirements/issues/scores/health, asserted in tests); persist is one
transaction (document row + FULL analysis graph with `source_type:
"document"`). Normal segmentation budgets still apply — an upload yielding
zero requirements is `400 no_requirements_detected`, never an empty analysis.

Reads/deletes: `GET /documents/{id}` is owner-scoped (foreign ids 404
identically — no oracle) and returns metadata byte-identical to the upload
response half. `DELETE /analysis/{id}` on a document analysis ALSO purges
the now-orphaned document (row + storage object, verified by row-count +
storage-empty, not just status). There is deliberately NO document
list/delete-by-id/download endpoint yet (future stages); `document_id` on
POST /analysis is still `400 document_analysis_unavailable`.

New codes: `unsupported_file_type`, `invalid_filename`, `empty_file`,
`file_too_large` (`{reason, limit}`), `extracted_text_too_large`
(`{max_chars}`), `too_many_files` (`{max_files}`), `extraction_failed`,
`no_extractable_text`, `document_processing_timeout`, `document_not_found`.

### 4.5 Dashboard — Stage 11 ✅ (as-built; absorbs planned Stage 14–15)

**Stage 11 amendment (transport consolidation):** the planned five endpoints
collapsed into ONE aggregate snapshot — one round trip, one deterministic
snapshot, no N+1. The metric vocabulary is unchanged (totals, average score,
band/source/category/severity distributions, trend + activity buckets, recent
summaries); only the transport differs from the original five-endpoint plan
(`/stats`, `/categories`, `/trends`, `/severity`, `/activity`).

```
GET /dashboard?range=30d|12w → 200 DashboardSnapshot (verified users only)
```

**Request:** `range` ∈ `30d` (default) | `12w`. Unknown params ignored; a bad
`range` → `400 validation_error`. No `user_id` param exists — the snapshot
always describes the caller.

**Response shape:**
```json
{
  "range": "30d",
  "stats": {
    "analyses_total": 12, "analyses_scored": 10,
    "requirements_total": 96, "issues_total": 41,
    "avg_score": 76.5,
    "latest": {"id": "uuid", "title": "…", "score": 82, "band": "low",
               "created_at": "iso"},
    "high_risk_count": 2, "improved_count": 4,
    "top_category": {"category": "Vague quantifiers", "count": 11}
  },
  "bands": [{"band": "low", "count": 5}],
  "sources": [{"source_type": "text", "count": 9}],
  "categories": [{"category": "Vague quantifiers", "count": 11}],
  "severity": [{"severity": "medium", "count": 20}],
  "trend": [{"bucket": "2026-09-01", "avg_score": 76.5, "analyses": 2,
             "requirements": 9}],
  "recent": ["…up to 5 AnalysisSummary, newest first…"]
}
```

**Ownership:** every aggregate filters the caller's `owner_id` (analyses,
denormalized issue ownership, document join for recent summaries). No
`owner_id` / `user_id` appears anywhere in the response. IDOR-style probing
is impossible — there is no target selector to tamper with.

**Empty history:** `200` (never 404) — zeros, `[]` categories / recent,
`avg_score` / `latest` / `top_category` null, all-four bands/severities and
both sources at zero, and a zero-filled trend window.

**Time semantics:** buckets are UTC calendar days (`30d`: 30 trailing days
ending today) or Monday-start UTC weeks (`12w`: 12 trailing weeks ending this
week); `bucket` is `YYYY-MM-DD` (the day, or the week's Monday). The window
is ALWAYS zero-filled — every bucket present, empty ones carrying
`analyses: 0, requirements: 0, avg_score: null`. Totals (`stats`) are
all-time; only `trend` is windowed.

**Scored-vs-unscored participation (locked by tests):** `failed`/legacy
unscored runs count toward `analyses_total`, trend-bucket `analyses`, and
`requirements_total`, but NEVER toward `avg_score` (bucket or overall),
`bands`, `improved_count`, or `high_risk_count`. `latest` is the newest run
overall — its `score`/`band` may be null. `avg_score` rounds half-up to 1
decimal (score-scale convention). `improved_count` = scored runs
(oldest-first) scoring STRICTLY above the preceding scored run — a neutral
count, not a verdict. `high_risk_count` = scored runs with persisted band
`high`/`very_high`. `top_category` = highest count, ties broken
alphabetically; `categories` lists non-zero categories only (the fixed
11-detector vocabulary needs no top-N cut), count desc.

**Errors:** `401 unauthenticated` (no/expired session) / `403
email_unverified` (unverified accounts can't read aggregates) / `400
validation_error` (bad `range`) / `5xx` generic. No paged envelope — the
snapshot is bounded by construction (fixed vocabularies + zero-filled window
+ 5 recents).

### 4.6 AI providers — Stage 12 (as-built: vault CRUD + test; adapters Stage 18)

```
GET    /ai/providers                 → [{id,provider,label,masked_key,is_enabled,is_default,fallback_rank,key_version,last_tested_at,last_test_status}] (bare array: registry order → enabled-first → oldest)
POST   /ai/providers                 {provider,label?,api_key} → 201 (same shape; always enabled, never default; key NEVER returned)
POST   /ai/providers/{id}/test       → 200 {ok, models, latency_ms, error?} (a failed check is data, not an error; dedicated 10/min bucket)
PATCH  /ai/providers/{id}            {label?,is_enabled?,is_default?,fallback_rank?} → 200 (contradictions / default-on-disabled → 409; disabling the default auto-clears it)
POST   /ai/providers/{id}/rotate-key {api_key} → 200 (new ciphertext + fingerprint; test verdict cleared — the new key is unproven)
DELETE /ai/providers/{id}            → 204 (ciphertext row deleted; nothing retained)
GET    /ai/providers/models          → DEFERRED to Stage 18 (ships with the adapters)
```
Plaintext keys appear ONLY in inbound `POST`/`rotate-key` bodies (opaque, edge-trimmed,
4–2000 chars), are Fernet-encrypted immediately, and MUST never appear in any response,
log, or error. Responses are allowlist-serialized metadata: `masked_key` = 12 bullets +
last4 is the ONLY key-derived value that ever leaves the server.

**Stage 12 rules (all asserted in tests):** creation is SHAPE-only (no live key proof —
adapters land in Stage 18); one ENABLED credential per (owner, provider); each key
fingerprint (`sha256(key)[0:16]`) unique per (owner, provider); exactly one default per
owner (a claim moves it in the same transaction); labels strip with blank→None; unknown
providers fail as `400 validation_error` via the request vocabulary. Until adapters ship,
every TEST deterministically returns `200 {ok:false}` with an unavailable message and
leaves `last_test_*` untouched. **Errors:** `401 unauthenticated` / `403
email_unverified` / `400 validation_error` (shape, unknown provider, malformed id) /
`404 ai_provider_not_found` (missing AND foreign ids identical — no oracle) / `409
conflict` (enabled/fingerprint dup, contradictory PATCH, occupied re-enable) / `429
rate_limited` (test bucket only) / `500 internal_error` (vault unconfigured or ciphertext
tampered — generic message, never vault internals). `provider_error` / `ai_unavailable`
stay RESERVED for live-provider failures (Stage 18+).

### 4.7 Settings / privacy — Stage 16/23

```
GET/PATCH /settings/profile    {display_name?…} (minimal; email change NOT in v1 — doc if added)
GET/PATCH /settings/privacy    {history_retention_days|null, …}
POST /privacy/export           → 202 {export_id} then GET /privacy/export/{id} (signed, expiring)
POST /privacy/purge-history    {older_than_days?} → 200 {deleted_analyses:n}
```
Exact fields finalized in Stage 16; names above are reserved.

## 5. Conventions

- Timestamps: ISO-8601 UTC (`…Z`). UUIDs: lowercase strings. Scores: ints 0–100.
- `sort`/`page` misuse → `400 validation_error`, never 500.
- IDOR rule: any `{id}` is resolved ONLY within the caller's `owner_id`; cross-user IDs
  return `404` (not 403 — no existence oracle).
- Rate-limit headers on sensitive routes: `RateLimit-Limit/Remaining/Reset` + `Retry-After` on 429.
- OpenAPI: served at `/api/docs` in `local`/`staging`; disabled in `production` (Stage 21).
- Client timeouts: consumers SHOULD apply a default ~30 s timeout per request (the
  reference web client does; long AI/document calls override per call) and surface
  timeouts distinctly from transport failures (`request_timeout` in the web client).
