# SRS Ambiguity Detector

A production-quality web platform that analyzes Software Requirements Specification (SRS)
documents and requirement text, detects ambiguity with a **deterministic NLP/rule engine**,
explains every finding, scores requirement quality, and — optionally, with the user's own
AI provider keys — adds AI-generated overviews and improvements.

> **Status: late pre-release.** Core product features are implemented: auth,
> text/document analysis, history, dashboard, settings/privacy, optional user-owned
> AI enhancement, SEO public pages, monitoring hooks, and Stage 30 production
> deployment runbook/configuration. Final screenshots/docs and release audit remain.
> See [`docs/STAGE_STATUS.md`](docs/STAGE_STATUS.md) and
> [`docs/FUTURE_ROADMAP.md`](docs/FUTURE_ROADMAP.md).

## Baseline (immutable — all 12 ship in v1)

Requirement text input · SRS upload (PDF/DOCX/TXT) · ambiguity detection + categories ·
explanations · suggested improvements · ambiguity score · authentication · database storage ·
analysis history · dashboard with charts · REST APIs — plus README + screenshots.

Full contract: [`docs/PROJECT_SPEC.md`](docs/PROJECT_SPEC.md).

## Repository map

```
frontend/   Next.js App Router + TypeScript (strict) + Tailwind v4 + Motion + Vitest
backend/    Python 3.11+ FastAPI, versioned API at /api/v1 (deterministic engine, no LLM calls in core)
docs/       Project contract — start here (new agents: DEVELOPMENT_RULES.md first)
scripts/    verify.sh — the stage-completion gate (lint, typecheck, tests, builds)
screenshots/  Assignment deliverable (UI captures per stage)
```

Key docs: `ARCHITECTURE.md` (decisions + ADRs) · `API_CONTRACT.md` (REST envelopes + endpoints) ·
`DATABASE_SCHEMA.md` (implemented schema + migration workflow) · `SECURITY_SPEC.md` (threat model) ·
`AI_PROVIDER_SPEC.md` (provider abstraction) · `UI_UX_SPEC.md` (design system) ·
`SEO_SPEC.md` · `DEVELOPMENT_RULES.md` (mandatory workflow).

## Quickstart (local development)

Prerequisites: **Node.js 20+** (`npm`), **Python 3.11+**, and **PostgreSQL 16+**
([Docker](https://www.docker.com/) via `docker-compose.yml`, a system install, or Supabase).

```bash
# 1. Database (PostgreSQL 16+; Docker NOT required — any of these)
docker compose up -d db          # …or: apt/brew install postgresql && createdb srs_ambiguity
# 2. Backend
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt -r requirements-dev.txt
cp .env.example .env                                 # set DATABASE_URL (see below)
alembic upgrade head                               # create the schema (revision 0001)
uvicorn app.main:app --reload --port 8000            # API → http://localhost:8000/health

# 3. Frontend (new terminal)
cd frontend
npm install
cp .env.example .env.local                           # NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
npm run dev                                          # Web → http://localhost:3000
```

Verify everything (lint + typecheck + tests + production builds):

```bash
./scripts/verify.sh
```

DB-backed tests use `TEST_DATABASE_URL` (default
`postgresql+asyncpg://postgres:postgres@localhost:5432/srs_test`, auto-created) and skip
cleanly when PostgreSQL is unreachable.

## Development commands

| Area     | Command                                                                  | Purpose                                                      |
| -------- | ------------------------------------------------------------------------ | ------------------------------------------------------------ |
| Frontend | `npm install`                                                            | Install dependencies                                         |
| Frontend | `npm run dev`                                                            | Dev server on `:3000`                                        |
| Frontend | `npm run build` / `npm run start`                                        | Production build / serve it                                  |
| Frontend | `npm run lint`                                                           | ESLint (flat config, `react/no-danger`)                      |
| Frontend | `npm run typecheck`                                                      | `tsc --noEmit` (strict)                                      |
| Frontend | `npm test`                                                               | Vitest unit tests (`*.test.ts`)                              |
| Frontend | `npm run format`                                                         | Prettier check                                               |
| Backend  | `pip install -r requirements.txt -r requirements-dev.txt`                | Install (in venv)                                            |
| Backend  | `uvicorn app.main:app --reload --port 8000`                              | Dev server on `:8000`                                        |
| Backend  | `python -m pytest -q`                                                    | Test suite                                                   |
| Backend  | `ruff check app tests alembic` / `ruff format --check app tests alembic` | Lint / format check                                          |
| Backend  | `mypy app`                                                               | Strict typecheck (`alembic/` excluded — operational scripts) |
| Backend  | `alembic upgrade head` / `current` / `history` / `check`                 | Migrate / status / drift check                               |
| Backend  | `alembic revision -m "…" --autogenerate`                                 | New migration (always REVIEW the diff)                       |
| Repo     | `./scripts/verify.sh`                                                    | Full gate (everything above, in order)                       |

Python dependency strategy: pinned `backend/requirements*.txt` are the install source;
`backend/pyproject.toml` holds tool configuration only (ruff, mypy, pytest).

## Configuration

All settings are environment-driven and validated at boot. Copy the examples and edit:

- `backend/.env.example` → `backend/.env` (server-only; **never commit `.env`**)
- `frontend/.env.example` → `frontend/.env.local` (`NEXT_PUBLIC_*` only — never secrets)
- Root `.env.example` is the master inventory + `docker compose` reference (documents all
  variables in one place; only `${POSTGRES_*}` is read from the repo root)

| Variable                                       | Default                                                  | Purpose                                                                                                                                   |
| ---------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`                          | `http://localhost:8000/api/v1`                           | Browser → API base URL (the only backend address the browser needs)                                                                       |
| `NEXT_PUBLIC_SITE_URL`                         | `http://localhost:3000`                                  | Canonical site origin for public metadata, robots, and sitemap (normalized; never put secrets here)                                       |
| `APP_ENV`                                      | `local`                                                  | `local` / `staging` / `production` behavior switch                                                                                        |
| `DATABASE_URL`                                 | _(unset — app boots; `/ready` reports `not_configured`)_ | `postgresql+asyncpg://…` app connection                                                                                                   |
| `DIRECT_DATABASE_URL`                          | _(falls back to `DATABASE_URL`)_                         | Direct connection for Alembic (bypasses Supabase pooler)                                                                                  |
| `DATABASE_POOL_SIZE` / `DATABASE_MAX_OVERFLOW` | `5` / `10`                                               | Per-process asyncpg pool tuning; size against DB capacity and worker count                                                                |
| `DOCUMENT_EXTRACTOR_WORKERS`                   | `2`                                                      | Per-process bounded parser workers for PDF/DOCX/TXT validation + extraction                                                               |
| `JWT_SECRET`                                   | _(required for auth)_                                    | 256-bit-minimum HS256 signing secret (fail-closed)                                                                                        |
| `EMAIL_PROVIDER`                               | `console`                                                | `console` (local dev outbox) / `resend` (production delivery)                                                                             |
| `STORAGE_BACKEND`                              | `local`                                                  | `local` for dev/single-node persistent disk; `supabase` for managed production storage                                                    |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_STORAGE_BUCKET` | placeholders | Supabase Storage REST config for a private bucket; service-role key is backend-only                                                        |
| `TURNSTILE_ENABLED` / `TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `false` / placeholders | Cloudflare Turnstile server verification for high-abuse auth routes; site key is public, secret is backend-only                           |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`        | _(unset — monitoring disabled)_                          | Optional backend/frontend Sentry projects; scrubbers strip bodies, query strings, tokens, credentials, SRS text, uploads, and AI payloads |

Production: set `APP_ENV=production`, `DEBUG=false`, exact `BACKEND_CORS_ORIGINS`, HTTPS
origins, `EMAIL_PROVIDER=resend`, strong `JWT_SECRET`, and a backed-up
`ENCRYPTION_MASTER_KEY` if AI provider credentials are enabled.

## Production deployment

The supported production topology is Vercel for the Next.js frontend plus a separate
Python/FastAPI service host connected to PostgreSQL/Supabase and Supabase Storage. FastAPI is
not hosted by Vercel. The complete operator runbook is
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md), including env-var tables, migration order,
health checks, smoke tests, rollback, backups/recovery, security checklist, SEO/domain setup,
and troubleshooting.

Rate-limiting decision for v1 production: run a single backend instance/process with the
implemented process-local token buckets, or accept `N × limit` behavior across `N` instances
until a shared limiter is added. Redis/queues/Kubernetes are intentionally not introduced.

## Database

PostgreSQL 16+ via SQLAlchemy 2.0 (async) + Alembic. Schema: `users`, `analyses`,
`requirements`, `issues`, `documents`, `ai_provider_credentials` (revision `0001`) +
`refresh_tokens`, `email_verification_tokens`, `password_reset_tokens` (revision
`0002`) + analysis `status`/`source_text`, NULL-until-scored `score`/`band`,
requirement `section`/`segmentation` (revision `0003`) + the
`segmented|analyzed|failed` status CHECK (revision `0004`) +
`documents.file_type` + CHECK (revision `0005`), and privacy preferences
(`user_preferences`, revision `0006`) — fully documented in
[`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md).

Flow: configure `DATABASE_URL` → `alembic upgrade head` → start backend.
The schema is migration-controlled: never hand-edit the database, never `create_all()`
at startup.

## API

Versioned REST at `/api/v1` — see [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) for the
binding contract (envelopes, pagination, error codes). Interactive docs (non-production):
`http://localhost:8000/api/docs`. Current surface: `GET /health` (infra alias),
`GET /api/v1/health/live`, `GET /api/v1/health/ready` (live DB probe), and the full
auth API (`POST /api/v1/auth/register|login|logout|refresh|verify-email|resend-verification|forgot-password|reset-password|change-password`,
`GET /api/v1/auth/me`, `DELETE /api/v1/auth/account`), and the analysis API
(`POST /api/v1/analysis` TEXT-only → `201` ANALYZED detail with scores +
nested issues + breakdown; `GET` detail (incl. a `document` display pointer —
filename + type, no storage keys) + paged newest-first list with
`sort`/`band`/`source_type`; `DELETE` → `204` cascade; verified-user guard,
per-user 20/min; missing/foreign ids → identical `404`). Settings/privacy APIs
include profile, privacy retention settings, signed live export tickets, and
history purge/retention enforcement seams.

## Security model (summary)

Cookie sessions (httpOnly, rotating refresh) · argon2id passwords · email verification ·
ownership checks on every resource (cross-user IDs → 404) · user AI keys Fernet-encrypted
at rest, never returned/logged · uploads validated (type/size/magic-bytes) · account
deletion purges owned storage via the storage abstraction before DB cascade · privacy
export is owner-scoped and redacted · privacy-first Sentry/error monitoring (optional DSN,
scrubbed, no body/token/content capture) · bounded request IDs + JSON logs · rate limits +
Cloudflare Turnstile on public high-abuse auth ops · audits/secret scan. Details:
[`docs/SECURITY_SPEC.md`](docs/SECURITY_SPEC.md). Distributed limiter storage remains
future hardening work.

## Current limitations

Implemented: auth + auth UI, SRS text analysis, PDF/DOCX/TXT upload/extraction,
11-detector deterministic ambiguity analysis, transparent scoring, history, dashboard,
settings, AI provider management/enhancement/retry, reports, document list/download/delete,
Turnstile on sensitive public auth operations, privacy lifecycle controls, monitoring/Sentry
scrubbers, performance tuning, SEO public pages, Supabase Storage adapter, and production
runbook/env configuration.

Still intentionally pending: distributed/shared rate-limiter storage, external SEO/Search
Console validation, real production browser/device/accessibility screenshots, final user-guide
screenshots/docs, and final release audit. Stage 30 did not have live Supabase/Turnstile/Resend/
Sentry/AI provider credentials in the sandbox, so those integrations are documented and tested
through mocked/static checks but must be smoke-tested by operators on real deployed services.
Scores are heuristic triage aids, not validated measurements (see
[`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) §4.3 honest limits).

## Screenshots

See [`screenshots/`](screenshots/) (populated as UI stages land).

## Development workflow

This project is built in sequential stages by AI agents from ZIP handoffs — the repo must
be self-explanatory. **Agents: read [`docs/DEVELOPMENT_RULES.md`](docs/DEVELOPMENT_RULES.md)
and [`docs/STAGE_STATUS.md`](docs/STAGE_STATUS.md) before changing anything.**

## License

TBD (declared no later than the deployment stage — do not assume open-source until then).
