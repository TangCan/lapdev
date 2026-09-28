---
status: done
route: dispatch
baseline_commit: 5dc5640
story_key: 2-4-websocket-session-auth-and-sensitive-data-protection
epic: 2
story: 4
---

# Story 2.4: WebSocket 会话认证与敏感信息保护

## Intent

WebSocket upgrade 必须经过 capability policy，连接上下文保留用户、工作区和会话信息，终端消息不能跨越绑定会话；敏感终端输出不进入日志。

## Verification

- `npm run test:backend` — 12 tests / 39 steps passed.
- HTTP and WebSocket upgrade paths call the shared capability policy before privileged work.
- WebSocket terminal registration rejects a session ID that differs from the bound `X-Session-Id` context.
- Terminal output logs only length and session ID, never output content.
- `cargo test --manifest-path core/Cargo.toml --all` — passed; fmt check retains pre-existing differences.
- `just test` — unavailable because no `justfile` exists.

## Review Triage Log

- `[patch]` WebSocket upgrade initially bypassed the shared policy; it now evaluates before upgrade and passes context into connection state.
- `[pass]` Session mismatch is rejected without exposing credentials or full message content.
