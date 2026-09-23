#!/usr/bin/env bash
# Stage-completion verification gate (see docs/DEVELOPMENT_RULES.md §5).
#   ./scripts/verify.sh         full gate (lint, typecheck, tests, production builds)
#   ./scripts/verify.sh --fast  lint + typecheck + unit tests (no production build)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FAST=0
if [[ "${1:-}" == "--fast" ]]; then FAST=1; fi

pass() { echo "  ✅ $1"; }
fail() { echo "  ❌ $1"; exit 1; }
section() { echo; echo "▶ $1"; }

cd "$ROOT"

section "Backend: ruff lint + format check"
cd backend
ruff check app tests || fail "ruff check failed"
ruff format --check app tests || fail "ruff format check failed"
pass "ruff clean"

section "Backend: mypy"
mypy app || fail "mypy failed"
pass "mypy clean"

section "Backend: pytest"
python -m pytest -q || fail "pytest failed"
pass "pytest green"

section "Backend: import + OpenAPI sanity"
python -c "from app.main import app; routes=sorted({r.path for r in app.routes}); assert '/api/v1/health/live' in routes, routes; print('routes:', routes)"
pass "FastAPI app imports; health route mounted"

cd "$ROOT"

section "Frontend: eslint"
cd frontend
npm run lint --silent || fail "eslint failed"
pass "eslint clean"

section "Frontend: typecheck"
npm run typecheck --silent || fail "tsc failed"
pass "tsc clean"

section "Frontend: unit tests"
npm test --silent || fail "vitest failed"
pass "vitest green"

section "Frontend: prettier"
npm run format --silent || fail "prettier check failed (run: npm run format:write)"
pass "prettier clean"

if [[ "$FAST" == "0" ]]; then
  section "Frontend: production build"
  npm run build --silent || fail "next build failed"
  pass "next build green"
else
  echo "  ⏭  skipped production build (--fast)"
fi

cd "$ROOT"
echo
echo "🎉 verify.sh: ALL CHECKS PASSED"
