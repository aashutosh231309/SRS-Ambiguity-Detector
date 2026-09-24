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
  documented); at Stage 04 time, `turnstile_token` was accepted-and-ignored until
  the Stage 22 verifier shipped.
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

**Known limitations at Stage 04 time:** single-process buckets (≈N× budget behind N workers —
Stage 22+ distributes); no Turnstile verification yet (later shipped in Stage 22);
no auth UI (Stage 05); `docker-compose.yml` STILL unvalidated (no Docker in sandbox) —
recurring warning.

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

### Stage 06 — SRS Input + Segmentation + Preview ✅ (2026-09-24)

Shipped input-first (absorbing roadmap-11 segmentation + the input halves of
roadmap-07/08); detectors + scoring move to actual Stage 07. Details:

**Completed:**

- `POST /api/v1/analysis` (TEXT-only → `201` SEGMENTED detail): verified-user
  guard (identity + CSRF + per-user 20/min bucket) → schema validation (title
  ≤200, text 1–200 000 chars) → conservative normalization → deterministic
  segment → transactional persist (`analyses` + ordered `requirements`, excerpt
  ≤500). Owner comes from the session, never the client; no `user_id` accepted;
  nothing persists on any 4xx. No scores/issues/AI: `score`/`band` null, nested
  `issues` empty, `ai_status` always `skipped`.
- Segmenter (`services/segmentation.py`, pure, no I/O): requirement-ID (0.95),
  decimal (0.90/0.75) / numbered (0.60), bullet (0.80/0.65/0.50), paragraph
  (0.55/0.50); multi-sentence requirements, headings → `section` paths, source
  offsets + line refs, confidence per segment; span invariant (segments tile the
  normalized text exactly). Requirements cap 2000 enforced post-segmentation.
- `/analyzer` (verified-guard, `noindex,nofollow`): title + large editor with
  live char/word counts, validation/loading/rate-limit states, Clear /
  Start-over / Analyze-another; `SegmentPreview` renders requirements +
  segmentation evidence ONLY (no scores/severity/AI text — all null); 401
  mid-draft routes through re-login with the draft preserved.
- Migration `0003`: `analyses.status` (+ `segmented`-only CHECK) /`source_text`,
  NULL-until-scored `score`/`band` (analyses + requirements), requirement
  `section`/`segmentation`; downgrade deletes unscored rows (pre-release only).
- New error codes: `text_too_large` (char budget or cap, with counts),
  `no_requirements_detected`, `document_analysis_unavailable` (non-null
  `document_id` before Stage 09); `options.ai_enhance` accepted + ignored.

**Architectural decisions:**

- Input-first sequencing (roadmap as-built note): a persisted SEGMENTED analysis
  is the honest substrate detectors score in Stage 07; roadmap numbers stay,
  STAGE_STATUS records the mapping.
- Contract reconciliation: issues are nested-only per the binding §4.3 example
  (no top-level `issues` — PROJECT_SPEC §7's shorthand materializes nested);
  `source_excerpt` is summary-only (absent from the detail); detail gains
  `status: "segmented"`, requirements gain `section` + `segmentation`.
- Live form counts are cheap char/word heuristics — real segmentation runs
  server-side, on submit only (no per-keystroke segmentation, ever).
- Silent refresh is shared via `withSessionRetry` (now also serving analysis
  creation); the param-label table is shared with analysis field errors.
  Auth behavior untouched — all Stage 05 tests pass unmodified.
- Component tests that render motion's `whileInView` need the shared
  IntersectionObserver stub (`vitest.setup.ts` — jsdom lacks it, browsers don't).

**Tests:** `verify.sh` ALL GREEN — pytest 179/179 (65 new: 45 segmentation incl.
span-invariant/confidence/edge cases, 20 API/ownership/transaction/rollback),
vitest 165/165 (36 new: lib mapping/field-errors + form/validation/loading/
preview/error/reset), eslint, `tsc`, prettier, `next build` (11 routes, incl.
`/analyzer`). SSR curl: `/analyzer` 200 (`noindex,nofollow`, guard skeleton).
Live journey through the REAL `lib/*` + real backend (temp probe, deleted
after): register→verify→login→paste-SRS→submit→201 SEGMENTED→preview shape
(requirements + evidence, null scores, empty nested issues)→validation-error→
anon-401→logout→DELETE — green, 0 users left.

**Known limitations (accepted, not bugs):**

- NO browser in this sandbox (as in Stage 05) — editor/preview responsive
  widths + visual polish NOT pixel-verified, NO screenshots ship (`screenshots/`
  still empty). First browsed environment must capture `stage06-*` at
  390/768/1440 + the pending `stage05-*` set.
- Detection + scoring + GET/list/delete + history + dashboard all pending;
  `analyses.status` CHECK admits only `segmented` until the pipeline grows.
- Title-length UX: over-long titles show a live error and disable submit
  (no counter on the title field — the counts belong to the editor).
- `docker-compose.yml` STILL unvalidated (no Docker in sandbox) — recurring warning.

**Next stage:** Stage 07 — Detection + scoring (fills `score`/`band`/`severity`,
nested `issues[]`, breakdown; extends the `status` CHECK; keeps the §4.3 shape).

### Stage 07 — Detection + Scoring + Analysis CRUD + Result UI ✅ (2026-09-24)

Shipped the full detection stage AND absorbed the roadmap-07/08 remainders
(GET/list/delete + scored-results UI) — the analysis spine is closed through
scoring + CRUD + basic results. Details:

**Completed:**

- Deterministic engine (`analysis/detectors.py` + `engine.py`, pure, zero
  I/O/network/LLM): 11 detectors → span-sorted dedup (exact-dupe collapse +
  identical-span cross-detector merge to higher severity, registry-order
  tiebreak; overlapping-but-distinct spans KEPT) → `100 − Σ` deductions
  (5/10/15/20, clamp 0–100) → mean overall (half-up) + band + 4-dimension
  health partitioned from the same deductions (measurability ←
  subjective/measurable; specificity ← quantifier/undefined/absolute; clarity
  ← pronoun/operator/optional/passive; completeness ←
  constraint/incomplete). Same text ⇒ identical findings/scores/health
  (modulo generated ids); SAMPLE_SRS pinned ([100,100,90,95], 96/low).
- `POST /api/v1/analysis` runs segment → detect → score → transactional
  persist (`analyses` + `requirements` + `issues`) and returns `201` ANALYZED
  detail; `GET /analysis/{id}` returns the byte-identical detail; `GET
/analysis` pages newest-first (`sort`/`band`/`source_type`, unknown params
  ignored); `DELETE /analysis/{id}` cascades (row-count verified) → `204`.
  Missing AND foreign ids → identical `404 analysis_not_found`; GETs
  identity-authed, DELETE CSRF-guarded; verified-gate + 20/min bucket kept.
- `/analyzer` result UI: `AnalysisResultView` (score ring + band, severity
  counts, heuristic footnote) + `RequirementCard` (union/clamped `<mark>`
  highlighting, clean-state copy, provenance) + `IssueCard` ("Why was this
  flagged?" disclosure per UI_UX_SPEC §8) + `ScoreRing` + `SeverityBadge`;
  `SegmentPreview` + its tests deleted; `sev-*` tokens added (dark values).
- Migration `0004` (CHECK `segmented|analyzed|failed`); new code
  `analysis_not_found`; contract §4.3 rewritten (scoring, registry, dedup,
  honest false-positive limits, list/detail/delete semantics).

**Architectural decisions:**

- Detectors are lexical heuristics BY DESIGN — severity reflects pattern
  fixity, not validated impact; the contract + UI footnote say scores are
  triage aids, not measurements (no inflated claims anywhere).
- Overlap-Kept dedup: `quickly` (subjective) + `respond quickly`
  (unmeasurable) are two genuine concerns — collapse only exact dupes and
  identical spans, never distinct ones.
- Requirement `severity` is worst-issue-or-null (clean ⇒ null, no badge);
  overall interpretation is the score band only (NO `overall_severity`).
- Frontend drops `requirement_id` (nesting carries ownership); offsets stay
  requirement-relative end-to-end (highlighting foundation).
- Same-client re-login (`cookies.clear()` for anon) is the multi-user E2E
  pattern — nested `TestClient(app)` instances are unproven/risky.

**Tests:** `verify.sh` ALL GREEN — pytest 234/234 (55 new: 26 detector incl.
exemption frames, 16 scoring/dedup/bands/health, 13 CRUD E2E incl.
POST==GET byte-equality, IDOR-identity, cascade row-counts, CSRF-on-DELETE,
determinism), vitest 183/183 (22 new: 6 lib CRUD + 1 error copy + 15 across
5 result components incl. span merge/clamp; 4 preview tests deleted with the
component), eslint, `tsc`, prettier, `next build` (11 routes, incl.
`/analyzer`). SSR curl: `/analyzer` 200 (`noindex,nofollow`, guard skeleton).
Live journey through the REAL `lib/*` + real backend (temp probe, deleted
after): register→verify→submit→201 ANALYZED (scores/issues/breakdown +
offset-slicing asserted)→GET-detail-equality→list+filters→IDOR-404s→owner-
DELETE→anon-401→account-deletion — green, 0 users/analyses left.

**Known limitations (accepted, not bugs):**

- NO browser in this sandbox (as in Stage 05/06) — result UI (ring, marks,
  disclosures) responsive widths + visual polish NOT pixel-verified, NO
  screenshots ship (`screenshots/` still empty). First browsed environment
  must capture `stage07-*` at 390/768/1440 + the pending `stage05-*` set.
- Detectors have known false-positive classes (domain jargon, deliberate
  hedging, idioms) — documented as honest limits in API_CONTRACT §4.3, not
  fixed by threshold-tuning (that would trade recalls silently).
- `suggested_rewrite` is still `null` (rule rewrites post-Stage 07);
  `ai_explanation`/`ai_overview` null until AI stages; no history UI yet
  (list API ready, UI pending); `failed` status reserved, unwired.
- `docker-compose.yml` STILL unvalidated (no Docker in sandbox) — recurring warning.

**Next stage:** Stage 08 (as-built) — Document upload + extraction
(roadmap-09/10); history UI can follow on the ready list API anytime.

### Stage 08 — Secure Document Upload + Extraction + Upload UI ✅ (2026-09-24)

Shipped upload+analyze AND absorbed roadmap-09 (except signed-URL downloads
and document list/delete-by-id — no download/list/purge-by-id surface yet)
plus roadmap-10 fully — files run the SAME Stage 07 pipeline as pasted text
(equivalence guarantee, asserted in tests). Details:

**Completed:**

- `POST /api/v1/documents/upload` (multipart, EXACTLY one file; extras → 400
  `too_many_files`, never silently dropped) → stream to 0600 temp (byte
  budget on the TRUE count) → validate+extract in a worker thread + 60 s
  timeout → shared `analyze_text` core → one transaction (document row + FULL
  analysis graph) → move into storage → `201 {document, analysis}`.
  Verified-user + CSRF guarded, own 10/min per-user bucket. Any failure: no
  rows, no objects, no temp files.
- Validation pipeline (`documents/validation.py`, pure): filename sanitize
  (traversal/drives/controls neutralized; rejects only unusable/>255) →
  extension → declared-MIME agreement (exact or generic octet-stream) → magic
  bytes (PDF header, DOCX ZIP header) → structure (OOXML required members,
  TXT NUL sniff). `GET /documents/{id}` returns owned metadata byte-identical
  to the upload half (foreign ids 404 identically); `DELETE /analysis/{id}`
  on a document analysis ALSO purges the orphaned document (row + object —
  each document belongs to exactly one analysis, so nothing else can dangle).
- Bounded extraction (`documents/extraction.py`): pypdf (≤500 pages, blank-
  line joins), python-docx (≤2000 members / ≤50 MB inflated, TRUE document
  order incl. headings, `|` table joins), TXT (utf-8-sig → windows-1252 →
  latin-1, total); 200 000-char budget enforced DURING accumulation; NUL
  stripped for Postgres; `422 extraction_failed` (internals server-side) /
  `no_extractable_text` (parsed-but-textless — OCR honestly absent).
- Storage abstraction (`storage/base.py` ABC + `local.py` dev adapter):
  server-generated `documents/{owner}/{doc}/source` keys, traversal/symlink-
  proof resolution, empty-dir pruning, EXDEV-safe move; commit failure
  best-effort deletes the object. No binary ever touches Postgres.
- `/analyzer` upload UX: Paste-text/Upload-file tabs (automatic-activation,
  arrow-key nav) + `DocumentUploadForm` (dropzone + picker, instant client
  pre-checks, ONE honest indeterminate pending state — `fetch` has no upload
  progress, so no fake percentages) sharing the scored result view; title
  preserved across Start-over (the file itself cannot persist).
- Migration `0005` (`documents.file_type` + CHECK); 11 new error codes;
  `source_type` widened to `text|document` end-to-end (incl. list filter);
  `api/v1/presenters.py` is the single service→response mapper for BOTH
  sources; contract §4.4 rewritten as-built (§2 codes table corrected:
  400s, not 413/415; real 422 codes).

**Architectural decisions:**

- Equivalence over re-implementation: uploads reuse `analyze_text` unchanged
  (no parallel pipeline to drift) — proven by a canonical-comparison test.
- Exactly-one-file: the sync pipeline bounds one request to one analysis;
  multi-file needs a real async stage, not a loop (see the endpoint NOTE).
- Stored MIME is server-DETECTED canonical, never the client claim; stored
  filename is sanitized display-only, never a path.
- Orphan purge (not SET-NULL-and-keep): a document with no analysis is
  garbage by construction — delete cascades to row + object, verified by
  row-count + storage-empty.
- Size/type budgets refuse with 400 + reason codes (actionable, envelope-
  shaped), NOT bare 413/415 — the §2 table's reserved rows say so now.
- Upload UX honesty: indeterminate progress only; client pre-checks labeled
  as instant feedback with the server authoritative; no OCR implied anywhere.

**Tests:** `verify.sh` ALL GREEN — pytest 310/310 (76 new in
`test_documents.py`: 19 sanitize params + validation/integration/security
E2E incl. equivalence, IDOR-identity, cascade row-counts + storage-empty,
CSRF-on-upload, rate-limit, timeout-503-with-cleanup, extractor units incl.
page/member/char caps, storage traversal/symlink), vitest 197/197 (14 new:
11 upload-form incl. multipart capture + blank-title omission, 2 workspace
tabs incl. upload→result→start-over, 1 error-copy block), eslint, `tsc`,
prettier, `next build`. Live journey with REAL files (reportlab PDF,
python-docx DOCX with table, TXT): txt+pdf → 5 reqs/8 issues/score 85,
docx → 7 reqs/11 issues/score 86, txt-upload == pasted-text equivalence,
list filter total=3, binary-as-txt → 400, cascade → 0 rows + purged storage.

**Known limitations (accepted, not bugs):**

- NO browser in this sandbox (as in Stages 05–07) — upload tabs/dropzone +
  responsive widths NOT pixel-verified, NO screenshots ship (`screenshots/`
  still empty). First browsed environment must capture `stage08-*` at
  390/768/1440 + the pending `stage05/06/07-*` sets.
- Account deletion (`DELETE /auth/account`) does NOT purge storage objects
  (rows cascade; objects orphan) — Stage 23 lifecycle MUST cover this.
- No OCR (image-only PDFs honestly 422); no `.doc`/`.docm`/ODT/RTF; body +
  tables only (no headers/footers); Word auto-numbering not recovered
  (literal numbers only); macros/embedded objects never opened (safety).
- On processing timeout the worker thread is abandoned (CPython cannot kill
  threads) — the REQUEST still fails fast with 503; bounded input keeps the
  stray work small.
- No document list/delete-by-id/download endpoints; by-id re-analysis still
  `document_analysis_unavailable`; `extraction_status` always `ok`
  (`pending`/`failed` await an async stage).
- `docker-compose.yml` STILL unvalidated (no Docker in sandbox) — recurring warning.

**Next stage:** Stage 09 (as-built) — Analysis history UI on the ready list
API (search/filter/sort/paginate/delete, ownership-scoped, responsive
table→cards); document list/download endpoints can ride along or follow.

### Stage 09 — Polished Analysis Report (`/analysis/[id]`) ✅ (2026-09-24)

Shipped the dedicated saved-report experience instead of the planned history
UI (sequencing change: the report the history will link to comes first;
history moves to Stage 10). One shared `AnalysisResultView` serves the fresh
workspace result AND the saved route — context + footer actions differ, the
report never does. Details:

**Completed:**

- Backend (contract §4.3 amendment): detail gains a `document` pointer
  (`{filename, file_type}`, display-only — no document id, no storage
  key/path, no binary) for `source_type: "document"`, `null` for text; the
  upload endpoint's analysis-half is byte-identical to `GET /analysis/{id}`
  (asserted); `status: "failed"` rows read back with null scores, `{}`
  breakdown, and empty requirements; absent document rows degrade to
  `document: null` (never a 500); foreign GETs 404 with zero filename leak;
  malformed ids fail closed with `400 validation_error`.
- Saved-report route `/analysis/[id]` (verified-guard + `noindex,nofollow`):
  `AnalysisReportScreen` with loading skeleton, ONE honest not-found panel
  for missing/foreign/malformed ids (no existence oracle), session-expired
  sign-in nudge, and retryable load-failure state; top + footer Back links.
- Report sections per UI_UX_SPEC §7: `ScoreRing` gauge + persisted-stats `dl`
  (order pinned) + stacked `sev-*` severity bar + heuristic footnote;
  `CategoryBars` (this-analysis-only counts) + `HealthBars` (persisted
  partitioned dimensions, never competing with the gauge); clean analyses get
  an honest "no patterns detected" banner, `failed` an explicit did-not-
  complete panel, `segmented` an older-version notice — never hollow charts.
- Requirement list: search (text + identifier) + status/severity filters +
  sort (original order default, lowest-score, most-issues) with a live
  "Showing X of Y" line, honest no-match empty state + reset, toolbar hidden
  for single-requirement reports; issues collapsed by default behind
  per-requirement toggles with Expand-all/Collapse-all; requirement text and
  suggestions copyable via `CopyButton` (clipboard failures read inline).
- Delete: footer `DeleteAnalysisButton` with an explicit confirm dialog
  (focus to the safe default, Tab-trapped, Esc cancels, focus returns,
  destructive red reserved for this action); 404-at-confirm resolves to the
  Analyzer like a success; other errors stay open with the honest message.
- Full keyboard + screen-reader support: labelled controls, `aria-expanded` /
  `aria-controls` accordions, named regions, `role=img` chart labels, live
  count announcements, visible focus rings, reduced-motion-safe (no new
  motion beyond existing reveal tokens).

**Architectural decisions:**

- One view, two contexts: the workspace and the route share `AnalysisResultView`
  so the fresh result and the saved report can never drift (props: `result` +
  `context` + footer `actions` slot; `onReset` moved to the workspace).
- Zero recalculation: `lib/reporting.ts` only counts/filters/sorts the
  persisted record (header stats stay persisted counts; row status/sort use
  the rendered nested issues); scores, bands, severities, health are rendered
  verbatim from the API.
- Display pointers, not links: the `document` field carries no id because the
  UI needs no document destination yet — a future download/list stage adds
  one without reshaping the detail.
- Failure honesty over coverage: failed/segmented/clean are distinct designed
  states with explicit copy, not edge cases squeezed into the scored layout.

**Tests:** `verify.sh` ALL GREEN — pytest 325/325 (15 new in
`test_analysis_report.py`: pointer presence/absence, upload↔GET parity,
foreign-404 without leak, absent-document degradation, failed/segmented
read-back, score-consistency, presenter validation), vitest 236/236 (39 new:
10 reporting helpers incl. no-phantom-categories + original-order default, 2
copy button incl. clipboard-denied, 3 summary bars, 1 issue copy, 11 result
view incl. filters/sort/expand-all/failed/segmented/clean/saved-context, 6
delete dialog incl. focus-trap + 404-as-deleted + error-stays-open, 6 report
screen incl. not-found/session/retry), eslint, `tsc`, prettier, `next build`.
Live journey: text + upload → saved route renders identical numbers,
foreign id → shared not-found panel, delete → confirm → Analyzer.

**Known limitations (accepted, not bugs):**

- NO browser in this sandbox (as in Stages 05–08) — report route, toolbar,
  accordions, dialog, and responsive widths NOT pixel-verified, NO
  screenshots ship (`screenshots/` still empty). First browsed environment
  must capture `stage09-*` at 390/768/1440 + the pending
  `stage05/06/07/08-*` sets.
- History UI still absent (Stage 10): saved reports are reachable only via
  the workspace result and direct `/analysis/[id]` URLs — no list, no
  permalinks in-product yet.
- `docker-compose.yml` STILL unvalidated (no Docker in sandbox) — recurring warning.

**Next stage:** Stage 10 (as-built) — Analysis history UI on the ready list
API (search/filter/sort/paginate/delete, ownership-scoped, responsive
table→cards, linking each row to its Stage 09 report); document
list/download endpoints can ride along or follow.

### Stage 10 — Analysis History UI (`/history`) ✅ (2026-09-24)

Authenticated, verified-users-only history page on the ready list API —
search, band/source filters, backend sort, real paging, per-row open + delete,
responsive table→cards. The ONLY backend extension is the search the endpoint
docstring already reserved (`q`) plus the `document` pointer §3 display needs;
everything else is pure UI over the contracted envelopes. Details:

**Completed:**

- Backend (contract §4.3 amendment, additive): `GET /analysis` accepts `q` —
  free-text search over title OR linked document filename
  (case-insensitive substring, blank ignored, LIKE metacharacters literal,
  owner-scoped join, `total` honors `q`); `AnalysisSummary` gains the Stage 09
  `document` pointer (`{filename, file_type} | null`, same leak rules).
  `category`/`severity` stay ignored (issue-level semantics, locked by tests).
- `/history` route (verified-guard + `noindex,nofollow`): `HistoryScreen` with
  loading skeleton; toolbar (350 ms-debounced server search with
  "Searching…" state, band + source selects, 4-option backend sort, honest
  disabled reset); stale-page dimming (`aria-busy`, never presented as
  current); page-clamp when a delete empties the page; live count line.
- `HistoryTable`: ONE semantic table (caption + scoped headers + `aria-sort`)
  that CSS-transforms into cards under 640 px (`data-label` pseudo-labels);
  every cell renders persisted values verbatim (zero recalculation);
  failed/unscored rows read honestly; title + Open link to `/analysis/[id]`;
  compact row delete reusing the Stage 09 confirm dialog (`onDeleted` refetch
  path, no navigation, 404-as-success, mapped errors stay open).
- `HistoryPagination`: envelope-driven only (`page`/`page_size`/`total`),
  hidden on single pages, honest disabled Prev/Next.
- Distinct empties (pristine "No analyses yet" + analyzer CTA and NO toolbar
  vs filtered "No matching results" + clear), code-mapped error panel with
  retry, session-expired sign-in nudge, malformed-payload rejection; back link
  - analyzer cross-link both ways.
- 17 backend tests (`test_analysis_history.py`) + 23 frontend tests (history
  screen/table, debounce hook, compact dialog, `q` passthrough, workspace
  link).

**Verification:** 342/342 pytest, 259/259 vitest (35 files), ruff + eslint +
`tsc` + prettier clean, `./scripts/verify.sh` green (`○ /history` in build —
static shell, list loads client-side behind the verified guard).
Live journey: register → verify → text + upload analyses → history lists both
(`q`/band/source/sort/page honored) → row opens the Stage 09 report with
identical numbers → delete → confirm → row gone without navigation.

**Known limitations (accepted, not bugs):**

- NO browser in this sandbox (as in Stages 05–09) — history route, toolbar,
  table→cards, dialog, and responsive widths NOT pixel-verified, NO
  screenshots ship (`screenshots/` still empty). First browsed environment
  must capture `stage10-*` at 390/768/1440 + the pending
  `stage05/06/07/08/09-*` sets.
- `docker-compose.yml` STILL unvalidated (no Docker in sandbox) — recurring warning.

**Next stage:** Stage 11 (as-built) — document list/download endpoints
(roadmap-09 remainder: no download/list/purge-by-id surface yet) and/or
Dashboard data (roadmap-14: stats/categories/trends endpoints).

### Stage 11 — Analytics Dashboard & Statistics (`/dashboard`) ✅ (2026-09-24)

Authenticated, verified-users-only dashboard turning persisted history into
aggregate statistics — totals, averages, band/source/category/severity
distributions, a UTC-bucketed score trend, and recent runs. ONE aggregate
endpoint (the planned five collapse into a single snapshot — same metric
vocabulary, one round trip, no N+1); the UI renders server aggregates
verbatim and derives nothing. Details:

**Completed:**

- Backend (contract §4.5 amendment): `GET /api/v1/dashboard?range=30d|12w` —
  router → schemas → service → repository, ~9 indexed aggregate queries, zero
  N+1. UTC day buckets (30d) / Monday-start UTC weeks (12w), trailing window
  ending today, ALWAYS zero-filled; averages half-up 1dp over SCORED runs
  only; unscored runs count toward totals/volume but never averages/bands/
  improvements/risk; `latest` = newest run overall (nullable score);
  `improved_count` = strict improvements oldest-first; `high_risk_count` =
  persisted high/very_high; `top_category` count-desc with alphabetical
  tiebreak; full-vocabulary bands/severities/sources (zeros included);
  non-zero categories only (11-detector vocabulary needs no top-N cut); 5
  newest summaries via the existing list path. No `user_id` param exists;
  no ownership ids leak.
- `/dashboard` route (verified-guard + `noindex,nofollow`): `DashboardScreen`
  with loading skeleton, session-gone nudge, code-mapped error + retry,
  wrong-shape rejection, deliberate first-use panel (no zero charts), and
  honest partial states (unscored latest, zero issues, empty windows).
- Sections: type-led stats strip + sources line; `DashboardTrend` (documented
  30d/12w range control, lazy client-only Recharts area+bars with fixed 0–100
  axis + own count axis, real legend, spoken summary, full `<details>` data
  table, nulls as gaps/“—”, stale dimming on range change, reduced-motion
  respected); latest-run card reusing `ScoreRing`; band strip reusing
  `BAND_LABELS`; `CategoryBars` reuse (new optional caption + heading-level
  props, report default preserved); `SeverityMix` (same §7 `sev-*` language
  over aggregates); `RecentAnalyses` compact report links + history entry.
- Post-auth landing flips `/` → `/dashboard` (UI_UX_SPEC §5: the fixed `/`
  was temporary “until the dashboard stage”); the `/` placeholder itself is
  untouched for the SEO/marketing stage.
- 18 backend tests (`test_dashboard.py`: auth gating, empty shape, single/
  multi, rounding half-up incl. the 70.25 → 70.3 banker's trap, tiebreaks,
  failed participation, isolation, `user_id` ignorance, 12w Mondays,
  multi-run buckets, out-of-window runs, bad range, recent cap, leak scan) +
  19 frontend tests (screen states/range/stale/partials/a11y outline,
  trend mapping/table/empty/stale, severity, recent, `CategoryBars` props,
  `getDashboard` passthrough + error code).

**Verification:** 360/360 pytest, 278/278 vitest (40 files), ruff + eslint +
`tsc` + prettier + mypy clean, `./scripts/verify.sh` green (`○ /dashboard`
in build — static shell, snapshot loads client-side behind the verified
guard). Live journey: register → verify → text + upload analyses → dashboard
aggregates both (totals/avg/bands/sources/categories/severity/trend/recent
all match the persisted rows) → range switch re-buckets → recent opens the
Stage 09 report → post-auth landing is `/dashboard`.

**Known limitations (accepted, not bugs):**

- NO browser in this sandbox (as in Stages 05–10) — dashboard route, trend
  chart, range control, cards, and responsive widths NOT pixel-verified, NO
  screenshots ship (`screenshots/` still empty). First browsed environment
  must capture `stage11-*` at 390/768/1440 + the pending
  `stage05/06/07/08/09/10-*` sets.
- `docker-compose.yml` STILL unvalidated (no Docker in sandbox) — recurring warning.

**Next stage:** Stage 12 (as-built) — AI credential vault + provider
management (roadmap-17 spine, shipped early).

### Stage 12 — AI Credential Vault & Provider Management ✅ (2026-09-24)

User-owned encrypted provider keys: Fernet vault, `AIProvider` ABC +
six-provider metadata registry (NO adapters — Stage 18), and six
endpoints (`GET/POST /ai/providers`, `POST …/test`, `PATCH …`,
`POST …/rotate-key`, `DELETE …`). Plaintext exists ONLY in inbound
create/rotate bodies; every response is allowlist-serialized metadata
(`masked_key` = 12 bullets + last4); logs carry ids + provider ids only.
NO settings UI (roadmap-16), NO adapters (roadmap-18), NO generation
(roadmap-19) — deterministic analysis is untouched. Details:

**Completed:**

- Vault (`app/core/vault.py`, `cryptography==50.0.1` pinned): `v1:`
  ciphertext at rest, env-only `ENCRYPTION_MASTER_KEY` (boot-validated —
  absent legal, malformed fails closed naming the variable only), lazy use
  (analysis/dashboard/list work keyless), `sha256(key)[0:16]` fingerprints,
  secret-free `VaultError`s → `500 internal_error`. NO migration — `0001`
  already carried the full `ai_provider_credentials` shape (unique,
  checks, partial indexes).
- ABC + registry (`app/ai/`): `AIProvider` (validate/health/list_models/
  generate_overview/generate_improvement) + `ProviderError` (code +
  user-safe message) + §3 payload/result models with caps; registry order
  (`gemini,groq,openai,anthropic,openrouter,huggingface`), display names,
  allowlisted base URLs, empty-until-Stage-18 adapter map.
- Endpoints (contract §4.6 amendment): bare-array list (registry →
  enabled-first → oldest); shape-only create (always enabled, never
  default); PATCH with contradiction/default-on-disabled 409s, disabled-
  default auto-clear, same-transaction default-claim moves,
  `IntegrityError → 409` on races; rotate (verdict cleared, same-key
  re-save OK, other-row fingerprint 409); delete (204); test OUTSIDE any
  transaction (no txn spans network I/O) on a dedicated 10/min bucket —
  unavailable until adapters (`200 {ok:false}`, `last_test_*` untouched).
- New codes: `404 ai_provider_not_found` (IDOR-safe), service-level `400
validation_error`, explicit `500 internal_error`; `provider_error` /
  `ai_unavailable` reserved for Stage 18+. `GET /models` deferred to
  Stage 18.
- 58 backend tests (`test_ai_vault.py`: roundtrip, non-determinism,
  wrong-key/tampered/malformed, missing-vs-malformed master key,
  fingerprint shape, leak-freedom, registry table/seam; plus
  `test_ai_providers.py`: auth gating, shape/normalizers, 400s/409s,
  order, isolation, default moves, rotation, ciphertext-at-rest proofs,
  unavailable path, fake-adapter ok/failed/error + verdict recording,
  test-bucket 429, vault 500s).

**Verification:** 418/418 pytest, 278/278 vitest (40 files), ruff + eslint +
`tsc` + prettier + mypy clean, `./scripts/verify.sh` green. Live journey:
register → verify → login → create (masked) → list → test (unavailable)
→ default-claim → rotate (new mask, verdict cleared) → dup-create 409 →
delete 204 → list `[]`. Server logs carry credential/owner ids + provider
ids only — no key material anywhere.

**Known limitations (accepted, not bugs):**

- NO browser in this sandbox (as in Stages 05–11) — nothing pixel-verified,
  NO screenshots ship (`screenshots/` still empty). First browsed
  environment must capture the pending `stage05/06/07/08/09/10/11-*` sets
  (Stage 12 adds no UI).
- `docker-compose.yml` STILL unvalidated (no Docker in sandbox) — recurring warning.
- Master-key ROTATION is designed (versioned envelope + `key_version`) but
  the runbook is unwritten — owning stage must document it before prod.

**Next stage:** Stage 13 (as-built) — AI provider settings UI
(roadmap-16 providers slice, shipped early; no backend changes).

### Stage 13 — AI Provider Settings UI (`/settings`) ✅ (2026-09-24)

Authenticated, verified-users-only settings route with the AI-providers
management section on the Stage 12 API (contract §4.6 — no backend
changes, no migrations, deterministic analysis untouched): provider cards
(name, label, masked key, Enabled/Disabled + Default + last-test chips,
last-tested freshness), add dialog (canonical six-provider select with
configured options marked, optional label, masked secret + reveal),
replace-key dialog (masked shown as information only, blank secret),
per-card Test connection (pending guard, inline verdict), enable/disable
switch, Set-as-default, explicit-confirm remove. Every mutation ends in
a silent list refetch (server ordering/flags — no optimistic merges);
test verdict `error` renders verbatim as backend-curated user-safe data.
Details:

**Completed:**

- `/settings` page (`noindex,nofollow`, `ProtectedRoute requireVerified`,
  `○` static shell — content loads client-side behind the guard like
  dashboard/history) + `SettingsScreen` (loading skeleton, session-gone
  nudge, code-mapped error + retry, wrong-shape rejection, deliberate
  first-use panel framing AI as optional, dismissible status notices).
- `types/providers.ts` (contract shapes + the SINGLE provider
  id/display-name vocabulary), `lib/providers.ts` (six §4.6 calls via
  the canonical client + `withSessionRetry`; browser never contacts
  providers directly), `lib/provider-errors.ts` (code→copy with
  per-action `conflict` copy, test-bucket 429 copy, reserved
  `provider_error`/`ai_unavailable` mapping, `validation_error` field
  mapping via the shared traversal).
- `ProviderCard` (five server-backed actions, per-action pending,
  verdict + session-aware inline errors), `ProviderDialog` (add/rotate
  modes, UX-only client validation, secret cleared on success/close/
  session-loss with safe selections preserved), `DeleteProviderDialog`
  (safe default, Esc, focus trap + return, pending, 404-as-success),
  `CredentialField` (masked + text-labeled reveal), settings-local
  `DialogShell` (shared dialog chrome; global Dialog primitive still
  pending). Reused: TextField/FormAlert/SubmitButton, Container, Reveal,
  ProtectedRoute.
- Drive-by fix: `.btn-primary` (referenced by `SubmitButton` since
  Stage 05 but never defined — auth submits rendered unstyled) is now
  defined in `globals.css`; `SubmitButton` takes a layout override for
  dialog rows. Visual-only, zero behavior change.
- 63 frontend tests (`providers`/`provider-errors` libs: bodies/URLs/
  methods, code propagation, refresh-retry, copy × contexts, field
  mapping; card: rendering/chips/switch/test pending+verdicts/unavailable
  /429/session/toggle/default/failure-no-flip; screen: load states,
  verify gate, empty state, add validation/success/409/field-errors/
  session-secret-clear/reveal/Esc, rotate masked-not-editable/success/
  409, delete focus/Esc/trap/pending/404/500/session, refetch-after-every-
  mutation, stale-refresh honesty, storage/URL/DOM secret-lifecycle,
  keyboard switch, announcements).

**Verification:** 418/418 pytest (backend untouched), 341/341 vitest
(44 files; new suites re-run 5× after fixing one sync-on-h1 race),
ruff + eslint + `tsc` + prettier + mypy clean, `./scripts/verify.sh`
green (`○ /settings` in build). Live journey: SSR `/settings` 200 +
noindex + bootstrap shell; `/dashboard` `/history` `/analyzer` `/login`
all 200 (regression); register → verify → login → deterministic analysis
with NO provider (score 70 — pipeline fully functional) → history →
dashboard → provider create → disable → test-while-disabled → delete →
empty list.

**Security notes (SECURITY_SPEC §11 — frontend-only stage):**

- No new `{id}` routes, no backend/schema/env changes — ownership/IDOR
  posture unchanged from Stage 12 (UI surfaces 404s as not-found).
- No secret/token/log exposure: no `console.log`, no
  `localStorage`/`sessionStorage` writes (asserted in tests), no
  `dangerouslySetInnerHTML`, keys only in create/rotate JSON bodies
  (never URLs — asserted), no browser→provider calls (every request
  URL asserted backend-prefixed; base URLs stay server-side).
- Errors switch on backend `code` (never `message`); the sole verbatim
  backend string is the curated, capped test-verdict `error` field.
- Rate limit: test action honors the 10/min bucket with dedicated 429
  copy; pending guards prevent accidental duplicates.

**Known limitations (accepted, not bugs):**

- NO browser in this sandbox (as in Stages 05–12) — settings route,
  cards, dialogs, reveal toggle, switch, and responsive widths NOT
  pixel-verified, NO screenshots ship (`screenshots/` still empty).
  First browsed environment must capture `stage13-*` at 390/768/1440 +
  the pending `stage05/06/07/08/09/10/11-*` sets.
- `docker-compose.yml` STILL unvalidated (no Docker in sandbox) — recurring warning.
- `/settings` holds ONLY the AI-providers section (profile/password/
  privacy/account-deletion still future — same route, later sections);
  no navbar links to it yet (Navbar is an owning-stage item); label
  editing and `fallback_rank` are intentionally unsurfaced (no
  user-meaningful effect until Stage 19 fallback).

**Next stage:** Stage 14 (as-built) — live AI enhancement (adapters +
chain + report UI; the roadmap-18/19/20 slice).

### Stage 14 — Live AI Enhancement (adapters + chain + report UI) ✅ (2026-09-24)

Optional AI enhancement goes live on TEXT + upload analyses with the
deterministic pipeline authoritative throughout (commits first; AI can
never block or alter it; no transaction spans provider network I/O).
`options.ai_enhance` (live — was accepted-and-ignored through Stage 13):
`false` → `skipped` without touching providers; `true` + no enabled
credential → `unconfigured`; enabled-but-adapterless → `failed` +
"<Label> integration isn't available yet."; overview success → `ok`
(overview + winning-provider id + ≤10 `suggestion_source: "ai"` rewrites
on requirements WITH issues, originals immutable); exhaustion → `failed`

- FIRST (default-first) provider error ≤300 chars. Chain = default →
  fallbacks in rank order, max 3, failover on overview failure only.
  Details:

**Completed:**

- `app/ai/adapters/` (shared httpx core + OpenAI-compat base + 3
  subclasses + Gemini; stateless singletons in `BUILTIN_ADAPTERS`),
  `app/ai/models.py` (model-id SSOT), `app/ai/prompts/` (`overview_v1` +
  `improvement_v1`, delimited + injection-framed), `app/ai/sanitize.py`
  (≤8000 chars, honest truncation marker), `registry.resolve_adapter`
  (fake → builtin → None; `get_adapter` stays fake-only),
  `services/ai_enhancement.py` (post-commit orchestration + short outcome
  txn), repo seams (`list_enabled_chain`, `record_ai_result`,
  `set_suggested_rewrites`), dataclass/schema/presenter `ai_*` mapping
  (4-value `ai_status` literal, drift-500s), `AI_DEFAULT_TIMEOUT_S` (25)
  - `AI_MAX_TIMEOUT_S` (60) boot-validated settings, upload `ai_enhance`
    form field, TEST live for the four (cheap probe + curated list).
- Frontend: `aiEnhance` through `CreateAnalysisInput`/`UploadDocumentInput`
  (`options` body / explicit FormData field), opt-in checkbox + Settings
  link on both analyzer forms, `AiOverviewSection` (4 states, provider
  attribution, verbatim error with NO retry button, plain-text render),
  `RequirementCard` rewrite block (AI-labeled, additive-only). History/
  dashboard untouched (no summary AI fields — no contract churn).
- 50 backend tests (34 mocked-HTTP adapter/prompt/sanitize/model-table +
  16 fake-adapter enhancement endpoint/chain/cap/security) + 15 frontend
  tests (lib bodies, checkboxes + FormData flags, 4 AI states, XSS-inert
  render, rewrite labeling, full-view integration). Updated: the
  groq-unavailable TEST test → anthropic (deferred), the raw-seam
  registry test → builtins/deferred/shadow contract, the
  accepted-and-ignored `ai_enhance` test → `unconfigured`.

**Verification:** 470/470 pytest + 356/356 vitest, ruff + `tsc` + eslint +
prettier + mypy clean, `./scripts/verify.sh` green. Live journeys:
register → verify → login → `ai_enhance:false` (skipped) →
`ai_enhance:true` with NO provider (unconfigured, deterministic intact,
GET-after identical) → upload with `ai_enhance` on/off parity → deferred
(anthropic) credential → `failed` with guidance (no network attempted) →
bogus-key groq TEST (live transport path confirmed: blocked egress →
normalized `unavailable` + verdict recorded, no key material involved).
No provider keys exist in any test or journey (fakes/MockTransport/bogus
only).

**Security notes (SECURITY_SPEC §4/§6):**

- Keys decrypt per chain attempt into adapter-call locals only (headers,
  never URLs — Gemini uses `x-goog-api-key`); never persisted, logged,
  returned, or attached to exceptions (asserted: key absent from every
  enhancement/TEST response body).
- Logs carry provider ids + error codes + latency + model only (no
  prompts/outputs/keys/exception text — crashes log the exception TYPE,
  no traceback); raw provider bodies never propagate (`ProviderError`
  user-messages are adapter-curated).
- AI text sanitized pre-persist AND React-escaped at render (defense in
  depth, plain text only); prompts delimit payloads as data with
  ignore-instructions framing (injection strings stay inert — tested).
- Egress minimized: finding summaries / one requirement at a time, to the
  user's OWN provider over HTTPS; no cross-user batching/caching.

**Known limitations (accepted, not bugs):**

- Anthropic + Hugging Face adapters DEFERRED (distinct REST shapes;
  re-entry = adapter + model row + flip the deferral tests); their TEST
  stays deterministically unavailable and enhancement reports `failed`
  with guidance. `POST /analysis/{id}/retry-ai` still future (no Retry
  button ships until it exists); creation-time live key proof still
  future (creation stays shape-only); per-run what-was-sent disclosure
  copy still future (model disclosed in logs only).
- NO browser in this sandbox (as in Stages 05–13) — checkbox, AI block
  states, rewrite styling, and responsive widths NOT pixel-verified, NO
  screenshots ship (`screenshots/` still empty). First browsed
  environment must capture `stage14-*` at 390/768/1440 + the pending sets.
- `docker-compose.yml` STILL unvalidated (no Docker in sandbox).
- Worst-case sync latency is uncapped beyond per-call timeouts
  (1 overview + ≤10 improvements at concurrency 4, each ≤60 s + retries
  × up to 3 chain attempts) — a future async/job stage owns budgets.

**Next stage:** Stage 15 (as-built) — document list/download endpoints
(roadmap-09 remainder) and/or Settings remainder (roadmap-16:
profile/password/privacy sections) and/or the `retry-ai` endpoint.

### Stage 15 (as-built) — AI results integration & trust UX ✅ (2026-09-24)

Roadmap row 15 ("Dashboard visualization") was already absorbed by the actual
Stage 11, so this as-built Stage 15 reuses the slot for §§2-19 scope: the
Stage-14 AI results made understandable/trustworthy inside the shared report
(deterministic authoritative; AI additive). Frontend only — NO backend, API,
schema, or migration change.

- `AiOverviewSection`: `rewriteCoverage` prop + explicit review disclaimer on
  `ok` + `line-clamp-6` Show more/less disclosure for overviews > 600 chars
  (`useId` + `aria-expanded`/`aria-controls`) + honest derived partial-coverage
  note ("AI rewrites cover X of Y") only when flagged > rewritten.
- `RequirementCard`: `Copy suggestion` button (shared `CopyButton`) + "Review
  before applying" microcopy on AI-suggested rewrites.
- `AnalysisResultView`: deterministic-first IA — score → overview cards →
  `Issue categories` → `Requirement health` → `AiOverviewSection` → flagged
  requirements; `rewriteCoverage` derived from the report payload.
- Both enhance forms: AI-aware pending label ("Analyzing with AI
  (deterministic results first, AI enrichment follows)…").
- Saved-report parity: everything derives from persisted `ai_*`/rewrite fields
  — no new fetch; all new copy covered in fresh-analysis AND saved-report tests.
- 470/470 pytest + 368/368 vitest (+12 frontend), tsc/eslint/prettier clean,
  `verify.sh` green. Non-goals preserved: no `retry-ai`, no new providers
  (anthropic/HF stay deferred), no model/timestamp persistence, no
  chatbot/RAG/embeddings.
- NO browser in this sandbox (as in Stages 05–14) — disclaimer, copy button,
  disclosure, coverage note, and reordered sections NOT pixel-verified, NO
  screenshots ship (`screenshots/` still empty). First browsed environment
  must capture `stage15-*` at 390/768/1440 + the pending sets.

**Next stage:** Stage 16 (as-built) — document list/download endpoints
(roadmap-09 remainder) and/or Settings remainder (roadmap-16:
profile/password/privacy sections) and/or the `retry-ai` endpoint.

### Stage 16 (as-built) — Settings remainder (profile, password, privacy, deletion) ✅ (2026-09-24)

Closes roadmap-16 (providers slice shipped early in Stage 13). Profile backend

- all four remaining `/settings` sections; NO migration (`users.display_name`
  pre-existed), NO privacy endpoints (fake-control rule — see below).

* Backend: `GET/PATCH /settings/profile` (verified-only, default verified-mutation
  bucket) via `endpoints/settings.py` + `schemas/settings.py` + `services/settings.py`
  - `UserRepository.set_display_name`. Display name trimmed, ≤100 chars, explicit
    null/blank clears, field required (absent ≠ clear). No `{id}` — the session IS
    the selector (no IDOR surface). Rejected writes persist nothing (tested).
* Frontend: `ProfileSection` (read-only email, editable name, self-contained
  fetch states, `refreshUser` sync on save, field-OR-form single-announcement
  errors), `ChangePasswordForm` mounted as-is, `PrivacySection` (honest lifecycle
  statement + History link, zero fake controls), `DeleteAccountDialog`
  (exact-DELETE arming, safe-default focus, honest mid-delete 401 copy) →
  farewell panel + `clearAuth` on 204. New `lib/settings` + `lib/settings-errors`
  - `deleteAccount` clients (all `withSessionRetry`-safe).
* Contract: API_CONTRACT §4.7 finalized — profile fields final; privacy/export/
  purge names RESERVED for Stage 23 with the rationale recorded (a retention
  setting with no enforcement would be a fake control, UI_UX_SPEC §9).
* 482/482 pytest (+12) + 384/384 vitest (+16: profile ×6, delete dialog ×4,
  screen ×6), tsc/eslint/prettier + ruff/mypy clean, `verify.sh` green, live
  journey (register→verify→login→PATCH profile→DELETE account→0 rows) green.
* Security notes (§11): no new `{id}` routes (ownership N/A by construction);
  schemas cap lengths (100) with envelope 400s; no secret/token/log exposure
  (display names never logged); mutation bucket inherited from the verified
  guard; deletion semantics unchanged from Stage 04 (rows cascade; storage
  objects still orphan — Stage 23 owns the purge per DATABASE_SCHEMA §4).

**Known limitations (accepted, not bugs):**

- NO browser in this sandbox (as in Stages 05–15) — profile/password/privacy/
  farewell sections NOT pixel-verified, NO screenshots ship (`screenshots/`
  still empty). First browsed environment must capture `stage16-*` at
  390/768/1440 + the pending sets.
- Privacy section is statement-only until Stage 23 (retention/export/purge);
  unverified users can't reach `/settings` (verified-gated) so UI deletion is
  verified-only — the API itself stays identity-authed as since Stage 04.
- `docker-compose.yml` STILL unvalidated (no Docker in sandbox).

**Next stage:** Stage 17 (as-built) — document list/download endpoints
(roadmap-09 remainder) and/or the `retry-ai` endpoint (roadmap-20 remainder)
and/or anthropic/HF adapters (roadmap-18 remainder).

## Stage 26 — SEO foundation, metadata & discoverability infrastructure (COMPLETE)

**Scope delivered:**

- Reconciled Stage 25 as complete (`fa3a49e`) and read the SEO/status/roadmap/spec route
  contracts before editing. Baseline frontend verification before edits passed: eslint,
  typecheck, Vitest (`50 files / 412 tests`), and Next production build.
- Route inventory/policy: `/` is the only intentionally public/indexable route. Private
  authenticated app routes (`/analyzer`, `/analysis/[id]`, `/dashboard`, `/history`,
  `/settings`) and auth utility routes (`/login`, `/signup`, `/forgot-password`,
  `/reset-password`, `/verify-email`) are non-indexable and excluded from sitemap/public
  structured data. API/internal paths remain outside SEO and `/api/` is disallowed.
- Centralized SEO layer: `frontend/src/lib/seo.ts` now owns public/private route registries,
  `NEXT_PUBLIC_SITE_URL` origin normalization, canonical URL construction, public metadata,
  strict private `noindex,nofollow` metadata, robots policy, sitemap entries, and generic
  home-page structured data. `frontend/src/lib/site.ts` is the single canonical app-copy/origin
  source.
- Public landing foundation: replaced the Stage 01 placeholder `/` with a semantic product
  overview, one `h1`, descriptive CTAs, safe example copy, and generic JSON-LD. No user SRS
  text, document names, analysis IDs, provider keys, tokens, or private report data are used
  in public metadata/content.
- Public metadata/assets: `/` has a stable title/description, canonical, Open Graph, and
  Twitter large-card metadata using the project-owned 1200×630 asset
  `frontend/public/og/srs-ambiguity-detector.svg`. Root layout keeps only safe global
  app metadata/icons so private routes do not inherit public canonicals/social metadata.
- Robots/sitemap: `robots.ts` allows `/` and disallows `/api/`, private app routes, auth
  routes, and token-sensitive query patterns. `sitemap.ts` is generated from the public-route
  registry and currently emits only `/` with stable `lastModified`; it deliberately omits
  auth, token, API, private app, and `/analysis/[id]` URLs.
- Private/auth/404 hardening: analyzer/dashboard/history/settings/analysis-detail/auth pages
  and the not-found page now use the centralized noindex policy and no canonical/OG/Twitter
  metadata. Reset/verify token query strings are never used in metadata or sitemap.
- Structured data: home page emits only real generic `WebSite` and `SoftwareApplication`
  entries; no aggregate ratings, reviews, testimonials, awards, organization/location claims,
  or user-specific analysis/document data.

**Verification:**

- Pre-edit baseline frontend: `cd frontend && npm run lint && npm run typecheck && npm test && npm run build` → all passed (`50 files / 412 tests`; Next build green).
- Focused Stage 26 checks: `cd frontend && npm run lint && npm run typecheck && npm test -- seo` → all passed (`2 files / 13 tests`).
- Production build after SEO changes: `cd frontend && npm run build` → passed; generated routes include `/`, `/_not-found`, private/auth pages, `/robots.txt`, and `/sitemap.xml`.
- Build-artifact spot check after the production build: generated robots output allowed `/` and disallowed `/api/`, private/auth routes, and token query patterns; generated sitemap contained only `http://localhost:3000/`; generated private/auth HTML contained `noindex,nofollow`; home HTML contained canonical/description/OG/Twitter metadata and the project-owned OG image.
- Final full gate: `PATH="$HOME/.local/bin:$PATH" TEST_DATABASE_URL="postgresql+asyncpg://postgres@/postgres?host=/home/user/pgdata" DATABASE_URL="postgresql+asyncpg://postgres@/postgres?host=/home/user/pgdata" ./scripts/verify.sh` → ALL CHECKS PASSED. Backend pytest summary in this sandbox: 230 passed, 347 skipped, 1 Starlette warning because no PostgreSQL server/socket is installed/running at `/home/user/pgdata`. Frontend Vitest: 52 files / 425 tests passed. Next production build, Prettier, secret scan, npm audit, and pip-audit passed.

**Known limitations (accepted, not bugs):**

- Browser-based validation was not available in the sandbox unless separately reported; no Search
  Console submission, Rich Results Test, OG-card crawler validation, or Core Web Vitals field
  measurement was performed. Those remain Stage 27/deployment work.
- Only `/` is public today. Stage 26 deliberately did not fabricate `/features`, `/how-it-works`,
  `/resources/*`, `/privacy`, or `/terms`; Stage 27 owns deeper evergreen content/internal links.
- Open Graph asset is a static project-owned SVG. External social platforms may have stricter
  image-format caching rules; real crawler validation remains Stage 27/deployment work.
- Distributed rate-limit storage remains future and unrelated to SEO foundation.

**Next stage:** Stage 27 — SEO content/validation, unless the user explicitly prioritizes the
remaining distributed limiter-store slice first.

## Stage 27 — SEO content & public discoverability (COMPLETE)

**Scope delivered:**

- Reconciled Stage 26 as complete (`27903e8`) and verified the actual implementation before
  editing: `/` was the only public/indexable route; private/auth routes used centralized
  noindex metadata; sitemap contained only `/`; robots disallowed API/private/auth/token
  routes; OG/Twitter and generic home JSON-LD existed; no Stage 27 content routes existed.
- Baseline before edits: `cd frontend && npm run lint && npm run typecheck && npm test && npm run build`
  passed (`52 files / 425 tests`; Next build green).
- Public content architecture: added `/features`, `/how-it-works`, `/resources`,
  `/resources/what-is-srs-ambiguity`, and `/resources/write-clearer-requirements`, all static
  App Router pages with unique metadata, canonical URLs, OG/Twitter metadata, internal links,
  and truthful product/educational copy.
- Shared public shell: `frontend/src/components/public/PublicShell.tsx` provides public
  header/footer navigation only to real public routes plus login/signup CTAs. It does not
  present private analyzer/report/history/dashboard/settings routes as public marketing pages;
  the existing authenticated-user analyzer shortcut remains user-state-only UI, not metadata.
- Content source of truth: `frontend/src/lib/public-content.ts` centralizes public route facts,
  resource cards, health dimensions, and the 11 actually implemented deterministic detector
  categories: vague quantifiers, subjective terms, missing measurable criteria, ambiguous
  operators, undefined terminology, passive voice/unclear actor, pronoun references, absolute
  language, optional language, missing constraints, and incomplete requirements.
- Educational content: resource pages explain what SRS ambiguity is, why ambiguity causes
  implementation/test confusion, currently detected categories, synthetic examples, risks,
  clarification patterns, and practical clearer-requirement rewrite patterns. The copy
  explicitly states that human review is still required and the tool does not prove universal
  correctness.
- Product content: `/features` and `/how-it-works` describe implemented capabilities only:
  pasted text, PDF/DOCX/TXT upload, extraction/normalization, segmentation, deterministic
  detectors, severity/reasons/recommendations, heuristic scoring, health dimensions, private
  reports/history/dashboard/settings, short-lived authenticated document download workflows,
  and optional user-configured AI overview/rewrite assistance. Unsupported claims such as OCR,
  perfect detection, certifications, fake rankings, reviews, ratings, awards, and customer
  counts were not added.
- SEO expansion: `PUBLIC_ROUTES`/sitemap/robots now include the six public routes and continue
  to exclude API, auth, token, private app, and `/analysis/[id]` URLs. Public pages have unique
  titles/descriptions/canonicals/OG/Twitter metadata. Breadcrumb JSON-LD and Article JSON-LD
  were added for content pages; home keeps generic `WebSite` + `SoftwareApplication` JSON-LD.
  Fake reviews/ratings/prices/testimonials/awards remain absent.
- Private/token safety: analyzer, analysis detail, dashboard, history, settings, auth pages,
  token-capable reset/verify routes, and 404 remain noindex/nofollow and excluded from sitemap
  and public structured data. Public content uses only synthetic examples and generic product
  copy, not user SRS text, document names, analysis IDs, provider credentials, tokens, or
  user-specific statistics.
- Tests added/updated: SEO helper and route-contract tests now cover all public pages,
  sitemap/robots inclusion/exclusion, metadata, noindex privacy boundaries, structured data,
  token safety, route-file existence, resource-card route alignment, and detector-category
  public content safety.

**Verification:**

- Baseline before edits: `cd frontend && npm run lint && npm run typecheck && npm test && npm run build` → all passed; frontend Vitest `52 files / 425 tests`; Next build green.
- Focused Stage 27 checks: `cd frontend && npm run lint && npm run typecheck && npm test -- seo public-content` → passed (`3 files / 20 tests`).
- Production build after content changes: `cd frontend && npm run build` → passed; generated route list includes `/features`, `/how-it-works`, `/resources`, `/resources/what-is-srs-ambiguity`, and `/resources/write-clearer-requirements`.
- Build-artifact spot checks: generated robots allows all public routes and disallows API/private/auth/token-sensitive paths; generated sitemap contains only the six public URLs; public HTML contains unique title/description/canonical/OG/Twitter metadata; private/auth generated HTML still contains `noindex,nofollow`; public generated pages scan clean for fake SEO claims and private-data markers.
- Final full gate: `PATH="$HOME/.local/bin:$PATH" TEST_DATABASE_URL="postgresql+asyncpg://postgres@/postgres?host=/home/user/pgdata" DATABASE_URL="postgresql+asyncpg://postgres@/postgres?host=/home/user/pgdata" ./scripts/verify.sh` → ALL CHECKS PASSED. Backend pytest summary in this sandbox: 230 passed, 347 skipped, 1 Starlette warning because no PostgreSQL server/socket is installed/running at `/home/user/pgdata`. Frontend Vitest: 53 files / 432 tests passed. Next production build, Prettier, secret scan, npm audit, and pip-audit passed.

**Known limitations (accepted, not bugs):**

- Browser/mobile/desktop visual validation was not available unless separately reported; repository checks and build artifacts were used instead.
- No Search Console submission, Rich Results Test, OG-card crawler validation, deployment-domain validation, or Core Web Vitals field measurement was performed in this sandbox.
- Stage 27 established a small static resource architecture, not a CMS/blog/backlink/analytics platform.
- `/privacy` and `/terms` still do not exist because legal policy content is not specified; they were not fabricated.
- Distributed rate-limit storage remains future and unrelated to SEO content.

**Next stage:** Stage 28 — responsive/accessibility refinement, unless the user explicitly prioritizes the remaining distributed limiter-store slice first.

## Additional completed stages (as-built continuation)

### Stage 17 (as-built) — `retry-ai` endpoint + report Retry button ✅ (2026-09-24)

Scope note: the Stage 17 prompt framed a "final QA / release verification"
pass, but the repo is mid-roadmap (roadmap-21+ hardening and stages 22–32
all unfinished; roadmap-17 itself shipped early in Stage 12). Per the
prompt's own repo-authority rule, this as-built Stage 17 implements ONE
remainder from the documented next-pointer: the roadmap-20 `retry-ai`
slice (the other two — document list/download, anthropic/HF adapters —
stay explicitly future). No QA-rewrite; narrow vertical slice only.

- Backend: `POST /analysis/{id}/retry-ai` → 200 `RetryAiResponse`
  (verified + CSRF guarded, default verified-mutation bucket — a dedicated
  AI bucket is Stage 22's per AI_PROVIDER_SPEC §9). `retry_analysis_ai`
  (services/analysis.py): owner-scoped lookup (404, byte-identical to
  missing) → reset txn (AI payload NULLed, `ai_status` held, AI-stamped
  rewrites dropped via `clear_ai_rewrites` — rule-sourced untouched) →
  re-read → the SHARED `enhance_analysis` (same chain/caps/fail-open —
  no parallel AI path). Any prior `ai_status` accepted (explicit action);
  deterministic columns never written; presenter-validated response.
- Frontend: `retryAi` client (`withSessionRetry`-safe) + "Try again" on
  the failed card (pending `Retrying…`, code-mapped errors via
  `analysisErrorMessage`, session-gone sign-in link; no wiring, no
  button). Both parents wired: saved `/analysis/[id]` bumps its fetch
  attempt (silent — ready report stays rendered), fresh workspace swaps
  `setResult(await getAnalysis(id))` (rejections surface mapped, no crash).
- 494/494 pytest (+12) + 396/396 vitest (+12: client ×3, section ×6,
  pass-through ×1, saved ×1, fresh ×1), tsc/eslint/prettier + ruff/mypy
  clean, `verify.sh` green, live journey green (failed→retry→ok with the
  fake-adapter seam at the HTTP layer + stale-rewrite + determinism proofs
  in-suite).
- Security notes (§11): no new `{id}` semantics (same owner-scope + 404 +
  400-malformed rules as the detail GET, all tested); no new secret/log
  surface (ids + codes only, inherited); mutation bucket inherited from
  the verified guard; no contract drift (specs amended in-stage).

**Known limitations (accepted, not bugs):**

- NO browser in this sandbox (as in Stages 05–16) — Retry button, pending,
  and silent re-read NOT pixel-verified, NO screenshots ship
  (`screenshots/` still empty). First browsed environment must capture
  `stage17-*` at 390/768/1440 + the pending sets.
- `docker-compose.yml` STILL unvalidated (no Docker in sandbox).
- Sandbox note: this session's environment was a FRESH clone (local branch
  reset to the base commit, toolchains absent). Recovered via
  `git fetch` + `reset --mixed` to `origin/arena/…` (tree verified
  byte-identical to `ed25c93`, zero loss), then bootstrapped pip/npm +
  a pgserver holder. No repo content changed by the recovery.

**Next stage:** Stage 18 (as-built) — document list/download endpoints
(roadmap-09 remainder) and/or anthropic/HF adapters (roadmap-18 remainder).

### Stage 18 (as-built) — Anthropic + Hugging Face adapters (all six live) ✅ (2026-09-24)

Scope note: the Stage 18 prompt framed a "final documentation / submission
readiness" pass, but the repo is mid-roadmap (stages 19–32 including
roadmap-31 docs/screenshots all unfinished). Per the prompt's own
repo-authority rule, this as-built Stage 18 implements ONE remainder from
the documented next-pointer: the roadmap-18 anthropic/HF adapters (the
document list/download remainder stays explicitly future — a bigger slice
with new signed-URL crypto design + open UI questions).

- Backend: `AnthropicProvider` (`POST /v1/messages` — model/max_tokens/
  top-level `system` + one user message with the SAME versioned prompt
  text; `x-api-key` + pinned `anthropic-version: 2023-06-01` headers;
  `GET /v1/models` probe; content-block join in `_extract`, 401 → auth
  via the shared core, no `_client_error` override) and
  `HuggingFaceProvider` (thin `OpenAICompatAdapter` subclass over
  `router.huggingface.co` — the documented OpenAI-compatible Inference
  Providers surface: `POST /v1/chat/completions`, `GET /v1/models`
  probe, Bearer token). The registry's legacy `api-inference` HF host
  NO LONGER RESOLVES (NXDOMAIN, verified 2026-09-24) — the metadata row
  now pins the router origin. Model table gains `claude-sonnet-5` (+
  `claude-haiku-4-5`) and `openai/gpt-oss-120b` (+ `Qwen/Qwen3-8B`);
  `BUILTIN_ADAPTERS` holds all six singletons. Enhancement + TEST keep
  their no-adapter branches as defense-in-depth for a not-yet-wired
  future provider (wording updated, behavior unchanged).
- Tests: the four deferral tests flipped — vault resolves all six
  builtins (unknown ids still miss), TEST + enhancement + retry pin the
  defensive branches via monkeypatched `resolve_adapter → None`; two
  re-entry proofs added (anthropic TEST reaches its adapter,
  anthropic credential enhances through the chain). New mocked-HTTP
  coverage: Anthropic request/response shaping, versioned probe,
  auth-no-retry, 400 → `bad_response`, empty/non-text content; HF
  router-host wiring; model table covers all six.
- 504/504 pytest (+10) + 396/396 vitest (unchanged — zero UI delta, the
  provider labels already listed all six), ruff/mypy clean, `verify.sh`
  green. No migration, no contract change (specs amended in-stage).
- Security notes (§11): no new secret/log surface (ids + codes only);
  both keys travel in headers, never URLs (asserted); the router
  `base_url` stays an allowlisted server-side constant (SSRF rule
  intact); no new `{id}` semantics, buckets, or envelope shapes.

**Known limitations (accepted, not bugs):**

- NO live provider calls in this sandbox (egress blocked, no real keys):
  both adapters are verified against mocked HTTP shaped from the
  providers' official API docs (verified 2026-09-24). First keyed
  environment should TEST one credential per new provider.
- `docker-compose.yml` STILL unvalidated (no Docker in sandbox).
- Sandbox note: warm session (same checkout — Postgres holder, venv, and
  node_modules all survived); baseline re-verified (494/494) before any
  change. No recovery needed.

**Next stage:** Stage 19 (as-built) — document list/download endpoints
(roadmap-09 remainder).

### Stage 19 (as-built) — document list/download endpoints (roadmap-09 closed) ✅ (2026-09-24)

Scope note: the Stage 19 prompt framed a "final release packaging /
submission validation" pass, but the repo is mid-roadmap (stages 20–32
including roadmap-31 docs/screenshots all unfinished). Per the prompt's own
repo-authority rule, this as-built Stage 19 implements the documented
next-pointer: the roadmap-09 download/list/purge-by-id surface (the last
roadmap-09 remainder — the row is now FULLY closed).

- Backend: `GET /documents` (owner-scoped newest-first `Page[Document]`,
  verified-only, no filters in v1), `DELETE /documents/{id}` (verified +
  CSRF, default bucket → 204; row + storage object in one transaction,
  rows first — referencing analyses survive via `SET NULL`, their
  `document` pointer degrading to null), `POST /documents/{id}/
download-url` (verified + CSRF + dedicated 10/min bucket → 200
  `{download_url, expires_at}`), and `GET /documents/{id}/download?
token=…` (no session — the short-lived single-document HS256 bearer
  `type: document_download` IS the credential; 400 `invalid_token` on
  expired/forged/wrong-type/wrong-document, 404 when deleted after mint).
  Bytes are re-hashed against the stored sha256 before release (missing/
  corrupt object → honest 500, ids-only logs); served under the
  server-detected MIME as `attachment` (legacy `filename` + RFC 5987
  `filename*`, never `inline`) with the global `nosniff`. Storage port
  gains the bounded `read_bytes` (objects ≤10 MiB by upload invariant);
  new settings `DOCUMENT_DOWNLOAD_URL_MINUTES` (15 — the §5 cap is
  boot-enforced) + `RATE_LIMIT_DOCUMENT_DOWNLOAD_PER_MINUTE` (10).
  No migration, no new error codes (all reused).
- Frontend: `listDocuments` / `deleteDocument` /
  `mintDocumentDownloadUrl` clients + `DocumentDownloadUrl` /
  `ListDocumentsParams` types + `resolveDownloadUrl` (origin-relative
  path → absolute URL via `new URL(path, apiBaseUrl())` — a naive join
  would double the `/api/v1` prefix; caught by test). No new UI — no
  download/list surface is specified in UI_UX_SPEC; a future slice may
  hang a "download original" affordance on the history/report views.
- 533/533 pytest (+29: storage ×3, list ×4, delete ×6, download ×16 incl.
  a full upload→list→mint→download→purge roundtrip) + 402/402 vitest
  (+6 documents client tests), ruff/mypy/eslint/tsc/prettier clean,
  `verify.sh` green (specs amended in-stage).
- Security notes (§11): the bearer-in-query is the spec-mandated signed-
  URL shape (S3/Supabase-presigned idiom) — safe here by tight scope
  (single doc, ≤15 min, type-separated from session JWTs in BOTH
  directions) + the path-only access log (query strings never logged) +
  no endpoint echoing the token (asserted); owner-scoped 404s identical
  to missing on all four routes (no oracle); CSRF on both mutations;
  filenames stay display-only (disposition built from the sanitized
  name, ASCII fallback + quoted `filename*`); no new secrets, buckets,
  or envelope shapes beyond the specced mint response.

**Known limitations (accepted, not bugs):**

- NO browser in this sandbox (as in Stages 05–18) — new clients NOT
  click-verified, NO screenshots ship (`screenshots/` still empty).
  First browsed environment must capture the backlog at 390/768/1440.
- `docker-compose.yml` STILL unvalidated (no Docker in sandbox); the
  Supabase storage path is unexercised (local adapter only here).
- Sandbox note: FRESH single-branch clone (only `main` fetched, so the
  session history looked absent at first — `git ls-remote` revealed the
  remote tip `1cba530` intact). The tree was verified byte-identical to
  that tip, the 504/504 baseline re-run green, and Stage 19 commits
  directly on top — no recovery commit, no history lost. Toolchains
  rebuilt (pip --user + npm + pgserver holder). Lesson: single-branch
  clones hide remote refs from `git branch -a`; check `ls-remote` before
  declaring history unrecoverable.

**Next stage:** Stage 20 (as-built) — security hardening (roadmap-21)
and/or the remaining AI slices (creation-time key proof, per-run
what-was-sent disclosure).

### Stage 20 (as-built) — security hardening (roadmap-21 closed) ✅ (2026-09-24)

Scope note: the Stage 20 prompt framed a "FINAL HANDOFF / CLOSURE" pass,
but the repo is mid-roadmap (stages 21–32 including roadmap-31
docs/screenshots all unfinished). Per the prompt's own repo-authority
rule, this as-built Stage 20 implements the documented next-pointer:
roadmap-21 security hardening (CSP, OpenAPI prod posture, npm/pip
audits, secret-scan docs, header review). The remaining AI slices
(creation-time key proof, per-run disclosure) stay future.

- Backend: prod-only framing denial (`X-Frame-Options: DENY` +
  `Content-Security-Policy: frame-ancestors 'none'`) in the security
  headers middleware, next to the existing HSTS; full header review
  (baseline trio always-on, HSTS + framing prod-only, docs surface
  gated out of production — asserted both ways incl. error envelopes).
- Frontend: report-only CSP (`Content-Security-Policy-Report-Only`,
  prod-only) built by `src/lib/csp.ts` — `default-src 'self'`,
  Next inline runtime allowed under observation, `connect-src` self +
  API origin from `NEXT_PUBLIC_API_URL`, `object-src 'none'`,
  `base-uri 'self'`, framing `none`; the minimal enforced framing
  directive stays (clickjacking already solved).
- Audits gate `verify.sh`: `npm audit` strict (0 vulnerabilities);
  `pip-audit` (now pinned in requirements-dev) with 7 per-ID
  `--ignore-vuln` accepts — fails only on NEW advisories. pytest
  8.3.4 → 9.1.1 (fixes PYSEC-2026-1845, suite green); the 7 starlette
  0.41.3 findings are accepted with per-finding reachability notes in
  SECURITY_SPEC §10 (none critically reachable; framework-major
  migration deferred to a dedicated future stage).
- `scripts/secret-scan.sh` (provider prefixes + private keys + password
  DSNs + key assignments + bearer/JWT shapes, minus provably-fake
  fixtures in `scripts/secret-scan.allow`) gates `verify.sh` and is the
  documented pre-commit hook (symlink-tested). Ignored paths (`.env`,
  `*.pem`, `secrets/`) are never scanned.
- 538/538 pytest (+5: prod/non-prod header postures, error-envelope
  headers, docs gating both ways) + 409/409 vitest (+7 CSP builder),
  ruff/mypy/eslint/tsc/prettier clean, `verify.sh` green (specs
  amended in-stage). No migration, no new routes/codes/settings; no
  production dependency changed.
- Security notes (§11): report-only CSP cannot break the app
  (observe-only by construction); prod-only gating keeps sandbox/
  preview iframes working (both postures tested); audit exceptions are
  per-advisory-ID with written rationale (no blanket ignores); the
  secret-scan allowlist holds provably-fake fixtures only (stage-marked
  test keys, placeholder DSNs); positive control verified (planted key
  flagged, then removed).

**Known limitations (accepted, not bugs):**

- NO browser in this sandbox (as in Stages 05–19) — the report-only CSP
  has never been observed in a real browser; first browsed production
  env must review console violations before any enforce-mode rollout.
- `docker-compose.yml` STILL unvalidated (no Docker in sandbox); the
  Supabase storage path is unexercised (local adapter only here).
- Sandbox note: WARM environment (postgres holder + toolchains from
  prior stages all alive) — no rebuild needed; baseline 533/533
  re-run green before changes.

**Next stage:** Stage 21 (as-built) — the remaining AI slices
(creation-time live key proof, per-run what-was-sent disclosure)
and/or roadmap-22 (rate limiting).

### Stage 21 (as-built) — remaining AI slices + retry bucket ✅ (2026-09-24)

Scope note: the Stage 21 prompt framed a "FINAL REPOSITORY FREEZE /
SUBMISSION INTEGRITY AUDIT", but the repo is still mid-roadmap (Stages
22–32 remain, including screenshots/docs/deployment/final audit). Per the
repo-authority rule, this as-built Stage 21 implements the documented
next-pointer: the remaining AI slices (creation-time live key proof,
per-run what-was-sent disclosure) plus the AI part of roadmap-22 rate
limits (dedicated retry bucket). No final freeze/release claim is made.

- Backend: `POST /ai/providers` now proves key material with the selected
  provider adapter (`validate_credentials`) before encrypted storage. Duplicate
  enabled/fingerprint checks still run before proof (avoid needless outbound
  work) and again inside the insert path (race closure). No DB transaction spans
  provider I/O. Invalid/rejected/unreachable keys return `400 validation_error`
  with adapter-curated safe copy and store nothing; successful creates stamp
  `last_test_status=ok` + `last_tested_at` (no schema change — existing columns).
- Backend: `POST /analysis/{id}/retry-ai` now uses a dedicated per-user bucket
  (`RATE_LIMIT_AI_RETRY_PER_MINUTE`, default 10) instead of the generic
  verified-mutation bucket. Provider TEST keeps `RATE_LIMIT_AI_TEST_PER_MINUTE`.
- Frontend: add-provider copy states keys are provider-verified before encrypted
  storage; successful AI overviews now include per-run disclosure copy: overview
  uses finding summaries, rewrites use flagged requirement excerpts only, and
  provider retention follows the provider's policy. No new fields, no UI flow
  redesign, no model column.
- 541/541 pytest (+3: create-proof failure/no-storage ×2, retry-AI bucket ×1),
  409/409 vitest (no new frontend tests; existing affected tests pass),
  ruff/mypy/eslint/tsc/prettier clean, `verify.sh` green. No migration, no new
  endpoint, no scoring/detector/auth architecture change.

**Known limitations (accepted, not bugs):**

- NO browser in this sandbox (as in Stages 05–20) — disclosure copy and existing
  UI surfaces are unit-tested only, not visually revalidated at 390/768/1440.
- `docker-compose.yml` STILL unvalidated (no Docker in sandbox); the Supabase
  storage path is unexercised (local adapter only here).
- Remaining roadmap-22 work is not complete: Turnstile and distributed limiter
  storage/production abuse posture remain future. The new retry bucket is still
  the existing single-process limiter.

**Next stage:** Stage 22 (as-built) — CAPTCHA/rate limiting remainder
(Turnstile + distributed limiter store / production abuse posture) or the next
repo-authoritative slice from FUTURE_ROADMAP.md.

### Stage 22 (as-built) — Turnstile CAPTCHA abuse defense ✅ (2026-09-24)

Scope note: roadmap-22 is `CAPTCHA/rate limiting` with exit criteria
"Turnstile verify + buckets on sensitive routes; 429 envelope + tests". Earlier
stages already shipped the live single-process buckets for auth, analysis,
upload, provider TEST, document-download mints, and retry-AI. This as-built
Stage 22 closes the Turnstile slice only; distributed limiter storage / broader
production abuse posture remains future.

- Backend: added `app/services/turnstile.py` as the Cloudflare Turnstile
  siteverify boundary. Protected endpoints pass only the opaque client response
  token plus the socket peer IP. The verifier uses the official
  `https://challenges.cloudflare.com/turnstile/v0/siteverify` endpoint,
  backend-only `TURNSTILE_SECRET_KEY`, strict `TURNSTILE_TIMEOUT_SECONDS`,
  no redirects, provider response-size cap, and stable app errors. It never
  returns/logs raw provider payloads or secrets. Production fails closed if
  Turnstile is disabled or enabled without a secret; non-production may keep it
  disabled for local/test.
- Backend: public high-abuse auth routes now verify Turnstile before auth-service
  work: register, login, resend verification, forgot password, reset password.
  No global CAPTCHA was added; authenticated/read-only/deterministic analysis
  requests are unchanged. Existing CSRF, Origin/Referer, auth, authorization,
  anti-enumeration, and rate-limit semantics remain in place.
- API/errors: request schemas now accept `turnstile_token` on resend/forgot/reset
  in addition to register/login. Stable error codes are
  `turnstile_required`, `turnstile_invalid`, `turnstile_unavailable`, and
  `turnstile_configuration_error`; raw Cloudflare responses are not surfaced.
- Frontend: added `TurnstileWidget` (explicit-render Cloudflare script loader)
  using public `NEXT_PUBLIC_TURNSTILE_SITE_KEY`; it renders nothing when the key
  is unset. Signup, login, resend, forgot-password, and reset-password forms
  require a token only when configured, send it as `turnstile_token`, and reset
  the widget after backend failures/expiry/error. The Turnstile secret remains
  backend-only.
- Tests: focused backend Turnstile suite 17/17 passed (disabled non-prod no-op,
  production fail-closed, missing secret/token, request payload incl. remote IP,
  invalid/provider-failure mappings, endpoint integration/order). Full
  `./scripts/verify.sh` green: backend 558/558 pytest, ruff/mypy/OpenAPI sanity,
  frontend eslint/typecheck/vitest 410/410/prettier/build, secret scan, npm audit,
  and pip-audit all passed.

**Known limitations (accepted, not bugs):**

- Distributed limiter storage / per-account production buckets remain future;
  current buckets are still single-process as documented.
- NO live Cloudflare calls were made in tests; all provider interactions are
  mocked by design. Operators must configure real site/secret keys per
  environment before enabling Turnstile in production.
- NO browser in this sandbox (as in Stages 05–21) — widget rendering is covered
  by type/build and existing form tests, not visual CAPTCHA challenge capture.
- `docker-compose.yml` STILL unvalidated (no Docker in sandbox); Supabase storage
  remains unexercised here.

**Next stage:** Stage 23 — Privacy/data lifecycle, or a repo-authoritative
remaining roadmap-22 production-limiter-storage slice if prioritized first.

## Stage 23 — Privacy, data lifecycle & account deletion completion (COMPLETE)

**Scope delivered:**

- Backend lifecycle: `DELETE /auth/account` now uses the privacy lifecycle service to
  collect owned document storage refs from trusted DB rows, delete objects through the
  configured storage backend, then hard-delete the user row so DB cascades remove analyses,
  requirements, issues, document metadata, provider credential ciphertext, preferences,
  refresh tokens, verification tokens, and reset tokens. Client filenames/paths are never
  deletion inputs. Missing objects are idempotent; storage failures abort before DB delete
  and return a generic retryable server error.
- Privacy settings: `user_preferences` migration/model with nullable
  `history_retention_days` (NULL = no automatic retention, else 1..3650), plus
  authenticated/verified `GET/PATCH /settings/privacy`.
- Export: `POST /privacy/export` returns a 15-minute signed owner ticket + download URL;
  `GET /privacy/export/{export_id}` also requires the current verified session to match.
  Export JSON is generated live from owner-scoped rows and excludes password hashes,
  tokens, provider API keys/ciphertext/fingerprints, storage paths, file bytes, and
  cross-user data.
- Purge/retention: `POST /privacy/purge-history` deletes the caller's old analyses and
  now-orphaned owned document rows/storage objects; `python -m app.cli.purge_retention`
  enforces configured retention windows and prints aggregate counts only.
- Frontend: Settings → Privacy now has working retention-save, export-link, and purge-now
  controls with honest lifecycle copy; the old statement-only/no-fake-controls placeholder
  is gone.
- Regression coverage: new `backend/tests/test_privacy.py` covers privacy settings auth,
  CSRF/persistence, account deletion DB/storage/token/credential cleanup, storage-failure
  retry safety, owner-scoped redacted export, purge-history isolation/storage deletion,
  retention rerun safety, and post-delete download-token behavior. Frontend settings tests
  assert the privacy controls call real endpoints and render outcomes.

**Verification:**

- Full `TEST_DATABASE_URL=... DATABASE_URL=... ./scripts/verify.sh` green.
- Backend: ruff format/lint clean, mypy clean (98 source files), pytest 565/565 passed
  with 2 existing warnings, import/OpenAPI sanity clean.
- Frontend: eslint clean, typecheck clean, Vitest 49 files / 410 tests passed, Prettier
  clean, Next production build green.
- Secret/dependency gates: secret scan clean, `npm audit` 0 vulnerabilities, `pip-audit`
  clean with the documented ignored Starlette advisories.

**Known limitations (accepted, not bugs):**

- DB rows and object storage cannot be one atomic transaction. Stage 23 documents and
  tests the chosen storage-first semantics; a DB failure after object deletion may require
  retry/remediation, but missing storage objects are idempotent.
- Export is a signed live ticket flow, not a persisted export-artifact table; this avoids
  adding a second sensitive artifact lifecycle in v1.
- Distributed rate-limit storage remains future from Stage 22; unrelated to this lifecycle
  slice.
- NO browser validation yet in this sandbox; covered by type/build/tests unless a live
  browser becomes available before final reporting.

**Next stage:** Stage 24 — monitoring/error reporting, or the separately documented
future distributed limiter storage slice if explicitly prioritized.

## Stage 24 — Monitoring, observability & production error tracking (COMPLETE)

**Scope delivered:**

- Reconciled Stage 23 as complete (`c3f6650`); no privacy lifecycle fixes were required
  before Stage 24. Distributed limiter storage remains explicitly deferred from Stage 22.
- Backend Sentry: optional `SENTRY_DSN` initialization with FastAPI integration, no request
  body capture, no local variables, traces disabled by default, and a tested `before_send`
  scrubber. Unexpected exceptions, database request failures, and 500 `AppError`s are
  captured with allowlisted safe context only; expected business errors are not reported as
  catastrophic exceptions.
- Frontend Sentry: optional `NEXT_PUBLIC_SENTRY_DSN`/`SENTRY_DSN` config for route-render
  errors. API envelope failures handled by UI state remain non-crash paths. Source-map upload
  was not added because no Sentry auth/org/project credentials are available and the current
  contract does not require it.
- Request correlation: incoming `X-Request-ID` is accepted only when bounded to 1–64 chars
  of `[A-Za-z0-9._-]`; invalid/missing ids are replaced with generated 12-hex ids. Error
  handlers now return the header even when request processing raises.
- Structured logs: backend logs are JSON lines with redaction and an allowlist of fields for
  request method/path/route/status/duration, safe error code, exception class, analysis and
  document stages, storage operations, AI provider/model/latency, email provider/template,
  and rate-limit bucket categories. Query strings, bodies, tokens, credentials, raw SRS text,
  uploaded bytes, and AI prompts/responses are not logged.
- Safe operational events: AI provider/vault/unexpected failures, document storage/download
  failures, retention/account storage cleanup failures, rate-limit rejections, Turnstile
  failures, and email delivery failures are distinguishable by safe category/provider/status
  fields without raw payloads.

**Verification:**

- Targeted backend: ruff/mypy over monitoring/logging/config/main/AI/document/privacy/rate-limit
  modules passed; `tests/test_monitoring.py tests/test_middleware.py tests/test_logging.py
tests/test_health.py tests/test_auth_security.py` → 48 passed, 1 Starlette warning.
- Targeted frontend: eslint/typecheck passed; `src/lib/monitoring.test.ts` → 2 passed.
- Full gate: `PATH="$HOME/.local/bin:$PATH" TEST_DATABASE_URL="postgresql+asyncpg://postgres@/postgres?host=/home/user/pgdata" DATABASE_URL="postgresql+asyncpg://postgres@/postgres?host=/home/user/pgdata" ./scripts/verify.sh` → ALL CHECKS PASSED. Backend pytest summary in this sandbox: 225 passed, 347 skipped, 1 Starlette warning because no PostgreSQL server/socket is installed/running at `/home/user/pgdata`. Frontend Vitest: 50 files / 412 tests passed. Secret scan, npm audit, pip-audit, and Next production build passed.

**Known limitations (accepted, not bugs):**

- Sentry DSNs/organization/project credentials are not available in the sandbox, so tests mock
  capture boundaries and no live Sentry event was sent.
- No alerting integration was added; external Sentry alert rules are an operations/deployment
  configuration item, not a repository secret.
- Search Console/Core Web Vitals/SEO measurement remain Stage 27 per SEO_SPEC; Stage 24 covers
  application observability, not marketing analytics.
- Distributed rate-limit storage remains future. Docker/Supabase storage/browser validation remain
  unvalidated in this sandbox unless separately reported.

**Next stage:** Stage 25 — Performance, or the separately documented future distributed limiter
storage slice if explicitly prioritized.

## Stage 25 — Performance, scalability & resource optimization (COMPLETE)

**Scope delivered:**

- Reconciled Stage 24 as complete (`e423d82`). Distributed rate-limit storage remains a
  separately deferred hardening slice, not part of the Stage 25 prompt.
- Baseline before edits: full `./scripts/verify.sh` passed in this sandbox; backend DB tests
  that require PostgreSQL skipped because no PostgreSQL socket/server exists at
  `/home/user/pgdata`. No browser, Docker, or PostgreSQL `EXPLAIN ANALYZE` validation was
  possible in this environment.
- Database/resource config: SQLAlchemy async engine now uses validated env-driven pool knobs
  (`DATABASE_POOL_SIZE=5`, `DATABASE_MAX_OVERFLOW=10`, `DATABASE_POOL_TIMEOUT_SECONDS=30`,
  `DATABASE_POOL_RECYCLE_SECONDS=1800`) instead of untunable defaults.
- Query efficiency: history and dashboard recent-analysis paths now project only summary
  response columns and document display metadata, deliberately excluding the large
  `analyses.source_text` column and detail-only AI/JSON fields. Dashboard latest-run also uses
  a lightweight projection. Dashboard `improved_count` is computed in SQL with `lag()` instead
  of loading all scored analysis scores into Python.
- Document extraction lifecycle: validate+extract now runs in a bounded process-local parser
  pool guarded by `DOCUMENT_EXTRACTOR_WORKERS` (default 2). A request timeout still returns
  `503 document_processing_timeout`, but the underlying parser keeps its permit until it
  actually exits; this prevents repeated timeouts from silently building an unbounded abandoned
  worker backlog. Shutdown cancels queued parser tasks and disposes the DB engine.
- Frontend rendering: dashboard trend derivations and report AI rewrite coverage are memoized;
  Recharts remains dynamically imported/client-only as already implemented.
- No new database index or migration was added: current owner/order, token, provider, document,
  and issue-rollup indexes remain sufficient for the documented contracts. No caching of
  authenticated/user-owned data was introduced.

**Verification:**

- Baseline before edits: `PATH="$HOME/.local/bin:$PATH" TEST_DATABASE_URL="postgresql+asyncpg://postgres@/postgres?host=/home/user/pgdata" DATABASE_URL="postgresql+asyncpg://postgres@/postgres?host=/home/user/pgdata" ./scripts/verify.sh` → ALL CHECKS PASSED.
- Targeted backend after edits: ruff, mypy, and `tests/test_performance.py` + relevant document timeout tests passed (`5 passed, 1 skipped, 104 deselected, 1 Starlette warning`; skipped DB document test because PostgreSQL was unavailable).
- Targeted frontend after edits: eslint/typecheck passed; `DashboardTrend` + `AnalysisResultView` tests passed (`2 files / 22 tests`).
- Final full gate: `PATH="$HOME/.local/bin:$PATH" TEST_DATABASE_URL="postgresql+asyncpg://postgres@/postgres?host=/home/user/pgdata" DATABASE_URL="postgresql+asyncpg://postgres@/postgres?host=/home/user/pgdata" ./scripts/verify.sh` → ALL CHECKS PASSED. Backend pytest summary in this sandbox: 230 passed, 347 skipped, 1 Starlette warning because no PostgreSQL server/socket is installed/running at `/home/user/pgdata`. Frontend Vitest: 50 files / 412 tests passed. Secret scan, npm audit, pip-audit, and Next production build passed.

**Known limitations (accepted, not bugs):**

- PostgreSQL is unavailable in this sandbox, so database integration tests that require it skip
  and no query-plan/EXPLAIN measurements are claimed.
- Active parser calls cannot be forcibly killed by CPython once running; Stage 25 bounds them
  and documents the limitation rather than claiming impossible cancellation.
- Browser/device validation and Docker validation remain unperformed in this sandbox unless
  separately reported. Distributed rate-limit storage remains future.

**Next stage:** Stage 26 — SEO foundation/marketing-page foundation per FUTURE_ROADMAP, unless the
user explicitly prioritizes the deferred distributed limiter-store slice first.

## Stage 28 — Responsive & accessibility refinement (COMPLETE)

**Scope delivered:**

- Reconciled the repository after Stage 27 (`2dfb85c1`): SEO content/public routes were complete,
  the working tree was clean, and the active Stage 28 scope was the existing application UI rather
  than a redesign. No backend/API/database contract changes were required.
- Baseline before edits: frontend `npm run lint && npm run typecheck && npm test && npm run build`
  passed with 53 test files / 432 tests and 19 generated Next routes.
- Dialog accessibility/mobile fit: settings `DialogShell` now has a visible, named close button,
  retains focus trap/return-focus/Escape/overlay behavior, disables dismissal while mutations are
  pending, locks background scroll, and constrains internal scrolling with dynamic viewport and
  safe-area padding. Report/history delete confirmation dialogs now use the same viewport-safe
  max-height, overscroll containment, and safe-area padding.
- Touch targets/focus: primary buttons now inherit a 44px minimum target; analyzer text/upload
  submits, clear/cancel/destructive dialog actions, copy actions, and upload remove controls have
  explicit 44px targets and visible `focus-visible` rings where local classes previously suppressed
  reliance on the global outline.
- Long-content resilience: requirement text, requirement identifiers/sections, AI rewrites, issue
  category/phrase summaries, category bars, dashboard recent/latest rows, and history mobile cards
  now wrap unbroken technical tokens/filenames/titles/URLs instead of clipping or forcing horizontal
  overflow. Desktop truncation is retained only where the table/list layout benefits from it, with
  `title` text preserved for truncated labels.
- Mobile report/history/dashboard refinements: requirement copy actions stack on narrow phones;
  history cards preserve full title/source information before the desktop table truncation rules;
  dashboard recent analyses stack score metadata below long titles on phones. Existing chart
  accessibility (spoken summaries + data tables) and responsive Recharts containers were preserved.
- Semantics/a11y fixes: provider enablement switch names now reflect the action available
  (`Disable …` when currently enabled, `Enable …` when disabled), reducing screen-reader ambiguity;
  icon-only/compact delete and upload-remove controls remain named. Dangerous actions continue to
  require explicit confirmation and are distinguished by copy, borders/icons/labels, and color.
- Motion posture preserved: no normal animations were removed; existing `MotionProvider` /
  `useReducedMotionConfig` architecture remains the reduced-motion contract.

**Verification:**

- Focused regression after edits: `cd frontend && npm test -- --run src/components/settings/ProviderCard.test.tsx src/components/settings/SettingsScreen.test.tsx src/components/settings/DeleteAccountDialog.test.tsx src/components/analyzer/DeleteAnalysisButton.test.tsx` → 4 files / 64 tests passed.
- Final full gate: `PATH="$HOME/.local/bin:$PATH" TEST_DATABASE_URL="postgresql+asyncpg://postgres@/postgres?host=/home/user/pgdata" DATABASE_URL="postgresql+asyncpg://postgres@/postgres?host=/home/user/pgdata" ./scripts/verify.sh` → ALL CHECKS PASSED. Backend ruff/format clean; backend mypy clean (99 source files); backend pytest 230 passed, 347 skipped, 1 Starlette warning because no PostgreSQL server/socket exists at `/home/user/pgdata`; FastAPI import/OpenAPI sanity passed. Frontend eslint/typecheck clean; Vitest 53 files / 432 tests passed; Prettier clean; Next production build passed with 19 routes. Secret scan clean; `npm audit` 0 vulnerabilities; `pip-audit` clean (14 ignored advisories as configured).

**Known limitations (accepted, not bugs):**

- Browser/device visual validation at 390/768/1024/1440, screenshots, Docker, and live assistive-technology/manual screen-reader checks are not claimed in this sandbox unless separately reported. Stage 28 validation is repository/test/build based.
- No axe/jest-axe dependency was added: the repo had no existing axe stack, and the targeted improvements were covered with component behavior tests instead of adding a new dependency for a narrow slice.
- Distributed rate-limit storage remains future from Stage 22 and unrelated to this UI refinement stage.

**Next stage:** Stage 29 — Testing/QA, or the separately documented future distributed limiter-storage slice if explicitly prioritized.

## Stage 29 — Comprehensive testing & quality assurance (COMPLETE)

**Scope delivered:**

- Reconciled the actual repository after Stage 28 (`eec905c`): major implementation stages through
  responsive/accessibility refinement are present, the branch was clean, and Stage 29 is a
  pre-production QA baseline rather than a redesign. Stage 28's code/docs/tests were present and
  its final full gate had passed.
- Audited specs, roadmap/status/changelog, backend routes/services/repositories/analysis engine,
  migrations, scripts, frontend routes/components/lib clients, and the current test inventory.
  The repository contains 30 backend test files and 53 frontend test files after this stage.
- Added `backend/tests/test_stage29_quality_baseline.py` with four high-risk QA baselines:
  a documented `/api/v1` route-surface test (new routes must update API/security/docs), a compact
  deterministic golden corpus spanning clean requirements, multi-pattern ambiguity, URLs/UUIDs,
  optional language, incomplete fragments, and missing constraints, and AI prompt/payload privacy
  tests that pin overview minimization plus capped improvement context.
- Verified Alembic metadata without a live database: `alembic heads` reports single head `0006`;
  `alembic history --verbose` shows the linear `0001` → `0006` chain. Real upgrade/downgrade
  execution was not possible because PostgreSQL tooling/server is unavailable in this sandbox.
- Test-pyramid audit summary: pure analysis/detector/scoring/validation/error-mapping tests exist;
  DB/API/service integration suites exist but skip when PostgreSQL is unreachable; frontend
  component suites cover auth/analyzer/report/history/dashboard/settings and SEO libs; no browser
  E2E runner or axe stack is configured.

**Defects found/fixed:**

- No product correctness/security defect requiring an application-code fix was found during this
  QA pass. The main actionable gap was absence of a compact cross-engine golden corpus and
  route-surface sentinel, now covered by the new Stage 29 tests.

**Verification:**

- New focused Stage 29 tests: `PYTHONPATH=backend pytest -q backend/tests/test_stage29_quality_baseline.py` → 4 passed, 1 Starlette warning.
- Alembic metadata: `cd backend && alembic heads && alembic history --verbose` → single head `0006` and linear migration history displayed.
- Final full gate: `PATH="$HOME/.local/bin:$PATH" TEST_DATABASE_URL="postgresql+asyncpg://postgres@/postgres?host=/home/user/pgdata" DATABASE_URL="postgresql+asyncpg://postgres@/postgres?host=/home/user/pgdata" ./scripts/verify.sh` → ALL CHECKS PASSED. Backend ruff/format clean (139 files); backend mypy clean (99 source files); backend pytest 234 passed, 347 skipped, 1 Starlette warning because no PostgreSQL server/socket exists at `/home/user/pgdata`; FastAPI import/OpenAPI sanity passed. Frontend eslint/typecheck clean; Vitest 53 files / 432 tests passed; Prettier clean; Next production build passed with 19 routes. Secret scan clean; `npm audit` 0 vulnerabilities; `pip-audit` clean (14 ignored advisories as configured).
- Practical flakiness rerun: `cd backend && python -m pytest -q` → 234 passed, 347 skipped, 1 Starlette warning; `cd frontend && npm test --silent` → 53 files / 432 tests passed.

**Known limitations / remaining production blockers:**

- PostgreSQL, `initdb`/`pg_ctl`/`psql`, and Docker are unavailable in this sandbox. Therefore real
  migration application, rollback, DB-backed integration execution, clean-database E2E smoke, and
  Docker compose validation were not performed here; the existing DB-dependent suites remain ready
  and skipped by design when `TEST_DATABASE_URL` is unreachable.
- No browser automation, screenshot capture, real viewport validation, manual screen-reader pass,
  or axe-equivalent accessibility tooling is configured/available. Frontend validation remains
  jsdom/component/build based.
- No real external Supabase, Cloudflare Turnstile, Sentry, email, or AI provider calls were made;
  existing tests use fakes/mocked HTTP as intended.
- Rate limiting remains process-local; distributed limiter storage is still the deferred Stage 22
  production-hardening slice.
- Coverage tooling (`pytest-cov`, Vitest coverage provider) is not configured, so no coverage
  percentage is claimed.

**Next stage:** Stage 30 — Production deployment, or the separately documented distributed
limiter-storage slice if explicitly prioritized first.

## Current stage

None active — Stage 29 complete in this working branch. Distributed limiter storage remains future.
Next: **Stage 30 — Production deployment** (unless the next prompt explicitly prioritizes the remaining
distributed limiter-store slice).

## Upcoming stages (summary — authority: FUTURE_ROADMAP.md)

Database → backend → auth backend → auth frontend → SRS input/segmentation/preview ✅ →
detection+scoring+CRUD+result-UI ✅ → upload+extraction+upload-UI ✅ →
history UI → report UI → dashboard data → dashboard viz → settings → AI vault →
providers → overview/improvements → fallback → hardening → Turnstile CAPTCHA ✅
(+ distributed limiter storage still future) → privacy → monitoring ✅ → performance ✅ → SEO foundation ✅ → SEO content ✅ →
responsive/a11y ✅ → QA ✅ → deploy → docs/shots → audit.
(As-built order; roadmap numbers preserved — see the FUTURE_ROADMAP.md as-built note.)

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
  refresh is single-flight + retry-once via `withSessionRetry` (Stage 05:
  `me`/`change-password`; Stage 06: + analysis creation).
- Motion preference reads `useReducedMotionConfig` (honors `MotionConfig`), never the
  device-only `useReducedMotion` (ignores the provider).
- Component tests: `jsdom` per-file pragma + Testing Library (`within()`-scoped label
  queries in multi-form cards); `vitest.config.ts` mirrors `@/*` (Vitest ignores
  tsconfig paths).
- Analysis detail: issues nested-only, `source_excerpt` summary-only, `status`
  honest (Stage 06; reconciles PROJECT_SPEC §7 with binding contract §4.3).
- Analyzer budgets are contract-fixed module constants (`TEXT_MAX_LENGTH`,
  `MAX_REQUIREMENTS`); only the per-user rate limit is env-tunable (Stage 06).
- Segmentation is pure + deterministic (span invariant); never per-keystroke —
  server-side, on submit only (Stage 06).
- Uploads reuse the text pipeline unchanged (equivalence guarantee); stored
  MIME is server-detected, filenames display-only; exactly one file per call;
  orphaned documents purge with their analysis (row + object); size/type
  budgets are 400 + reason codes, never bare 413/415 (Stage 08).

## Warnings for future agents

1. IMPLEMENTED: `app/{models,schemas,services,repositories,exceptions}/`
   (Stages 02–03), `app/analysis/` (Stage 07), `app/email/` (Stage 04),
   `app/documents/` + `app/storage/` (Stage 08), `app/ai/` ABC + registry
   - `app/core/vault.py` (Stage 12) + all 6 adapters + prompts + sanitizer
   - `services/ai_enhancement.py` (Stage 14, adapters completed Stage 18)
   - `retry-ai` (Stage 17). No docstring-only seams remain under `app/`.
2. Never rename `owner_id`, envelope shapes, env names, or `docs/` files without ADR + CHANGELOG.
3. Never `npm install` a dependency the stage doesn't import (recharts: dashboard/report stages).
4. IMPLEMENTED in Stage 26: the Stage 01 placeholder `/` page has been replaced by a public landing foundation; future SEO stages should extend through planned public content pages, not reintroduce placeholder/status copy.
5. No Docker here — whoever first needs Postgres locally validates `docker-compose.yml`.
6. TS v6 / ESLint v9 pins are upstream-compatibility holds, not preferences — re-check
   before "upgrading" (see Toolchain note in CHANGELOG 0.1.0).
7. Apply edits to the SAME file sequentially and grep-verify afterwards — parallel
   same-file edits have been observed to clobber each other (see DEVELOPMENT_RULES §6).
8. Never rewrite a file from remembered content: re-read (or `git show HEAD:`) first,
   then `git diff`-review the rewrite line by line for silently dropped behavior.
   Stage 03 caught a rewrite that dropped status codes, security headers, and docs
   paths this way — the gate was green but the diff was wrong.
9. `analyses.status` CHECK admits `segmented|analyzed|failed` (0004) and
   `documents.file_type` admits `pdf|docx|txt` (0005) — any stage adding a
   state/type must extend the CHECK via a new migration (never hand-edit the DB).
10. `screenshots/` is STILL EMPTY (no browser in the sandbox, Stages 05–08): the
    first browsed environment owes `stage05-*` + `stage06-*` + `stage07-*` +
    `stage08-*` at 390/768/1440.
