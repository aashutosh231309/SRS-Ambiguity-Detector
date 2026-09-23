# Database Schema

> **Status:** PROPOSED in Stage 01. NOT YET IMPLEMENTED — no models, no migrations, no live
> tables. Stage 02 implements this via SQLAlchemy 2.0 models + Alembic migrations.
> If Stage 02 must deviate, it MUST update this file in the same stage.

## 1. Conventions (binding)

- Engine: PostgreSQL 16+. All timestamps `TIMESTAMPTZ`, UTC. PKs: `UUID DEFAULT gen_random_uuid()`.
- Every user-owned table: `owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`,
  plus `created_at`, `updated_at`. Ownership is ALWAYS enforced in SQL AND in endpoints.
- Soft-delete: NOT used for user data (deletion must be real). Audit rows (if added) never
  contain raw requirement text or secrets.
- Migrations: one Alembic revision per schema change, with downgrade. No ad-hoc DDL.
- Supabase Postgres: enable Row Level Security as defense-in-depth (policies mirror
  `owner_id = auth.uid()` mapping); the backend service role remains the enforcement point
  and RLS must never be the ONLY check.

## 2. Entity map

```
users 1──* analyses 1──* requirements 1──* issues
users 1──* documents 1──* analyses (nullable document_id)
users 1──* ai_provider_credentials
users 1──* email_verification_tokens (or unified auth_tokens — Stage 04 decides, update here)
users 1──* password_reset_tokens     (same note)
users 1──* refresh_tokens (hashed, rotating)
users 1──1 user_preferences / settings (as needed, Stage 16)
```

## 3. Tables

### 3.1 `users`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `email` | CITEXT or `VARCHAR(320)` | UNIQUE NOT NULL | Normalize lowercase; uniqueness enforced |
| `password_hash` | TEXT | NULL allowed | NULL reserves future external IdP; local accounts NOT NULL |
| `identity_provider` | VARCHAR(32) | NOT NULL DEFAULT `'local'` | Extensibility hook for future IdP (OAuth NOT in scope now) |
| `external_subject` | TEXT | NULL | Future IdP subject; NULL for local |
| `is_verified` | BOOLEAN | NOT NULL DEFAULT FALSE | Email ownership confirmed |
| `is_active` | BOOLEAN | NOT NULL DEFAULT TRUE | Deactivation flag |
| `created_at` / `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| `last_login_at` | TIMESTAMPTZ | NULL | |

Indexes: `UNIQUE(email)`, `(identity_provider, external_subject)` unique-where-not-null.

### 3.2 `analyses`

One analysis run over pasted text or a document.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `owner_id` | UUID | FK users CASCADE | |
| `document_id` | UUID | FK documents SET NULL, NULL | NULL for pasted-text analyses |
| `title` | VARCHAR(200) | NOT NULL | Auto-derived (first requirement / filename), user-editable later |
| `source_type` | VARCHAR(16) | NOT NULL | `'text'` \| `'document'` |
| `source_excerpt` | TEXT | NULL | Short preview only (≤ 500 chars) for history lists |
| `score` | SMALLINT | NOT NULL | 0–100 deterministic score |
| `band` | VARCHAR(16) | NOT NULL | `low` \| `moderate` \| `high` \| `very_high` |
| `score_breakdown` | JSONB | NOT NULL DEFAULT `'{}'` | `{base, deductions:[{issue_id,severity,points}], …}` — explainability |
| `requirements_count` | INT | NOT NULL DEFAULT 0 | Denormalized for dashboard speed |
| `issues_count` | INT | NOT NULL DEFAULT 0 | Denormalized |
| `health` | JSONB | NULL | Supplementary dimensions (clarity/specificity/…) — Stage 06+ |
| `ai_overview` | TEXT | NULL | Optional AI text; NULL when unconfigured/failed |
| `ai_provider` | VARCHAR(32) | NULL | Which provider produced it |
| `ai_status` | VARCHAR(16) | NOT NULL DEFAULT `'skipped'` | `ok` \| `failed` \| `skipped` \| `unconfigured` |
| `ai_error` | VARCHAR(300) | NULL | Redacted, user-safe error (never raw provider payload) |
| `created_at` / `updated_at` | TIMESTAMPTZ | NOT NULL | |

Indexes: `(owner_id, created_at DESC)`, `(owner_id, score)`, `(document_id)`.

### 3.3 `requirements`

Segmented individual requirements belonging to an analysis.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `owner_id` | UUID | FK users CASCADE | Redundant on purpose: enables ownership check without join |
| `analysis_id` | UUID | FK analyses CASCADE | |
| `position` | INT | NOT NULL | Order within the analysis (0-based) |
| `identifier` | VARCHAR(32) | NULL | `FR-001`, `REQ-12`, … when detected |
| `text` | TEXT | NOT NULL | Full requirement text |
| `score` | SMALLINT | NOT NULL | 0–100 requirement-level score |
| `issues_count` | INT | NOT NULL DEFAULT 0 | Denormalized |
| `suggested_rewrite` | TEXT | NULL | Deterministic template suggestion and/or AI improvement |
| `suggestion_source` | VARCHAR(16) | NULL | `rule` \| `ai` \| NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL | |

Indexes: `(analysis_id, position)`, `(owner_id, analysis_id)`. Constraint: `UNIQUE(analysis_id, position)`.

### 3.4 `issues`

One detected ambiguity finding.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `owner_id` | UUID | FK users CASCADE | Same rationale as above |
| `requirement_id` | UUID | FK requirements CASCADE | |
| `analysis_id` | UUID | FK analyses CASCADE | Denormalized for trend/category queries |
| `detector_id` | VARCHAR(64) | NOT NULL | Stable rule id, e.g. `vague-quantifier`, `passive-voice` |
| `category` | VARCHAR(64) | NOT NULL | Human category, e.g. `Vague quantifiers` |
| `severity` | VARCHAR(16) | NOT NULL | `low` \| `medium` \| `high` \| `critical` |
| `phrase` | TEXT | NOT NULL | Matched evidence text |
| `start_offset` / `end_offset` | INT | NOT NULL | Char offsets into `requirements.text` for highlighting |
| `reason` | TEXT | NOT NULL | Why it was flagged (deterministic) |
| `recommendation` | TEXT | NOT NULL | How to fix it (deterministic template) |
| `ai_explanation` | TEXT | NULL | Optional AI elaboration |
| `created_at` | TIMESTAMPTZ | NOT NULL | |

Indexes: `(analysis_id, severity)`, `(analysis_id, category)`, `(requirement_id)`, `(owner_id, created_at DESC)`.

### 3.5 `documents`

Uploaded source files + extraction metadata. Binaries live in Storage, never in Postgres.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `owner_id` | UUID | FK users CASCADE | |
| `filename` | VARCHAR(255) | NOT NULL | Sanitized display name (never a path) |
| `mime_type` | VARCHAR(127) | NOT NULL | Validated server-side |
| `byte_size` | BIGINT | NOT NULL | Enforced limit (see SECURITY_SPEC) |
| `sha256` | CHAR(64) | NOT NULL | Integrity + dedupe aid |
| `storage_path` | TEXT | NOT NULL | Opaque object key (unpredictable; no user input) |
| `extracted_chars` | INT | NULL | Length of extracted text |
| `extraction_status` | VARCHAR(16) | NOT NULL | `ok` \| `failed` \| `pending` |
| `created_at` | TIMESTAMPTZ | NOT NULL | |

Indexes: `(owner_id, created_at DESC)`, `UNIQUE(storage_path)`.

### 3.6 `ai_provider_credentials`

Encrypted user-owned provider keys. **Plaintext MUST NEVER touch this table.**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `owner_id` | UUID | FK users CASCADE | |
| `provider` | VARCHAR(32) | NOT NULL | `gemini` \| `groq` \| `openai` \| `anthropic` \| `openrouter` \| `huggingface` |
| `label` | VARCHAR(80) | NULL | User-given name |
| `encrypted_key` | BYTEA or TEXT | NOT NULL | Fernet ciphertext (`vN:`-prefixed), see SECURITY_SPEC |
| `key_fingerprint` | CHAR(16) | NOT NULL | `sha256(key)[0:16]` — for "same key?" checks without decrypting |
| `last4` | CHAR(4) | NOT NULL | For masked display `••••…7A91` |
| `is_default` | BOOLEAN | NOT NULL DEFAULT FALSE | Exactly one default per user (partial unique index) |
| `fallback_rank` | SMALLINT | NOT NULL DEFAULT 0 | Ordering for fallback chain |
| `last_tested_at` | TIMESTAMPTZ | NULL | |
| `last_test_status` | VARCHAR(16) | NULL | `ok` \| `failed` \| NULL |
| `created_at` / `updated_at` | TIMESTAMPTZ | NOT NULL | |

Constraints: `UNIQUE(owner_id, provider, key_fingerprint)` (no dupes);
partial `UNIQUE(owner_id) WHERE is_default`. Index: `(owner_id, fallback_rank)`.

### 3.7 Auth-support tables (Stage 04 finalizes; reserved names)

- `refresh_tokens(id, owner_id, token_hash CHAR(64) UNIQUE, expires_at, revoked_at, created_at, user_agent, ip_hash)` — rotation: new token issued, old marked revoked with short grace.
- `email_verification_tokens(id, owner_id, token_hash UNIQUE, expires_at, consumed_at, …)`.
- `password_reset_tokens(id, owner_id, token_hash UNIQUE, expires_at, consumed_at, …)`.
- Token hashes are `sha256(token)`; raw tokens exist ONLY inside the emailed link, never in DB/logs.

## 4. Retention & deletion

- Account deletion (Stage 16/23): `DELETE FROM users WHERE id=…` cascades to all owned rows;
  the same transaction/job deletes Storage objects (`documents.storage_path`) and any temp
  artifacts. Verification: post-delete query MUST return zero rows for that `owner_id`
  across all tables (add a backend test in Stage 23).
- History purge / retention settings operate per-user on `analyses` (+ cascades) and
  orphaned `documents`.

## 5. Migration discipline

- Alembic, linear history, one revision per change with `downgrade()`.
- Destructive migrations (drop/rename) require: (a) deprecation note in CHANGELOG,
  (b) data backfill/migration path, (c) STAGE_STATUS warning. Never rename `owner_id`.
