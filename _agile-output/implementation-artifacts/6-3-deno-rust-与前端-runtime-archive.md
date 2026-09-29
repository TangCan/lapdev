---
storyId: "6.3"
storyKey: "6-3-deno-rust-与前端-runtime-archive"
status: "done"
baseline_commit: "6074844"
context:
  - "_agile-output/implementation-artifacts/epic-6-context.md"
  - "_agile-output/planning-artifacts/architecture/architecture-lapdev-2026-09-28/ARCHITECTURE-SPINE.md"
  - "_agile-output/specs/spec-lapdev-platform/release-runtime-contract.md"
  - "AGENTS.md"
source: "_agile-output/planning-artifacts/epics.md"
---

# Story 6.3: Deno、Rust 与前端 Runtime Archive

As a release maintainer,
I want reproducible platform runtime archives containing all required Lapdev assets,
So that a supported user platform can run Lapdev without installing the project toolchain.

**Requirements:** FR6, NFR7, NFR10, NFR11, NFR13

## Acceptance Criteria

- Linux x64 and macOS arm64 use explicit target identifiers and Rust target triples.
- The archive contains `bin`, `lib`, `app`, `manifest.json` and `LICENSES` areas, with compiled server, frontend dist, backend/shared sources and a real native library.
- The packaging gate rejects missing required assets and forbidden secrets, workspace data, fixtures and build caches.
- The archive launcher resolves runtime-relative paths and binds through the existing localhost/runtime contract.

## Implementation Notes

- `scripts/build-runtime-archive.sh` is the single archive assembly entrypoint.
- Release checksum finalization and upload remain Story 6.5 responsibilities.
- Source-install commands remain unchanged.

## Tasks & Acceptance

- [x] Add target-aware runtime archive builder.
- [x] Add runtime layout and forbidden-content packaging gate.
- [x] Add focused archive contract tests.
- [x] Run build/package checks and repository regression, then commit.

## Acceptance Verification

- Linux x64 archive built with Vite, Rust `x86_64-unknown-linux-gnu` release library and compiled Deno server.
- Archive verifier passed required layout and forbidden-content checks.
- Extracted archive started from a clean temporary directory and returned HTTP 200 on localhost.
- macOS arm64 target mapping is explicit; cross-target availability remains dependent on the installed Rust target toolchain.

## Review Triage Log

- 手工 packaging review 发现 backend 测试文件和运行日志会被复制，已加入 `tests`、`*.test.ts`、`logs`、cert、node_modules 和 `.env` 排除及 verifier 门禁。
- 归档内 manifest 的 release asset checksum 由 Story 6.5 在归档生成后 finalize，避免自引用 checksum。
- 当前 Codex 环境没有 subagent 能力；静态 gate、真实 archive 构建、clean extraction health check 和完整回归均已完成。
