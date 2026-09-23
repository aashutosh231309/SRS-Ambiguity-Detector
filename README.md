# SRS Ambiguity Detector

A production-quality web platform that analyzes Software Requirements Specification (SRS)
documents and requirement text, detects ambiguity with a **deterministic NLP/rule engine**,
explains every finding, scores requirement quality, and — optionally, with the user's own
AI provider keys — adds AI-generated overviews and improvements.

> **Status: under staged development.** Foundation + database layer (Stage 02) are in
> place; product features land stage by stage. See
> [`docs/STAGE_STATUS.md`](docs/STAGE_STATUS.md) for progress and
> [`docs/FUTURE_ROADMAP.md`](docs/FUTURE_ROADMAP.md) for the plan.

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

| Area | Command | Purpose |
|------|---------|---------|
| Frontend | `npm install` | Install dependencies |
| Frontend | `npm run dev` | Dev server on `:3000` |
| Frontend | `npm run build` / `npm run start` | Production build / serve it |
| Frontend | `npm run lint` | ESLint (flat config, `react/no-danger`) |
| Frontend | `npm run typecheck` | `tsc --noEmit` (strict) |
| Frontend | `npm test` | Vitest unit tests (`*.test.ts`) |
| Frontend | `npm run format` | Prettier check |
| Backend | `pip install -r requirements.txt -r requirements-dev.txt` | Install (in venv) |
| Backend | `uvicorn app.main:app --reload --port 8000` | Dev server on `:8000` |
| Backend | `python -m pytest -q` | Test suite |
| Backend | `ruff check app tests alembic` / `ruff format --check app tests alembic` | Lint / format check |
| Backend | `mypy app` | Strict typecheck (`alembic/` excluded — operational scripts) |
| Backend | `alembic upgrade head` / `current` / `history` / `check` | Migrate / status / drift check |
| Backend | `alembic revision -m "…" --autogenerate` | New migration (always REVIEW the diff) |
| Repo | `./scripts/verify.sh` | Full gate (everything above, in order) |

Python dependency strategy: pinned `backend/requirements*.txt` are the install source;
`backend/pyproject.toml` holds tool configuration only (ruff, mypy, pytest).

## Configuration

All settings are environment-driven and validated at boot. Copy the examples and edit:

- `backend/.env.example` → `backend/.env` (server-only; **never commit `.env`**)
- `frontend/.env.example` → `frontend/.env.local` (`NEXT_PUBLIC_*` only — never secrets)
- Root `.env.example` is the master inventory + `docker compose` reference (documents all
  variables in one place; only `${POSTGRES_*}` is read from the repo root)

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api/v1` | Browser → API base URL (the only backend address the browser needs) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Canonical site URL (SEO, emails, OAuth-free callbacks) |
| `APP_ENV` | `local` | `local` / `staging` / `production` behavior switch |
| `DATABASE_URL` | *(unset — app boots; `/ready` reports `not_configured`)* | `postgresql+asyncpg://…` app connection |
| `DIRECT_DATABASE_URL` | *(falls back to `DATABASE_URL`)* | Direct connection for Alembic (bypasses Supabase pooler) |

## Database

PostgreSQL 16+ via SQLAlchemy 2.0 (async) + Alembic. Schema: `users`, `analyses`,
`requirements`, `issues`, `documents`, `ai_provider_credentials` (revision `0001`,
fully documented in [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md)).

Flow: configure `DATABASE_URL` → `alembic upgrade head` → start backend.
The schema is migration-controlled: never hand-edit the database, never `create_all()`
at startup. Auth-token tables arrive with the authentication stage.

## API

Versioned REST at `/api/v1` — see [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) for the
binding contract (envelopes, pagination, error codes). Interactive docs (non-production):
`http://localhost:8000/api/docs`. Current surface: `GET /health` (infra alias),
`GET /api/v1/health/live`, `GET /api/v1/health/ready` (live DB probe).

## Security model (summary)

Cookie sessions (httpOnly, rotating refresh) · argon2id passwords · email verification ·
ownership checks on every resource (cross-user IDs → 404) · user AI keys Fernet-encrypted
at rest, never returned/logged · uploads validated (type/size/magic-bytes) · rate limits +
Turnstile on sensitive ops · Sentry with aggressive scrubbing. Details:
[`docs/SECURITY_SPEC.md`](docs/SECURITY_SPEC.md). The app is NOT yet production-hardened —
dedicated security stages do that later.

## Current limitations

Foundation + database only — intentionally NOT implemented yet: authentication,
deterministic engine, analysis API, analyzer UI, document upload/extraction, history,
dashboard, settings, AI providers, CAPTCHA/rate limits, Sentry. The home page is an
honest placeholder (replaced by the marketing stage), and `ApiStatus` needs the backend
running. Full plan: [`docs/FUTURE_ROADMAP.md`](docs/FUTURE_ROADMAP.md).

## Screenshots

See [`screenshots/`](screenshots/) (populated as UI stages land).

## Development workflow

This project is built in sequential stages by AI agents from ZIP handoffs — the repo must
be self-explanatory. **Agents: read [`docs/DEVELOPMENT_RULES.md`](docs/DEVELOPMENT_RULES.md)
and [`docs/STAGE_STATUS.md`](docs/STAGE_STATUS.md) before changing anything.**

## License

TBD (declared no later than the deployment stage — do not assume open-source until then).
