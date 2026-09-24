# Changelog

> Contract + product changes, newest first. Every stage appends an entry. Format:
> `## [version] — Stage NN — date (UTC)` with Added/Changed/Contract subsections.
> Versions: `0.x` pre-release (minor per stage group), `1.0.0` at Stage 32.

## [0.7.0] — Stage 06 — SRS Input + Segmentation + Preview — 2026-09-24

### Added
- `POST /api/v1/analysis` (TEXT-only → `201` SEGMENTED detail): verified-user
  guard + per-user 20/min bucket → validate → conservative normalize →
  deterministic segment → transactional persist (`analyses` + `requirements`).
  No scores/issues/AI — `score`/`band` null, nested `issues` empty, `ai_status`
  `skipped` (always; no AI call exists).
- Segmenter (`services/segmentation.py`, pure, no I/O): FR/NFR/REQ-ID (0.95),
  decimal/numbered (0.90/0.75/0.60), bullet (0.80/0.65/0.50), paragraph
  (0.55/0.50); multi-sentence requirements, headings → section paths, source
  offsets + line refs, span invariant (segments tile the normalized text).
- `/analyzer` (verified, `noindex`): title + large editor (live char/word
  counts, requirement estimate), validation/loading/rate-limit states,
  `SegmentPreview` (requirements + evidence only — no scores/AI text), Clear /
  Start-over / Analyze-another; session-expiry re-login preserves the draft.
- Migration `0003`: `analyses.status`/`source_text`, NULL-until-scored
  `score`/`band`, `requirements.section`/`segmentation`.
- 65 backend tests (45 segmentation + 20 API/ownership/transaction) + 36
  frontend tests (lib + form/validation/loading/preview/error/reset);
  `vitest.setup.ts` IntersectionObserver stub (jsdom lacks it; motion needs it).

### Changed
- `lib/auth.ts` exposes the single-flight retry as `withSessionRetry`
  (now also serving analysis creation); param-label table shared with
  analysis field errors. Auth behavior untouched (all Stage 05 tests pass).
- Roadmap sequencing: input/segmentation (incl. roadmap-11) shipped BEFORE
  detectors — roadmap-06's detector criteria move to actual Stage 07
  (see `FUTURE_ROADMAP.md` as-built note).

### Contract (Stage 06 amendment to §4.3, all verified live + asserted in tests)
- Detail gains `status: "segmented"`; requirements gain `section` +
  `segmentation`; issues are nested-only (`[]` pre-detection — no top-level
  `issues`); `source_excerpt` is summary-only (absent from the detail).
- New codes: `text_too_large` (char budget or requirements cap, with counts),
  `no_requirements_detected` (nothing persisted), `document_analysis_unavailable`
  (non-null `document_id` before Stage 09); `options.ai_enhance` accepted + ignored.

## [0.6.0] — Stage 05 — Authentication Frontend — 2026-09-24

### Added
- Auth UI: `app/(auth)/` routes (`login`, `signup`, `forgot-password`,
  `reset-password`, `verify-email`, all `noindex, nofollow`); `AuthCard` +
  blade/sweep transition (desktop slanted panel / mobile curtain, reduced-motion
  instant path, focus + live-region management); `AuthProvider` + `useAuth` (+
  `useMediaQuery`); `lib/auth{,-errors,-validation}.ts`; `types/auth.ts`;
  `ProtectedRoute` (+ `requireVerified` nudge); `ChangePasswordForm` (unmounted
  until settings).
- 123 frontend tests (16 files: 15 new); `vitest.config.ts` (`@/*` alias);
  `jsdom` + Testing Library + `user-event` devDeps.

### Changed
- Root layout wraps the app in `AuthProvider`. Post-auth landing is the fixed
  temporary `/` until the dashboard stage.

### Contract (frontend assumptions on §4.2, all verified live)
- `register` sets no cookies (never logs in); unverified CAN log in; logout 204;
  resend/forgot always-202; reset/change 200 `{}`; `validation_error` details are
  `[{loc,msg}]`; no `turnstile_token` sent; outstanding access JWTs survive
  reset/logout until TTL (refresh revocation is the logout-everywhere mechanism).

## [0.5.0] — Stage 04 — Authentication Backend — 2026-09-23

### Added
- Auth backend: `core/security.py` (argon2id, 256-bit tokens, HS256 JWTs),
  `core/rate_limit.py` (single-process buckets), `services/auth.py` (11 flows),
  `repositories/auth.py`, `schemas/auth.py`, `api/v1/dependencies.py`
  (identity + CSRF + rate-limit guards), `api/v1/endpoints/auth.py` (11 routes).
- Email port: `email/` package (templates + `EmailService` ABC + Resend and
  console/file-outbox adapters, wired at startup with prod fail-closed).
- `CurrentPasswordError`, `RateLimitedError` → `Retry-After` header, 63 new tests.

### Changed
- `tests/test_database.py`: metadata/head/tables expectations for `0002`, token
  tables added to the cascade test. `backend/.env.example`: Stage-04 block active.

### Contract (amendments, all additive — see API_CONTRACT §4.2)
- New explicit `POST /auth/refresh` rotation endpoint (theft response included).
- `/me` also returns `display_name` / `is_active`; `register` takes `name`.
- New codes: `invalid_credentials`, `invalid_token`, `password_too_weak`,
  `current_password_incorrect`, `account_disabled`.

### Database
- Revision `0002`: `refresh_tokens` (rotation + reuse-detection columns),
  `email_verification_tokens`, `password_reset_tokens`. Cycle + `alembic check` clean.

### Security
- Hash-only credentials at rest; constant-time compare; `HttpOnly; Secure (prod);
  SameSite=Lax` cookies; Origin/Referer CSRF checks; anti-enumeration posture tested.

## [0.4.0] — Stage 03 — Backend Foundation / Service Layer — 2026-09-23

### Added
- Service layer: `app/services/` (`readiness`, `transactions.@transactional`),
  `app/repositories/` (`SystemRepository`), `app/exceptions/` (`AppError` + 4
  subclasses), `app/schemas/` (`system`, `common` pagination).
- `main.py`: lifespan engine disposal, access-log middleware, `AppError` +
  `SQLAlchemyError` handlers, tightened CORS (explicit methods/headers).
- 26 backend tests added, 2 retired (net +24): services, errors, middleware, CORS,
  schemas, OpenAPI/lifespan, model-metadata sanity.

### Changed
- Error handling extended: `AppError` → envelope mapping, sanitized `SQLAlchemyError`
  → `500 internal_error` (per-field validation details preserved).
- `/ready` now flows through the service layer (same shapes, same truth table).
- Fixed `alembic/env.py` silencing app logging in-process (`fileConfig()` now
  passes `disable_existing_loggers=False`).
- `Document.analyses` gained `passive_deletes=True` (ORM-only, no migration).

### Database
- None (no migration; `0001` still head, `alembic check` zero drift).

### Security
- Error sanitization + query-param-free access log (both tested); DSN hygiene unchanged.

## [0.3.0] — Stage 02 — Database Foundation — 2026-09-23

### Added
- Async PG stack (SQLAlchemy 2.0.54, asyncpg 0.31.0, Alembic 1.20.0, greenlet, Mako).
- `app/core/database.py` (lazy engine, session factory, `get_session`, status probe,
  dispose) + six models + Alembic env + hand-written revision `0001`.
- `/ready` live DB probe (`ok`/`error`/`not_configured`); `DIRECT_DATABASE_URL` support.
- `tests/test_database.py` (17 tests) + conftest PG harness (`TEST_DATABASE_URL`,
  scratch-DB auto-create, skip-if-unreachable).

### Changed
- `DATABASE_SCHEMA.md` rewritten as IMPLEMENTED (conventions, per-table reference,
  index rationale, migration workflow); `SECURITY_SPEC.md` §12, `API_CONTRACT.md`
  §4.1, `ARCHITECTURE.md`, README (local DB workflow) updated.
- `verify.sh` ruff scope extended to `alembic/`.

### Database
- Tables: `users`, `analyses`, `requirements`, `issues`, `documents`,
  `ai_provider_credentials`. UUID PKs (client-side), TIMESTAMPTZ, VARCHAR+CHECK
  vocabularies (no PG enums), `owner_id` cascades, 16 indexes, 20 CHECKs.
- Conventions locked: email lowercase app-side, one live key per user+provider
  (partial unique), document link via `analyses.document_id`, RLS deferred (reasoned).

### Security
- DSN never logged/echoed (tested); hash-only password column; ciphertext-only key
  column; cascade deletion plan; least-privilege prod guidance; no creds committed.

### Tests
- `verify.sh` green (pytest 27/27 on real PG 16, vitest 6/6, lint/type/build);
  downgrade/upgrade cycle + `alembic check` clean; skip-mode + live `ready:ok` verified.

### Notes
- No auth/analysis/upload/AI logic (later stages). `docker-compose.yml` still
  unvalidated (no Docker in sandbox). Sandbox PG via uncommitted `pgserver` aid.

## [0.2.0] — Stage 01 (formal) — Repository & Development Foundation — 2026-09-23

### Added
- `Container` layout primitive adopted by `/` and 404; `loading.tsx` + `error.tsx`
  app-shell conventions (safe message + retry).
- API client timeout (30 s default, per-call override, `request_timeout` code).
- Frontend tests: Vitest 5 + `lib/api.test.ts` (6 tests), `npm test` script.
- `tests/test_logging.py` (5 redaction tests); `verify.sh` runs the Vitest suite.
- README: development-commands table, current limitations, Python strategy note.

### Changed
- Log redaction now scrubs quoted keys, whole `Authorization` credentials, and
  Bearer-prefixed values (contract guidance added: clients SHOULD default ~30 s).
- Home page uses shared `apiBaseUrl()`; env examples annotated (required/optional,
  CORS dev-vs-prod); `ARCHITECTURE.md`/`DEVELOPMENT_RULES.md` updated for conventions.

### Security
- Redaction gaps closed before any secret exists: JSON-quoted keys and auth headers
  are now covered and test-locked. Still NOT production-hardened (later stages).

### Tests
- `verify.sh` green: ruff, mypy-strict, pytest 10/10, eslint, tsc, vitest 6/6,
  prettier, `next build`. Live curl matrix green (health alias, envelopes, pages).

### Notes
- No new env vars; no dependency except Vitest (dev-only, exercised immediately);
  nothing from Stage 02+ implemented.

## [0.1.1] — Stage 00 (formal) reconciliation — 2026-09-23

### Added
- Root `.env.example` (master inventory + compose reference); `DIRECT_DATABASE_URL`
  (pooled app connection vs direct migration connection).
- `GET /health` infrastructure alias (same live payload, OpenAPI-excluded) + test.
- `frontend/src/hooks/` + `src/types/` purpose READMEs.

### Changed
- Env names aligned to the Stage 00 prompt: `NEXT_PUBLIC_API_URL`, `JWT_SECRET`,
  `ENCRYPTION_MASTER_KEY` (code, examples, README, and all docs updated).
- Verbatim UI contract sentence added (`UI_UX_SPEC.md`); dependency-discipline and
  no-generic-UI rules added (`DEVELOPMENT_RULES.md`); same-file sequential-edit
  workflow rule added after an observed clobbering incident.

### Removed
- `recharts` uninstalled (was declared but unused — dependency discipline, Stage 00
  §24). Returns in the dashboard/report stages that first import it.

### Security
- No global AI provider keys: documented as a deliberate architectural absence
  (user-owned keys, encrypted per-user vault — `AI_PROVIDER_SPEC.md` §5).

## [0.1.0] — Stage 00 + Stage 01 — 2026-09-23

### Added
- Project contract: all 12 `docs/*.md` created and cross-linked.
- Canonical monorepo: `frontend/` (Next.js App Router + TS strict + Tailwind v4 +
  Motion + lucide-react + recharts), `backend/` (FastAPI + Pydantic v2, versioned `/api/v1`),
  `scripts/verify.sh`, `screenshots/` convention, `docker-compose.yml` (local Postgres 16).
- Health endpoints `GET /api/v1/health/live` and `/ready` + uniform error envelope +
  redacting logger foundation.
- Frontend foundation: global metadata, design tokens (`globals.css`), typed API client
  (`lib/api.ts`), `ApiStatus` live-check component, `robots.ts`/`sitemap.ts` stubs,
  security headers posture (framing enforced in production only).

### Contract (binding decisions)
- ADR-001…ADR-007 recorded in `ARCHITECTURE.md` (monorepo, `/api/v1`, cookie sessions,
  Tailwind v4 CSS-first, async SQLAlchemy 2.0 + Alembic, Fernet vault, Inter + Plex Mono).
- API envelopes, pagination, error codes frozen in `API_CONTRACT.md`.
- Schema proposed (not implemented) in `DATABASE_SCHEMA.md`; AI interface frozen in
  `AI_PROVIDER_SPEC.md`; taste system frozen in `UI_UX_SPEC.md`.

### Toolchain (verified 2026-09-23)
- Next.js 16 + React 19 + Tailwind v4 (CSS-first) + Motion 13 + lucide-react 1.x +
  Recharts 3.x + clsx/tailwind-merge; self-hosted Fontsource type (ADR-007).
- TypeScript held at v6 (`typescript-eslint` lacks TS 7 support); ESLint held at v9
  (`eslint-plugin-react@7` incompatible with ESLint 10); native flat-config imports.
- Backend: FastAPI + uvicorn + Pydantic v2 + pydantic-settings + httpx (pinned);
  ruff + mypy-strict + pytest gate in `scripts/verify.sh` — all green.
