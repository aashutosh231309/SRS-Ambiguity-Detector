# Security Specification

> **Status:** BINDING as of Stage 01. Controls marked with a stage are implemented in that
> stage; everything else here constrains HOW later stages build. Security review is part of
> every stage's Definition of Done (`DEVELOPMENT_RULES.md`).

## 1. Threat model (what we defend against)

Broken authN/Z · IDOR / cross-user data leaks · API-key / token / password leakage ·
SQL injection · XSS (stored via requirement text + AI output; reflected via errors) ·
CSRF (cookie auth) · malicious/oversized uploads · request/rate abuse · brute-force /
credential-stuffing · CAPTCHA bypass · prompt injection into AI enhancement + unsafe AI
output rendering · secret leakage (git/logs/errors/analytics) · insecure CORS / open
redirects · sensitive logging · error-info disclosure · dependency/supply-chain compromise.

Out of scope (acknowledged, not solved here): attacker with the user's own device; attacker
with the hosting provider's infrastructure; AI provider-side data handling (users bring
their own keys; we disclose what is sent — see `AI_PROVIDER_SPEC.md` §Privacy).

## 2. Non-negotiable rules

1. **Never trust the client.** Every important check (auth, ownership, validation, limits)
   is enforced server-side. Client validation is UX only.
2. **Ownership on every read/write.** `owner_id` check in the query AND the endpoint;
   cross-user IDs → `404` (no oracle). Add IDOR tests per resource (Stage 07+).
3. **Secrets discipline.** No secrets in: git, `.env.example`, frontend bundles,
   `localStorage`/`sessionStorage`, URLs, logs, errors, Sentry, analytics, API responses.
   Master keys exist ONLY as server env vars.
4. **Fail closed** on auth/crypto/storage decisions; **fail open** ONLY for the optional
   AI enhancement step (core result always returned).
5. **Redacted by default.** Logging + error + Sentry pipelines scrub: `api_key`, `*token*`,
   `password`, `secret`, `authorization`, `cookie`, `email bodies`, raw requirement/SRS text,
   uploaded file bytes. `RedactingFilter` installed in Stage 01; Sentry `before_send`
   scrubber in Stage 24 (blocker for enabling Sentry).

## 3. Authentication & sessions (IMPLEMENTED Stage 04 — backend; UI Stage 05)

- Email + password. Hash: **argon2id** via `argon2-cffi` (env-tunable work factors,
  single hash ≈ 200–500 ms, computed off the event loop). No MD5/SHA/bcrypt-only.
- Verification flow: tokens are 256-bit random, `sha256` at rest, ≤24 h, single-use,
  constant-time compare. Policy: unverified accounts CAN log in (sessions issued),
  but app resources gate on verification per-endpoint (`403 email_unverified`).
- Sessions: short-lived **access JWT (15 min, HS256)** + **rotating refresh (30 d)**;
  both in `HttpOnly; Secure (prod); SameSite=Lax; Path=/` cookies. Refresh reuse of a
  ROTATED token revokes its whole family (theft response, committed before the error
  is raised); logged-out/expired/unknown tokens are plain rejections. No tokens in
  `localStorage`, ever.
- CSRF: `SameSite=Lax` + server-side `Origin` (else `Referer`) allowlist check on every
  mutating route (safe-method `GET /me` exempt); consider double-submit in Stage 21
  if threat review demands it.
- Login hardening (as built): per-endpoint+IP token buckets, single-process exact
  (per-account buckets + distributed store in Stage 22); `turnstile_token`
  accepted-and-ignored until Stage 22; constant-time compare; byte-identical 401s for
  bad-email vs bad-password; no enumeration (synthetic-201 register + always-202
  forgot/resend + dummy-hash uniform timing).
- Password policy: 12–256 chars + common-password denylist + email-local-part rule;
  change requires the current password; reset links ≤1 h, single-use, and trigger
  logout-everywhere; security notices on verify/reset/change/delete.

## 4. API-key vault (provider credentials — Stage 17 implements; design locked here)

- Transport: HTTPS only in staging/prod (HSTS; redirect 80→443 at platform).
- At rest: **Fernet (AES-128-CBC + HMAC-SHA256)**, ciphertext stored as `v1:<token>`.
  Master key = `ENCRYPTION_MASTER_KEY` env (Fernet key, 32 bytes, base64). Rotation:
  introduce `v2`, decrypt-with-old → encrypt-with-new lazily + `key_version` column
  discipline; document rotation runbook in Stage 17.
- In use: decrypt ONLY inside the backend process at call time; key lives in local memory,
  never logged, never attached to exceptions, never returned by any endpoint (only `last4`
  + fingerprint). `GET /ai/providers` response shape is allowlist-serialized.
- Deletion: row delete on provider removal AND account deletion; no soft-delete, no backups
  exemption documented (managed-DB PITR window is disclosed in Privacy UI copy, Stage 23).

## 5. Upload pipeline (IMPLEMENTED Stage 08 — contract: API_CONTRACT §4.4)

| Control | Value |
|---------|-------|
| Allowed types | `.pdf`, `.docx`, `.txt` (extension + declared MIME + magic bytes must agree; else `400 unsupported_file_type`) |
| Per-file size | ≤ 10 MB, streaming-enforced on the TRUE count (`400 file_too_large` `{reason: "byte_size"}` — never the declared size) |
| Files per request | EXACTLY 1 (extras → `400 too_many_files`, never silently dropped) |
| Extracted text | ≤ 200 000 chars, enforced during accumulation (`400 extracted_text_too_large` — no silent truncation) |
| Processing timeout | 60 s validate+extract in a worker thread (`503 document_processing_timeout`; temp file ALWAYS cleaned up) |
| Filename | sanitized display-only (≤255 chars); storage key = server-generated `documents/{owner}/{doc}/source` |
| Binary storage | object storage ONLY (never Postgres); binaries unreadable by key-guessing (UUID path segments) |
| Execution | never execute / never render as HTML; `Content-Disposition: attachment` on any future re-download |
| Malware posture | no embedded AV in v1 — controls are type/size/magic-byte/timeout/isolation; document as known limitation in STAGE_STATUS |

- Staging: `tempfile.mkstemp` (O_EXCL, 0600) + chunk writes off the event loop,
  `unlink` in `finally` (success moves the file into storage first).
  DOCX = zip-bomb guard from ZIP metadata (≤2000 members + ≤50 MB inflated,
  `file_too_large`). PDF = page-count cap (≤500 pages). PDF magic tolerates
  BOM/whitespace prefixes (broken producers exist); genuinely malformed files
  still fail at extraction (`422 extraction_failed`, internals server-side).
- Parsers only READ (pypdf ignores embedded JS/actions; python-docx never
  opens macros/embedded objects); `\\x00` stripped everywhere (Postgres TEXT
  rejects it); logs carry ids + counts only, never file content.
- Storage objects private; any future user download via short-lived signed
  URL (≤15 min). No binaries in Postgres — the DB holds metadata only.

## 6. Input validation & output encoding

- All request bodies validated by Pydantic schemas (length caps, enums, no `Extra.allow`
  on security-sensitive models). Query ints clamped (§API_CONTRACT pagination).
- Stored XSS: requirement text, filenames, AI text are UNTRUSTED. Frontend renders via
  React escaping by default; highlight rendering (marking ambiguous phrases) MUST build
  ranges from offsets programmatically — never `dangerouslySetInnerHTML` on raw text.
  Markdown from AI (if any) → sanitized renderer (allowlist tags, no raw HTML) in Stage 19.
- SQLi: SQLAlchemy parameterized queries ONLY; no f-string SQL; `text()` with bound params
  only. Dependency: keep `asyncpg`/SQLAlchemy patched.
- Open redirects: no `?next=`/return-URL params; post-login landing is a fixed allowlist
  (Stage 05). CORS: exact-origin allowlist from env, no `*` with credentials, no reflected origins.

## 7. Rate limiting & anti-bot (Stage 22; contract now)

Sensitive ops (register, login, verify-resend, forgot/reset, analysis, upload, AI test,
AI retry) get server-side limits (token-bucket per IP + per-user where authed),
configurable via env (`RATE_LIMIT_*`), returning `429` + `Retry-After`. Turnstile
(server-verified) on register + suspicious login + reset + public endpoints if ever exposed.
Frontend throttling is cosmetic only. Live since Stage 06: `POST /analysis` is
per-user bucketed (`RATE_LIMIT_ANALYSIS_PER_MINUTE`, default 20/min) inside the
verified-user guard — anonymous callers never reach the bucket (401 first).

## 8. Headers & transport (foundation in Stage 01, hardened Stage 21)

- `Strict-Transport-Security` (prod), `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geo off).
- Framing: `frame-ancestors 'none'` (+ `X-Frame-Options: DENY` legacy) — applied ONLY when
  `APP_ENV=production` so sandboxed/preview iframes keep working in dev (see `next.config.ts`).
- CSP: introduced in Stage 21 (report-only first), must allow Next inline runtime + charts;
  `object-src 'none'`, `base-uri 'self'`, no `unsafe-inline` beyond Next's nonce strategy.

## 9. Cryptography inventory

| Use | Primitive | Notes |
|-----|-----------|-------|
| Passwords | argon2id | ✅ Stage 04 |
| Provider keys at rest | Fernet (`ENCRYPTION_MASTER_KEY`) | Stage 17 |
| Session signing | JWT HS256 with 256-bit server secret (separate from master key) | ✅ Stage 04 |
| Token storage | sha256 hash of 256-bit random tokens | ✅ Stage 04 |
| Checksums | sha256 of uploads (streamed during staging, stored per document) | Stage 08 ✅ |

## 10. Dependency & secret hygiene

- Pinned versions (`package-lock.json`, `requirements*.txt`); `npm audit` + `pip-audit`
  (or `osv-scanner`) in `scripts/verify.sh` from Stage 21 (warn-only before).
- `.env` files git-ignored; `.env.example` contains ONLY placeholders (`changeme…`, never
  real-looking keys). Pre-commit secret scan recommended (documented Stage 21).
- Sentry scrubbing (Stage 24) is a RELEASE BLOCKER: no DSN enabled until `before_send`
  redaction + PII flags are tested.

## 11. Security review checklist (every stage touching auth/data/crypto/upload/AI)

- [ ] Ownership checks + IDOR tests for new `{id}` routes
- [ ] Schemas cap lengths; errors use envelope with safe messages
- [ ] No new secret/token/log exposure (`grep` for `console.log`, `print(`, f-string SQL)
- [ ] Rate limit considered for new expensive endpoint
- [ ] STAGE_STATUS "Security notes" updated

## 12. Database security (IMPLEMENTED Stage 02 — schema layer)

- **Ownership:** every user-owned row carries `owner_id` (FK `users.id`, CASCADE).
  Endpoints MUST filter by it; cross-user ids return 404 (no existence oracle).
  IDOR tests are required per `{id}` route from the first route that serves one.
- **Foreign keys:** integrity at the DB, not just the app — orphans are unrepresentable
  (`owner_id` NOT NULL everywhere; redundant `owner_id` on requirements/issues is
  intentional for join-free ownership checks).
- **UUIDs ≠ authorization:** unpredictable ids reduce enumeration only; checks still apply.
- **Credential encryption:** `ai_provider_credentials.encrypted_api_key` holds Fernet
  ciphertext (`vN:`-prefixed) — never plaintext. Vault + rotation land in Stage 17;
  `key_version` already supports rotation audits. `ENCRYPTION_MASTER_KEY` is env-only.
- **Password hashing:** `users.password_hash` holds argon2id hashes (✅ Stage 04) — the
  column shape (nullable TEXT) reserves NULL for a future external IdP only.
- **Sensitive text:** requirement/SRS text lives in `requirements.text` /
  `issues.phrase` — real user content. NEVER logged, never in Sentry, never in error
  details; length caps enforced app-side (limits finalized in analysis/upload stages).
- **Database credentials:** `DATABASE_URL`/`DIRECT_DATABASE_URL` from env only. The DSN
  is never logged, returned, or echoed in errors (parse-error chains suppressed);
  `/ready` reports `ok`/`error`/`not_configured` with zero connection detail.
- **Least privilege:** production guidance — dedicated app role (no superuser,
  no CREATEDB/CREATEROLE); migrations run with a separate elevated role or job.
  The test suite auto-creates its scratch DB and therefore needs CREATEDB locally only.
- **Deletion:** account cleanup = FK cascades (DB) + storage-object purge (app).
  `documents.storage_path` deletion is application-level — the DB cannot reach object
  storage. Stage 23 adds the zero-rows verification test.
- **Migration safety:** DDL is reviewed, transactional (`alembic upgrade` runs in a
  transaction), and reproducible (`alembic check` in the workflow); destructive
  changes need backup + CHANGELOG + STAGE_STATUS treatment.
- **Error sanitization:** `AppError` messages are user-safe by construction;
  `SQLAlchemyError` and unhandled exceptions map to `500 internal_error` with
  server-side-only logging (no SQL/DSN/traces in responses — tested).
- **Access log:** method + path (never query params) + status + latency, correlated
  via `X-Request-ID`; `Referrer-Policy` aligned to §8
  (`strict-origin-when-cross-origin`).
