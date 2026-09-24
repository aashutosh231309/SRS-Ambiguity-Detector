# Production Deployment Runbook

Stage 30 production target for v1:

```text
Browser ─HTTPS─> Next.js frontend (Vercel) ─HTTPS─> FastAPI backend host
                                                   ├─ PostgreSQL (Supabase)
                                                   ├─ Supabase Storage (private bucket)
                                                   ├─ Resend email
                                                   ├─ Cloudflare Turnstile
                                                   ├─ Sentry (optional)
                                                   └─ User-owned AI providers (optional, encrypted per user)
```

FastAPI is **not** hosted by Vercel in this topology. Deploy it to a Python-capable service
(Render/Fly/Railway/AWS/GCP/Azure or equivalent) with HTTPS, persistent env vars, and a release step
that can run Alembic migrations.

## 1. Prerequisites

- Node.js 20+ and Python 3.11+ build environments.
- PostgreSQL 16-compatible database. Supabase is the documented production choice.
- A private Supabase Storage bucket, e.g. `srs-documents`.
- A backend host that can run `uvicorn app.main:app` behind HTTPS.
- Vercel project for the Next.js frontend.
- Resend API key and verified sender/domain for transactional email.
- Cloudflare Turnstile site key + secret for the production frontend domain.
- Optional Sentry projects for backend and frontend.
- A secret manager for env vars and a secure backup location for the Fernet master key.

## 2. Environment variables

### Frontend public variables (`frontend/.env.local` / Vercel)

These are intentionally public because they are bundled into browser code.

| Variable | Required | Production value |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | yes | `https://api.example.com/api/v1` |
| `NEXT_PUBLIC_SITE_URL` | yes | `https://app.example.com` (no localhost in production) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | yes when Turnstile enabled | Cloudflare site key for the frontend domain |
| `NEXT_PUBLIC_SENTRY_DSN` | optional | Frontend Sentry DSN, if used |
| `SENTRY_ENVIRONMENT` | optional | `production` |
| `SENTRY_RELEASE` | optional | Release/version string |

Never place backend secrets in `NEXT_PUBLIC_*` variables.

### Backend server-only variables

| Variable | Required in production | Notes |
| --- | --- | --- |
| `APP_ENV=production` | yes | Enables production posture: secure cookies, HSTS, no OpenAPI docs. |
| `DEBUG=false` | yes | Never enable debug in production. |
| `LOG_LEVEL=INFO` | recommended | Avoid verbose provider/storage logs. |
| `BACKEND_CORS_ORIGINS` | yes | Exact frontend origin(s), comma-separated. No `*` with credentials. |
| `DATABASE_URL` | yes | Async app DSN. Supabase pooler is acceptable for runtime queries. |
| `DIRECT_DATABASE_URL` | recommended/yes for migrations | Direct DSN for Alembic; avoid transaction poolers for DDL. |
| `DATABASE_POOL_SIZE`, `DATABASE_MAX_OVERFLOW`, `DATABASE_POOL_TIMEOUT_SECONDS`, `DATABASE_POOL_RECYCLE_SECONDS` | yes | Tune per backend process against database connection limits. |
| `JWT_SECRET` | yes | 32+ bytes. No dev fallback exists. Rotate with forced logout planning. |
| `EMAIL_PROVIDER=resend` | yes | `console` is refused in production. |
| `RESEND_API_KEY` | yes | Server-only. |
| `EMAIL_FROM` | yes | Verified sender/domain. |
| `APP_BASE_URL` | yes | Frontend origin used in emailed verify/reset links. |
| `STORAGE_BACKEND=supabase` | recommended production target | `local` is only for development or single-node persistent-disk deployments. |
| `SUPABASE_URL` | yes when using Supabase Storage | Project URL, not a storage object URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | yes when using Supabase Storage | Server-only service-role key. Never expose to frontend. |
| `SUPABASE_STORAGE_BUCKET` | yes when using Supabase Storage | Private bucket name, e.g. `srs-documents`. |
| `DOCUMENT_DOWNLOAD_URL_MINUTES` | yes | 1–15 only; higher values fail startup. |
| `RATE_LIMIT_ENABLED=true` and `RATE_LIMIT_*` | yes | Current limiter is process-local; see rate-limit decision below. |
| `ENCRYPTION_MASTER_KEY` | yes if AI credentials are allowed | Fernet key. Losing it makes encrypted user provider keys unrecoverable. |
| `AI_DEFAULT_TIMEOUT_S`, `AI_MAX_TIMEOUT_S` | yes | Provider timeout budget. |
| `TURNSTILE_ENABLED=true` | yes for public production | If production disables it, protected auth routes fail closed when verification is required by policy. |
| `TURNSTILE_SECRET_KEY` | yes | Backend-only Cloudflare secret. |
| `TURNSTILE_VERIFY_URL`, `TURNSTILE_TIMEOUT_SECONDS` | yes | Defaults are Cloudflare siteverify and 3 seconds. |
| `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_RELEASE`, `SENTRY_TRACES_SAMPLE_RATE` | optional | Scrubbers remove bodies, tokens, cookies, storage paths, SRS text, prompts, and responses. |

Deliberately absent: global `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`,
`GROQ_API_KEY`, `OPENROUTER_API_KEY`, or `HUGGINGFACE_API_KEY`. Users add their own provider
keys in Settings; keys are encrypted per user.

## 3. Deployment order

1. Create production database and storage bucket.
2. Configure backend env vars in the backend host secret manager.
3. Install backend dependencies: `pip install -r backend/requirements.txt`.
4. Run migrations from the backend release environment:
   ```bash
   cd backend
   alembic upgrade head
   alembic current
   alembic heads
   ```
5. Start backend, binding to the platform-provided port, for example:
   ```bash
   cd backend
   uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
   ```
6. Verify backend health:
   - `GET https://api.example.com/health` returns live status.
   - `GET https://api.example.com/api/v1/health/live` returns live status.
   - `GET https://api.example.com/api/v1/health/ready` returns dependency readiness without secrets.
7. Configure Vercel frontend env vars and deploy the Next.js app.
8. Confirm CORS and cookies from the browser against the real frontend origin.
9. Run the post-deployment smoke test sequence below.

## 4. Database migrations and rollback

- Use Alembic only; never run ad-hoc DDL or `create_all()` in production.
- Prefer forward-fix migrations after data-shaping/destructive changes. Downgrades exist but may not restore
  deleted data.
- Use `DIRECT_DATABASE_URL` for migration jobs, especially on Supabase, because DDL should not run through a
  transaction-pooling runtime URL.
- Before migration: take a database backup/snapshot and record the application release.
- Rollback order for a failed release:
  1. Stop traffic or put the app in maintenance at the platform level.
  2. Roll back frontend/backend code to the previous known-good release.
  3. If and only if the migration is known reversible and no new writes depend on it, run `alembic downgrade` to the previous revision.
  4. Otherwise forward-fix with a new migration.

## 5. Storage readiness

Production target is Supabase Storage through `STORAGE_BACKEND=supabase`:

- Bucket must be private.
- Object keys are generated server-side as `documents/{owner_id}/{document_id}/source`.
- Filenames are metadata only; they are never used as object paths.
- Downloads go through app-issued short-lived signed download tokens; objects are not public.
- Account deletion and document purge delete storage objects through the storage abstraction.

`STORAGE_BACKEND=local` remains supported for local development and a single backend instance with durable disk.
Do not use local storage with ephemeral filesystems, multiple independent backend instances, or horizontal autoscaling.

## 6. Rate-limiting decision

Stage 30 chooses **Option A: single backend instance / one process-local limiter for v1 production**.
The implemented token buckets are exact inside one backend process and fail open under process restarts or multiple
instances. Do not horizontally scale the backend for public production until a shared limiter store is implemented, or
accept that budgets become approximately `N × configured_limit` across `N` instances. Redis/queues/Kubernetes are not
introduced in Stage 30.

## 7. Security checklist

Repository-tested controls:

- Production disables FastAPI docs/OpenAPI.
- Secure, HttpOnly, SameSite=Lax cookies in production.
- Explicit CORS origins with credentials; no wildcard.
- Origin/Referer CSRF guard on cookie-authenticated mutations.
- Argon2id passwords and rotating refresh-token families.
- JWT secret has no insecure fallback.
- Resend required for production email; console outbox refused in production.
- Turnstile server verification fails closed for protected auth operations when required/configured.
- Upload type/size/magic validation and private storage abstraction.
- Signed download token TTL capped at 15 minutes.
- Sentry scrubbers avoid bodies, cookies, tokens, provider keys, raw SRS/upload text, prompts, and responses.
- Secret scan is part of `./scripts/verify.sh`.
- Frontend production headers include HSTS-adjacent hardening headers, frame denial, nosniff, referrer policy, and report-only CSP.

Operator-verified controls:

- HTTPS/TLS and HSTS at frontend and backend edge.
- Production `NEXT_PUBLIC_SITE_URL`, canonical domain, robots, sitemap, and OG crawler output.
- Cloudflare Turnstile domain restrictions and live challenge flow.
- Resend domain verification/SPF/DKIM/DMARC.
- Supabase backups, storage bucket privacy, DB least privilege, and key rotation process.
- Sentry project privacy settings and alert routing.
- Browser smoke tests at 390/768/1440 px and assistive-technology checks.

## 8. Post-deployment smoke test

Run on the production domains after every deploy:

1. Public home loads over HTTPS; `/robots.txt` and `/sitemap.xml` use the production canonical domain.
2. `/features`, `/how-it-works`, and `/resources` render and link internally.
3. Unauthenticated private routes redirect to login or show the intended auth state.
4. Register a test account with Turnstile, receive verification email, and verify the account.
5. Login, refresh the page, and confirm session persists through HttpOnly cookies.
6. Paste requirement text, run deterministic analysis, open the saved report, history, and dashboard.
7. Upload a small `.txt`, `.pdf`, or `.docx`; confirm analysis and that download returns the original bytes.
8. Delete a document and confirm download no longer succeeds.
9. Optional AI: add a user-owned provider key, test it, run AI enhancement, retry failed AI if applicable, then remove the key.
10. Export privacy data and run history purge/retention controls on a test account.
11. Logout; verify protected endpoints reject the old session.
12. Check backend logs/Sentry for safe redacted errors only; no passwords, cookies, API keys, raw SRS text, prompts, responses, or DSNs.

## 9. Backups and disaster recovery

- Back up PostgreSQL with point-in-time recovery or scheduled snapshots before every release.
- Back up Supabase Storage objects or ensure bucket replication/export policy meets recovery objectives.
- Back up environment configuration in a secure secret manager.
- Back up `ENCRYPTION_MASTER_KEY` separately; losing it makes encrypted user AI provider keys unrecoverable.
- Test restore into a staging environment before relying on backups.

## 10. Troubleshooting

| Symptom | Likely cause | Action |
| --- | --- | --- |
| `/ready` degraded | DB unavailable/misconfigured | Check `DATABASE_URL`, network allowlists, pool limits, migration state. |
| Browser CORS failure | Frontend origin missing | Set exact `BACKEND_CORS_ORIGINS` with scheme and host, no trailing slash. |
| Login/register fails with Turnstile error | Missing/invalid token or secret/domain mismatch | Check frontend site key, backend secret, Cloudflare allowed domains. |
| Emails do not arrive | Resend/domain issue | Confirm `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM`, SPF/DKIM/DMARC. |
| Upload succeeds but download fails | Missing storage object or wrong storage backend vars | Check `STORAGE_BACKEND`, Supabase bucket privacy, service-role key, object existence. |
| AI key save/test fails | Missing Fernet key or provider key invalid | Set `ENCRYPTION_MASTER_KEY`; validate user-owned provider key/model. |
| 429 too frequent | Rate limit too low for traffic | Tune `RATE_LIMIT_*`; remember limiter is process-local. |
| 500 error responses | Backend exception | Check redacted logs/Sentry using `X-Request-ID`; responses intentionally omit internals. |

## 11. Stage 30 validation status

In this sandbox, Stage 30 validated repository behavior with automated tests and static inspection. Live production
external services were not available, so no fake live-validation claim is made for Supabase, Turnstile, Resend, Sentry,
or AI providers. Operators must run the smoke test against real deployed services.
