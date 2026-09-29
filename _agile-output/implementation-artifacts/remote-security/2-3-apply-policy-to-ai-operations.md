---
status: done
story_id: '2.3'
story_key: 2-3-apply-policy-to-ai-operations
epic: epic-2
---

# Story 2.3: Apply policy to AI operations

As a remote operator,
I want AI requests scoped to the session and workspace policy,
So that remote agents cannot use unauthorized tools or workspace data.

## Acceptance Criteria

1. Every AI route is gated by `ai` before provider invocation.
2. Workspace, terminal, and Agent capabilities are evaluated independently when requested by an AI operation.
3. AI responses, errors, and audit data never expose provider keys or complete sensitive prompts.

## Review Triage Log

- Manual review: no high, medium, or low findings; all AI routes use the shared pre-handler gate and redaction contract.
- Verification: `npm run test:backend` passed (35 tests, 39 steps); Rust tests passed; adjacent full `npm test` regression passed with only existing E2E flaky signals.
