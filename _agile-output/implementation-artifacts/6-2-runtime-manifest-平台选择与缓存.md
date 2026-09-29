---
storyId: "6.2"
storyKey: "6-2-runtime-manifest-平台选择与缓存"
status: "done"
baseline_commit: "d496828"
context:
  - "_agile-output/implementation-artifacts/epic-6-context.md"
  - "_agile-output/planning-artifacts/architecture/architecture-lapdev-2026-09-28/ARCHITECTURE-SPINE.md"
  - "_agile-output/specs/spec-lapdev-platform/SPEC.md"
  - "_agile-output/specs/spec-lapdev-platform/release-runtime-contract.md"
  - "AGENTS.md"
source: "_agile-output/planning-artifacts/epics.md"
---

# Story 6.2: Runtime Manifest、平台选择与缓存

As a Lapdev user,
I want the CLI to select and cache the runtime that matches my platform and CLI version,
So that installation is reproducible and does not mix incompatible native assets.

**Requirements:** FR6, NFR10, NFR11, NFR13

## Acceptance Criteria

### AC-1: Manifest identity and platform selection

**Given** a CLI version and a manifest containing supported platform, architecture, target, asset URL, size, checksum and build commit
**When** the CLI resolves a runtime
**Then** it selects only the entry matching the CLI version, `process.platform` and `process.arch`
**And** it rejects missing fields, unsupported targets and mismatched versions.

### AC-2: Cache identity and integrity

**Given** a verified runtime already exists in the versioned user cache
**When** the same CLI version and platform are resolved again
**Then** the CLI reuses it only after confirming manifest identity and declared integrity.

### AC-3: Offline cache miss

**Given** the user passes `--offline`
**When** no verified matching cache entry exists
**Then** the CLI fails without making a network request and identifies the required version and platform.

### AC-4: Controlled runtime directory

**Given** the user passes `--runtime-dir` for development or testing
**When** the directory is validated
**Then** the same manifest identity and layout checks apply before startup.

## Implementation Notes

- Keep archive construction and extraction in Story 6.3.
- Keep release URL policy, archive hardening and signature/attestation follow-up in Stories 6.4 and 6.5.
- Keep cache directories outside the workspace and use version/target-qualified paths.

## Tasks & Acceptance

- [x] Add the versioned runtime manifest schema and platform target resolver.
- [x] Validate manifest identity, required fields and cache layout before launch.
- [x] Add offline cache-miss behavior with stable diagnostics.
- [x] Add focused tests for matching, mismatching and invalid cache entries.
- [x] Run the repository regression suite and commit the story.

## Acceptance Verification

- AC-1: manifest version/platform/architecture/target and required identity fields are validated before startup.
- AC-2: local cache/runtime assets are checked by declared size and SHA-256, including real-path containment.
- AC-3: `web --offline` returns a stable cache-miss error without launching a process.
- AC-4: `--runtime-dir` uses the same manifest and asset validation path.

## Review Triage Log

- 手工边界审查发现本地 asset 符号链接可能越界，已改为校验 asset 的真实路径并拒绝目录外目标。
- 远程下载、归档解压和 Release URL policy 按已确认的 Story 边界保留到 6.3–6.5。
- 当前 Codex 环境没有 subagent 能力，未伪造并行审查结果；聚焦测试、打包检查、Rust 和完整 npm 回归均已通过。
