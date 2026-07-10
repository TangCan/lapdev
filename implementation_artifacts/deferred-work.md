# Deferred Work

## Deferred from: code review of 9-2-agent-operation-confirmation (2026-07-10)

- [x] [Review][Defer] 操作确认触发逻辑应改为监听 AI 流式响应而非关键词匹配 [AIChatPanel.tsx:157] — 架构改进建议，当前实现使用关键词匹配（modify/write/update/change）触发操作确认对话框，但实际应用中应该由 AI 返回的 SSE 消息中的 `agent-operation` 类型触发。这需要修改 AI 流式响应解析逻辑，属于架构层面的改进。
