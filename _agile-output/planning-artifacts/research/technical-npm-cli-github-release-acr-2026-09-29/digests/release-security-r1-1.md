# Digest: npm and GitHub release mechanisms

## Findings

- npm package metadata supports a `bin` field for command entry points, a `files` field for controlling package contents, and `optionalDependencies` for platform-dependent dependencies. [4]
- npm Trusted Publishing uses OIDC from a configured GitHub Actions workflow instead of a long-lived npm token, and npm can generate provenance attestations for public packages published this way. [5]
- GitHub Releases are based on Git tags and support downloadable release assets; GitHub documents direct download URLs for release assets. [6]

## Relevance to decision

The release should separate the small npm CLI/manifest from larger platform runtime archives. The npm package can select a versioned, checksum-verified GitHub Release asset, while GitHub Actions publishes npm with OIDC and uploads platform artifacts to the tagged release.

## Sources

- [4] npm, “package.json”, accessed 2026-09-29: https://docs.npmjs.com/files/package.json/
- [5] npm, “Trusted publishing for npm packages”, accessed 2026-09-29: https://docs.npmjs.com/trusted-publishers/
- [6] GitHub, “About releases” and “Linking to releases”, accessed 2026-09-29: https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases and https://docs.github.com/en/repositories/releasing-projects-on-github/linking-to-releases
