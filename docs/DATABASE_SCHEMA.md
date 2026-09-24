# Database Schema

> **Status:** IMPLEMENTED Stages 02–07 (Alembic revisions `0001`–`0004`). This file
> describes the ACTUAL schema — models in `backend/app/models/`, DDL in
> `backend/alembic/versions/000*.py` (`alembic check` verifies they match).
> Preferences are PLANNED (Stage 16) — see §3.8.

## 1. Conventions (binding, as implemented)

- Engine: PostgreSQL 16+, Supabase-compatible. **No extensions required** — no `pgcrypto`
  (UUIDs generated client-side), no `citext` (app normalizes email). Runs on any PG 16+.
- Timestamps: `TIMESTAMPTZ` (UTC), `created_at` on every table, `updated_at` on mutable
  tables (`users`, `analyses`, `ai_provider_credentials`) via server default + `onupdate`.
- PKs: `UUID`, Python-generated (`uuid.uuid4()` at insert). Rationale: no extension
  privilege needed, identical behavior on local PG and Supabase. Raw-SQL inserts must
  supply `id` explicitly (the app always inserts via ORM).
- Status vocabularies: `VARCHAR` + named `CHECK` constraints (NOT PostgreSQL enums —
  enums complicate online evolution and Alembic diffs). Python code mirrors values as
  string literals; a shared enum module arrives if/when a second consumer needs it.
- Every user-owned table: `owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`.
  Ownership is enforced in SQL AND in endpoints (never SQL alone).
- Client and server defaults agree on every defaulted column (e.g. Python `default=0`
  plus `server_default="0"`), so ORM objects and raw inserts see the same values.
- Soft-delete: NOT used — deletion is real. Audit rows (if added) never contain
  requirement text or secrets.
- Migrations: Alembic, linear history, one revision per change with `downgrade()`.
  No ad-hoc DDL, no `create_all()` at startup. Destructive changes need a CHANGELOG
  note + data path + STAGE_STATUS warning. Never rename `owner_id`.
- Row Level Security: evaluated and DEFERRED. The backend connects with a single
  service role (which bypasses RLS), so policies would be inert ceremony today.
  Revisit only if per-user DB roles are ever introduced; endpoint ownership checks
  remain the enforcement point regardless.
- Index philosophy: composite indexes on real query paths (owner + time/score/category),
  plain ascending (Postgres backward scans serve `ORDER BY … DESC` equally well —
  no DESC-specific indexes needed). UNIQUE constraints double as lookup indexes.

## 2. Entity map

```
users 1──* analyses 1──* requirements 1──* issues        [IMPLEMENTED]
users 1──* documents 1──* analyses (via analyses.document_id, nullable)
users 1──* ai_provider_credentials                       [IMPLEMENTED]
users 1──* refresh_tokens                                [IMPLEMENTED — Stage 04]
users 1──* email_verification_tokens                     [IMPLEMENTED — Stage 04]
users 1──* password_reset_tokens                         [IMPLEMENTED — Stage 04]
users 1──1 user_preferences / settings                   [PLANNED — Stage 16]
```

## 3. Tables (implemented)

### 3.1 `users` — accounts and future auth anchor

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, client default | |
| `email` | VARCHAR(320) | UNIQUE NOT NULL | App lowercases before persist (§7); UNIQUE ⇒ lookup index |
| `display_name` | VARCHAR(100) | NULL | User-facing name (profile UI, Stage 16) |
| `password_hash` | TEXT | NULL | argon2id hash (✅ Stage 04). NULL reserves a future external IdP; local accounts NOT NULL (app-enforced) |
| `identity_provider` | VARCHAR(32) | NOT NULL DEFAULT `'local'` | Future-IdP hook (OAuth NOT in scope) |
| `external_subject` | TEXT | NULL | Future IdP subject |
| `is_verified` | BOOLEAN | NOT NULL DEFAULT FALSE | Pending/unverified ⇔ FALSE |
| `is_active` | BOOLEAN | NOT NULL DEFAULT TRUE | Disabled ⇔ FALSE; deleted = row gone (hard delete) |
| `last_login_at` | TIMESTAMPTZ | NULL | Set by login (✅ Stage 04) |
| `created_at` / `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

- FKs: none (root). Indexes: `UNIQUE(email)`; partial
  `UNIQUE(identity_provider, external_subject) WHERE external_subject IS NOT NULL`
  (`ix_users_idp_subject`).
- Delete behavior: deleting a user cascades to ALL owned rows (§4).
- Security: no plaintext passwords by construction (hash-only column); email uniqueness
  enforced at the DB, never only in the frontend.

### 3.2 `analyses` — one analysis run

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `owner_id` | UUID | FK users CASCADE, NOT NULL | |
| `document_id` | UUID | FK documents SET NULL, NULL | NULL for pasted-text analyses |
| `title` | VARCHAR(200) | NOT NULL | Auto-derived, user-editable later |
| `source_type` | VARCHAR(16) | NOT NULL, CHECK `text`/`document` | |
| `source_excerpt` | TEXT | NULL | ≤500 chars, app-enforced (history lists) |
| `status` | VARCHAR(16) | NOT NULL, CHECK `segmented`/`analyzed`/`failed` | Added 0003 (Stage 06), widened 0004 (Stage 07): POST persists `analyzed`; `failed` reserved for future async stages |
| `source_text` | TEXT | NULL | Added 0003: normalized input; re-segmentation reproduces identical segments |
| `score` | SMALLINT | NULL until scored, CHECK 0–100 | Relaxed 0003: NULL pre-detection (Stage 06 persists unscored rows) |
| `band` | VARCHAR(16) | NULL until scored, CHECK `low`/`moderate`/`high`/`very_high` | Relaxed 0003: NULL pre-detection |
| `score_breakdown` | JSONB | NOT NULL DEFAULT `'{}'` | Per-issue deductions (explainability); `{}` until Stage 07 |
| `requirements_count` | INT | NOT NULL DEFAULT 0, CHECK ≥ 0 | Denormalized for dashboard speed |
| `issues_count` | INT | NOT NULL DEFAULT 0, CHECK ≥ 0 | Denormalized; 0 until Stage 07 |
| `health` | JSONB | NULL | Supplementary dimensions (populated from Stage 07) |
| `ai_overview` | TEXT | NULL | NULL when unconfigured/failed |
| `ai_provider` | VARCHAR(32) | NULL | Producing provider id |
| `ai_status` | VARCHAR(16) | NOT NULL DEFAULT `'skipped'`, CHECK | `ok`/`failed`/`skipped`/`unconfigured` |
| `ai_error` | VARCHAR(300) | NULL | Redacted, user-safe only |
| `created_at` / `updated_at` | TIMESTAMPTZ | NOT NULL | |

- Indexes: `(owner_id, created_at)` history ordering, `(owner_id, score)` risk sorting,
  `(document_id)` reverse lookup. All ascending (backward scans serve DESC).
- Delete behavior: deleting an analysis cascades to its requirements + issues AND
  purges its orphaned source document — row + storage object (app-level: the DB
  cannot reach object storage). Safe: each document belongs to exactly one
  analysis (uploads always mint a fresh document row; by-id re-analysis is
  still rejected), so the purge never strands another row.
- Ownership: every read/write filters `owner_id`; cross-user ids → 404 (IDOR rule).

### 3.3 `requirements` — segmented requirements in extraction order

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `owner_id` | UUID | FK users CASCADE, NOT NULL | Redundant on purpose: ownership check without joining analyses |
| `analysis_id` | UUID | FK analyses CASCADE, NOT NULL | |
| `position` | INT | NOT NULL | 0-based SRS order; UNIQUE per analysis |
| `identifier` | VARCHAR(32) | NULL | `FR-001`, … when detected (often absent) |
| `section` | VARCHAR(200) | NULL | Added 0003: heading-derived section path (`Scope > Login`) |
| `text` | TEXT | NOT NULL | Full requirement text (SRS content — see §1 + SECURITY_SPEC) |
| `score` | SMALLINT | NULL until scored, CHECK 0–100 | Relaxed 0003: NULL pre-detection |
| `severity` | VARCHAR(16) | NULL, CHECK `low`/`medium`/`high`/`critical` | Worst-of-issues, denormalized; NULL = no issues |
| `issues_count` | INT | NOT NULL DEFAULT 0, CHECK ≥ 0 | Denormalized; 0 until Stage 07 |
| `suggested_rewrite` | TEXT | NULL | Rule template and/or AI improvement (Stage 07+) |
| `suggestion_source` | VARCHAR(16) | NULL, CHECK `rule`/`ai` | Provenance of the rewrite |
| `segmentation` | JSONB | NULL | Added 0003: evidence block (`strategy`, `confidence`, `start_offset`, `end_offset`, `line_start`, `line_end`) |
| `created_at` | TIMESTAMPTZ | NOT NULL | Immutable once analyzed (no `updated_at`) |

- Constraints: `UNIQUE(analysis_id, position)` (doubles as the order-by index).
  Index: `(owner_id, analysis_id)` ownership-scoped fetch.
- Delete behavior: cascade from analyses and users.

### 3.4 `issues` — one ambiguity finding with evidence

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `owner_id` | UUID | FK users CASCADE, NOT NULL | Ownership without joins |
| `requirement_id` | UUID | FK requirements CASCADE, NOT NULL | |
| `analysis_id` | UUID | FK analyses CASCADE, NOT NULL | Denormalized for trend/category queries |
| `detector_id` | VARCHAR(64) | NOT NULL | Stable rule id (`vague-quantifier`) — powers "Why was this flagged?" |
| `category` | VARCHAR(64) | NOT NULL | Human category (`Vague quantifiers`) |
| `severity` | VARCHAR(16) | NOT NULL, CHECK | `low`/`medium`/`high`/`critical` |
| `phrase` | TEXT | NOT NULL | Matched evidence text |
| `start_offset` | INT | NOT NULL, CHECK ≥ 0 | Highlight start in `requirements.text` |
| `end_offset` | INT | NOT NULL, CHECK `> start_offset` | Highlight end |
| `reason` | TEXT | NOT NULL | Why flagged (the "explanation") |
| `recommendation` | TEXT | NOT NULL | How to fix (the "suggestion") |
| `ai_explanation` | TEXT | NULL | Optional AI elaboration |
| `created_at` | TIMESTAMPTZ | NOT NULL | Immutable (no `updated_at`) |

- Indexes: `(analysis_id, severity)` + `(analysis_id, category)` dashboard/report
  rollups, `(requirement_id)` detail fetch, `(owner_id, created_at)` user trends.
- Delete behavior: cascade from requirements, analyses, users.

### 3.5 `documents` — uploaded file METADATA (binaries live in object storage)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `owner_id` | UUID | FK users CASCADE, NOT NULL | |
| `filename` | VARCHAR(255) | NOT NULL | Sanitized display name (never a path) |
| `file_type` | VARCHAR(16) | NOT NULL, CHECK `pdf`/`docx`/`txt` | Added 0005 (Stage 08): VALIDATED type (extension+MIME+magic agreed) |
| `mime_type` | VARCHAR(127) | NOT NULL | Server-DETECTED canonical MIME, never the client claim (Stage 08) |
| `byte_size` | BIGINT | NOT NULL, CHECK ≥ 0 | TRUE streamed count; limit enforced at upload (Stage 08) |
| `sha256` | CHAR(64) | NOT NULL | Integrity + dedupe aid |
| `storage_path` | TEXT | NOT NULL, UNIQUE | Server-generated opaque key; never user input, never exposed |
| `extracted_chars` | INT | NULL, CHECK ≥ 0 | Length of extracted text |
| `extraction_status` | VARCHAR(16) | NOT NULL DEFAULT `'pending'`, CHECK | `pending`/`ok`/`failed` |
| `created_at` | TIMESTAMPTZ | NOT NULL | No `updated_at` (metadata is write-once; status flips are app-level events — a future stage may add `updated_at` if status churn needs tracking) |

- Index: `(owner_id, created_at)` user document lists. `UNIQUE(storage_path)` guards
  key collisions.
- Delete behavior: cascade from users. Schema-level, analyses referencing a
  deleted document keep their rows with `document_id` SET NULL (analysis
  survives doc purge); the storage OBJECT deletion is application-level (§4) —
  the database cannot reach object storage. App-level (Stage 08): deleting an
  analysis purges its orphaned document row + object (nothing references it —
  see §3.2). App-level (Stage 19): `DELETE /documents/{id}` purges the row +
  object directly (analyses survive via `SET NULL`, §3.2).
- Planned: no analysis_id on documents — the link direction is `analyses.document_id`
  (one document, many re-analyses). As of Stage 08 each upload creates exactly
  one analysis — the many side opens when by-id re-analysis ships.

### 3.6 `ai_provider_credentials` — per-user ENCRYPTED keys

**Plaintext MUST NEVER touch this table.** `encrypted_api_key` holds Fernet ciphertext
(`vN:`-prefixed) produced by the backend vault (Stage 17) from `ENCRYPTION_MASTER_KEY`.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `owner_id` | UUID | FK users CASCADE, NOT NULL | |
| `provider` | VARCHAR(32) | NOT NULL, CHECK 6 ids | `gemini`/`groq`/`openai`/`anthropic`/`openrouter`/`huggingface` |
| `label` | VARCHAR(80) | NULL | User-given name |
| `encrypted_api_key` | TEXT | NOT NULL | Fernet token (base64 ASCII ⇒ TEXT, not BYTEA) |
| `key_version` | SMALLINT | NOT NULL DEFAULT 1, CHECK ≥ 1 | Master-key generation (rotation audits) |
| `key_fingerprint` | CHAR(16) | NOT NULL | `sha256(key)[0:16]` — same-key checks without decrypting |
| `last4` | CHAR(4) | NOT NULL | Masked display `••••…7A91` |
| `is_enabled` | BOOLEAN | NOT NULL DEFAULT TRUE | Disable without deleting |
| `is_default` | BOOLEAN | NOT NULL DEFAULT FALSE | Exactly one default per owner (partial unique) |
| `fallback_rank` | SMALLINT | NOT NULL DEFAULT 0, CHECK ≥ 0 | Fallback chain order |
| `last_tested_at` | TIMESTAMPTZ | NULL | |
| `last_test_status` | VARCHAR(16) | NULL, CHECK `ok`/`failed` | |
| `created_at` / `updated_at` | TIMESTAMPTZ | NOT NULL | |

- Constraints: `UNIQUE(owner_id, provider, key_fingerprint)` (no exact dupes);
  partial `UNIQUE(owner_id) WHERE is_default`; partial
  `UNIQUE(owner_id, provider) WHERE is_enabled` (at most one live key per provider —
  disable-then-replace is the rotation path). Index: `(owner_id, fallback_rank)`.
- Delete behavior: cascade from users (provider removal + account deletion).
- Planned: rotation bookkeeping beyond `key_version` (Stage 17 runbook).

### 3.7 Auth-support tables (IMPLEMENTED — Stage 04, revision `0002`)

Every token column stores the `sha256` hex (`CHAR(64)`) of a 256-bit random value —
raw tokens exist ONLY inside emailed links and request bodies, never at rest, never
in logs. Comparison is constant-time (`hmac.compare_digest` over the hash).

**`refresh_tokens`** — rotating sessions with reuse detection:

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, client default | |
| `owner_id` | UUID | FK `users.id` CASCADE NOT NULL | Session owner |
| `token_hash` | CHAR(64) | UNIQUE NOT NULL | `sha256` of the cookie value; UNIQUE ⇒ lookup index |
| `family_id` | UUID | NOT NULL | Rotation lineage (one login chain = one family) |
| `replaced_by_hash` | CHAR(64) | NULL | Set on rotation: distinguishes rotated (theft signal) from logged-out |
| `expires_at` | TIMESTAMPTZ | NOT NULL | 30 d sliding on each rotation |
| `revoked_at` | TIMESTAMPTZ | NULL | Rotation, logout, or family/owner revocation |
| `user_agent` | VARCHAR(255) | NULL | Truncated client string (forensics) |
| `ip_hash` | CHAR(64) | NULL | One-way IP fingerprint (PII minimization) |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | No `updated_at` (rows are append-mostly) |

- Indexes: `ix_refresh_tokens_owner`, `ix_refresh_tokens_family` (theft-response sweep).
- Reuse rule: presenting a token with `replaced_by_hash` set revokes the whole family;
  presenting a revoked-never-replaced token (logout) is a plain rejection.

**`email_verification_tokens`** — single-use verify links (≤24 h):

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, client default | |
| `owner_id` | UUID | FK `users.id` CASCADE NOT NULL | |
| `token_hash` | CHAR(64) | UNIQUE NOT NULL | `sha256` of the link token |
| `expires_at` | TIMESTAMPTZ | NOT NULL | |
| `consumed_at` | TIMESTAMPTZ | NULL | Set on success; consumed rows stay as audit |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

- Index: `ix_email_verification_tokens_owner`. Resend supersedes pending rows (deletes
  unconsumed, keeps consumed audit).

**`password_reset_tokens`** — same shape as verification (≤1 h TTL):

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, client default | |
| `owner_id` | UUID | FK `users.id` CASCADE NOT NULL | |
| `token_hash` | CHAR(64) | UNIQUE NOT NULL | `sha256` of the link token |
| `expires_at` | TIMESTAMPTZ | NOT NULL | |
| `consumed_at` | TIMESTAMPTZ | NULL | Set on success; consumed rows stay as audit |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

- Index: `ix_password_reset_tokens_owner`. Reset consumes + clears pending + revokes
  all owner sessions (logout-everywhere).

### 3.8 `user_preferences` (IMPLEMENTED — Stage 23, revision `0006`)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `owner_id` | UUID | PK, FK users CASCADE | One row per user |
| `history_retention_days` | INTEGER | NULL or CHECK 1..3650 | NULL = no automatic retention rule |
| `created_at` / `updated_at` | TIMESTAMPTZ | NOT NULL | |

- Delete behavior: cascade from users. Preferences are mutable only by the owning
  session through `/settings/privacy`.

## 4. Retention & deletion (IMPLEMENTED — Stage 23)

- `DELETE FROM users` cascades (FK `ON DELETE CASCADE`) to analyses → requirements →
  issues, documents metadata, credentials, user preferences, sessions, refresh tokens,
  email-verification tokens, and password-reset tokens. ORM relationships use
  `passive_deletes=True`: the DATABASE is the enforcement point, never ORM SELECTs.
- Application-level (the DB cannot do these): storage-object deletion
  (`documents.storage_path`) and temp-file cleanup. Account deletion now gathers
  the user's owned document storage refs from trusted DB rows, deletes each object
  through `StorageBackend.delete()`, and only then hard-deletes the user row.
  Missing objects are idempotent no-ops. Storage backend failures abort before DB
  deletion and surface a generic retryable server error; the API must not claim
  success while known owned objects remain. A DB failure after object deletion can
  leave rows that point to already-missing files, which retry/remediation may clean
  because storage deletion is idempotent.
- History purge / retention deletes per-user `analyses` (+ cascades) and now-orphaned
  owned `documents` plus their storage objects. Re-running the same purge is safe.
- Privacy export is generated live from owner-scoped rows and an explicit allowlist;
  it excludes password hashes, refresh/reset/verification/session tokens, AI
  credential plaintext/ciphertext/fingerprints, storage paths, storage credentials,
  signed download tokens, and file bytes.

## 5. Migrations & local workflow (IMPLEMENTED)

- Revisions: `0001` (core schema) + `0002` (auth-token tables) + `0003`
  (Stage 06: `analyses.status`/`source_text`, NULL-until-scored `score`/`band`,
  `requirements.section`/`segmentation`) + `0004` (Stage 07: widen `status`
  CHECK to `segmented|analyzed|failed`) + `0005` (Stage 08:
  `documents.file_type` + CHECK) + `0006` (Stage 23: `user_preferences`).
  Linear history, every revision has `downgrade()` (`0003`'s deletes unscored
  rows — pre-release only).
- DSN resolution (shared by app + Alembic): `DIRECT_DATABASE_URL` preferred (Supabase:
  bypasses the transaction pooler, which cannot run DDL), `DATABASE_URL` fallback.
  `postgresql://`/`postgres://` schemes are coerced to the asyncpg driver; anything
  else is rejected loudly. The DSN is never logged or echoed in errors.
- Commands (from `backend/`, with `DATABASE_URL` set):
  - Apply: `alembic upgrade head` · Status: `alembic current` / `alembic history`
  - Drift check: `alembic check` (models vs migration — must report no operations)
  - New revision: `alembic revision -m "…" --autogenerate` (REVIEW the diff, then edit)
  - Roll back: `alembic downgrade -1` (one step) — destructive resets are NOT the workflow.
  - Fresh database: create empty DB → `alembic upgrade head` (verified in §6 testing).
- Tests: `TEST_DATABASE_URL` (default `postgresql+asyncpg://postgres:postgres@localhost:5432/srs_test`,
  auto-created if the role has CREATEDB); DB tests skip cleanly when unreachable.
- Local options (either works; Docker NOT required):
  - `docker compose up -d db` (Postgres 16, see `docker-compose.yml`), or
  - system PostgreSQL (`apt/brew install postgresql`, `createdb srs_ambiguity`),
  then: set `DATABASE_URL` → `alembic upgrade head` → `uvicorn app.main:app`.

## 6. Index rationale (every index earns its place)

| Index | Serves |
|-------|--------|
| `UNIQUE users(email)` | Auth lookup + uniqueness guarantee |
| `ix_users_idp_subject` (partial unique) | Future IdP subject mapping (NULLs exempt) |
| `ix_analyses_owner_created` | History ordering per user |
| `ix_analyses_owner_score` | Risk sorting per user |
| `ix_analyses_document` | "Analyses of this document" reverse lookup |
| `uq_requirements_analysis_position` | Order-by + duplicate-position guard |
| `ix_requirements_owner_analysis` | Ownership-scoped requirement fetch |
| `ix_issues_analysis_severity/category` | Severity + category rollups |
| `ix_issues_requirement` | Requirement detail fetch |
| `ix_issues_owner_created` | Per-user issue trends |
| `ix_documents_owner_created` | User document lists |
| `uq_documents_storage_path` | Storage-key collision guard |
| `uq_ai_cred_owner_provider_fingerprint` | Exact-duplicate guard |
| `uq_ai_cred_default_per_owner` (partial) | One default per user |
| `uq_ai_cred_enabled_per_provider` (partial) | One live key per user+provider |
| `ix_ai_cred_owner_fallback` | Fallback-chain ordering |
| `UNIQUE refresh_tokens(token_hash)` | Session lookup by cookie value |
| `ix_refresh_tokens_owner` | Owner session sweeps (logout-everywhere) |
| `ix_refresh_tokens_family` | Theft-response family revocation |
| `UNIQUE email_verification_tokens(token_hash)` | Verify-link lookup |
| `ix_email_verification_tokens_owner` | Pending-token supersede |
| `UNIQUE password_reset_tokens(token_hash)` | Reset-link lookup |
| `ix_password_reset_tokens_owner` | Pending-token supersede |

## 7. Stage 25 performance review

No schema migration or new index was added in Stage 25. Existing composite indexes already
serve the contracted owner-scoped history/document ordering, score sorting, dashboard issue
rollups, token lookups, and provider fallback paths. Because PostgreSQL was unavailable in
the sandbox, no `EXPLAIN ANALYZE` claim is made here.

Code-level query changes instead reduce payload and memory pressure:
- history/recent-analysis reads now project only summary response columns and document display
  metadata, deliberately excluding `analyses.source_text` (up to 200 000 chars), AI overview,
  and detail JSON columns;
- dashboard latest-run reads project only id/title/score/band/created_at;
- dashboard `improved_count` is computed with a SQL `lag()` window instead of loading every
  scored analysis score into Python.

## 8. Normalization & vocabulary notes

- Email: stored lowercase; normalization happens app-side before persist (Stage 04
  enforces + tests; DB UNIQUE is the backstop, never the frontend). No `citext`
  dependency by design.
- UUIDs: version 4, client-generated. Unpredictable ids reduce enumeration but are
  NOT authorization — every `{id}` route still checks `owner_id` (404 on foreign).
- Vocabularies (`severity`, `band`, `source_type`, statuses, providers): VARCHAR +
  named CHECKs. Adding a value = new CHECK via migration (cheap, online-safe);
  PG enums were rejected as evolution-hostile.
