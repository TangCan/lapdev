#!/usr/bin/env bash
set -euo pipefail

ARCHIVE="${1:?usage: verify-runtime-archive.sh ARCHIVE [TARGET]}"
TARGET="${2:-linux-x64}"
[ -f "$ARCHIVE" ] || { echo "archive does not exist: $ARCHIVE" >&2; exit 2; }

LIST="$(tar -tzf "$ARCHIVE")"
for required in ./bin/lapdev-server ./bin/lapdev-runtime ./lib/ ./app/backend/ ./app/frontend/dist/ ./app/shared/ ./manifest.json ./LICENSES/; do
  grep -Fqx "$required" <<<"$LIST" || { echo "archive missing required path: $required" >&2; exit 1; }
done

for forbidden in './workspace' './tests/' './app/backend/tests/' './app/backend/cert/' '/logs/' '.test.ts' 'node_modules/' '.env'; do
  if grep -Fq "$forbidden" <<<"$LIST"; then
    echo "archive contains forbidden path: $forbidden" >&2
    exit 1
  fi
done

manifest="$(tar -xOzf "$ARCHIVE" ./manifest.json)"
grep -Fq "\"target\"" <<<"$manifest" || { echo "manifest has no target for $TARGET" >&2; exit 1; }
grep -Fq "\"version\"" <<<"$manifest" || { echo "manifest has no version" >&2; exit 1; }
printf 'runtime archive verified: %s (%s)\n' "$ARCHIVE" "$TARGET"
