---
status: done
story_key: 3-3-reconnect-sync-and-stale-event-handling
epic: 3
story: 3
---
# Story 3.3: 重连、同步与 Stale Event 处理

`canApplyEvent` defines the replay boundary: only revisions newer than the client state apply; equal/older events are idempotently ignored.

Verification: revision tests cover stale mutation and event rejection.
