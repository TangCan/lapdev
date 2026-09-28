---
status: done
story_key: 3-1-backend-authoritative-state-and-revision-model
epic: 3
story: 1
---
# Story 3.1: 后端权威状态与 Revision 模型

新增 `RevisionState`，以 compare-and-swap 方式让后端成为状态 owner，拒绝 stale/duplicate mutation 并产生单调 revision。

Verification: `npm run test:backend` and focused revision tests pass.
