# Stage Status (progress ledger — update at the end of EVERY stage)

> New agent? Read this file first, then `FUTURE_ROADMAP.md` (your stage row), then the
> specs your stage owns. This ledger + the specs + the code are your entire handoff.

## Completed stages

### Stage 00 — Project contract and architecture ✅ (2026-09-23)
- Wrote the binding contract: all 12 `docs/*.md` (see map in `ARCHITECTURE.md` §1).
- Locked: monorepo layout, `/api/v1` versioning, cookie sessions, Tailwind v4 CSS-first
  theming, async SQLAlchemy 2.0 + Alembic direction, Fernet vault direction, Fontsource
  type, error/pagination envelopes, proposed schema, AI provider ABC, taste system, SEO plan.
- Recorded ADR-001…ADR-007 in `ARCHITECTURE.md` §11.

### Stage 01 — Repository / development foundation ✅ (2026-09-23)
Runnable skeletons + verification gate. Details:

**Files/components created:**
- Root: `README.md` (rewritten), `.gitignore`, `.editorconfig`, `docker-compose.yml`
  (Postgres 16, `db` service), `scripts/verify.sh` (executable gate), `screenshots/README.md`.
- Backend (`backend/`): `app/main.py` (factory, middleware, envelope handlers),
  `app/core/{config,logging}.py`, `app/api/v1/{router,endpoints/health}.py`,
  seam packages (`models/schemas/services/analysis/ai/email/storage` — docstrings only),
  `tests/{conftest,test_health}.py`, `requirements{,-dev}.txt` (pinned),
  `pyproject.toml` (ruff + mypy-strict + pytest), `.env.example`.
- Frontend (`frontend/`): `src/app/{layout,page,globals.css,robots,sitemap,not-found}`,
  `src/lib/{site,api,utils}.ts`, `src/components/{ApiStatus,Reveal,MotionProvider}.tsx`,
  `public/favicon.svg`, `next.config.ts` (security headers, prod-only framing),
  `eslint.config.mjs` (flat, `react/no-danger: error`), `postcss.config.mjs`,
  `tsconfig.json` (Next-canonical), `.prettierrc` + `.prettierignore`, `.env.example`.

**Architectural decisions (beyond the ADRs):**
- TypeScript pinned to v6 line (`^6.0.3`): `typescript-eslint` (via `eslint-config-next`)
  does not support TS 7. Revisit when upstream supports TS ≥ 7.1.
- ESLint pinned to v9 (`^9.39.5`): `eslint-config-next@16`'s bundled `eslint-plugin-react@7`
  is incompatible with ESLint 10's context API. Revisit on plugin major bump.
- ESLint uses native flat-config imports (`eslint-config-next/core-web-vitals`,
  `eslint-config-next/typescript`) — the legacy `FlatCompat` path crashes with v16 configs.
- Frontend foundation page (`/`) is an HONEST placeholder marked for replacement in
  Stage 26 — not the marketing design. Same for `not-found` (enriched Stage 26).
- Backend pins: FastAPI 0.115.6, uvicorn 0.34.0, Pydantic 2.10.4, pydantic-settings 2.7.0,
  httpx 0.28.1; pytest 8.3.4, ruff 0.8.4, mypy 1.14.1.

**Environment variables added:** see `backend/.env.example` (`APP_*`, `API_V1_PREFIX`,
`BACKEND_CORS_ORIGINS`, `DATABASE_URL`, + reserved Stage 02–24 names) and
`frontend/.env.example` (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, + reserved);
root `.env.example` is the master inventory. Canonical names follow the Stage 00 prompt:
`NEXT_PUBLIC_API_URL`, `JWT_SECRET`, `ENCRYPTION_MASTER_KEY`, `DIRECT_DATABASE_URL`.
No global provider keys exist by design (user-owned, encrypted per-user).

**Database changes:** none (schema is PROPOSED in `DATABASE_SCHEMA.md`; database stage implements).

**API changes:** `GET /api/v1/health/live`, `GET /api/v1/health/ready`, plus the stable
infra alias `GET /health` (same live payload, OpenAPI-excluded). Contract for all future
endpoints frozen in `API_CONTRACT.md`.

**Tests performed (all green):**
- `scripts/verify.sh`: ruff check + format, mypy strict (17 files), pytest (5 tests),
  eslint, `tsc --noEmit`, prettier, `next build` (5 static routes) — ALL PASSED.
- Live E2E: uvicorn `:8000` + `next start` `:3000` — `/health` alias, live/ready shapes,
  404 envelope, `X-Request-ID`, security headers, CORS allow-origin+credentials, `/` 200
  with content, `/robots.txt` + `/sitemap.xml` 200, unknown route 404 — verified via curl.

**Known limitations (accepted, not bugs):**
- No auth/DB/engine/upload/history/dashboard/settings/AI — each has an owning stage.
- `docker-compose.yml` is untested here (no Docker in this environment) — the database
  stage must validate it when Postgres becomes required.
- Frontend `ApiStatus` shows "offline" until the backend runs — by design (live probe).
- Recharts deliberately NOT installed (dependency discipline, Stage 00 §24) — the
  dashboard/report stages add it when first imported.

### Stage 00 (formal) reconciliation ✅ (2026-09-23)
The formal Stage 00 prompt arrived after the foundation was built; the repo was inspected
(no rebuild) and reconciled. Deltas applied in this pass:
- Removed `recharts` (was declared-but-unused) per dependency discipline (§24).
- Added root `.env.example` (master inventory + compose reference) per §7.
- Aligned env names to the prompt: `NEXT_PUBLIC_API_URL`, `JWT_SECRET`,
  `ENCRYPTION_MASTER_KEY`; added `DIRECT_DATABASE_URL` (pooler/direct split).
  Global provider keys deliberately absent (prompt §7 permits this; user-owned vault).
- Added `GET /health` infra alias (§6) + test + contract note.
- Added `src/hooks/` + `src/types/` purpose READMEs (§4 structure).
- Added the verbatim UI contract sentence (§16) and the §18 items 14–15 rules.
- Re-verified: `verify.sh` green + live curl of all health paths + homepage.

### Stage 01 (formal) — Repository & Development Foundation ✅ (2026-09-23)
Inspection-first: the tree already held a complete runnable foundation, so nothing was
rebuilt — only genuine Stage 01 gaps were closed (layout primitive, loading/error
conventions, client timeout, frontend tests, redaction hardening, workflow docs).

**Completed:**
- `Container` layout primitive (`components/layout/`) adopted by `/` and the 404 page —
  the single source of horizontal rhythm for later screens.
- App-shell conventions: `loading.tsx` (route-transition fallback) and `error.tsx`
  (safe message + retry, never renders details) alongside the branded 404.
- API client: default 30 s timeout (`AbortSignal.timeout`, per-call override, distinct
  `request_timeout` code); home page now uses the shared `apiBaseUrl()` (no duplication).
- Frontend tests: Vitest 5 (node env, no jsdom) + `lib/api.test.ts` (6 tests pinning the
  envelope/timeout/cookie behavior); `npm test` script + `verify.sh` step added.
- Logging redaction hardened: quoted JSON/Python keys (`"password": "…"`) now scrubbed,
  `Authorization` headers scrubbed whole-credential (scheme word preserved), Bearer-in-value
  handled; `tests/test_logging.py` (5 tests) locks the behavior.
- Workflow docs: README gained a development-commands table, current-limitations section,
  and the Python strategy line; frontend `.env.example` gained a required/optional legend;
  CORS dev-vs-prod note added; `ARCHITECTURE.md`/`API_CONTRACT.md`/`DEVELOPMENT_RULES.md`
  updated for the new conventions (client-timeout guidance, test commands).

**Not implemented (explicitly pending, per roadmap):** authentication, database models/
migrations, deterministic engine, analysis API, analyzer UI, document upload/extraction,
segmentation, history, report UI, dashboard, settings, AI vault/providers/enhancement,
CAPTCHA/rate limiting, privacy lifecycle, Sentry, performance pass, SEO content,
responsive/a11y audit, deployment. Nothing future is presented as done.

**Architectural decisions:** `Container` = one horizontal-rhythm primitive (override via
`className`, conflicts resolved by `tailwind-merge`); `error.tsx` renders safe messages
only; client timeout 30 s default; Vitest over heavier runners (lib tests need no DOM);
redaction favors over-redaction (safe direction) for auth headers.

**Environment variables:** none added or renamed in Stage 01 (annotations/legends only).
Canonical names unchanged: `NEXT_PUBLIC_API_URL`, `JWT_SECRET`, `ENCRYPTION_MASTER_KEY`,
`DIRECT_DATABASE_URL`. No global provider keys (by design).

**Tests:** `verify.sh` ALL GREEN — ruff, mypy-strict, pytest 10/10, eslint, `tsc`, vitest
6/6, prettier, `next build` (6 routes incl. loading/error). Live E2E (uvicorn + `next
start`): `/health` ≡ `/live`, `/ready`, 404 envelope, `/` 200 with content, 404 page,
robots — all curl-verified. Two real bugs found and fixed by the new tests (fetch-stub
timeout fidelity; doubled closing quote in redaction).

**Known limitations:** `docker-compose.yml` still unvalidated (no Docker here) — Stage 02
must test it; `ApiStatus` shows offline without the backend (by design); home page is an
honest placeholder; TS v6 / ESLint v9 upstream holds remain.

**Next stage:** Stage 02 — Database Foundation (models, Alembic migrations, live DB
wiring, real `/ready` DB check).

### Stage 02 — Database Foundation ✅ (2026-09-23)

**Completed:**
- Async PG stack pinned: SQLAlchemy 2.0.54 + asyncpg 0.31.0 + Alembic 1.20.0
  (+ greenlet 3.5.6, Mako 1.4.3 for `alembic revision`).
- `app/core/database.py`: lazy engine (`pool_pre_ping`), session factory
  (`expire_on_commit=False`), `get_session` dependency (unwired until Stage 03),
  `database_status()` probe, `dispose_engine()`. DSN hygiene: `postgresql://` coerced
  to asyncpg, non-PG URLs rejected loudly, DSN never logged/echoed (chains suppressed).
- Six models (one module each + `base.py` mixins); relationships use
  `passive_deletes=True` — the DATABASE enforces cascades, never ORM SELECTs.
- Alembic: async `env.py` (DSN resolution mirrors the app: DIRECT ▸ DATABASE),
  hand-written revision `0001` with named CHECKs/indexes/partial uniques;
  `alembic check` reports zero drift between models and migration.
- `/ready` is now a live `SELECT 1` (`ok`/`error`/`not_configured` → `ready`/`degraded`).
- Test harness: `tests/test_database.py` (17 tests) + conftest PG support
  (`TEST_DATABASE_URL`, scratch-DB auto-create, session `upgrade head`, per-test
  cleanup, skip-if-unreachable, single-event-loop discipline). `verify.sh` ruff scope
  extended to `alembic/` (mypy stays `app/`-only — migrations are operational scripts).

**Database schema:** `users`, `analyses`, `requirements`, `issues`, `documents`,
`ai_provider_credentials` — full detail in `DATABASE_SCHEMA.md` (now IMPLEMENTED).
Prompt-alignment calls: `owner_id` kept (canonical, never renamed); `display_name`
added (§8 "name"); `requirements.severity` added = worst-of-issues (§13);
`encrypted_api_key` renamed (§19); `is_enabled` + partial `UNIQUE(owner, provider)
WHERE is_enabled` added (§18/§20); `key_version` added (rotation audits);
document link stays `analyses.document_id` (one doc → many re-analyses, §16/§21).

**Migrations:** `0001` at head; `current`/`history`/`check` plus a full
`downgrade base` → `upgrade head` cycle verified against real PostgreSQL 16.

**Tests:** `verify.sh` ALL GREEN — pytest 27/27 (17 DB tests on real PG via an
ephemeral sandbox server + `TEST_DATABASE_URL`), vitest 6/6, ruff, mypy-strict,
`next build`. Skip-mode verified (15 passed / 12 skipped with no server). Live E2E:
uvicorn + `DATABASE_URL` → `/ready` = `{"status":"ready","checks":{"database":"ok"}}`.
Schema audit: 16 named indexes + email unique, 9 FKs, 20 CHECKs — all as designed.

**Security:** `SECURITY_SPEC.md` §12 added (ownership, FKs, IDOR, encryption/hash field
shapes, sensitive-text handling, DSN hygiene, least-privilege guidance, deletion plan).
DSN non-echo covered by tests. No credentials committed; fixtures use `@example.com`.

**Known limitations:** `docker-compose.yml` STILL unvalidated (no Docker in sandbox) —
recurring warning; RLS evaluated and reasoned-DEFERRED (single service role bypasses
it; endpoint checks enforce); engine lifespan shutdown = Stage 03 (`dispose_engine()`
ready); auth-token tables = Stage 04; no `updated_at` on immutable tables (by design).

**Next stage:** Stage 03 — Backend Foundation / Service Layer Integration.

### Stage 03 — Backend Foundation / Service Layer ✅ (2026-09-23)

**Completed:**
- Layered architecture live: routers → `services/` → `repositories/` → models, with
  `schemas/` (Pydantic boundaries) + `exceptions/` (`AppError` → envelope mapping).
  Canonical minimal path: `/ready` → `services/readiness.py` → `SystemRepository.ping()`.
- Transactions: `@transactional` (commit/rollback) in `services/transactions.py`;
  multi-service atomicity = shared session + single commit (no code until needed).
- `main.py`: lifespan engine disposal, access-log middleware (method+path+status+ms,
  request-ID correlated, never query params), `AppError` + `SQLAlchemyError` handlers,
  CORS tightened to explicit methods/headers (no `*`).
- `database.py`: `database_status()` retired (superseded by the readiness service);
  `get_session` kept as the request-DI seam for Stage 04 routes.
- Error handling extended: services raise `AppError` (mapped to the envelope);
  `SQLAlchemyError` → sanitized `500 internal_error`; per-field validation details
  preserved (envelope shape itself was already contract-exact).
- Fixed `alembic/env.py` silencing app logging: `fileConfig()` defaults to
  `disable_existing_loggers=True`, which disabled the `app.main` logger whenever
  migrations ran in-process (the test harness) — now `False`.
- Pagination seam: `PaginationParams` + `Page[T]` in `schemas/common.py` (first
  consumers: Stage 07+ list endpoints). `Document.analyses` gained
  `passive_deletes=True` (ORM-only, zero migration drift via `alembic check`).

**Database changes:** none (no migration; `0001` still head, `alembic check` clean).

**API changes:** none (same routes; envelopes now contract-exact).

**Tests:** `verify.sh` ALL GREEN — pytest 51/51 (15 DB tests on real PG via an
ephemeral sandbox server + `TEST_DATABASE_URL`), vitest 6/6, ruff, mypy-strict,
`next build`. Skip-mode verified (36 passed / 15 skipped with no server). Live E2E:
uvicorn + `DATABASE_URL` → `/ready` =
`{"status":"ready","checks":{"database":"ok"}}`, plus access-log + request-ID +
CORS-preflight curl checks.

**Security:** error sanitization (no SQL/DSN/traces in responses — tested); access
log excludes query params (tested); DSN hygiene unchanged. No auth yet (Stage 04).

**Known limitations:** `docker-compose.yml` STILL unvalidated (no Docker in sandbox) —
recurring warning; `verify.sh` has no automated drift check (manual `alembic check`
per SECURITY_SPEC §12); the readiness probe takes its own short-lived session by
design (documented infrastructure exception, not a request transaction).

**Next stage:** Stage 04 — Authentication Backend.

### Stage 04 — Authentication Backend ✅ (2026-09-23)

**Completed:**
- Sessions: argon2id (`argon2-cffi`, env-tunable, off-loop) + access JWT 15 min
  (HS256, `JWT_SECRET` fail-closed) + rotating refresh 30 d with reuse detection
  (re-presenting a ROTATED token revokes its whole family — committed BEFORE the
  error raises, since `@transactional` rolls back on failure).
- 11 endpoints (`api/v1/endpoints/auth.py` + `dependencies.py`): register (synthetic
  201 on duplicate), verify-email (auto-login), resend (always-202), login, logout
  (204, idempotent, works with expired access), me, refresh (explicit endpoint —
  contract amendment), forgot (always-202), reset (logout-everywhere), change
  (current password required), DELETE account (hard delete + cascade + farewell).
- Policy: unverified accounts CAN log in; app resources gate per-endpoint
  (`get_current_verified_user` → `403 email_unverified`). Email inputs never
  enumerate (synthetic-201/always-202 + dummy-hash uniform timing); 256-bit link
  tokens return honest 400s; bad-email vs bad-password are byte-identical 401s.
- Email port: `EmailMessage` + 4 templates + `EmailService` ABC; Resend (prod) and
  console/file-outbox (dev-only, refused in prod) adapters; sends are best-effort
  post-commit BackgroundTasks (resend endpoints = recovery path). Emailed links use
  frontend routes `/verify-email?token=…` / `/reset-password?token=…` (Stage 05).
- Guards: `Origin`/`Referer` allowlist on every mutating route (safe-method GET
  exempt); per-endpoint+IP single-process buckets (429 + `Retry-After`, fail-open
  documented); `turnstile_token` accepted-and-ignored until Stage 22.
- Two real bugs found by the new tests and fixed: (1) FastAPI drops the injected
  `Response` when an endpoint returns a `Response` — logout/delete now set cookies
  on the RETURNED response (logout previously never cleared cookies); (2) the
  refresh-reuse family revocation was rolled back by `@transactional` (now commits
  first; trap documented in `transactions.py`).

**Database changes:** revision `0002` (`refresh_tokens` with `family_id` /
`replaced_by_hash` rotation columns, `email_verification_tokens`,
`password_reset_tokens`; `CHAR(64)` sha256 hashes, CASCADE FKs, owner/family
indexes). Upgrade → downgrade → upgrade cycle verified; `alembic check` zero drift.

**API changes:** §4.2 live (see contract for the refresh-endpoint amendment, `/me`
shape, and anti-enumeration notes); `Retry-After` header on 429s.

**Tests:** `verify.sh` ALL GREEN — pytest 114/114 (63 new: 39 auth E2E incl. CSRF,
cookie attrs, rotation/reuse, recovery cycles, 429 + Retry-After, prod `Secure`
flag; 24 primitives/email/factory units), vitest 6/6, ruff, mypy-strict (app AND
tests), `next build`. Skip-mode verified. Live E2E: uvicorn + `DATABASE_URL` →
register → console-outbox link → verify → login → refresh rotation → logout, plus
`/ready`, CORS-preflight, and 404-envelope curl checks.

**Security:** hash-only password column live; sha256-only token storage; constant-time
compare; cookies `HttpOnly; Secure (prod); SameSite=Lax; Path=/`; no tokens in logs
(console adapter logs metadata only — tested); DSN/secret hygiene unchanged.

**Known limitations:** single-process buckets (≈N× budget behind N workers — Stage 22
distributes); no Turnstile verification yet (Stage 22); no auth UI (Stage 05);
`docker-compose.yml` STILL unvalidated (no Docker in sandbox) — recurring warning.

**Next stage:** Stage 05 — Authentication Frontend.

### Stage 05 — Authentication Frontend ✅ (2026-09-24)

**Completed:**
- Routes (`app/(auth)/`, all `noindex, nofollow`): `/login` + `/signup` (one `AuthCard`,
  `initialMode`), `/forgot-password`, `/reset-password?token=…`, `/verify-email?token=…`.
  Root layout wraps everything in `AuthProvider`; home page untouched.
- `AuthCard` + blade/sweep: timeout-driven phases (320 cover / 60 hold / 320 reveal),
  mode swaps mid-cover; desktop = slanted `clip-path` side panel, mobile = top-strip
  curtain (same machine, measured cover height); both forms `hidden`+`inert`+
  `aria-hidden` when inactive, both inert mid-sweep; focus to the new first field;
  polite live-region announcements; reduced-motion (via `useReducedMotionConfig`)
  swaps instantly. Zero API calls in the animation.
- Auth state: `AuthProvider` (status/user + login/signup/logout/refreshUser/clearAuth)
  via `useAuth`; one-shot `/me` init with module-level in-flight guard (no `/me`
  spam, StrictMode-safe); `lib/auth.ts` = only `/auth/*` caller; silent refresh =
  single-flight + retry-once, applied ONLY to `me`/`change-password`.
- All flows: login (unverified CAN log in), signup → verify-pending + resend (30s
  cooldown), verify auto-submit-once, forgot/reset (never auto-login), reusable
  `ChangePasswordForm` (tested, unmounted until settings), `ProtectedRoute` (+
  `requireVerified` nudge). Copy switches on backend `code` (never `message`);
  anti-enumeration wording non-committal; tokens never displayed/logged (asserted).
- Client validation mirrors server policy (12–256, local-part ≥4 rule, 16–128
  tokens); denylist stays server-side. No turnstile field, no remember-me, no
  `?next=` (fixed `/` landing until the dashboard stage — documented temp).

**Architectural decisions:**
- `register` sets NO cookies (contract §4.2 "register never logs in" — caught live
  when the journey probe assumed otherwise): `signup()` performs no identity
  refresh; the session starts at verify-email or login.
- Reduced motion reads `useReducedMotionConfig` (honors `MotionConfig`), not the
  device-only `useReducedMotion` (which ignores the provider — caught by tests).
- Outstanding access JWTs survive reset/logout until TTL (stateless bearers);
  revocation applies to refresh — UI + tests assume nothing else.
- Component tests use `jsdom` per-file pragma + Testing Library + `user-event`
  (new devDeps, same Vitest runner); `vitest.config.ts` mirrors the `@/*` alias.
  Label queries in multi-form cards are `within()`-scoped (jsdom loads no CSS, so
  `display:none` doesn't hide from text queries — role queries exclude via aria-hidden).

**Tests:** `verify.sh` ALL GREEN — pytest 114/114 (backend untouched), vitest 129/129
(123 new: 3 lib files, provider, 2 hooks, 9 components incl. blade sweep/re-entry/
reduced-motion/focus/cooldown/pending/redirect paths), eslint, `tsc`, prettier,
`next build` (9 routes). SSR curl: all 5 auth routes 200 (skeleton-first on
login/signup, `noindex,nofollow`, correct titles). Live journey through the REAL
`lib/*` + real backend (temp probe, deleted after): register→unverified-login→
duplicate-201→resend-202→verify→logout→bad-login→login→refresh-rotation→forgot→
reset→logout-everywhere→change→validation-shape→logout→DELETE — green, 0 users
left, cookie attrs (`HttpOnly`, `SameSite=Lax`) asserted.

**Known limitations (accepted, not bugs):**
- NO browser in this sandbox (no Chromium/Firefox; Playwright CDN + Debian mirrors
  blocked) — the blade sweep, responsive widths, and visual polish were NOT
  pixel-verified and NO screenshots ship (`screenshots/` still empty). The first
  browsed environment must capture `stage05-*` at 390/768/1440 + re-verify the
  sweep by eye. Unit + SSR + live-API coverage stands in meanwhile.
- Post-auth landing is the fixed temporary `/` (dashboard stage replaces it).
- `ChangePasswordForm` ships unmounted (settings stage mounts it); `ProtectedRoute`
  has no consumers yet (first private pages wrap with it).
- `docker-compose.yml` STILL unvalidated (no Docker in sandbox) — recurring warning.

**Next stage:** Stage 06 — Deterministic Engine (needs nothing from auth; verified
`requireVerified` nudge + `ProtectedRoute` are ready for its future private UI).

## Current stage
None active — Stage 05 complete; all success conditions hold (5 auth routes, blade
transition with a11y + reduced-motion paths, provider + silent refresh, all recovery
flows, 129/129 frontend tests, live journey green, docs match).
Next: **Stage 06 — Deterministic Engine**.

## Upcoming stages (summary — authority: FUTURE_ROADMAP.md)
Database → backend → auth backend → auth frontend → deterministic engine → analysis API →
analyzer UI → upload → extraction → segmentation → history → report UI → dashboard data →
dashboard viz → settings → AI vault → providers → overview/improvements → fallback →
hardening → CAPTCHA/rate-limit → privacy → monitoring → performance → SEO foundation →
SEO content → responsive/a11y → QA → deploy → docs/shots → audit.

## Major decisions log
- `/api/v1` versioning (ADR-002) — master prompt listed unversioned paths; version now.
- Cookie sessions over bearer-in-storage (ADR-003).
- Fernet vault with `vN:` rotation prefix under `ENCRYPTION_MASTER_KEY` (ADR-006).
- Fontsource self-hosting over `next/font/google` (ADR-007) — offline-safe builds.
- `422` reserved for unprocessable FILES; schema validation is `400 validation_error`.
- `GET /health` = fixed infra alias; product health contract stays versioned.
- No global AI provider env keys, ever — per-user encrypted vault only.
- UUID PKs client-generated (no `pgcrypto`); VARCHAR+CHECK vocabularies (no PG enums);
  RLS deferred with reasoning (service-role connections bypass it).
- One live provider key per user+provider (partial unique); disable-then-replace rotation.
- Test DB: real PG via `TEST_DATABASE_URL`, skip-if-unreachable, single-loop discipline.
- `@transactional` = default transaction strategy (shared-session commit for orchestration).
- Auth sessions: unverified-can-login + per-endpoint verified gate (not login-time block).
- `POST /auth/refresh` is the explicit rotation endpoint (Stage 04 contract amendment).
- State that must survive an error (theft revocation) commits explicitly before raising.
- Cookies/headers belong on the RETURNED `Response` when an endpoint returns one —
  FastAPI drops the injected `Response` in that case (logout-cookie bug, Stage 04).
- Auth UI: `AuthProvider` is the single state; error copy switches on backend `code`
  (never `message`); `register` sets no cookies (no post-signup refresh); silent
  refresh is single-flight + retry-once for `me`/`change-password` only.
- Motion preference reads `useReducedMotionConfig` (honors `MotionConfig`), never the
  device-only `useReducedMotion` (ignores the provider).
- Component tests: `jsdom` per-file pragma + Testing Library (`within()`-scoped label
  queries in multi-form cards); `vitest.config.ts` mirrors `@/*` (Vitest ignores
  tsconfig paths).

## Warnings for future agents
1. IMPLEMENTED: `app/{models,schemas,services,repositories,exceptions}/` (Stages 02–03).
   Remaining SEAMS (docstrings only): `app/{analysis,ai,email,storage}/` — do not
   import behavior from them until their stage implements them.
2. Never rename `owner_id`, envelope shapes, env names, or `docs/` files without ADR + CHANGELOG.
3. Never `npm install` a dependency the stage doesn't import (recharts: dashboard/report stages).
4. Frontend placeholder `/` page must be REPLACED in the SEO/marketing stage, not extended.
5. No Docker here — whoever first needs Postgres locally validates `docker-compose.yml`.
6. TS v6 / ESLint v9 pins are upstream-compatibility holds, not preferences — re-check
   before "upgrading" (see Toolchain note in CHANGELOG 0.1.0).
7. Apply edits to the SAME file sequentially and grep-verify afterwards — parallel
   same-file edits have been observed to clobber each other (see DEVELOPMENT_RULES §6).
8. Never rewrite a file from remembered content: re-read (or `git show HEAD:`) first,
   then `git diff`-review the rewrite line by line for silently dropped behavior.
   Stage 03 caught a rewrite that dropped status codes, security headers, and docs
   paths this way — the gate was green but the diff was wrong.
