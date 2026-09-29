# Story 6.6 ATDD Checklist

- [x] PR/push workflow runs CLI package/version checks without a publish step.
- [x] Packed `@lapdev/cli` executes through offline `npm exec` and reports version `1.0.0`.
- [x] Packed CLI starts the fixture runtime and passes localhost health check without Docker, Deno, or Rust.
- [x] npm publish is gated on `vX.Y.Z` tags and GitHub Release verification.
- [x] npm publish uses OIDC provenance and contains no npm token secret.
- [x] Published package version is checked against the tag and every runtime manifest entry.
