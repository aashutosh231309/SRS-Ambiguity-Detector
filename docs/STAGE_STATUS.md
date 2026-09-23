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

## Current stage
None active — the foundation satisfies the formal Stage 00 success condition
(clean, runnable, secure foundation + permanent project contract).
Next: **Stage 01 as defined by the user's forthcoming prompt** (roadmap slot: database
foundation — models, migrations, live DB wiring; see `FUTURE_ROADMAP.md`).

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
