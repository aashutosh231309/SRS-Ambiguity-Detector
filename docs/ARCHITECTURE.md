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
│   ├── src/app/               # Routes + loading/error/not-found conventions
│   ├── src/components/        # layout/ primitives, ui/ later, + feature components
│   ├── src/lib/               # API client, env, utils (no secrets here)
│   ├── src/hooks/             # Shared hooks (first use Stage 05)
│   ├── src/types/             # Contract-mirrored domain types (as features land)
│   └── public/                # Static assets
├── backend/                   # Python + FastAPI
│   ├── app/
│   │   ├── main.py            # App factory, middleware, router mount
│   │   ├── core/              # config, logging, security primitives
│   │   ├── api/v1/            # Versioned routers + endpoint modules
│   │   ├── models/            # SQLAlchemy models (9 tables, Stages 02+04)
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   ├── services/          # Business logic (analysis orchestration, …)
│   │   ├── repositories/      # Data access — SQLAlchemy lives here only
│   │   ├── exceptions/        # AppError → envelope mapping
│   │   ├── analysis/          # Deterministic NLP/rule engine (Stage 06+)
│   │   ├── ai/                # ABC + registry (12 ✅); 4 adapters + prompts + enhancement (14 ✅)
│   │   ├── email/             # Email port + Resend/console adapters (Stage 04 ✅)
│   │   └── storage/           # StorageBackend ABC + local adapter (Stage 08 ✅)
│   ├── alembic.ini            # Migration config (no DSN — env.py reads app config)
│   ├── alembic/               # env.py + versions/ (linear; 0001 schema, 0002 auth tokens)
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
- `app/core/database.py` — lazy async engine + session factory (`get_session` is the
  request-DI seam, wired by the auth routes in Stage 04) + lifespan disposal. DSN is
  never logged or echoed (parse-error chains suppressed).
- `app/core/security.py` + `app/core/rate_limit.py` (Stage 04) — argon2id/token/JWT
  primitives and single-process auth buckets (fail-open documented; Stage 22 distributes).
- `app/models/` — one module per table on `Base` (users, analyses, requirements,
  issues, documents, ai_provider_credentials, + `auth_tokens.py` triple in Stage 04).
- `app/services/` + `app/repositories/` + `app/schemas/` + `app/exceptions/` — the
  service layer (Stage 03): business logic, data access, Pydantic boundaries, and
  `AppError` → envelope mapping. Canonical paths: `services/readiness.py`,
  `services/auth.py` (Stage 04: sessions, rotation, recovery — pure of HTTP),
  `services/segmentation.py` (Stage 06: pure deterministic segmenter — no I/O),
  `services/analysis.py` (Stage 06: validate → normalize → segment → persist flow),
  `repositories/analysis.py` + `schemas/analysis.py` + `api/v1/endpoints/analysis.py`
  (Stage 06: TEXT-only POST; `dependencies.py` ownership gate).
- `backend/alembic/` — migration env resolving the DSN exactly like the app, plus
  linear `versions/` (each with `downgrade()`).
- `app/core/logging.py` — structured logging + `RedactingFilter` (drops API keys, tokens,
  passwords, email bodies). Installed before any request handling.
- `app/api/v1/` — one router module per resource (`health`, `auth`, `analysis`, `documents`,
  `dashboard`, `ai_providers`, `settings`, `privacy`). Routers do validation + authn/z +
  call `services/`; no SQL in routers, no HTTP in services.
- `app/analysis/` — deterministic engine (Stage 07 ✅). Pure functions over text;
  configurable rule packs; emits findings with evidence offsets. MUST have zero network
  calls and zero LLM calls. Its Stage 06 precursor, `services/segmentation.py`, already
  honors that rule: pure segmentation over normalized text, no I/O, no scores.
- `app/ai/` (Stage 12 ✅ + Stage 14 ✅) — provider abstraction (`AIProvider` ABC) +
  metadata registry + four adapters (`adapters/`: shared httpx core, OpenAI-compat
  base, gemini/groq/openai/openrouter) + versioned prompts + sanitizer + model
  table. Called ONLY from `services/ai_enhancement.py`, which runs post-commit
  and fails open (deterministic result is always returned). `app/core/vault.py`
  (Stage 12 ✅) owns the Fernet envelope for per-user keys (env-only master key,
  lazy validation).
- `app/email/` (Stage 04 ✅) — port (`EmailMessage` + templates + `EmailService` ABC)
  with Resend (prod) and console/file-outbox (dev-only, refused in prod) adapters;
  sends are best-effort post-commit background work.
- `app/documents/` (Stage 08 ✅) — pure ingestion: `validation.py` (sanitize +
  extension/MIME/magic/structure pipeline → `ValidatedUpload`) and
  `extraction.py` (pdf/docx/txt readers → `ExtractedDocument`, char-budgeted).
  No HTTP, no DB. `services/documents.py` orchestrates (stream → stage →
  validate+extract in a worker thread + timeout → shared `analyze_text` core →
  transactional persist → storage move); `repositories/documents.py` +
  `schemas/documents.py` + `api/v1/endpoints/documents.py` complete the slice;
  `api/v1/presenters.py` is the single service→response mapper for BOTH
  text and document analyses.
- `app/storage/` (Stage 08 ✅) — `base.py` (`StorageBackend` ABC:
  `store_file`/`delete`) + `local.py` (dev adapter: server-generated keys
  under `STORAGE_LOCAL_DIR`, traversal/symlink-proof resolution, empty-dir
  pruning, EXDEV-safe move). `storage_key_for_document()` owns the key
  convention. Supabase adapter arrives with the prod stages.

## 5. Frontend module map

- `src/app/` — App Router. Public marketing routes at top level (`/`, `/features`,
  `/how-it-works`, …); authenticated product under a private route group (added Stage 05+).
  `layout.tsx` owns global metadata; `robots.ts`/`sitemap.ts` own crawler surface.
- `src/lib/api.ts` — single typed fetch wrapper: base URL, cookies (`credentials: "include"`),
  uniform error-envelope parsing, default 30 s timeout (overridable per call). Feature code
  MUST NOT hand-roll `fetch` to the API. Pinned by `src/lib/api.test.ts` (Vitest).
- `src/lib/site.ts` — canonical site metadata (name, URL, description).
- `src/components/layout/` — layout primitives (`Container` page width); `ui/` arrives with
  the design-system stages. Motion lives in small wrappers sharing one easing/duration
  token set (`UI_UX_SPEC.md` §Motion).
- App conventions: `loading.tsx` (route-transition fallback), `error.tsx` (safe message +
  retry; never renders details), `not-found.tsx` (branded 404). Feature routes may add
  closer-to-the-data variants later.
- `src/app/(auth)/` (Stage 05) — private auth route group (`login`, `signup`,
  `forgot-password`, `reset-password`, `verify-email`); shared shell + `noindex,
  nofollow`. No product routes yet — the private product group arrives with the
  dashboard stage.
- Auth state (Stage 05): `components/auth/AuthProvider.tsx` (single source of truth:
  `status`/`user` + `login`/`signup`/`logout`/`refreshUser`/`clearAuth`) consumed via
  `hooks/useAuth.ts`; identity resolves once via `GET /auth/me` (module-level
  in-flight guard — one request even under StrictMode). `lib/auth.ts` is the ONLY
  `/auth/*` caller (built on `lib/api.ts`); silent refresh is single-flight +
  retry-once, shared via `withSessionRetry` (serves `me`/`change-password` since
  Stage 05, analysis creation since Stage 06). `lib/auth-errors.ts` maps backend
  `code` → UI copy (never server strings); `lib/auth-validation.ts` mirrors
  policy client-side for instant feedback (server authoritative). Tests: Vitest 5 +
  `jsdom` + Testing Library (`vitest.config.ts` mirrors the `@/*` alias; node env
  default, `jsdom` per-file pragma, no globals; `vitest.setup.ts` stubs
  IntersectionObserver for motion's `whileInView`).
- Analyzer (Stage 06 input → Stage 07 scored results → Stage 08 upload → Stage 09 report):
  `/analyzer` (verified-guard + `noindex,nofollow`) — `components/analyzer/`
  (`AnalyzerWorkspace` input→result orchestration with Paste-text/Upload-file
  tabs; `AnalyzerForm` paste input/validation; `DocumentUploadForm`
  dropzone+picker for exactly one PDF/DOCX/TXT with honest indeterminate
  progress; `AnalysisResultView` + `ScoreRing` + `RequirementCard` +
  `IssueCard` + `SeverityBadge` shared result view; `AnalyzerEntryLink` home
  CTA; `SegmentPreview` deleted in Stage 07) on `lib/analysis.ts`
  (`createAnalysis`/`getAnalysis`/`listAnalyses`/`deleteAnalysis`, the ONLY
  `/analysis` caller) + `lib/documents.ts` (`uploadDocument`/`getDocument`,
  the ONLY `/documents` caller, multipart via `apiForm`) with
  `types/analysis.ts` + `types/documents.ts` mirroring contract §4.3/§4.4
  exactly; `lib/analysis-errors.ts` maps backend `code` → UI copy (never
  server strings; reuses the auth param table for field errors). Stage 09
  adds the saved-report route `/analysis/[id]` (verified-guard +
  `noindex,nofollow`) — `AnalysisReportScreen` (load/not-found/session/
  retry states over `getAnalysis`) rendering the SAME `AnalysisResultView`
  as the workspace (`context` + footer `actions` differ, never the report:
  overviews, search/filter/sort toolbar, collapsed-by-default issues,
  `failed`/`segmented`/clean states) with `AnalysisReportScreen` footer
  `DeleteAnalysisButton` (explicit confirm dialog) + `CategoryBars` /
  `HealthBars` / `CopyButton` atoms on `lib/reporting.ts` (client-side
  counts/filters/sorts over the persisted record — zero recalculation).

## 6. Canonical request flows

**Analyze text (Stage 07 ✅ + AI Stage 14 ✅):** `POST /api/v1/analysis` →
verified-user guard (authn + CSRF + 20/min per-user bucket) → validate →
normalize → deterministic segment → detect → score → transactional persist
(`analyses` + `requirements` + `issues`) → OPTIONAL AI step (only when
`options.ai_enhance` is true: credential chain → provider calls OUTSIDE any
transaction → one short follow-up txn stamps ONLY `ai_*` columns + rewrites)
→ `201` ANALYZED detail (scores, nested issues, `score_breakdown`, honest
`ai_status`). AI can never block or alter the deterministic result.

**Upload (Stage 08 ✅):** `POST /api/v1/documents/upload` → verified-user guard
(authn + CSRF + 10/min upload bucket) → stream to 0600 temp (byte budget on
the TRUE count) → validate+extract in a worker thread + 60 s timeout → SAME
segment → detect → score pipeline as pasted text → one transaction (document
row + FULL analysis graph) → move temp into storage → `201`
`{document, analysis}` (+ the SAME post-commit AI step when the `ai_enhance`
form field is true — Stage 14: one shared enhancement call, identical
vocabulary). Any failure: no rows, no objects, no temp files.

**Auth (backend ✅ Stage 04; UI ✅ Stage 05):** register → unverified (+ verify email) →
verify link → verified + auto-login; login issues short-lived access JWT + rotating
refresh in `HttpOnly; Secure (prod); SameSite=Lax` cookies; `POST /auth/refresh` rotates
(reuse of a rotated token revokes the family); logout/change/reset revoke server-side;
forgot/reset/change/delete emit security notices; every resource endpoint checks
`owner_id == current_user.id` (`get_current_verified_user` gate).

## 7. Configuration / environment matrix

Backend reads env via `app/core/config.py` (see `backend/.env.example` for the full list):

| Variable | Required in | Purpose |
|----------|-------------|---------|
| `APP_ENV` (`local`/`staging`/`production`) | all | Behavior switch (docs, frame headers, cookie `Secure`) |
| `DATABASE_URL` | staging/prod (Stage 02+) | `postgresql+asyncpg://…` (pooled/app connection) |
| `DIRECT_DATABASE_URL` | staging/prod (Stage 02+) | Direct connection for Alembic migrations (bypasses pooler) |
| `ENCRYPTION_MASTER_KEY` | staging/prod (Stage 12 ✅) | Fernet key encrypting provider API keys at rest (absent legal — AI optional; malformed fails boot) |
| `AI_DEFAULT_TIMEOUT_S` (25) + `AI_MAX_TIMEOUT_S` (60) | all (Stage 14 ✅) | Per-call provider timeout + hard clamp (adapters clamp every `timeout_s` into `[1, MAX]`; DEFAULT > MAX fails boot) |
| `JWT_SECRET`, `ACCESS_TOKEN_MINUTES`, `REFRESH_TOKEN_DAYS` (+ verify/reset TTLs) | all (Stage 04 ✅) | Access/refresh signing — secret REQUIRED, fail-closed |
| `EMAIL_PROVIDER`, `RESEND_API_KEY`, `EMAIL_FROM`, `APP_BASE_URL`, `DEV_OUTBOX_DIR` | all (Stage 04 ✅) | Transactional email (console dev-only, refused in prod) |
| `RATE_LIMIT_*` | all (Stage 04 ✅ + Stage 06 ✅ + Stage 08 ✅ + Stage 12 ✅) | Auth buckets + per-user analysis bucket (`RATE_LIMIT_ANALYSIS_PER_MINUTE`, default 20) + per-user upload bucket (`RATE_LIMIT_UPLOADS_PER_MINUTE`, default 10) + per-user AI-test bucket (`RATE_LIMIT_AI_TEST_PER_MINUTE`, default 10), single-process (distributed Stage 22) |
| `ARGON2_*` | all (Stage 04 ✅) | Password work factors |
| `MAX_UPLOAD_SIZE_BYTES` (10 MiB) + `MAX_EXTRACTED_TEXT_CHARS` (200 000) + `MAX_FILES_PER_REQUEST` (1) + `DOCUMENT_PROCESSING_TIMEOUT_SECONDS` (60) | all (Stage 08 ✅) | Upload/validate/extract budgets (request-time resolution, retunable per env) |
| `TURNSTILE_SECRET_KEY` | Stage 22+ | Server-side CAPTCHA verify |
| `SENTRY_DSN` | Stage 24+ | Monitoring (with scrubbing) |
| `STORAGE_BACKEND` + `STORAGE_LOCAL_DIR` | all (Stage 08 ✅) | `local` dev adapter (server-generated keys under the dir); Supabase adapter with prod stages |

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
