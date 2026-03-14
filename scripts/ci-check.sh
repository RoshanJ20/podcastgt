#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────
# Local CI check — mirrors .github/workflows/ci.yml
# Run before pushing to catch lint, type, and build errors.
#
# Usage:
#   ./scripts/ci-check.sh          # run all checks
#   ./scripts/ci-check.sh lint     # lint only
#   ./scripts/ci-check.sh types    # type-check only
#   ./scripts/ci-check.sh build    # build only
# ──────────────────────────────────────────────────────────
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

step=0
total=3
failures=0
failed_steps=()

header() {
  step=$((step + 1))
  echo ""
  echo -e "${BLUE}[$step/$total]${NC} ${YELLOW}$1${NC}"
  echo "────────────────────────────────────────"
}

pass() {
  echo -e "${GREEN}✓ $1 passed${NC}"
}

fail() {
  echo -e "${RED}✗ $1 failed${NC}"
  failures=$((failures + 1))
  failed_steps+=("$1")
}

run_lint() {
  header "ESLint"
  if npm run lint 2>&1; then
    pass "Lint"
  else
    fail "Lint"
  fi
}

run_types() {
  header "TypeScript type-check"
  if npx tsc --noEmit 2>&1; then
    pass "Type-check"
  else
    fail "Type-check"
  fi
}

run_build() {
  header "Next.js build"
  # Use dummy env vars like CI does
  export NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://placeholder.supabase.co}"
  export NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-placeholder-anon-key}"
  export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
  if npm run build 2>&1; then
    pass "Build"
  else
    fail "Build"
  fi
}

# ── Main ──────────────────────────────────────────────────
echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Local CI Check (mirrors GH)      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"

target="${1:-all}"

case "$target" in
  lint)
    total=1
    run_lint
    ;;
  types)
    total=1
    run_types
    ;;
  build)
    total=1
    run_build
    ;;
  all|*)
    run_lint
    run_types
    run_build
    ;;
esac

# ── Summary ───────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════"
if [ "$failures" -eq 0 ]; then
  echo -e "${GREEN}All checks passed ✓${NC}"
  exit 0
else
  echo -e "${RED}$failures check(s) failed:${NC}"
  for s in "${failed_steps[@]}"; do
    echo -e "  ${RED}✗ $s${NC}"
  done
  exit 1
fi
