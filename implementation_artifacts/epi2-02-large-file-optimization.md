# Story EPI2.02: 大文件优化配置

Status: done

## Story

As a 用户,
I want 打开超过 10,000 行的大文件时编辑器能自动关闭不必要的功能（minimap、folding、hover、codeLens 等），
so that 编辑器保持流畅响应，滚动和编辑操作无明显延迟，满足 NFR-002（大型文件打开延迟 < 500ms）的性能要求。

## Acceptance Criteria

1. **Given** 用户在 IDE 中打开一个超过 10,000 行的文件
   **When** `LspCodeEditor` 初始化 Monaco 编辑器并检测到文件行数
   **Then** 自动应用优化配置：禁用 minimap、folding、hover、codeLens、links、inlineSuggest、fontLigatures、smoothScrolling
   **And** 使用 `getOptimizedEditorOptions()` 代替当前的硬编码 options

2. **Given** 用户打开一个超过 50,000 行的超大文件
   **When** `monacoOptimizer` 检测到 `HUGE_FILE_THRESHOLD`
   **Then** 在大文件优化的基础上进一步：禁用 `lineNumbers`（改为 `'off'`）、关闭 `renderWhitespace`、限制 `multiCursorLimit` 为 1
   **And** 保证 Monaco 初始化后 500ms 内可交互（NFR-002）

3. **Given** 用户打开一个小于 10,000 行的普通文件
   **When** `isLargeFile()` 返回 `false`
   **Then** 保持现有完整功能（minimap、folding、hover、codeLens 等全部启用）
   **And** 用户显式传入的 `minimap` prop 作为基础选项，再被优化逻辑覆盖（大文件时覆盖为禁用）

4. **Given** 用户在编辑过程中保存/切换内容（例如通过 AI Agent 写入大段代码）
   **When** 文件从"普通"跨越到"大文件"阈值
   **Then** 编辑器选项在模型内容变更后能正确反映阈值状态（可通过重建编辑器或调用 `updateOptions` 实现）
   **And** 不破坏 `onDidChangeModelContent` 的现有回调链

5. **Given** 用户使用 `SimpleIDE` 页面或其他复用 `LazyCodeEditor` 的入口
   **When** 打开大文件
   **Then** 同样触发优化逻辑（因为优化发生在 `LspCodeEditor` 内部）
   **And** 不破坏 `LazyCodeEditor` 现有 API（`value`、`language`、`onChange`、`diffLines`、`fontSize`、`minimap`、`readOnly`、`uri`）

6. **Given** 前端运行单元测试
   **When** 运行 `npm test`
   **Then** `monacoOptimizer.test.ts` 全部通过（至少覆盖阈值判定、选项生成、边界条件）
   **And** `LazyCodeEditor.test.tsx` / `LspCodeEditor` 相关集成测试继续通过（不回归）

7. **Given** 构建生产产物
   **When** 运行 `npm run build`
   **Then** 无 TypeScript 类型错误、无 ESLint 新增警告
   **And** `monacoOptimizer.ts` 不引入任何对 `monaco-editor` 的静态顶层 import（保持懒加载切分）

## Tasks / Subtasks

- [ ] Task 1: 集成 `monacoOptimizer` 到 `LspCodeEditor` (AC: #1, #2, #3, #4)
  - [ ] Subtask 1.1: 在 `LspCodeEditor.tsx` 中按需（`getMonacoSync()` 已就绪后）动态 `import` 或直接调用 `getOptimizedEditorOptions`
  - [ ] Subtask 1.2: 替换 `createEditor` 中的硬编码 options，改为通过 `getOptimizedEditorOptions(value, baseOptions)` 生成
  - [ ] Subtask 1.3: 保留 `minimap`、`fontSize`、`readOnly` 等 props 作为 `baseOptions` 输入
  - [ ] Subtask 1.4: 添加 `useEffect` 监听 `value` 变化，在跨越阈值时调用 `editorRef.current.updateOptions(...)` 动态生效
  - [ ] Subtask 1.5: 保持 `editor.onDidChangeModelContent`、快捷键、AI 内联补全、Diff 装饰等既有逻辑不被破坏

- [ ] Task 2: 保持懒加载切分（AC: #7）
  - [ ] Subtask 2.1: 确保 `monacoOptimizer.ts` 不引入任何 `import ... from 'monaco-editor'` 顶层静态导入；仅通过 `getMonacoSync()` 在运行时获取类型与模块
  - [ ] Subtask 2.2: `getOptimizedEditorOptions` 的 `editor.IStandaloneEditorConstructionOptions` 类型引用改为 `import type`（仅类型检查）
  - [ ] Subtask 2.3: 构建验证 `monaco-*.js` chunk 不包含额外的 `monaco-editor` 重复引用

- [ ] Task 3: 完善 `monacoOptimizer` 工具函数与边界处理 (AC: #1, #2)
  - [ ] Subtask 3.1: 补充对空字符串、单行、超大单行等边界的 `isLargeFile` / `isHugeFile` 判定
  - [ ] Subtask 3.2: 补充 `getOptimizedEditorOptions` 对 `baseOptions` 冲突字段（如用户显式 `minimap: true` 但文件为 huge）的覆盖策略，并在 JSDoc 中说明
  - [ ] Subtask 3.3: 导出常量 `LARGE_FILE_THRESHOLD = 10000` 与 `HUGE_FILE_THRESHOLD = 50000` 供外部读取与测试

- [ ] Task 4: 单元测试 (AC: #6)
  - [ ] Subtask 4.1: 新增 `frontend/src/utils/monacoOptimizer.test.ts`，覆盖 `isLargeFile`、`isHugeFile`、`getOptimizedEditorOptions`、`createOptimizedEditor`
  - [ ] Subtask 4.2: 测试边界：9,999 行、10,000 行、10,001 行、50,000 行、50,001 行
  - [ ] Subtask 4.3: 测试 `baseOptions` 优先级（用户显式设置 vs 优化覆盖）
  - [ ] Subtask 4.4: 在 `LspCodeEditor.test.tsx` 或 `LazyCodeEditor.test.tsx` 中新增一条集成测试：打开大文件时 minimap/folding 被禁用

- [ ] Task 5: 验收与性能验证 (AC: #1, #2, #7)
  - [ ] Subtask 5.1: `npm test` 全部通过（含新增测试）
  - [ ] Subtask 5.2: `npm run build` 成功，无类型错误
  - [ ] Subtask 5.3: 手动或通过 E2E 创建 10,001/50,001 行的测试文件，验证编辑器 options
  - [ ] Subtask 5.4: 回归 `npm run test:regression` 全部通过

### Review Findings

- [x] [Review][Decision→Patch] 用户 `minimap` prop 在小文件中被强制覆盖 — 已修复：`getOptimizedEditorOptions` 现在尊重用户意图，小文件保留 baseOptions 中的 minimap 设置，大/超大文件强制禁用。[`monacoOptimizer.ts:72`] ✅ Applied
- [x] [Review][Decision→Patch] `scrollBeyondLastLine` 被强制覆盖 — 已修复：从 `buildBaseOptions` 移除该字段，改由优化器统一控制（大文件 `false`，小文件 `true`）。[`LspCodeEditor.tsx:48`] ✅ Applied
- [x] [Review][Dismiss] `monaco-editor` 静态 `import type` 合规性 — 类型导入编译后消除，不影响懒加载切分。无需修改。
- [x] [Review][Dismiss] `multiCursorLimit` 阈值从 `isLarge` 改为 `isHuge` — AC2 明确 multiCursorLimit=1 仅适用于超大文件，此变更是符合规格的。
- [x] [Review][Patch] 同一内容被 `split('\n')` 3+ 次 — 已修复：新增 `getLineCount` 共享函数，阈值检查仅计算一次 lineCount。[`monacoOptimizer.ts:21-24`] ✅ Applied
- [x] [Review][Patch] `retryInit` 不销毁旧编辑器实例 — 已修复：创建新编辑器前先 dispose 旧实例并清理装饰引用。[`LspCodeEditor.tsx:583-586`] ✅ Applied
- [x] [Review][Patch] 首次渲染可能触发冗余 `updateOptions` — 已修复：添加 `thresholdInitRef` 守卫跳过首次渲染。[`LspCodeEditor.tsx:497-503`] ✅ Applied
- [x] [Review][Patch] `glyphMargin` 在超大文件下未被关闭 — 已修复：添加 `glyphMargin: !isLarge` 到优化器。[`monacoOptimizer.ts:84`] ✅ Applied
- [x] [Review][Patch] `quickSuggestions` 在超大文件下未被禁用 — 已修复：大文件下 `quickSuggestions: false`。[`monacoOptimizer.ts:85`] ✅ Applied
- [x] [Review][Patch] 阈值变更时 `updateOptions` 与用户输入冲突 — 已修复：使用 `requestAnimationFrame` 延迟 `updateOptions`。[`LspCodeEditor.tsx:520-524`] ✅ Applied
- [x] [Review][Patch] useEffect 依赖 `value` 导致每次输入都触发阈值检查 — 已修复：添加 300ms debounce 定时器。[`LspCodeEditor.tsx:509-529`] ✅ Applied
- [x] [Review][Defer] 空字符串 `split` 边界不一致 — `isLargeFile`/`isHugeFile` 用早期返回 `if (!content) return false`，`getOptimizedEditorOptions` 用三元 `content ? ... : 0`。行为一致但路径不同。预存代码风格问题。[`monacoOptimizer.ts`] — deferred, pre-existing
- [x] [Review][Defer] `baseOptions` 可选参数存在公共 API 误用风险 — 调用者若忘记传入 baseOptions 将导致编辑器创建失败。当前两处调用均正确传入。预存 API 设计问题。[`monacoOptimizer.ts:62`] — deferred, pre-existing

## Dev Notes

### 核心目标

将已存在但未被使用的 `frontend/src/utils/monacoOptimizer.ts` 真正接入到编辑器渲染路径中，让 Monaco Editor 在大文件场景下自动降级功能，保持编辑流畅。

### 当前实现状态

- **`frontend/src/utils/monacoOptimizer.ts`**：已实现 `isLargeFile`、`isHugeFile`、`getOptimizedEditorOptions`、`createOptimizedEditor` 四个导出，阈值常量 `LARGE_FILE_THRESHOLD = 10000`、`HUGE_FILE_THRESHOLD = 50000`。**未被任何组件使用**。
- **`frontend/src/components/Editor/LspCodeEditor.tsx`**：当前在 `createEditor` 中使用硬编码的 Monaco options（见 L293-346），既不检测文件大小，也不调用 `monacoOptimizer`。
- **`frontend/src/components/Editor/LazyCodeEditor.tsx`**：作为懒加载包装器，已将 `minimap` prop 透传给 `LspCodeEditor`；无需改动。
- **`frontend/src/services/monacoLoader.ts`**：通过动态 `import('monaco-editor')` 实现懒加载；`getMonacoSync()` 返回缓存的 Monaco 模块或 `null`。

### 关键约束

1. **不得破坏懒加载切分**：`monacoOptimizer.ts` **必须**仅通过 `getMonacoSync()` 在运行时获取 Monaco 模块，禁止 `import * as Monaco from 'monaco-editor'` 顶层导入。类型使用 `import type { editor } from 'monaco-editor'`。
2. **阈值可观测**：`LARGE_FILE_THRESHOLD`、`HUGE_FILE_THRESHOLD` 必须作为命名导出存在，方便单元测试和未来调参。
3. **LspCodeEditor 的既有行为必须保留**：
   - AI 内联补全（`triggerCompletion`、ghost text 装饰）
   - Diff 装饰（`updateDiffDecorations`）
   - 快捷键（Ctrl+S/F/D/R 等）
   - LSP 连接（`useLSP().connect/registerEditor`）
   - 全局 `__test_*` 辅助函数
4. **动态切换阈值**：文件在编辑过程中跨越阈值时，需要调用 `editor.updateOptions()` 动态更新，不要销毁并重建编辑器（会丢失 LSP 和 AI 会话状态）。
5. **用户显式选项优先**：当用户显式传入 `minimap={true}` 但文件为 huge 时，优化器应仍以性能优先覆盖为 `false`，并在 JSDoc 中说明。
6. **`SimpleIDE` 与主 IDE 共享同一条渲染路径**：改动集中在 `LspCodeEditor` 即可覆盖两处入口。

### 性能与 UX 指标

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| 大文件（≥10k 行）首次打开 | < 500ms（NFR-002） | DevTools Timeline / PerformancePanel |
| 超大文件（≥50k 行）滚动 FPS | ≥ 30fps | DevTools Performance 录制 |
| 普通文件（<10k 行）功能完整度 | 不退化 | 对比 E2E `code-editor.spec.ts` 全通过 |
| Bundle 体积 | 不引入额外 monaco 重复 | `ls -lh dist/assets/monaco-*.js` |

### 项目结构 Notes

- 新增/修改文件应放置在现有目录结构下：
  - `frontend/src/utils/monacoOptimizer.ts`（修改：补充 JSDoc、边界处理）
  - `frontend/src/utils/monacoOptimizer.test.ts`（新增单元测试）
  - `frontend/src/components/Editor/LspCodeEditor.tsx`（修改：集成优化选项）
  - `frontend/src/components/Editor/LazyCodeEditor.tsx`（可选：仅在需要时透传阈值回调）
  - `frontend/src/components/Editor/LspCodeEditor.test.tsx`（新增/补充大文件集成测试，如文件不存在则创建）

### 技术栈与版本

- React 18.3.1 + TypeScript 5.5.0 + Vite 6.0.0
- Monaco Editor 0.55.1
- 测试：Vitest 2.0.5 + Testing Library 16.0.0 + Playwright 1.44.0

### 参考资料

- [Source: docs/epics.md#Epic-EPI2] EPI2 整体目标与故事列表
- [Source: docs/epics.md#Story-EPI2.02] EPI2.02 验收标准原文
- [Source: docs/epics.md#NFR-002] 大型文件打开延迟 < 500ms
- [Source: docs/epics.md#UX-DR2] 大文件编辑时自动禁用不必要功能
- [Source: docs/architecture.md#4-4] 前端性能优化策略（Code Splitting + Lazy Loading）
- [Source: frontend/src/utils/monacoOptimizer.ts] 已存在的优化工具（待集成）
- [Source: frontend/src/components/Editor/LspCodeEditor.tsx] 目标集成点（createEditor L293-346）
- [Source: frontend/src/components/Editor/LazyCodeEditor.tsx] 懒加载包装器
- [Source: frontend/src/services/monacoLoader.ts] Monaco 懒加载服务
- [Source: implementation_artifacts/epi2-01-monaco-editor-lazy-loading.md] 上一个故事的经验教训（特别是关于避免静态 `monaco-editor` 导入）

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
