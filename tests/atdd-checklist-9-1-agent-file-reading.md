---
stepsCompleted: ['step-01-preflight-and-context']
lastStep: 'step-01-preflight-and-context'
lastSaved: '2026-07-09'
storyId: '9.1'
storyKey: '9-1-agent-file-reading'
storyFile: '/home/richard/richard/2026/2026/pvm_2/lapdev/implementation_artifacts/9-1-agent-file-reading.md'
atddChecklistPath: '/home/richard/richard/2026/2026/pvm_2/lapdev/tests/atdd-checklist-9-1-agent-file-reading.md'
generatedTestFiles:
  - 'tests/e2e/agent-file-reading.spec.ts'
  - 'tests/api/agent-api.spec.ts'
inputDocuments:
  - '/home/richard/richard/2026/2026/pvm_2/lapdev/implementation_artifacts/9-1-agent-file-reading.md'
  - '/home/richard/richard/2026/2026/pvm_2/lapdev/docs/epics.md'
  - '/home/richard/richard/2026/2026/pvm_2/lapdev/frontend/src/services/agentService.ts'
  - '/home/richard/richard/2026/2026/pvm_2/lapdev/frontend/src/context/AgentContext.tsx'
  - '/home/richard/richard/2026/2026/pvm_2/lapdev/backend/src/main.ts'
---

# ATDD Checklist - Story 9.1: Agent文件读取能力

**Story ID:** 9.1  
**Story Key:** 9-1-agent-file-reading  
**Epic:** 9 - Agent模式增强  
**Created:** 2026-07-09  

---

## 📋 Acceptance Criteria Mapping

| AC | Description | Priority | Test Type |
|----|-------------|----------|-----------|
| AC1 | Agent模式开启时，AI自动读取当前打开的文件内容，日志记录操作 | P0 | E2E |
| AC2 | Agent模式开启时，AI可以遍历工作区目录搜索代码，搜索结果显示在聊天面板中 | P0 | E2E + API |
| AC3 | Agent模式关闭时，尝试读取文件显示提示 | P1 | E2E |

---

## 🧪 Test Coverage Plan

### Unit Tests

| Test ID | Description | File | Status |
|---------|-------------|------|--------|
| UT-9.1.1 | 测试 agentService 路径验证（正常路径） | `tests/unit/agentService.test.ts` | ✅ 待创建 |
| UT-9.1.2 | 测试 agentService 路径验证（路径遍历攻击） | `tests/unit/agentService.test.ts` | ✅ 待创建 |
| UT-9.1.3 | 测试 agentHandler 文件读取功能 | `backend/tests/agentHandler.test.ts` | ✅ 待创建 |
| UT-9.1.4 | 测试 agentHandler 目录列出功能 | `backend/tests/agentHandler.test.ts` | ✅ 待创建 |
| UT-9.1.5 | 测试 agentHandler 代码搜索功能 | `backend/tests/agentHandler.test.ts` | ✅ 待创建 |

### API Tests

| Test ID | Description | File | Status |
|---------|-------------|------|--------|
| API-9.1.1 | 测试 POST /api/v1/agent/read-file 成功读取文件 | `tests/api/agent-api.spec.ts` | ✅ 待创建 |
| API-9.1.2 | 测试 POST /api/v1/agent/read-file 文件不存在 | `tests/api/agent-api.spec.ts` | ✅ 待创建 |
| API-9.1.3 | 测试 POST /api/v1/agent/read-file 路径遍历攻击 | `tests/api/agent-api.spec.ts` | ✅ 待创建 |
| API-9.1.4 | 测试 POST /api/v1/agent/list-files 列出目录内容 | `tests/api/agent-api.spec.ts` | ✅ 待创建 |
| API-9.1.5 | 测试 POST /api/v1/agent/search-code 搜索代码 | `tests/api/agent-api.spec.ts` | ✅ 待创建 |

### E2E Tests

| Test ID | Description | File | Status |
|---------|-------------|------|--------|
| E2E-9.1.1 | Agent模式开启时自动读取文件并记录日志 | `tests/e2e/agent-file-reading.spec.ts` | ✅ 待创建 |
| E2E-9.1.2 | Agent模式开启时搜索代码并显示结果 | `tests/e2e/agent-file-reading.spec.ts` | ✅ 待创建 |
| E2E-9.1.3 | Agent模式关闭时显示提示 | `tests/e2e/agent-file-reading.spec.ts` | ✅ 待创建 |

---

## 🔧 Test Infrastructure

### Required Test Fixtures

| Fixture | Description | Path |
|---------|-------------|------|
| Test workspace | 包含测试文件的工作区目录 | `tests/fixtures/test-workspace/` |
| Test file | 用于文件读取测试的示例文件 | `tests/fixtures/test-workspace/test-file.ts` |
| Agent mode toggle | 测试 Agent 模式开关 | UI component |

### Required API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/agent/read-file` | POST | 读取文件内容 |
| `/api/v1/agent/list-files` | POST | 列出目录内容 |
| `/api/v1/agent/search-code` | POST | 搜索代码 |

---

## ✅ Test Completion Status

| Status | Count |
|--------|-------|
| Total tests planned | 13 |
| Unit tests | 5 |
| API tests | 5 |
| E2E tests | 3 |
| Tests created | 0 |
| Tests passing | 0 |

---

**Last Updated:** 2026-07-09