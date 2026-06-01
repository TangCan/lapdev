# Story 3-2: AI聊天面板

## 基本信息

| 属性 | 值 |
|------|-----|
| **Story ID** | 3-2-ai-chat-panel |
| **所属Epic** | Epic 3: AI功能（BYOK模式） |
| **标题** | AI聊天面板 |
| **状态** | in-progress |
| **优先级** | 高 |
| **估计工时** | 8小时 |
| **关联FR** | FR-018, FR-019, FR-020 |

## 用户故事

作为一名开发者，我希望通过侧边栏聊天窗口与AI对话，以便获取代码建议和帮助。

## 需求描述

### FR-018: AI聊天面板
- 用户打开IDE，点击AI面板按钮，侧边栏打开AI Chat面板
- 侧边栏形式展示，包含输入框和消息列表

### FR-019: 代码上下文引用
- 支持普通文本输入
- 支持@file:path引用文件内容
- 支持@selection引用当前选中的代码

### FR-020: 流式回复显示
- AI回复以流式方式逐字显示
- 显示加载状态指示器

## 验收标准

### AC-1: AI面板UI
- ✅ 点击AI面板按钮打开侧边栏
- ✅ 侧边栏包含消息列表区域和输入区域
- ✅ 输入区域包含发送按钮
- ✅ 未配置AI时显示引导提示"请先在设置中配置AI"

### AC-2: 消息输入
- ✅ 支持普通文本输入
- ✅ 支持@file:path语法引用文件
- ✅ 支持@selection引用当前选中代码
- ✅ 输入框支持多行文本

### AC-3: 流式回复
- ✅ AI回复逐字流式显示
- ✅ 显示"正在思考..."等加载状态
- ✅ 支持中断正在生成的回复

### AC-4: 会话管理
- ✅ 在同一会话内保留对话历史
- ✅ 支持新建会话
- ✅ 支持清空当前会话历史

## 任务分解

### Task 3.2.1: AI聊天面板UI组件
**目标**: 创建AI聊天面板侧边栏组件

**实现内容:**
- 创建 `frontend/src/components/AI/AIChatPanel.tsx`
- 侧边栏布局（宽度可调整）
- 消息列表组件
- 输入区域组件（支持@file和@selection语法）
- 加载状态和空状态显示

**验收标准:**
- ✅ 侧边栏形式展示
- ✅ 消息列表滚动显示
- ✅ 输入框支持多行
- ✅ 引导提示在未配置时显示

**文件:** `frontend/src/components/AI/AIChatPanel.tsx`

---

### Task 3.2.2: 上下文引用解析
**目标**: 实现@file和@selection语法的解析

**实现内容:**
- 创建 `frontend/src/utils/chatContextParser.ts`
- 解析@file:path获取文件内容
- 获取当前编辑器选中文本
- 格式化上下文信息

**验收标准:**
- ✅ @file:path正确解析文件路径
- ✅ @selection获取当前选中内容
- ✅ 上下文信息格式化

**文件:** `frontend/src/utils/chatContextParser.ts`

---

### Task 3.2.3: 流式聊天API
**目标**: 实现后端流式聊天API端点

**实现内容:**
- 修改 `backend/src/services/aiService.ts`
- 实现 `/api/v1/ai/chat/stream` WebSocket端点
- 支持Server-Sent Events (SSE)流式响应

**验收标准:**
- ✅ 支持流式响应
- ✅ 正确传递上下文信息
- ✅ 错误处理完善

**文件:** `backend/src/services/aiService.ts`, `backend/src/handlers/ai.ts`

---

### Task 3.2.4: 前端流式响应处理
**目标**: 实现前端流式响应接收和显示

**实现内容:**
- 修改 `frontend/src/services/aiService.ts`
- 实现流式请求方法
- 实现流式数据解析

**验收标准:**
- ✅ 使用EventSource或fetch流式读取
- ✅ 逐字更新UI
- ✅ 支持中断

**文件:** `frontend/src/services/aiService.ts`

---

### Task 3.2.5: 会话状态管理
**目标**: 管理聊天会话状态

**实现内容:**
- 创建 `frontend/src/context/ChatContext.tsx`
- 管理当前会话ID
- 管理消息历史
- 管理加载状态

**验收标准:**
- ✅ 会话历史持久化（sessionStorage）
- ✅ 新建会话功能
- ✅ 清空会话功能

**文件:** `frontend/src/context/ChatContext.tsx`

---

### Task 3.2.6: UI集成和交互
**目标**: 将AI聊天面板集成到主应用

**实现内容:**
- 修改 `frontend/src/App.tsx`
- 添加AI面板开关按钮
- 侧边栏展开/收起动画

**验收标准:**
- ✅ 按钮触发侧边栏
- ✅ 平滑动画过渡
- ✅ 响应式布局

**文件:** `frontend/src/App.tsx`, `frontend/src/components/layout/Sidebar.tsx`

---

### Task 3.2.7: E2E测试
**目标**: 编写端到端测试

**实现内容:**
- 创建 `tests/e2e/ai-chat.spec.ts`
- 测试面板打开/关闭
- 测试消息发送和接收
- 测试上下文引用

**验收标准:**
- ✅ 面板开关测试
- ✅ 消息交互测试
- ✅ 流式显示验证

**文件:** `tests/e2e/ai-chat.spec.ts`

---

## 技术实现方案

### 技术选型

| 类别 | 技术 | 版本 |
|------|------|------|
| 前端框架 | React 18 + TypeScript | - |
| 状态管理 | React Context API | - |
| 流式通信 | Server-Sent Events (SSE) | - |
| 后端运行时 | Deno | 1.40+ |
| AI API | OpenAI Compatible API | - |

### 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    AI聊天面板架构                            │
├─────────────────────────────────────────────────────────────┤
│  AIChatPanel.tsx (侧边栏)                                  │
│  ├── MessageList (消息列表)                                │
│  │   ├── UserMessage                                      │
│  │   └── AIMessage (流式渲染)                              │
│  └── ChatInput                                            │
│      ├── @file:path 解析                                   │
│      └── @selection 解析                                   │
├─────────────────────────────────────────────────────────────┤
│  ChatContext.tsx                                           │
│  ├── currentSessionId: string                            │
│  ├── messages: ChatMessage[]                              │
│  ├── isStreaming: boolean                                 │
│  └── methods: sendMessage, newSession, clearSession       │
├─────────────────────────────────────────────────────────────┤
│  chatContextParser.ts                                      │
│  ├── parseFileReference(path: string): string             │
│  ├── getSelection(): string                               │
│  └── formatContext(): ChatContext                         │
├─────────────────────────────────────────────────────────────┤
│  aiService.ts (前端)                                       │
│  ├── sendStreamMessage(messages, context): AsyncGenerator │
│  └── abortStream(): void                                  │
├─────────────────────────────────────────────────────────────┤
│  aiService.ts (后端)                                       │
│  └── handleStreamChat(req): SSE Response                 │
└─────────────────────────────────────────────────────────────┘
```

### 关键接口定义

```typescript
// 聊天消息
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  contexts?: ChatContext[]; // 引用的上下文
}

// 聊天上下文
interface ChatContext {
  type: 'file' | 'selection';
  path?: string;
  content: string;
}

// 流式响应事件
interface StreamEvent {
  type: 'content' | 'done' | 'error';
  content?: string;
  error?: string;
}

// 会话信息
interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}
```

### 数据流

```
用户输入消息 → ChatInput 解析上下文 → ChatContext 保存消息
                                              ↓
                                      AIContext 检查配置
                                              ↓
                                    aiService.sendStreamMessage()
                                              ↓
                                    POST /api/v1/ai/chat/stream
                                              ↓
                                    后端调用AI API (流式)
                                              ↓
                                    SSE 流式响应
                                              ↓
前端逐字接收 → 更新ChatContext → MessageList 渲染
```

### UI设计

**侧边栏布局:**
- 宽度: 400px (可折叠到0)
- 高度: 全屏高度
- 位置: 右侧

**消息气泡:**
- 用户消息: 右对齐，蓝色背景
- AI消息: 左对齐，灰色背景
- 流式显示: 逐字追加，带光标动画

**输入区域:**
- 多行文本输入框
- @file: 和 @selection: 按钮辅助输入
- 发送按钮 (disabled当流式传输中)

---

## 开发者上下文

### 已有实现（Story 3-1）

| 文件 | 用途 | 关键方法/状态 |
|------|------|---------------|
| `frontend/src/services/aiService.ts` | AI服务层 | `sendChatRequest()`, `testConnection()` |
| `frontend/src/context/AIContext.tsx` | AI配置Context | `models`, `currentModel`, `isConnected` |
| `frontend/src/components/AI/AIConfigPanel.tsx` | 配置面板 | AI模型配置表单 |
| `backend/src/services/aiService.ts` | 后端AI服务 | `sendChatRequest()` |

**关键约束:**
- API Key仅内存存储（sessionStorage）
- `aiService` 是单例模式
- `AIContext` 提供 `useAI` hook

### 本Story新增/修改

| 文件 | 操作 | 说明 |
|------|------|------|
| `frontend/src/components/AI/AIChatPanel.tsx` | **新建** | 聊天面板主组件 |
| `frontend/src/context/ChatContext.tsx` | **新建** | 聊天会话状态管理 |
| `frontend/src/utils/chatContextParser.ts` | **新建** | 上下文解析工具 |
| `frontend/src/services/aiService.ts` | **修改** | 添加流式方法 `sendStreamMessage()` |
| `backend/src/services/aiService.ts` | **修改** | 添加流式处理 `handleStreamChat()` |
| `backend/src/handlers/ai.ts` | **新建/修改** | 添加 `/ai/chat/stream` 路由 |
| `frontend/src/App.tsx` | **修改** | 集成AI面板开关 |
| `tests/e2e/ai-chat.spec.ts` | **新建** | E2E测试 |

### 现有代码引用（必须阅读）

| 文件 | 关键内容 |
|------|---------|
| `frontend/src/services/aiService.ts` | `AIModelConfig`, `ChatMessage` 接口; `aiService` 单例 |
| `frontend/src/context/AIContext.tsx` | `AIProvider`, `useAI` hook |
| `frontend/src/components/AI/AIConfigPanel.tsx` | AI组件模式，Button/Spinner使用 |

### 会话管理策略

```typescript
// sessionStorage 结构
{
  "lapdev-chat-sessions": [
    {
      id: "uuid",
      messages: [...],
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ],
  "lapdev-chat-current-session": "uuid"
}
```

### 流式实现方案

**前端（使用 fetch + ReadableStream）:**
```typescript
async function* sendStreamMessage(messages, context) {
  const response = await fetch('/api/v1/ai/chat/stream', {
    method: 'POST',
    body: JSON.stringify({ messages, context }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    // 解析SSE数据
    yield parseSSEMessage(chunk);
  }
}
```

**后端（Deno）:**
```typescript
async function handleStreamChat(req: Request): Promise<Response> {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // 调用AI API流式获取
      const aiResponse = await callAIStream(messages);

      for await (const chunk of aiResponse) {
        const sseData = `data: ${JSON.stringify({ type: 'content', content: chunk })}\n\n`;
        controller.enqueue(encoder.encode(sseData));
      }

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### 错误处理

| 场景 | 处理方式 |
|------|---------|
| AI未配置 | 显示引导提示，不发送请求 |
| 网络错误 | 显示错误消息，支持重试 |
| 流式中断 | 保存已接收内容，显示部分回复 |
| 文件不存在 | 显示"文件不存在"警告 |

---

## 依赖关系

| 依赖 | 用途 |
|------|------|
| Story 3-1 (AI模型配置) | 本Story依赖AI配置服务 |
| React Context API | 状态管理 |
| Fetch API + ReadableStream | 流式请求 |
| Deno SSE | 后端流式响应 |

---

## 测试策略

### 单元测试
- `chatContextParser.test.ts`: 上下文解析测试
- `ChatContext.test.tsx`: Context行为测试

### 集成测试
- `tests/api/ai-stream.spec.ts`: 流式API测试

### E2E测试
- `tests/e2e/ai-chat.spec.ts`: 完整聊天流程测试

---

## 安全考虑

1. **API Key保护**: 沿用Story 3-1的保护措施
2. **文件访问限制**: @file引用只能访问工作区文件
3. **上下文大小限制**: 单次请求上下文不超过10个文件
4. **流式中断**: 用户可随时中断生成

---

## 性能优化

1. **消息虚拟化**: 长对话使用虚拟滚动
2. **上下文压缩**: 超出限制时自动摘要
3. **防抖输入**: 输入时防抖保存草稿

---

## 参考文档

- [SSE (Server-Sent Events)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [OpenAI Chat API](https://platform.openai.com/docs/api-reference/chat)
- [React Context API](https://react.dev/reference/react/createContext)
- [ReadableStream](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)

---

**创建时间**: 2026-05-28
**最后更新**: 2026-05-28
**作者**: LAPDEV Team