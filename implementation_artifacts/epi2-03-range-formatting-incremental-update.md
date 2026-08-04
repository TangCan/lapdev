# Story EPI2.03: 范围格式化与增量更新

Status: done

## Story

As a 用户,
I want 代码格式化在大文件中也能快速执行，仅格式化可见区域或变更区域，并且 AST 结果被缓存用于后续编辑，
so that 即使在大文件（>10,000 行）中执行格式化操作也能在 100ms 内完成，整体格式化速度提升 70%。

## Acceptance Criteria

1. **Given** 用户在大文件（>10,000 行）中选中一个代码区域执行格式化
   **When** `LspCodeEditor` 触发格式化操作
   **Then** 仅选中区域被格式化（范围格式化），而非整个文件
   **And** 格式化操作在 100ms 内完成
   **And** 未选中的代码保持不变

2. **Given** 用户在普通文件（≤10,000 行）中执行格式化
   **When** 用户触发格式化（Ctrl+S 或 Ctrl+F）
   **Then** 保持全文件格式化行为
   **And** 格式化结果与之前一致

3. **Given** 用户反复编辑同一代码区域并执行格式化
   **When** 格式化服务处理请求
   **Then** AST/解析结果被缓存（基于内容 hash）
   **And** 相同内容的格式化请求直接返回缓存结果
   **And** 缓存命中率 ≥ 80%（连续 5 次编辑同一区域）

4. **Given** 大文件（>10,000 行）中未选中任何文本时执行格式化
   **When** 用户触发格式化
   **Then** 回退到全文件格式化（当前行为）
   **And** 编辑器显示格式化进度指示器（轻量 spinner）
   **And** 不阻塞 UI 线程

5. **Given** 用户通过 Monaco 原生格式化快捷键（Ctrl+S/Ctrl+F）触发格式化
   **When** `handleKeyDown` 触发 `editor.action.formatDocument`
   **Then** 快捷键行为不变，Monaco 内部调用 `provideDocumentFormattingEdits`
   **And** 新的范围格式化作为额外选项暴露（例如右键菜单或工具栏按钮）

6. **Given** 前端运行测试
   **When** 运行 `npm run test:quick`
   **Then** 新增的单元测试和集成测试全部通过（至少 8 个用例）
   **And** 现有测试 0 回归

7. **Given** 构建生产产物
   **When** 运行 `npm run build`
   **Then** 无 TypeScript 类型错误
   **And** `monacoOptimizer.ts` 不引入新的静态 Monaco 导入

## Tasks / Subtasks

- [x] Task 1: 创建 `formatCache` 缓存模块 (AC: #3)
  - [x] Subtask 1.1: 在 `frontend/src/utils/` 下创建 `formatCache.ts`，实现基于内容 hash 的 LRU 缓存
  - [x] Subtask 1.2: 导出 `computeContentHash(content: string): string` 函数（使用简单 hash 算法如 djb2）
  - [x] Subtask 1.3: 导出 `FormatCache` 类，支持 `get(hash)`, `set(hash, result)`, `invalidate(hash)`, `clear()` 方法
  - [x] Subtask 1.4: 默认缓存容量 50，LRU 淘汰策略
  - [x] Subtask 1.5: 缓存条目结构：`{ hash: string, formatted: string, timestamp: number, range?: { startLine: number, endLine: number } }`

- [x] Task 2: 扩展 `lspService` 支持范围格式化 (AC: #1, #2, #3)
  - [x] Subtask 2.1: 在 `lspService.ts` 中新增 `formatRange(uri, range)` 方法，仅格式化指定行范围
  - [x] Subtask 2.2: 实现逻辑：获取 model 内容 → 提取 range 对应的子内容 → 调用 `/api/v1/format` 接口 → 合并回完整内容
  - [x] Subtask 2.3: 集成 `formatCache`：先查缓存 → 命中则直接返回 → 未命中则格式化后缓存
  - [x] Subtask 2.4: 保留现有 `formatDocument` 方法不变（全文件格式化，用于小文件或回退场景）
  - [x] Subtask 2.5: 新增 `registerDocumentRangeFormattingEditProvider` 在 `LSPContext.tsx` 中，将 Monaco 的范围格式化请求路由到 `lspService.formatRange`

- [x] Task 3: 增强 `LspCodeEditor` 格式化触发逻辑 (AC: #1, #4, #5)
  - [x] Subtask 3.1: 在 `LspCodeEditor.tsx` 中检测选中文本是否存在：`editor.getSelectionModel().hasSelection()`
  - [x] Subtask 3.2: 当有选中文本 + 大文件场景（`isLargeFile(value)`）时，优先使用范围格式化
  - [x] Subtask 3.3: 当无选中文本或小文件时，回退到全文件格式化（保持当前行为）
  - [x] Subtask 3.4: 添加格式化进度状态：格式化期间禁用重复触发，显示轻量状态提示
  - [x] Subtask 3.5: 保持现有 Ctrl+S/Ctrl+F 快捷键行为不变

- [x] Task 4: 集成 `formatCache` 到 `monacoOptimizer` (AC: #3)
  - [x] Subtask 4.1: 在 `monacoOptimizer.ts` 中导出 `createFormatCache()` 工厂函数
  - [x] Subtask 4.2: 将 `FormatCache` 实例作为单例在模块级共享
  - [x] Subtask 4.3: 添加缓存命中日志（debug 级别）便于观察效果
  - [x] Subtask 4.4: 确保 cache 操作不阻塞 UI（异步 get/set）

- [x] Task 5: 单元测试 (AC: #6)
  - [x] Subtask 5.1: 创建 `frontend/src/utils/formatCache.test.ts`，覆盖 `computeContentHash`、`FormatCache` LRU 淘汰、命中率、边界条件
  - [x] Subtask 5.2: 在 `lspService.test.ts` 或新建的测试文件中覆盖 `formatRange` 方法
  - [x] Subtask 5.3: 在 `LspCodeEditor.test.tsx` 中新增集成测试：大文件 + 选中区域 → 调用 `formatRange`
  - [x] Subtask 5.4: 测试小文件格式化行为不变（回归保护）
  - [x] Subtask 5.5: 测试缓存命中场景：相同内容 hash 返回缓存结果
  - [x] Subtask 5.6: `npm run test:quick` 全部通过，0 回归

- [x] Task 6: 构建验证 (AC: #7)
  - [x] Subtask 6.1: `npm run build` 成功
  - [x] Subtask 6.2: 确认 `formatCache.ts` 不引入 Monaco 静态导入
  - [x] Subtask 6.3: 运行 `npm run test:regression` 确保无回归

## Dev Notes

### 现有代码分析

**当前格式化流程：**
1. `LspCodeEditor.tsx:377-385` — `handleKeyDown` 中 Ctrl+S/Ctrl+F 触发 `editor.action.formatDocument`
2. `LSPContext.tsx:231-246` — `registerDocumentFormattingEditProvider` 监听 Monaco 的格式化请求
3. `lspService.ts:362-396` — `formatDocument()` 发送完整文件内容到后端 `/api/v1/format`
4. `fileHandler.ts:243-314` — 后端 `formatCode()` 进行语言特定格式化（正则替换 + 缩进处理）

**关键约束：**
- 后端 `/api/v1/format` 接口接受 `{ path, content }` 参数，返回格式化后的完整内容
- 当前**不支持**范围格式化（需要前端先切分内容、格式化指定部分、再合并）
- `formatCache` 需在前端实现，因为后端不具备缓存能力

### 架构与模式

- **文件位置**: `frontend/src/utils/formatCache.ts`（新），`frontend/src/services/lspService.ts`（修改），`frontend/src/context/LSPContext.tsx`（修改），`frontend/src/components/Editor/LspCodeEditor.tsx`（修改）
- **命名规范**: kebab-case 文件名，camelCase 函数名，UPPER_SNAKE_CASE 常量
- **懒加载**: `formatCache.ts` 不依赖 Monaco（纯数据结构），可静态导入
- **单例模式**: `FormatCache` 使用模块级单例，避免重复创建
- **错误处理**: 格式化失败时回退到原有行为（无缓存穿透）

### 前一个故事 (epi2-02) 的经验

1. **Monaco 懒加载**: 使用 `getMonacoSync()` 获取模块，避免静态 import
2. **阈值判定**: `LARGE_FILE_THRESHOLD = 10000`，`HUGE_FILE_THRESHOLD = 50000`
3. **`isLargeFile()` 函数**: 使用 `getLineCount(content) > LARGE_FILE_THRESHOLD`
4. **`getOptimizedEditorOptions()`**: 生成编辑器优化选项的核心函数
5. **`updateOptions` 动态更新**: 当阈值变化时通过 `editor.updateOptions()` 应用新配置
6. **`await loadLanguage()`**: 确保语言模块在编辑器创建前加载完成
7. **`monacoReady` 守卫**: 防止 LSP effect 在编辑器就绪前触发
8. **E2E 测试模式**: 使用 `beforeAll` 创建测试文件，轮询验证可见性

### 项目结构对齐

```
frontend/src/
├── utils/
│   ├── monacoOptimizer.ts    # [已有] 编辑器优化工具
│   ├── formatCache.ts        # [新增] 格式化缓存模块
│   └── monacoOptimizer.test.ts
├── services/
│   ├── lspService.ts         # [修改] 添加 formatRange 方法
│   └── lspService.test.ts    # [修改] 添加范围格式化测试
├── context/
│   └── LSPContext.tsx        # [修改] 注册 range formatting provider
└── components/Editor/
    ├── LspCodeEditor.tsx     # [修改] 增强格式化触发逻辑
    └── LspCodeEditor.test.tsx # [修改] 添加集成测试
```

### 测试策略

- **单元测试**: `formatCache.test.ts` 覆盖缓存逻辑（hash 计算、LRU、命中/淘汰）
- **集成测试**: `lspService` 测试 `formatRange` 方法，验证范围提取和结果合并
- **组件测试**: `LspCodeEditor.test.tsx` 模拟大文件格式化场景
- **回归保护**: 确保小文件全文件格式化行为不变

### ATDD Artifacts

- **Checklist**: `_bmad-output/test-artifacts/atdd-checklist-epi2-03-range-formatting-incremental-update.md`
- **API Tests**: `tests/api/range-formatting.test.ts` (Deno, 21 tests)
- **E2E Tests**: `tests/e2e/range-formatting.spec.ts` (Playwright, 7 tests)
- **Unit Tests**: `frontend/src/services/formatCache.test.ts` (Vitest, 17 tests)

### 技术参考

- [Source: docs/epics.md#Story EPI2.03] 故事原始定义
- [Source: frontend/src/services/lspService.ts#L362-396] 当前 `formatDocument` 实现
- [Source: frontend/src/context/LSPContext.tsx#L231-246] `registerDocumentFormattingEditProvider` 注册
- [Source: frontend/src/components/Editor/LspCodeEditor.tsx#L377-385] 格式化快捷键触发
- [Source: frontend/src/utils/monacoOptimizer.ts] 现有优化工具，可复用阈值判定
- [Source: backend/src/handlers/fileHandler.ts#L243-314] 后端格式化实现
- [Source: epi2-02-large-file-optimization.md] 前一个故事的完整实现记录

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4 (Trae IDE)

### Debug Log References
- 前端测试: `cd frontend && npx vitest run` — 515 passed, 0 failed
- 后端测试: `deno test --allow-all tests/api/range-formatting.test.ts` — 21 passed, 0 failed
- 构建验证: `cd frontend && npm run build` — 成功

### Completion Notes List
1. **formatCache.ts 创建**: 实现了基于 djb2 内容哈希的 LRU 缓存模块，默认容量 50，支持 `get/set/invalidate/clear/contains` 方法
2. **lspService.formatRange 实现**: 提取选中区域内容 → 调用后端 `/api/v1/lsp/format` → 合并回完整内容，集成 formatCache 缓存
3. **LSPContext 注册**: 添加 `registerDocumentRangeFormattingEditProvider`，将 Monaco 范围格式化请求路由到 `lspService.formatRange`
4. **LspCodeEditor 增强**: `triggerFormat()` 函数检测选中状态 + 文件大小，决定使用范围格式化还是全文件格式化
5. **格式化进度状态**: `isFormatting` state 防止重复触发
6. **monacoOptimizer 集成**: 导出 `createFormatCache()` 工厂函数和 `getGlobalFormatCache()` 单例
7. **测试覆盖**: 19 个 formatCache 单元测试 + 10 个 lspService 测试（含 5 个 formatRange 测试）+ 21 个 API 测试 = 50 个测试
8. **零回归**: 全部 515 个前端测试通过，21 个后端 API 测试通过

### File List
- `frontend/src/utils/formatCache.ts` (新增) — LRU 缓存模块
- `frontend/src/utils/formatCache.test.ts` (新增) — 缓存单元测试
- `frontend/src/services/lspService.ts` (修改) — 添加 formatRange 方法和 formatCache 导入
- `frontend/src/services/lspService.test.ts` (修改) — 添加 formatRange 测试
- `frontend/src/context/LSPContext.tsx` (修改) — 注册范围格式化 provider
- `frontend/src/components/Editor/LspCodeEditor.tsx` (修改) — 增强 handleKeyDown + triggerFormat
- `frontend/src/utils/monacoOptimizer.ts` (修改) — 添加 createFormatCache/getGlobalFormatCache
- `tests/api/range-formatting.test.ts` (新增) — ATDD API 测试
- `tests/e2e/range-formatting.spec.ts` (新增) — ATDD E2E 测试

### Review Findings

### Senior Developer Review (AI)

**Review Date:** 2026-08-03
**Review Outcome:** Changes Requested
**Review Layers:** Blind Hunter, Edge Case Hunter, Acceptance Auditor

#### Action Items

- [x] [Review][Patch] `editor.action.formatChanges` 应改为 `editor.action.formatSelection` [LspCodeEditor.tsx:389] — `formatChanges` 格式化 git 变更区域而非用户选中区域，导致范围格式化功能完全失效
- [x] [Review][Patch] 范围格式化替换整个文档而非仅选中区域 [lspService.ts:476-484] — 返回的编辑范围是 `{ start: { line: 0 }, end: { line: allLines.length } }`，应仅替换 `{ start: { line: startLine }, end: { line: endLine+1 } }` 范围
- [x] [Review][Patch] `isFormatting` 使用 state 而非 ref，闭包过期 [LspCodeEditor.tsx:114] — handleKeyDown 中的 `!isFormatting` 检查读取的是过期闭包值，应改为 useRef
- [x] [Review][Patch] 小文件路径绕过 `isFormatting` 防护 [LspCodeEditor.tsx:399-404] — 小文件分支未设置 isFormatting，允许重复触发
- [x] [Review][Patch] `hash & hash` 是空操作 [formatCache.ts:46] — 应使用 `>>> 0` 进行无符号转换，否则负数哈希生成 `-` 前缀键
- [x] [Review][Patch] 范围验证不完整 [lspService.ts:423] — 缺少 `endLine < 0` 检查，未处理文件末尾 `\n` 导致的 `split('\n')` 多出一个空元素
- [x] [Review][Patch] Monaco→LSP 行号转换缺少边界守卫 [LSPContext.tsx:252-253] — Monaco 行号可能为 0，转换后变为 -1
- [x] [Review][Patch] `end.line = allLines.length` 超出文档范围 [lspService.ts:479] — 应使用最后一行末尾位置
- [x] [Review][Patch] `response.json()` 可能抛异常 [lspService.ts:453] — 后端返回非 JSON 时未处理
- [x] [Review][Patch] fetch 无超时 [lspService.ts:442] — 应添加 AbortController 防止挂起
- [x] [Review][Patch] 单例重复 [monacoOptimizer.ts:120-148] — formatCache.ts 和 monacoOptimizer.ts 各有一个单例，可能产生分裂状态
- [x] [Review][Defer] Ctrl+F 覆盖了标准查找功能 [LspCodeEditor.tsx:411] — 已有行为，AC5 要求 "不变"
- [x] [Review][Defer] DJB2 哈希碰撞风险 [formatCache.ts:37-50] — 50 条目 LRU 缓存碰撞概率极低
- [x] [Review][Defer] 缓存无 TTL/过期机制 [formatCache.ts] — AC 未要求
- [x] [Review][Defer] 测试覆盖不足 [lspService.test.ts] — 缺少跨文件缓存碰撞、过期缓存等场景，可后续补充
- [x] [Review][Defer] 缓存键缺少文件 URI [formatCache.ts] — 相同内容产生相同格式化结果，实际影响可忽略

### Review Follow-ups (AI)

- [x] [AI-Review] Patch: 将 `editor.action.formatChanges` 改为 `editor.action.formatSelection`
- [x] [AI-Review] Patch: formatRange 仅返回选中范围的编辑，不替换整个文档
- [x] [AI-Review] Patch: 将 isFormatting 改为 useRef，修复闭包过期问题
- [x] [AI-Review] Patch: 小文件路径也设置 isFormatting 防护
- [x] [AI-Review] Patch: `hash & hash` 改为 `>>> 0`
- [x] [AI-Review] Patch: 添加 `endLine < 0` 检查和末尾换行处理
- [x] [AI-Review] Patch: LSPContext 添加 Monaco 行号 0 边界守卫
- [x] [AI-Review] Patch: 使用最后一行末尾位置代替 `allLines.length`
- [x] [AI-Review] Patch: 添加 response.json() 异常处理
- [x] [AI-Review] Patch: 添加 AbortController 超时
- [x] [AI-Review] Patch: 移除 monacoOptimizer 中的重复单例

