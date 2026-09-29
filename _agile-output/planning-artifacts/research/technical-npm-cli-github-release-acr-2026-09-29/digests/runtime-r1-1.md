# Digest: Deno runtime packaging

## Findings

- Deno `compile` creates a standalone executable embedding the Deno runtime and program dependencies, so end users do not need a separate Deno installation. [2]
- Deno supports cross-compilation to Linux x64/ARM64, macOS x64/ARM64, and Windows x64; the target is selected with `--target`. [2]
- Deno compilation can include extra files and has a self-extracting mode for applications that need real filesystem paths or native code. The documentation warns that self-extracted files can be modified, so integrity and update handling remain application responsibilities. [2]
- Deno documents least-privilege permission flags and recommends granting only required access when deploying standalone binaries. [3]

## Relevance to decision

The first implementation can package a platform-specific launcher/runtime artifact instead of requiring users to install Deno. Rust native artifacts still need their own target build and compatibility matrix; Deno compilation does not remove that responsibility.

## Sources

- [2] Deno, “deno compile”, accessed 2026-09-29: https://docs.deno.com/runtime/reference/cli/compile/
- [3] Deno, “Deploying Deno projects”, accessed 2026-09-29: https://docs.deno.com/runtime/deploy/
