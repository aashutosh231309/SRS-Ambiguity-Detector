# Development Rules (mandatory for every agent, every stage)

> Read this file FIRST (after `STAGE_STATUS.md`) before touching any code. Violation of
> these rules is a failed stage, even if the feature "works".

## 1. Session startup protocol

1. Inspect the repo: `git status`, `git log --oneline -10`, full tree listing.
2. Read in order: `STAGE_STATUS.md` → `FUTURE_ROADMAP.md` (your stage's entry/exit) →
   `PROJECT_SPEC.md` → `ARCHITECTURE.md` → the spec(s) your stage touches
   (`API_CONTRACT.md`, `DATABASE_SCHEMA.md`, `SECURITY_SPEC.md`, `AI_PROVIDER_SPEC.md`,
   `UI_UX_SPEC.md`, `SEO_SPEC.md`) → `CHANGELOG.md` (recent amendments).
3. Identify: current architecture, what exists, what your stage owns, what it must NOT
   touch, and what future stages depend on from you.
4. Implement ONLY the requested stage. Resist scope creep — note adjacent ideas in
   `FUTURE_ROADMAP.md` "Parking lot" instead.

## 2. Absolute prohibitions

- NEVER create `part1/`, `stage1/`, `version2/`, `*_new/`, `*_old/`, `*.bak`, or any
  parallel/temporary architecture. All stages modify the SAME canonical tree.
- NEVER blindly overwrite files — read before editing; preserve behavior you don't own.
- NEVER duplicate existing functionality (second API client, second auth helper, second
  button system). Extend the canonical one.
- NEVER rename routes / tables / columns / env vars / contracts without an ADR +
  CHANGELOG entry + migration path.
- NEVER remove baseline features (§PROJECT_SPEC immutable list) to make new work easier.
- NEVER ship fake buttons, dead links, `TODO`-as-a-feature, or placeholder lorem in UI.
- NEVER hardcode secrets; NEVER commit real keys/tokens; NEVER put real-looking secrets
  in `.env.example` (use `changeme-…` placeholders).
- NEVER `git push --force`, NEVER commit to `main` directly from a stage branch, NEVER
  commit `.env`, `node_modules/`, `__pycache__/`, `.venv/`, or `dist/`.
- NEVER present the heuristic score as a validated industry metric (UI copy + docs).
- NEVER add a dependency the current stage does not import and exercise. No AI SDKs,
  CAPTCHA packages, document parsers, monitoring SDKs, or chart libraries "for later" —
  each lands in the stage that first uses it (recharts: Stage 13/15).
- NEVER ship generic AI-template UI. Every screen must satisfy `UI_UX_SPEC.md`: «The UI
  must not look like a generic AI-generated SaaS dashboard.» No fake buttons, no lorem,
  no decorative chart junk, no unexplained numbers.

## 3. Code standards

**Frontend (`frontend/`):**
- TypeScript `strict`, no `any` without justification comment; ESLint clean; Prettier formatted.
- All API calls via `src/lib/api.ts` (typed, envelope-aware). No raw `fetch` to the API.
- No secrets in `NEXT_PUBLIC_*`; no tokens in storage; React-escaped rendering of all
  untrusted text (requirement text, AI output, filenames).
- Components: accessible (labels, focus, `aria-*` where needed), responsive (390/768/1280
  considered), motion via shared tokens only.

**Backend (`backend/`):**
- `ruff check` + `ruff format --check` clean; `mypy` clean on `app/` (config in `pyproject.toml`).
- Settings ONLY via `app/core/config.py`; logging ONLY via configured logger (redacting);
  no `print()`; no f-string SQL; Pydantic schemas validate every input/output boundary.
- Routers: thin (auth → validate → service → response). Services: no FastAPI imports.
  Engine (`analysis/`): pure, deterministic, zero network.
- Every `{id}` route: ownership check + 404-on-foreign (IDOR) + test.

**Database:** Alembic revision per change, with downgrade + data plan; `owner_id` everywhere
user-owned; never trust client IDs.

## 4. Definition of Done (every stage)

- [ ] Requested scope implemented; NOTHING else half-built (or explicitly marked experimental + fenced).
- [ ] Existing functionality still works (run `scripts/verify.sh`: frontend lint + typecheck + build; backend lint + typecheck + tests).
- [ ] API changes reflected in `API_CONTRACT.md`; DB changes in `DATABASE_SCHEMA.md` + migration; env changes in BOTH `.env.example` files.
- [ ] Security checklist (`SECURITY_SPEC.md` §11) completed for auth/data/crypto/upload/AI changes.
- [ ] Docs updated: `STAGE_STATUS.md` (what/where/decisions/tests/limits/next), `CHANGELOG.md` (contract-relevant changes), specs touched by the stage.
- [ ] `screenshots/` updated when UI changed (naming: `stageNN-short-desc--viewportWxH.png`).
- [ ] No secrets committed (`git status` + diff review for `.env`, keys, tokens).
- [ ] App runs from a clean checkout following `README.md` quickstart (verify at least the paths your stage affects).

## 5. Verification commands

```bash
./scripts/verify.sh            # full gate: install-check, lint, typecheck, tests, builds
./scripts/verify.sh --fast     # lint + typecheck + unit tests (no production build)
cd frontend && npm run dev     # web on :3000 (NEXT_PUBLIC_API_URL → backend)
cd backend && uvicorn app.main:app --reload --port 8000   # api on :8000
```

## 6. Edit discipline (learned 2026-09-23 — binding)

- NEVER issue parallel edits against the SAME file: concurrent same-file edits have
  been observed to silently clobber each other (only one survives). Batch parallel
  edits ONLY across different files.
- After every same-file edit sequence, grep-verify each change landed before running
  the verification gate — a green `git status` means nothing if an edit was lost.

## 7. Handoff discipline

End every stage with `STAGE_STATUS.md` updated: completed work, files created/modified,
architectural decisions, env vars added, DB/API changes, tests performed + results,
known limitations, next stage + what it needs from you, compatibility notes.
The next agent has NO memory of you — the repo must speak for itself.
