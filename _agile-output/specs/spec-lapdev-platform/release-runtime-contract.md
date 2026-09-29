# Release Runtime Contract

This companion defines the load-bearing contract for CAP-6. It is intentionally independent of a specific CLI implementation.

## User entry points

```text
npx @lapdev/cli@<version> web
npx @lapdev/cli@<version> doctor
npx @lapdev/cli@<version> version
```

The source checkout remains a supported contributor path. The Docker/ACR path is optional and is not the primary release gate.

## Runtime asset identity

Each release is anchored by a protected Git tag `vX.Y.Z`. The CLI version, Release tag and runtime manifest version must match.

The manifest must identify:

- `version`
- `platform`
- `arch`
- `target`
- `asset`
- `size`
- `sha256`
- `commit`

The first supported targets are `linux-x64` and `darwin-arm64`. Additional platforms extend the same contract.

## Archive layout

```text
runtime/
  bin/lapdev-server
  lib/lapdev_core.so|dylib|dll
  app/frontend/dist/
  app/backend/
  app/shared/
  manifest.json
  LICENSES/
```

The Rust dynamic library is a real file loaded through the Deno FFI/operating-system loader. The backend resolves it relative to the runtime/module layout, not the current working directory or arbitrary workspace input.

## Install and launch sequence

1. CLI resolves `process.platform` and `process.arch` to one supported target.
2. CLI resolves the matching GitHub Release manifest for its own version.
3. CLI downloads to a temporary user-cache file.
4. CLI verifies size and SHA-256, then atomically installs a versioned cache directory.
5. CLI verifies the runtime layout and starts the server.
6. Server binds to `127.0.0.1` by default and reports its local URL.

`--offline` uses only an already verified cache. `--runtime-dir` is available for development and controlled testing.

## CI release contract

- Pull requests build, test and run health checks only.
- Protected `v*` tags build target archives, generate manifest/checksums and upload GitHub Release assets.
- The npm CLI is published through GitHub Actions OIDC Trusted Publishing.
- Release archives must not contain secrets, user workspace data or browser-persisted credentials.
- Signature/attestation verification is a follow-up hardening requirement after checksum-based MVP validation.
