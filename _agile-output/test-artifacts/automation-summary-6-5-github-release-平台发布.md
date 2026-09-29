---
storyKey: "6-5-github-release-平台发布"
detectedStack: fullstack
---

# Test Automation Summary — Story 6.5

- Focused: workflow gate and checksum manifest tests passed; generator/verifier executed against temporary archives.
- Regression: full `npm test` passed — frontend 684, backend 45, unit 166, API 4, E2E 174 passed and 41 skipped; one existing E2E flaky passed on retry.
- Release policy: no `--clobber`; release publication only on `v*.*.*` tags with scoped write permission.
- Deferred: npm Trusted Publishing and clean-user end-to-end install remain Story 6.6.
