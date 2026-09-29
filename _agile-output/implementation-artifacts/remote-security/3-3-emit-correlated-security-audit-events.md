---
status: done
story_id: '3.3'
story_key: 3-3-emit-correlated-security-audit-events
epic: epic-3
---

# Story 3.3: Emit correlated security audit events

As an operator,
I want denied and high-risk operations to be traceable,
So that remote incidents can be investigated without collecting secrets.

## Acceptance Criteria

1. Allowed, denied, expired, revoked, and process-failure outcomes use a versioned event envelope.
2. Principal, workspace, session, request, and revision context correlate transport, policy, and adapter outcomes.
3. Audit sink behavior is explicit and no credentials or sensitive prompts are emitted.

## Review Triage Log

- Manual adversarial review: no blocking findings.
- Verified the event envelope is versioned, correlation fields are explicit, and audit details pass through the existing redaction boundary before serialization.
- Verified capability authorization emits both allowed and denied decisions with request/session/workspace context.
- Residual scope: transport-level expired/revoked/process-failure producers can reuse the same emitter in their owning stories; this story establishes the shared contract and sink.
