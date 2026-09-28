---
storyId: "1.03"
storyKey: "epi1-03-remove-manual-memoization"
storyFile: "implementation_artifacts/epi1-03-remove-manual-memoization.md"
atddChecklistPath: "_bmad-output/test-artifacts/atdd-checklist-epi1-03-remove-manual-memoization.md"
stepsCompleted: ['step-01-preflight-and-context', 'step-02-generation-mode', 'step-03-test-strategy', 'step-04-generate-tests', 'step-05-validate-and-complete']
lastStep: 'step-05-validate-and-complete'
lastSaved: '2026-07-27'
generatedTestFiles:
  - "frontend/tests/unit/memo-regression.test.tsx"
  - "tests/e2e/memo-regression.spec.ts"
inputDocuments:
  - "implementation_artifacts/epi1-03-remove-manual-memoization.md"
  - "docs/epics.md"
  - "playwright.config.ts"
  - ".trae/skills/bmad-testarch-atdd/resources/knowledge/test-levels-framework.md"
  - ".trae/skills/bmad-testarch-atdd/resources/knowledge/test-priorities-matrix.md"
  - ".trae/skills/bmad-testarch-atdd/resources/knowledge/test-quality.md"
  - ".trae/skills/bmad-testarch-atdd/resources/knowledge/component-tdd.md"
  - ".trae/skills/bmad-testarch-atdd/resources/knowledge/selector-resilience.md"
  - ".trae/skills/bmad-testarch-atdd/resources/knowledge/timing-debugging.md"
---

# EPI1.03 ATDD Checklist: 移除手动 Memoization 代码

## Step 1: Preflight & Context Loading

### 1. Stack Detection

**Detected Stack: `frontend`**

- ✅ React 19 + TypeScript framework
- ✅ Vite build tool
- ✅ Playwright E2E test framework (`playwright.config.ts`)
- ✅ Vitest unit test framework

### 2. Prerequisites

| Requirement | Status | Details |
|-------------|--------|---------|
| Story approved with clear AC | ✅ | 3 acceptance criteria, ready-for-dev |
| Test framework configured | ✅ | Playwright + Vitest |
| Development environment | ✅ | `npm run dev`, `npm run build`, `npm test` |
| React Compiler enabled | ✅ | EPI1.02 completed, `compilationMode: 'infer'` |

### 3. Story Context

**Story Key:** `epi1-03-remove-manual-memoization`
**Story ID:** `1.03`
**Story File:** `implementation_artifacts/epi1-03-remove-manual-memoization.md`

**Acceptance Criteria:**

| AC | Description | Test Implication |
|----|-------------|-----------------|
| #1 | 移除 useMemo/useCallback 后性能保持，所有测试通过 | Regression test suite |
| #2 | 代码行数减少约 40%，移除确实冗余 | Count verification + manual review |
| #3 | 保留必要 memoization，形成规范文档 | Classification audit + docs |

**Key Technical Constraints:**
- React Compiler `compilationMode: 'infer'` 处理组件级 memoization
- 159 处 useMemo/useCallback 分布在 27 个文件
- 6 类分类标准（A-F）决定保留/移除

### 4. Framework & Existing Patterns

**Playwright Config:**
- `testDir`: `./tests`
- `testMatch`: `**/e2e/**/*.spec.ts`, `**/api/**/*.spec.ts`
- `baseURL`: `http://localhost:5173`
- `webServer`: Vite dev server on port 5173
- Retries: CI=2, local=1

**Existing Test Inventory:**
| Type | Count | Location |
|------|-------|----------|
| E2E specs | 22 | `tests/e2e/*.spec.ts` |
| API specs | 3 | `tests/api/*.spec.ts` |
| Unit tests | 316 | `frontend/tests/**/*.test.tsx` |

**Existing React Compiler Tests (from EPI1.02):**
- `react-compiler-integration.spec.ts`: 6 E2E tests
- `react-compiler-smoke.spec.ts`: 7 smoke tests
- `react-compiler-behavior.test.tsx`: 32 unit tests
- `react-compiler-eslint.test.ts`: 5 ESLint tests

### 5. TEA Config Flags

| Flag | Value | Impact |
|------|-------|--------|
| `tea_use_playwright_utils` | `true` | Enables Playwright utility patterns |
| `tea_browser_automation` | `auto` | Will use MCP for recording |
| `test_stack_type` | `auto` → `frontend` | Frontend-specific patterns |
| `risk_threshold` | `p1` | P0-P1 tests required |

---

## Step 2: Generation Mode Selection

**Chosen Mode: AI Generation**

**Reason:**
- Acceptance criteria are clear and well-structured
- Scenarios focus on memoization classification verification, not UI interactions
- The core test targets are: code-level behavior verification, ESLint output validation, build success, and regression prevention
- No complex UI recording needed — the UI behavior is unchanged (only internal memoization removed)
- Existing test patterns from EPI1.02 provide sufficient reference

---

## Step 3: Test Strategy

### Test Design Matrix for EPI1.03

This story is **refactoring-focused** — removing code while preserving behavior. The primary test strategy is **regression prevention** at multiple levels.

#### AC#1: 移除后性能保持 + 所有测试通过

| Test Level | Type | Count | Target | Priority |
|------------|------|-------|--------|----------|
| **Unit** | Behavior regression | 20 | Component render behavior after memo removal | P0 |
| **Unit** | ESLint validation | 5 | `react-compiler` rule output on cleaned code | P1 |
| **E2E** | Full regression | 14 | AI Config tests (known fragile area) | P0 |
| **E2E** | Smoke tests | 7 | React Compiler smoke tests | P0 |
| **E2E** | Navigation/state | 6 | React Compiler integration tests | P1 |
| **Build** | Build verification | 17 | CI-like build validation checks | P0 |
| **Static** | TypeScript | 1 | `tsc --noEmit` type check | P0 |

#### AC#2: 代码行数减少约 40%

| Test Level | Type | Count | Target | Priority |
|------------|------|-------|--------|----------|
| **Static** | Count verification | 2 | useMemo/useCallback count before vs after | P1 |
| **Unit** | Classification audit | 1 | Verify removed memo doesn't break rendering | P1 |

#### AC#3: 保留必要 memoization + 形成规范

| Test Level | Type | Count | Target | Priority |
|------------|------|-------|--------|----------|
| **Unit** | Context callback stability | 5 | Verify Context provider callbacks remain stable | P0 |
| **Unit** | Expensive computation | 3 | Verify expensive useMemo preserved | P1 |
| **Static** | Documentation check | 1 | Verify classification doc exists | P2 |

### Total New Tests: ~55

### Test File Structure

```
frontend/tests/unit/
├── memo-regression.test.tsx          # [NEW] Behavior regression tests (20 tests)
├── memo-eslint-validation.test.ts    # [NEW] ESLint react-compiler validation (5 tests)
└── ... (existing 24 test files)

tests/e2e/
├── memo-regression.spec.ts           # [NEW] Full app regression after memo removal (6 tests)
└── ... (existing 25 spec files)
```

### Key Test Scenarios

#### P0 — Critical Regression Tests (Behavior Preservation)

1. **Component render count** — Verify components don't re-render excessively after memo removal
2. **Context provider stability** — Verify Context API callbacks maintain referential stability
3. **Expensive computation correctness** — Verify DiffView/VirtualList computations still work
4. **Build verification** — Verify `npm run build` succeeds after all memo removal
5. **TypeScript validation** — Verify 0 type errors after memo removal
6. **AI Config full regression** — Run all 14 AI Config E2E tests (historically fragile)

#### P1 — High Priority Tests

7. **ESLint react-compiler output** — Verify no new warnings after cleanup
8. **Memo count reduction** — Verify useMemo/useCallback count decreased by ~40%
9. **Navigation stability** — Verify route navigation still works after cleanup
10. **State management** — Verify state updates propagate correctly
11. **Concurrent features** — Verify React 19 concurrent features still work

#### P2 — Medium Priority Tests

12. **Documentation verification** — Verify classification spec exists
13. **Code quality metrics** — Verify code complexity didn't increase

---

## Step 4: Generated Test Files

### File 1: `frontend/tests/unit/memo-regression.test.tsx`

**18 tests** across 3 acceptance criteria — ALL `test.skip()` (TDD Red Phase):

| AC | Tests | Priorities |
|----|-------|------------|
| #1 性能保持 | 10 | P0 (4), P1 (5), P2 (2) |
| #2 代码减少 | 3 | P1 (3) |
| #3 必要 memo 保留 | 4 | P0 (2), P1 (2) |

**Test Patterns Used:**
- Render counter (from EPI1.02 behavior tests)
- Context Provider stability verification
- Component rendering without manual useMemo/useCallback
- ESLint validation scaffold

### File 2: `tests/e2e/memo-regression.spec.ts`

**12 tests** across 3 priority levels — ALL `test.skip()` (TDD Red Phase):

| Priority | Tests | Coverage |
|----------|-------|----------|
| P0 | 6 | AI Config CRUD (4), FileTree nav, CodeEditor |
| P1 | 4 | Terminal tabs, Agent log, Git panel, Settings nav |
| P2 | 2 | Rapid nav stability, Console error check |

**Test Patterns Used:**
- console.error filtering (React/React Compiler errors)
- data-testid selectors (matching existing patterns)
- Full user journey sequences

---

## Step 5: Validation & Completion

### Validation Checklist

| Check | Status | Details |
|-------|--------|---------|
| Prerequisites satisfied | ✅ | Story approved, frameworks configured |
| Unit test file created | ✅ | `memo-regression.test.tsx` (18 tests) |
| E2E test file created | ✅ | `memo-regression.spec.ts` (12 tests) |
| All tests use `test.skip()` | ✅ | TDD Red Phase confirmed |
| Unit tests compile and run (skipped) | ✅ | Vitest: 18 skipped, 0 errors |
| Checklist matches acceptance criteria | ✅ | AC#1 (10+6 tests), AC#2 (3 tests), AC#3 (4 tests) |
| Story metadata captured | ✅ | storyId, storyKey, storyFile set |
| Handoff paths captured | ✅ | Story file path, checklist path recorded |

### Completion Summary

```
🚀 ATDD GENERATION COMPLETE — EPI1.03

📋 Generated Test Files:
├── frontend/tests/unit/memo-regression.test.tsx    (18 tests, TDD Red)
└── tests/e2e/memo-regression.spec.ts              (12 tests, TDD Red)

📊 Coverage Matrix:
├── AC#1 (性能保持): 16 tests (P0: 10, P1: 5, P2: 2)
├── AC#2 (代码减少): 3 tests (P1: 3)
└── AC#3 (memo 保留): 4 tests (P0: 2, P1: 2)

📁 Checklist: _bmad-output/test-artifacts/atdd-checklist-epi1-03-remove-manual-memoization.md
📖 Story:    implementation_artifacts/epi1-03-remove-manual-memoization.md

⚠️  Key Risks:
├── AI Config area historically fragile (aiService immutability)
├── Terminal.tsx has highest memo count (15 calls)
├── VirtualList handleScroll (Category F) may need retention
└── DiffView htmlDiff (Category E) must be retained

▶️  Next Steps:
1. Review story file and test scaffolds
2. Run bmad-dev-story to begin implementation
3. After implementation: activate test.skip() → test() for green phase
4. Run bmad-code-review when implementation complete
```