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

**Standard codes (extend per resource, keep this table current):**

| HTTP | `code` | Meaning |
|------|--------|---------|
| 400 | `bad_request` / `validation_error` | Malformed input / schema failure |
| 401 | `unauthenticated` | Missing/invalid session |
| 403 | `forbidden` / `email_unverified` | Not owner / account not verified |
| 404 | `<resource>_not_found` | e.g. `analysis_not_found` |
| 409 | `conflict` | e.g. duplicate provider key |
| 413 | `payload_too_large` | Text/upload over limits |
| 415 | `unsupported_media_type` | Disallowed file type |
| 422 | `unprocessable_file` | File passed validation but extraction failed |
| 429 | `rate_limited` | With `Retry-After` header |
| 5xx | `internal_error` / `provider_error` / `ai_unavailable` | Never leak internals |

## 3. Pagination / filtering / sorting (collections)

Query params: `page` (≥1, default 1), `page_size` (1–100, default 20),
`sort` (`created_at` | `-created_at` | `score` | `-score`, default `-created_at`),
resource-specific `q` (search), `band`, `category`, `severity`, `source_type`.
Unknown params are ignored (forward-compatible).

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

### 4.2 Auth — Stage 04 (backend) / Stage 05 (frontend)

```
POST /auth/register            {email, password, turnstile_token?} → 201 {id,email,is_verified:false}
POST /auth/verify-email        {token} → 200 {id,email,is_verified:true} (+ sets session cookies)
POST /auth/resend-verification {email} → 202 {} (always 202: no account enumeration)
POST /auth/login               {email, password, turnstile_token?} → 200 {id,email,is_verified} (+ cookies)
POST /auth/logout              → 204 (clears cookies, revokes refresh)
GET  /auth/me                  → 200 {id,email,is_verified,created_at} | 401
POST /auth/forgot-password     {email} → 202 {} (always 202)
POST /auth/reset-password      {token, new_password} → 200 {}
POST /auth/change-password     {current_password, new_password} → 200 {}
DELETE /auth/account           {confirmation:"DELETE"} → 204 (full cascade delete)
```
Validation: email format (server), password ≥ 12 chars (strength guidance client-side only
as hint; server enforces minimum + breach-common list when available).

### 4.3 Analysis — Stage 07 (engine Stage 06)

```
POST /analysis                  Text or document-reference analysis → 201 AnalysisDetail
GET  /analysis                  List own analyses (paginated, §3) → 200 Collection<AnalysisSummary>
GET  /analysis/{id}             Full detail incl. requirements+issues → 200 AnalysisDetail | 404
DELETE /analysis/{id}           Delete own analysis (cascade) → 204 | 404
POST /analysis/{id}/retry-ai    Re-run ONLY the AI enhancement step → 200 {ai_status,…} (Stage 20)
```

**POST /analysis request:**
```json
{ "title": "optional ≤200 chars", "text": "past requirement text…", "document_id": null,
  "options": { "ai_enhance": true } }
```
- Exactly one of `text` / `document_id`. Limits: `text` ≤ 200 000 chars; requirements cap
  enforced after segmentation (excess → `400 text_too_large` with counts).
- `ai_enhance:false` skips AI even if configured (deterministic-only run).

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

### 4.4 Documents — Stage 09/10

```
POST /documents/upload   multipart (≤3 files, each ≤10 MB; pdf/docx/txt only) → 201 [Document]
GET  /documents          list own → Collection<Document>
DELETE /documents/{id}   delete file + storage object → 204
```
`Document`: `{id, filename, mime_type, byte_size, sha256, extracted_chars, extraction_status, created_at}`.
Storage path is NEVER exposed; downloads (if added later) use short-lived signed URLs.

### 4.5 Dashboard — Stage 14

```
GET /dashboard/stats       → {totals:{analyses,requirements,issues}, avg_score, high_risk_count, top_category, improved_count}
GET /dashboard/categories  → [{category,count}] (top N + "Other")
GET /dashboard/trends      → [{bucket:"2026-09-01", avg_score, analyses}] (bucket=day|week, `range` param)
GET /dashboard/severity    → [{severity,count}]
GET /dashboard/activity    → [{bucket, analyses, requirements}]
```
All scoped to the authenticated user. Empty-state: zeros + empty arrays, never 404.

### 4.6 AI providers — Stage 17/18

```
GET    /ai/providers                 → [{id,provider,label,last4(fingerprint display),is_default,fallback_rank,last_tested_at,last_test_status}]
POST   /ai/providers                 {provider,label?,api_key} → 201 (same shape, key NEVER returned)
POST   /ai/providers/{id}/test       → 200 {ok:true, models:[…], latency_ms} | 200 {ok:false, error:"user-safe"}
PATCH  /ai/providers/{id}            {label?,is_default?,fallback_rank?} → 200 (key rotation via dedicated endpoint)
POST   /ai/providers/{id}/rotate-key {api_key} → 200
DELETE /ai/providers/{id}            → 204 (ciphertext row deleted; nothing retained)
GET    /ai/providers/models?provider=gemini → 200 {models:[…]} (best-effort via stored key)
```
Plaintext keys appear ONLY in inbound `POST`/`rotate-key` bodies, are validated + encrypted
immediately, and MUST never appear in any response, log, or error.

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
