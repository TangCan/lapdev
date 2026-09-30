# @lapdev/cli

Install the CLI from GitHub Release with Node.js 18+ and npm. No npm account,
Docker, Deno or Rust installation is required. The URL becomes available when
the matching Release is published:

```sh
npm install --global --prefix "$HOME/.local" \
  https://github.com/TangCan/lapdev/releases/download/v1.0.3/lapdev-cli-1.0.3.tgz
export PATH="$HOME/.local/bin:$PATH"
lapdev version
lapdev web --no-open
```

Runtime directories must contain a `manifest.json` (or legacy `runtime.json`) and a launcher under `bin/`.

On the first launch, the CLI downloads the matching version from
`TangCan/lapdev` GitHub Releases and verifies the archive size and SHA-256 before
extracting it. Subsequent launches use the local cache. Use `--offline` to require
an existing cache, or `--runtime-dir /path/to/runtime` for an explicit local runtime.

`lapdev doctor` checks the local runtime; run it after the first successful launch.
Supported prebuilt runtimes: Linux x64 and macOS arm64. Git and language servers
remain optional tools required by their respective IDE features.

Downloads display progress and retry transient failures up to twice. Integrity
failures and untrusted redirects stop immediately. A runtime transfer has a
five-minute limit per attempt; manifests have a 30-second limit.

For proxy downloads, Node.js 24.14+ automatically uses `https_proxy`/`HTTPS_PROXY`,
`http_proxy`/`HTTP_PROXY` and the native `NO_PROXY` rules. Proxy credentials are
never printed. Older Node versions can still use a local `--runtime-dir`.

Release assets include `runtime-manifest.json` and `SHA256SUMS` covering the CLI,
runtime archives and manifest. See the repository's `docs/release-installation.md`
for checksum verification and offline installation. npm registry publication is
an optional channel, not required for this installation method.
