# Digest: recommended release architecture

## Findings

- A thin npm package can expose a command through `bin`, restrict its tarball through `files`, and resolve platform-specific dependencies through optional dependency metadata. [10]
- GitHub Releases are intended to package deployable software iterations around Git tags and expose downloadable assets, making them suitable for runtime archives rather than a container registry. [6]
- npm Trusted Publishing can bind a specific GitHub Actions workflow to npm through OIDC, avoiding a long-lived publish token and supporting provenance for public packages. [5]
- Deno standalone compilation can remove the end-user Deno prerequisite, but the Rust FFI library and other real filesystem assets still need explicit per-platform packaging. [7][8]

## Recommended pattern

`npx @lapdev/cli@<version> web` downloads or loads a matching runtime archive from the GitHub Release for `<version>`, verifies a signed/checksummed manifest, caches it under a user cache directory, and starts the local service. The source checkout path remains available for contributors.

## Sources

- [5] npm Trusted Publishing: https://docs.npmjs.com/trusted-publishers/
- [6] GitHub Releases: https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases
- [7] Deno FFI: https://docs.deno.com/runtime/fundamentals/ffi/
- [8] Deno compile: https://docs.deno.com/runtime/reference/cli/compile/
- [10] npm package.json: https://docs.npmjs.com/files/package.json/
