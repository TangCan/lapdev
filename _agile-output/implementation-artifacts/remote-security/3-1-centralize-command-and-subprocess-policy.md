---
status: done
story_id: '3.1'
story_key: 3-1-centralize-command-and-subprocess-policy
epic: epic-3
---

# Story 3.1: Centralize command and subprocess policy

As an operator,
I want terminal, Git and subprocess commands evaluated by one policy gate,
So that shell and process paths cannot bypass remote restrictions.

## Acceptance Criteria

1. Executable, arguments, cwd, environment, network target, resources, and interactive mode are normalized before process creation.
2. Remote arbitrary shell and unapproved executable/argument/environment combinations are denied.
3. Decisions expose safe reasons and correlation metadata without secret values.

## Review Triage Log

- Manual review: no high, medium, or low findings after adversarial review.
- Verification: `npm run test:backend` passed (37 tests, 39 steps), Rust tests passed, and full `npm test` passed (175 E2E passes, 40 skips).
