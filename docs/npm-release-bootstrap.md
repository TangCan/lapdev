# First npm release

The first publication requires an npm account with permission to publish to
`@lapdev`. Trusted Publishing is configured after the package exists.

1. Finish verification of the CLI's automatic GitHub Release download flow.
2. Download the `npm-cli` artifact from the successful Runtime Release run for
   the exact commit being released. Keep the original `.tgz`; do not repack it.
3. Authenticate with `npm login`, then publish that artifact with
   `npm publish /path/to/lapdev-cli-1.0.0.tgz --access public`.
4. In the npm package settings, configure GitHub Trusted Publishing with owner
   `TangCan`, repository `lapdev`, workflow `runtime-release.yml`, and direct
   publishing enabled.
5. Create the matching version tag on the verified commit and inspect all release
   jobs, including the public runtime manifest and archive verification.

The workflow checks npm before publishing. An existing version is skipped only
when its registry SHA-512 integrity matches the downloaded CI package exactly.
Different bytes fail the job and require a new version. Registry errors other
than 404 fail closed. This permits the bootstrap package and subsequent tag to
use the same version without attempting to overwrite an immutable npm version.

Publishing the bootstrap package makes it public before runtime release assets
are available. Coordinate the tag immediately afterwards; avoid announcing the
package until the release verification succeeds.

Reference: <https://docs.npmjs.com/cli/v11/commands/npm-trust/>
