# ATDD 验收测试: Agent模式

## 测试概述

本测试文件包含 Agent 模式功能的验收测试用例，基于 TDD 红-绿-重构周期设计。

## 测试环境准备

### 前置条件
- AI模型已配置
- 用户已登录IDE
- 工作区包含测试文件

### Mock数据配置
```typescript
const mockAIConfig = {
  models: [{
    id: 'mock-model-1',
    name: 'Mock AI',
    provider: 'openai',
    apiKey: 'sk-mock-key',
    baseUrl: 'https://api.mock.com/v1',
    model: 'mock-model',
    isActive: true
  }],
  currentModelId: 'mock-model-1'
};
```

---

## 验收测试用例

### AC-1: Agent模式开启

| 测试ID | TC-AGENT-001 |
|--------|-------------|
| **测试名称** | Agent模式切换开关功能 |
| **前置条件** | 用户已打开AI面板，AI模型已配置 |
| **测试步骤** | |

```gherkin
Given 用户在AI聊天面板中
And AI模型已配置完成
When 用户点击Agent模式开关
Then Agent模式指示器显示为激活状态
And isAgentMode状态变为true

Given Agent模式已开启
When 用户再次点击Agent模式开关
Then Agent模式指示器显示为关闭状态
And isAgentMode状态变为false
```

**测试断言:**
- Agent模式开关点击后状态正确切换
- 状态指示器正确显示当前模式
- AIContext中的isAgentMode状态正确更新

---

### AC-2: 文件修改预览

| 测试ID | TC-AGENT-002 |
|--------|-------------|
| **测试名称** | 文件修改diff预览 |
| **前置条件** | Agent模式已开启，AI准备修改文件 |
| **测试步骤** | |

```gherkin
Given Agent模式已开启
And AI分析代码后决定修改文件
When AI准备执行文件修改操作
Then 编辑器自动显示diff预览
And 弹出操作确认对话框
And 对话框列出所有待执行的操作
```

**测试断言:**
- diff预览正确显示修改内容
- 新增内容显示为绿色
- 删除内容显示为红色
- 修改内容显示为蓝色
- 确认对话框正确列出所有操作

---

### AC-3: 操作确认机制

| 测试ID | TC-AGENT-003 |
|--------|-------------|
| **测试名称** | 单个操作确认 |
| **前置条件** | Agent准备执行多个文件操作 |
| **测试步骤** | |

```gherkin
Given Agent准备执行多个文件操作
And 确认对话框已打开
When 用户选择单个操作并点击"批准"
Then 该操作被标记为已批准
And 其他操作保持待确认状态

Given Agent准备执行多个文件操作
And 确认对话框已打开
When 用户选择单个操作并点击"拒绝"
Then 该操作被标记为已拒绝
And 其他操作保持待确认状态
```

**测试断言:**
- 单个操作可以独立批准/拒绝
- 操作状态正确更新

---

| 测试ID | TC-AGENT-004 |
|--------|-------------|
| **测试名称** | 批量操作确认 |
| **前置条件** | Agent准备执行多个文件操作 |
| **测试步骤** | |

```gherkin
Given Agent准备执行多个文件操作
And 确认对话框已打开
When 用户点击"全部批准"按钮
Then 所有操作被标记为已批准
And 确认对话框关闭
And 所有操作开始执行

Given Agent准备执行多个文件操作
And 确认对话框已打开
When 用户点击"全部拒绝"按钮
Then 所有操作被标记为已拒绝
And 确认对话框关闭
And 没有操作被执行
```

**测试断言:**
- 批量批准后所有操作执行
- 批量拒绝后无操作执行
- 对话框正确关闭

---

| 测试ID | TC-AGENT-005 |
|--------|-------------|
| **测试名称** | 混合批准/拒绝 |
| **前置条件** | Agent准备执行多个文件操作 |
| **测试步骤** | |

```gherkin
Given Agent准备执行3个文件操作
And 用户批准了前2个操作
And 用户拒绝了第3个操作
When 用户点击"执行已批准操作"
Then 前2个操作成功执行
And 第3个操作被跳过
And 弹出提示显示"2个操作已执行，1个操作被跳过"
```

**测试断言:**
- 批准的操作正确执行
- 拒绝的操作被跳过
- 结果提示正确显示

---

### AC-4: 操作日志记录

| 测试ID | TC-AGENT-006 |
|--------|-------------|
| **测试名称** | 操作日志记录功能 |
| **前置条件** | Agent执行了文件操作 |
| **测试步骤** | |

```gherkin
Given Agent执行了文件读取操作
When 操作完成后
Then 操作记录在活动日志中
And 日志包含:操作类型为"读取"
And 日志包含:文件路径
And 日志包含:时间戳
And 日志包含:操作结果为"成功"

Given Agent执行了文件写入操作
And 操作已获得用户批准
When 操作完成后
Then 操作记录在活动日志中
And 日志包含:操作类型为"写入"
And 日志包含:文件路径
And 日志包含:时间戳
And 日志包含:操作结果为"成功"

Given Agent执行了文件写入操作
And 用户拒绝了操作
When 操作被拒绝后
Then 操作记录在活动日志中
And 日志包含:操作类型为"写入"
And 日志包含:文件路径
And 日志包含:时间戳
And 日志包含:操作结果为"已拒绝"
```

**测试断言:**
- 所有操作都被记录到日志
- 日志包含完整的操作信息
- 操作结果正确记录

---

| 测试ID | TC-AGENT-007 |
|--------|-------------|
| **测试名称** | 操作日志查看 |
| **前置条件** | 存在多条操作日志 |
| **测试步骤** | |

```gherkin
Given 存在多条操作日志
When 用户打开操作日志面板
Then 日志按时间倒序显示
And 每条日志显示操作类型图标
And 每条日志显示文件路径
And 每条日志显示时间戳
And 每条日志显示操作结果状态
```

**测试断言:**
- 日志正确排序显示
- 日志信息完整显示
- 状态图标正确显示

---

## API集成测试

### 测试ID: TC-AGENT-API-001

**测试名称:** 文件读取API

```gherkin
Given Agent模式已开启
When 调用POST /api/v1/agent/read-file
And 请求体包含有效的文件路径
Then 返回状态码200
And 返回文件内容
And 返回内容包含文件内容字段

Given Agent模式已开启
When 调用POST /api/v1/agent/read-file
And 请求体包含工作区外的文件路径
Then 返回状态码403
And 返回错误信息"无法访问工作区外的文件"
```

### 测试ID: TC-AGENT-API-002

**测试名称:** 文件列表API

```gherkin
Given Agent模式已开启
When 调用POST /api/v1/agent/list-files
And 请求体包含有效的目录路径
Then 返回状态码200
And 返回文件和文件夹列表
And 列表项包含名称、类型、路径信息
```

### 测试ID: TC-AGENT-API-003

**测试名称:** 代码搜索API

```gherkin
Given Agent模式已开启
When 调用POST /api/v1/agent/search-code
And 请求体包含搜索关键词
Then 返回状态码200
And 返回匹配的文件列表
And 每个匹配项包含文件路径和匹配位置
```

---

## 边界情况测试

### 测试ID: TC-AGENT-BOUNDARY-001

**测试名称:** Agent模式未开启时的操作限制

```gherkin
Given Agent模式未开启
When AI尝试读取文件
Then 返回错误提示"请先开启Agent模式"
And 文件读取操作不执行
```

### 测试ID: TC-AGENT-BOUNDARY-002

**测试名称:** 空操作列表

```gherkin
Given Agent分析代码后没有需要执行的操作
When AI完成分析
Then 不弹出确认对话框
And 显示提示"分析完成，无需修改"
```

### 测试ID: TC-AGENT-BOUNDARY-003

**测试名称:** 大量操作确认

```gherkin
Given Agent准备执行10个以上文件操作
When 确认对话框打开
Then 对话框支持滚动查看所有操作
And 全选/全不选功能可用
And 操作分组显示
```

---

## 安全性测试

### 测试ID: TC-AGENT-SEC-001

**测试名称:** 工作区路径限制

```gherkin
Given Agent模式已开启
When AI尝试访问工作区外的文件
Then 操作被拒绝
And 记录安全日志
And 显示警告提示
```

### 测试ID: TC-AGENT-SEC-002

**测试名称:** 未授权操作拦截

```gherkin
Given Agent尝试直接执行文件写入操作
And 未获得用户确认
When 操作被拦截
Then 记录安全日志
And 显示错误提示"需要用户确认"
```

---

## 测试文件结构

```
tests/
├── e2e/
│   └── ai-agent.spec.ts          # E2E验收测试
├── unit/
│   └── agent/
│       ├── AgentContext.spec.ts  # Agent状态管理测试
│       ├── agentService.spec.ts  # Agent服务测试
│       └── OperationLogContext.spec.ts  # 日志管理测试
└── api/
    └── agent-api.spec.ts         # API集成测试
```