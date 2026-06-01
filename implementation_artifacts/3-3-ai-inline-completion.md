# Story 3-3: AI内联代码补全

## 基本信息

| 属性 | 值 |
|------|-----|
| **Story ID** | 3-3-ai-inline-completion |
| **所属Epic** | Epic 3: AI功能（BYOK模式） |
| **标题** | AI内联代码补全 |
| **状态** | ready-for-dev |
| **优先级** | 高 |
| **估计工时** | 8小时 |
| **关联FR** | FR-021 |

## 用户故事

作为一名开发者，我希望AI提供内联代码建议，以便更快完成代码行。

## 需求描述

### FR-021: 内联代码补全
- 用户在编辑器中输入代码时自动触发AI补全请求
- AI返回的建议以幽灵文本(ghost text)形式显示在光标位置
- 支持Tab键接受建议，Esc键取消建议
- 支持设置中启用/禁用该功能

## 验收标准

### AC-1: 自动触发补全
- ✅ 用户输入代码暂停500ms后自动触发补全请求
- ✅ 补全请求基于当前上下文（文件内容、光标位置）

### AC-2: 幽灵文本显示
- ✅ AI建议以幽灵文本形式显示在光标位置
- ✅ 幽灵文本样式与正常文本区分（浅色/斜体）
- ✅ 光标保持在输入位置

### AC-3: 建议交互
- ✅ 按Tab键接受建议，建议内容插入到编辑器
- ✅ 按Esc键取消建议，幽灵文本消失
- ✅ 继续输入自动取消当前建议

### AC-4: 功能开关
- ✅ 设置页面提供内联补全开关
- ✅ 关闭后不触发补全请求

## 任务分解

### Task 3.3.1: 内联补全服务层
**目标**: 实现AI内联补全API服务

**实现内容:**
- 修改 `frontend/src/services/aiService.ts`
- 添加 `getInlineCompletion()` 方法
- 处理流式或普通响应

**验收标准:**
- ✅ 支持代码上下文传递
- ✅ 正确返回补全建议
- ✅ 错误处理完善

**文件:** `frontend/src/services/aiService.ts`

---

### Task 3.3.2: 编辑器集成
**目标**: 在Monaco编辑器中集成内联补全

**实现内容:**
- 修改 `frontend/src/components/Editor/CodeEditor.tsx`
- 监听编辑器输入事件
- 实现防抖触发补全请求
- 显示幽灵文本

**验收标准:**
- ✅ 500ms防抖触发
- ✅ 幽灵文本正确显示
- ✅ Tab/Esc键正确响应

**文件:** `frontend/src/components/Editor/CodeEditor.tsx`

---

### Task 3.3.3: 设置集成
**目标**: 添加内联补全开关设置

**实现内容:**
- 修改 `frontend/src/components/Settings/AISettings.tsx`
- 添加内联补全开关
- 保存设置到localStorage

**验收标准:**
- ✅ 开关UI显示
- ✅ 设置持久化
- ✅ 实时生效

**文件:** `frontend/src/components/Settings/AISettings.tsx`

---

### Task 3.3.4: 后端API端点
**目标**: 实现内联补全后端API

**实现内容:**
- 修改 `backend/src/services/aiService.ts`
- 添加 `getInlineCompletion()` 方法
- 添加 `/api/v1/ai/completion` 路由

**验收标准:**
- ✅ 支持代码上下文
- ✅ 返回补全建议
- ✅ 支持流式响应可选

**文件:** `backend/src/services/aiService.ts`, `backend/src/handlers/ai.ts`

---

### Task 3.3.5: E2E测试
**目标**: 编写端到端测试

**实现内容:**
- 创建 `tests/e2e/ai-inline-completion.spec.ts`
- 测试自动触发补全
- 测试Tab接受建议
- 测试Esc取消建议

**验收标准:**
- ✅ 补全触发测试
- ✅ 交互测试
- ✅ 设置开关测试

**文件:** `tests/e2e/ai-inline-completion.spec.ts`

---

## 技术实现方案

### 技术选型

| 类别 | 技术 | 版本 |
|------|------|------|
| 前端框架 | React 18 + TypeScript | - |
| 编辑器 | Monaco Editor | 0.45+ |
| 状态管理 | React Context API | - |
| 后端运行时 | Deno | 1.40+ |
| AI API | OpenAI Compatible API | - |

### 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                   AI内联代码补全架构                         │
├─────────────────────────────────────────────────────────────┤
│  CodeEditor.tsx (Monaco编辑器)                              │
│  ├── onDidChangeModelContent (输入监听)                     │
│  ├── debounce(500ms) → triggerCompletion()                │
│  ├── showGhostText(text, position)                        │
│  └── handleKeyDown(Tab/Esc)                               │
├─────────────────────────────────────────────────────────────┤
│  aiService.ts (前端)                                       │
│  └── getInlineCompletion(prompt, context): Promise        │
├─────────────────────────────────────────────────────────────┤
│  AIContext.tsx                                             │
│  └── inlineCompletionEnabled: boolean                     │
├─────────────────────────────────────────────────────────────┤
│  aiService.ts (后端)                                       │
│  └── getInlineCompletion(prompt, context): Promise        │
└─────────────────────────────────────────────────────────────┘
```

### 关键接口定义

```typescript
// 内联补全请求
interface InlineCompletionRequest {
  prompt: string;           // 当前行内容
  prefix: string;           // 光标前内容
  suffix: string;           // 光标后内容
  fileContent: string;      // 文件内容
  language: string;         // 编程语言
  maxTokens: number;        // 最大token数
}

// 内联补全响应
interface InlineCompletionResponse {
  completion: string;       // 补全内容
  stopReason?: string;      // 停止原因
  model?: string;           // 使用的模型
}
```

### 数据流

```
用户输入 → CodeEditor监听 → debounce(500ms) → triggerCompletion()
                                                    ↓
                                          aiService.getInlineCompletion()
                                                    ↓
                                          POST /api/v1/ai/completion
                                                    ↓
                                          后端调用AI API
                                                    ↓
                                          返回补全建议
                                                    ↓
                                    CodeEditor.showGhostText()
                                                    ↓
                                          用户按Tab接受 / Esc取消
```

### UI设计

**幽灵文本样式:**
- 颜色: 浅色灰色（约 #888888）
- 字体: 斜体
- 位置: 光标位置之后

**交互行为:**
- Tab: 接受建议，插入到编辑器
- Esc: 取消建议，隐藏幽灵文本
- 继续输入: 取消当前建议，等待下次触发

---

## 开发者上下文

### 已有实现（Story 3-1, 3-2）

| 文件 | 用途 | 关键方法/状态 |
|------|------|---------------|
| `frontend/src/services/aiService.ts` | AI服务层 | `sendChatRequest()`, `sendStreamMessage()` |
| `frontend/src/context/AIContext.tsx` | AI配置Context | `models`, `currentModel`, `isConnected` |
| `frontend/src/components/Editor/CodeEditor.tsx` | 代码编辑器 | Monaco Editor集成 |
| `backend/src/services/aiService.ts` | 后端AI服务 | `sendChatRequest()` |

**关键约束:**
- API Key仅内存存储（sessionStorage）
- `aiService` 是单例模式
- `AIContext` 提供 `useAI` hook

### 本Story新增/修改

| 文件 | 操作 | 说明 |
|------|------|------|
| `frontend/src/services/aiService.ts` | **修改** | 添加 `getInlineCompletion()` 方法 |
| `frontend/src/components/Editor/CodeEditor.tsx` | **修改** | 集成内联补全功能 |
| `frontend/src/components/Settings/AISettings.tsx` | **修改** | 添加内联补全开关 |
| `backend/src/services/aiService.ts` | **修改** | 添加内联补全处理 |
| `backend/src/handlers/ai.ts` | **修改** | 添加 `/ai/completion` 路由 |
| `tests/e2e/ai-inline-completion.spec.ts` | **新建** | E2E测试 |

### 现有代码引用（必须阅读）

| 文件 | 关键内容 |
|------|---------|
| `frontend/src/services/aiService.ts` | `AIModelConfig` 接口; `aiService` 单例 |
| `frontend/src/context/AIContext.tsx` | `AIProvider`, `useAI` hook |
| `frontend/src/components/Editor/CodeEditor.tsx` | Monaco Editor配置和事件处理 |

### 补全触发策略

```typescript
// 触发条件
const shouldTriggerCompletion = (event) => {
  // 1. 内联补全已启用
  if (!inlineCompletionEnabled) return false;
  
  // 2. AI已配置
  if (!isConnected) return false;
  
  // 3. 不是特殊按键（Tab, Enter, Arrow keys等）
  const specialKeys = ['Tab', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape'];
  if (specialKeys.includes(event.key)) return false;
  
  // 4. 当前语言支持（TypeScript, JavaScript, Rust等）
  const supportedLanguages = ['typescript', 'javascript', 'rust', 'python'];
  if (!supportedLanguages.includes(language)) return false;
  
  return true;
};
```

### 后端实现方案

**后端（Deno）:**
```typescript
async function handleInlineCompletion(req: Request): Promise<Response> {
  const { prompt, prefix, suffix, fileContent, language, maxTokens } = await req.json();
  
  // 构建补全提示
  const completionPrompt = `Complete the following code in ${language}:
${fileContent}

Continue from: ${prefix}`;
  
  const response = await callAICompletion(completionPrompt, { maxTokens });
  
  return new Response(JSON.stringify({
    completion: response.choices[0].text,
    model: response.model
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

---

## 依赖关系

| 依赖 | 用途 |
|------|------|
| Story 3-1 (AI模型配置) | 本Story依赖AI配置服务 |
| Story 3-2 (AI聊天面板) | 共享AI服务层 |
| Monaco Editor | 编辑器集成 |
| React Context API | 状态管理 |

---

## 测试策略

### 单元测试
- `aiService.test.ts`: 补全服务测试
- `CodeEditor.test.tsx`: 编辑器集成测试

### 集成测试
- `tests/api/ai-completion.spec.ts`: 补全API测试

### E2E测试
- `tests/e2e/ai-inline-completion.spec.ts`: 完整补全流程测试

---

## 安全考虑

1. **API Key保护**: 沿用Story 3-1的保护措施
2. **上下文限制**: 单次请求代码上下文不超过1000行
3. **敏感信息过滤**: 自动移除代码中的敏感信息（API Key等）

---

## 性能优化

1. **防抖触发**: 500ms防抖避免频繁请求
2. **缓存策略**: 相同上下文短时间内返回缓存结果
3. **流式响应**: 支持流式返回补全结果

---

## 参考文档

- [Monaco Editor API](https://microsoft.github.io/monaco-editor/api/)
- [OpenAI Completions API](https://platform.openai.com/docs/api-reference/completions)
- [GitHub Copilot API](https://docs.github.com/en/copilot)

---

**创建时间**: 2026-06-01
**最后更新**: 2026-06-01
**作者**: LAPDEV Team