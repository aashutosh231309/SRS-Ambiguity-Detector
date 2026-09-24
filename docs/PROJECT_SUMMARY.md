# Project Summary — SRS Ambiguity Detector

## Title

SRS Ambiguity Detector

## Problem statement

Software Requirements Specifications often contain vague wording, undefined terms, optional language, incomplete statements, and missing measurable criteria. Ambiguous requirements are difficult to implement, estimate, verify, and maintain because different stakeholders can interpret them differently.

## Objectives

- Accept SRS text and common SRS document formats.
- Segment requirements deterministically.
- Identify patterns that may indicate ambiguity or insufficient precision.
- Categorize each finding and explain why it was flagged.
- Provide transparent heuristic scoring and health dimensions.
- Persist analyses for history, reports, and dashboard views.
- Optionally enhance reports with user-owned AI provider keys.
- Protect user data, uploaded files, sessions, and provider credentials.
- Provide reproducible local setup, testing, and deployment documentation.

## Proposed solution

The application combines a Next.js frontend with a FastAPI backend and PostgreSQL persistence. The backend uses a deterministic rule engine for the authoritative ambiguity analysis. AI is optional and additive: it can generate overview text and suggested rewrites, but it never replaces or blocks the deterministic result.

## Key modules

| Module | Description |
| --- | --- |
| Authentication | Email/password auth with verification, reset, HttpOnly cookies, refresh rotation, and account deletion. |
| SRS input | Authenticated analyzer route for pasted requirement text. |
| Document processing | PDF/DOCX/TXT upload, validation, extraction, storage, and shared analysis pipeline. |
| Requirement segmentation | Deterministic text segmentation into candidate requirements. |
| Ambiguity detection | 11 deterministic detector categories with evidence offsets, reasons, recommendations, and severities. |
| Scoring | Transparent 100-point heuristic with severity deductions, bands, and health dimensions. |
| Reports | Saved analysis detail route with requirement cards, issue explanations, charts, and AI outcome states. |
| History | Paginated analysis list with search/filter/sort/delete. |
| Dashboard | Aggregate analysis statistics, trends, severity mix, categories, and recent analyses. |
| AI enhancement | User-owned provider credentials, encrypted vault, six provider adapters, fallback chain, retry, and disclosure copy. |
| Settings/privacy | Profile, password, AI provider management, privacy export, purge, retention, and account deletion. |
| Deployment | Vercel frontend + separate FastAPI backend host + PostgreSQL/Supabase + Supabase Storage runbook. |

## Technology stack

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS v4, Motion, Recharts, Vitest.
- Backend: Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0 async, Alembic, asyncpg.
- Database: PostgreSQL 16-compatible; Supabase-compatible production target.
- Storage: local filesystem adapter for development/single-node durable disk; Supabase Storage adapter for managed production.
- Email: Resend production adapter and console/file outbox for local development.
- Security/ops: Argon2id, HS256 JWTs, Fernet credential vault, Cloudflare Turnstile, Sentry scrubbers, secret scan, npm/pip audits.

## Security summary

- Passwords are hashed with Argon2id.
- Access and refresh cookies are HttpOnly; refresh tokens rotate and reuse detection revokes token families.
- Mutating cookie-authenticated routes check Origin/Referer.
- Every user-owned resource is scoped by owner id; foreign ids return not found.
- AI provider keys are encrypted at rest and never returned after creation.
- Uploaded files are validated by size, type, magic bytes, and parser constraints.
- Document downloads use short-lived signed tokens and attachment disposition.
- Logs and Sentry scrub tokens, cookies, provider keys, raw SRS text, uploaded content, prompts, and responses.

## Results and capabilities

The completed repository demonstrates a working full-stack requirements-quality platform with authentication, document ingestion, deterministic ambiguity analysis, scoring, saved reports, dashboard analytics, optional AI enrichment, privacy lifecycle controls, production deployment documentation, and a comprehensive automated verification gate.

## Limitations

- Detector output is heuristic and may produce false positives or miss ambiguity that requires domain semantics.
- No OCR for scanned/image-only PDFs.
- English-first analysis; multilingual analysis is future scope.
- Rate limiting is process-local for v1 production; shared/distributed limiter storage remains future hardening.
- Live external services such as Supabase, Turnstile, Resend, Sentry, and AI providers require operator validation with real credentials.
- Browser screenshots could not be captured in this sandbox because no browser automation/runtime was available.

## Future scope

- Team workspaces and shared analyses.
- DOCX/PDF export of reports.
- CLI or batch API for CI pipelines.
- Multilingual analysis.
- More advanced NLP and configurable detector packs.
- Additional AI providers if requested.
- Shared/distributed rate limiting for horizontal production scaling.
