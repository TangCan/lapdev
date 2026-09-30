# First npm release

This is an optional registry channel. The primary distribution is the CLI `.tgz`
hosted on GitHub Release; see [Release installation](release-installation.md).
Leave the GitHub repository variable `NPM_PUBLISH_ENABLED` unset (or `false`) to
publish and verify GitHub Releases without an npm account.

The first publication requires an npm account with permission to publish to
`@lapdev`. Trusted Publishing is configured after the package exists.

1. Publish and verify the matching GitHub Release first.
2. Download the CLI `.tgz` from that Release. Keep the original file; do not repack it.
3. Authenticate with `npm login`, then publish that artifact with
   `npm publish /path/to/lapdev-cli-1.0.3.tgz --access public`.
4. In the npm package settings, configure GitHub Trusted Publishing with owner
   `TangCan`, repository `lapdev`, workflow `runtime-release.yml`, and direct
   publishing enabled.
5. Set the GitHub repository variable `NPM_PUBLISH_ENABLED=true` only when
   Trusted Publishing is configured. Future version tags will publish to both
   channels. Do not move the already published bootstrap tag or rerun the
   immutable Release creation job just to publish to npm.

The workflow checks npm before publishing. An existing version is skipped only
when its registry SHA-512 integrity matches the downloaded CI package exactly.
Different bytes fail the job and require a new version. Registry errors other
than 404 fail closed. This permits the bootstrap package and subsequent tag to
use the same version without attempting to overwrite an immutable npm version.

The bootstrap publication reuses a verified Release package, so matching runtime
assets are already available when the package becomes public.

Reference: <https://docs.npmjs.com/cli/v11/commands/npm-trust/>
