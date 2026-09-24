# SRS Ambiguity Detector

SRS Ambiguity Detector is a full-stack web application for reviewing Software Requirements Specification (SRS) text and documents. It identifies requirement statements that may be vague, incomplete, subjective, underspecified, or difficult to verify; explains each finding; assigns transparent heuristic scores; and optionally adds AI-assisted overviews and rewrite suggestions using the user's own provider keys.

The deterministic engine is the authoritative analysis layer. AI is optional and additive.

## Overview

Ambiguous requirements make implementation and testing harder because teams may interpret the same statement differently. This project helps reviewers find likely ambiguity patterns early by combining:

- deterministic requirement segmentation;
- 11 rule-based detector categories;
- evidence spans, reasons, recommendations, and severities;
- transparent scoring and health dimensions;
- saved reports, history, and dashboard analytics;
- optional user-owned AI enhancement.

The tool does **not** guarantee perfect ambiguity detection. It provides explainable review signals that should be interpreted by a human analyst.

## Key features

- Paste SRS/requirement text and run deterministic ambiguity analysis.
- Upload one PDF, DOCX, or TXT file and analyze extracted text through the same pipeline.
- View requirement-level findings with highlighted phrases, detector ids, reasons, and recommendations.
- See transparent scores, severity counts, category distributions, and health dimensions.
- Save analyses to PostgreSQL-backed history and open detailed report pages.
- Use dashboard charts for aggregate analysis activity and ambiguity trends.
- Manage profile, password, privacy, and account deletion flows.
- Export/purge privacy data and configure history retention.
- Manage encrypted, user-owned AI provider credentials.
- Optionally request AI overview/rewrite enrichment without blocking deterministic results.
- Use production-oriented security controls: HttpOnly cookies, refresh rotation, CSRF origin checks, Turnstile support, rate limits, Sentry scrubbers, dependency audits, and secret scanning.

## Screenshots

Screenshots are required for final presentation, but this sandbox had no browser runtime available for Stage 31. No fake screenshots are committed.

See [`screenshots/README.md`](screenshots/README.md) for the required final screenshot catalog, safe demo data, capture procedure, and privacy checklist.

## System architecture

```text
Browser
  ↓ HTTPS
Next.js / React frontend
  ↓ /api/v1 REST calls with HttpOnly cookies
FastAPI backend
  ↓ service layer
Repository layer / SQLAlchemy
  ↓
PostgreSQL

FastAPI integrations:
  PostgreSQL/Supabase · local or Supabase Storage · Resend · Turnstile · Sentry · user-owned AI providers
```

Production topology is documented in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md): Vercel hosts the Next.js frontend, while FastAPI runs on a separate Python-capable service host connected to PostgreSQL/Supabase and storage.

Detailed architecture: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## How ambiguity detection works

```text
Text or extracted document content
  → normalization
  → deterministic requirement segmentation
  → detector registry
  → deduplication
  → scoring and health dimensions
  → persistence
  → report UI
  → optional AI enhancement
```

Implemented detector categories:

- vague quantifiers;
- subjective terms;
- missing measurable criteria;
- pronoun references;
- optional language;
- ambiguous operators;
- undefined terminology;
- absolute language;
- passive voice / unclear actor;
- missing constraints;
- incomplete requirements.

Scoring is heuristic and transparent:

```text
Requirement score = clamp(100 - Σ severity deductions, 0, 100)
```

Deductions are low −5, medium −10, high −15, critical −20. Analysis score is the mean of requirement scores. Bands are low, moderate, high, and very high ambiguity.

Full engine documentation: [`docs/DETECTION_ENGINE.md`](docs/DETECTION_ENGINE.md).

## Supported input

| Input | Support |
| --- | --- |
| Pasted text | Up to 200,000 characters. |
| PDF | Validated by extension, MIME/magic bytes, parser limits, and extraction budget. |
| DOCX | Validated as OOXML with zip-bomb guards. |
| TXT | Validated as text, with binary/NUL checks. |

Uploads are exactly one file per request, up to 10 MiB. Uploaded binaries are stored through the storage abstraction; metadata is stored in PostgreSQL.

## AI enhancement

AI enhancement is optional:

- the app works without any AI key;
- users bring their own provider credentials;
- credentials are encrypted with Fernet using `ENCRYPTION_MASTER_KEY`;
- keys are never returned after creation;
- deterministic analysis persists before provider calls;
- AI failures do not block the report;
- retry-AI is available for saved analyses;
- result pages disclose what kind of content is sent to providers.

Supported providers:

- Google Gemini;
- Groq;
- OpenAI;
- Anthropic;
- OpenRouter;
- Hugging Face Inference Providers router.

Provider calls are covered by mocked HTTP tests in the repository. Live provider validation requires real user-owned credentials and is not claimed from this sandbox.

## Authentication and security

Implemented security controls include:

- Argon2id password hashing;
- email verification and password reset tokens stored as SHA-256 hashes;
- short-lived HS256 access JWT and rotating refresh token cookies;
- refresh-token reuse detection and family revocation;
- HttpOnly cookies, `Secure` in production, `SameSite=Lax`;
- Origin/Referer checks on mutating cookie-authenticated routes;
- exact-origin CORS with credentials;
- per-route/process-local rate limiting;
- Cloudflare Turnstile support for high-abuse public auth operations;
- ownership checks on every user resource with foreign ids returning 404;
- encrypted AI credentials;
- upload validation and private object storage;
- short-lived signed document download tokens;
- production OpenAPI gating;
- security headers and report-only CSP;
- Sentry/log redaction;
- `npm audit`, `pip-audit`, and secret scan in the verification gate.

Security details: [`docs/SECURITY_SPEC.md`](docs/SECURITY_SPEC.md).

## Privacy and data lifecycle

The app stores account data, analysis metadata/text, requirement findings, uploaded-document metadata, encrypted provider credentials, and privacy preferences.

Implemented privacy controls:

- live owner-scoped data export;
- history retention settings;
- manual history purge;
- retention purge CLI;
- account deletion that purges owned storage objects and deletes user-owned database rows through cascades;
- export exclusions for password hashes, auth tokens, provider-key ciphertext, storage paths, file bytes, signed tokens, and infrastructure credentials.

See [`docs/SECURITY_SPEC.md`](docs/SECURITY_SPEC.md#10-privacydata-lifecycle-controls-implemented-stage-23) and [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md).

## Technology stack

| Area | Technology |
| --- | --- |
| Frontend | Next.js App Router, React, TypeScript, Tailwind CSS v4, Motion, Recharts |
| Frontend tests | Vitest, Testing Library, ESLint, Prettier |
| Backend | Python 3.11+, FastAPI, Pydantic v2 |
| Database | PostgreSQL 16-compatible, SQLAlchemy 2.0 async, Alembic, asyncpg |
| Storage | Local filesystem adapter; Supabase Storage adapter |
| Email | Resend adapter; console/file outbox for local development |
| AI | Provider abstraction with six adapters; user-owned encrypted credentials |
| Monitoring | Optional Sentry backend/frontend integrations with scrubbers |
| Verification | `scripts/verify.sh`, pytest, mypy, ruff, npm audit, pip-audit, secret scan |

Pinned backend dependencies are in [`backend/requirements.txt`](backend/requirements.txt). Frontend dependencies are in [`frontend/package.json`](frontend/package.json).

## Project structure

```text
SRS-Ambiguity-Detector/
├── backend/              FastAPI app, SQLAlchemy models, Alembic migrations, tests
├── frontend/             Next.js App Router UI, components, frontend tests
├── docs/                 Architecture, API, security, deployment, roadmap, summary docs
├── screenshots/          Screenshot catalog and capture procedure
├── scripts/              Verification and secret-scan scripts
├── docker-compose.yml    Local PostgreSQL service only
├── .env.example          Master environment inventory
└── README.md
```

## API overview

The backend exposes `/api/v1` route groups for:

- `/auth`
- `/analysis`
- `/documents`
- `/dashboard`
- `/ai/providers`
- `/settings`
- `/privacy`
- `/health`

See [`docs/API_OVERVIEW.md`](docs/API_OVERVIEW.md) for a concise route guide and [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) for the full contract.

## Local development

Prerequisites:

- Node.js 20+ and npm;
- Python 3.11+;
- PostgreSQL 16+ via Docker, system install, or Supabase;
- optional: Resend, Turnstile, Sentry, and AI provider credentials for integration testing.

```bash
# 1. Start local PostgreSQL if Docker is available
# docker-compose.yml contains only a local db service.
docker compose up -d db

# 2. Backend
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt -r requirements-dev.txt
cp .env.example .env
# edit DATABASE_URL, DIRECT_DATABASE_URL, JWT_SECRET, and other values
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 3. Frontend in another terminal
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The backend health alias is `http://localhost:8000/health`.

If PostgreSQL is unavailable, DB-backed tests skip safely, but the full application needs a configured database.

## Environment variables

Use the example files as the source of truth:

- root [`.env.example`](.env.example) — inventory and local compose variables;
- [`backend/.env.example`](backend/.env.example) — server-only backend config and secrets;
- [`frontend/.env.example`](frontend/.env.example) — browser-public `NEXT_PUBLIC_*` config only.

Important production variables:

- `APP_ENV=production`
- `DEBUG=false`
- `BACKEND_CORS_ORIGINS=https://your-frontend.example`
- `DATABASE_URL`
- `DIRECT_DATABASE_URL`
- `JWT_SECRET`
- `ENCRYPTION_MASTER_KEY` if AI credentials are enabled
- `EMAIL_PROVIDER=resend`
- `RESEND_API_KEY`
- `STORAGE_BACKEND=supabase`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `TURNSTILE_ENABLED=true`
- `TURNSTILE_SECRET_KEY`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`

There are deliberately no global `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, or `HUGGINGFACE_API_KEY` variables. Users add their own encrypted provider keys in Settings.

## Database and migrations

PostgreSQL schema is managed by Alembic.

```bash
cd backend
alembic upgrade head
alembic current
alembic heads
alembic history --verbose
```

Use `DIRECT_DATABASE_URL` for migration jobs when the runtime `DATABASE_URL` points at a pooler. Never run ad-hoc DDL or `create_all()` in production.

Schema documentation: [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md).

## Testing and verification

Full repository gate:

```bash
./scripts/verify.sh
```

This runs backend lint/format, mypy, pytest, FastAPI import sanity, frontend lint, typecheck, Vitest, Prettier, Next production build, secret scan, `npm audit`, and `pip-audit`.

Useful focused commands:

```bash
cd backend && python -m pytest -q
cd backend && ruff check app tests alembic && ruff format --check app tests alembic
cd backend && mypy app
cd frontend && npm run lint && npm run typecheck && npm test && npm run build
```

## Deployment

Detailed production deployment documentation is in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

Summary:

- Frontend: Vercel-hosted Next.js app.
- Backend: separate Python/FastAPI service host; not hosted by Vercel.
- Database: PostgreSQL/Supabase.
- Storage: Supabase Storage for managed production; local storage only for development or single-node durable-disk deployments.
- External services: Resend, Cloudflare Turnstile, optional Sentry, optional user-owned AI providers.

Stage 30 chose single-instance/process-local rate limiting for v1 production. Do not horizontally scale the backend without accepting approximately `N × limit` budgets or implementing a shared limiter.

## Limitations

- Detection is heuristic and English-first; it can produce false positives and false negatives.
- No OCR for scanned/image-only PDFs.
- No guarantee of search ranking or SEO performance.
- No team workspaces or shared analyses in v1.
- No PDF/DOCX export of analysis reports yet.
- Process-local rate limiting is not a distributed limiter.
- Live Supabase, Turnstile, Resend, Sentry, browser/device, and AI-provider validation require operator credentials/environments and are not claimed from this sandbox.
- Screenshots were not captured in this sandbox because no browser runtime was available.
- No open-source license is declared yet; do not assume reuse rights until a `LICENSE` file is added.

## Future enhancements

- Shared/team workspaces.
- DOCX/PDF export of reports.
- CLI or batch API for CI pipelines.
- Multilingual analysis.
- More advanced NLP and configurable detector packs.
- Additional AI providers if needed.
- Shared/distributed rate limiting for horizontal backend deployments.
- Final browser/device/accessibility evidence and screenshot set.

## Project documentation

- [`docs/PROJECT_SUMMARY.md`](docs/PROJECT_SUMMARY.md) — college/project submission summary.
- [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md) — primary user flows and result interpretation.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system architecture and ADRs.
- [`docs/DETECTION_ENGINE.md`](docs/DETECTION_ENGINE.md) — detector categories and scoring.
- [`docs/API_OVERVIEW.md`](docs/API_OVERVIEW.md) — concise route guide.
- [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) — full API contract.
- [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) — schema and migration details.
- [`docs/SECURITY_SPEC.md`](docs/SECURITY_SPEC.md) — threat model and controls.
- [`docs/AI_PROVIDER_SPEC.md`](docs/AI_PROVIDER_SPEC.md) — AI architecture and providers.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — production deployment runbook.
- [`docs/REQUIREMENTS_TRACEABILITY.md`](docs/REQUIREMENTS_TRACEABILITY.md) — final requirement-to-implementation evidence matrix.
- [`docs/FINAL_AUDIT.md`](docs/FINAL_AUDIT.md) — Stage 32 final audit, security review, validation split, and limitations.
- [`docs/FUTURE_ROADMAP.md`](docs/FUTURE_ROADMAP.md) — staged roadmap and future scope.
- [`docs/STAGE_STATUS.md`](docs/STAGE_STATUS.md) — implementation ledger.
- [`screenshots/README.md`](screenshots/README.md) — final screenshot catalog and procedure.

## License

No project license has been declared in this repository. Until a `LICENSE` file is added by the project owner, do not assume the code is open source.
