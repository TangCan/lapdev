---
storyId: "6.5"
storyKey: "6-5-github-release-平台发布"
status: "done"
baseline_commit: "d35103e"
context:
  - "_agile-output/implementation-artifacts/epic-6-context.md"
  - "_agile-output/planning-artifacts/architecture/architecture-lapdev-2026-09-28/ARCHITECTURE-SPINE.md"
  - "_agile-output/specs/spec-lapdev-platform/release-runtime-contract.md"
  - "AGENTS.md"
source: "_agile-output/planning-artifacts/epics.md"
---

# Story 6.5: GitHub Release 平台发布

As a release maintainer,
I want protected version tags to publish verified platform runtime assets,
So that users and the npm CLI can retrieve one traceable runtime for each supported target.

**Requirements:** FR6, NFR8, NFR10, NFR11, NFR12

## Acceptance Criteria

- PR and ordinary branch push jobs build/verify runtime assets without publishing a Release.
- Protected `vX.Y.Z` tags build Linux x64 and macOS arm64, then publish archives, one multi-target manifest, SHA256SUMS and license metadata.
- Existing same-tag assets are never silently replaced; upload failure blocks misleading completion.
- A post-publish verification job downloads the declared assets and recomputes size/SHA-256.

## Implementation Notes

- `.github/workflows/runtime-release.yml` uses platform-native runners and `contents: write` only on the release job.
- `scripts/generate-runtime-release-manifest.mjs` finalizes post-archive checksum identity; `scripts/verify-runtime-release.mjs` verifies it.
- The Docker/ACR workflow remains outside this release success path.

## Acceptance Verification

- Workflow and release-script focused tests: 17 focused tests across Stories 6.1–6.5 passed.
- Manifest generator and verifier ran against two temporary archives successfully.
- Full regression: frontend 684, backend 45, unit 166, API 4, E2E 174 passed; 41 skipped; one existing E2E flaky passed on retry.

## Review Triage Log

- 手工审查确认普通 push/PR 不进入 publish job，tag 才授予 `contents: write`。
- Release upload 不使用 `--clobber`，已有同名 immutable asset 会失败；verification job 重新计算归档 size/SHA-256。
- 当前 Codex 环境无 subagent 能力；未伪造并行 review，workflow 静态测试、脚本实际测试和完整回归已通过。
