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
  order incl. headings, ` | ` table joins), TXT (utf-8-sig → windows-1252 →
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
  + analyzer cross-link both ways.
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

## Current stage
None active — Stage 10 complete; all success conditions hold (history page
with server-driven search/filter/sort/paging, ownership-safe rows linking to
the Stage 09 report, shared confirm-delete, honest empties/errors, backend
`q` + summary `document` pointer, 342/342 + 259/259 tests, journey green,
docs match).
Next: **Stage 11 (as-built) — document list/download and/or Dashboard data**.

## Upcoming stages (summary — authority: FUTURE_ROADMAP.md)
Database → backend → auth backend → auth frontend → SRS input/segmentation/preview ✅ →
detection+scoring+CRUD+result-UI ✅ → upload+extraction+upload-UI ✅ →
history UI → report UI → dashboard data → dashboard viz → settings → AI vault →
providers → overview/improvements → fallback → hardening → CAPTCHA/rate-limit →
privacy → monitoring → performance → SEO foundation → SEO content →
responsive/a11y → QA → deploy → docs/shots → audit.
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
   `app/documents/` + `app/storage/` (Stage 08). Remaining SEAM (docstrings
   only): `app/ai/` — do not import behavior from it until its stage lands.
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
9. `analyses.status` CHECK admits `segmented|analyzed|failed` (0004) and
   `documents.file_type` admits `pdf|docx|txt` (0005) — any stage adding a
   state/type must extend the CHECK via a new migration (never hand-edit the DB).
10. `screenshots/` is STILL EMPTY (no browser in the sandbox, Stages 05–08): the
    first browsed environment owes `stage05-*` + `stage06-*` + `stage07-*` +
    `stage08-*` at 390/768/1440.
