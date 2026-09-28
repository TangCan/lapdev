---
status: done
route: dispatch
baseline_commit: 7a94168
story_key: 2-2-workspace-path-boundary-and-file-authorization
epic: 2
story: 2
---

# Story 2.2: 工作区路径边界与文件操作授权

## Intent

文件和 Agent 操作必须限制在配置的工作区内，拒绝路径遍历、绝对路径逃逸和 symlink 逃逸，并保持统一的可诊断错误。

## Tasks & Acceptance

- [x] Audit file service and Agent path normalization.
- [x] Enforce lexical and real-path workspace boundaries for existing and newly created paths.
- [x] Fix prefix confusion and symlink escape handling.
- [x] Run backend, unit and regression checks.

## Verification

- `npm run test:backend` — 10 tests / 39 steps passed, including Agent traversal and nested creation cases.
- `npm run test:unit` — run as project regression; no Story-specific assertion failures.
- `cargo test --manifest-path core/Cargo.toml --all` — passed; crate currently has no Rust tests.
- `cargo fmt --manifest-path core/Cargo.toml --all -- --check` — pre-existing core formatting differences remain.
- `just test` — unavailable because the repository has no `justfile`.

## Review Triage Log

- `[patch]` Lexical prefix checks accepted sibling paths and symlink targets; real-path validation now checks the target or nearest existing parent before I/O.
- `[pass]` Existing nested-file creation behavior remains supported.
