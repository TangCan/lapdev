# @lapdev/cli

Use a pinned Lapdev runtime without installing Docker, Deno or Rust:

```sh
npx @lapdev/cli@1.0.0 version
npx @lapdev/cli@1.0.0 doctor
npx @lapdev/cli@1.0.0 web --no-open --runtime-dir /path/to/runtime
```

Runtime directories must contain a `manifest.json` (or legacy `runtime.json`) and a launcher under `bin/`.
