#!/usr/bin/env bash

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
README="${PROJECT_ROOT}/README.md"
FRONTEND_PACKAGE="${PROJECT_ROOT}/frontend/package.json"
ROOT_PACKAGE="${PROJECT_ROOT}/package.json"
CONFIG="${PROJECT_ROOT}/scripts/config.sh"
WORKFLOW="${PROJECT_ROOT}/.github/workflows/build-and-push.yml"

drift=0
environment=0

drift_error() {
  printf 'DRIFT: %s (expected %s)\n' "$1" "$2" >&2
  drift=1
}

environment_error() {
  printf 'ENVIRONMENT: %s\n' "$1" >&2
  environment=1
}

require_file() {
  if [[ ! -f "$1" ]]; then
    drift_error "missing file $1" "repository runtime contract"
  fi
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    environment_error "required command '$1' is unavailable"
  fi
}

require_file "$README"
require_file "$FRONTEND_PACKAGE"
require_file "$ROOT_PACKAGE"
require_file "$CONFIG"
require_file "$WORKFLOW"

if [[ -f "$README" ]]; then
  grep -Fq 'cd frontend' "$README" && grep -Fq 'npm run dev' "$README" \
    || drift_error 'frontend development command' 'cd frontend && npm run dev'
  grep -Eq '\./scripts/release\.sh' "$README" \
    || drift_error 'production command' './scripts/release.sh'
  grep -Eq 'DENO_PORT.*3333' "$README" \
    || drift_error 'Deno port documentation' '3333'
fi

react_version="$(sed -n 's/.*"react": "\^\([^"]*\)".*/\1/p' "$FRONTEND_PACKAGE" | head -n 1)"
playwright_version="$(sed -n 's/.*"@playwright\/test": "\([^"]*\)".*/\1/p' "$ROOT_PACKAGE" | head -n 1)"
backend_port="$(sed -n 's/^BACKEND_PORT=.*:-\([0-9]*\).*/\1/p' "$CONFIG" | head -n 1)"
frontend_prod_port="$(sed -n 's/^FRONTEND_PROD_PORT=.*:-\([0-9]*\).*/\1/p' "$CONFIG" | head -n 1)"
deno_version="$(sed -n 's/^[[:space:]]*DENO_VERSION:[[:space:]]*\([0-9.]*\).*/\1/p' "$WORKFLOW" | head -n 1)"

[[ -n "$react_version" ]] && grep -Eq "React[[:space:]]*\|[[:space:]]*${react_version//./\\.}" "$README" \
  || drift_error 'React version documentation' "$react_version"
[[ -n "$playwright_version" ]] && grep -Eq "Playwright[[:space:]]*\|[^|]*${playwright_version//./\\.}" "$README" \
  || drift_error 'Playwright version documentation' "$playwright_version"
[[ -n "$backend_port" ]] && grep -Eq "DENO_PORT.*${backend_port}" "$README" \
  || drift_error 'backend port source' "$backend_port"
[[ -n "$frontend_prod_port" ]] && grep -Fq "${frontend_prod_port}:${frontend_prod_port}" "$README" \
  || drift_error 'frontend production port source' "$frontend_prod_port"
[[ -n "$deno_version" ]] && grep -Eq "Deno[[:space:]]*>=[[:space:]]*${deno_version//./\\.}" "$README" \
  || drift_error 'Deno version documentation' "$deno_version"

require_command grep
require_command sed

if (( drift != 0 )); then
  exit 1
fi
if (( environment != 0 )); then
  exit 2
fi
printf 'OK: runtime contract is consistent\n'
