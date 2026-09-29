# Digest: implementation feasibility and constraints

## Findings

- Deno FFI loads native libraries through the operating system dynamic loader. The official FFI documentation states that a dynamic library is not automatically embedded by `deno compile`; it must be explicitly included, and the application must resolve it as a real file. [7]
- Deno's compile/bundle path has limits for non-statically analyzable dynamic imports and workers. A release builder must explicitly include assets that are not reachable through static analysis. [8]
- Cargo supports explicit target triples and `CARGO_BUILD_TARGET`, so Rust artifacts can be built per release target, but the Lapdev release must define and test a target matrix rather than assume host compatibility. [9]
- npm's `bin` and `files` fields are sufficient to build a thin CLI package; `optionalDependencies` can model platform packages, but the application must handle missing optional dependencies. [10]

## Relevance to decision

The safest first release is not a single enormous npm tarball. Use a small CLI package with a versioned runtime manifest, and distribute platform runtime archives through GitHub Releases. Keep the runtime layout explicit so Deno FFI can find the Rust library on disk.

## Sources

- [7] Deno, “Foreign Function Interface”, accessed 2026-09-29: https://docs.deno.com/runtime/fundamentals/ffi/
- [8] Deno, “deno compile”, accessed 2026-09-29: https://docs.deno.com/runtime/reference/cli/compile/
- [9] Rust, “Cargo configuration” and “cargo build”, accessed 2026-09-29: https://doc.rust-lang.org/cargo/reference/config.html and https://doc.rust-lang.org/cargo/commands/cargo-build.html
- [10] npm, “package.json”, accessed 2026-09-29: https://docs.npmjs.com/files/package.json/
