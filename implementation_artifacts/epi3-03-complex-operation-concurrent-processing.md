# Story EPI3.03: 复杂操作并发处理

Status: ready-for-dev

## Story

As a 开发者,
I want 复杂操作（代码格式化、LSP 分析）使用 `startTransition` 进行并发处理,
so that 在重计算期间 UI 保持响应，用户无需等待操作完成即可继续输入或交互。

## Acceptance Criteria

1. **Given** 用户触发代码格式化操作
   **When** 格式化结果返回并更新编辑器内容
   **Then** 内容更新通过 `startTransition` 包装（标记为 transition）
   **And** 更新期间 UI 保持响应（用户可继续输入、滚动、切换）
   **And** 操作完成后编辑器自动显示格式化结果
   **And** 格式化进行中显示 pending 状态指示

2. **Given** 用户触发 LSP 代码分析（诊断）更新
   **When** LSP 返回诊断结果并触发下游组件重渲染
   **Then** 诊断触发的 React 状态更新通过 `startTransition` 包装
   **And** 更新期间编辑器输入不被阻塞（无明显卡顿）
   **And** 诊断标记最终正确显示（Problems 面板、编辑器标线）

3. **Given** 用户触发 LSP 代码补全
   **When** 补全建议应用到编辑器（ghost text / inline completion）
   **Then** 补全相关的 React 状态更新通过 `startTransition` 包装
   **And** 不阻塞用户继续输入

4. **Given** 现有保存 / 格式化 / 搜索 / LSP 功能
   **When** 引入 `startTransition` 之后
   **Then** 所有现有功能行为保持不变（回归测试通过）
   **And** Ctrl+S 保存、Ctrl+F 格式化、LSP 补全、诊断显示均正常

5. **Given** 开发者使用 `startTransition`
   **When** 检查实现代码
   **Then** `startTransition` 仅包裹**同步的 React 状态更新**（setState / setTabs / setDiagnostics 等）
   **And** 不得把 `await` 异步调用（`formatCode`、`fetch`）或 Monaco 命令式 API（`editor.trigger`、`editor.executeEdits`、`setModelMarkers`）包裹进 `startTransition`（无效用法）

## Tasks / Subtasks

- [ ] Task 1: 在 `useFileOperations.handleFormat` 中引入 `useTransition` + `startTransition`（AC: #1, #5）
  - [ ] 引入 `useTransition`（`import { useTransition } from 'react'`）
  - [ ] 用 `startTransition(() => updateTabContent(...))` 包装格式化结果的内容更新
  - [ ] 用 `isPending` 驱动格式化 pending 状态（与现有 `isFormatting` 协调，避免重复状态）
- [ ] Task 2: 为 LSP 诊断更新引入并发处理（AC: #2, #5）
  - [ ] 定位 LSP 诊断触发 React 状态更新的位置（`LSPContext` 下游订阅者）
  - [ ] 用 `startTransition` 包装诊断触发的 `setState` 更新
  - [ ] 确认 `setModelMarkers`（Monaco 命令式 API）不包裹 startTransition
- [ ] Task 3: 为 LSP 代码补全相关状态更新引入 `startTransition`（AC: #3, #5）
  - [ ] 定位 `applyGhostText` / inline completion 的 `setGhostText` / `setInlineCompletionVisible` 更新
  - [ ] 用 `startTransition` 包装这些同步状态更新
  - [ ] 确认 `editor.executeEdits`（命令式 API）不包裹 startTransition
- [ ] Task 4: 编写单元测试（AC: #4, #5）
- [ ] Task 5: 编写 E2E 测试 + 性能验证（AC: #4）

## Technical Context

### 已有代码（需理解，勿重造轮子）

| 文件 | 状态 | 说明 |
|------|------|------|
| `frontend/src/hooks/useFileOperations.ts` | ⚠️ 需修改 | `handleFormat` 调用 `fileService.formatCode`（后端 `/api/v1/files/format`），随后 `updateTabContent` 更新编辑器内容 |
| `frontend/src/hooks/useEditorTabs.ts` | ✅ 无需修改 | `updateTabContent` = `setTabs` 更新 tab 内容（React 状态更新，正是 startTransition 的落点） |
| `frontend/src/services/fileService.ts` | ✅ 无需修改 | `formatCode(content, language)` 异步 API 调用 |
| `frontend/src/services/lspService.ts` | ✅ 无需修改 | `formatDocument` / `formatRange`（LSP 格式化）、`getCompletions`、诊断推送 |
| `frontend/src/context/LSPContext.tsx` | ⚠️ 需分析 | `handleDiagnosticsChange` 用 Monterey `setModelMarkers`（命令式）+ `notifyDiagnosticSubscribers()`（触发下游 React 更新） |
| `frontend/src/components/Editor/LspCodeEditor.tsx` | ⚠️ 需修改 | `triggerFormat`（`editor.trigger` 命令式，勿包 startTransition）、`applyGhostText` 等 inline completion 逻辑 |

### 关键架构决策（必读：startTransition 正确用法）

**`startTransition` 只对「同步的 React 状态更新」有效。** 这是本 story 的核心约束，务必理解：

- ✅ **有效场景**：`startTransition(() => setSomething(newValue))` —— 把这次 `setState` 标记为低优先级，React 可中断/推迟它，优先响应用户输入等紧急更新。
- ❌ **无效场景 1（异步操作）**：`startTransition(async () => { await formatCode(...) })` —— `await` 的异步 fetch 本就不阻塞主线程，`startTransition` 既不能让异步操作"后台化"，也不能加速它。毫无意义。
- ❌ **无效场景 2（命令式 API）**：`startTransition(() => editor.trigger('keyboard', 'editor.action.formatDocument', {}))` 或包 `setModelMarkers` / `editor.executeEdits` —— 这些是 Monaco 命令式调用，不经过 React 渲染调度，`startTransition` 对它们无效。

**判断准则**：若某操作以 `await` 开头，或调用 `editor.*` 命令式 API，则它本身**不需要** startTransition；需要 startTransition 的是它**后续触发的 React `setState`**。

### 落地点（明确到具体代码）

#### 1. `handleFormat` 的 `updateTabContent`（最高优先级）

现状（`useFileOperations.ts:54-72`）：
```typescript
const handleFormat = useCallback(async () => {
  const activeTab = tabs.find(tab => tab.id === activeTabId);
  if (!activeTab) return;
  setIsFormatting(true);
  try {
    const result = await formatCode(activeTab.content, activeTab.language);
    if (result.status === 'success' && result.data && result.data.formatted) {
      updateTabContent(activeTabId!, result.data.formatted);   // ← 这里是 React 状态更新
    }
    ...
```

目标：`formatCode` 保持异步 `await`（不包 startTransition），但结果返回后的 `updateTabContent` 用 `startTransition` 包装，因为大文件下 `setTabs` 触发 Monaco `value` 变化会导致昂贵重渲染。引入 `useTransition` 的 `isPending` 作为 pending 指示（与现有 `isFormatting` 并存或替代，二选一，避免语义混乱）。

#### 2. LSP 诊断更新（`LSPContext` 下游）

现状：`handleDiagnosticsChange` 用 `monacoMod.editor.setModelMarkers(...)`（命令式，**不包** startTransition）+ `notifyDiagnosticSubscribers()`。需要定位 `subscribeToDiagnostics` 的订阅者里**触发 React `setState`** 的地方，将那个 `setState` 用 `startTransition` 包装。若无订阅者触发重渲染，则此 AC 的实现方式需在 `LSPContext` 增加一个可被 transition 包裹的状态容器，或确认该场景无 React 状态更新（可记入 Completion Notes）。

#### 3. LSP 代码补全（inline completion）

现状：`LspCodeEditor.tsx` 的 `applyGhostText` / `setGhostText` / `setInlineCompletionVisible` 是 React 状态更新，用 `startTransition` 包装。`editor.executeEdits`（命令式）**不包**。

### 修改的文件

- **UPDATE** `frontend/src/hooks/useFileOperations.ts` — `handleFormat` 引入 `useTransition` + `startTransition`
- **UPDATE** `frontend/src/context/LSPContext.tsx` — 诊断触发的 React 状态更新用 `startTransition`（如适用）
- **UPDATE** `frontend/src/components/Editor/LspCodeEditor.tsx` — inline completion 相关 setState 用 `startTransition`

### 新增的文件

- **NEW** `frontend/src/hooks/useFileOperations.test.ts` — 验证 `startTransition` 包装内容更新、pending 状态
- **NEW** `tests/e2e/format-concurrent.spec.ts` — 格式化/LSP 分析的并发响应 E2E 测试

### 技术约束

1. **UX-DR3**：复杂操作时显示加载状态，保持 UI 响应（本 story 用 `useTransition` 的 `isPending` 或现有 `isFormatting`）
2. 不得改变现有快捷键行为（Ctrl+S 保存 / Ctrl+F 格式化 / Ctrl+D 定义 / Ctrl+R 重命名）
3. 保持 `formatCache`、`monacoOptimizer`、虚拟滚动（EPI3.02）等已有优化不变
4. React 版本为 18.x（`startTransition` / `useTransition` 自 React 18 起可用），import 自 `react` 顶层

### Code Review 注意事项

1. **startTransition 误用**：确认没有把 `await` 或 `editor.*` 命令式调用包进 `startTransition`
2. **pending 状态协调**：`isFormatting`（useState）与 `useTransition` 的 `isPending` 语义别冲突，避免双 loading 或加载态闪烁
3. **回归**：格式化/保存/搜索/LSP 补全/诊断显示全部保持正常
4. **引用稳定性**：`useCallback` 依赖数组正确，避免引入新的重渲染
5. **性能验证证据**：INP 或交互延迟的度量需有证据支撑（参考 EPI3-01 F11 教训——避免"已达标但无证据"）

### 参考资料

- 研究文档：`docs/research/performance-architecture-improvement-2026.md` §3.3 并发渲染优化
- React 18 `startTransition` / `useTransition` 官方文档
- 前序 story：`implementation_artifacts/epi3-01-file-search-concurrent-optimization.md`（useDeferredValue 模式）
- 前序 story：`implementation_artifacts/epi3-02-file-tree-virtual-scrolling.md`（虚拟滚动 + memo 模式）

## Dev Notes

### 实施步骤建议

1. **Step 1**：`useFileOperations.handleFormat` 引入 `useTransition`，用 `startTransition` 包裹 `updateTabContent`
2. **Step 2**：梳理 LSP 诊断更新链路（`LSPContext` → 订阅者 → setState），在触发 React 状态更新的位置加 `startTransition`
3. **Step 3**：inline completion 相关 setState 加 `startTransition`
4. **Step 4**：编写单元测试（验证 startTransition 被调用、pending 状态、回归）
5. **Step 5**：编写 E2E 测试 + 性能验证（记录 INP / 交互延迟数据作为证据）

### 关键测试场景

1. 格式化大文件时，编辑器内容更新不阻塞输入（可继续键入）
2. 格式化期间 pending 指示正确显示与消失
3. LSP 诊断批量更新时不阻塞编辑器输入
4. LSP 补全应用时不阻塞输入
5. 回归：Ctrl+S 保存、Ctrl+F 格式化、LSP 补全、诊断显示正常

### 反模式（务必避免）

- 把 `await formatCode(...)` 包进 `startTransition`
- 把 `editor.trigger(...)` / `setModelMarkers(...)` / `editor.executeEdits(...)` 包进 `startTransition`
- 双重 pending 状态导致 loading 闪烁

## Success Criteria

### 功能完整性
- [ ] 格式化内容更新通过 startTransition 包装
- [ ] LSP 诊断/补全触发的 React 状态更新通过 startTransition 包装
- [ ] UI 在重计算期间保持响应

### 代码质量
- [ ] TypeScript 类型安全
- [ ] 单元测试覆盖新增代码
- [ ] 无 ESLint 错误

### 回归
- [ ] 现有保存/格式化/搜索/LSP 功能全部正常
- [ ] 所有回归测试通过

## Dev Agent Record

### Agent Model Used

（dev-story 阶段填写）

### Debug Log References

（dev-story 阶段填写）

### Completion Notes List

（dev-story 阶段填写）

### File List

| 文件 | 操作 | 说明 |
|------|------|------|
| `frontend/src/hooks/useFileOperations.ts` | UPDATE | 引入 useTransition + startTransition |
| `frontend/src/context/LSPContext.tsx` | UPDATE | 诊断更新并发处理（如适用） |
| `frontend/src/components/Editor/LspCodeEditor.tsx` | UPDATE | inline completion 状态更新并发处理 |
| `frontend/src/hooks/useFileOperations.test.ts` | NEW | 单元测试 |
| `tests/e2e/format-concurrent.spec.ts` | NEW | E2E 测试 |

## Change Log

- 2026-09-24: 创建 story（EPI3.03 复杂操作并发处理），供 dev-story 实施