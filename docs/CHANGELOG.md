# Changelog

> Contract + product changes, newest first. Every stage appends an entry. Format:
> `## [version] — Stage NN — date (UTC)` with Added/Changed/Contract subsections.
> Versions: `0.x` pre-release (minor per stage group), `1.0.0` at Stage 32.

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
