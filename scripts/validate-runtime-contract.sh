#!/usr/bin/env bash

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
README="${PROJECT_ROOT}/README.md"
FRONTEND_PACKAGE="${PROJECT_ROOT}/frontend/package.json"
ROOT_PACKAGE="${PROJECT_ROOT}/package.json"
CONFIG="${PROJECT_ROOT}/scripts/config.sh"
WORKFLOW="${PROJECT_ROOT}/.github/workflows/build-and-push.yml"
ARCHITECTURE_DOC="${PROJECT_ROOT}/docs/architecture.md"
BACKEND_CONFIG="${PROJECT_ROOT}/backend/src/config/index.ts"

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

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    environment_error "required command '$1' is unavailable"
  fi
}

for command_name in grep sed head; do
  require_command "$command_name"
done

if (( environment != 0 )); then
  exit 2
fi

require_file() {
  if [[ ! -f "$1" ]]; then
    drift_error "missing file $1" "repository runtime contract"
  fi
}

for file in "$README" "$FRONTEND_PACKAGE" "$ROOT_PACKAGE" "$CONFIG" "$WORKFLOW" "$ARCHITECTURE_DOC" "$BACKEND_CONFIG"; do
  require_file "$file"
done

if (( drift != 0 )); then
  exit 1
fi

grep -Fq 'cd frontend' "$README" && grep -Fq 'npm run dev' "$README" \
  || drift_error 'frontend development command' 'cd frontend && npm run dev'
grep -Eq '"dev"[[:space:]]*:' "$FRONTEND_PACKAGE" \
  || drift_error 'frontend dev script' 'frontend/package.json scripts.dev'
grep -Fq './scripts/release.sh' "$README" \
  || drift_error 'production command' './scripts/release.sh'
[[ -x "${PROJECT_ROOT}/scripts/release.sh" ]] \
  || drift_error 'production script' 'executable scripts/release.sh'

react_version="$(sed -n 's/.*"react": "\^\([^"]*\)".*/\1/p' "$FRONTEND_PACKAGE" | head -n 1)"
playwright_version="$(sed -n 's/.*"@playwright\/test": "\([^"]*\)".*/\1/p' "$ROOT_PACKAGE" | head -n 1)"
backend_port="$(sed -n 's/^BACKEND_PORT=.*:-\([0-9]*\).*/\1/p' "$CONFIG" | head -n 1)"
frontend_port="$(sed -n 's/^FRONTEND_PORT=.*:-\([0-9]*\).*/\1/p' "$CONFIG" | head -n 1)"
frontend_prod_port="$(sed -n 's/^FRONTEND_PROD_PORT=.*:-\([0-9]*\).*/\1/p' "$CONFIG" | head -n 1)"
container_port="$(sed -n 's/^CONTAINER_PORT=.*:-\([0-9]*\).*/\1/p' "$CONFIG" | head -n 1)"
host_backend_port="$(sed -n 's/^HOST_BACKEND_PORT=.*:-\([0-9]*\).*/\1/p' "$CONFIG" | head -n 1)"
deno_version="$(sed -n 's/^[[:space:]]*DENO_VERSION:[[:space:]]*\([0-9.]*\).*/\1/p' "$WORKFLOW" | head -n 1)"
backend_default_port="$(sed -n "s/.*Deno.env.get('PORT') || '\([0-9]*\)'.*/\1/p" "$BACKEND_CONFIG" | head -n 1)"
frontend_default_port="$(sed -n "s/.*Deno.env.get('FRONTEND_PORT') || '\([0-9]*\)'.*/\1/p" "$BACKEND_CONFIG" | head -n 1)"

[[ -n "$react_version" ]] && grep -Eq "React[[:space:]]*\|[[:space:]]*${react_version//./\\.}" "$README" \
  || drift_error 'React version documentation' "$react_version"
[[ -n "$playwright_version" ]] && grep -Eq "Playwright[[:space:]]*\|[^|]*${playwright_version//./\\.}" "$README" \
  || drift_error 'Playwright version documentation' "$playwright_version"
[[ -n "$playwright_version" ]] && grep -Eq "Playwright[[:space:]]*\\|[^|]*${playwright_version//./\\.}" "$ARCHITECTURE_DOC" \
  || drift_error 'architecture Playwright version documentation' "$playwright_version"
[[ -n "$backend_port" ]] && grep -Eq "DENO_PORT.*${backend_port}" "$README" \
  || drift_error 'backend port documentation' "$backend_port"
[[ -n "$frontend_port" ]] && grep -Eq "localhost:${frontend_port}" "$README" \
  || drift_error 'frontend development port documentation' "$frontend_port"
[[ -n "$frontend_prod_port" ]] && grep -Fq "${frontend_prod_port}:${frontend_prod_port}" "$README" \
  || drift_error 'frontend production port documentation' "$frontend_prod_port"
[[ -n "$host_backend_port" && -n "$container_port" ]] && grep -Fq "${host_backend_port}:${container_port}" "$README" \
  || drift_error 'backend container port mapping' "${host_backend_port}:${container_port}"
[[ -n "$deno_version" ]] && grep -Eq "Deno[[:space:]]*>=[[:space:]]*${deno_version//./\\.}" "$README" \
  || drift_error 'Deno version documentation' "$deno_version"
[[ -n "$backend_port" ]] && grep -Eq "localhost:${backend_port}/health" "$WORKFLOW" \
  || drift_error 'CI health-check port' "$backend_port"
[[ -n "$backend_port" && "$backend_port" == "$backend_default_port" ]] \
  || drift_error 'backend runtime default port' "$backend_port"
[[ -n "$frontend_port" && "$frontend_port" == "$frontend_default_port" ]] \
  || drift_error 'frontend runtime default port' "$frontend_port"
[[ -n "$host_backend_port" && -n "$container_port" ]] && grep -Eq -- "-p[[:space:]]+${host_backend_port}:${container_port}" "$WORKFLOW" \
  || drift_error 'CI container port mapping' "${host_backend_port}:${container_port}"

if (( drift != 0 )); then
  exit 1
fi
printf 'OK: runtime contract is consistent\n'
