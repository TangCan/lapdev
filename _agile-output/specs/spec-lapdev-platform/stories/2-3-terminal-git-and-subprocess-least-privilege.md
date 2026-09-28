---
status: done
route: dispatch
baseline_commit: e882bdc
story_key: 2-3-terminal-git-and-subprocess-least-privilege
epic: 2
story: 3
---

# Story 2.3: 终端、Git 与子进程最小权限

## Intent

终端命令必须受当前策略约束，高风险命令拒绝并留下不含命令内容的审计事件；输出日志不得泄漏终端敏感内容。

## Verification

- `npm run test:backend` — 11 tests / 39 steps passed, including high-risk command policy.
- `backend/src/handlers/terminalHandler.ts` denies sudo, destructive filesystem/system commands, hard Git reset and fork-bomb patterns.
- Terminal output logging records only session and length, not output content.
- `cargo test --manifest-path core/Cargo.toml --all` — passed; `cargo fmt --check` retains pre-existing differences.
- `just test` — unavailable because no `justfile` exists.

## Review Triage Log

- `[patch]` Existing output logging included terminal content; changed to length-only audit-safe logging.
- `[pass]` Command policy is tested independently and does not alter normal terminal session creation.
