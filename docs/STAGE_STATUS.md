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

## Current stage
None active — Stage 01 (formal) complete; all success conditions hold (frontend runs,
backend runs, health works, structure clean, env handling safe, commands documented,
minimal tests green, docs accurate, no future feature misrepresented).
Next: **Stage 02 — Database Foundation**.

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

## Warnings for future agents
1. `app/{models,schemas,services,analysis,ai,email,storage}/` are SEAMS (docstrings only).
   Do not import behavior from them until their stage implements it.
2. Never rename `owner_id`, envelope shapes, env names, or `docs/` files without ADR + CHANGELOG.
3. Never `npm install` a dependency the stage doesn't import (recharts: dashboard/report stages).
4. Frontend placeholder `/` page must be REPLACED in the SEO/marketing stage, not extended.
5. No Docker here — whoever first needs Postgres locally validates `docker-compose.yml`.
6. TS v6 / ESLint v9 pins are upstream-compatibility holds, not preferences — re-check
   before "upgrading" (see Toolchain note in CHANGELOG 0.1.0).
7. Apply edits to the SAME file sequentially and grep-verify afterwards — parallel
   same-file edits have been observed to clobber each other (see DEVELOPMENT_RULES §6).
