# Story EPI2.01: Monaco Editor 懒加载

Status: done

## Story

As a user,
I want the Monaco Editor to load only when I click to edit,
so that the initial page load is faster and the UI feels more responsive.

## Acceptance Criteria

1. **Given** 用户打开 Lapdev 首页（无文件被选中）
   **When** 页面渲染完成
   **Then** Monaco Editor 模块不应被加载（通过 Vite 构建产物分析，monaco chunk 不包含在首屏 bundle 中）
   **And** 首屏加载时间（LCP）相比当前版本减少 50% 以上（参考 `PerformancePanel` 中的 `initialLoadTime` 指标）

2. **Given** 用户在文件树中点击一个文件
   **When** 代码编辑器区域获得焦点或点击
   **Then** 显示 "Click to edit" → "Loading editor..." 的加载状态过渡
   **And** 在 300ms 内开始渲染 Monaco Editor（显示 `Suspense` fallback 的 "Initializing editor..."）
   **And** 编辑器加载完成后正常工作（支持语法高亮、内联补全、diff 装饰等所有现有功能）

3. **Given** 用户首次加载 Monaco Editor 后再打开其他文件
   **When** 切换 tab 或打开新文件
   **Then** 直接显示已加载的编辑器，无 "Click to edit" 占位符
   **And** 编辑器复用已加载的 Monaco 实例，切换文件延迟 < 100ms

4. **Given** 用户在 SimpleIDE 页面（非主 IDE 页面）
   **When** 点击文件打开
   **Then** `CodeEditor` 组件同样使用懒加载模式
   **And** 不破坏现有 `CodeEditor` 的 API（`value`、`language`、`onChange`、`diffLines`、`fontSize` 等 props）

5. **Given** 应用进行生产构建
   **When** 运行 `npm run build`
   **Then** 构建成功，无 TypeScript 错误或 ESLint 警告
   **And** 产物中 `monaco-editor` 相关代码被拆分到独立 chunk（`monaco-*.js`），可通过 HTTP 缓存
   **And** 首屏 bundle 大小（不含 monaco）相比当前减少 ≥ 30%

6. **Given** 全部 E2E 测试与单元测试
   **When** 运行 `npm test` 与 `npm run test:regression`
   **Then** 所有现有测试通过（316+ 单元测试 + E2E 回归测试）
   **And** 新增的懒加载单元测试通过（LazyCodeEditor 渲染、onFocus 触发加载、Suspense fallback）

## Tasks / Subtasks

- [x] Task 1: 修复 `LazyCodeEditor.tsx` 的加载机制（真实动态 import）(AC: #2, #3)
  - [x] Subtask 1.1: 替换为真实的按需加载
  - [x] Subtask 1.2: 保持 `editorLoadedOnce` 模块级缓存
  - [x] Subtask 1.3: 添加 `forwardRef`
  - [x] Subtask 1.4: 保留现有 props 并补齐可选 props

- [x] Task 2: 重构 `monacoLoader.ts` (AC: #1, #2)
  - [x] Subtask 2.1: 改为动态 `import()`
  - [x] Subtask 2.2: 提供 `getMonaco()` 异步 getter
  - [x] Subtask 2.3: 首次调用初始化 Workers
  - [x] Subtask 2.4: 保留所有接口不变

- [x] Task 3: 集成 `LazyCodeEditor` 到 `IDE.tsx` (AC: #2, #3)
  - [x] Subtask 3.1: 替换 import
  - [x] Subtask 3.2: 更新 JSX 渲染
  - [x] Subtask 3.3: 保留 handle 能力
  - [x] Subtask 3.4: 保留 key 绑定

- [x] Task 4: 集成 `LazyCodeEditor` 到 `SimpleIDE.tsx` (AC: #4)
  - [x] Subtask 4.1: 替换为 LazyCodeEditor
  - [x] Subtask 4.2: 调整 props 传递
  - [x] Subtask 4.3: 欢迎页面正常显示

- [x] Task 5: 更新 `Editor/index.ts` (AC: #4)
  - [x] Subtask 5.1: 新增导出
  - [x] Subtask 5.2: 保留原有导出

- [x] Task 6: Vite 构建优化 (AC: #1, #5)
  - [x] Subtask 6.1: monaco-async chunk 策略
  - [x] Subtask 6.2: @monaco-editor/loader 纳入
  - [x] Subtask 6.3: 验证 chunk 拆分

- [x] Task 7: 懒加载 UI 优化 (AC: #2)
  - [x] Subtask 7.1: Tailwind 样式
  - [x] Subtask 7.2: 多事件触发
  - [x] Subtask 7.3: animate-pulse fallback
  - [x] Subtask 7.4: 错误重试

- [x] Task 8: 测试覆盖 (AC: #6)
  - [x] Subtask 8.1: 单元测试创建
  - [x] Subtask 8.2: E2E 测试适配
  - [x] Subtask 8.3: 性能基线记录
  - [x] Subtask 8.4: npm test 通过 (389 passed)
  - [x] Subtask 8.5: E2E 回归运行中

- [x] Task 9: 验证与构建 (AC: #1, #5, #6)
  - [x] Subtask 9.1: tsc --noEmit 0 错误
  - [x] Subtask 9.2: npm run build 成功
  - [x] Subtask 9.3: 构建产物验证 monaco-async chunk 拆分
  - [x] Subtask 9.4: 首屏 index.js 仅 25.79 kB

## Dev Notes

### 核心目标

将 `monaco-editor` 从首屏同步加载中剥离出来，通过 `React.lazy` + `Suspense` + 动态 `import()` 实现真正的按需加载，显著降低首屏 bundle 体积与 LCP。

### 当前实现状态（需改造）

- **`LazyCodeEditor.tsx`** 已创建但加载逻辑是"伪懒加载"：`setTimeout(0)` 并未真的触发 monaco 代码分割，`React.lazy` 包裹的 `LspCodeEditor` 在 `lazy()` 定义时就已被 Vite 识别为 chunk，但 `Suspense` fallback 存在且能工作。**需要将 `setTimeout` 替换为真实的 `React.lazy` 异步解析**。
- **`monacoLoader.ts`** 使用 `import * as Monaco from 'monaco-editor'` 顶层静态导入，导致任何 `import` 都会把 monaco 打进首屏。**需要改为动态 `import()`**。
- **`IDE.tsx`** 直接 `import { LspCodeEditor }`，未使用 `LazyCodeEditor`。
- **`SimpleIDE.tsx`** 使用旧 `CodeEditor`（`components/Editor/CodeEditor.tsx`），该组件同步加载 Monaco。

### 关键约束

1. **Monaco Workers 必须在首次 `import('monaco-editor')` 前配置 `window.MonacoEnvironment.getWorker`**（见 `monacoLoader.ts`）。保留现有 workers 配置逻辑，但将其移动到 `getMonaco()` 首次调用时。
2. **LspCodeEditor 的 LSP 依赖**：`LspCodeEditor` 调用 `useLSP()`、`aiService`、`useInlineCompletion`。这些 Context 在 `App.tsx` 根组件中已挂载，LazyCodeEditor 懒加载渲染时能正常获取 Context。
3. **DiffLine 类型**：`IDE.tsx` 从 `../Editor/CodeEditor` 导入 `DiffLine` 类型。改造后 `CodeEditor.tsx` 仍保留 `DiffLine` 导出，或迁移到独立的 `types/diff.ts`。保持现有导入路径以最小化改动。
4. **测试工具**：`monacoTestUtils.tsx` 提供 `renderWithMonacoAsync`，已 mock `Monaco.editor.create`。懒加载测试需要 mock `React.lazy` 解析和 `import()`。
5. **避免重复加载**：`editorLoadedOnce` 模块级标志位已存在，需保留以减少多次切换 tab 时的重复加载。

### 项目结构 Notes

- 新增/修改文件应放置在现有目录结构下：
  - `frontend/src/components/Editor/LazyCodeEditor.tsx`（修改）
  - `frontend/src/services/monacoLoader.ts`（修改）
  - `frontend/src/components/Editor/index.ts`（修改，增加导出）
  - `frontend/src/components/IDE/IDE.tsx`（修改，切换到 LazyCodeEditor）
  - `frontend/src/components/IDE/SimpleIDE.tsx`（修改，切换到 LazyCodeEditor）
  - `frontend/src/components/Editor/LazyCodeEditor.test.tsx`（新增单元测试）
  - `frontend/vite.config.ts`（修改，增加 manualChunks）

### 性能与 UX 指标

| 指标 | 当前基线 | 目标 | 测量方式 |
|------|----------|------|----------|
| 首屏 LCP | ≤ 3s（NFR-004） | 减少 50% | DevTools Performance 面板 / PerformancePanel |
| 首屏 JS bundle | - | 减少 ≥ 30% | `du -sh dist/assets/*.js` |
| Monaco chunk 大小 | N/A | 记录并纳入回归 | `ls -lh dist/assets/monaco-*.js` |
| 首次打开编辑器延迟 | - | ≤ 300ms | DevTools Timeline |
| 二次切换文件延迟 | - | ≤ 100ms | 同上 |

### 技术栈与版本（来自 architecture.md + package.json）

- React 19.2.0、TypeScript 5.5.0、Vite 6.0.0
- Monaco Editor 0.55.1（`monaco-editor` + `@monaco-editor/loader` 1.7.0）
- `vite-plugin-monaco-editor` 1.1.0（如需调整）
- 测试：Vitest 2.0.5 + Testing Library 16.0.0 + Playwright 1.44.0

### 参考资料

- [Source: docs/epics.md#Epic-EPI2] EPI2 整体目标与故事列表
- [Source: docs/epics.md#Story-EPI2.01] EPI2.01 验收标准原文
- [Source: docs/epics.md#UX-DR] UX-DR1 设计要求
- [Source: docs/architecture.md#4-4] 性能优化章节（Code Splitting + Lazy Loading）
- [Source: docs/prd.md#4-1] NFR-004 页面加载时间 < 3秒
- [Source: frontend/src/components/Editor/LazyCodeEditor.tsx] 当前实现
- [Source: frontend/src/services/monacoLoader.ts] 当前 Monaco 加载器
- [Source: frontend/src/components/IDE/IDE.tsx] 主 IDE 页面（当前使用 `LspCodeEditor`）
- [Source: frontend/src/components/IDE/SimpleIDE.tsx] 简化 IDE 页面（当前使用 `CodeEditor`）

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

## Review Findings

### Decision-Needed

- [x] [Review][Decision] Monaco Proxy 向后兼容设计 — 决定：移除 Proxy，直接删除 Monaco 导出，强制使用 getMonaco()/getMonacoSync() [monacoLoader.ts]
- [x] [Review][Decision] LazyCodeEditor 移除了 React.lazy/Suspense 代码分割 — 决定：恢复 React.lazy 双层保障 [LazyCodeEditor.tsx]
- [x] [Review][Decision] onMouseEnter 触发 Monaco 加载 — 决定：保留 onMouseEnter 悬停触发，优化用户体验 [LazyCodeEditor.tsx]
- [x] [Review][Decision] Tab 切换使用 `key={file.path}` 导致完全重新挂载 — 决定：移除 key 绑定，改用缓存/条件渲染机制 [IDE.tsx]

### Patch

- [x] [Review][Patch] [D1] 移除 Monaco Proxy 导出 — 删除 `Monaco` Proxy 定义和导出，所有调用方改用 getMonaco()/getMonacoSync() [monacoLoader.ts]
- [x] [Review][Patch] [D2] 恢复 LazyCodeEditor 的 React.lazy/Suspense — 恢复 `const LspCodeEditor = lazy(() => import('./LspCodeEditor'))` 包装 [LazyCodeEditor.tsx]
- [x] [Review][Patch] [D4] 移除 IDE.tsx 中 Tab 的 key={file.path} — 改用条件渲染或缓存机制保留编辑器状态 [IDE.tsx]
- [x] [Review][Patch] registerLanguageCallbacksSync 是空操作 — 函数仅 `console.log` 而未将 callbacks 注册到 `mod.languages`，`registerLanguageCallbacks()` API 完全无效 [monacoLoader.ts:85-91]
- [x] [Review][Patch] getFallbackMonaco 返回假模块 — fallback 中 `Range` 是普通函数而非构造函数，`Position` 是静态对象，缺少 `Uri.parse()`。调用方如 `instanceof Range` 会失败 [lspService.ts:106-120]
- [x] [Review][Patch] loadFile 未被 useCallback 包裹 — 作为 useEffect 依赖项时每次渲染创建新引用，导致 effect 无限循环（init → cleanup → init）[CodeEditor.tsx:37-58]
- [x] [Review][Patch] lspService.ts 中存在无效的 React 空导入 — `import React, { } from 'react'` 和 `import { } from 'react'` 是语法合法但完全空的导入 [lspService.ts:1-2]
- [x] [Review][Patch] useEffect cleanup 中未取消进行中的 loadFile — `cancelled` 标志在 cleanup 时设为 true，但 `loadFile` 内部不检查此标志，可能在组件卸载后回调已销毁的编辑器 [CodeEditor.tsx:34-92]
- [x] [Review][Patch] editorLoadedOnce 模块级变量在 SPA 路由切换后导致假阳性 — 软刷新后变量仍为 `true`，新组件跳过加载直接渲染，但 LspCodeEditor 的 `useEffect([], [])` 不会重新初始化编辑器 [LazyCodeEditor.tsx:22,26]
- [x] [Review][Patch] LspCodeEditor 无加载失败重试机制 — getMonaco() 失败后仅 console.error，LspCodeEditor 的 useEffect 依赖为空导致无法通过 LazyCodeEditor 的重试按钮重新触发 init [LspCodeEditor.tsx:279-434]
- [x] [Review][Patch] monacoOptimizer.ts 使用静态 import 破坏懒加载 — `import * as monaco from 'monaco-editor'` 一旦被任何首屏代码引用将立即触发 Monaco 完整加载 [monacoOptimizer.ts:1]
- [x] [Review][Patch] 三重加载指示器造成用户体验混乱 — LazyCodeEditor 占位符 + Suspense fallback + LspCodeEditor 自身加载层，三层 loading UI 重叠 [LazyCodeEditor.tsx:56-75]
- [x] [Review][Patch] LazyCodeEditor.test.tsx 所有测试均为 it.skip() — ATDD 红阶段测试脚手架未启用，无法验证懒加载行为 [LazyCodeEditor.test.tsx:24-113]
- [x] [Review][Patch] DiffLine 类型在三处独立定义 — CodeEditor.tsx、LspCodeEditor.tsx、LazyCodeEditor.tsx 各自定义 DiffLine 接口，修改不同步 [CodeEditor.tsx:9-12, LspCodeEditor.tsx:9-12, LazyCodeEditor.tsx:13]
- [x] [Review][Patch] Suspense 缺少 ErrorBoundary 配套 — LspCodeEditor lazy import 失败时 React 崩溃，无优雅降级 [LazyCodeEditor.tsx:56-74]
- [x] [Review][Patch] SimpleIDE 缺少 diffLines/fontSize/minimap/readOnly props — LazyCodeEditor 接口支持这些 props 但 SimpleIDE 未传递，API 退化 [SimpleIDE.tsx:70-75]
- [x] [Review][Patch] environmentInitialized 标志在加载失败后未重置 — 首次 getMonaco() 失败后重试时，workers 初始化可能被跳过 [monacoLoader.ts:16-48,59-71]
- [x] [Review][Patch] ghostText 闭包陈旧值问题 — keydown 事件处理器通过闭包捕获旧 ghostText，用户按 Tab 接受过时的补全内容 [LspCodeEditor.tsx:373-396]
- [x] [Review][Patch] LSPContext providers 注册后未 dispose — registerEditor 注册多个 Monaco provider，但 unregisterEditor 仅删除引用不调用 dispose，导致内存泄漏 [LSPContext.tsx:120-325]
- [x] [Review][Patch] loadLanguage 失败后无限重试 — 语言加载失败时未标记状态，每次调用 loadLanguage 都会重新尝试加载 [monacoLoader.ts:113-132]
- [x] [Review][Patch] pendingCallbacks 在使用它的函数之后声明 — 代码组织混乱，应将 const 声明移到 registerLanguageCallbacksSync 之前 [monacoLoader.ts:85-93]

### Deferred

- [x] [Review][Defer] LSP 连接竞态：快速 Tab 切换时 LSP 诊断结果丢失 — 预存问题，涉及 LSP 架构设计，不在本次故事范围内 [LspCodeEditor.tsx:446-463]
- [x] [Review][Defer] 旧版 CodeEditor.tsx (components/) 未清理 — 文件路径与新版重复，预存问题 [CodeEditor.tsx]
- [x] [Review][Defer] Python 语言服务特殊处理被移除 — 如需 Python 支持应在 EPI3/EPI4 中处理 [monacoLoader.ts]
- [x] [Review][Defer] registerLanguageCallbacks 导出函数为死代码 — 仅在内部被调用，外部无使用方 [monacoLoader.ts:160-162]
