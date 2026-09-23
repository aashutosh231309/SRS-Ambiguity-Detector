# Changelog

> Contract + product changes, newest first. Every stage appends an entry. Format:
> `## [version] — Stage NN — date (UTC)` with Added/Changed/Contract subsections.
> Versions: `0.x` pre-release (minor per stage group), `1.0.0` at Stage 32.

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
