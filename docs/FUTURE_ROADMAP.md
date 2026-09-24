# Future Roadmap

> Stage plan with entry/exit criteria. Each stage lists its OWNER SPEC(S) — the agent MUST
> read them first — and the contract artifacts it MUST update. Stages run sequentially;
> a stage may be split (e.g. `09a`) if too large, never skipped silently.

## Stage index

| Stage | Title                               | Owner spec(s)                           | Exit criteria (must ALL hold)                                                                                                                                                                                      |
| ----- | ----------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 00    | Project contract + architecture     | PROJECT_SPEC, ARCHITECTURE              | All 12 docs exist, mutually consistent; ADRs recorded                                                                                                                                                              |
| 01    | Repository / development foundation | ARCHITECTURE, DEVELOPMENT_RULES         | Runnable FE+BE skeletons; `verify.sh` green; compose file; env examples                                                                                                                                            |
| 02    | Database foundation                 | DATABASE_SCHEMA, ARCHITECTURE           | Models + initial Alembic migration; `ready` DB check; connection pooling                                                                                                                                           |
| 03    | Backend foundation                  | API_CONTRACT, SECURITY_SPEC             | Error envelope handlers, request-id, CORS, pagination helpers, OpenAPI posture                                                                                                                                     |
| 04    | Authentication backend              | SECURITY_SPEC, API_CONTRACT §4.2        | Register/verify/login/logout/reset/change/delete; argon2id; cookies; email abstraction + Resend                                                                                                                    |
| 05    | Authentication frontend             | UI_UX_SPEC §4–5, API_CONTRACT §4.2      | AuthCard+blade, guarded routes, session hook, onboarding nudge (Maybe Later)                                                                                                                                       |
| 06    | Deterministic NLP engine            | PROJECT_SPEC §3–6                       | ≥13 detectors, configurable packs, offsets+reasons+recommendations, 0 network; unit-tested incl. golden examples                                                                                                   |
| 07    | Analysis API                        | API_CONTRACT §4.3, DATABASE_SCHEMA      | POST/GET/DELETE analysis; scoring + breakdown; IDOR tests; `ai_enhance` flag plumbed (no-op until Stage 19)                                                                                                        |
| 08    | Analyzer UI                         | UI_UX_SPEC §6/8, API_CONTRACT §4.3      | Text input + run + calm results (no AI sections beyond empty-state CTA)                                                                                                                                            |
| 09    | Document upload                     | SECURITY_SPEC §5, API_CONTRACT §4.4     | Size/MIME/magic-byte guards, storage abstraction, cleanup, signed URLs                                                                                                                                             |
| 10    | PDF/DOCX/TXT extraction             | ARCHITECTURE §4                         | Timeouts, char caps, zip-bomb/page caps, per-format tests                                                                                                                                                          |
| 11    | Requirement segmentation            | PROJECT_SPEC §"segmentation"            | FR/NFR/REQ + numbered + heading + bullet strategies; modular registry; tests                                                                                                                                       |
| 12    | Analysis history                    | API_CONTRACT §4.3, UI_UX_SPEC           | Search/filter/sort/paginate/delete; ownership-scoped; responsive table→cards                                                                                                                                       |
| 13    | Detailed report UI                  | UI_UX_SPEC §7–8                         | `/analysis/[id]`: gauge, highlighted phrases, issues, "Why flagged?", AI empty states                                                                                                                              |
| 14    | Dashboard data                      | API_CONTRACT §4.5                       | stats/categories/trends/severity/activity endpoints, denormalized counts                                                                                                                                           |
| 15    | Dashboard visualization             | UI_UX_SPEC §7                           | Gauge, bars, trend, activity; useful empty states; mobile variants — ALREADY ABSORBED by actual Stage 11; slot reused by as-built Stage 15 (AI results integration & trust UX, UI_UX_SPEC §13a, no backend change) |
| 16    | Settings/profile/security           | API_CONTRACT §4.6–4.7, UI_UX_SPEC       | Profile, password, providers mgmt UI, privacy, DELETE-typed account deletion                                                                                                                                       |
| 17    | AI credential architecture          | AI_PROVIDER_SPEC §2/5, SECURITY_SPEC §4 | ABC + registry + Fernet vault + rotate + key lifecycle tests                                                                                                                                                       |
| 18    | AI provider integrations            | AI_PROVIDER_SPEC §4                     | Gemini → Groq → OpenAI → Anthropic → OpenRouter → HF; per-adapter tests (mocked HTTP)                                                                                                                              |
| 19    | AI overview/improvements            | AI_PROVIDER_SPEC §3/6/8                 | Prompts, overview + improvement wiring, sanitized rendering, disclosure copy                                                                                                                                       |
| 20    | AI fallback/error handling          | AI_PROVIDER_SPEC §7                     | Chain, retry-ai, failure matrix tests, latency/usage recording                                                                                                                                                     |
| 21    | Security hardening                  | SECURITY_SPEC                           | CSP, OpenAPI prod posture, audits (npm/pip), secret-scan docs, header review                                                                                                                                       |
| 22    | CAPTCHA/rate limiting               | SECURITY_SPEC §7                        | Turnstile verify + buckets on sensitive routes; 429 envelope + tests                                                                                                                                               |
| 23    | Privacy/data lifecycle ✅           | DATABASE_SCHEMA §4                      | Delivered: retention settings/CLI, purge, signed live export, storage-aware account-deletion cascade regression tests                                                                                              |
| 24    | Monitoring ✅                       | SECURITY_SPEC §2.5/§11                  | Delivered: optional Sentry backend/frontend with scrubbers, bounded request IDs, JSON logs, safe health/readiness semantics, AI/storage/email/rate-limit observability                                             |
| 25    | Performance ✅                      | UI_UX_SPEC §6, SEO_SPEC §3              | Delivered: DB pool tuning, summary-query projections, SQL dashboard improved-count, bounded extraction workers, frontend memoized derivations, build/audit verification                                            |
| 26    | SEO foundation ✅                   | SEO_SPEC §2–3                           | Delivered: public `/` landing foundation, centralized metadata/canonicals, OG/Twitter, robots/sitemap, noindex private/auth policy, JSON-LD core                                                                   |
| 27    | SEO content ✅                      | SEO_SPEC §4                             | Delivered: public content routes, educational resources, internal links, breadcrumbs/Article JSON-LD, sitemap/robots expansion, content/privacy tests                                                              |
| 28    | Responsive/a11y refinement ✅       | UI_UX_SPEC §10–11                       | Delivered repository slice: dialog close/scroll/focus refinements, 44px touch targets, long-content wrapping, switch names, focused tests; browser/AT visual validation remains ops/QA                             |
| 29    | Testing/QA ✅                       | DEVELOPMENT_RULES §4                    | Delivered QA baseline: route-surface sentinel, deterministic golden corpus, AI prompt privacy/cap tests, full gate + flakiness rerun; DB/browser/Docker validation remains environment/deployment work             |
| 30    | Production deployment ✅            | ARCHITECTURE §3                         | Delivered: Vercel + separate FastAPI host + Supabase Postgres/Storage topology documented, Supabase storage adapter, env runbook, backups, rollback, smoke tests; live external validation remains operator-run |
| 31    | Documentation/screenshots ✅        | PROJECT_SPEC §2                         | Delivered: final README, project summary, user guide, API overview, detection-engine docs, screenshot catalog/capture procedure; screenshots not captured because no browser runtime was available |
| 32    | Final audit ✅                      | ALL                                     | Delivered: actual-repository reconciliation, final security/doc/test audit, requirement traceability, limitations register, full verification gate, and release-readiness docs. No Stage 33 is planned.             |

> As-built sequencing (Stage 06, 2026-09-24): the analysis spine shipped
> input-first. Actual Stage 06 delivered SRS text input + validation +
> normalization + deterministic segmentation + persistence + structured preview —
> absorbing roadmap-11 (segmentation) and the input halves of roadmap-07 (POST)
> and roadmap-08 (input UI). Roadmap-06's detector exit criteria shipped in actual
> Stage 07 as 11 production detectors + transparent scoring — and Stage 07 also
> absorbed the roadmap-07/08 remainders (GET/list/delete, scored-results UI),
> so the analysis spine is fully closed through scoring + CRUD + basic results.
> Actual Stage 08 (2026-09-24) absorbed roadmap-09 EXCEPT signed-URL downloads
> and the document list/delete-by-id endpoints (no download/list/purge-by-id
> surface yet — still future) and roadmap-10 fully: exactly-one-file
> upload+analyze returning `{document, analysis}`, metadata read, validation
> pipeline, bounded extraction (pdf/docx/txt), local storage adapter, and the
> upload UI (tabs + dropzone) — all on the shared Stage 07 pipeline.
> Actual Stage 09 (2026-09-24) shipped roadmap-13 (detailed report UI) FIRST
> as `/analysis/[id]` — gauge, overviews, toolbar, copy, confirm-delete —
> plus the detail `document` pointer and failed/segmented read-back rules.
> Actual Stage 10 (2026-09-24) then shipped roadmap-12 (analysis history) as
> `/history` — server search (`q`), band/source filters, backend sort,
> paging, per-row delete — plus the summary `document` pointer. Actual
> Stage 11 (2026-09-24) absorbed roadmap-14 AND roadmap-15 together as
> `/dashboard` — one aggregate `GET /dashboard` endpoint (the planned five
> collapse into a single snapshot) plus the statistics UI (totals, trend,
> distributions, recent runs; Recharts lands here, its earmarked stage) —
> and flipped the post-auth landing to `/dashboard` per UI_UX_SPEC §5.
> Roadmap-09 is FULLY closed (Stage 08: upload/guards/storage; Stage 19:
> download/list/purge-by-id surface).
> Actual Stage 12 (2026-09-24) shipped the roadmap-17 vault spine EARLY as
> vault + provider management (ABC + metadata registry + Fernet vault +
> CRUD/test endpoints; NO adapters, NO settings UI, NO generation) —
> roadmap-16 still owns the Settings UI, roadmap-18 the live adapters,
> roadmap-19 the generation.
> Actual Stage 13 (2026-09-24) shipped the providers-mgmt-UI slice of
> roadmap-16 EARLY as `/settings` (list/add/test/enable/default/
> replace/remove on the Stage 12 API; no backend changes) — roadmap-16's
> remainder (profile, password, privacy, DELETE-typed account deletion)
> slots into the same route as future sections.
> Actual Stage 16 (2026-09-24) closed roadmap-16: GET/PATCH
> `/settings/profile` (verified-only, no migration) + Profile/Password/
> Privacy/Delete-account sections in `/settings` (password form mounted
> as-is, privacy honestly control-free, DELETE-typed deletion → farewell).
> Privacy ENFORCEMENT (retention/export/purge endpoints) stays Stage 23's.
> Actual Stage 14 (2026-09-24) absorbed roadmap-18 + roadmap-19 + the
> roadmap-20 chain/matrix slice EARLY as live AI enhancement: 4 of 6
> adapters (gemini/groq/openai/openrouter over mocked-HTTP tests),
> versioned prompts + sanitizer + model table, the post-commit
> default→fallback chain (max 3, first-error-wins), overview + capped
> rewrites on TEXT and upload paths, TEST gone live for the four, and the
> analyzer checkbox + four-state report block. Open remainders: anthropic
>
> - huggingface adapters, `POST /analysis/{id}/retry-ai`, creation-time
>   live key proof, per-run what-was-sent disclosure copy.
>   Actual Stage 17 (2026-09-24) closed the `retry-ai` remainder:
>   owner-scoped POST re-running the shared AI step (reset → re-read →
>   enhance, deterministic untouched) + the failed-card "Try again" button
>   with silent parent re-read on both report surfaces. Still open:
>   anthropic + huggingface adapters, creation-time live key proof,
>   per-run what-was-sent disclosure copy, dedicated AI rate buckets.
>   Actual Stage 18 (2026-09-24) closed the anthropic + huggingface
>   remainder: `AnthropicProvider` (Messages API) + `HuggingFaceProvider`
>   (Inference Providers router — the legacy `api-inference` host is
>   retired, so the registry pins `router.huggingface.co`), model-table
>   rows, TEST/enhancement/retry live for all six, the four deferral tests
>   flipped (defensive no-adapter branches kept, pinned via monkeypatch).
>   Still open: creation-time live key proof, per-run what-was-sent
>   disclosure copy, dedicated AI rate buckets.
>   Actual Stage 19 (2026-09-24) closed roadmap-09: newest-first document
>   list, purge-by-id (row + object; analyses survive via SET NULL), and
>   signed-URL downloads (short-lived single-document HS256 bearer, bytes
>   re-hashed before release, `attachment` disposition) + frontend clients
>   (no new UI — no surface is specified; a future slice may hang a
>   "download original" affordance on the history/report views).
>   Actual Stage 20 (2026-09-24) closed roadmap-21 (security hardening):
>   backend framing denial (prod-only) + header review, OpenAPI docs gated
>   out of production (tested both ways), report-only CSP (prod-only, API
>   origin from env), `npm audit` + `pip-audit` gating verify.sh (pytest
>   8.3.4 → 9.1.1 fixed; 7 starlette findings accepted with reachability
>   notes — framework-major migration deferred), and secret-scan.sh (gates
>   verify.sh + documented pre-commit hook).
>   Actual Stage 21 (2026-09-24) closed the remaining AI-product slices from
>   roadmap-19/20 and part of roadmap-22's AI surface: creation-time provider
>   key proof before encrypted storage, per-run what-was-sent disclosure copy,
>   and a dedicated retry-AI rate bucket.
>   Actual Stage 22 (2026-09-24) closed roadmap-22's Turnstile slice:
>   frontend token collection + backend Cloudflare siteverify on public
>   high-abuse auth routes (register/login/resend/forgot/reset), fail-closed
>   production posture, stable app errors, mocked-provider tests. Still open
>   from roadmap-22: distributed limiter storage / production deployment
>   posture. The table above keeps its original numbers; STAGE_STATUS.md records the
>   as-built mapping.

> Actual Stage 26 (2026-09-24) closed roadmap-26: replaced the Stage 01 `/`
> placeholder with a public landing foundation, centralized SEO metadata helpers,
> canonical origin handling via `NEXT_PUBLIC_SITE_URL`, project-owned OG/Twitter image,
> robots/sitemap generation, strict private/auth noindex policy, 404 noindex metadata,
> and generic `WebSite` + `SoftwareApplication` JSON-LD. Stage 27 still owns deeper
> evergreen content, breadcrumbs for new public pages, external Rich Results/OG/Search
> Console validation, and Core Web Vitals/search measurement.
> Actual Stage 27 (2026-09-24) closed roadmap-27's repository content slice:
> `/features`, `/how-it-works`, `/resources`, and two educational resource guides now
> provide truthful public content, coherent internal links, public navigation/footer,
> breadcrumbs + Article JSON-LD, and expanded sitemap/robots coverage. External Search
> Console, Rich Results, OG crawler, deployment-domain, and Core Web Vitals validation remain
> deployment/operations work because no browser/search-console tooling is available here.

> Actual Stage 28 (2026-09-24) closed roadmap-28's repository refinement slice:
> settings/report delete dialogs gained viewport-safe internal scrolling and visible close
> affordances where appropriate; analyzer/upload/copy/dialog actions were normalized to
> 44px touch targets with visible focus; long requirements, filenames, titles, URLs,
> issue text, category labels, AI rewrites, history cards, and dashboard recent rows now wrap
> on narrow screens instead of clipping/overflowing; provider switches expose action-accurate
> names. Browser/device screenshots, live assistive-technology checks, and deployment-host
> visual validation remain Stage 29/operations work because no browser tooling was available
> in this sandbox.

> Actual Stage 29 (2026-09-24) established a repository-level QA baseline: the full
> verification gate passed after adding a compact deterministic analysis golden corpus, a
> documented `/api/v1` route-surface sentinel, and AI prompt privacy/cap regression tests.
> Backend/frontend suites were rerun for a practical flakiness check. PostgreSQL, Docker,
> browser automation, axe/manual screen-reader validation, Supabase, Cloudflare, Sentry,
> email, and real AI provider validation remain deployment/operations work in this sandbox;
> distributed limiter storage remains the deferred Stage 22 production-hardening slice.
>
> Actual Stage 30 (2026-09-24) closed the repository production-deployment readiness slice:
> FastAPI remains a separate Python service host (not Vercel), the frontend remains Vercel,
> and Supabase is the documented managed Postgres + Storage target. The missing Supabase
> Storage adapter was implemented behind the storage port, env examples now include backend-only
> Supabase storage secrets, and `docs/DEPLOYMENT.md` owns the production env/migration/health/
> smoke/rollback/backup/security/SEO/troubleshooting runbook. Live external-service validation
> still belongs to operators because this sandbox has no production Supabase, Turnstile, Resend,
> Sentry, browser/device, or AI-provider credentials. Rate limiting intentionally remains
> process-local single-instance for v1; a shared limiter is future hardening.
>
> Actual Stage 31 (2026-09-24) finalized repository presentation/documentation assets:
> professional README, college project summary, user guide, concise API overview, dedicated
> deterministic detection-engine/scoring documentation, and final screenshot catalog/capture
> procedure. Browser screenshot capture was not fabricated: the sandbox still lacks Chromium,
> Chrome, Playwright, or equivalent browser tooling, so screenshots remain an owner-run capture
> task using the documented safe demo account/data procedure.

> Actual Stage 32 (2026-09-24) completed the final planned audit/release-readiness pass:
> source/docs/tests/routes/models/migrations/security/deployment limitations were reconciled
> against the actual repository, `docs/FINAL_AUDIT.md` and
> `docs/REQUIREMENTS_TRACEABILITY.md` were added, stale documentation was corrected, and the
> full verification gate was rerun. Remaining items are documented external validation or
> optional parking-lot enhancements, not a required Stage 33.

## Dependency notes

- 02 → 03 → 04 → 05 is the auth spine; 06 → 07 → 08 is the analysis spine. 07 needs 02+04
  (persistence + owner). 13 needs 07+08. 17 needs 04 (owner) + 02 (table). 19 needs 17+18+07+13.
- 22 (rate limits) should land before any public exposure; 21+24 are release blockers.
- If a stage discovers a contract flaw: amend the SPEC in the same stage (ADR + CHANGELOG),
  never silently diverge.

## Parking lot (ideas explicitly NOT committed)

- Team workspaces / sharing analyses (multi-tenancy redesign — post-v1).
- DOCX/PDF export of reports (nice-to-have; privacy review needed).
- Additional AI providers beyond the six (registry makes this cheap — add on demand).
- CLI / batch API for CI pipelines ("SRS lint in CI") — post-v1 product bet.
- Multi-language requirement analysis (engine is English-first in v1).
