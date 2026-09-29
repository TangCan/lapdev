---
status: done
story_id: '1.3'
story_key: 1-3-revalidate-session-changes-and-disconnects
epic: epic-1
---

# Story 1.3: Revalidate session changes and disconnects

As a remote operator,
I want policy and workspace changes to affect existing connections,
So that a previously valid session cannot retain stale access.

## Acceptance Criteria

1. Expired, revoked, or capability-invalidated sessions are rejected on new requests and reconnects.
2. A connected WebSocket revalidates its session before capability operations; stale terminal registrations cannot continue.
3. Security events carry request/session correlation metadata without credentials.

## Implementation Notes

- Keep session state server-side and revalidate against the live `AuthSessionStore`.
- Invalidate WebSocket terminal registrations when the session is no longer active.
- Preserve the existing shared HTTP/WebSocket capability context boundary.

## Review Triage Log

- Manual review: no high, medium, or low findings after adversarial review.
- Verification: `npm run test:backend` passed (29 tests, 39 steps).
