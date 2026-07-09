---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-generation-mode', 'step-03-test-strategy', 'step-04-generate-tests', 'step-04c-aggregate', 'step-05-validate-and-complete']
lastStep: 'step-05-validate-and-complete'
lastSaved: '2026-07-08'
storyId: '8.1'
storyKey: '8-1-lsp-hover-provider'
storyFile: 'implementation_artifacts/8-1-lsp-hover-provider.md'
atddChecklistPath: 'tests/atdd-checklist-8-1-lsp-hover-provider.md'
generatedTestFiles:
  - 'tests/e2e/lsp-hover.spec.ts'
  - 'tests/api/lsp-hover.test.ts'
  - 'frontend/src/services/lspService.test.ts'
  - 'backend/src/handlers/lspHandler.test.ts'
  - 'tests/fixtures/hover-test.ts'
  - 'tests/fixtures/hover-error.ts'
inputDocuments: []
tddPhase: 'RED'
totalTests: 23
apiTests: 6
e2eTests: 6
unitTests: 5
backendTests: 6
fixturesCreated: 2
allTestsSkipped: true
---

# ATDD Checklist: Story 8.1 - 注册LSP悬停提供商

## Project Context

- **Project:** LapDev IDE
- **Stack:** fullstack (React + TypeScript + Vite + Deno)
- **Test Framework:** Playwright (E2E), Vitest (Unit), Deno Test (Backend)

## Story Overview

**Story ID:** 8.1
**Title:** 注册LSP悬停提供商
**Status:** ready-for-dev

**Acceptance Criteria:**

1. **Given** 用户打开了一个 .ts 或 .rs 文件
   **And** LSP 服务已初始化完成
   **When** 用户将鼠标悬停在变量、函数或类名上
   **Then** 弹出浮动提示框显示符号的类型信息
   **And** 如果有文档注释，显示文档内容

2. **Given** 用户打开了一个 .ts 文件
   **When** 用户悬停在导入语句的模块名上
   **Then** 提示框显示模块导出的符号列表

3. **Given** 用户悬停在有类型错误的符号上
   **Then** 提示框显示错误信息和可能的修复建议

4. **Given** 用户悬停在泛型类型参数上
   **Then** 提示框显示类型约束和边界信息

## Test Strategy

### E2E Tests (Playwright)

| # | Test Case | Priority | AC Covered | Description |
|---|---|---|---|---|
| E1 | 悬停在变量上显示类型信息 | P0 | AC1 | 验证鼠标悬停在变量上时显示类型信息 |
| E2 | 悬停在函数上显示类型信息和文档 | P0 | AC1 | 验证鼠标悬停在函数上时显示类型信息和文档注释 |
| E3 | 悬停在类名上显示类型信息 | P0 | AC1 | 验证鼠标悬停在类名上时显示类型信息 |
| E4 | 悬停在导入模块名上显示导出列表 | P1 | AC2 | 验证鼠标悬停在导入模块名上时显示导出符号列表 |
| E5 | 悬停在有类型错误的符号上显示错误信息 | P1 | AC3 | 验证鼠标悬停在有类型错误的符号上时显示错误信息 |
| E6 | 悬停在泛型类型参数上显示约束信息 | P2 | AC4 | 验证鼠标悬停在泛型类型参数上时显示约束和边界信息 |

### API Tests (Playwright)

| # | Test Case | Priority | AC Covered | Description |
|---|---|---|---|---|
| A1 | hover API 端点返回正确的 Hover 对象 | P0 | AC1-4 | 验证 POST /api/v1/lsp/hover 返回正确格式的响应 |
| A2 | hover API 处理无效位置参数 | P1 | AC1-4 | 验证无效位置参数返回 400 错误 |
| A3 | hover API 处理未初始化的 LSP 会话 | P1 | AC1-4 | 验证未初始化会话返回 404 错误 |

### Unit Tests (Vitest)

| # | Test Case | Priority | AC Covered | Description |
|---|---|---|---|---|
| U1 | getHover 方法正确调用后端 API | P1 | AC1-4 | 验证 lspService.getHover 正确调用后端 /v1/lsp/hover 端点 |
| U2 | getHover 方法处理成功响应 | P1 | AC1-4 | 验证成功响应被正确解析为 Hover 对象 |
| U3 | getHover 方法处理错误响应 | P1 | AC1-4 | 验证错误响应被正确处理 |
| U4 | HoverProvider 正确注册到 Monaco | P1 | AC1-4 | 验证 hoverProvider 正确注册到 Monaco 编辑器 |
| U5 | provideHover 回调正确调用 getHover | P1 | AC1-4 | 验证 provideHover 回调正确调用 lspService.getHover |

### Backend Unit Tests (Deno)

| # | Test Case | Priority | AC Covered | Description |
|---|---|---|---|---|
| B1 | hover 端点正确处理请求 | P0 | AC1-4 | 验证 hover 端点正确处理 POST 请求 |
| B2 | hover 端点转发请求到 LSP 服务器 | P0 | AC1-4 | 验证请求被正确转发到 LSP 服务器 |
| B3 | hover 端点返回 LSP 响应 | P0 | AC1-4 | 验证 LSP 服务器响应被正确返回 |
| B4 | hover 端点处理 LSP 错误 | P1 | AC1-4 | 验证 LSP 错误被正确处理 |

## Test Artifacts

### E2E Test File
- `tests/e2e/lsp-hover.spec.ts`

### API Test File
- `tests/api/lsp-hover.test.ts`

### Unit Test Files
- `frontend/src/services/lspService.test.ts`
- `frontend/src/context/LSPContext.test.tsx`

### Backend Test File
- `backend/src/handlers/lspHandler.test.ts`

## Red Phase Requirements

All tests must be designed to **fail before implementation** (TDD red phase):

1. E2E tests should fail because hover popup doesn't exist
2. API tests should fail because hover endpoint doesn't exist
3. Unit tests should fail because getHover method doesn't exist
4. Backend tests should fail because hover handler doesn't exist

## Test Data Requirements

### Test Files for E2E Tests
- `test-data/hover-test.ts` - 包含变量、函数、类、导入语句、泛型类型的测试文件
- `test-data/hover-error.ts` - 包含类型错误的测试文件

### Mock Data for API Tests
- Mock LSP server responses for hover requests

## Test Execution Order

1. **Unit Tests** (fastest, run first)
2. **API Tests** (validate contract)
3. **Backend Tests** (validate server logic)
4. **E2E Tests** (validate user journey, slowest)

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| LSP 服务器未初始化 | Medium | High | 添加等待 LSP 初始化完成的机制 |
| 悬停提示框定位困难 | Low | Medium | 使用可靠的选择器策略 |
| 异步加载延迟 | Medium | Medium | 添加适当的等待时间 |
| 不同语言的 LSP 行为差异 | Low | High | 针对不同语言分别测试 |

## Success Criteria

All tests must pass with:
- 0 failures
- 0 flaky tests
- Full coverage of acceptance criteria

---

**Checklist Version:** 1.0
**Created:** 2026-07-08
**Updated:** 2026-07-08
