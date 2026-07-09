---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-identify-targets', 'step-03-generate-tests', 'step-03c-aggregate', 'step-04-validate-and-summarize']
lastStep: 'step-04-validate-and-summarize'
lastSaved: '2026-07-09'
storyId: '9.1'
storyKey: '9-1-agent-file-reading'
storyFile: '/home/richard/richard/2026/2026/pvm_2/lapdev/implementation_artifacts/9-1-agent-file-reading.md'
atddChecklistPath: '/home/richard/richard/2026/2026/pvm_2/lapdev/tests/atdd-checklist-9-1-agent-file-reading.md'
generatedTestFiles:
  - 'tests/e2e/agent-file-reading.spec.ts'
  - 'tests/api/agent-api.spec.ts'
  - 'backend/tests/agentHandler.test.ts'
  - 'frontend/tests/unit/agentService.test.ts'
inputDocuments:
  - '/home/richard/richard/2026/2026/pvm_2/lapdev/implementation_artifacts/9-1-agent-file-reading.md'
  - '/home/richard/richard/2026/2026/pvm_2/lapdev/docs/epics.md'
  - '/home/richard/richard/2026/2026/pvm_2/lapdev/frontend/src/services/agentService.ts'
  - '/home/richard/richard/2026/2026/pvm_2/lapdev/frontend/src/context/AgentContext.tsx'
  - '/home/richard/richard/2026/2026/pvm_2/lapdev/backend/src/main.ts'
  - '/home/richard/richard/2026/2026/pvm_2/lapdev/backend/src/handlers/agentHandler.ts'
---

# ATDD Checklist - Story 9.1: Agent文件读取能力

**Story ID:** 9.1  
**Story Key:** 9-1-agent-file-reading  
**Epic:** 9 - Agent模式增强  
**Created:** 2026-07-09  

---

## 📋 Acceptance Criteria Mapping

| AC | Description | Priority | Test Type | Coverage |
|----|-------------|----------|-----------|----------|
| AC1 | Agent模式开启时，AI自动读取当前打开的文件内容，日志记录操作 | P0 | E2E | ✅ |
| AC2 | Agent模式开启时，AI可以遍历工作区目录搜索代码，搜索结果显示在聊天面板中 | P0 | E2E + API | ✅ |
| AC3 | Agent模式关闭时，尝试读取文件显示提示 | P1 | E2E | ✅ |

---

## 🧪 Test Coverage Plan

### Unit Tests

| Test ID | Description | File | Status |
|---------|-------------|------|--------|
| UT-9.1.1 | 测试 agentService 路径验证（正常路径） | `frontend/tests/unit/agentService.test.ts` | ✅ |
| UT-9.1.2 | 测试 agentService 路径验证（空路径） | `frontend/tests/unit/agentService.test.ts` | ✅ |
| UT-9.1.3 | 测试 agentHandler 文件读取功能 | `backend/tests/agentHandler.test.ts` | ✅ |
| UT-9.1.4 | 测试 agentHandler 目录列出功能 | `backend/tests/agentHandler.test.ts` | ✅ |
| UT-9.1.5 | 测试 agentHandler 代码搜索功能 | `backend/tests/agentHandler.test.ts` | ✅ |
| UT-9.1.6 | 测试 agentHandler 路径遍历攻击防护 | `backend/tests/agentHandler.test.ts` | ✅ |
| UT-9.1.7 | 测试 agentHandler 嵌套目录搜索 | `backend/tests/agentHandler.test.ts` | ✅ |
| UT-9.1.8 | 测试 agentService API成功/失败处理 | `frontend/tests/unit/agentService.test.ts` | ✅ |
| UT-9.1.9 | 测试 agentService 超时控制 | `frontend/tests/unit/agentService.test.ts` | ✅ |
| UT-9.1.10 | 测试 agentService 网络错误处理 | `frontend/tests/unit/agentService.test.ts` | ✅ |

### API Tests

| Test ID | Description | File | Status |
|---------|-------------|------|--------|
| API-9.1.1 | 测试 POST /api/v1/agent/read-file 成功读取文件 | `tests/api/agent-api.spec.ts` | ✅ |
| API-9.1.2 | 测试 POST /api/v1/agent/read-file 文件不存在 | `tests/api/agent-api.spec.ts` | ✅ |
| API-9.1.3 | 测试 POST /api/v1/agent/read-file 路径遍历攻击 | `tests/api/agent-api.spec.ts` | ✅ |
| API-9.1.3b | 测试 POST /api/v1/agent/read-file 多层路径遍历攻击 | `tests/api/agent-api.spec.ts` | ✅ |
| API-9.1.4 | 测试 POST /api/v1/agent/list-files 列出目录内容 | `tests/api/agent-api.spec.ts` | ✅ |
| API-9.1.4b | 测试 POST /api/v1/agent/list-files 目录不存在 | `tests/api/agent-api.spec.ts` | ✅ |
| API-9.1.5 | 测试 POST /api/v1/agent/search-code 搜索代码 | `tests/api/agent-api.spec.ts` | ✅ |
| API-9.1.5b | 测试 POST /api/v1/agent/search-code 不匹配模式 | `tests/api/agent-api.spec.ts` | ✅ |
| API-9.1.5c | 测试 POST /api/v1/agent/search-code 全工作区搜索 | `tests/api/agent-api.spec.ts` | ✅ |

### E2E Tests

| Test ID | Description | File | Status |
|---------|-------------|------|--------|
| E2E-9.1.1 | Agent模式关闭时显示警告 | `tests/e2e/agent-file-reading.spec.ts` | ✅ |
| E2E-9.1.2 | Agent模式开启时显示搜索UI | `tests/e2e/agent-file-reading.spec.ts` | ✅ |
| E2E-9.1.3 | 搜索输入功能 | `tests/e2e/agent-file-reading.spec.ts` | ✅ |
| E2E-9.1.4 | 聊天面板显示 | `tests/e2e/agent-file-reading.spec.ts` | ✅ |
| E2E-9.1.5 | 消息发送功能 | `tests/e2e/agent-file-reading.spec.ts` | ✅ |
| E2E-9.1.6 | Agent模式开启时搜索UI可见 | `tests/e2e/agent-file-reading.spec.ts` | ✅ |

---

## 🔧 Test Infrastructure

### Required Test Fixtures

| Fixture | Description | Path | Status |
|---------|-------------|------|--------|
| Test workspace | 包含测试文件的工作区目录 | `tests/fixtures/test-workspace/` | ✅ |
| Test file | 用于文件读取测试的示例文件 | `tests/fixtures/test-workspace/test-file.ts` | ✅ |
| Nested test file | 用于嵌套目录搜索测试 | `tests/fixtures/test-workspace/nested/nested-file.ts` | ✅ |
| Search target file | 用于代码搜索测试 | `tests/fixtures/test-workspace/search-target.ts` | ✅ |
| Agent mode toggle | 测试 Agent 模式开关 | UI component | ✅ |

### Required API Endpoints

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/api/v1/agent/read-file` | POST | 读取文件内容 | ✅ |
| `/api/v1/agent/list-files` | POST | 列出目录内容 | ✅ |
| `/api/v1/agent/search-code` | POST | 搜索代码 | ✅ |

---

## ✅ Test Completion Status

| Status | Count |
|--------|-------|
| Total tests planned | 33 |
| Unit tests (前端) | 10 |
| Unit tests (后端) | 10 |
| API tests | 9 |
| E2E tests | 6 |
| Tests created | 33 |
| Tests passing | 0 |

---

## 📊 Priority Distribution

| Priority | Count | Percentage |
|----------|-------|------------|
| P0 | 7 | 21% |
| P1 | 26 | 79% |

---

**Last Updated:** 2026-07-09
