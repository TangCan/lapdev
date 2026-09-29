---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-generation-mode', 'step-03-test-strategy', 'step-04-generate-tests']
lastStep: 'step-04-generate-tests'
lastSaved: '2026-09-29'
storyId: '1.1'
storyKey: '1-1-resolve-a-shared-authenticated-capability-context'
storyFile: '_agile-output/implementation-artifacts/remote-security/1-1-resolve-a-shared-authenticated-capability-context.md'
atddChecklistPath: '_agile-output/test-artifacts/atdd-checklist-1-1-resolve-a-shared-authenticated-capability-context.md'
generatedTestFiles:
  - 'backend/src/security/authSession.test.ts'
inputDocuments:
  - '_agile-output/specs/spec-remote-security-and-deployment/SPEC.md'
  - '_agile-output/planning-artifacts/architecture/architecture-lapdev-remote-security-2026-09-29/ARCHITECTURE-SPINE.md'
  - '_agile-output/implementation-artifacts/remote-security/1-1-resolve-a-shared-authenticated-capability-context.md'
  - 'backend/src/security/capability.ts'
  - 'backend/src/security/capability.test.ts'
  - 'backend/src/websocket/sessionBinding.test.ts'
---

# ATDD Checklist — Epic 1, Story 1.1

**日期：** 2026-09-29  
**作者：** Richard  
**技术栈：** fullstack（本 Story 的主测试层为 backend unit/integration）

## Story Summary

为远程共享部署建立统一的认证会话边界，使 HTTP 与 WebSocket 都从当前服务器状态解析同一个身份、工作区、会话和能力上下文。浏览器使用安全短期 Cookie，非浏览器客户端可使用短期 opaque session bearer。

## Acceptance Criteria

| ID | 来源 | 验收标准 |
| --- | --- | --- |
| AC-1 | supplied | HTTP 与 WebSocket 使用同一个包含 principal、workspace、session、deployment profile、requested capability 的认证上下文。 |
| AC-2 | supplied | 缺失、过期、伪造或格式错误的凭据在 adapter I/O 前被拒绝。 |
| AC-3 | supplied | reconnect 依据服务器当前 workspace 与 capability policy 重新校验，不信任客户端旧状态。 |
| AC-4 | supplied | Cookie 使用 Secure、HttpOnly、SameSite=Lax、Path=/、短 TTL，原始凭据不进入 URL、localStorage 或日志。 |

## Strategy

- P0 unit tests: bootstrap token exchange, opaque value, cookie flags, forged/malformed credentials, expiry.
- P0 backend integration tests: protected HTTP and WebSocket boundary uses the same resolved session context and rejects before handler I/O.
- P1 regression: existing capability and WebSocket session-binding tests remain green in local-trusted mode.
- 不生成 UI component 测试；本 Story 没有用户界面行为。
- 不使用 Pact；仓库没有现存 Pact provider/consumer contract 需要覆盖。

## Red-Phase Test Scaffolds

**File:** `backend/src/security/authSession.test.ts`

- RED — bootstrap exchange returns a short-lived opaque session and required cookie flags.
- RED — forged and malformed bootstrap credentials return no session and do not mutate store state.
- RED — cookie session resolves from server state and expires at the configured boundary.
- RED — bearer session resolves for WebSocket/non-browser clients.

这些测试在实现 `authSession.ts` 前预期失败，形成 Story 1.1 的红阶段证据。

## Test Data and Security Notes

- 使用显式测试 bootstrap token，仅存在测试进程内；不得写入日志或生产配置。
- 使用注入时钟验证 TTL，避免真实 sleep 和时间竞争。
- 测试断言不会要求打印或回显 raw token/session。

## Handoff

- Story context: `_agile-output/implementation-artifacts/remote-security/1-1-resolve-a-shared-authenticated-capability-context.md`
- Red tests: `backend/src/security/authSession.test.ts`
- 后续流程：Build → Code Review → Test Automation → Regression → Commit。
