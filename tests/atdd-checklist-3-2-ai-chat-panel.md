---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-generation-mode', 'step-03-test-strategy', 'step-04-generate-tests', 'step-04c-aggregate']
lastStep: 'step-04c-aggregate'
lastSaved: '2026-06-01T10:00:00Z'
storyId: '3.2'
storyKey: '3-2-ai-chat-panel'
storyFile: 'implementation_artifacts/3-2-ai-chat-panel.md'
atddChecklistPath: 'tests/atdd-checklist-3-2-ai-chat-panel.md'
generatedTestFiles:
  - 'tests/e2e/ai-chat.spec.ts'
  - 'tests/api/ai-chat-stream.test.ts'
  - 'tests/unit/chatContextParser.test.ts'
inputDocuments:
  - 'docs/epics.md'
  - 'docs/architecture.md'
  - 'implementation_artifacts/3-2-ai-chat-panel.md'
  - 'implementation_artifacts/3-1-ai-model-config.md'
---

# ATDD Checklist: AI聊天面板 (Story 3-2)

## 1. Preflight & Context

### 1.1 Stack Detection
- **Detected Stack**: fullstack (frontend + backend)
- **Test Framework**: Playwright
- **Config File**: `playwright.config.ts` ✓

### 1.2 Prerequisites
- ✅ Story approved with clear acceptance criteria
- ✅ Test framework configured (Playwright)
- ✅ Development environment available

### 1.3 Story Context
- **Story ID**: 3.2
- **Story Key**: 3-2-ai-chat-panel
- **Story Title**: AI聊天面板
- **Status**: ready-for-dev
- **Priority**: 高

### 1.4 Acceptance Criteria Summary

| AC ID | Description | Test Level | Priority |
|-------|-------------|------------|----------|
| AC-1 | AI面板UI - 侧边栏打开/关闭 | E2E | P0 |
| AC-2 | 消息输入 - 文本和上下文引用 | E2E | P0 |
| AC-3 | 流式回复 - 逐字显示 | E2E | P1 |
| AC-4 | 会话管理 - 新建/清空会话 | E2E | P1 |

---

## 2. Generation Mode

- **Selected Mode**: AI Generation (acceptance criteria are clear)
- **Reason**: Standard UI interactions, no complex recording needed

---

## 3. Test Strategy

### 3.1 Acceptance Criteria Mapping

#### AC-1: AI面板UI
- Test: 点击AI面板按钮打开侧边栏
- Test: 验证消息列表和输入区域存在
- Test: 未配置AI时显示引导提示

#### AC-2: 消息输入
- Test: 发送普通文本消息
- Test: 使用@file:path引用文件
- Test: 使用@selection引用选中代码

#### AC-3: 流式回复
- Test: 验证流式回复逐字显示
- Test: 验证加载状态显示
- Test: 验证中断功能

#### AC-4: 会话管理
- Test: 验证对话历史保留
- Test: 新建会话功能
- Test: 清空会话功能

### 3.2 Test Levels
- **E2E**: 完整用户旅程测试
- **API**: 流式聊天API测试
- **Unit**: 上下文解析工具测试

### 3.3 Priority Matrix

| Test | Level | Priority | Risk |
|------|-------|----------|------|
| AI面板打开/关闭 | E2E | P0 | 高 |
| 消息发送 | E2E | P0 | 高 |
| 流式回复显示 | E2E | P1 | 中 |
| 会话管理 | E2E | P1 | 中 |
| 上下文解析 | Unit | P2 | 中 |
| 流式API | API | P1 | 高 |

---

## 4. Generated Test Files

### 4.1 E2E Tests
- `tests/e2e/ai-chat.spec.ts` - AI聊天面板功能测试

### 4.2 API Tests
- `tests/api/ai-chat-stream.test.ts` - 流式聊天API测试

### 4.3 Unit Tests
- `tests/unit/chatContextParser.test.ts` - 上下文解析工具测试

---

## 5. TDD Red Phase Compliance

✅ All tests generated with `test.skip()` (red phase)
✅ Tests assert EXPECTED behavior
✅ Tests will FAIL until feature is implemented

---

## 6. Summary

| Metric | Value |
|--------|-------|
| Total Tests | 12 |
| E2E Tests | 6 |
| API Tests | 4 |
| Unit Tests | 2 |
| P0 Priority | 4 |
| P1 Priority | 6 |
| P2 Priority | 2 |

---

**Generated**: 2026-06-01
**TDD Phase**: RED (Ready for implementation)