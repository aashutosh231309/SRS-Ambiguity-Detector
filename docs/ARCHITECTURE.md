# Architecture

> **Status:** Canonical as of Stage 01. Decisions recorded here are binding on later stages.
> Amend only via an ADR entry in §11 + `docs/CHANGELOG.md`.

## 1. Repository layout (canonical — do not rename without an ADR)

```
SRS-Ambiguity-Detector/
├── README.md                  # Setup + project overview (assignment deliverable)
├── docker-compose.yml         # Local PostgreSQL for development
├── .editorconfig / .gitignore
├── docs/                      # Project contract (this folder)
│   ├── PROJECT_SPEC.md        # Immutable baseline
│   ├── ARCHITECTURE.md        # This file
│   ├── DATABASE_SCHEMA.md     # Tables, ownership, migrations
│   ├── API_CONTRACT.md        # Versioned REST contract + envelopes
│   ├── SECURITY_SPEC.md       # Threat model + controls
│   ├── AI_PROVIDER_SPEC.md    # Provider abstraction + key lifecycle
│   ├── UI_UX_SPEC.md          # Design system + motion language
│   ├── SEO_SPEC.md            # Public SEO plan
│   ├── DEVELOPMENT_RULES.md   # Mandatory agent workflow
│   ├── STAGE_STATUS.md        # Progress ledger (update every stage)
│   ├── FUTURE_ROADMAP.md      # Stage plan with entry/exit criteria
│   └── CHANGELOG.md           # Contract + product changes
├── frontend/                  # Next.js App Router + TS + Tailwind
│   ├── src/app/               # Routes (public + (app) private groups later)
│   ├── src/components/        # Design-system + feature components
│   ├── src/lib/               # API client, env, utils (no secrets here)
│   ├── src/hooks/             # Shared hooks (first use Stage 05)
│   ├── src/types/             # Contract-mirrored domain types (as features land)
│   └── public/                # Static assets
├── backend/                   # Python + FastAPI
│   ├── app/
│   │   ├── main.py            # App factory, middleware, router mount
│   │   ├── core/              # config, logging, security primitives
│   │   ├── api/v1/            # Versioned routers + endpoint modules
│   │   ├── models/            # SQLAlchemy models (Stage 02+)
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   ├── services/          # Business logic (analysis orchestration, …)
│   │   ├── analysis/          # Deterministic NLP/rule engine (Stage 06+)
│   │   ├── ai/                # Provider abstraction + implementations (Stage 17+)
│   │   ├── email/             # Email abstraction + Resend adapter (Stage 04+)
│   │   └── storage/           # File storage abstraction (Stage 09+)
│   ├── tests/                 # pytest suite (mirrors app structure)
│   ├── requirements.txt       # Pinned runtime deps
│   └── requirements-dev.txt   # Pinned dev/test deps
├── scripts/
│   └── verify.sh              # Stage-completion verification runner
└── screenshots/               # Assignment deliverable (naming: see README there)
```

Forbidden: `part1/`, `stage1/`, `version2/`, or any parallel/temporary architectures.
All stages modify this SAME tree.

## 2. Technology decisions (locked)

| Area | Choice | Notes |
|------|--------|-------|
| Frontend | Next.js App Router, React, TypeScript (strict) | SSR for public SEO pages; client components only where needed |
| Styling | Tailwind CSS v4 (CSS-first `@theme`) | Design tokens in `globals.css`; no CSS-in-JS runtime |
| Motion | Motion for React (`motion` package) | Primary interaction system; GSAP only if scroll storytelling demands it |
| Icons | `lucide-react` | No emoji icons in UI |
| Charts | Recharts (NOT installed until Stage 13/15 — dependency discipline) | Dashboard + report visualizations |
| Backend | Python 3.11+, FastAPI, Pydantic v2 | Async endpoints; OpenAPI at `/api/docs` (dev/staging) |
| ORM / migrations | SQLAlchemy 2.0 (async) + Alembic | Migration per schema change; never ad-hoc DDL in prod |
| Database | PostgreSQL (Supabase managed in prod; `docker-compose` locally) | No SQLite/Postgres dialect forks in app code |
| DB driver | `asyncpg` | |
| Storage | Supabase Storage w/ signed URLs (prod); local FS adapter for dev/tests | Behind `storage/` abstraction |
| Email | Abstraction + Resend adapter | Verification, reset, security notices |
| Anti-bot | Cloudflare Turnstile (server-verified) | Registration, suspicious login, reset, abuse-prone ops |
| Monitoring | Sentry (aggressive scrubbing) | Never raw SRS text, keys, tokens, passwords |
| Package managers | `npm` (frontend), `pip` + pinned requirements (backend) | Commit `package-lock.json`; pin backend versions |

## 3. Runtime topology

```
Browser ──HTTPS──▶ Next.js (Vercel) ──HTTPS──▶ FastAPI (service host)
     │                    │                          │  │  │
     │                    │                          ▼  ▼  ▼
     │                    │                     Postgres  Storage  Resend / AI providers
     │                    └── SEO pages (SSR), app shell, charts
     └── httpOnly cookies (access + refresh); no tokens in localStorage
```

- Local dev: frontend `:3000`, backend `:8000`, Postgres via `docker-compose` (or Supabase project).
- API base URL is the ONLY backend address the browser needs: `NEXT_PUBLIC_API_URL`
  (default `http://localhost:8000/api/v1`). Browser code MUST NEVER call `localhost` for any
  other service; all backend access goes through this one base URL.

## 4. Backend module map

- `app/main.py` — creates app, installs middleware (CORS, request-id, security headers,
  rate limiting when added), mounts `api/v1` router, wires exception handlers that emit the
  uniform error envelope.
- `app/core/config.py` — ALL settings via `pydantic-settings` (env-driven, validated at boot).
  No `os.getenv` scattered through feature code.
- `app/core/logging.py` — structured logging + `RedactingFilter` (drops API keys, tokens,
  passwords, email bodies). Installed before any request handling.
- `app/api/v1/` — one router module per resource (`health`, `auth`, `analysis`, `documents`,
  `dashboard`, `ai_providers`, `settings`, `privacy`). Routers do validation + authn/z +
  call `services/`; no SQL in routers, no HTTP in services.
- `app/analysis/` — deterministic engine. Pure functions over text; configurable rule packs;
  emits findings with evidence offsets. MUST have zero network calls and zero LLM calls.
- `app/ai/` — provider abstraction (`AIProvider` ABC) + per-provider adapters. Called ONLY
  from an enhancement step that can fail open (deterministic result is always returned).
- `app/email/`, `app/storage/` — port/adapter abstractions so Resend/Supabase can be swapped.

## 5. Frontend module map

- `src/app/` — App Router. Public marketing routes at top level (`/`, `/features`,
  `/how-it-works`, …); authenticated product under a private route group (added Stage 05+).
  `layout.tsx` owns global metadata; `robots.ts`/`sitemap.ts` own crawler surface.
- `src/lib/api.ts` — single typed fetch wrapper: base URL, cookies (`credentials: "include"`),
  uniform error-envelope parsing. Feature code MUST NOT hand-roll `fetch` to the API.
- `src/lib/site.ts` — canonical site metadata (name, URL, description).
- `src/components/` — `ui/` (design-system primitives) + feature folders. Motion lives in
  small wrapper components sharing one easing/duration token set (`UI_UX_SPEC.md` §Motion).

## 6. Canonical request flows

**Analyze text (planned):** `POST /api/v1/analysis` → authn → rate limit → validate →
segment → `analysis/` engine → score → persist (`analyses`, `requirements`, `issues`) →
optional AI enhancement (timeout-guarded, fail-open) → unified response.

**Upload (planned):** `POST /api/v1/documents/upload` → authn → size/MIME/magic-byte checks →
extract (timeout + max-text guard) → segment → same pipeline → delete temp file.

**Auth (planned):** register → pending/unverified → Resend verification email → verify link →
active; login issues short-lived access JWT + rotating refresh in httpOnly `Secure`
cookies; every resource endpoint checks `owner_id == current_user.id`.

## 7. Configuration / environment matrix

Backend reads env via `app/core/config.py` (see `backend/.env.example` for the full list):

| Variable | Required in | Purpose |
|----------|-------------|---------|
| `APP_ENV` (`local`/`staging`/`production`) | all | Behavior switch (docs, frame headers, cookie `Secure`) |
| `DATABASE_URL` | staging/prod (Stage 02+) | `postgresql+asyncpg://…` (pooled/app connection) |
| `DIRECT_DATABASE_URL` | staging/prod (Stage 02+) | Direct connection for Alembic migrations (bypasses pooler) |
| `ENCRYPTION_MASTER_KEY` | staging/prod (Stage 17+) | Fernet key encrypting provider API keys at rest |
| `JWT_*` / cookie secrets | Stage 04+ | Access/refresh signing (reserved names in `.env.example`) |
| `RESEND_API_KEY`, `EMAIL_FROM` | Stage 04+ | Transactional email |
| `TURNSTILE_SECRET_KEY` | Stage 22+ | Server-side CAPTCHA verify |
| `SENTRY_DSN` | Stage 24+ | Monitoring (with scrubbing) |
| `STORAGE_*` | Stage 09+ | Supabase Storage / local adapter |

Frontend (`frontend/.env.example`): `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`;
later: Turnstile site key, Sentry DSN. `NEXT_PUBLIC_*` MUST NEVER hold secrets.

## 8. Data ownership rule

Every user-owned row carries `owner_id` (`users.id`); every endpoint verifies ownership
server-side and MUST NOT trust client-supplied IDs. Account deletion cascades to ALL
user-owned rows + storage objects + encrypted credentials (see `DATABASE_SCHEMA.md` §Deletion).

## 9. Non-negotiable contracts

1. API is versioned: `/api/v1/...`. Breaking changes require a new version + changelog entry.
2. Uniform envelopes (success resource / `{items,page,page_size,total}` / error object) —
   see `API_CONTRACT.md`. The frontend `lib/api.ts` encodes this; keep them in sync.
3. Deterministic engine has no network/LLM calls and runs without any AI key.
4. AI enhancement ALWAYS fails open; core result is never blocked by AI errors.
5. Secrets never enter git, logs, errors, analytics, or frontend bundles.

## 10. What Stage 01 leaves for later (explicitly NOT built)

Auth, DB models/migrations, engine, segmentation, upload/extraction, history, dashboard,
settings, AI providers, CAPTCHA/rate limits, Sentry wiring, marketing pages, tests beyond
health. Each has an owning stage in `FUTURE_ROADMAP.md`. Scaffolds added now are seams
(empty packages with docstrings), not implementations — do not mistake them for done.

## 11. Architecture Decision Records

- **ADR-001 (S01): Monorepo `frontend/` + `backend/` + `docs/`.** Rationale: single deployable
  contract, shared API envelope, one verification script. Rejected: two repos (contract drift).
- **ADR-002 (S01): API version prefix `/api/v1`.** Master prompt listed unversioned paths;
  versioning now avoids a breaking rename later.
- **ADR-003 (S01): Cookie-session auth (access + rotating refresh, httpOnly).**
  Rejected bearer-in-localStorage (XSS theft) — see `SECURITY_SPEC.md`.
- **ADR-004 (S01): Tailwind v4 CSS-first theming.** Rationale: tokens in one `globals.css`,
  no config-file drift; compatible with Next 15+ posture.
- **ADR-005 (S01): Async SQLAlchemy 2.0 + Alembic.** Rationale: matches FastAPI async,
  typed 2.0 style, managed migrations. Rejected: sync ORM, raw SQL per endpoint.
- **ADR-006 (S01): Fernet envelope for stored provider keys** (master key in env only,
  `vN:`-prefixed rotation). Rationale: misuse-resistant, versioned; see `SECURITY_SPEC.md`.
- **ADR-007 (S01): Self-hosted fonts via Fontsource (Inter + IBM Plex Mono).**
  Rejected `next/font/google` (build-time fetch of Google Fonts = third-party dependency,
  privacy request, offline-build failure). Same faces; tokens keep any future swap cheap.
