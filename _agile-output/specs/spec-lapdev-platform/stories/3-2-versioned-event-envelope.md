---
status: done
story_key: 3-2-versioned-event-envelope
epic: 3
story: 2
---
# Story 3.2: 统一版本化 Event Envelope

`EventEnvelope` 统一 type/version/workspace/session/revision/requestId/payload，并允许脱敏 error 字段。

Verification: `backend/src/state/revisionState.test.ts` envelope assertions pass.
