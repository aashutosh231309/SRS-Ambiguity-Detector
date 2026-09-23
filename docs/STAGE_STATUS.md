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
- `recharts` is declared but not yet imported (first use Stage 13/15); everything else
  in `package.json` is already exercised. Backend pins: FastAPI 0.115.6, uvicorn 0.34.0,
  Pydantic 2.10.4, pydantic-settings 2.7.0, httpx 0.28.1; pytest 8.3.4, ruff 0.8.4, mypy 1.14.1.

**Environment variables added:** see `backend/.env.example` (`APP_*`, `API_V1_PREFIX`,
`BACKEND_CORS_ORIGINS`, `DATABASE_URL`, + reserved Stage 02–24 names) and
`frontend/.env.example` (`NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SITE_URL`, + reserved).

**Database changes:** none (schema is PROPOSED in `DATABASE_SCHEMA.md`; Stage 02 implements).

**API changes:** `GET /api/v1/health/live`, `GET /api/v1/health/ready` (envelope + headers
verified live). Contract for all future endpoints frozen in `API_CONTRACT.md`.

**Tests performed (all green):**
- `scripts/verify.sh`: ruff check + format, mypy strict (17 files), pytest (4 tests),
  eslint, `tsc --noEmit`, prettier, `next build` (5 static routes) — ALL PASSED.
- Live E2E: uvicorn `:8000` + `next start` `:3000` — live/ready shapes, 404 envelope,
  `X-Request-ID`, security headers, CORS allow-origin+credentials, `/` 200 with content,
  `/robots.txt` + `/sitemap.xml` 200, unknown route 404 — all verified via curl.

**Known limitations (accepted, not bugs):**
- No auth/DB/engine/upload/history/dashboard/settings/AI — each has an owning stage.
- `docker-compose.yml` is untested here (no Docker in this environment) — Stage 02 must
  validate it when Postgres becomes required.
- Frontend `ApiStatus` shows "offline" until the backend runs — by design (live probe).

## Current stage
None active — Stage 01 complete. Next up: **Stage 02 — Database foundation**.

## Upcoming stages (summary — authority: FUTURE_ROADMAP.md)
02 DB foundation → 03 backend foundation → 04 auth backend → 05 auth frontend →
06 deterministic engine → 07 analysis API → 08 analyzer UI → 09 upload → 10 extraction →
11 segmentation → 12 history → 13 report UI → 14 dashboard data → 15 dashboard viz →
16 settings → 17 AI vault → 18 providers → 19 overview/improvements → 20 fallback →
21 hardening → 22 CAPTCHA/rate-limit → 23 privacy → 24 monitoring → 25 performance →
26 SEO foundation → 27 SEO content → 28 responsive/a11y → 29 QA → 30 deploy → 31 docs/shots → 32 audit.

## Major decisions log
- `/api/v1` versioning (ADR-002) — master prompt listed unversioned paths; version now.
- Cookie sessions over bearer-in-storage (ADR-003).
- Fernet vault with `vN:` rotation prefix (ADR-006).
- Fontsource self-hosting over `next/font/google` (ADR-007) — offline-safe builds.
- `422` reserved for unprocessable FILES; schema validation is `400 validation_error`.

## Warnings for future agents
1. `app/{models,schemas,services,analysis,ai,email,storage}/` are SEAMS (docstrings only).
   Do not import behavior from them until their stage implements it.
2. Never rename `owner_id`, envelope shapes, or `docs/` files without ADR + CHANGELOG.
3. `recharts` unused until Stage 13/15 — do not remove it (declared intentionally).
4. Frontend placeholder `/` page must be REPLACED in Stage 26, not extended into the product.
5. No Docker here — whoever first needs Postgres locally validates `docker-compose.yml`.
6. TS v6 / ESLint v9 pins are upstream-compatibility holds, not preferences — re-check
   before "upgrading" (see Toolchain note in CHANGELOG 0.1.0).
