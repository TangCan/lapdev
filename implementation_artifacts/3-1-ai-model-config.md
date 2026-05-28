# Story 3-1: AI模型配置

## 基本信息

| 属性 | 值 |
|------|-----|
| **Story ID** | 3-1-ai-model-config |
| **所属Epic** | Epic 3: AI功能（BYOK模式） |
| **标题** | AI模型配置 |
| **状态** | ready-for-dev |
| **优先级** | 高 |
| **估计工时** | 6小时 |
| **关联FR** | FR-015, FR-016, FR-017 |

## 用户故事

作为一名开发者，我希望在设置页面配置AI模型（API Key、Base URL、Model），以便使用自己的AI服务进行代码辅助开发。

## 需求描述

### FR-015: AI模型配置
- 提供配置表单：API Key（密码框）、Base URL、Model名称
- 支持添加多个模型配置
- 选择活跃模型

### FR-016: 连接测试
- 点击"测试连接"按钮验证配置
- 返回成功或失败提示

### FR-017: 多模型管理与切换
- 可添加、编辑、删除模型配置
- 支持快速切换当前活跃模型

## 验收标准

### AC-1: 模型配置表单
- ✅ 设置页面提供AI配置区域
- ✅ 表单包含：API Key（密码框）、Base URL、Model名称字段
- ✅ 支持选择模型提供商（OpenAI/DeepSeek/Custom）

### AC-2: 连接测试功能
- ✅ 点击"测试连接"按钮
- ✅ 发送简单请求验证API可用性
- ✅ 显示成功或失败提示
- ✅ 失败时显示具体错误信息

### AC-3: 多模型管理
- ✅ 可添加多个模型配置
- ✅ 可编辑已有配置
- ✅ 可删除配置
- ✅ 选择一个作为"当前活跃模型"

### AC-4: 安全要求
- ✅ API Key仅内存存储，刷新页面后需重新输入
- ✅ 日志和网络面板中不暴露明文API Key
- ✅ 脱敏显示（如 `sk-***...xxxx`）

## 任务分解

### Task 3.1.1: AI Service实现
**目标**: 创建AI服务层，处理与后端AI API的通信

**实现内容:**
- 创建 `frontend/src/services/aiService.ts`
- 实现模型配置管理（内存存储）
- 实现连接测试方法
- 实现API请求方法（聊天、补全）

**验收标准:**
- ✅ 支持多模型配置存储
- ✅ 支持连接测试
- ✅ 支持API Key脱敏

**文件:** `frontend/src/services/aiService.ts`

---

### Task 3.1.2: AI Context实现
**目标**: 创建AI状态管理Context

**实现内容:**
- 创建 `frontend/src/context/AIContext.tsx`
- 管理当前活跃模型
- 管理连接状态
- 提供配置更新方法

**验收标准:**
- ✅ React Context API模式
- ✅ 提供useAI Hook
- ✅ 状态持久化（仅内存）

**文件:** `frontend/src/context/AIContext.tsx`

---

### Task 3.1.3: AI配置UI组件
**目标**: 创建AI模型配置表单组件

**实现内容:**
- 创建 `frontend/src/components/AI/AIConfigPanel.tsx`
- 模型配置表单（API Key、Base URL、Model）
- 连接测试按钮和状态显示
- 模型列表和切换功能

**验收标准:**
- ✅ 表单验证
- ✅ 密码框输入
- ✅ 测试连接UI反馈
- ✅ 模型列表展示

**文件:** `frontend/src/components/AI/AIConfigPanel.tsx`

---

### Task 3.1.4: 后端AI配置API
**目标**: 实现后端AI配置相关API端点

**实现内容:**
- 实现 `/api/v1/ai/config` GET/POST端点
- 实现 `/api/v1/ai/test` 连接测试端点
- 实现 `/api/v1/ai/chat` 聊天API代理
- 实现 `/api/v1/ai/models` 模型列表端点

**验收标准:**
- ✅ REST API规范
- ✅ 错误处理
- ✅ 日志脱敏

**文件:** `server/src/services/ai.ts`, `server/src/handlers/ai.ts`

---

### Task 3.1.5: 测试覆盖
**目标**: 编写单元测试和集成测试

**实现内容:**
- 单元测试：`tests/unit/aiUtils.test.ts`
- 集成测试：`tests/api/ai.spec.ts`

**验收标准:**
- ✅ 工具函数测试
- ✅ API端点测试

**文件:** `tests/unit/aiUtils.test.ts`, `tests/api/ai.spec.ts`

---

## 技术实现方案

### 技术选型

| 类别 | 技术 | 版本 |
|------|------|------|
| 前端框架 | React 18 + TypeScript | - |
| 状态管理 | React Context API | - |
| HTTP客户端 | Fetch API | - |
| 后端运行时 | Deno | 1.40+ |
| AI API | OpenAI Compatible API | - |

### 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    AI配置架构                               │
├─────────────────────────────────────────────────────────────┤
│  AIConfigPanel.tsx                                         │
│  ├── ModelSelector (当前模型下拉)                           │
│  ├── ConfigForm (API Key/URL/Model输入)                    │
│  ├── TestButton (测试连接)                                 │
│  └── ModelList (模型列表管理)                              │
├─────────────────────────────────────────────────────────────┤
│  AIContext.tsx                                             │
│  ├── currentModel: AIModelConfig | null                    │
│  ├── models: AIModelConfig[]                              │
│  ├── isConnected: boolean                                 │
│  └── methods: setModel, addModel, removeModel, testConnection│
├─────────────────────────────────────────────────────────────┤
│  aiService.ts                                              │
│  ├── getModels(): AIModelConfig[]                        │
│  ├── setActiveModel(id: string): void                    │
│  ├── testConnection(config: AIModelConfig): Promise<boolean>│
│  └── sendChatRequest(messages: ChatMessage[]): Promise    │
└─────────────────────────────────────────────────────────────┘
```

### 关键接口定义

```typescript
// AI模型配置
interface AIModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'deepseek' | 'custom';
  apiKey: string;
  baseUrl: string;
  model: string;
  isActive: boolean;
}

// 连接测试请求
interface TestConnectionRequest {
  apiKey: string;
  baseUrl: string;
  model: string;
}

// 连接测试响应
interface TestConnectionResponse {
  status: 'success' | 'error';
  message: string;
  latency?: number;
}

// 聊天消息
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
```

### 数据流

```
用户输入配置 → AIContext.updateConfig() → aiService.saveConfig()
                                    ↓
                              内存存储（仅内存）
                                    ↓
用户点击测试 → AIContext.testConnection() → aiService.testConnection()
                                    ↓
                              POST /api/v1/ai/test
                                    ↓
                              后端调用AI API验证
                                    ↓
                              返回结果到前端
```

### 安全性设计

1. **API Key处理**
   - 仅在内存中存储，刷新页面丢失
   - 使用 `sessionStorage` 存储（生命周期同标签页）
   - 不持久化到 localStorage 或后端

2. **日志脱敏**
   - 错误日志中 `sk-***xxxx` 格式显示
   - 网络请求中显示完整 Key（必要之恶）

3. **显示脱敏**
   - 配置列表中 API Key 显示为 `sk-***...xxxx`
   - 编辑时需要重新输入

## 依赖关系

| 依赖 | 用途 |
|------|------|
| React Context API | 状态管理 |
| Fetch API | HTTP请求 |
| Deno KV | 后端配置存储（可选） |

## 测试策略

### 单元测试
- `aiService.test.ts`: 服务方法测试
- `AIContext.test.tsx`: Context行为测试

### 集成测试
- `tests/api/ai.spec.ts`: API端点测试

### E2E测试
- 通过Playwright测试配置UI交互
- 测试连接验证流程

## 安全考虑

1. **API Key保护**: 仅内存存储，不持久化
2. **日志脱敏**: 错误信息中隐藏完整Key
3. **显示脱敏**: UI中显示掩码Key
4. **传输安全**: 使用HTTPS（服务器配置）

## 性能优化

1. **连接测试**: 5秒超时，快速失败
2. **缓存策略**: 模型列表缓存1小时
3. **延迟存储**: 防抖保存配置

## 参考文档

- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [DeepSeek API Reference](https://platform.deepseek.com/docs)
- [React Context API](https://react.dev/reference/react/createContext)
- [Monaco Editor Integration Pattern](../2-2-lsp-intelligence.md)

## 前置故事依赖

无 - 本故事为Epic 3的第一个故事，不依赖其他故事

---

**创建时间**: 2026-05-28
**最后更新**: 2026-05-28
**作者**: LAPDEV Team