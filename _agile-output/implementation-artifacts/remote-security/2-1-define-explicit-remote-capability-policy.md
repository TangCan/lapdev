---
status: ready-for-dev
story_id: '2.1'
story_key: 2-1-define-explicit-remote-capability-policy
epic: epic-2
---

# Story 2.1: Define explicit remote capability policy

As an operator,
I want remote capabilities to be denied unless explicitly allowed,
So that newly added operations do not become remotely available by accident.

## Acceptance Criteria

1. An unknown or unconfigured remote capability is denied by default.
2. A grant is valid only when principal, workspace, and session scope match.
3. `remote-shared` never inherits permissions from `local-trusted`.

## Review Triage Log

- Manual review: pending implementation and regression.
