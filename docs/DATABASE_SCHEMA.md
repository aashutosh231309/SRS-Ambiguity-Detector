# Database Schema

> **Status:** IMPLEMENTED in Stage 02 (Alembic revision `0001`). This file describes the
> ACTUAL schema — models in `backend/app/models/`, DDL in
> `backend/alembic/versions/0001_initial_schema.py` (`alembic check` verifies they match).
> Auth-token tables and preferences are PLANNED (Stage 04 / Stage 16) — see §3.7.

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
users 1──* refresh_tokens                                [PLANNED — Stage 04]
users 1──* email_verification_tokens                     [PLANNED — Stage 04]
users 1──* password_reset_tokens                         [PLANNED — Stage 04]
users 1──1 user_preferences / settings                   [PLANNED — Stage 16]
```

## 3. Tables (implemented)

### 3.1 `users` — accounts and future auth anchor

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, client default | |
| `email` | VARCHAR(320) | UNIQUE NOT NULL | App lowercases before persist (§7); UNIQUE ⇒ lookup index |
| `display_name` | VARCHAR(100) | NULL | User-facing name (profile UI, Stage 16) |
| `password_hash` | TEXT | NULL | argon2id hash (Stage 04). NULL reserves a future external IdP; local accounts NOT NULL (app-enforced) |
| `identity_provider` | VARCHAR(32) | NOT NULL DEFAULT `'local'` | Future-IdP hook (OAuth NOT in scope) |
| `external_subject` | TEXT | NULL | Future IdP subject |
| `is_verified` | BOOLEAN | NOT NULL DEFAULT FALSE | Pending/unverified ⇔ FALSE |
| `is_active` | BOOLEAN | NOT NULL DEFAULT TRUE | Disabled ⇔ FALSE; deleted = row gone (hard delete) |
| `last_login_at` | TIMESTAMPTZ | NULL | Set by login (Stage 04) |
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
| `score` | SMALLINT | NOT NULL, CHECK 0–100 | Deterministic score |
| `band` | VARCHAR(16) | NOT NULL, CHECK `low`/`moderate`/`high`/`very_high` | |
| `score_breakdown` | JSONB | NOT NULL DEFAULT `'{}'` | Per-issue deductions (explainability) |
| `requirements_count` | INT | NOT NULL DEFAULT 0, CHECK ≥ 0 | Denormalized for dashboard speed |
| `issues_count` | INT | NOT NULL DEFAULT 0, CHECK ≥ 0 | Denormalized |
| `health` | JSONB | NULL | Supplementary dimensions (Stage 06+) |
| `ai_overview` | TEXT | NULL | NULL when unconfigured/failed |
| `ai_provider` | VARCHAR(32) | NULL | Producing provider id |
| `ai_status` | VARCHAR(16) | NOT NULL DEFAULT `'skipped'`, CHECK | `ok`/`failed`/`skipped`/`unconfigured` |
| `ai_error` | VARCHAR(300) | NULL | Redacted, user-safe only |
| `created_at` / `updated_at` | TIMESTAMPTZ | NOT NULL | |

- Indexes: `(owner_id, created_at)` history ordering, `(owner_id, score)` risk sorting,
  `(document_id)` reverse lookup. All ascending (backward scans serve DESC).
- Delete behavior: deleting an analysis cascades to its requirements + issues; the
  source document is NOT deleted (documents outlive analyses; purge is app-level).
- Ownership: every read/write filters `owner_id`; cross-user ids → 404 (IDOR rule).

### 3.3 `requirements` — segmented requirements in extraction order

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `owner_id` | UUID | FK users CASCADE, NOT NULL | Redundant on purpose: ownership check without joining analyses |
| `analysis_id` | UUID | FK analyses CASCADE, NOT NULL | |
| `position` | INT | NOT NULL | 0-based SRS order; UNIQUE per analysis |
| `identifier` | VARCHAR(32) | NULL | `FR-001`, … when detected (often absent) |
| `text` | TEXT | NOT NULL | Full requirement text (SRS content — see §1 + SECURITY_SPEC) |
| `score` | SMALLINT | NOT NULL, CHECK 0–100 | Requirement-level score |
| `severity` | VARCHAR(16) | NULL, CHECK `low`/`medium`/`high`/`critical` | Worst-of-issues, denormalized; NULL = no issues |
| `issues_count` | INT | NOT NULL DEFAULT 0, CHECK ≥ 0 | Denormalized |
| `suggested_rewrite` | TEXT | NULL | Rule template and/or AI improvement |
| `suggestion_source` | VARCHAR(16) | NULL, CHECK `rule`/`ai` | Provenance of the rewrite |
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
| `mime_type` | VARCHAR(127) | NOT NULL | Server-validated (Stage 09) |
| `byte_size` | BIGINT | NOT NULL, CHECK ≥ 0 | Limit enforced at upload (Stage 09) |
| `sha256` | CHAR(64) | NOT NULL | Integrity + dedupe aid |
| `storage_path` | TEXT | NOT NULL, UNIQUE | Server-generated opaque key; never user input, never exposed |
| `extracted_chars` | INT | NULL, CHECK ≥ 0 | Length of extracted text |
| `extraction_status` | VARCHAR(16) | NOT NULL DEFAULT `'pending'`, CHECK | `pending`/`ok`/`failed` |
| `created_at` | TIMESTAMPTZ | NOT NULL | No `updated_at` (metadata is write-once; status flips are app-level events — a future stage may add `updated_at` if status churn needs tracking) |

- Index: `(owner_id, created_at)` user document lists. `UNIQUE(storage_path)` guards
  key collisions.
- Delete behavior: cascade from users. Analyses referencing a deleted document keep
  their rows with `document_id` SET NULL (analysis survives doc purge); the storage
  OBJECT deletion is application-level (§4) — the database cannot reach object storage.
- Planned: no analysis_id on documents — the link direction is `analyses.document_id`
  (one document, many re-analyses).

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

### 3.7 Auth-support tables (PLANNED — Stage 04 finalizes, reserved names)

- `refresh_tokens(id, owner_id, token_hash CHAR(64) UNIQUE, expires_at, revoked_at, created_at, user_agent, ip_hash)` — rotation with reuse detection.
- `email_verification_tokens(id, owner_id, token_hash UNIQUE, expires_at, consumed_at, …)`.
- `password_reset_tokens(id, owner_id, token_hash UNIQUE, expires_at, consumed_at, …)`.
- Token hashes are `sha256(token)`; raw tokens exist ONLY inside emailed links.

## 4. Retention & deletion (schema support: IMPLEMENTED; workflows: later stages)

- `DELETE FROM users` cascades (FK `ON DELETE CASCADE`) to analyses → requirements →
  issues, documents metadata, and credentials. ORM relationships use
  `passive_deletes=True`: the DATABASE is the enforcement point, never ORM SELECTs.
- Application-level (the DB cannot do these): storage-object deletion
  (`documents.storage_path`), temp-file cleanup. Account deletion (Stage 16/23) runs
  DB delete + storage purge in one workflow, then verifies zero rows per `owner_id`
  (verification test in Stage 23).
- History purge / retention (Stage 23) deletes per-user `analyses` (+ cascades) and
  orphaned `documents`.

## 5. Migrations & local workflow (IMPLEMENTED)

- Revisions: `0001` (this schema). Linear history, every revision has `downgrade()`.
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

## 7. Normalization & vocabulary notes

- Email: stored lowercase; normalization happens app-side before persist (Stage 04
  enforces + tests; DB UNIQUE is the backstop, never the frontend). No `citext`
  dependency by design.
- UUIDs: version 4, client-generated. Unpredictable ids reduce enumeration but are
  NOT authorization — every `{id}` route still checks `owner_id` (404 on foreign).
- Vocabularies (`severity`, `band`, `source_type`, statuses, providers): VARCHAR +
  named CHECKs. Adding a value = new CHECK via migration (cheap, online-safe);
  PG enums were rejected as evolution-hostile.
