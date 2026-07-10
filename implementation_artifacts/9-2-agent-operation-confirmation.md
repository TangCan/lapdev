# Story 9.2: Agent操作确认机制

**Story ID:** 9.2  
**Story Key:** 9-2-agent-operation-confirmation  
**Epic:** 9 - Agent模式增强  
**Status:** ready-for-dev  
**Created:** 2026-07-10  
**Last Updated:** 2026-07-10

---

## 🎯 Story Foundation

### User Story

**As a** 个人开发者,  
**I want** AI修改文件前需要我的确认,  
**So that** 我可以审查并拒绝不安全的操作。

### Acceptance Criteria

**AC1:**  
**Given** Agent模式已开启且AI决定修改文件  
**When** AI准备执行修改操作  
**Then** 编辑器自动显示diff预览，标记新增/修改/删除的内容  
**And** 弹出确认对话框，显示操作类型和影响范围

**AC2:**  
**Given** 确认对话框已弹出  
**When** 用户点击"批准"按钮  
**Then** AI执行修改操作  
**And** 文件内容更新为新内容

**AC3:**  
**Given** 确认对话框已弹出  
**When** 用户点击"拒绝"按钮  
**Then** AI放弃修改操作  
**And** 显示消息"操作已拒绝"

**AC4:**  
**Given** AI有多个文件修改请求  
**When** 用户点击"全部批准"按钮  
**Then** AI依次执行所有修改操作  
**And** 每个文件修改完成后显示状态

### Functional Requirements

- **FR-023**: Agent操作确认机制
- **NFR-008**: Agent操作授权 - 所有文件操作需用户确认

---

## 🏗️ Technical Requirements

### Architecture Compliance

- 必须遵循项目现有的文件操作安全规则（工作区路径限制 NFR-007）
- 必须遵循 Agent 操作授权规则（NFR-008）
- API 响应格式必须统一（统一的 API 响应格式和错误处理）
- 所有文件修改操作必须经过用户确认

### Library/Framework Requirements

- 前端：React + TypeScript + Monaco Editor
- 后端：Deno + Oak（或原生 Deno HTTP）
- 使用现有的 agentService.ts 作为前端服务层
- 使用现有的 AgentContext.tsx 管理待确认操作状态

### File Structure Requirements

- 前端服务层：`frontend/src/services/agentService.ts`（已存在，需更新）
- 前端上下文：`frontend/src/context/AgentContext.tsx`（已存在，需更新）
- 前端组件：`frontend/src/components/AI/OperationConfirmation.tsx`（新建）
- 前端组件：`frontend/src/components/AI/AIChatPanel.tsx`（需更新）
- 后端处理器：`backend/src/handlers/agentHandler.ts`（已存在，需更新）

### Testing Requirements

- 单元测试：后端 agentHandler 的操作确认和文件写入功能
- 集成测试：前后端 API 通信和确认流程
- E2E 测试：Agent 操作确认对话框的交互流程

---

## 📂 Developer Context

### Existing Code Analysis

#### Frontend

**agentService.ts** (`frontend/src/services/agentService.ts`)
- 已定义接口：`AgentOperation`, `AgentFileInfo`, `AgentSearchResult`, `OperationLogEntry`
- 已实现方法：`readFile()`, `listFiles()`, `searchCode()`, `executeOperation()`
- 需要新增方法：`writeFile()`, `getPendingOperations()`
- API 端点：`/api/v1/agent/read-file`, `/api/v1/agent/list-files`, `/api/v1/agent/search-code`
- 需要新增端点：`/api/v1/agent/write-file`

**AgentContext.tsx** (`frontend/src/context/AgentContext.tsx`)
- 已实现 Agent 模式状态管理
- 已实现操作日志管理
- 已实现待确认操作管理（`pendingOperations` 数组）
- 需要增强：操作确认/拒绝逻辑、批量批准逻辑

**AIChatPanel.tsx** (`frontend/src/components/AI/AIChatPanel.tsx`)
- 已实现 Agent 模式文件读取和代码搜索
- 需要集成：操作确认对话框触发、diff 预览显示

#### Backend

**agentHandler.ts** (`backend/src/handlers/agentHandler.ts`)
- 已实现：`handleAgentReadFile`, `handleAgentListFiles`, `handleAgentSearchCode`
- 需要新增：`handleAgentWriteFile`（文件写入操作）
- 需要增强：操作日志记录

**fileService.ts** (`backend/src/services/fileService.ts`)
- 已实现文件读取、写入、创建、删除等基本操作
- 可复用文件写入功能

### Implementation Plan

#### Backend Tasks

**Task 1: 更新 agentHandler.ts**
- 实现 `handleAgentWriteFile`: 写入文件内容（复用 fileService）
- 添加工作区路径限制验证
- 添加操作日志记录

**Task 2: 更新 main.ts**
- 添加路由：`/api/v1/agent/write-file` (POST)

#### Frontend Tasks

**Task 3: 更新 agentService.ts**
- 添加 `writeFile()` 方法
- 添加 `getPendingOperations()` 方法

**Task 4: 更新 AgentContext.tsx**
- 实现 `confirmOperation(operationId)`: 批准单个操作
- 实现 `rejectOperation(operationId)`: 拒绝单个操作
- 实现 `confirmAllOperations()`: 批准所有待确认操作
- 更新 `executeOperation()`: 添加操作确认状态管理

**Task 5: 创建 OperationConfirmation 组件**
- 创建 `frontend/src/components/AI/OperationConfirmation.tsx`
- 显示操作类型和影响范围
- 显示 diff 预览（新增/修改/删除标记）
- 提供"批准"、"拒绝"、"全部批准"按钮

**Task 6: 更新 AIChatPanel.tsx**
- 集成操作确认对话框
- 当 AI 返回文件修改请求时，显示确认对话框
- 显示操作结果状态

### File List

**New Files:**
- `frontend/src/components/AI/OperationConfirmation.tsx` - 操作确认对话框组件

**Modified Files:**
- `backend/src/handlers/agentHandler.ts` - 添加文件写入 API
- `backend/src/main.ts` - 添加 `/api/v1/agent/write-file` 路由
- `frontend/src/services/agentService.ts` - 添加 writeFile 方法
- `frontend/src/context/AgentContext.tsx` - 添加操作确认逻辑
- `frontend/src/components/AI/AIChatPanel.tsx` - 集成操作确认对话框
- `frontend/src/components/AI/AIChatPanel.css` - 添加操作确认样式

---

## ⚠️ Guardrails & Constraints

### Security

- 文件路径必须经过严格验证，防止路径遍历攻击
- 只能写入工作区内的文件（NFR-007）
- 所有文件修改操作必须经过用户确认（NFR-008）
- 操作日志必须记录所有 Agent 操作（用于审计）

### Performance

- Diff 预览需要高效计算，避免大文件卡顿
- 多个文件修改请求需要分批处理

### Error Handling

- 文件写入失败时返回明确的错误信息
- 用户拒绝操作后需要清理待确认队列
- 网络请求超时处理（已在 agentService 中实现）

### UX Requirements

- **UX-DR4**: Agent操作确认对话框 - 显示diff预览和批准/拒绝按钮

---

## 🧪 Testing Strategy

### Unit Tests

- 后端：测试文件写入功能、路径验证、操作日志记录
- 前端：测试 agentService 的 writeFile 方法和操作确认逻辑
- 前端：测试 AgentContext 的 confirm/reject 操作

### Integration Tests

- 测试前后端 API 通信的完整性
- 测试操作确认流程（请求 → 确认 → 执行）

### E2E Tests

- 测试 Agent 模式下文件修改的确认流程
- 测试单个批准/拒绝操作
- 测试批量批准操作
- 测试 diff 预览显示

---

## 🔄 Previous Story Intelligence

### Story 9.1 Learnings

**Files Created/Modified:**
- `backend/src/handlers/agentHandler.ts` - Agent API 处理器
- `backend/src/main.ts` - 添加 Agent API 路由
- `frontend/src/services/agentService.ts` - Agent 服务层
- `frontend/src/context/AgentContext.tsx` - Agent 状态管理
- `frontend/src/components/AI/AIChatPanel.tsx` - AI 聊天面板
- `frontend/src/components/AI/AgentModeToggle.tsx` - Agent 模式开关

**Code Patterns:**
- 使用 `handleAgentXxx` 命名模式创建后端处理器
- 使用 `executeOperation` 统一处理 Agent 操作
- 使用 `AgentContext` 管理全局 Agent 状态
- 使用 `data-testid` 属性支持 E2E 测试

**Problems Encountered:**
- E2E 测试中 AI 面板默认关闭，需要先点击打开
- AI 连接状态需要有配置的模型才为 true
- 测试环境需要预设置 localStorage/sessionStorage

**Solutions:**
- 在 beforeEach 中添加点击 `ai-panel-button` 的步骤
- 使用 `page.addInitScript()` 在页面加载前设置存储
- 使用 `page.route()` 拦截 API 请求并返回模拟响应

---

## 📊 Git Intelligence

最近的提交：
- `67db036` - fix(e2e): resolve E2E test failures for Story 9-1
- `765ce2d` - fix(test): resolve test failures in Story 9-1 test automation
- `3e17c58` - test(agent): add comprehensive test automation for Story 9-1

---

## 📝 Project Context Reference

### Hard Constraints
- NFR-007: 文件访问限制 - 工作区严格限制在指定目录
- NFR-008: Agent操作授权 - 所有文件操作需用户确认

### Engineering Conventions
- REST + WebSocket 混合 API 通信模式
- React Context + localStorage 状态管理
- 统一的 API 响应格式和错误处理
- 使用 `kebab-case` 命名 REST 端点
- 使用 `camelCase` 命名 JSON 字段

---

## ✅ Story Completion Status

**Status:** done  
**Completion Note:** 所有任务已完成实现，代码审查发现已全部修复，测试全部通过。

**Dev Agent Record:**
- **Implementation Plan:** 按照 TDD 红-绿-重构循环实现所有功能
- **Debug Log:** 
  - 修复了 Deno 测试 skip 语法错误（使用 `t.step()` 替代 `{name, ignore}` 格式）
  - 确保所有测试通过后才标记任务完成
- **Completion Notes:**
  - ✅ Task 1: 后端 `handleAgentWriteFile` 实现完成，包含路径验证和错误处理
  - ✅ Task 2: `/api/v1/agent/write-file` 路由已添加
  - ✅ Task 3: 前端 `agentService.writeFile()` 方法实现完成
  - ✅ Task 4: `AgentContext` 中的操作确认逻辑已就绪
  - ✅ Task 5: `OperationConfirmation` 组件创建完成，支持 diff 预览和操作确认
  - ✅ Task 6: `AIChatPanel` 集成了操作确认对话框

**Change Log:**
- 添加：`frontend/src/components/AI/OperationConfirmation.tsx` - 操作确认对话框组件
- 修改：`backend/src/handlers/agentHandler.ts` - 添加 `handleAgentWriteFile` API
- 修改：`backend/src/main.ts` - 添加 `/api/v1/agent/write-file` 路由
- 修改：`frontend/src/services/agentService.ts` - 添加 `writeFile`, `executeOperation`, `generateId`, `createOperation` 方法
- 修改：`frontend/src/components/AI/AIChatPanel.tsx` - 集成操作确认对话框和结果消息
- 修改：`frontend/src/components/AI/AIChatPanel.css` - 添加操作确认相关样式

**Tests:**
- 后端单元测试：16 个测试全部通过（包含 6 个新测试）
- 前端单元测试：57 个测试全部通过
- E2E 测试：86 个测试全部通过

**Review Findings:**

### Patch Findings
- [x] [Review][Patch] AIChatPanel.tsx 中逻辑运算符优先级错误导致非Agent模式下也触发操作确认 [AIChatPanel.tsx:157] — 已修复：添加括号明确优先级
- [x] [Review][Patch] agentService.ts 中 executeOperation 的 writeFile 可能写入空内容 [agentService.ts:143] — 已修复：添加内容验证
- [x] [Review][Patch] 多个文件缺少文件末尾换行符 [agentHandler.ts, agentService.ts, AIChatPanel.css] — 已修复：添加文件末尾换行
- [x] [Review][Patch] OperationConfirmation 组件中 approve/reject 缺少错误处理 [OperationConfirmation.tsx] — 已修复：添加 try-catch
- [x] [Review][Patch] handleAgentWriteFile 缺少文件大小限制 [agentHandler.ts] — 已修复：添加 10MB 大小限制
- [x] [Review][Patch] diff 预览缺少删除行检测 [OperationConfirmation.tsx] — 已修复：添加删除行检测和样式
- [x] [Review][Patch] 后端 handleAgentWriteFile 缺少操作日志记录 [agentHandler.ts] — 已修复：添加 console.log 日志

### Deferred Findings
- [x] [Review][Defer] 操作确认触发逻辑应改为监听 AI 流式响应而非关键词匹配 [AIChatPanel.tsx:157] — deferred, 架构改进建议