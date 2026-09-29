#!/usr/bin/env bash

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DENO_BIN="${DENO_BIN:-deno}"

if ! command -v "$DENO_BIN" >/dev/null 2>&1; then
  printf 'ENVIRONMENT: Deno executable is unavailable (%s)\n' "$DENO_BIN" >&2
  exit 2
fi

if "${SCRIPT_DIR}/validate-runtime-contract.sh"; then
  :
else
  status=$?
  if (( status == 2 )); then
    exit 2
  fi
  exit 1
fi

if ! bash -n "${SCRIPT_DIR}/entrypoint.sh"; then
  printf 'DRIFT: production entrypoint has shell syntax errors\n' >&2
  exit 1
fi

if grep -Eq '(^|[[:space:]])(-A|--allow-all)([[:space:]]|$)' "${SCRIPT_DIR}/entrypoint.sh"; then
  printf 'DRIFT: production entrypoint uses unrestricted Deno permissions\n' >&2
  exit 1
fi

if ! "$DENO_BIN" test --allow-read --allow-env "$PROJECT_ROOT/backend/src/security/deploymentProfile.test.ts" "$PROJECT_ROOT/tests/unit/deployment-permissions.test.ts"; then
  printf 'SECURITY: minimum-permission contract tests failed\n' >&2
  exit 1
fi

printf 'OK: release permission gate passed\n'
