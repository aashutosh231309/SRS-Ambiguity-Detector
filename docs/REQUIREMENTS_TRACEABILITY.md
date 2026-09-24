# Requirements Traceability Matrix

This matrix maps the immutable project requirements from `docs/PROJECT_SPEC.md` to the actual implementation and evidence available at final audit time.

| Requirement | Implementation evidence | Test/documentation evidence | Final status |
| --- | --- | --- | --- |
| SRS text input | `frontend/src/app/analyzer/page.tsx`, `AnalyzerWorkspace`, `AnalyzerForm`, `POST /api/v1/analysis` | `backend/tests/test_analysis.py`, `frontend/src/components/analyzer/*test.tsx`, `docs/API_CONTRACT.md` §4.3 | Complete |
| SRS document upload | `POST /api/v1/documents/upload`, `DocumentUploadForm`, document validation/extraction services | `backend/tests/test_documents.py`, `frontend/src/components/analyzer/DocumentUploadForm.test.tsx`, `docs/API_CONTRACT.md` §4.4 | Complete |
| PDF/DOCX/TXT extraction | `backend/app/documents/extraction.py`, `validation.py` | `backend/tests/test_documents.py`, `docs/SECURITY_SPEC.md` §5 | Complete; OCR unsupported |
| Requirement segmentation | `backend/app/services/segmentation.py` | `backend/tests/test_segmentation.py`, golden corpus in `backend/tests/test_stage29_quality_baseline.py` | Complete |
| Deterministic ambiguity detection | `backend/app/analysis/detectors.py`, `engine.py` | `backend/tests/test_detectors.py`, `backend/tests/test_stage29_quality_baseline.py`, `docs/DETECTION_ENGINE.md` | Complete |
| Ambiguity categories | 11 production detector constants/registry entries | `docs/DETECTION_ENGINE.md`, `docs/API_CONTRACT.md` detector registry table | Complete; 13 conceptual spec categories are represented by 11 implemented detectors |
| Explanation of detected ambiguity | finding `reason`, `recommendation`, issue cards and disclosures | `backend/tests/test_analysis.py`, `frontend/src/components/analyzer/IssueCard.test.tsx`, `docs/API_CONTRACT.md` | Complete |
| Suggested improvements | deterministic recommendation per finding; optional AI rewrites on flagged requirements | `backend/tests/test_detectors.py`, `backend/tests/test_ai_enhancement.py`, `frontend/src/components/analyzer/RequirementCard.test.tsx` | Complete |
| Ambiguity score | `backend/app/analysis/engine.py` scoring and bands | `backend/tests/test_scoring.py`, golden corpus, `docs/DETECTION_ENGINE.md` | Complete |
| Severity | detector findings and requirement worst-severity aggregation | `backend/tests/test_detectors.py`, `backend/tests/test_scoring.py` | Complete |
| User registration/login/logout | `backend/app/api/v1/endpoints/auth.py`, auth UI forms/provider | `backend/tests/test_auth.py`, `frontend/src/components/auth/*test.tsx` | Complete; DB-backed auth tests skipped here when PostgreSQL unavailable |
| Email verification/password reset | auth services/token tables/email adapters and frontend routes | `backend/tests/test_auth.py`, `frontend/src/components/auth/VerifyEmailForm.test.tsx`, `ResetPasswordForm.test.tsx` | Complete; live email provider validation is operator-run |
| Session handling | access JWT, rotating refresh tokens, reuse detection, cookies | `backend/tests/test_auth.py`, `backend/tests/test_auth_security.py`, `docs/SECURITY_SPEC.md` §3 | Complete |
| Database storage | SQLAlchemy models, Alembic revisions `0001`–`0006` | `backend/tests/test_database.py`, `docs/DATABASE_SCHEMA.md`; live migration not run in this sandbox | Complete with runtime DB validation limitation |
| Analysis persistence | `analyses`, `requirements`, `issues`; analysis repositories/services | `backend/tests/test_analysis*.py`, `test_stage29_quality_baseline.py` | Complete |
| Document persistence | `documents` metadata + storage abstraction | `backend/tests/test_documents.py`, `backend/tests/test_storage_supabase.py` | Complete; live Supabase object validation unavailable |
| Ownership isolation / IDOR protection | owner-scoped repositories/endpoints and dependency guards | `backend/tests/test_analysis_crud.py`, `test_documents.py`, `test_ai_providers.py`, `test_privacy.py` | Complete in test design; DB-backed tests skipped here without PostgreSQL |
| Analysis history | `/history` route, `GET /analysis` list/search/filter/sort/page | `backend/tests/test_analysis_history.py`, `frontend/src/components/history/*test.tsx` | Complete |
| Saved report reopening | `/analysis/[id]`, `GET /analysis/{id}` | `backend/tests/test_analysis_report.py`, `frontend/src/components/analyzer/AnalysisReportScreen.test.tsx` | Complete |
| Dashboard statistics/charts | `/dashboard`, dashboard repository/service, Recharts UI | `backend/tests/test_dashboard.py`, `frontend/src/components/dashboard/*test.tsx` | Complete |
| AI credential vault | `backend/app/core/vault.py`, `ai_provider_credentials` model | `backend/tests/test_ai_vault.py`, `backend/tests/test_ai_providers.py` | Complete |
| AI provider adapters | six adapters under `backend/app/ai/adapters` | `backend/tests/test_ai_adapters.py`, `docs/AI_PROVIDER_SPEC.md` | Complete with mocked HTTP tests; no live provider validation claimed |
| AI enhancement/fallback/retry | `services/ai_enhancement.py`, `POST /analysis/{id}/retry-ai`, UI outcome block | `backend/tests/test_ai_enhancement.py`, `test_retry_ai.py`, `frontend/src/components/analyzer/AiOverviewSection.test.tsx` | Complete |
| Privacy disclosure for AI | successful AI overview disclosure copy in result UI | `AI_PROVIDER_SPEC.md`, UI tests for AI state rendering | Complete |
| Settings/profile/password/privacy | `/settings` route and settings endpoints | `backend/tests/test_settings.py`, `backend/tests/test_privacy.py`, `frontend/src/components/settings/*test.tsx` | Complete |
| Account deletion/data lifecycle | account deletion service + storage purge ordering; privacy purge/export | `backend/tests/test_auth.py`, `test_privacy.py`, `docs/SECURITY_SPEC.md` §10 | Complete in implementation/tests; live storage/database validation unavailable here |
| Security hardening | cookies, CSRF, CORS, rate limiting, Turnstile, headers, monitoring scrubbers, audits | `backend/tests/test_auth_security.py`, `test_cors.py`, `test_turnstile.py`, `test_security_headers.py`, `test_monitoring.py`, `scripts/verify.sh` | Complete with documented process-local limiter limitation |
| SEO public pages | `/`, `/features`, `/how-it-works`, `/resources/*`, metadata, robots, sitemap | `frontend/src/lib/seo.test.ts`, `public-content.test.ts`, `src/app/seo-contract.test.ts` | Complete; external Search Console/OG crawler validation not performed |
| Deployment documentation | `docs/DEPLOYMENT.md`, env examples, Supabase storage adapter | Stage 30 tests/docs, `backend/tests/test_storage_supabase.py` | Complete; live external deployment validation unavailable |
| Final documentation | README, project summary, user guide, API overview, detection docs, screenshot procedure | Stage 31 docs and link check | Complete; screenshot images not captured due browser unavailability |
