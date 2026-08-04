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

## Deferred from: code review of epi1-02-enable-react-compiler (2026-07-27)

- [x] [Review][Defer] eslint-plugin-react-compiler uses RC pre-release version — `^19.1.0-rc.2` is a release candidate, not stable GA. Acceptable during development but should be updated before production merge. [package.json:53] — deferred, pre-existing
- [x] [Review][Defer] compilationMode: 'infer' may conflict with existing manual memoization — With 'infer' mode, React Compiler auto-memoizes all components, potentially conflicting with the 159 existing `useMemo`/`useCallback` call sites. Double-memoization could cause stale closures or missed updates. Should be addressed in EPI1.03 when removing manual memoization. [vite.config.ts:14] — deferred, tracked in EPI1.03
- [x] [Review][Defer] Tests verify config files only, not actual behavior — Unit tests use `fs.readFileSync` + string matching only. No test verifies ESLint actually runs, Vite builds, or the babel plugin produces correct output. A misconfigured plugin would pass all tests but fail in production. [eslint-react-compiler.test.ts] — deferred, improvement opportunity

## Deferred from: code review of epi1-03-remove-manual-memoization (2026-03-27)

- [x] [Review][Defer] Terminal.tsx handleRestart 原 useCallback 依赖了不存在的 componentName — 预存问题，移除 useCallback 后已自然修复。延后处理，需单独评估是否需要恢复 useCallback 并修复依赖。[Terminal.tsx:562] — deferred, pre-existing

## Deferred from: code review of epi2-02-large-file-optimization (2026-07-29)

- [x] [Review][Defer] 空字符串 `split` 边界不一致 — `isLargeFile`/`isHugeFile` 用早期返回 `if (!content) return false`，`getOptimizedEditorOptions` 用三元 `content ? ... : 0`。行为一致但路径不同。预存代码风格问题。[`monacoOptimizer.ts`]
- [x] [Review][Defer] `baseOptions` 可选参数存在公共 API 误用风险 — 调用者若忘记传入 baseOptions 将导致编辑器创建失败。当前两处调用均正确传入。预存 API 设计问题。[`monacoOptimizer.ts:52`]

## Deferred from: code review of epi2-01-monaco-editor-lazy-loading (2026-07-29)

- [x] [Review][Defer] LSP 连接竞态：快速 Tab 切换时 LSP 诊断结果丢失 — 预存问题，涉及 LSP 架构设计，不在本次故事范围内 [LspCodeEditor.tsx:446-463]
- [x] [Review][Defer] 旧版 CodeEditor.tsx (components/) 未清理 — 文件路径与新版重复，预存问题 [CodeEditor.tsx]
- [x] [Review][Defer] Python 语言服务特殊处理被移除 — 如需 Python 支持应在 EPI3/EPI4 中处理 [monacoLoader.ts]
- [x] [Review][Defer] registerLanguageCallbacks 导出函数为死代码 — 仅在内部被调用，外部无使用方 [monacoLoader.ts:160-162]

## Deferred from: code review of epi2-03-range-formatting-incremental-update (2026-08-03)

- [x] [Review][Defer] Ctrl+F 覆盖了标准查找功能 [LspCodeEditor.tsx:411] — 已有行为，AC5 要求 "不变"
- [x] [Review][Defer] DJB2 哈希碰撞风险 [formatCache.ts:37-50] — 50 条目 LRU 缓存碰撞概率极低
- [x] [Review][Defer] 缓存无 TTL/过期机制 [formatCache.ts] — AC 未要求
- [x] [Review][Defer] 测试覆盖不足 [lspService.test.ts] — 缺少跨文件缓存碰撞、过期缓存等场景，可后续补充
- [x] [Review][Defer] 缓存键缺少文件 URI [formatCache.ts] — 相同内容产生相同格式化结果，实际影响可忽略
