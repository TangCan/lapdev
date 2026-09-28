---
status: in-progress
route: dispatch
baseline_commit: a49b2b6
story_key: 2-1-unified-capability-context-and-policy-profile
epic: 2
story: 1
---

# Story 2.1: 统一 Capability Context 与 Policy Profile

## Intent

为 HTTP 和 WebSocket 能力调用建立统一的用户、工作区、会话、requestId、能力和 policy profile 上下文，并用统一错误和脱敏审计结果表达授权决策。

## Tasks & Acceptance

- [x] Add shared capability context and local-trusted/remote-shared policy profiles.
- [x] Apply capability evaluation at the HTTP route boundary.
- [x] Add shared unauthorized error shape and secret-free audit event fields.
- [x] Add tests for local access, remote unauthenticated access and capability allow-list denial.
- [ ] Run review, automation and regression checks; record findings.

## Code Map

- `backend/src/security/capability.ts`: context, profile, policy and audit helpers.
- `backend/src/main.ts`: route-boundary policy evaluation.
- `backend/src/security/capability.test.ts`: focused policy tests.

## Dev Notes

The local-trusted default preserves current single-user development behavior. Remote-shared mode requires an Authorization header and a server-side `CAPABILITY_ALLOWLIST`; client headers cannot grant capabilities. WebSocket session binding is completed by Story 2.4.
