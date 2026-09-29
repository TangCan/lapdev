---
status: done
story_id: '3.2'
story_key: 3-2-enforce-server-side-secret-handling
epic: epic-3
---

# Story 3.2: Enforce server-side secret handling

As a remote operator,
I want AI and deployment secrets to remain server-side,
So that browser state and events cannot expose credentials.

## Acceptance Criteria

1. Remote provider operations resolve keys only from deployment environment/secret injection.
2. Configuration responses expose state and masked metadata, never secret material.
3. Logs, errors, events, and fixtures redact keys and complete sensitive prompts.

## Review Triage Log

- Manual review: no high, medium, or low findings after adversarial review.
- Verification: `npm run test:backend` passed (39 tests, 39 steps); Rust tests passed; full `npm test` passed with 173 E2E passes, 40 skips, and existing format-concurrency flaky signals.
