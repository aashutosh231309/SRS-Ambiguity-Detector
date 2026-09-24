# Changelog

> Contract + product changes, newest first. Every stage appends an entry. Format:
> `## [version] — Stage NN — date (UTC)` with Added/Changed/Contract subsections.
> Versions: `0.x` pre-release (minor per stage group), `1.0.0` at Stage 32.

## [1.0.0] — Stage 32 — Final audit & release readiness — 2026-09-24

### Added

- Final release-readiness audit in `docs/FINAL_AUDIT.md`, covering Stage 00–31 reconciliation,
  security review answers, external-validation split, remaining limitations, and final project state.
- Requirement-to-implementation traceability matrix in `docs/REQUIREMENTS_TRACEABILITY.md`, mapping
  core SRS Ambiguity Detector requirements to implementation and tests.

### Changed

- README documentation index now links the final audit and traceability matrix.
- `docs/UI_UX_SPEC.md` now reflects the as-built Stage 26–27 marketing/content route work instead
  of listing those components as pending.
- `docs/STAGE_STATUS.md` now points future screenshot work at the final Stage 31 capture catalog
  rather than obsolete per-stage screenshot names.
- Roadmap/status docs record Stage 32 as the final planned stage, with remaining work limited to
  documented external validation or optional future enhancements.

### Contract

- No API, database, authentication, storage, AI-provider, or frontend behavior changed in Stage 32.
  The audit found no product-code security/correctness blocker requiring behavior changes.
- Live PostgreSQL/Docker/browser/Supabase/Turnstile/Resend/Sentry/AI-provider validation remains
  unclaimed in this sandbox where the required tools or credentials were unavailable.

## [0.32.0] — Stage 31 — Documentation, screenshots & final presentation assets — 2026-09-24

### Added

- Final presentation documentation: `docs/PROJECT_SUMMARY.md`, `docs/USER_GUIDE.md`,
  `docs/API_OVERVIEW.md`, and `docs/DETECTION_ENGINE.md`.
- Final screenshot catalog and safe capture procedure in `screenshots/README.md`, including
  recommended desktop/tablet/mobile shots and privacy checklist.

### Changed

- README rewritten as a polished project landing document covering overview, features,
  architecture, detection/scoring, supported input, AI, security/privacy, local setup, testing,
  deployment, limitations, future scope, and documentation links.
- Architecture/API/database/AI docs reconciled with the as-built Stage 30 system and route/provider
  surface.
- Roadmap/status docs now mark Stage 31 complete while recording that screenshots were not captured
  because no browser runtime was available in the sandbox.

### Contract

- No API, database, authentication, storage, AI-provider, or frontend behavior changed. Stage 31 is
  documentation/presentation only, plus stale-comment cleanup. No screenshots or live browser
  validation are claimed.

## [0.31.0] — Stage 30 — Production deployment & environment configuration — 2026-09-24

### Added

- Supabase Storage backend behind the existing storage port (`STORAGE_BACKEND=supabase`) using
  backend-only `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET`.
- Mocked Supabase storage adapter tests covering upload, read, delete, unsafe-key rejection, and
  settings validation.
- `docs/DEPLOYMENT.md` production runbook with topology, env-var tables, deployment order,
  migration procedure, health checks, smoke tests, rate-limit decision, rollback, backups/recovery,
  security checklist, SEO/domain guidance, and troubleshooting.

### Changed

- Env examples now document Supabase Storage variables as server-only production config while
  keeping browser-public `NEXT_PUBLIC_*` values separate and preserving the no-global-AI-key rule.
- README and architecture docs now describe the actual production topology: Vercel hosts Next.js;
  FastAPI runs on a separate Python service host; PostgreSQL/Supabase and Supabase Storage provide
  managed persistence.
- Local filesystem storage is documented as development/single-node durable-disk only, not the
  managed multi-instance production storage path.

### Contract

- Storage config contract expands from `STORAGE_BACKEND=local` to `local|supabase`; selecting
  `supabase` requires `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and
  `SUPABASE_STORAGE_BUCKET` at startup.
- No API route, database migration, frontend UI contract, or AI provider key model changed.
- Rate-limit production posture is explicitly single-instance/process-local for v1; shared limiter
  storage remains a future hardening item.

## [0.30.0] — Stage 29 — Comprehensive testing & quality assurance — 2026-09-24

### Added

- Stage 29 QA baseline tests covering the documented `/api/v1` route surface, a compact
  deterministic golden analysis corpus, and AI prompt/privacy payload minimization and caps.

### Changed

- Roadmap/status docs now mark Testing/QA complete and record the actual validation scope: full
  repository gate, second backend/frontend test-suite rerun, Alembic metadata check, and explicit
  environment limitations for PostgreSQL, Docker, browser/accessibility automation, and external
  providers.

### Contract

- No API, database, security, auth, SEO, or UI contract changed. The new route-surface test is a
  contract sentinel: future endpoint additions must update API/security/docs deliberately.

## [0.29.0] — Stage 28 — Responsive & accessibility refinement — 2026-09-24

### Added

- Visible accessible close affordance in the settings dialog shell, while preserving focus trap,
  Escape/overlay dismissal, return-focus, background scroll lock, and pending-mutation dismissal lock.
- Regression coverage for the visible close control, provider switch accessible names, and updated
  dialog keyboard trapping semantics.

### Changed

- Primary/copy/dialog/analyzer/upload actions now consistently meet 44px touch-target sizing and
  keep explicit focus-visible treatment.
- Long technical text, filenames, titles, URLs, requirement identifiers/sections, issue phrases,
  category labels, AI rewrites, history mobile cards, and dashboard recent/latest rows wrap on
  narrow screens instead of clipping or causing horizontal overflow.
- Provider switches now expose action-accurate labels (`Disable …` when enabled, `Enable …` when
  disabled). Dialogs and destructive confirmations fit small/dynamic viewports with internal scroll
  and safe-area padding.

### Contract

- UI_UX_SPEC, DEVELOPMENT_RULES, FUTURE_ROADMAP, STAGE_STATUS, and CHANGELOG updated for the
  Stage 28 as-built responsive/accessibility refinement and the remaining browser/manual AT
  validation limitation. No API, database, auth, SEO, or security posture changes.

## [0.28.0] — Stage 27 — SEO content & public discoverability — 2026-09-24

### Added

- Public content routes: `/features`, `/how-it-works`, `/resources`,
  `/resources/what-is-srs-ambiguity`, and `/resources/write-clearer-requirements`.
- Shared server-rendered public shell with coherent navigation/footer for real public routes
  plus login/signup CTAs.
- Central public-content registry for sitemap route facts, resource cards, health dimensions,
  and the 11 actually implemented deterministic ambiguity categories.
- Educational content explaining SRS ambiguity, detected categories, synthetic examples,
  clarification patterns, clearer-requirements guidance, deterministic scoring, and optional
  AI boundaries.
- Breadcrumb and Article JSON-LD helpers for public content pages, plus tests for route files,
  public metadata, sitemap/robots behavior, structured data, and category-content safety.

### Changed

- Homepage now links into the public content architecture and states the deterministic-vs-AI
  boundary more explicitly.
- Sitemap and robots now include/allow the new public content routes while continuing to exclude
  private app, auth, API, token, and analysis-detail URLs.
- Home structured data no longer emits an offer/price field; public structured data stays limited
  to truthful generic application/site, breadcrumb, and article information.

### Contract

- SEO_SPEC, UI_UX_SPEC, FUTURE_ROADMAP, STAGE_STATUS, CHANGELOG, and README updated for the
  Stage 27 public content architecture, private-route boundary, structured-data decisions,
  and remaining external validation/deployment limitations.

## [0.27.0] — Stage 26 — SEO foundation, metadata & discoverability — 2026-09-24

### Added

- Centralized frontend SEO helpers (`frontend/src/lib/seo.ts`) for public-route registry,
  canonical URL generation, public/private metadata builders, robots policy, sitemap entries,
  and safe home-page structured data.
- Public landing-page foundation at `/` replacing the Stage 01 placeholder, with semantic
  product copy, stable CTA links, no keyword stuffing, and generic `WebSite` +
  `SoftwareApplication` JSON-LD.
- Project-owned 1200×630 Open Graph asset at `frontend/public/og/srs-ambiguity-detector.svg`.
- Automated SEO contract tests covering public metadata, private/auth noindex behavior,
  sitemap inclusion/exclusion, robots disallows, token-query safety, and JSON-LD privacy.

### Changed

- Root metadata now keeps only safe global app metadata/icons, while public canonical/OG/Twitter
  metadata lives on public pages to avoid leaking discoverability onto private routes.
- `/robots.txt` now disallows `/api/`, private app routes, auth routes, and token-sensitive
  query patterns while still referencing the generated sitemap.
- `/sitemap.xml` is generated from the public-route registry and currently includes only `/`;
  auth, private app, analysis detail, API, and token URLs are deliberately excluded.
- Auth, private app, analysis-detail, and 404 route metadata now use the centralized noindex
  policy and avoid canonical/social metadata.

### Contract

- SEO_SPEC, FUTURE_ROADMAP, STAGE_STATUS, and README updated for the Stage 26 public/private
  indexing policy, `NEXT_PUBLIC_SITE_URL` canonical strategy, OG/Twitter/robots/sitemap/JSON-LD
  posture, and remaining Stage 27 validation/content work.

## [0.26.0] — Stage 25 — Performance, scalability & resource optimization — 2026-09-24

### Added

- Env-driven async PostgreSQL pool tuning (`DATABASE_POOL_SIZE`, `DATABASE_MAX_OVERFLOW`,
  `DATABASE_POOL_TIMEOUT_SECONDS`, `DATABASE_POOL_RECYCLE_SECONDS`) with conservative
  defaults and validation.
- Bounded document validate/extract worker pool (`DOCUMENT_EXTRACTOR_WORKERS`) so parser
  calls that outlive a request timeout cannot accumulate unbounded queued work. Shutdown now
  cancels queued parser tasks while allowing already-running parser calls to finish safely.
- Stage 25 regression tests for query projections, SQL dashboard improvement counting,
  settings bounds, and extraction timeout resource lifecycle.

### Changed

- History and dashboard recent-analysis queries now project only response-needed summary
  columns and document display metadata, avoiding fetches of large `source_text`, AI overview,
  and detail JSON columns.
- Dashboard latest-run uses a lightweight projection, and `improved_count` is computed in SQL
  via `lag()` instead of loading every scored analysis score into Python.
- Dashboard trend and analysis report frontend components memoize non-trivial derived values
  so chart/table/report derivations are not recomputed on unrelated rerenders.

### Notes

- No database migration or index was added: the performance review found existing owner/order,
  token, provider, document, and issue-rollup indexes sufficient for the current contracts.
- PostgreSQL was unavailable in the sandbox, so no `EXPLAIN ANALYZE` numbers are claimed.

## [0.25.0] — Stage 24 — Monitoring, observability & production error tracking — 2026-09-24

### Added

- Optional backend Sentry integration (`SENTRY_DSN`) with FastAPI integration,
  explicit capture of unexpected exceptions/database request failures/500 app errors,
  and a tested `before_send` scrubber that strips request bodies, query strings,
  cookies, auth headers, tokens, provider credentials, storage paths, prompt/response
  fields, exception messages, and long arbitrary strings.
- Optional frontend Sentry integration (`NEXT_PUBLIC_SENTRY_DSN`/`SENTRY_DSN`) for
  unexpected route-render failures, with a matching scrubber and no source-map upload
  or external alerting credentials committed.
- Bounded request correlation: `X-Request-ID` is accepted only when it is 1–64 chars of
  `[A-Za-z0-9._-]`; otherwise a generated 12-hex id is returned on normal and error
  responses.
- JSON structured backend logs with safe low-cardinality fields for HTTP request
  duration/status/route, analysis/document stages, storage operations, AI provider/model
  outcomes, email provider/template, and rate-limit events.
- Regression tests for monitoring privacy scrubbing, capture/no-capture taxonomy,
  request-id behavior, structured access-log fields, and frontend scrubber behavior.

### Changed

- Expected business errors (validation, auth, ownership/not-found, rate limits, and other
  normal control-flow errors) remain standard API envelopes and are not reported as
  catastrophic Sentry exceptions. 500 `AppError`s and unhandled exceptions are captured
  with safe context only.
- Email delivery logs no longer include recipient addresses; template/provider/status are
  enough for deliverability diagnosis without adding PII to logs.

### Contract

- API_CONTRACT now documents request-correlation headers. ARCHITECTURE, SECURITY_SPEC,
  SEO_SPEC, DEVELOPMENT_RULES, README, FUTURE_ROADMAP, and STAGE_STATUS updated for the
  as-built Stage 24 observability/privacy posture.

## [0.24.0] — Stage 23 — Privacy, data lifecycle & account deletion completion — 2026-09-24

### Added

- `user_preferences` (`0006`) with owner-scoped nullable `history_retention_days`
  plus `GET/PATCH /settings/privacy`.
- Privacy export flow: `POST /privacy/export` returns a short-lived signed owner
  ticket and `GET /privacy/export/{export_id}` returns live allowlisted JSON for
  the current owner only.
- `POST /privacy/purge-history` and `python -m app.cli.purge_retention` for owner
  purge/manual retention enforcement, including orphaned owned document storage
  cleanup through the storage abstraction.
- Settings → Privacy UI now has real retention-save, export-link, and purge-now
  controls with honest copy about included/excluded data.
- Regression coverage for storage-aware account deletion, retryable storage
  failures, token/credential cleanup, redacted owner-scoped export, purge/retention
  isolation, and deleted-document download-token behavior.

### Changed

- `DELETE /auth/account` now purges every owned document storage object through
  the storage abstraction before deleting the user row and relying on DB cascades
  for rows/tokens/provider credentials. Missing storage objects are idempotent;
  storage backend failures abort before DB deletion and return a generic retryable
  error.
- Privacy docs now describe the non-atomic DB/storage boundary honestly: storage
  first avoids success-with-known-orphans, while DB failure after storage cleanup
  remains retry/remediation territory.

### Contract

- API_CONTRACT §4.7, DATABASE_SCHEMA §3.8/§4, SECURITY_SPEC §9/§10,
  UI_UX_SPEC, ARCHITECTURE ADR-008, FUTURE_ROADMAP, and STAGE_STATUS updated for
  the as-built Stage 23 lifecycle behavior.

## [0.23.0] — Stage 22 (as-built) — Turnstile CAPTCHA abuse defense — 2026-09-24

### Added

- Cloudflare Turnstile verification boundary (`app/services/turnstile.py`) for
  public high-abuse auth operations. The backend posts to Cloudflare's
  siteverify endpoint with a strict timeout, backend-only secret, no redirects,
  response-size cap, and stable app-level failures; tests mock all provider I/O.
- Turnstile protection on register, login, resend-verification, forgot-password,
  and reset-password. This is additive abuse defense only — auth, CSRF,
  Origin/Referer checks, authorization, anti-enumeration, and rate limits remain
  unchanged.
- Frontend `TurnstileWidget` using public `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, wired
  into signup/login/resend/forgot/reset forms; widgets are hidden when the site
  key is unset and reset on backend failures/expiry/error.

### Changed

- Auth schemas/clients now carry optional `turnstile_token` for resend,
  forgot-password, and reset-password in addition to register/login. Stable error
  codes added: `turnstile_required`, `turnstile_invalid`,
  `turnstile_unavailable`, `turnstile_configuration_error`.
- Environment templates document backend `TURNSTILE_ENABLED`,
  `TURNSTILE_SECRET_KEY`, `TURNSTILE_VERIFY_URL`, `TURNSTILE_TIMEOUT_SECONDS`,
  and frontend `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
- Backend focused Turnstile suite added (+17); full backend suite 541 → 558.
  Frontend auth-token plumbing test added (frontend suite 409 → 410). Full
  `./scripts/verify.sh` passed, including lint/typecheck/format/build/audits.
  Distributed limiter storage remains future.

### Contract

- API_CONTRACT §4.2, SECURITY_SPEC §3/§7, ARCHITECTURE §7,
  FUTURE_ROADMAP/STAGE_STATUS updated for the as-built Stage 22 Turnstile slice.
  No migration, no new routes, no live Cloudflare verification in tests.

## [0.22.0] — Stage 21 (as-built) — remaining AI slices + retry bucket — 2026-09-24

### Added

- Creation-time provider key proof: `POST /ai/providers` now calls the provider
  adapter's `validate_credentials` before encrypted storage; rejected/unreachable
  keys store nothing and return `400 validation_error` with adapter-curated safe
  copy. Successful creates stamp `last_test_status=ok` + `last_tested_at`.
- Dedicated retry-AI rate bucket: `POST /analysis/{id}/retry-ai` uses
  `RATE_LIMIT_AI_RETRY_PER_MINUTE` (default 10) instead of the generic
  verified-mutation bucket.
- Per-run AI disclosure copy in the report: successful AI overviews now state
  that the overview uses finding summaries, rewrites use flagged requirement
  excerpts, and provider retention follows the provider's policy. The
  add-provider dialog now states that keys are provider-verified before storage.

### Changed

- Backend suite 538 → 541 (+3: create-proof failure/no-storage ×2,
  retry-AI bucket ×1). Frontend tests unchanged (409/409). No migration and no
  response-shape change.

### Contract

- API_CONTRACT §4.3/§4.6, AI_PROVIDER_SPEC §5/§7/§8/§9, SECURITY_SPEC §7,
  ARCHITECTURE §7, FUTURE_ROADMAP/STAGE_STATUS updated for the as-built Stage
  21 closure. Remaining roadmap-22 work: Turnstile + distributed limiter store.

## [0.21.0] — Stage 20 (as-built) — security hardening (roadmap-21 closed) — 2026-09-24

### Added

- Prod-only backend framing denial (`X-Frame-Options: DENY` +
  `Content-Security-Policy: frame-ancestors 'none'`) + full header
  review: baseline trio always-on, HSTS + framing prod-only, OpenAPI
  docs/Redoc/schema gated out of production — all asserted both ways
  (incl. error envelopes carrying the headers).
- Report-only CSP (`Content-Security-Policy-Report-Only`, prod-only)
  via `frontend/src/lib/csp.ts`: `default-src 'self'`, Next inline
  runtime under observation, `connect-src` self + API origin from
  `NEXT_PUBLIC_API_URL`, `object-src 'none'`, `base-uri 'self'`.
  Observe-only until real-browser data justifies enforcement.
- `scripts/secret-scan.sh` (+ `secret-scan.allow` provably-fake
  fixtures): provider prefixes, private keys, password DSNs, key
  assignments, bearer/JWT shapes. Gates `verify.sh`; documented as
  the pre-commit hook (`ln -s ../../scripts/secret-scan.sh
.git/hooks/pre-commit`). Ignored paths (`.env`, `*.pem`) never
  scanned.

### Changed

- `npm audit` (0 vulnerabilities) + `pip-audit` now gate `verify.sh`;
  `pip-audit` pinned in requirements-dev. pytest 8.3.4 → 9.1.1
  (PYSEC-2026-1845 fixed); 7 starlette findings accepted per-ID with
  reachability rationale (framework-major migration deferred).
- Backend suite 533 → 538 (+5 header/posture tests). Frontend suite
  402 → 409 (+7 CSP builder tests). Roadmap-21 fully closed.

### Contract

- SECURITY_SPEC §8 (headers/CSP/OpenAPI posture as-builts) + §10
  (audit baseline with accepted findings, secret-scan procedure);
  FUTURE_ROADMAP as-built note; STAGE_STATUS §20. No migration, no
  new routes/codes/settings; no production dependency changed.

## [0.20.0] — Stage 19 (as-built) — document list/download endpoints (roadmap-09 closed) — 2026-09-24

### Added

- `GET /documents` (owner-scoped newest-first `Page[Document]`, no filters)
  - `DELETE /documents/{id}` (204; row + storage object in one transaction;
    referencing analyses survive via `SET NULL` with the `document` pointer
    degrading to null). No migration.
- Signed-URL downloads: `POST /documents/{id}/download-url` (verified +
  CSRF + dedicated 10/min bucket → `{download_url, expires_at}`) +
  `GET /documents/{id}/download?token=…` (sessionless — the short-lived
  single-document HS256 bearer is the credential; 400 `invalid_token` on
  expired/forged/wrong-type/wrong-document, 404 when deleted after mint).
  Bytes re-hashed against the stored sha256 before release (missing/corrupt
  → honest 500); served as `attachment` under the server-detected MIME
  with RFC 5987 filenames. TTL `DOCUMENT_DOWNLOAD_URL_MINUTES` (15,
  spec-capped at boot). Storage port gains the bounded `read_bytes`.
- Frontend clients (`listDocuments`, `deleteDocument`,
  `mintDocumentDownloadUrl`, `resolveDownloadUrl`) + types. No new UI —
  no surface specified; a future slice may add a "download original"
  affordance to history/report views.

### Changed

- Backend suite 504 → 533 (+29: storage ×3, list ×4, delete ×6, download
  ×16 incl. a full lifecycle roundtrip). Frontend suite 396 → 402 (+6
  documents client tests). Roadmap-09 fully closed (upload slice: Stage 08).

### Contract

- API_CONTRACT §4.4 finalized for the full surface (routes, download flow,
  purge semantics; NO new error codes — all reused); SECURITY_SPEC §5 + §9
  (signed downloads live, JWT inventory row); DATABASE_SCHEMA §3.5;
  ARCHITECTURE §7 (new settings).

## [0.19.0] — Stage 18 (as-built) — Anthropic + Hugging Face adapters (all six live) — 2026-09-24

### Added

- `AnthropicProvider` (Messages API: `POST /v1/messages` with the shared
  versioned prompts, `x-api-key` + pinned `anthropic-version` headers,
  `GET /v1/models` probe; default `claude-sonnet-5`) + `HuggingFaceProvider`
  (thin OpenAI-compat subclass over the Inference Providers router — the
  legacy `api-inference` host is retired, so the registry pins
  `router.huggingface.co`; default `openai/gpt-oss-120b`). Model-table rows
  for both; `BUILTIN_ADAPTERS` holds all six singletons. No migration.
- Mocked-HTTP coverage for both (request/response shaping, versioned probe,
  auth-no-retry, bad-response shapes, router-host wiring); the four
  deferral tests flipped — TEST/enhancement/retry stay live for all six
  while the defensive no-adapter branches are pinned via monkeypatch.

### Changed

- Backend suite 494 → 504 (+10: adapter ×8, re-entry proofs ×2). Frontend
  unchanged (396/396 — zero UI delta). Roadmap-18 fully closed. Still open:
  creation-time live key proof, per-run disclosure copy, AI rate buckets.

### Contract

- AI_PROVIDER_SPEC §2/§4/§5 updated (six-adapter as-builts, router host,
  all-six TEST); no endpoint or envelope changes.

## [0.18.0] — Stage 17 (as-built) — `retry-ai` endpoint + report Retry button — 2026-09-24

### Added

- `POST /analysis/{id}/retry-ai` (verified + CSRF guarded, default
  verified-mutation bucket): re-runs ONLY the AI step through the shared
  Stage-14 service — reset (AI payload NULLed + AI-stamped rewrites dropped)
  → re-read → enhance. Accepts any prior `ai_status`; owner-scoped 404
  (byte-identical to missing — no oracle); malformed ids 400. Response =
  the four restamped AI fields (`RetryAiResponse`); clients re-read the
  detail for rewrites. Deterministic columns never written. No migration.
- Report "Try again" button on the failed AI card (`AiOverviewSection` +
  `retryAi` client): pending state, code-mapped errors, session-gone
  sign-in link; both report parents (saved `/analysis/[id]` + fresh
  workspace) silently re-read on success. No wiring, no button (§9).

### Changed

- Frontend suite 384 → 396 (+12: client ×3, section ×6, pass-through ×1,
  saved integration ×1, fresh integration ×1). Backend suite 482 → 494
  (+12 retry API tests). Roadmap-20 retry slice closed (chain/matrix
  shipped in Stage 14; dedicated AI rate buckets stay Stage 22's).

### Contract

- API_CONTRACT §4.3 retry-ai finalized (semantics above); AI_PROVIDER_SPEC
  §7 + UI_UX_SPEC §13 updated (retry rules, button behavior).

## [0.17.0] — Stage 16 (as-built) — Settings remainder: profile, password, privacy, account deletion — 2026-09-24

### Added

- `GET/PATCH /settings/profile` (verified-only): safe-subset read + display-name
  write (trimmed, ≤100 chars, explicit null/blank clears, field required).
  No migration — `users.display_name` already existed. Privacy/export/purge
  endpoints deliberately NOT built (a retention control with no enforcement
  would be a fake control); §4.7 reserves their names for Stage 23.
- `/settings` account sections (UI_UX_SPEC §12a): Profile (read-only email +
  editable display name, self-contained fetch states, identity re-sync on
  save), Password (Stage 05 `ChangePasswordForm` mounted as-is), Privacy
  (honest lifecycle statement + History link, zero fake controls), Delete
  account (DELETE-typed confirm dialog → 204 → farewell panel + auth clear).
- `deleteAccount` client (`DELETE /auth/account`, retry-safe) + `lib/settings`
  profile clients + code-mapped `settings-errors` copy.

### Changed

- Frontend suite 368 → 384 tests (+16: profile × 6, delete dialog × 4, screen
  integration × 6). Backend suite 470 → 482 (+12 profile API tests).
  Roadmap-16 fully closed (providers slice shipped early in Stage 13).

### Contract

- API_CONTRACT §4.7 finalized: profile fields final (above); privacy endpoint
  names reserved for Stage 23 with the fake-control rationale recorded.

## [0.16.0] — Stage 15 (as-built) — AI results integration & trust UX — 2026-09-24

### Added

- AI trust UX inside the shared report (frontend only, no backend/contract
  change): an explicit review disclaimer on the `ok` AI block; a `Copy
suggestion` button + "Review before applying" microcopy on AI-suggested
  rewrites (shared `CopyButton`); an accessible Show more/less disclosure
  for overviews longer than 600 chars; an honest derived partial-coverage
  note ("AI rewrites cover X of Y flagged requirements"); and AI-aware
  pending labels on both enhance checkboxes.
- Deterministic-first report ordering: score → overview cards → `Issue
categories` → `Requirement health` → `AiOverviewSection` → flagged
  requirements. AI stays additive and never precedes authoritative content.

### Changed

- Frontend suite 356 → 368 tests (+12: disclaimer/expand/coverage × 5,
  copy/microcopy × 2, ordering × 3, pending labels × 2). Backend unchanged
  (470/470). Roadmap row 15 ("Dashboard visualization") was already absorbed
  by the actual Stage 11 — this as-built Stage 15 supersedes its slot.

### Contract

- None — no API, schema, or migration change.

## [0.15.0] — Stage 14 — Live AI Enhancement (adapters + chain + report UI) — 2026-09-24

### Added

- Four production provider adapters (`app/ai/adapters/`): `GeminiProvider`
  (`generateContent` REST, key in `x-goog-api-key` header) + `GroqProvider` /
  `OpenAIProvider` / `OpenRouterProvider` over a shared OpenAI-compatible
  chat core (`HTTP-Referer` = site URL on OpenRouter). Shared base owns
  explicit timeouts (clamped `[1, AI_MAX_TIMEOUT_S]`), retry on 429/5xx
  only (max 2, jittered backoff — never auth/timeout/transport), and
  normalized `ProviderError` failures (raw provider bodies never
  propagate). Anthropic + Hugging Face deliberately deferred (no adapter —
  honest unavailable/failed behavior + docs, not silent gaps).
- `app/ai/models.py` (SINGLE source of truth for model ids: per-provider
  default + curated `list_models` allowlist, no network, no model UI),
  `app/ai/prompts/` (`overview_v1` + `improvement_v1` — identical wording
  on every provider, payloads delimited + injection-framed as data),
  `app/ai/sanitize.py` (endings normalized, control chars stripped,
  ≤8000 chars with an honest truncation marker — applied before results
  are even built).
- `services/ai_enhancement.py`: the shared post-commit AI step (TEXT +
  upload paths). Deterministic commits FIRST; provider calls run outside
  any transaction; outcomes land in one short txn touching ONLY `ai_*`
  columns + rewrites. Chain = default → fallbacks in rank order (max 3,
  failover on overview failure only); improvements best-effort on the
  winning provider (requirements WITH issues, ≤10/run, concurrency ≤4).
  Fail-open is absolute — provider errors, vault outages, and adapter
  bugs all return the deterministic 201 with an honest `ai_status`.
- Analyzer opt-in checkbox (+ Settings link, identical on text + upload
  forms), the four-state `AiOverviewSection` report block (labeled
  overview with "Generated by {provider}" / verbatim error card WITHOUT
  a retry button / unconfigured empty state + CTA / skipped one-liner),
  and the labeled additive-only rewrite block in `RequirementCard`.
  History/dashboard untouched (no AI fields in the summary shape).
- `AI_DEFAULT_TIMEOUT_S` (25) + `AI_MAX_TIMEOUT_S` (60) settings
  (boot-validated coherence); upload `ai_enhance` form field; TEST goes
  live for the four implemented providers (cheap models probe + curated
  list on success).

### Changed

- `options.ai_enhance` is LIVE (was accepted-and-ignored through Stage 13):
  `false` → `skipped` without touching providers; `true` + no enabled
  credential → `unconfigured` (no error text); enabled-but-adapterless →
  `failed` + "<Label> integration isn't available yet."; overview success →
  `ok`; exhaustion → `failed` + FIRST (default-first) error, capped at 300
  chars. `resolve_adapter` serves fakes-first/builtins/deferred-None;
  `get_adapter` stays the fake-only seam (suites hermetic).

### Contract

- §4.3 Stage 14 amendment (enhancement pipeline order, `ai_status`
  vocabulary + mapping, chain rules, deferred-provider behavior,
  `suggestion_source: "ai"`); §4.4 upload `ai_enhance` field. No new
  routes, no migrations (all `ai_*` columns shipped in `0001`).

## [0.14.0] — Stage 13 — AI Provider Settings UI (`/settings`) — 2026-09-24

### Added

- Authenticated, verified-users-only `/settings` route (`noindex,nofollow`)
  with the AI-providers management section: provider cards (display name,
  label, masked key, Enabled/Disabled + Default + last-test chips,
  last-tested freshness), add-provider dialog (canonical six-provider
  select with configured options marked, optional label, masked secret
  field with deliberate reveal), replace-key dialog (masked value shown
  as information only, fresh blank secret), per-card Test connection
  (pending guard, inline verdict with model count + latency, backend's
  user-safe verdict text), enable/disable switch, Set-as-default,
  explicit-confirm remove (safe default, Esc, focus trap + return,
  404-as-success). Every mutation ends in a silent list refetch —
  server ordering and flags, never optimistic merges.
- `lib/providers.ts` (six contract §4.6 calls via the canonical client +
  `withSessionRetry`; the browser never contacts providers directly) and
  `lib/provider-errors.ts` (code→copy incl. per-action `conflict` copy,
  test-bucket 429 copy, and `validation_error` field mapping).
- First-use empty state: deterministic analysis works without any
  provider; keys are user-owned, encrypted at rest, never shown again.

### Changed

- Drive-by fix: `.btn-primary` (referenced by the shared `SubmitButton`
  since Stage 05 but never defined — auth submits rendered unstyled) is
  now defined in `globals.css`; `SubmitButton` accepts a layout override
  for dialog action rows. Visual-only, zero behavior change.

### Contract (no §4.6 changes — pure frontend stage)

- Test verdict `error` renders verbatim BY DESIGN: it is backend-curated,
  user-safe data (capped server-side), not an error envelope. All true
  failures map backend `code` → frontend copy; backend `message` strings
  are never displayed.

## [0.13.0] — Stage 12 — AI Credential Vault & Provider Management — 2026-09-24

### Added

- User-owned provider credentials (`/api/v1/ai/providers`, verified
  users): `GET` bare-array list (registry order → enabled-first →
  oldest), `POST` create (always enabled, never default), `PATCH`
  metadata (label/enabled/default/rank), `POST …/rotate-key` (new
  ciphertext + fingerprint, verdict cleared), `DELETE` (204, nothing
  retained), `POST …/test` (dedicated 10/min bucket; always 200 — a
  failed check is data, not an error). Ownership-isolated throughout
  (foreign ids 404 exactly like missing ones).
- Fernet vault (`app/core/vault.py`, `cryptography` pinned): `v1:`
  ciphertext at rest, env-only `ENCRYPTION_MASTER_KEY` (boot-validated
  — absent legal, malformed fails closed; lazy use keeps
  analysis/dashboard working keyless), `sha256(key)[0:16]` fingerprints,
  secret-free `VaultError`s mapped to `500 internal_error`.
- `AIProvider` ABC + payload models (`app/ai/providers.py`) and the
  six-provider metadata registry (`app/ai/registry.py`, allowlisted
  base URLs, adapter seam) — NO adapters yet (Stage 18): every TEST
  deterministically returns `200 {ok:false}` + an unavailable message
  with `last_test_*` untouched, through the full decrypt → adapter →
  sanitize → record flow (fakes prove it in tests).
- New error codes: `404 ai_provider_not_found` (IDOR-safe),
  service-level `400 validation_error` (same code the schema handler
  emits), explicit `500 internal_error` (vault failures).

### Changed

- Plaintext keys exist ONLY in inbound create/rotate bodies
  (edge-trimmed, 4–2000 chars); every response is allowlist-serialized
  metadata (`masked_key` = 12 bullets + last4) and logs carry ids +
  provider ids only — asserted on every journey.
- `GET /ai/providers/models` deferred to Stage 18 (ships with
  adapters); live key-proof at creation likewise (creation is
  shape-only until then).

### Contract (Stage 12 amendment to §4.6, all asserted in tests)

- Endpoint table rewritten as-built (bare-array list + order,
  `masked_key`, `is_enabled` in PATCH, rotate semantics, unavailable
  test); rule block (enabled/fingerprint/default invariants,
  contradiction 409s, test bucket, vault 500s); `provider_error` /
  `ai_unavailable` stay RESERVED for live-provider failures.

## [0.12.0] — Stage 11 — Analytics Dashboard & Statistics (`/dashboard`) — 2026-09-24

### Added

- `GET /api/v1/dashboard?range=30d|12w` (verified users): one
  ownership-scoped aggregate snapshot — totals, scored-only average
  (half-up 1dp), newest run, high-risk / improved counts, top category,
  full-vocabulary band/source/severity distributions, non-zero categories,
  zero-filled UTC trend buckets (30 days / 12 Monday-start weeks), 5 newest
  summaries. Empty accounts get zeros/empties/nulls (never 404); unscored
  runs count toward totals/volume only; no `user_id` param, no id leaks.
- Authenticated `/dashboard` route (`noindex,nofollow`): type-led stats
  strip + sources line; score-trend section (30d/12w control, lazy
  client-only Recharts area + volume bars on honest axes, legend, spoken
  summary, full data table, nulls as gaps); latest-run card; band strip;
  account-wide category/severity sections; compact recent-runs list into
  saved reports; heuristic footnote; loading / session / retryable-error /
  first-use / partial-data states throughout.
- `recharts` dependency (first imported — and first installed — at this
  stage, per the architecture's dependency discipline).

### Changed

- Post-auth landing is now `/dashboard` (was the temporary fixed `/`,
  which stays untouched for the SEO/marketing stage).
- `CategoryBars` gains optional `caption` + `headingLevel` props for the
  dashboard (report default preserved).

### Contract (Stage 11 amendment to §4.5, all asserted in tests)

- Five planned endpoints collapse into one `GET /dashboard` snapshot
  (same metric vocabulary, one round trip); documented: request/response
  shape, empty behavior, UTC bucket semantics, scored-vs-unscored
  participation per metric, rounding, tiebreaks, ownership, errors.

## [0.11.0] — Stage 10 — Analysis History UI (`/history`) — 2026-09-24

### Added

- Authenticated, verified-users-only history route `/history`
  (`noindex,nofollow`): `HistoryScreen` (loading skeleton, stale-page
  dimming with `aria-busy`, page-clamp after deletes, live count line,
  back link) + `HistoryToolbar` (350 ms-debounced server search with a
  "Searching…" state, band + source filters, 4-option backend sort, honest
  disabled reset) + `HistoryTable` (one semantic table that CSS-transforms
  into cards under 640 px; title/source/score/counts/date + Open link to
  the Stage 09 report per row) + `HistoryPagination` (envelope-driven,
  hidden on single pages).
- Every cell renders persisted values verbatim (zero client
  recalculation); `failed` rows read "Failed" and unscored rows "Not
  scored" — never fabricated scores. Raw ids never surface.
- Compact row delete reusing the Stage 09 dialog (explicit confirm, safe
  default, Tab-trapped, Esc cancels, focus returns, 404-as-success,
  code-mapped errors stay open) with an `onDeleted` refetch path — no
  navigation, no bulk delete.
- Distinct designed empties (pristine "No analyses yet" + analyzer CTA
  and no toolbar vs filtered "No matching results" + clear), code-mapped
  error panel with retry, session-expired sign-in nudge, wrong-shape
  payload rejection, and an analyzer ↔ history cross-link both ways.
- 17 backend tests (`test_analysis_history.py`) + 23 frontend tests
  (history screen/table, debounce hook, compact dialog, `q` passthrough,
  workspace link).

### Changed

- `DeleteAnalysisButton` gains `compact` (44 px icon trigger) +
  `onDeleted` props and code-mapped error copy (was: raw server message);
  `ScoreRing` exports `BAND_LABELS` for the shared band vocabulary.

### Contract (Stage 10 amendment to §§3+4.3, all asserted in tests)

- `GET /analysis` accepts `q` (title OR document-filename substring,
  case-insensitive, blank ignored, metacharacters literal, owner-scoped,
  `total` honors `q`); `AnalysisSummary` gains the `document`
  `{filename, file_type} | null` pointer (same leak rules as the detail);
  `category`/`severity` are locked as ignored non-filters.

## [0.10.0] — Stage 09 — Polished Analysis Report (`/analysis/[id]`) — 2026-09-24

### Added

- Saved-report route `/analysis/[id]` (verified-users-only, `noindex`):
  `AnalysisReportScreen` with loading skeleton, one honest not-found panel
  for missing/foreign/malformed ids (no existence oracle), session-expired
  sign-in nudge, retryable load failure, and Back navigation top + footer.
- Report sections per UI_UX_SPEC §7: score gauge + persisted-stats grid +
  stacked severity bar + heuristic footnote; `CategoryBars` (this-analysis
  counts) + `HealthBars` (persisted dimensions); distinct designed clean /
  `failed` / `segmented` states instead of hollow charts.
- Requirement list toolbar: search (text + identifier), status/severity
  filters, sort (original order default), live "Showing X of Y", no-match
  empty state + reset; issues collapsed by default with per-requirement
  toggles + Expand-all/Collapse-all; `CopyButton` on requirement text and
  every suggested fix (clipboard denial reads inline, never silent).
- `DeleteAnalysisButton`: explicit confirm dialog (focus to safe default,
  Tab-trapped, Esc cancels, focus returns); 404-at-confirm resolves like a
  success; other errors stay open with the honest message.
- 15 backend tests (`test_analysis_report.py`) + 39 frontend tests
  (reporting helpers, copy, summary bars, result view, delete dialog,
  report screen).

### Changed

- One shared `AnalysisResultView` serves the fresh workspace result and the
  saved route (`context` + footer `actions` slot; `Start over` moved to the
  workspace) so the two can never drift; zero frontend recalculation —
  `lib/reporting.ts` only counts/filters/sorts the persisted record.
- History UI deferred to Stage 10 (the report its rows link to ships first).

### Contract (Stage 09 amendment to §4.3, all asserted in tests)

- Detail gains `document: {filename, file_type} | null` (display-only —
  no id, no storage key/path, no binary); upload analysis-half ==
  `GET /analysis/{id}`; `failed` rows read back null-scored with `{}`
  breakdown + empty requirements; absent documents degrade to `null`;
  malformed ids → `400 validation_error` (mapped UI-side to not-found).

## [0.9.0] — Stage 08 — Secure Document Upload + Extraction + Upload UI — 2026-09-24

### Added

- `POST /api/v1/documents/upload` (multipart, EXACTLY one pdf/docx/txt file →
  `201 {document, analysis}`): verified-user + CSRF guard, own 10/min bucket
  → stream to 0600 temp (10 MB budget on the TRUE count) → validate+extract
  in a worker thread + 60 s timeout → the SAME segment → detect → score
  pipeline as pasted text → one transaction (document row + FULL analysis
  graph, `source_type: "document"`). Any failure leaves no rows, no objects,
  no temp files. `GET /documents/{id}` reads owned metadata byte-identical to
  the upload half (foreign ids 404 identically); `DELETE /analysis/{id}` on a
  document analysis purges the orphaned document (row + storage object).
- Validation (`documents/validation.py`, pure): sanitize (neutralize, rarely
  reject) → extension → MIME agreement → magic bytes → OOXML/NUL structure;
  bounded extraction (`documents/extraction.py`): pypdf ≤500 pages, python-
  docx ≤2000 members / ≤50 MB in TRUE order with `|` table joins, TXT
  utf-8-sig → windows-1252 → latin-1; 200 000-char budget during
  accumulation; `422 extraction_failed` / `no_extractable_text` (no OCR).
- Storage abstraction (`storage/base.py` + `local.py`): server-generated
  `documents/{owner}/{doc}/source` keys, traversal/symlink-proof, prune-on-
  delete, EXDEV-safe move; binaries never touch Postgres.
- `/analyzer` tabs (Paste text / Upload file, arrow-key nav) +
  `DocumentUploadForm` (dropzone + picker, instant pre-checks, honest
  indeterminate progress) on `lib/documents.ts` (multipart via new `apiForm`)
  sharing the scored result view; 11 upload error codes mapped to UI copy.
- Migration `0005` (`documents.file_type` + CHECK); 76 backend tests
  (sanitize params, validation/extraction units, equivalence E2E, IDOR,
  cascade + storage-empty, CSRF, rate-limit, timeout cleanup, storage
  traversal/symlink) + 14 frontend tests (form/tabs/error copy).

### Changed

- `source_type` is `text|document` end-to-end (detail, summary, list filter);
  `api/v1/presenters.py` is the single service→response mapper for both.
- `/analyzer` intro copy covers both input methods; `rate_limited` UI copy
  generalized to "Too many requests" (serves both forms).
- `verify.sh` OpenAPI sanity now asserts the documents routes are mounted.

### Contract (Stage 08 amendment to §4.4 + §2, all verified live + asserted in tests)

- §4.4 rewritten as-built: exactly-one upload+analyze → `201
{document, analysis}`; `Document` gains `file_type`; stored `mime_type` is
  server-detected; `extraction_status` is `ok` (`pending`/`failed` future);
  storage key/binary never exposed; no list/delete/download endpoints yet.
- New codes: `unsupported_file_type`, `invalid_filename`, `empty_file`,
  `file_too_large` (`{reason, limit}`), `extracted_text_too_large`
  (`{max_chars}`), `too_many_files` (`{max_files}`), `extraction_failed`,
  `no_extractable_text`, `document_processing_timeout`,
  `document_not_found`; §2 table corrected (400s not 413/415; real 422s).

## [0.8.0] — Stage 07 — Detection + Scoring + Analysis CRUD + Result UI — 2026-09-24

### Added

- Deterministic detection engine (`analysis/detectors.py` + `engine.py`, pure,
  no I/O): 11 detectors (vague-quantifier, subjective-term,
  missing-measurable-criteria, optional-language, pronoun-reference,
  ambiguous-operator, undefined-terminology, absolute-language, passive-actor,
  missing-constraint, incomplete-requirement) → dedup (exact + identical-span
  merge, registry-order tiebreak; overlapping spans kept) → 100−Σ deductions
  (Low −5 / Medium −10 / High −15 / Critical −20, clamp 0–100) → mean overall
  (half-up) + band + traceable 4-dimension health.
- `POST /api/v1/analysis` now runs the full pipeline synchronously (segment →
  detect → score → transactional persist of `analyses` + `requirements` +
  `issues`) and returns `201` ANALYZED detail with populated scores, nested
  issues, and `score_breakdown` (`base` + per-issue `deductions` + `counts`).
- `GET /api/v1/analysis` (paged, newest-first, `sort`/`band`/`source_type`,
  unknown params ignored), `GET /api/v1/analysis/{id}` (byte-identical to the
  POST detail), `DELETE /api/v1/analysis/{id}` (`204`, requirements + issues
  cascade). Missing AND foreign ids → identical `404 analysis_not_found`
  (no existence oracle); GETs identity-authed, DELETE CSRF-guarded.
- Scored result UI (`/analyzer`): `AnalysisResultView` (overall score ring +
  band, severity counts, honest heuristic footnote) + `RequirementCard`
  (score, worst-severity badge, `<mark>` highlighting with union/clamped
  spans, clean-state copy, segmentation provenance) + `IssueCard` (category +
  severity + quoted phrase, "Why was this flagged?" disclosure with detector
  id, reason, suggested fix) + `ScoreRing` + `SeverityBadge` (dot + label,
  never color alone). `SegmentPreview` removed.
- Migration `0004`: `analyses.status` CHECK widened to
  `segmented|analyzed|failed`; new error code `analysis_not_found`.
- 55 backend tests (26 detector + 16 scoring/dedup/bands/health + 13 CRUD
  E2E incl. IDOR-identity, cascade row-counts, CSRF-on-DELETE, determinism)
  - 22 frontend tests (6 lib CRUD, 1 error copy, 15 across 5 result
    components incl. span merge/clamp); 4 `SegmentPreview` tests deleted with
    the component.

### Changed

- `/analyzer` intro copy describes detect + score (not just segment); submit
  pending label is "Analyzing requirements…"; result replaces the editor with
  the draft still preserved for Start-over.
- Severity design tokens (`sev-low/medium/high/critical`) added to
  `globals.css` with dark-mode values; frontend `AnalysisIssue` type drops
  `requirement_id` (nesting carries it).

### Contract (Stage 07 amendment to §4.3, all verified live + asserted in tests)

- Detail gains populated `score`/`band`/`health` + `score_breakdown`
  (`base`/`deductions`/`counts`); requirements gain `severity` (worst issue,
  `null` when clean) + `issues_count`; nested issues gain `ai_explanation`
  (`null` until Stage 17+); NO `overall_severity`; offsets are
  requirement-relative; `suggested_rewrite` stays `null` (post-Stage 07).
- Scoring formula, band edges, health partition, the 11-detector registry
  with fixed severities, dedup rules, and the honest false-positive limits
  are now binding contract text (§4.3).

## [0.7.0] — Stage 06 — SRS Input + Segmentation + Preview — 2026-09-24

### Added

- `POST /api/v1/analysis` (TEXT-only → `201` SEGMENTED detail): verified-user
  guard + per-user 20/min bucket → validate → conservative normalize →
  deterministic segment → transactional persist (`analyses` + `requirements`).
  No scores/issues/AI — `score`/`band` null, nested `issues` empty, `ai_status`
  `skipped` (always; no AI call exists).
- Segmenter (`services/segmentation.py`, pure, no I/O): FR/NFR/REQ-ID (0.95),
  decimal/numbered (0.90/0.75/0.60), bullet (0.80/0.65/0.50), paragraph
  (0.55/0.50); multi-sentence requirements, headings → section paths, source
  offsets + line refs, span invariant (segments tile the normalized text).
- `/analyzer` (verified, `noindex`): title + large editor (live char/word
  counts, requirement estimate), validation/loading/rate-limit states,
  `SegmentPreview` (requirements + evidence only — no scores/AI text), Clear /
  Start-over / Analyze-another; session-expiry re-login preserves the draft.
- Migration `0003`: `analyses.status`/`source_text`, NULL-until-scored
  `score`/`band`, `requirements.section`/`segmentation`.
- 65 backend tests (45 segmentation + 20 API/ownership/transaction) + 36
  frontend tests (lib + form/validation/loading/preview/error/reset);
  `vitest.setup.ts` IntersectionObserver stub (jsdom lacks it; motion needs it).

### Changed

- `lib/auth.ts` exposes the single-flight retry as `withSessionRetry`
  (now also serving analysis creation); param-label table shared with
  analysis field errors. Auth behavior untouched (all Stage 05 tests pass).
- Roadmap sequencing: input/segmentation (incl. roadmap-11) shipped BEFORE
  detectors — roadmap-06's detector criteria move to actual Stage 07
  (see `FUTURE_ROADMAP.md` as-built note).

### Contract (Stage 06 amendment to §4.3, all verified live + asserted in tests)

- Detail gains `status: "segmented"`; requirements gain `section` +
  `segmentation`; issues are nested-only (`[]` pre-detection — no top-level
  `issues`); `source_excerpt` is summary-only (absent from the detail).
- New codes: `text_too_large` (char budget or requirements cap, with counts),
  `no_requirements_detected` (nothing persisted), `document_analysis_unavailable`
  (non-null `document_id` before Stage 09); `options.ai_enhance` accepted + ignored.

## [0.6.0] — Stage 05 — Authentication Frontend — 2026-09-24

### Added

- Auth UI: `app/(auth)/` routes (`login`, `signup`, `forgot-password`,
  `reset-password`, `verify-email`, all `noindex, nofollow`); `AuthCard` +
  blade/sweep transition (desktop slanted panel / mobile curtain, reduced-motion
  instant path, focus + live-region management); `AuthProvider` + `useAuth` (+
  `useMediaQuery`); `lib/auth{,-errors,-validation}.ts`; `types/auth.ts`;
  `ProtectedRoute` (+ `requireVerified` nudge); `ChangePasswordForm` (unmounted
  until settings).
- 123 frontend tests (16 files: 15 new); `vitest.config.ts` (`@/*` alias);
  `jsdom` + Testing Library + `user-event` devDeps.

### Changed

- Root layout wraps the app in `AuthProvider`. Post-auth landing is the fixed
  temporary `/` until the dashboard stage.

### Contract (frontend assumptions on §4.2, all verified live)

- `register` sets no cookies (never logs in); unverified CAN log in; logout 204;
  resend/forgot always-202; reset/change 200 `{}`; `validation_error` details are
  `[{loc,msg}]`; no `turnstile_token` sent; outstanding access JWTs survive
  reset/logout until TTL (refresh revocation is the logout-everywhere mechanism).

## [0.5.0] — Stage 04 — Authentication Backend — 2026-09-23

### Added

- Auth backend: `core/security.py` (argon2id, 256-bit tokens, HS256 JWTs),
  `core/rate_limit.py` (single-process buckets), `services/auth.py` (11 flows),
  `repositories/auth.py`, `schemas/auth.py`, `api/v1/dependencies.py`
  (identity + CSRF + rate-limit guards), `api/v1/endpoints/auth.py` (11 routes).
- Email port: `email/` package (templates + `EmailService` ABC + Resend and
  console/file-outbox adapters, wired at startup with prod fail-closed).
- `CurrentPasswordError`, `RateLimitedError` → `Retry-After` header, 63 new tests.

### Changed

- `tests/test_database.py`: metadata/head/tables expectations for `0002`, token
  tables added to the cascade test. `backend/.env.example`: Stage-04 block active.

### Contract (amendments, all additive — see API_CONTRACT §4.2)

- New explicit `POST /auth/refresh` rotation endpoint (theft response included).
- `/me` also returns `display_name` / `is_active`; `register` takes `name`.
- New codes: `invalid_credentials`, `invalid_token`, `password_too_weak`,
  `current_password_incorrect`, `account_disabled`.

### Database

- Revision `0002`: `refresh_tokens` (rotation + reuse-detection columns),
  `email_verification_tokens`, `password_reset_tokens`. Cycle + `alembic check` clean.

### Security

- Hash-only credentials at rest; constant-time compare; `HttpOnly; Secure (prod);
SameSite=Lax` cookies; Origin/Referer CSRF checks; anti-enumeration posture tested.

## [0.4.0] — Stage 03 — Backend Foundation / Service Layer — 2026-09-23

### Added

- Service layer: `app/services/` (`readiness`, `transactions.@transactional`),
  `app/repositories/` (`SystemRepository`), `app/exceptions/` (`AppError` + 4
  subclasses), `app/schemas/` (`system`, `common` pagination).
- `main.py`: lifespan engine disposal, access-log middleware, `AppError` +
  `SQLAlchemyError` handlers, tightened CORS (explicit methods/headers).
- 26 backend tests added, 2 retired (net +24): services, errors, middleware, CORS,
  schemas, OpenAPI/lifespan, model-metadata sanity.

### Changed

- Error handling extended: `AppError` → envelope mapping, sanitized `SQLAlchemyError`
  → `500 internal_error` (per-field validation details preserved).
- `/ready` now flows through the service layer (same shapes, same truth table).
- Fixed `alembic/env.py` silencing app logging in-process (`fileConfig()` now
  passes `disable_existing_loggers=False`).
- `Document.analyses` gained `passive_deletes=True` (ORM-only, no migration).

### Database

- None (no migration; `0001` still head, `alembic check` zero drift).

### Security

- Error sanitization + query-param-free access log (both tested); DSN hygiene unchanged.

## [0.3.0] — Stage 02 — Database Foundation — 2026-09-23

### Added

- Async PG stack (SQLAlchemy 2.0.54, asyncpg 0.31.0, Alembic 1.20.0, greenlet, Mako).
- `app/core/database.py` (lazy engine, session factory, `get_session`, status probe,
  dispose) + six models + Alembic env + hand-written revision `0001`.
- `/ready` live DB probe (`ok`/`error`/`not_configured`); `DIRECT_DATABASE_URL` support.
- `tests/test_database.py` (17 tests) + conftest PG harness (`TEST_DATABASE_URL`,
  scratch-DB auto-create, skip-if-unreachable).

### Changed

- `DATABASE_SCHEMA.md` rewritten as IMPLEMENTED (conventions, per-table reference,
  index rationale, migration workflow); `SECURITY_SPEC.md` §12, `API_CONTRACT.md`
  §4.1, `ARCHITECTURE.md`, README (local DB workflow) updated.
- `verify.sh` ruff scope extended to `alembic/`.

### Database

- Tables: `users`, `analyses`, `requirements`, `issues`, `documents`,
  `ai_provider_credentials`. UUID PKs (client-side), TIMESTAMPTZ, VARCHAR+CHECK
  vocabularies (no PG enums), `owner_id` cascades, 16 indexes, 20 CHECKs.
- Conventions locked: email lowercase app-side, one live key per user+provider
  (partial unique), document link via `analyses.document_id`, RLS deferred (reasoned).

### Security

- DSN never logged/echoed (tested); hash-only password column; ciphertext-only key
  column; cascade deletion plan; least-privilege prod guidance; no creds committed.

### Tests

- `verify.sh` green (pytest 27/27 on real PG 16, vitest 6/6, lint/type/build);
  downgrade/upgrade cycle + `alembic check` clean; skip-mode + live `ready:ok` verified.

### Notes

- No auth/analysis/upload/AI logic (later stages). `docker-compose.yml` still
  unvalidated (no Docker in sandbox). Sandbox PG via uncommitted `pgserver` aid.

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
