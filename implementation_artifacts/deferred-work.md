# Deferred Work

## Deferred from: code review of 9-2-agent-operation-confirmation (2026-07-10)

- [x] [Review][Defer] 操作确认触发逻辑应改为监听 AI 流式响应而非关键词匹配 [AIChatPanel.tsx:157] — 架构改进建议，当前实现使用关键词匹配（modify/write/update/change）触发操作确认对话框，但实际应用中应该由 AI 返回的 SSE 消息中的 `agent-operation` 类型触发。这需要修改 AI 流式响应解析逻辑，属于架构层面的改进。

## Deferred from: code review of 9-3-agent-operation-log (2026-07-10)

- [x] [Review][Defer] 重复类型定义 — 后端和前端都定义了 `OperationLogEntry` 接口，可能不一致 [agentHandler.ts:364] — deferred, pre-existing
- [x] [Review][Defer] 大量日志（>100条）被截断 — 现有设计就是限制为100条，符合性能约束 [AgentContext.tsx:76] — deferred, pre-existing

## Deferred from: code review of 10-1-skill-publish-command (2026-07-13)

- [x] [Review][Defer] 缺少错误码或退出码，脚本调用无法判断成功 [skillCli.ts] — deferred, pre-existing
- [x] [Review][Defer] 当前目录存在多个 .skill.md 文件时未提示用户选择 [skillCli.ts:getDefaultSkillFile] — deferred, pre-existing
- [x] [Review][Defer] tags 数组为空数组时未验证是否符合业务要求 [skillValidator.ts:validateMetadata] — deferred, pre-existing
- [x] [Review][Defer] 用户提供多个非选项参数时静默忽略多余参数 [skillCli.ts:266] — deferred, pre-existing
