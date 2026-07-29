---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-generation-mode', 'step-03-test-strategy', 'step-04-generate-tests', 'step-05-validate-and-complete']
lastStep: 'step-05-validate-and-complete'
lastSaved: '2026-07-29'
storyId: 'EPI2.02'
storyKey: 'epi2-02-large-file-optimization'
storyFile: 'implementation_artifacts/epi2-02-large-file-optimization.md'
atddChecklistPath: '_bmad-output/test-artifacts/atdd-checklist-epi2-02-large-file-optimization.md'
generatedTestFiles:
  - 'frontend/src/utils/monacoOptimizer.test.ts'
  - 'frontend/src/components/Editor/LspCodeEditor.test.tsx'
  - 'tests/e2e/large-file-optimization.spec.ts'
inputDocuments:
  - 'implementation_artifacts/epi2-02-large-file-optimization.md'
  - 'docs/epics.md'
  - 'docs/architecture.md'
  - 'frontend/src/utils/monacoOptimizer.ts'
  - 'frontend/src/components/Editor/LspCodeEditor.tsx'
  - 'frontend/src/components/Editor/LazyCodeEditor.tsx'
  - 'frontend/src/services/monacoLoader.ts'
  - 'tests/e2e/utils/testUtils.ts'
  - 'playwright.config.ts'
  - 'frontend/vitest.config.ts'
---

# ATDD Checklist: epi2-02-large-file-optimization

## Step 1: Preflight & Context Loading

### Stack Detection
- **Detected Stack**: `fullstack`
- **Frontend**: React 18.3.1, TypeScript 5.5.0, Vite 6.0.0, Vitest 2.0.5, Testing Library 16.0.0
- **Backend**: Deno (TypeScript)
- **Test Framework**: Playwright 1.44.0 (E2E), Vitest 2.0.5 (Unit)

### Prerequisites Check
- ✅ Story approved with clear acceptance criteria (7 ACs)
- ✅ Test framework configured: `playwright.config.ts` at project root
- ✅ Vitest configured: `frontend/vitest.config.ts` with jsdom environment
- ✅ Development environment available (npm scripts configured)

### Story Context
- **Story Title**: 大文件优化配置
- **Story Key**: `epi2-02-large-file-optimization`
- **Story ID**: `EPI2.02`
- **Status**: ready-for-dev

#### Acceptance Criteria
1. AC1: ≥10k 行文件自动禁用 minimap/folding/hover/codeLens 等
2. AC2: ≥50k 行超大文件进一步禁用 lineNumbers、限制 multiCursor
3. AC3: <10k 行普通文件保持完整功能
4. AC4: 编辑中跨越阈值时通过 updateOptions() 动态生效
5. AC5: SimpleIDE 与主 IDE 共享优化路径
6. AC6: 单元测试全部通过
7. AC7: 构建成功且不破坏懒加载切分

#### Affected Components
- `monacoOptimizer.ts` - 大文件优化工具（已存在，待集成）
- `LspCodeEditor.tsx` - 编辑器核心（需集成优化选项）
- `LazyCodeEditor.tsx` - 懒加载包装器（可选调整）
- `monacoLoader.ts` - Monaco 加载服务

#### Key Technical Constraints
- 禁止 `import * as Monaco from 'monaco-editor'` 顶层静态导入
- 仅通过 `getMonacoSync()` 在运行时获取 Monaco 模块
- 类型使用 `import type { editor } from 'monaco-editor'`
- 阈值切换用 `editor.updateOptions()`，不要销毁重建编辑器
- 保留 AI 内联补全、Diff 装饰、快捷键、LSP 连接等既有行为
- 用户显式 minimap prop 在大文件时被性能优化覆盖

### Framework & Existing Patterns
- **Unit Test Location**: `frontend/src/**/*.test.ts(x)` (Vitest)
- **E2E Test Location**: `tests/e2e/**/*.spec.ts` (Playwright)
- **Existing Test Utilities**: `tests/e2e/utils/testUtils.ts`
- **Selector Pattern**: data-testid 优先
- **Existing Editor Tests**: `CodeEditor.test.tsx`, `MockCodeEditor.test.tsx`, `LazyCodeEditor.test.tsx`

### TEA Config Flags
- `tea_use_playwright_utils`: true
- `tea_use_pactjs_utils`: false
- `tea_browser_automation`: auto
- `test_stack_type`: auto → detected as `fullstack`
- `risk_threshold`: p1

---

## Step 2: Generation Mode Selection

### Chosen Mode: AI Generation

**Reasoning:**
1. 验收标准清晰（7 条具体 AC，可量化阈值）
2. 场景标准：工具函数单元测试 + 组件集成测试 + E2E 验证
3. 核心逻辑（monacoOptimizer.ts）已存在，只需编写测试验证其行为
4. 需要边界条件测试覆盖（9999/10000/10001/49999/50000/50001 行）

---

## Step 3: Test Strategy

### Acceptance Criteria → Test Scenarios Mapping

| AC# | Acceptance Criterion | Test Scenario | Test Level | Priority | Test ID |
|-----|---------------------|---------------|------------|----------|---------|
| AC1 | ≥10k行自动禁用功能 | isLargeFile() 正确检测 10k+ 行 | Unit | P0 | EPI2.02-UNIT-001 |
| AC1 | 同上 | getOptimizedEditorOptions 禁用 minimap | Unit | P0 | EPI2.02-UNIT-002 |
| AC1 | 同上 | getOptimizedEditorOptions 禁用 folding | Unit | P0 | EPI2.02-UNIT-003 |
| AC1 | 同上 | getOptimizedEditorOptions 禁用 hover/codeLens/links | Unit | P0 | EPI2.02-UNIT-004 |
| AC2 | ≥50k行进一步优化 | isHugeFile() 正确检测 50k+ 行 | Unit | P0 | EPI2.02-UNIT-005 |
| AC2 | 同上 | 超大文件禁用 lineNumbers | Unit | P0 | EPI2.02-UNIT-006 |
| AC2 | 同上 | 超大文件限制 multiCursorLimit | Unit | P1 | EPI2.02-UNIT-007 |
| AC3 | <10k行保持完整 | 普通文件所有功能保持启用 | Unit | P0 | EPI2.02-UNIT-008 |
| AC3 | 同上 | baseOptions 用户选项正确传递 | Unit | P1 | EPI2.02-UNIT-009 |
| AC4 | 编辑中跨阈值 | LspCodeEditor 调用 getOptimizedEditorOptions | Integration | P0 | EPI2.02-INT-001 |
| AC4 | 同上 | 跨越阈值时调用 updateOptions | Integration | P0 | EPI2.02-INT-002 |
| AC5 | SimpleIDE 共享路径 | LazyCodeEditor 透传 minimap prop | Integration | P1 | EPI2.02-INT-003 |
| AC6 | 单元测试通过 | monacoOptimizer 全部测试通过 | Unit | P0 | EPI2.02-UNIT-010 |
| AC7 | 不破坏懒加载 | monacoOptimizer 无静态 monaco 导入 | Unit | P1 | EPI2.02-UNIT-011 |
| AC1 | E2E 验证 | 打开大文件验证 minimap 被禁用 | E2E | P1 | EPI2.02-E2E-001 |
| AC2 | E2E 验证 | 打开超大文件验证 lineNumbers 关闭 | E2E | P2 | EPI2.02-E2E-002 |
| AC4 | E2E 验证 | 编辑创建大文件后验证优化生效 | E2E | P1 | EPI2.02-E2E-003 |

### Test Level Selection Rationale
- **Unit Tests (Vitest)**: `monacoOptimizer.ts` 的纯函数 → 快速、隔离、可重复、确定性
- **Integration Tests (Vitest)**: `LspCodeEditor` 与 `monacoOptimizer` 的集成 → 验证调用链和 updateOptions 行为
- **E2E Tests (Playwright)**: 真实浏览器验证大文件优化效果 → DOM 级验证 minimap/lineNumbers 状态

### Boundary Conditions to Test
- 9,999 行 → 不是大文件（false）
- 10,000 行 → 不是大文件（false，使用 > 而非 >=）
- 10,001 行 → 是大文件（true）
- 49,999 行 → 不是超大文件（false）
- 50,000 行 → 不是超大文件（false）
- 50,001 行 → 是超大文件（true）
- 0 行（空字符串）→ 不是大文件
- 1 行 → 不是大文件
- 单行超长文本 → isLargeFile 基于行数而非字符数

### Red Phase Requirements
- 所有测试必须标记为 `test.skip()` / `it.skip()`（TDD 红阶段）
- 测试断言描述期望行为，实现后应变为 green
- 每个测试覆盖单一关注点（< 80 行）
- 使用 data-testid 选择器确保弹性
- 无硬等待，使用确定性 waits

### Test Files to Generate
1. **Unit**: `frontend/src/utils/monacoOptimizer.test.ts`
   - 11 unit tests covering threshold detection, option generation, boundary conditions
2. **Integration**: `frontend/src/components/Editor/LspCodeEditor.test.tsx`
   - 3 integration tests covering optimizer integration, updateOptions, prop passthrough
3. **E2E**: `tests/e2e/large-file-optimization.spec.ts`
   - 3 E2E tests covering large file user journeys

---

## Step 4: Red-Phase Test Scaffold Generation

### Execution Mode: Sequential (AI Generation)

### Generated Test Files

#### 1. Unit Tests: `frontend/src/utils/monacoOptimizer.test.ts`
- **Framework**: Vitest
- **Total Tests**: 29 (all `it.skip()`)
- **Coverage**:
  - EPI2.02-UNIT-001 [P0]: isLargeFile 正确检测 10k+ 行
  - EPI2.02-UNIT-001b/001c/001d/001e: 边界条件 (9999/10000/空/单行)
  - EPI2.02-UNIT-002 [P0]: 大文件禁用 minimap
  - EPI2.02-UNIT-003 [P0]: 大文件禁用 folding
  - EPI2.02-UNIT-004/004b/004c/004d [P0]: 大文件禁用 hover/codeLens/links/fontLigatures/scrollBeyondLastLine
  - EPI2.02-UNIT-005/005b/005c/005d [P0]: isHugeFile 边界条件
  - EPI2.02-UNIT-006 [P0]: 超大文件禁用 lineNumbers
  - EPI2.02-UNIT-007/007b/007c [P1]: 超大文件 multiCursorLimit/smoothScrolling/renderWhitespace
  - EPI2.02-UNIT-008 [P0]: 普通文件保持完整功能
  - EPI2.02-UNIT-009/009b/009c [P1]: baseOptions 传递与覆盖
  - EPI2.02-UNIT-010/010b [P1]: 常量导出验证
  - EPI2.02-UNIT-011/011b [P1]: 懒加载兼容性
  - EPI2.02-UNIT-012/013 [P2]: 综合场景

#### 2. Integration Tests: `frontend/src/components/Editor/LspCodeEditor.test.tsx`
- **Framework**: Vitest + Testing Library
- **Total Tests**: 10 (all `it.skip()`)
- **Coverage**:
  - EPI2.02-INT-001 [P0]: 创建大文件时调用 getOptimizedEditorOptions
  - EPI2.02-INT-002 [P0]: 跨阈值时调用 updateOptions
  - EPI2.02-INT-003 [P1]: 超大文件额外优化
  - EPI2.02-INT-004 [P0]: 普通文件不应用优化
  - EPI2.02-INT-005/006 [P1]: minimap prop 透传与覆盖
  - EPI2.02-INT-007/008/009/010 [P0/P1]: 回归保护 (AI补全/Diff/快捷键/LSP)

#### 3. E2E Tests: `tests/e2e/large-file-optimization.spec.ts`
- **Framework**: Playwright
- **Total Tests**: 11 (all `test.skip()`)
- **Coverage**:
  - EPI2.02-E2E-001/002/003 [P1]: 大文件 minimap/folding/hover 禁用
  - EPI2.02-E2E-004/005 [P2]: 超大文件 lineNumbers/滚动
  - EPI2.02-E2E-006/007 [P1]: 普通文件功能完整
  - EPI2.02-E2E-008 [P1]: 编辑跨阈值动态更新
  - EPI2.02-E2E-009 [P2]: SimpleIDE 兼容
  - EPI2.02-E2E-010 [P1]: 性能验证 (NFR-002)
  - EPI2.02-E2E-011 [P2]: 大文件保存功能

### TDD RED PHASE Summary

🔴 **TDD RED PHASE: Test Scaffolds Generated**

✅ 三个测试文件已生成，全部标记为 skip
- **Unit Tests**: 29 个测试场景（Vitest）
- **Integration Tests**: 10 个测试场景（Vitest + Testing Library）
- **E2E Tests**: 11 个测试场景（Playwright）

📋 总计: 50 个红阶段测试用例
📋 所有测试断言描述期望行为，实现后变为 GREEN
📋 选择器遵循 data-testid > ARIA > text 层次
📋 无硬等待，使用确定性 waits
📋 每个测试 < 80 行，聚焦单一关注点

### AC Coverage Summary

| AC# | Description | Unit Tests | Integration Tests | E2E Tests | Status |
|-----|-------------|------------|-------------------|-----------|--------|
| AC1 | ≥10k 行自动禁用功能 | 001-004d | 001, 004 | 001-003 | 🔴 SKIP |
| AC2 | ≥50k 行额外优化 | 005-007c | 003 | 004, 005 | 🔴 SKIP |
| AC3 | 普通文件完整 | 008, 009 | 004, 005 | 006, 007 | 🔴 SKIP |
| AC4 | 跨阈值 updateOptions | - | 002 | 008 | 🔴 SKIP |
| AC5 | SimpleIDE 共享路径 | - | 005, 006 | 009 | 🔴 SKIP |
| AC6 | 单元测试通过 | 010, 010b | - | - | 🔴 SKIP |
| AC7 | 不破坏懒加载 | 011, 011b | - | - | 🔴 SKIP |
| 回归 | AI补全/Diff/快捷键/LSP | - | 007-010 | 010, 011 | 🔴 SKIP |

### Test Run Verification
- ✅ `vitest run src/utils/monacoOptimizer.test.ts`: 29 skipped (0 errors)
- ✅ `vitest run` (全量): 435 passed | 39 skipped (474 total) — 无回归

---

## Step 5: Validate & Complete

### Validation Checklist

| Check | Status | Notes |
|-------|--------|-------|
| Story acceptance criteria analyzed | ✅ | 7 ACs mapped to 3 test levels |
| Red-phase test scaffolds created | ✅ | 50 tests across 3 files |
| Given-When-Then format used | ✅ | 所有测试使用 Given/When/Then 注释 |
| RED phase verified | ✅ | 全量测试通过 (435 passed, 0 errors) |
| Test files in correct directories | ✅ | utils/, components/Editor/, tests/e2e/ |
| Test naming consistent | ✅ | EPI2.02-[LEVEL]-XXX 格式 |
| TypeScript 类型正确 | ✅ | 0 errors (Hints only for unused skip imports) |
| 无 ESLint 问题 | ✅ | 无 lint 错误 |

### Completion Summary

- **Story ID**: EPI2.02
- **Story Key**: `epi2-02-large-file-optimization`
- **Primary Test Level**: Unit (Vitest)
- **Test Counts**:
  - Unit Tests: 29 (monacoOptimizer.test.ts)
  - Integration Tests: 10 (LspCodeEditor.test.tsx)
  - E2E Tests: 11 (large-file-optimization.spec.ts)
  - **Total: 50 red-phase tests**
- **Test File Paths**:
  - `frontend/src/utils/monacoOptimizer.test.ts`
  - `frontend/src/components/Editor/LspCodeEditor.test.tsx`
  - `tests/e2e/large-file-optimization.spec.ts`
- **Output File**: `_bmad-output/test-artifacts/atdd-checklist-epi2-02-large-file-optimization.md`

### Key Risks & Assumptions

1. **E2E 文件创建依赖**: E2E 测试使用 `/api/v1/agent/write-file` 创建大文件 — 已验证端点存在
2. **Monaco DOM 结构**: E2E minimap/folding 检测基于 Monaco 当前版本 (0.55.1) 的 CSS 类名 — 升级时需更新
3. **性能测量**: `NFR-002` 延迟指标在 CI 环境中测量可能不精确，建议本地开发环境验证
4. **动态更新**: AC4 的 `updateOptions()` 测试需要 LspCodeEditor 正确暴露编辑器引用

### Next Steps for DEV Team

1. 加载 `bmad-dev-story` 技能实现故事 `epi2-02-large-file-optimization`
2. 实现核心集成：将 `monacoOptimizer` 接入 `LspCodeEditor.createEditor()`
3. 实现动态更新：监听 `value` 变化，跨越阈值时调用 `editor.updateOptions()`
4. 激活测试：移除 `it.skip()` / `test.skip()` 标记
5. 运行 `npm run test` 验证 50 个测试全部通过
6. 运行 `npm run test:regression` 验证无回归
7. 使用 `bmad-code-review` 进行代码审查
