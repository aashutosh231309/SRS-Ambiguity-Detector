# SRS Ambiguity Detector

A production-quality web platform that analyzes Software Requirements Specification (SRS)
documents and requirement text, detects ambiguity with a **deterministic NLP/rule engine**,
explains every finding, scores requirement quality, and — optionally, with the user's own
AI provider keys — adds AI-generated overviews and improvements.

> **Current stage:** `00 + 01` — project contract, architecture, and repository foundation.
> See [`docs/STAGE_STATUS.md`](docs/STAGE_STATUS.md) for progress. The app skeleton runs;
> product features land in later stages per [`docs/FUTURE_ROADMAP.md`](docs/FUTURE_ROADMAP.md).

## Baseline (immutable — all 12 ship in v1)

Requirement text input · SRS upload (PDF/DOCX/TXT) · ambiguity detection + categories ·
explanations · suggested improvements · ambiguity score · authentication · database storage ·
analysis history · dashboard with charts · REST APIs — plus README + screenshots.

Full contract: [`docs/PROJECT_SPEC.md`](docs/PROJECT_SPEC.md).

## Repository map

```
frontend/   Next.js App Router + TypeScript (strict) + Tailwind v4 + Motion + Recharts
backend/    Python 3.11+ FastAPI, versioned API at /api/v1 (deterministic engine, no LLM calls in core)
docs/       Project contract — start here (new agents: DEVELOPMENT_RULES.md first)
scripts/    verify.sh — the stage-completion gate (lint, typecheck, tests, builds)
screenshots/  Assignment deliverable (UI captures per stage)
```

Key docs: `ARCHITECTURE.md` (decisions + ADRs) · `API_CONTRACT.md` (REST envelopes + endpoints) ·
`DATABASE_SCHEMA.md` (proposed schema) · `SECURITY_SPEC.md` (threat model + controls) ·
`AI_PROVIDER_SPEC.md` (provider abstraction) · `UI_UX_SPEC.md` (design system) ·
`SEO_SPEC.md` · `DEVELOPMENT_RULES.md` (mandatory workflow).

## Quickstart (local development)

Prerequisites: **Node.js 20+** (`npm`), **Python 3.11+**, and PostgreSQL 16+
(either [Docker](https://www.docker.com/) via `docker-compose.yml`, or a Supabase project).

```bash
# 1. Backend
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt -r requirements-dev.txt
cp .env.example .env                                 # defaults work for the skeleton
uvicorn app.main:app --reload --port 8000            # API → http://localhost:8000/api/v1/health/live

# 2. Frontend (new terminal)
cd frontend
npm install
cp .env.example .env.local                           # NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
npm run dev                                          # Web → http://localhost:3000

# 3. Database (from Stage 02; optional for the Stage-01 skeleton)
docker compose up -d db                              # local Postgres on :5432 (see docker-compose.yml)
```

Verify everything (lint + typecheck + tests + production builds):

```bash
./scripts/verify.sh
```

## Configuration

All settings are environment-driven and validated at boot. Copy the examples and edit:

- `backend/.env.example` → `backend/.env` (server-only; **never commit `.env`**)
- `frontend/.env.example` → `frontend/.env.local` (`NEXT_PUBLIC_*` only — never secrets)

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000/api/v1` | Browser → API base URL (the only backend address the browser needs) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Canonical site URL (SEO, emails, OAuth-free callbacks) |
| `APP_ENV` | `local` | `local` / `staging` / `production` behavior switch |
| `DATABASE_URL` | *(unset — skeleton runs without it)* | `postgresql+asyncpg://…` (required from Stage 02) |

## API

Versioned REST at `/api/v1` — see [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) for the
binding contract (envelopes, pagination, error codes). Interactive docs (non-production):
`http://localhost:8000/api/docs`. Current surface: `GET /health/live`, `GET /health/ready`.

## Security model (summary)

Cookie sessions (httpOnly, rotating refresh) · argon2id passwords · email verification ·
ownership checks on every resource (cross-user IDs → 404) · user AI keys Fernet-encrypted
at rest, never returned/logged · uploads validated (type/size/magic-bytes) · rate limits +
Turnstile on sensitive ops · Sentry with aggressive scrubbing. Details:
[`docs/SECURITY_SPEC.md`](docs/SECURITY_SPEC.md).

## Screenshots

See [`screenshots/`](screenshots/) (populated as UI stages land).

## Development workflow

This project is built in sequential stages by AI agents from ZIP handoffs — the repo must
be self-explanatory. **Agents: read [`docs/DEVELOPMENT_RULES.md`](docs/DEVELOPMENT_RULES.md)
and [`docs/STAGE_STATUS.md`](docs/STAGE_STATUS.md) before changing anything.**

## License

TBD (declared no later than Stage 30 — do not assume open-source until then).
