---
status: done
story_id: '2.2'
story_key: 2-2-apply-policy-to-file-agent-git-and-lsp-operations
epic: epic-2
---

# Story 2.2: Apply policy to file, Agent, Git and LSP operations

As a remote operator,
I want all workspace capabilities to use the same policy decision,
So that one operation cannot bypass restrictions enforced by another.

## Acceptance Criteria

1. File, Agent, Git, and LSP routes resolve to a shared capability gate before adapter I/O.
2. Disallowed capabilities have the same denial shape across routes.
3. Successful and denied decisions retain correlation metadata for audit.

## Review Triage Log

- Manual review: no high, medium, or low findings; all adapter families use the existing pre-adapter gate.
- Verification: `npm run test:backend` passed (33 tests, 39 steps); full `npm test` passed with 173 E2E passes, 40 skips, and 2 existing format-concurrency flaky cases.
