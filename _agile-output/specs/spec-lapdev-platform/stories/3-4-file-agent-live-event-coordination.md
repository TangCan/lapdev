---
status: done
story_key: 3-4-file-agent-live-event-coordination
epic: 3
story: 4
---
# Story 3.4: 文件监听、Agent 和实时能力事件协调

The shared envelope and revision gate define the ordering boundary consumed by file, Agent, terminal and LSP publishers; duplicate/stale transitions cannot replace newer state.

Verification: shared revision/event tests pass; payload remains capability-specific.
