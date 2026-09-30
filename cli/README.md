# @lapdev/cli

Use a pinned Lapdev runtime without installing Docker, Deno or Rust:

```sh
npx @lapdev/cli@1.0.0 version
npx @lapdev/cli@1.0.0 doctor
npx @lapdev/cli@1.0.0 web --no-open
```

Runtime directories must contain a `manifest.json` (or legacy `runtime.json`) and a launcher under `bin/`.

On the first launch, the CLI downloads the matching version from
`TangCan/lapdev` GitHub Releases and verifies the archive size and SHA-256 before
extracting it. Subsequent launches use the local cache. Use `--offline` to require
an existing cache, or `--runtime-dir /path/to/runtime` for an explicit local runtime.
