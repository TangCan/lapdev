---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-generation-mode', 'step-03-test-strategy', 'step-04-generate-tests']
lastStep: 'step-04-generate-tests'
lastSaved: '2026-05-27'
storyId: '1.3'
storyKey: '1-3-terminal'
storyFile: '/home/ars/richard/2026/pvm_2/lapdev/implementation_artifacts/1-3-terminal.md'
atddChecklistPath: '/home/ars/richard/2026/pvm_2/lapdev/tests/atdd-checklist-1-3-terminal.md'
generatedTestFiles: [
  'tests/api/terminal.spec.ts',
  'tests/e2e/terminal.spec.ts'
]
inputDocuments: [
  '/home/ars/richard/2026/pvm_2/lapdev/implementation_artifacts/1-3-terminal.md',
  '/home/ars/richard/2026/pvm_2/lapdev/docs/epics.md'
]
---

# ATDD Checklist for Story 1.3: 内置终端

## 📋 Story Overview

**Story ID:** 1.3  
**Story Key:** 1-3-terminal  
**Epic:** Epic 1 - 基础IDE功能  
**FRs Covered:** FR-007, FR-008  
**Priority:** P0  

## ✅ Acceptance Criteria Coverage

| AC | Description | Test Level | Priority | Status |
|---|-------------|------------|----------|--------|
| AC-1 | 终端面板打开 | E2E | P0 | ✅ Covered |
| AC-2 | 命令执行 (延迟 < 50ms) | E2E + API | P0 | ✅ Covered |
| AC-3 | 多终端Tab支持 | E2E | P1 | ✅ Covered |
| AC-4 | 终端尺寸调整 | E2E | P2 | ✅ Covered |
| AC-5 | 终端颜色与样式 | E2E | P2 | ✅ Covered |

## 📁 Generated Test Files

### API Tests (`tests/api/terminal.spec.ts`)
| Test | Priority | Description |
|------|----------|-------------|
| `should create a new terminal session` | P0 | 创建终端会话 |
| `should execute command in terminal` | P0 | 执行终端命令 |
| `should resize terminal and send SIGWINCH` | P1 | 调整终端尺寸 |
| `should close terminal session` | P1 | 关闭终端会话 |
| `should return error for invalid session ID` | P2 | 无效会话ID错误处理 |
| `should handle multiple concurrent sessions` | P2 | 多会话并发处理 |

### E2E Tests (`tests/e2e/terminal.spec.ts`)
| Test | Priority | Description |
|------|----------|-------------|
| `should open terminal panel when clicking terminal button` | P0 | 打开终端面板 |
| `should execute command and display output` | P0 | 执行命令显示输出 |
| `should have command execution delay under 50ms` | P0 | 命令执行延迟测试 |
| `should support multiple terminal tabs` | P1 | 多终端Tab支持 |
| `should allow closing terminal tabs` | P1 | 关闭终端Tab |
| `should allow renaming terminal tabs` | P2 | 重命名终端Tab |
| `should display ANSI colors in terminal output` | P2 | ANSI颜色显示 |
| `should resize terminal panel when dragging` | P3 | 调整终端面板尺寸 |

## 🔴 TDD Red Phase Status

✅ **All tests generated with `test.skip()`**  
✅ **Tests assert EXPECTED behavior**  
✅ **No active passing tests**  
✅ **Tests will FAIL until feature is implemented**  

## 📊 Test Statistics

- **Total Tests Generated:** 14
- **API Tests:** 6
- **E2E Tests:** 8
- **Priority Distribution:**
  - P0: 5 tests
  - P1: 3 tests
  - P2: 4 tests
  - P3: 2 tests

## 🛠️ Fixture Needs

- Terminal session management fixtures
- WebSocket connection fixtures
- Test data factories for terminal commands

## 📝 Notes

All tests are currently in RED phase (`test.skip()`). Once the terminal feature is implemented, remove the `test.skip()` markers to verify the GREEN phase.
