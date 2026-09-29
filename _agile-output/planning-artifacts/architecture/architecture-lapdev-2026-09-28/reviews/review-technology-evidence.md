# Architecture reviewer: technology evidence

## Verdict

PASS with deferred operational checks.

## Findings

- AD-8 and AD-11 are grounded in the completed technical research: DeepSeek Harness documents an npm `npx` entry point and source-install path; npm documents `bin` and Trusted Publishing; GitHub documents tag-based Release assets.
- AD-10 is grounded in Deno FFI documentation and correctly treats Rust dynamic libraries as real files rather than assuming they are embedded automatically.
- AD-12 is consistent with Cargo target configuration and Deno compile target support; the first-wave platform scope is explicitly bounded rather than presented as universal support.
- Existing React/Vite/Deno/Rust versions remain reality-checked against the brownfield spine and are not silently upgraded by this update.

## Required follow-up

No blocker for the first Linux x64/macOS arm64 slice. Before broad release, verify GitHub Release reachability, Windows support, signing/attestation, and the actual Rust system-library baseline in CI.
