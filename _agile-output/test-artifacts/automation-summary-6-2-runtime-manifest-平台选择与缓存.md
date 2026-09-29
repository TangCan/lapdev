---
storyKey: "6-2-runtime-manifest-平台选择与缓存"
detectedStack: fullstack
---

# Test Automation Summary — Story 6.2

- Focused level: Deno unit/integration-style subprocess tests.
- Coverage: matching platform and CLI version, missing/mismatched manifest identity, offline cache miss, local asset size/SHA-256 mismatch.
- Result: 10 passed, 0 failed when run with Story 6.1 tests.
- Regression: core `cargo clean && cargo fmt --all && cargo test --all` passed; full `npm test` passed with frontend 684, backend 45, unit 160, API 4 and E2E 173 passed/41 skipped; two existing E2E cases were flaky but passed on retry.
- Browser automation: not applicable; this story changes the Node CLI/runtime resolver and has no browser interaction.
- Deferred: archive construction/extraction and remote Release URL policy belong to Stories 6.3–6.5.
