# Story 8.1: 注册LSP悬停提供商

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 个人开发者,
I want 鼠标悬停在代码符号上时显示类型信息和文档,
So that 我可以快速了解符号的用途和用法。

## Acceptance Criteria

1. **Given** 用户打开了一个 .ts 或 .rs 文件
   **And** LSP 服务已初始化完成
   **When** 用户将鼠标悬停在变量、函数或类名上
   **Then** 弹出浮动提示框显示符号的类型信息
   **And** 如果有文档注释，显示文档内容

2. **Given** 用户打开了一个 .ts 文件
   **When** 用户悬停在导入语句的模块名上
   **Then** 提示框显示模块导出的符号列表

3. **Given** 用户悬停在有类型错误的符号上
   **Then** 提示框显示错误信息和可能的修复建议

4. **Given** 用户悬停在泛型类型参数上
   **Then** 提示框显示类型约束和边界信息

## Tasks / Subtasks

- [ ] Task 1: 在 lspService.ts 中添加 getHover 方法 (AC: 1, 2, 3, 4)
  - [ ] Subtask 1.1: 添加 Hover 类型导入
  - [ ] Subtask 1.2: 实现 getHover 方法调用后端 API
  - [ ] Subtask 1.3: 处理返回的 MarkupContent 类型文档

- [ ] Task 2: 在 LSPContext.tsx 中注册 Monaco HoverProvider (AC: 1, 2, 3, 4)
  - [ ] Subtask 2.1: 在 registerEditor 中添加 hoverProvider 注册
  - [ ] Subtask 2.2: 实现 provideHover 回调函数
  - [ ] Subtask 2.3: 转换 LSP Hover 响应为 Monaco Hover 格式

- [ ] Task 3: 更新后端支持 hover API (AC: 1, 2, 3, 4)
  - [ ] Subtask 3.1: 在 LSP handler 中添加 hover 端点
  - [ ] Subtask 3.2: 转发 hover 请求到 LSP 服务器

- [ ] Task 4: 添加测试用例
  - [ ] Subtask 4.1: 添加单元测试验证 getHover 方法
  - [ ] Subtask 4.2: 添加 E2E 测试验证悬停提示功能

## Dev Notes

### Project Structure Notes

**当前项目结构（与架构文档略有差异）：**
```
lapdev/
├── frontend/              # React 前端应用
│   ├── src/
│   │   ├── services/
│   │   │   └── lspService.ts       # ✅ 需要修改
│   │   ├── context/
│   │   │   └── LSPContext.tsx      # ✅ 需要修改
│   │   └── ...
├── backend/               # Deno 后端
│   ├── src/
│   │   └── handlers/
│   │       └── lspHandler.ts       # ✅ 需要修改
└── ...
```

**与架构文档的差异：**
- 架构文档定义 `lapdev-web/` 和 `lapdev-server/`，实际项目使用 `frontend/` 和 `backend/`
- 架构文档定义 Rust Core Services，实际项目目前全部使用 Deno/TypeScript

### Architecture Compliance

**技术栈要求：**
- ✅ 前端：React + TypeScript + Vite
- ✅ 后端：Deno + TypeScript
- ✅ 编辑器：Monaco Editor
- ✅ LSP：vscode-languageserver-types

**命名约定：**
- ✅ 组件：PascalCase (LSPContext.tsx)
- ✅ 文件：kebab-case
- ✅ 函数/变量：camelCase

**API 通信模式：**
- ✅ REST + WebSocket 混合
- ✅ 消息协议：`{type, sessionId, payload, timestamp}`

### Library/Framework Requirements

**前端依赖：**
- monaco-editor: ^0.55.x (已安装)
- vscode-languageserver-types: ^3.17.x (已安装)

**后端依赖：**
- Deno 内置 HTTP 支持

### File Structure Requirements

**需要修改的文件：**

1. **frontend/src/services/lspService.ts**
   - 添加 Hover 类型导入
   - 添加 getHover 方法调用后端 `/v1/lsp/hover` 端点

2. **frontend/src/context/LSPContext.tsx**
   - 在 registerEditor 中注册 Monaco HoverProvider
   - 实现 provideHover 回调，调用 lspService.getHover

3. **backend/src/handlers/lspHandler.ts**
   - 添加 hover 端点处理
   - 转发请求到 LSP 服务器并返回响应

### Testing Requirements

**测试策略：**
- ✅ 单元测试：测试 getHover 方法和 hoverProvider 注册
- ✅ 集成测试：测试前后端 hover API 通信
- ✅ E2E 测试：测试鼠标悬停显示提示框

**测试框架：**
- Playwright（已有）：E2E 测试
- Deno 内置测试框架：后端单元测试
- Vitest（已有）：前端单元测试

### Previous Story Intelligence

**Epic 8 的第一个故事，无前序故事。**

**从已完成的 Story 2.2 LSP代码智能中学习：**
- LSP 服务初始化模式已成熟
- Monaco 编辑器 provider 注册模式已实现（Completion、Definition、Reference、SignatureHelp）
- 需要复用相同的模式注册 HoverProvider
- lspService 已有完整的 API 调用模式，需要添加 hover 端点

### Git Intelligence

**最近提交分析：**
- `feat(lsp): implement completion and diagnostics` - LSP 补全和诊断实现
- `feat(lsp): add definition and reference providers` - LSP 定义和引用提供商

**代码模式：**
- lspService 使用统一的 fetch 模式调用后端 API
- LSPContext 使用 Monaco.languages.registerXXXProvider 注册各类 provider
- 位置转换：Monaco (1-based) ↔ LSP (0-based)

### Latest Technical Information

**Monaco HoverProvider：**
- 使用 `Monaco.languages.registerHoverProvider` 注册
- `provideHover` 回调返回 `Monaco.languages.Hover` 对象
- Hover 对象包含 `contents`（Markdown 内容）和可选的 `range`

**LSP Hover 响应：**
- 返回 `Hover` 对象，包含 `contents` 和 `range`
- `contents` 可以是 `string` 或 `MarkupContent` 对象
- `MarkupContent` 包含 `kind`（'markdown' 或 'plaintext'）和 `value`

**最佳实践：**
- 复用现有 LSP provider 注册模式
- 正确处理 MarkupContent 到 Monaco MarkdownString 的转换
- 添加错误处理，确保悬停失败不影响编辑器正常使用

### References

- [Source: docs/prd.md#L60](file:///home/richard/richard/2026/2026/pvm_2/lapdev/docs/prd.md#L60) - LSP 智能功能需求
- [Source: docs/architecture.md#4.4](file:///home/richard/richard/2026/2026/pvm_2/lapdev/docs/architecture.md#L217) - API 与通信模式
- [Source: docs/epics.md#Epic-8](file:///home/richard/richard/2026/2026/pvm_2/lapdev/docs/epics.md#L205) - Epic 8 LSP悬停提示
- [Source: frontend/src/services/lspService.ts](file:///home/richard/richard/2026/2026/pvm_2/lapdev/frontend/src/services/lspService.ts) - LSP 服务实现
- [Source: frontend/src/context/LSPContext.tsx](file:///home/richard/richard/2026/2026/pvm_2/lapdev/frontend/src/context/LSPContext.tsx) - LSP 上下文和 Provider 注册

## Dev Agent Record

### Agent Model Used

BMAD AI Agent

### Debug Log References

### Completion Notes List

### File List
