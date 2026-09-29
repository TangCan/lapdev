#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${1:-linux-x64}"
VERSION="$(node -p "require('${PROJECT_ROOT}/package.json').version")"
OUT_ROOT="${RUNTIME_OUTPUT_DIR:-${PROJECT_ROOT}/_agile-output/runtime-archives}"
STAGE="$(mktemp -d "${TMPDIR:-/tmp}/lapdev-runtime.XXXXXX")"
trap 'rm -rf "${STAGE}"' EXIT

case "$TARGET" in
  linux-x64) RUST_TARGET="x86_64-unknown-linux-gnu"; PLATFORM=linux; ARCH=x64; LIB="liblapdev_core.so" ;;
  darwin-arm64) RUST_TARGET="aarch64-apple-darwin"; PLATFORM=darwin; ARCH=arm64; LIB="liblapdev_core.dylib" ;;
  *) echo "unsupported runtime target: $TARGET (expected linux-x64 or darwin-arm64)" >&2; exit 2 ;;
esac

mkdir -p "${STAGE}/bin" "${STAGE}/lib" "${STAGE}/app/backend" "${STAGE}/app/frontend" "${STAGE}/app/shared" "${STAGE}/LICENSES"

(cd "${PROJECT_ROOT}/frontend" && npm run build)
cargo build --manifest-path "${PROJECT_ROOT}/core/Cargo.toml" --release --target "$RUST_TARGET"

deno compile --no-check \
  --allow-read --allow-write --allow-net --allow-env --allow-run \
  --output "${STAGE}/bin/lapdev-server" "${PROJECT_ROOT}/backend/src/main.ts"

cp "${PROJECT_ROOT}/core/target/${RUST_TARGET}/release/${LIB}" "${STAGE}/lib/${LIB}"
cp -R "${PROJECT_ROOT}/frontend/dist" "${STAGE}/app/frontend/dist"
cp -R "${PROJECT_ROOT}/backend/." "${STAGE}/app/backend/"
rm -rf "${STAGE}/app/backend/tests" "${STAGE}/app/backend/cert" "${STAGE}/app/backend/node_modules" "${STAGE}/app/backend/logs"
find "${STAGE}/app/backend" -type f -name '*.test.ts' -delete
find "${STAGE}" -type f \( -name '.env' -o -name '.env.*' \) -delete
printf '%s\n' 'Runtime-shared files are assembled from the repository release inputs.' > "${STAGE}/app/shared/README.txt"
for license in "${PROJECT_ROOT}"/LICENSE*; do
  [ -f "$license" ] && cp "$license" "${STAGE}/LICENSES/"
done

cat > "${STAGE}/bin/lapdev-runtime" <<'LAUNCHER'
#!/usr/bin/env bash
set -euo pipefail
RUNTIME_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export LAPDEV_RUNTIME_ROOT="$RUNTIME_ROOT"
exec "$RUNTIME_ROOT/bin/lapdev-server" "$@"
LAUNCHER
chmod +x "${STAGE}/bin/lapdev-runtime" "${STAGE}/bin/lapdev-server"

cat > "${STAGE}/manifest.json" <<MANIFEST
{
  "version": "${VERSION}",
  "platform": "${PLATFORM}",
  "arch": "${ARCH}",
  "target": "${RUST_TARGET}",
  "asset": "runtime-${TARGET}.tar.gz",
  "size": "0",
  "sha256": "0000000000000000000000000000000000000000000000000000000000000000",
  "commit": "$(git -C "${PROJECT_ROOT}" rev-parse HEAD)",
  "launcher": "bin/lapdev-runtime"
}
MANIFEST

mkdir -p "${OUT_ROOT}"
ARCHIVE="${OUT_ROOT}/lapdev-runtime-${VERSION}-${TARGET}.tar.gz"
tar -C "${STAGE}" --sort=name --mtime='UTC 1970-01-01' --owner=0 --group=0 --numeric-owner -czf "$ARCHIVE" .
printf 'runtime archive: %s\n' "$ARCHIVE"
printf 'target: %s (%s)\n' "$TARGET" "$RUST_TARGET"
