---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-generation-mode', 'step-03-test-design']
lastStep: 'step-03-test-design'
lastSaved: '2026-06-01'
storyId: '3-3'
storyKey: '3-3-ai-inline-completion'
storyFile: '/home/ars/richard/2026/pvm_2/lapdev/implementation_artifacts/3-3-ai-inline-completion.md'
atddChecklistPath: '/home/ars/richard/2026/pvm_2/lapdev/tests/e2e/atdd-checklist-3-3-ai-inline-completion.md'
generatedTestFiles: ['tests/e2e/ai-inline-completion.spec.ts']
inputDocuments: ['implementation_artifacts/3-3-ai-inline-completion.md', 'playwright.config.ts']
---

# ATDD Checklist: Story 3-3 - AI内联代码补全

## 1. Preflight & Context

### 1.1 Stack Detection
- **Detected Stack**: Fullstack (React + Deno)
- **Test Framework**: Playwright

### 1.2 Prerequisites Check
- ✅ Story approved with clear acceptance criteria
- ✅ Playwright config exists: `playwright.config.ts`
- ✅ Development environment available

### 1.3 Story Context Summary
- **Story ID**: 3-3-ai-inline-completion
- **Title**: AI内联代码补全
- **User Story**: 作为一名开发者，我希望AI提供内联代码建议，以便更快完成代码行。

---

## 2. Generation Mode

### 2.1 Test Generation Strategy
- **Mode**: Red-phase acceptance test generation
- **Target**: Create failing tests first (TDD approach)

### 2.2 Test Scope
- **Level**: E2E (End-to-End)
- **Coverage**: All acceptance criteria

---

## 3. Test Design

### 3.1 Acceptance Criteria Mapping

| AC ID | Acceptance Criteria | Test Coverage | Priority |
|-------|---------------------|---------------|----------|
| AC-1 | 用户输入代码暂停500ms后自动触发补全请求 | ✅ | P0 |
| AC-2 | AI建议以幽灵文本形式显示在光标位置 | ✅ | P0 |
| AC-3 | Tab键接受建议，Esc键取消建议 | ✅ | P0 |
| AC-4 | 设置页面提供内联补全开关 | ✅ | P1 |

### 3.2 Test Cases

#### Test Case 1: 自动触发补全

**Scenario:** 用户输入代码后自动触发AI补全

```gherkin
Given 用户打开代码编辑器
And AI已配置完成
And 内联补全功能已启用
When 用户在编辑器中输入代码并暂停500ms
Then 发送补全请求到后端API
And 幽灵文本显示AI建议
```

**Test Steps:**
1. 打开IDE并进入代码编辑器
2. 输入代码片段
3. 等待500ms防抖延迟
4. 验证网络请求发送到 `/api/v1/ai/completion`
5. 验证幽灵文本元素出现

---

#### Test Case 2: 幽灵文本显示

**Scenario:** AI建议以幽灵文本形式显示

```gherkin
Given 用户在编辑器中
And AI返回补全建议
When 查看编辑器
Then 幽灵文本显示在光标位置之后
And 幽灵文本样式为浅色斜体
```

**Test Steps:**
1. 触发补全请求
2. 等待AI响应
3. 验证幽灵文本元素存在
4. 验证幽灵文本内容非空
5. 验证幽灵文本样式（颜色、字体样式）

---

#### Test Case 3: Tab键接受建议

**Scenario:** 用户按Tab键接受补全建议

```gherkin
Given 幽灵文本显示在编辑器中
When 用户按Tab键
Then 幽灵文本内容插入到编辑器
And 光标移动到插入内容末尾
```

**Test Steps:**
1. 触发补全并等待幽灵文本显示
2. 按下Tab键
3. 验证幽灵文本消失
4. 验证建议内容已插入到文档
5. 验证光标位置正确

---

#### Test Case 4: Esc键取消建议

**Scenario:** 用户按Esc键取消补全建议

```gherkin
Given 幽灵文本显示在编辑器中
When 用户按Esc键
Then 幽灵文本消失
And 编辑器内容不变
```

**Test Steps:**
1. 触发补全并等待幽灵文本显示
2. 按下Esc键
3. 验证幽灵文本消失
4. 验证编辑器内容未变化

---

#### Test Case 5: 继续输入取消建议

**Scenario:** 用户继续输入自动取消当前建议

```gherkin
Given 幽灵文本显示在编辑器中
When 用户继续输入字符
Then 幽灵文本消失
And 新的补全请求被触发（500ms后）
```

**Test Steps:**
1. 触发补全并等待幽灵文本显示
2. 继续输入新字符
3. 验证幽灵文本消失
4. 验证新的补全请求在500ms后发送

---

#### Test Case 6: 功能开关控制

**Scenario:** 设置开关控制内联补全功能

```gherkin
Given 用户打开设置页面
When 关闭内联补全开关
And 在编辑器中输入代码
Then 不发送补全请求
And 不显示幽灵文本
```

**Test Steps:**
1. 打开设置页面
2. 关闭内联补全开关
3. 在编辑器中输入代码
4. 验证没有发送补全请求
5. 验证幽灵文本不出现

---

### 3.3 Test Coverage Matrix

| FR | AC | Test Case | Coverage |
|----|----|-----------|----------|
| FR-021 | AC-1 | 自动触发补全 | ✅ |
| FR-021 | AC-2 | 幽灵文本显示 | ✅ |
| FR-021 | AC-3 | Tab键接受建议 | ✅ |
| FR-021 | AC-3 | Esc键取消建议 | ✅ |
| FR-021 | AC-3 | 继续输入取消建议 | ✅ |
| FR-021 | AC-4 | 功能开关控制 | ✅ |

---

### 3.4 Key Selectors

| Element | Selector | Purpose |
|---------|----------|---------|
| 代码编辑器 | `[data-testid="code-editor"]` | 定位编辑器 |
| 编辑器内容 | `.monaco-editor textarea` | 输入代码 |
| 幽灵文本 | `[data-testid="inline-completion-ghost"]` | 验证补全显示 |
| 设置按钮 | `[data-testid="settings-button"]` | 打开设置 |
| 内联补全开关 | `[data-testid="inline-completion-toggle"]` | 控制功能开关 |

---

### 3.5 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/ai/completion` | POST | 内联补全请求 |

**Request Body:**
```json
{
  "prompt": "当前行内容",
  "prefix": "光标前内容",
  "suffix": "光标后内容",
  "fileContent": "文件内容",
  "language": "typescript",
  "maxTokens": 50
}
```

**Response:**
```json
{
  "completion": "补全建议内容",
  "stopReason": "length",
  "model": "gpt-4o"
}
```

---

### 3.6 Test Data

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| 自动触发补全 | `const foo =` | 补全建议如 `bar` |
| Tab接受建议 | 幽灵文本 `bar` | 插入后: `const foo = bar` |
| Esc取消建议 | 幽灵文本 `bar` | 保持: `const foo =` |

---

## 4. Implementation Notes

### 4.1 Timing Considerations
- **防抖延迟**: 500ms - 需要在测试中等待足够时间
- **网络延迟**: API响应可能需要1-3秒
- **UI更新延迟**: 幽灵文本显示可能有100ms延迟

### 4.2 Mocking Strategy
- 使用Playwright的`route`功能拦截API请求
- 返回预设的补全建议用于测试
- 验证请求参数正确性

### 4.3 Edge Cases
- 空文件中的补全
- 大文件中的补全（性能测试）
- 不支持的语言（不应触发补全）
- AI未配置时（不应触发补全）

---

## 5. Test File Generation

**Generated Test File:** `tests/e2e/ai-inline-completion.spec.ts`

**Status:** ✅ Pending generation

---

**Created:** 2026-06-01
**Updated:** 2026-06-01
**Author:** TEA - Test Architect