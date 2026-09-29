# Architecture reviewer: adversarial seams

## Verdict

PASS; the new release seams are explicit and mutually constrained.

## Pair checks

- CLI vs runtime builder: AD-9 forces both to use the same version/platform/architecture manifest, preventing a CLI from selecting an unadvertised archive.
- Deno backend vs Rust library: AD-10 forces a stable archive layout and module-relative resolution, preventing current-working-directory and host-ABI drift.
- Git tag workflow vs npm publication: AD-11 makes the protected tag the authority and keeps pull requests from publishing, preventing independently versioned delivery channels.
- Runtime cache vs workspace/security policy: AD-13 keeps cache and assets outside the workspace, preserves localhost default, and leaves remote-shared authorization under the inherited AD-6 boundary.
- Platform matrix vs health gate: AD-12 requires target-specific builds and smoke tests, preventing a host-only green build from becoming a false compatibility claim.

## Residual risks

- SHA-256 protects accidental corruption but is weaker than signed provenance against a compromised release path; signing/attestation remains an explicit pre-broad-release question.
- A second implementation could invent a mirror or offline cache policy because reachability is deferred; any mirror must preserve AD-9 manifest identity and checksum semantics.
