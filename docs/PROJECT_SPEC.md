# SRS Ambiguity Detector — Project Specification

> **Status:** Canonical. This document restates the immutable product baseline.
> Any future stage that conflicts with this file must be resolved in favor of this file,
> unless the conflict is explicitly documented and approved as a contract amendment in
> `docs/CHANGELOG.md` + `docs/STAGE_STATUS.md`.

## 1. What this project is

A production-quality, web-based **SRS (Software Requirements Specification) Ambiguity Detector**:
a premium requirements-quality platform that analyzes software requirements text (pasted text or
uploaded SRS documents) and identifies potentially vague, unclear, incomplete, underspecified,
subjective, structurally ambiguous, non-measurable, or poorly defined requirements.

It explains **what** is ambiguous, **which phrase** caused it, **why** it was flagged,
**which category** it belongs to, **how severe** it is, and **how to improve** it.

## 2. Immutable baseline (MUST NOT be removed)

The final application MUST provide all of the following. Every later feature is an **addition**
to this baseline — never a replacement:

| # | Requirement | Implemented in (planned) |
|---|-------------|--------------------------|
| 1 | Requirement / SRS text input | Stage 08 |
| 2 | SRS document upload (PDF, DOCX, TXT) | Stage 09–10 |
| 3 | Ambiguity detection | Stage 06–07 |
| 4 | Ambiguity categories | Stage 06 |
| 5 | Explanation of detected ambiguity | Stage 06–07, UI Stage 13 |
| 6 | Suggested improvements for unclear requirements | Stage 06–07 (+ AI Stage 14 as-built: overview + rewrites via user providers) |
| 7 | Ambiguity score | Stage 06–07 |
| 8 | User authentication | Stage 04–05 |
| 9 | Database storage (PostgreSQL) | Stage 02–03 |
| 10 | Analysis history | Stage 12 |
| 11 | Dashboard with statistics/charts | Stage 14–15 |
| 12 | REST APIs | Stage 03, 07 (+ others) |

Final submission must include: complete source code, `README.md` with setup + project details,
and `screenshots/`.

## 3. Primary product purpose

Given requirement text such as:

> "The system should process requests quickly."

the system produces structured findings such as:

- **Category:** Vague Language
- **Detected phrase:** `"quickly"`
- **Explanation:** The requirement does not define an objective response-time threshold.
- **Suggested improvement:** "The system shall process requests within 2 seconds under the specified normal operating load."
- **Severity:** e.g. Medium, with a named detector/rule reference.

Thresholds and rules MUST be configurable through the analysis engine — never hardcoded
throughout the UI. See `docs/ARCHITECTURE.md` (analysis engine section).

## 4. Core analysis philosophy (non-negotiable)

The product MUST NOT be "send the requirement to an LLM and ask whether it is ambiguous."

Canonical pipeline:

```
SRS / Text
  → Input Validation
  → Document / Text Extraction
  → Requirement Segmentation
  → Deterministic NLP / Rule Engine      ← foundation, always runs
  → Ambiguity Detection
  → Severity + Category + Evidence
  → Scoring
  → Optional AI Enhancement              ← enhancement only, may be absent/fail
  → Unified Result
```

**The application MUST remain fully functional without an AI provider / API key.**
AI is an enhancement layer, not a mandatory dependency.

## 5. Ambiguity categories (initial set)

The engine MUST support at least these detectors (extensible without rewriting the engine):

1. Vague quantifiers (`some`, `many`, `few`, `several`, `various`, …)
2. Subjective / vague terminology (`fast`, `quickly`, `easy`, `user-friendly`, `robust`, …)
3. Missing measurable criteria
4. Undefined terminology
5. Pronoun / reference ambiguity
6. Optional / uncertain language (`may`, `might`, `could`, `if possible`, `as needed`, …)
7. Ambiguous conjunctions / operators (`and/or`, `etc.`, `and so on`, …)
8. Absolute language (`always`, `never`, `all`, `every`, `completely`, `instant`, …)
9. Passive voice / unclear actor
10. Missing conditions
11. Missing constraints
12. Missing actor / responsibility
13. Incomplete requirements

Each detector MUST emit: category, matched phrase + offsets, severity, human reason,
rule/detector id, and a recommendation. See `docs/API_CONTRACT.md` (result schema).

## 6. Ambiguity scoring (transparent heuristic)

- The score is **application-generated and heuristic**, NOT a scientifically validated
  universal industry metric. The UI MUST NOT present it as one.
- Initial model: base 100; Low −5, Medium −10, High −15, Critical −20; clamp 0–100.
- Bands: 80–100 Low ambiguity · 60–79 Moderate · 40–59 High · 0–39 Very high.
- The model MUST remain explainable and deterministic, and results MUST expose
  contributing factors (per-issue deductions), not just one number.

## 7. Scope boundaries

**In scope (per master prompt):** auth + email verification, document pipeline, deterministic
engine, scoring, history, dashboard, settings, user-owned AI providers with encrypted keys,
security hardening, rate limiting + CAPTCHA, privacy lifecycle, monitoring, performance, SEO,
responsive + accessible UI, deployment, docs/screenshots.

**Explicitly out of scope:** Google Sign-In / OAuth (keep auth model extensible for a future
identity provider without a DB redesign); any guarantee of search rankings.

## 8. Quality bar

Strong engineering · reliable deterministic analysis · optional AI enhancement ·
secure user-owned API keys · professional auth · secure document processing ·
useful analytics · excellent visualization · premium responsive UI/UX ·
distinctive motion design · accessibility · performance · SEO · privacy ·
production-quality documentation.

Guiding principle: **build a genuinely useful product first, then make it beautiful —
never a beautiful interface that compromises the product.**
