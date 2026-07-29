---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-generation-mode', 'step-03-test-strategy', 'step-04-generate-tests']
lastStep: 'step-04-generate-tests'
lastSaved: '2026-07-29'
storyId: 'EPI2.01'
storyKey: 'epi2-01-monaco-editor-lazy-loading'
storyFile: 'implementation_artifacts/epi2-01-monaco-editor-lazy-loading.md'
atddChecklistPath: '_bmad-output/test-artifacts/atdd-checklist-epi2-01-monaco-editor-lazy-loading.md'
generatedTestFiles:
  - 'frontend/src/components/Editor/LazyCodeEditor.test.tsx'
  - 'tests/e2e/monaco-lazy-loading.spec.ts'
inputDocuments:
  - '.trae/skills/bmad-testarch-atdd/resources/knowledge/test-quality.md'
  - '.trae/skills/bmad-testarch-atdd/resources/knowledge/selector-resilience.md'
  - '.trae/skills/bmad-testarch-atdd/resources/knowledge/data-factories.md'
  - '.trae/skills/bmad-testarch-atdd/resources/knowledge/component-tdd.md'
  - '.trae/skills/bmad-testarch-atdd/resources/knowledge/test-healing-patterns.md'
  - '.trae/skills/bmad-testarch-atdd/resources/knowledge/timing-debugging.md'
  - '.trae/skills/bmad-testarch-atdd/resources/knowledge/test-levels-framework.md'
  - '.trae/skills/bmad-testarch-atdd/resources/knowledge/test-priorities-matrix.md'
  - 'tests/e2e/utils/testUtils.ts'
  - 'playwright.config.ts'
  - 'frontend/package.json'
---

# ATDD Checklist: epi2-01-monaco-editor-lazy-loading

## Step 1: Preflight & Context Loading

### Stack Detection
- **Detected Stack**: `fullstack`
- **Frontend**: React 19.2.0, TypeScript 5.5.0, Vite 6.0.0, Vitest 2.0.5, Testing Library 16.0.0
- **Backend**: Node.js/TypeScript API (verified via tests/api/ directory)
- **Test Framework**: Playwright 1.44.0 (E2E), Vitest 2.0.5 (Unit)

### Prerequisites Check
- ✅ Story approved with clear acceptance criteria (6 ACs)
- ✅ Test framework configured: `playwright.config.ts` at project root
- ✅ Development environment available (npm scripts configured)

### Story Context
- **Story Title**: Monaco Editor 懒加载
- **Story Key**: `epi2-01-monaco-editor-lazy-loading`
- **Story ID**: `EPI2.01`
- **Status**: ready-for-dev

#### Acceptance Criteria
1. AC1: 首屏无 Monaco chunk，LCP 减少 50%+
2. AC2: 点击文件显示 "Click to edit" → "Loading editor..." → 渲染 Monaco（300ms 内）
3. AC3: 首次加载后切换 tab 直接显示编辑器，延迟 < 100ms
4. AC4: SimpleIDE 同样使用懒加载，不破坏现有 API
5. AC5: 生产构建成功，monaco 代码拆分到独立 chunk，首屏 bundle 减少 ≥ 30%
6. AC6: 所有现有测试 + 新增懒加载测试通过

#### Affected Components
- `LazyCodeEditor.tsx` - 核心懒加载组件
- `monacoLoader.ts` - Monaco 加载器（需改为动态 import）
- `IDE.tsx` - 主 IDE 页面（需切换到 LazyCodeEditor）
- `SimpleIDE.tsx` - 简化 IDE 页面（需切换到 LazyCodeEditor）
- `Editor/index.ts` - 导出调整
- `vite.config.ts` - manualChunks 配置

#### Key Technical Constraints
- Monaco Workers 必须在首次 import 前配置 `window.MonacoEnvironment.getWorker`
- LspCodeEditor 的 LSP 依赖在 App.tsx 根组件中已挂载
- `editorLoadedOnce` 模块级标志位用于避免重复加载
- DiffLine 类型导出需保持兼容

### Framework & Existing Patterns
- **Unit Test Location**: `frontend/src/**/*.test.tsx` (Vitest)
- **E2E Test Location**: `tests/e2e/**/*.spec.ts` (Playwright)
- **API Test Location**: `tests/api/**/*.test.ts` (Playwright)
- **Existing Test Utilities**: `tests/e2e/utils/testUtils.ts`
  - `setupAIConfig()`, `setupOperationLogs()`, `safeClick()`, `safeGoto()`, `retry()`
  - `waitForVisible()`, `waitForHidden()`, `waitForPageReady()`
- **Selector Pattern**: data-testid 优先，ARIA roles 其次
- **Existing Editor Tests**: `CodeEditor.test.tsx`, `MockCodeEditor.test.tsx`

### TEA Config Flags
- `tea_use_playwright_utils`: true
- `tea_use_pactjs_utils`: false
- `tea_pact_mcp`: none
- `tea_browser_automation`: auto
- `test_stack_type`: auto → detected as `fullstack`
- `risk_threshold`: p1

### Knowledge Base Fragments Loaded
**Core (always loaded):**
- test-quality.md (确定性、隔离性、显式断言、聚焦、快速)
- selector-resilience.md (data-testid > ARIA > text > CSS/ID)
- data-factories.md (工厂函数 + API 优先设置)
- component-tdd.md (红-绿-重构循环, Provider 隔离)
- test-healing-patterns.md (选择器/时序/数据/网络/硬等待修复)

**Frontend/Fullstack specific:**
- timing-debugging.md (网络优先模式, 确定性等待)
- test-levels-framework.md (单元/集成/E2E 选择指南)
- test-priorities-matrix.md (P0-P3 优先级矩阵)

---

## Step 2: Generation Mode Selection

### Chosen Mode: AI Generation

**Reasoning:**
1. 验收标准清晰（6 条具体 AC，可量化指标）
2. 场景相对标准（代码编辑器懒加载、动态 import、状态转换）
3. 故事涉及性能指标验证，需要 AI 生成详细的单元测试和 E2E 测试
4. `tea_browser_automation` 为 `auto`，但此故事以功能验证为主，不需要复杂 UI 录制
5. 现有项目测试模式成熟，可直接遵循已有模式生成

### Test Strategy Considerations
- **Unit Tests (Vitest)**: LazyCodeEditor 组件渲染逻辑、状态转换、动态 import 行为
- **E2E Tests (Playwright)**: 懒加载用户旅程、首屏性能验证、编辑器功能完整性
- **API Tests**: 构建产物验证（monaco chunk 拆分）

### Priority Assessment
- **P0 (Critical)**: AC1 (首屏无 monaco chunk), AC2 (懒加载触发), AC6 (测试通过)
- **P1 (High)**: AC3 (tab 切换复用), AC5 (构建优化)
- **P2 (Medium)**: AC4 (SimpleIDE 兼容)

---

---

## Step 3: Test Strategy

### Acceptance Criteria → Test Scenarios Mapping

| AC# | Acceptance Criterion | Test Scenario | Test Level | Priority | Test ID |
|-----|---------------------|---------------|------------|----------|---------|
| AC1 | 首屏无 Monaco chunk, LCP ↓50%+ | 首屏加载时不请求 monaco 资源 | E2E | P0 | EPI2.01-E2E-001 |
| AC1 | 同上 | 首屏 LCP 指标验证 | E2E | P1 | EPI2.01-E2E-002 |
| AC2 | 点击文件→显示"Click to edit"→加载→Monaco | LazyCodeEditor 初始渲染显示"Click to edit" | Unit | P0 | EPI2.01-UNIT-001 |
| AC2 | 同上 | onClick/onFocus 触发加载状态转换 | Unit | P0 | EPI2.01-UNIT-002 |
| AC2 | 同上 | Suspense fallback "Initializing editor..." 显示 | Unit | P0 | EPI2.01-UNIT-003 |
| AC2 | 同上 | 动态 import 完成后渲染 LspCodeEditor | Unit | P0 | EPI2.01-UNIT-004 |
| AC2 | 同上 | E2E: 用户点击文件后编辑器正常加载 | E2E | P0 | EPI2.01-E2E-003 |
| AC3 | 首次加载后切换 tab 直接显示编辑器 | editorLoadedOnce 标志位导致跳过 idle 状态 | Unit | P1 | EPI2.01-UNIT-005 |
| AC3 | 同上 | 第二次渲染直接显示 loading 状态 | Unit | P1 | EPI2.01-UNIT-006 |
| AC3 | 同上 | E2E: tab 切换无延迟显示编辑器 | E2E | P1 | EPI2.01-E2E-004 |
| AC4 | SimpleIDE 同样使用懒加载 | SimpleIDE 渲染 LazyCodeEditor | E2E | P2 | EPI2.01-E2E-005 |
| AC4 | 同上 | CodeEditor API 兼容性验证 | Unit | P2 | EPI2.01-UNIT-007 |
| AC5 | 生产构建验证 | npm run build 成功 | E2E | P1 | EPI2.01-E2E-006 |
| AC5 | 同上 | monaco chunk 拆分验证 | E2E | P1 | EPI2.01-E2E-007 |
| AC5 | 同上 | 首屏 bundle 大小减少 ≥30% | E2E | P1 | EPI2.01-E2E-008 |
| AC6 | 所有测试通过 | 现有 316+ 单元测试通过 | Unit | P0 | EPI2.01-UNIT-008 |
| AC6 | 同上 | E2E 回归测试通过 | E2E | P0 | EPI2.01-E2E-009 |

### Test Level Selection Rationale
- **Unit Tests (Vitest)**: LazyCodeEditor 组件的渲染逻辑、状态转换、模块缓存行为 → 快速、隔离、可重复
- **E2E Tests (Playwright)**: 用户真实旅程（打开文件、懒加载、tab 切换）、构建产物验证 → 真实环境验证
- **不使用 Integration Tests**: 此故事主要涉及前端组件改造和构建配置，不需要服务端集成测试

### Red Phase Requirements
- 所有测试必须标记为 `test.skip()`（TDD 红阶段）
- 测试断言描述期望行为，实现后应变为 green
- 每个测试覆盖单一关注点（< 100 行）
- 使用 data-testid 选择器确保弹性
- 无硬等待，使用确定性 waits

### Test Files to Generate
1. **Unit**: `frontend/src/components/Editor/LazyCodeEditor.test.tsx`
   - 8 unit tests covering rendering, state transitions, caching behavior
2. **E2E**: `tests/e2e/monaco-lazy-loading.spec.ts`
   - 9 E2E tests covering user journeys, performance validation

---

## Next Steps
→ Proceed to Step 4: Generate Red-Phase Test Scaffolds

---

## Step 4: Red-Phase Test Scaffold Generation

### Execution Mode: Sequential (AI Generation)

### Generated Test Files

#### 1. Unit Tests: `frontend/src/components/Editor/LazyCodeEditor.test.tsx`
- **Framework**: Vitest + Testing Library
- **Total Tests**: 11 (all `it.skip()`)
- **Coverage**:
  - EPI2.01-UNIT-001 [P0]: 初始渲染显示 "Click to edit"
  - EPI2.01-UNIT-002 [P0]: onClick 触发 loading 状态
  - EPI2.01-UNIT-003 [P0]: onFocus 触发 loading 状态
  - EPI2.01-UNIT-004 [P0]: Suspense fallback 显示
  - EPI2.01-UNIT-005 [P1]: editorLoadedOnce 缓存跳过 idle
  - EPI2.01-UNIT-006 [P1]: 二次渲染无延迟
  - EPI2.01-UNIT-007 [P2]: CodeEditor API 兼容性
  - EPI2.01-UNIT-008 [P0]: 现有测试回归
  - EPI2.01-UNIT-009 [P2]: 加载失败重试机制
  - EPI2.01-UNIT-010 [P1]: 首次加载延迟 ≤ 300ms
  - EPI2.01-UNIT-011 [P1]: 二次切换延迟 ≤ 100ms

#### 2. E2E Tests: `tests/e2e/monaco-lazy-loading.spec.ts`
- **Framework**: Playwright
- **Total Tests**: 11 (all `test.skip()`)
- **Coverage**:
  - EPI2.01-E2E-001 [P0]: 首屏无 monaco chunk 请求
  - EPI2.01-E2E-002 [P1]: LCP 指标减少 50%+
  - EPI2.01-E2E-003 [P0]: 点击文件加载编辑器旅程
  - EPI2.01-E2E-004 [P1]: Tab 切换无延迟
  - EPI2.01-E2E-005 [P2]: SimpleIDE 兼容
  - EPI2.01-E2E-006 [P1]: 构建成功
  - EPI2.01-E2E-007 [P1]: monaco chunk 拆分
  - EPI2.01-E2E-008 [P1]: 首屏 bundle 减少 ≥ 30%
  - EPI2.01-E2E-009 [P0]: 回归测试通过
  - EPI2.01-E2E-010 [P2]: 加载失败重试
  - EPI2.01-E2E-011 [P1]: 功能完整性验证

### TDD RED PHASE Summary

🔴 **TDD RED PHASE: Test Scaffolds Generated**

✅ 两个测试文件已生成，全部标记为 skip
- **Unit Tests**: 11 个测试场景（Vitest）
- **E2E Tests**: 11 个测试场景（Playwright）

📋 所有测试断言描述期望行为，实现后变为 GREEN
📋 选择器遵循 data-testid > ARIA > text 层次
📋 无硬等待，使用确定性 waits
📋 每个测试 < 100 行，聚焦单一关注点

### AC Coverage Summary

| AC# | Description | Unit Tests | E2E Tests | Status |
|-----|-------------|------------|-----------|--------|
| AC1 | 首屏无 monaco chunk | - | 001, 002 | 🔴 SKIP |
| AC2 | 懒加载触发与渲染 | 001, 002, 003, 004 | 003 | 🔴 SKIP |
| AC3 | Tab 切换复用 | 005, 006 | 004 | 🔴 SKIP |
| AC4 | SimpleIDE 兼容 | 007 | 005 | 🔴 SKIP |
| AC5 | 构建优化 | - | 006, 007, 008 | 🔴 SKIP |
| AC6 | 测试通过 | 008 | 009 | 🔴 SKIP |

### Next Steps
1. 使用 `bmad-dev-story` 技能实现故事
2. 实现完成后，将 `it.skip()` / `test.skip()` 替换为 `it()` / `test()` 激活测试
3. 运行 `npm run test` 和 `npm run test:regression` 验证测试通过
4. 使用 `bmad-code-review` 进行代码审查
