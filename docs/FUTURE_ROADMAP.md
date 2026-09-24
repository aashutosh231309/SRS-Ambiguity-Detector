# Future Roadmap

> Stage plan with entry/exit criteria. Each stage lists its OWNER SPEC(S) — the agent MUST
> read them first — and the contract artifacts it MUST update. Stages run sequentially;
> a stage may be split (e.g. `09a`) if too large, never skipped silently.

## Stage index

| Stage | Title | Owner spec(s) | Exit criteria (must ALL hold) |
|-------|-------|---------------|-------------------------------|
| 00 | Project contract + architecture | PROJECT_SPEC, ARCHITECTURE | All 12 docs exist, mutually consistent; ADRs recorded |
| 01 | Repository / development foundation | ARCHITECTURE, DEVELOPMENT_RULES | Runnable FE+BE skeletons; `verify.sh` green; compose file; env examples |
| 02 | Database foundation | DATABASE_SCHEMA, ARCHITECTURE | Models + initial Alembic migration; `ready` DB check; connection pooling |
| 03 | Backend foundation | API_CONTRACT, SECURITY_SPEC | Error envelope handlers, request-id, CORS, pagination helpers, OpenAPI posture |
| 04 | Authentication backend | SECURITY_SPEC, API_CONTRACT §4.2 | Register/verify/login/logout/reset/change/delete; argon2id; cookies; email abstraction + Resend |
| 05 | Authentication frontend | UI_UX_SPEC §4–5, API_CONTRACT §4.2 | AuthCard+blade, guarded routes, session hook, onboarding nudge (Maybe Later) |
| 06 | Deterministic NLP engine | PROJECT_SPEC §3–6 | ≥13 detectors, configurable packs, offsets+reasons+recommendations, 0 network; unit-tested incl. golden examples |
| 07 | Analysis API | API_CONTRACT §4.3, DATABASE_SCHEMA | POST/GET/DELETE analysis; scoring + breakdown; IDOR tests; `ai_enhance` flag plumbed (no-op until Stage 19) |
| 08 | Analyzer UI | UI_UX_SPEC §6/8, API_CONTRACT §4.3 | Text input + run + calm results (no AI sections beyond empty-state CTA) |
| 09 | Document upload | SECURITY_SPEC §5, API_CONTRACT §4.4 | Size/MIME/magic-byte guards, storage abstraction, cleanup, signed URLs |
| 10 | PDF/DOCX/TXT extraction | ARCHITECTURE §4 | Timeouts, char caps, zip-bomb/page caps, per-format tests |
| 11 | Requirement segmentation | PROJECT_SPEC §"segmentation" | FR/NFR/REQ + numbered + heading + bullet strategies; modular registry; tests |
| 12 | Analysis history | API_CONTRACT §4.3, UI_UX_SPEC | Search/filter/sort/paginate/delete; ownership-scoped; responsive table→cards |
| 13 | Detailed report UI | UI_UX_SPEC §7–8 | `/analysis/[id]`: gauge, highlighted phrases, issues, "Why flagged?", AI empty states |
| 14 | Dashboard data | API_CONTRACT §4.5 | stats/categories/trends/severity/activity endpoints, denormalized counts |
| 15 | Dashboard visualization | UI_UX_SPEC §7 | Gauge, bars, trend, activity; useful empty states; mobile variants |
| 16 | Settings/profile/security | API_CONTRACT §4.6–4.7, UI_UX_SPEC | Profile, password, providers mgmt UI, privacy, DELETE-typed account deletion |
| 17 | AI credential architecture | AI_PROVIDER_SPEC §2/5, SECURITY_SPEC §4 | ABC + registry + Fernet vault + rotate + key lifecycle tests |
| 18 | AI provider integrations | AI_PROVIDER_SPEC §4 | Gemini → Groq → OpenAI → Anthropic → OpenRouter → HF; per-adapter tests (mocked HTTP) |
| 19 | AI overview/improvements | AI_PROVIDER_SPEC §3/6/8 | Prompts, overview + improvement wiring, sanitized rendering, disclosure copy |
| 20 | AI fallback/error handling | AI_PROVIDER_SPEC §7 | Chain, retry-ai, failure matrix tests, latency/usage recording |
| 21 | Security hardening | SECURITY_SPEC | CSP, OpenAPI prod posture, audits (npm/pip), secret-scan docs, header review |
| 22 | CAPTCHA/rate limiting | SECURITY_SPEC §7 | Turnstile verify + buckets on sensitive routes; 429 envelope + tests |
| 23 | Privacy/data lifecycle | DATABASE_SCHEMA §4 | Retention, purge, export, deletion-cascade verification test |
| 24 | Monitoring | SECURITY_SPEC §2.5/§10 | Sentry + scrubbers (BLOCKER-gated), health/metrics, email deliverability view |
| 25 | Performance | UI_UX_SPEC §6, SEO_SPEC §3 | Bundle audit, code-split, caching, DB indexes review, slow-query log |
| 26 | SEO foundation | SEO_SPEC §2–3 | Public routes + metadata + OG + robots/sitemap + 404 + JSON-LD core |
| 27 | SEO content | SEO_SPEC §4 | Evergreen content, internal links, breadcrumbs, validation (Rich Results) |
| 28 | Responsive/a11y refinement | UI_UX_SPEC §10–11 | Width matrix 320→2560+, keyboard/SR pass, contrast, motion-reduced |
| 29 | Testing/QA | DEVELOPMENT_RULES §4 | Coverage review, e2e smoke (auth→analyze→history), contract tests, bug bash |
| 30 | Production deployment | ARCHITECTURE §3 | Vercel + Supabase topology validated, env runbook, backups, rollback plan |
| 31 | Documentation/screenshots | PROJECT_SPEC §2 | README final, screenshots full set, API docs, user guide |
| 32 | Final audit | ALL | Baseline checklist 12/12, security pass, DoD pass, release tag |

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
> Roadmap-09's download/list/purge-by-id surface is still the outstanding
> remainder.
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
> The table above keeps its original numbers; STAGE_STATUS.md records the
> as-built mapping.

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
