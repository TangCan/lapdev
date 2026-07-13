---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-generation-mode', 'step-03-test-strategy', 'step-04-generate-tests', 'step-04c-aggregate', 'step-05-validate-and-complete']
lastStep: 'step-05-validate-and-complete'
lastSaved: '2026-07-10'
storyId: '9.2'
storyKey: '9-2-agent-operation-confirmation'
storyFile: '/home/richard/richard/2026/2026/pvm_2/lapdev/implementation_artifacts/9-2-agent-operation-confirmation.md'
atddChecklistPath: '/home/richard/richard/2026/2026/pvm_2/lapdev/tests/atdd-checklist-9-2-agent-operation-confirmation.md'
generatedTestFiles:
  - 'tests/api/agent-operation-confirmation.spec.ts'
  - 'tests/e2e/agent-operation-confirmation.spec.ts'
  - 'backend/tests/agentHandler.test.ts'
inputDocuments:
  - '/home/richard/richard/2026/2026/pvm_2/lapdev/implementation_artifacts/9-2-agent-operation-confirmation.md'
  - '/home/richard/richard/2026/2026/pvm_2/lapdev/docs/epics.md'
  - '/home/richard/richard/2026/2026/pvm_2/lapdev/frontend/src/services/agentService.ts'
  - '/home/richard/richard/2026/2026/pvm_2/lapdev/frontend/src/context/AgentContext.tsx'
  - '/home/richard/richard/2026/2026/pvm_2/lapdev/backend/src/main.ts'
  - '/home/richard/richard/2026/2026/pvm_2/lapdev/backend/src/handlers/agentHandler.ts'
---

# ATDD Checklist - Story 9.2: Agent操作确认机制

**Story ID:** 9.2  
**Story Key:** 9-2-agent-operation-confirmation  
**Epic:** 9 - Agent模式增强  
**Created:** 2026-07-10  

---

## 🔴 TDD Red Phase (Current)

✅ Red-phase test scaffolds generated

---

## 📋 Acceptance Criteria Mapping

| AC | Description | Priority | Test Type | Coverage |
|----|-------------|----------|-----------|----------|
| AC1 | Agent模式下AI准备修改文件时显示确认对话框和diff预览 | P0 | E2E | ✅ |
| AC2 | 用户点击"批准"按钮，执行文件修改 | P0 | E2E + API + Unit | ✅ |
| AC3 | 用户点击"拒绝"按钮，放弃修改并显示消息 | P0 | E2E | ✅ |
| AC4 | 用户点击"全部批准"按钮，批量处理多个文件修改 | P1 | E2E | ✅ |

---

## 🧪 Test Coverage Plan

### Unit Tests (Backend)

| Test ID | Description | File | Status |
|---------|-------------|------|--------|
| UT-9.2.1 | 测试 agentHandler 文件写入功能 | `backend/tests/agentHandler.test.ts` | ✅ RED |
| UT-9.2.2 | 测试 agentHandler 路径遍历攻击防护 | `backend/tests/agentHandler.test.ts` | ✅ RED |
| UT-9.2.3 | 测试 agentHandler 非存在目录错误处理 | `backend/tests/agentHandler.test.ts` | ✅ RED |
| UT-9.2.4 | 测试 agentHandler 空文件路径错误处理 | `backend/tests/agentHandler.test.ts` | ✅ RED |
| UT-9.2.5 | 测试 agentHandler 缺失内容错误处理 | `backend/tests/agentHandler.test.ts` | ✅ RED |
| UT-9.2.6 | 测试 agentHandler 无效JSON错误处理 | `backend/tests/agentHandler.test.ts` | ✅ RED |

### API Tests

| Test ID | Description | File | Status |
|---------|-------------|------|--------|
| API-9.2.1 | 测试 POST /api/v1/agent/write-file 成功写入文件 | `tests/api/agent-operation-confirmation.spec.ts` | ✅ RED |
| API-9.2.2 | 测试 POST /api/v1/agent/write-file 路径遍历攻击 | `tests/api/agent-operation-confirmation.spec.ts` | ✅ RED |
| API-9.2.3 | 测试 POST /api/v1/agent/write-file 目录不存在 | `tests/api/agent-operation-confirmation.spec.ts` | ✅ RED |
| API-9.2.4 | 测试 POST /api/v1/agent/write-file 空文件路径 | `tests/api/agent-operation-confirmation.spec.ts` | ✅ RED |
| API-9.2.5 | 测试 POST /api/v1/agent/write-file 缺失内容 | `tests/api/agent-operation-confirmation.spec.ts` | ✅ RED |
| API-9.2.6 | 测试 POST /api/v1/agent/write-file 无效JSON | `tests/api/agent-operation-confirmation.spec.ts` | ✅ RED |

### E2E Tests

| Test ID | Description | File | Status |
|---------|-------------|------|--------|
| E2E-9.2.1 | Agent模式下AI准备修改文件时显示确认对话框 | `tests/e2e/agent-operation-confirmation.spec.ts` | ✅ RED |
| E2E-9.2.2 | 用户批准后执行文件修改 | `tests/e2e/agent-operation-confirmation.spec.ts` | ✅ RED |
| E2E-9.2.3 | 用户拒绝后取消文件修改 | `tests/e2e/agent-operation-confirmation.spec.ts` | ✅ RED |
| E2E-9.2.4 | 支持批量批准多个文件修改 | `tests/e2e/agent-operation-confirmation.spec.ts` | ✅ RED |
| E2E-9.2.5 | 对话框显示操作类型和影响范围 | `tests/e2e/agent-operation-confirmation.spec.ts` | ✅ RED |

---

## 🔧 Test Infrastructure

### Required Test Fixtures

| Fixture | Description | Path | Status |
|---------|-------------|------|--------|
| Test workspace | 包含测试文件的工作区目录 | `tests/fixtures/test-workspace/` | ✅ |
| Test file | 用于文件写入测试的示例文件 | `tests/fixtures/test-workspace/test-file.ts` | ✅ |

### Required API Endpoints

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/api/v1/agent/write-file` | POST | 写入文件内容 | 🚧 Not implemented |

### Required UI Elements

| Element | data-testid | Description | Status |
|---------|-------------|-------------|--------|
| 操作确认对话框 | `operation-confirmation-dialog` | 显示操作确认的对话框 | 🚧 Not implemented |
| Diff预览 | `operation-diff-preview` | 显示文件修改的diff | 🚧 Not implemented |
| 批准按钮 | `operation-approve-button` | 批准操作按钮 | 🚧 Not implemented |
| 拒绝按钮 | `operation-reject-button` | 拒绝操作按钮 | 🚧 Not implemented |
| 全部批准按钮 | `operation-approve-all-button` | 批量批准按钮 | 🚧 Not implemented |
| 操作类型 | `operation-type` | 显示操作类型 | 🚧 Not implemented |
| 操作目标 | `operation-target` | 显示目标文件路径 | 🚧 Not implemented |
| 成功消息 | `operation-success-message` | 操作成功提示 | 🚧 Not implemented |
| 拒绝消息 | `operation-rejected-message` | 操作被拒绝提示 | 🚧 Not implemented |

---

## ✅ Test Completion Status

| Status | Count |
|--------|-------|
| Total tests planned | 17 |
| Unit tests (后端) | 6 |
| API tests | 6 |
| E2E tests | 5 |
| Tests created | 17 |
| Tests passing | 0 |

---

## 📊 Priority Distribution

| Priority | Count | Percentage |
|----------|-------|------------|
| P0 | 7 | 41% |
| P1 | 10 | 59% |

---

## 📝 Next Steps (Task-by-Task Activation)

During implementation of each task:

1. Remove `test.skip()` from the current test file or scenario
2. Run tests: `npm test`
3. Verify the activated test fails first, then passes after implementation (green phase)
4. If any activated tests still fail unexpectedly:
   - Either fix implementation (feature bug)
   - Or fix test (test bug)
5. Commit passing tests

## 🚀 Implementation Guidance

**Feature endpoints to implement:**
- POST `/api/v1/agent/write-file` - 写入文件内容

**UI components to implement:**
- `OperationConfirmation` - 操作确认对话框组件

**Context to enhance:**
- `AgentContext` - 添加操作确认/拒绝逻辑

---

**Last Updated:** 2026-07-10