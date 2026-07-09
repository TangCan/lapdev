# Story 9.1: Agent文件读取能力

**Story ID:** 9.1  
**Story Key:** 9-1-agent-file-reading  
**Epic:** 9 - Agent模式增强  
**Status:** ready-for-dev  
**Created:** 2026-07-09  
**Last Updated:** 2026-07-09

---

## 🎯 Story Foundation

### User Story

**As a** 个人开发者,  
**I want** Agent模式下AI可以读取项目文件内容,  
**So that** AI可以理解代码上下文并提供更精准的建议。

### Acceptance Criteria

**AC1:**  
**Given** 用户在AI面板中开启了Agent模式  
**When** AI需要读取文件来理解上下文  
**Then** AI自动读取当前打开的文件内容  
**And** 用户在活动日志中看到"读取文件: xxx"的记录

**AC2:**  
**Given** Agent模式已开启  
**When** AI需要搜索代码  
**Then** AI可以遍历工作区目录查找匹配的文件  
**And** 搜索结果显示在聊天面板中

**AC3:**  
**Given** 用户关闭了Agent模式  
**When** AI尝试读取文件  
**Then** 显示提示"请先开启Agent模式"

### Functional Requirements

- **FR-022**: Agent模式文件读取

---

## 🏗️ Technical Requirements

### Architecture Compliance

- 必须遵循项目现有的文件操作安全规则（工作区路径限制 NFR-007）
- 必须遵循 Agent 操作授权规则（NFR-008）
- API 响应格式必须统一（统一的 API 响应格式和错误处理）

### Library/Framework Requirements

- 前端：React + TypeScript + Monaco Editor
- 后端：Deno + Oak（或原生 Deno HTTP）
- 使用现有的 agentService.ts 作为前端服务层

### File Structure Requirements

- 前端服务层：`frontend/src/services/agentService.ts`（已存在）
- 前端上下文：`frontend/src/context/AgentContext.tsx`（已存在）
- 后端处理器：`backend/src/handlers/agentHandler.ts`（新建）
- 后端入口：`backend/src/main.ts`（需更新）

### Testing Requirements

- 单元测试：后端 agentHandler 的文件读取和搜索功能
- 集成测试：前后端 API 通信
- E2E 测试：Agent 模式下的文件读取和搜索流程

---

## 📂 Developer Context

### Existing Code Analysis

#### Frontend

**agentService.ts** (`frontend/src/services/agentService.ts`)
- 已定义接口：`AgentOperation`, `AgentFileInfo`, `AgentSearchResult`, `OperationLogEntry`
- 已实现方法：`readFile()`, `listFiles()`, `searchCode()`, `executeOperation()`
- API 端点：`/api/v1/agent/read-file`, `/api/v1/agent/list-files`, `/api/v1/agent/search-code`
- 路径验证：已实现路径遍历攻击防护和非法字符检查

**AgentContext.tsx** (`frontend/src/context/AgentContext.tsx`)
- 已实现 Agent 模式状态管理
- 已实现操作日志管理
- 已实现待确认操作管理

#### Backend

**main.ts** (`backend/src/main.ts`)
- 当前没有 Agent API 路由
- 需要添加 `/api/v1/agent/read-file`, `/api/v1/agent/list-files`, `/api/v1/agent/search-code` 路由

**fileService.ts** (`backend/src/services/fileService.ts`)
- 已实现文件读取、写入、创建、删除等基本操作
- 可复用文件读取功能

### Implementation Plan

#### Backend Tasks

**Task 1: 创建 agentHandler.ts** ✅
- 创建 `backend/src/handlers/agentHandler.ts`
- 实现 `handleAgentReadFile`: 读取文件内容（复用 fileService）
- 实现 `handleAgentListFiles`: 列出目录内容
- 实现 `handleAgentSearchCode`: 搜索代码
- 添加工作区路径限制验证

**Task 2: 更新 main.ts** ✅
- 在 main.ts 中导入 agentHandler
- 添加路由：`/api/v1/agent/read-file` (POST)
- 添加路由：`/api/v1/agent/list-files` (POST)
- 添加路由：`/api/v1/agent/search-code` (POST)

#### Frontend Tasks

**Task 3: 在 AIChatPanel 中集成文件读取** ✅
- 当 Agent 模式开启且用户发送消息时，自动读取当前打开的文件
- 将文件内容作为上下文发送给 AI
- 在操作日志中记录读取操作

**Task 4: 在 AIChatPanel 中集成代码搜索** ✅
- 实现搜索功能的 UI（搜索框、搜索按钮）
- 调用 agentService.searchCode() 搜索代码
- 在聊天面板中显示搜索结果

**Task 5: 添加 Agent 模式关闭时的提示** ✅
- 在 agentService 中添加 Agent 模式检查
- 当 Agent 模式关闭且尝试读取文件时，显示提示

### File List

**New Files:**
- `backend/src/handlers/agentHandler.ts` - Agent API 处理器

**Modified Files:**
- `backend/src/main.ts` - 添加 Agent API 路由
- `frontend/src/components/AI/AIChatPanel.tsx` - 集成文件读取和代码搜索功能
- `frontend/src/components/AI/AIChatPanel.css` - 添加搜索栏和结果样式

### Change Log

- 2026-07-09: 创建 agentHandler.ts，实现读取文件、列出目录、搜索代码三个 API
- 2026-07-09: 更新 main.ts，添加 Agent API 路由
- 2026-07-09: 更新 AIChatPanel.tsx，集成文件自动读取和代码搜索功能
- 2026-07-09: 更新 AIChatPanel.css，添加搜索栏和结果样式

---

## ⚠️ Guardrails & Constraints

### Security

- 文件路径必须经过严格验证，防止路径遍历攻击
- 只能读取工作区内的文件（NFR-007）
- 搜索范围限制在工作区内

### Performance

- 大文件读取时需要考虑内存使用
- 搜索操作需要限制文件数量和大小

### Error Handling

- 文件不存在时返回明确的错误信息
- 权限不足时返回明确的错误信息
- 网络请求超时处理（已在 agentService 中实现）

---

## 🧪 Testing Strategy

### Unit Tests

- 后端：测试文件读取、目录列出、代码搜索功能
- 前端：测试 agentService 的路径验证和 API 调用

### Integration Tests

- 测试前后端 API 通信的完整性
- 测试 Agent 模式状态对文件读取的影响

### E2E Tests

- 测试 Agent 模式开启时文件自动读取
- 测试代码搜索功能
- 测试 Agent 模式关闭时的提示

---

## 🔄 Previous Story Intelligence

本故事是 Epic 9 的第一个故事，没有前一个故事的经验可以借鉴。

---

## 📊 Git Intelligence

最近的提交：
- `7884e3d` - fix(action-items): implement all retrospective action items
- `4caeeec` - docs(retro): add retrospectives for Epic 7 and Epic 8
- `332d7e4` - feat(lsp): implement hover provider with full AC compliance

---

## 📝 Project Context Reference

### Hard Constraints
- NFR-007: 文件访问限制 - 工作区严格限制在指定目录
- NFR-008: Agent操作授权 - 所有文件操作需用户确认

### Engineering Conventions
- REST + WebSocket 混合 API 通信模式
- React Context + localStorage 状态管理
- 统一的 API 响应格式和错误处理

---

## ✅ Story Completion Status

**Status:** review  
**Completion Note:** 所有任务已完成，包含后端 Agent API 和前端文件读取/搜索功能集成。