# Story 3.4: Agent模式

## 基本信息

| 字段 | 值 |
|------|-----|
| **Story ID** | 3.4 |
| **Story Key** | 3-4-agent-mode |
| **Epic** | Epic 3: AI功能（BYOK模式） |
| **Status** | ready-for-dev |
| **Created** | 2026-06-02 |
| **Updated** | 2026-06-02 |

## 用户故事

**As a** 个人开发者,
**I want** AI Agent自动执行任务,
**So that** 提高开发效率。

## 业务价值

Agent模式允许AI自主读取项目文件、分析代码结构，并在用户确认后自动修改代码，大幅提升开发效率。

## 验收标准

### AC-1: Agent模式开启

**Given** 用户在AI面板中  
**When** 开启Agent模式  
**Then** AI可以自主读取文件和搜索代码  
**And** Agent模式指示器显示为激活状态

### AC-2: 文件修改预览

**Given** AI决定修改文件  
**When** 准备操作  
**Then** 编辑器自动显示diff预览  
**And** 弹出确认对话框，列出所有待执行的操作

### AC-3: 操作确认机制

**Given** 用户看到确认对话框  
**When** 做出选择  
**Then** 可逐个批准或拒绝操作  
**And** 可一次性全部批准所有操作  
**And** 拒绝的操作被跳过，不执行

### AC-4: 操作日志记录

**Given** Agent执行操作  
**When** 完成操作  
**Then** 所有操作记录在活动日志中  
**And** 日志包含操作类型、文件路径、时间戳和操作结果

## 功能需求引用

- FR-022: Agent模式文件读取
- FR-023: Agent操作确认机制  
- FR-024: Agent操作日志
- NFR-008: Agent操作授权 - 所有文件操作需用户确认

## 技术要求

### 架构约束

1. **安全性**: 所有文件操作必须经过用户确认才能执行
2. **可追溯性**: 所有Agent操作必须记录到日志系统
3. **隔离性**: Agent模式应有独立的开关控制

### 技术实现

#### 1. Agent模式状态管理

- 在AIContext中添加`isAgentMode`状态
- 提供`setAgentMode`方法切换模式

#### 2. 文件读取API扩展

- 扩展aiService添加文件读取方法
- 支持目录遍历和文件内容读取
- 支持代码搜索功能

#### 3. 操作确认组件

- 创建AgentOperationModal组件
- 显示diff预览（使用现有的diff装饰器）
- 支持单个/批量确认操作

#### 4. 操作日志系统

- 创建OperationLogContext管理操作日志
- 日志条目包含：操作类型、文件路径、时间、结果、详细信息
- 提供日志查看UI

### 文件结构

```
frontend/
├── src/
│   ├── context/
│   │   └── AgentContext.tsx      # Agent模式状态管理
│   │   └── OperationLogContext.tsx  # 操作日志管理
│   ├── services/
│   │   └── agentService.ts       # Agent服务
│   ├── components/
│   │   └── AI/
│   │       └── AgentOperationModal.tsx  # 操作确认弹窗
│   │       └── AgentModeToggle.tsx     # 模式切换开关
│   │       └── OperationLog.tsx        # 操作日志面板
```

### API接口

**POST /api/v1/agent/read-file**
- 读取指定文件内容

**POST /api/v1/agent/list-files**  
- 列出目录下的文件

**POST /api/v1/agent/search-code**
- 搜索代码内容

**POST /api/v1/agent/execute-operation**
- 执行文件操作（需要用户确认）

## 安全性要求

1. **操作授权**: 所有文件写入操作必须经过用户手动确认
2. **路径限制**: Agent只能访问工作区内的文件
3. **日志审计**: 所有操作必须记录，便于追溯

## 测试要求

### 单元测试

- AgentContext状态管理测试
- agentService文件操作测试
- OperationLogContext日志管理测试

### E2E测试

- Agent模式开启/关闭功能测试
- 文件读取功能测试
- 操作确认流程测试
- 操作日志记录测试

## 依赖关系

- 依赖于3-1-ai-model-config（AI模型配置）
- 依赖于3-2-ai-chat-panel（AI聊天面板）
- 依赖于1-2-code-editor（代码编辑器，用于diff显示）

## 参考资源

- 项目架构文档: docs/architecture.md
- PRD文档: docs/prd.md
- 需求文档: docs/001_需求.md

## 开发笔记

1. Agent模式需要在AI聊天面板中添加切换开关
2. 文件操作需要后端API支持，需要与后端团队协调
3. Diff预览可以复用现有的编辑器diff装饰功能
4. 操作日志需要持久化存储，可使用localStorage