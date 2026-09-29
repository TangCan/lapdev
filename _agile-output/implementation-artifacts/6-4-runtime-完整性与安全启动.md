---
storyId: "6.4"
storyKey: "6-4-runtime-完整性与安全启动"
status: "in-review"
baseline_commit: "c25fb01"
context:
  - "_agile-output/implementation-artifacts/epic-6-context.md"
  - "_agile-output/planning-artifacts/architecture/architecture-lapdev-2026-09-28/ARCHITECTURE-SPINE.md"
  - "_agile-output/specs/spec-lapdev-platform/release-runtime-contract.md"
  - "AGENTS.md"
source: "_agile-output/planning-artifacts/epics.md"
---

# Story 6.4: Runtime 完整性与安全启动

As a Lapdev user,
I want downloaded runtime assets validated before execution,
So that a partial, corrupted or unexpectedly replaced release cannot silently become the local server.

**Requirements:** FR6, NFR6, NFR10, NFR13

## Acceptance Criteria

- Only allowed GitHub HTTPS sources are accepted; redirects are rejected before download/install.
- Downloaded bytes are checked for declared size and SHA-256 before archive inspection or execution.
- Unsafe archive paths, missing launcher and invalid cache entries fail without launching a runtime.
- Failed downloads clean temporary state; verified installs are staged outside the workspace and renamed atomically.
- Runtime paths remain version/target-qualified and workspace paths remain a separate launch input.

## Implementation Notes

- Node built-ins plus the platform `tar` utility are used; no Docker, Deno or Rust toolchain is required by the CLI process.
- Signature/attestation verification remains a post-MVP hardening item in the release plan.

## Tasks & Acceptance

- [x] Add HTTPS/source policy and redirect rejection.
- [x] Verify asset size and SHA-256 before extraction.
- [x] Validate archive entries and atomically install into the user cache.
- [x] Add focused safety tests and preserve existing local runtime behavior.
- [x] Run repository regression and commit.

## Acceptance Verification

- Focused tests: 16 passed, 0 failed across Stories 6.1–6.4.
- Full regression: frontend 684, backend 45, unit 166, API 4, E2E 175 passed; 41 skipped.
- Failed download test confirmed no cache directory is created and no runtime process launches.

## Review Triage Log

- 手工审查确认来源 host、HTTPS、redirect、tar path traversal、archive required entries 和临时目录清理均在启动前执行。
- 原子替换使用版本/平台独立 cache path；运行中的已解析 runtime 不会因后续 cache 安装而改变。
- 当前 Codex 环境无 subagent 能力；独立 review 输出未伪造，聚焦安全用例和完整回归已通过。
