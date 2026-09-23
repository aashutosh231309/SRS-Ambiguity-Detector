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

## 3. Authentication & sessions (Stage 04 implements; design locked here)

- Email + password. Hash: **argon2id** (via `pwdlib[argon2]` or `argon2-cffi`); parameters
  tuned so single-hash ≈ 200–500 ms on prod hardware. No MD5/SHA/bcrypt-only downgrades.
- Email verification REQUIRED before full access (pending → verified flow; tokens:
  256-bit random, `sha256` stored, ≤24 h expiry, single-use, constant-time compare).
- Sessions: short-lived **access JWT (15 min)** + **rotating refresh token (30 d, reuse
  detection → revoke chain)**; both in `HttpOnly; Secure (prod); SameSite=Lax; Path=/`
  cookies. No tokens in `localStorage`, ever.
- CSRF: `SameSite=Lax` + server-side `Origin`/`Referer` allowlist check on mutating routes;
  consider double-submit token in Stage 21 if threat review demands it.
- Login hardening: per-IP + per-account rate limits (Stage 22), Turnstile after N failures,
  constant-time password compare, identical responses for bad-email vs bad-password,
  no account enumeration on register/forgot/resend (always-202 + uniform timing posture).
- Password policy: ≥12 chars server-side; change requires current password; reset links
  ≤1 h, single-use; security notification emails on reset/verify/delete (Stage 04+).

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

## 5. Upload pipeline (Stage 09 implements; limits locked here)

| Control | Value |
|---------|-------|
| Allowed types | `.pdf`, `.docx`, `.txt` (extension + declared MIME + magic bytes must agree) |
| Per-file size | ≤ 10 MB (reject `413` before buffering to disk beyond limit) |
| Files per request | ≤ 3 |
| Extracted text | ≤ 200 000 chars (reject `413`, no partial silent truncation) |
| Processing timeout | 60 s per file (worker timeout; temp file ALWAYS cleaned up) |
| Filename | sanitized display-only; storage key = server-generated UUID path |
| Execution | never execute / never render as HTML; `Content-Disposition: attachment` on any re-download |
| Malware posture | no embedded AV in v1 — controls are type/size/magic-byte/timeout/isolation; document as known limitation in STAGE_STATUS |

- `python-multipart` limits + streaming writes to `tempfile` (O_EXCL, 0600), cleanup in
  `finally`. DOCX = zip-bomb guard (member count + inflated-size caps). PDF = page-count cap.
- Storage objects private; any user download via short-lived signed URL (≤15 min).

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
Frontend throttling is cosmetic only.

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
| Passwords | argon2id | Stage 04 |
| Provider keys at rest | Fernet (`ENCRYPTION_MASTER_KEY`) | Stage 17 |
| Session signing | JWT HS256 with 256-bit server secret (separate from master key) | Stage 04 |
| Token storage | sha256 hash of 256-bit random tokens | Stage 04 |
| Checksums | sha256 of uploads | Stage 09 |

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
