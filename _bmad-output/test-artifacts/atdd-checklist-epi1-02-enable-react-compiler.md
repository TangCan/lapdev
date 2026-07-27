---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-generation-mode', 'step-03-test-strategy', 'step-04-generate-tests', 'step-04c-aggregate']
lastStep: 'step-04c-aggregate'
lastSaved: '2026-07-27'
storyId: 'EPI1.02'
storyKey: 'epi1-02-enable-react-compiler'
storyFile: 'implementation_artifacts/epi1-02-enable-react-compiler.md'
atddChecklistPath: '_bmad-output/test-artifacts/atdd-checklist-epi1-02-enable-react-compiler.md'
generatedTestFiles:
  - frontend/tests/unit/eslint-react-compiler.test.ts
  - tests/e2e/react-compiler-smoke.spec.ts
  - tests/e2e/verify-react-compiler.sh
inputDocuments:
  - implementation_artifacts/epi1-02-enable-react-compiler.md
  - frontend/vite.config.ts
  - frontend/package.json
  - frontend/eslint.config.js
  - frontend/vitest.config.ts
  - playwright.config.ts
  - tests/e2e/react-19-smoke.spec.ts
  - docs/epics.md
  - .trae/skills/bmad-testarch-atdd/resources/knowledge/test-quality.md
  - .trae/skills/bmad-testarch-atdd/resources/knowledge/component-tdd.md
  - .trae/skills/bmad-testarch-atdd/resources/knowledge/test-priorities-matrix.md
---

# ATDD Checklist: EPI1.02 - 启用 React Compiler

## Step 2: Generation Mode

- **Chosen Mode**: AI Generation
- **Rationale**: Configuration-only change. Clear acceptance criteria. No complex UI recording needed.

## Step 3: Test Strategy

### Scenario-to-Level Mapping

| AC# | Scenario | Test Level | Priority | Rationale |
|-----|----------|------------|----------|-----------|
| #1 | TypeScript type checking passes | Integration (Build Script) | P0 | "无 TypeScript 错误" |
| #1 | Vite build succeeds with babel plugin | Integration (Build Script) | P0 | "项目构建成功" |
| #1 | All 266 unit tests pass | Unit (Existing) | P0 | "所有现有测试通过" |
| #1 | All E2E smoke tests pass | E2E (Existing) | P0 | "7 个 E2E 冒烟测试通过" |
| #2 | React Compiler processes files during build | Integration (Build Script) | P1 | "编译器自动优化 memoization" |
| #2 | Build output shows compiler optimization info | Integration (Build Script) | P1 | "构建日志显示编译器已处理的文件" |
| #2 | No business code changes needed | E2E (Regression) | P1 | "无需修改任何业务代码" |
| #3 | ESLint react-compiler rule configured | Unit (Lint Script) | P1 | "react-compiler 规则可以检测" |
| #3 | Existing ESLint rules still work | Unit (Lint Script) | P1 | "现有 ESLint 规则继续正常工作" |
| #3 | ESLint passes with no new fatal errors | Unit (Lint Script) | P1 | "ESLint 配置正确" |

### Test Priorities Summary

| Priority | Count | Coverage |
|----------|-------|----------|
| P0 | 4 tests | Build success, TypeScript check, No console errors, No re-render issues |
| P1 | 6 tests | Compiler optimization logging, ESLint rule config, Existing rules preserved, Lint pass, Dev server, Component rendering |
| P2 | 1 test | useId format verification |
| **Total** | **11 tests** | |

---

## Step 4A: Red-Phase Test Scaffolds Generated

### Generated Test Files

| # | File | Type | Framework | Tests | TDD Phase |
|---|------|------|-----------|-------|-----------|
| 1 | `frontend/tests/unit/eslint-react-compiler.test.ts` | Unit config verification | Vitest | 13 | 🔴 RED (all `test.skip()`) |
| 2 | `tests/e2e/react-compiler-smoke.spec.ts` | E2E smoke test | Playwright | 7 | 🔴 RED (all `test.skip()`) |
| 3 | `tests/e2e/verify-react-compiler.sh` | Build verification script | Shell | 15 checks | 🔴 RED (will fail until config implemented) |

### Test File 1: ESLint Config Verification (Unit)

**File**: [eslint-react-compiler.test.ts](file:///home/richard/richard/2026/2026/pvm_2/lapdev/frontend/tests/unit/eslint-react-compiler.test.ts)
**Framework**: Vitest (in `frontend/tests/unit/`)
**Tests**: 13 (all `it.skip()`)

| # | Priority | Test Name | AC |
|---|----------|-----------|-----|
| 1 | P1 | eslint.config.js 中应包含 react-hooks/react-compiler 规则 | #3 |
| 2 | P1 | react-compiler 规则应设置为 warn 级别 | #3 |
| 3 | P1 | eslint-plugin-react-hooks 应在 plugins 中注册 | #3 |
| 4 | P1 | set-state-in-effect 规则应继续存在 | #3 |
| 5 | P1 | immutability 规则应继续存在 | #3 |
| 6 | P1 | react/react-in-jsx-scope 应关闭 | #3 |
| 7 | P0 | vite.config.ts 中 react 插件应配置 babel plugins | #1, #2 |
| 8 | P0 | babel-plugin-react-compiler 应在 plugins 数组第一位 | #1 |
| 9 | P1 | React Compiler target 应配置为 19 | #2 |
| 10 | P1 | React Compiler compilationMode 应配置为 infer | #2 |
| 11 | P0 | package.json 应包含 babel-plugin-react-compiler 依赖 | #1 |
| 12 | P0 | @vitejs/plugin-react 版本应 >= 5.1.0 | #1 |
| 13 | P0 | eslint-plugin-react-hooks 版本应 >= 7.1.1 | #1 |

### Test File 2: React Compiler Smoke (E2E)

**File**: [react-compiler-smoke.spec.ts](file:///home/richard/richard/2026/2026/pvm_2/lapdev/tests/e2e/react-compiler-smoke.spec.ts)
**Framework**: Playwright
**Tests**: 7 (all `test.skip()`)

| # | Priority | Test Name | AC |
|---|----------|-----------|-----|
| 1 | P0 | 应用加载时不应出现 React Compiler 相关控制台错误 | #1 |
| 2 | P0 | React Compiler 优化后组件应正确渲染 | #1 |
| 3 | P0 | React Compiler 不应导致组件重渲染异常 | #2 |
| 4 | P1 | React Compiler 启用后交互操作应正常工作 | #2 |
| 5 | P1 | React Compiler 与 React 19 Concurrent Features 兼容 | #2 |
| 6 | P1 | React Compiler 启用后 Fast Refresh 应正常工作 | #2 |
| 7 | P2 | React Compiler 不应影响 useId 格式 | #2 |

### Test File 3: Build Verification Script

**File**: [verify-react-compiler.sh](file:///home/richard/richard/2026/2026/pvm_2/lapdev/tests/e2e/verify-react-compiler.sh)
**Type**: Shell script (executable)
**Checks**: 15 verification points across 5 categories

| Category | Checks | AC |
|----------|--------|-----|
| Dependencies | 3 checks (babel-plugin-react-compiler, vite-plugin-react version, react-hooks version) | #1 |
| Configuration | 5 checks (vite.config babel, target, compilationMode, eslint config) | #1, #2, #3 |
| Build | 2 checks (tsc --noEmit, vite build) | #1 |
| Tests | 2 checks (unit test count, unit test pass) | #1 |
| Compiler Effect | 1 check (build output for compiler info) | #2 |
| ESLint | 2 checks (lint pass, lint warnings) | #3 |

---

## Step 4C: Aggregation & Validation

### TDD Red Phase Compliance ✅

| File | Total | Red Phase | Status |
|------|-------|-----------|--------|
| eslint-react-compiler.test.ts | 13 tests | 13 `it.skip()` | ✅ Verified |
| react-compiler-smoke.spec.ts | 7 tests | 7 `test.skip()` | ✅ Verified |
| verify-react-compiler.sh | 15 checks | Will fail until implementation | ✅ Verified |

### Test Discovery ✅

- Vitest discovers 1 test file with 13 tests (all skipped)
- Playwright discovers 7 tests from react-compiler-smoke.spec.ts (all skipped)
- Shell script is executable and syntactically valid

### Test Coverage Summary

| Metric | Value |
|--------|-------|
| Total new tests/checks | 35 (13 unit + 7 E2E + 15 shell) |
| P0 tests | 8 (3 unit + 3 E2E + 2 shell) |
| P1 tests | 14 (9 unit + 3 E2E + 2 shell) |
| P2 tests | 2 (1 unit + 1 E2E) |
| AC#1 covered | ✅ Build success, TS check, test pass |
| AC#2 covered | ✅ Compiler optimization, runtime verification |
| AC#3 covered | ✅ ESLint config, rule compatibility |

### Red Phase Verification Command

```bash
# Verify unit tests are in red phase (all skipped)
cd frontend && npx vitest run tests/unit/eslint-react-compiler.test.ts

# Verify E2E tests are in red phase
npx playwright test tests/e2e/react-compiler-smoke.spec.ts

# Verify build script exists and is executable
ls -la tests/e2e/verify-react-compiler.sh
```

### Implementation Commands (After Implementation)

```bash
# Run after implementing EPI1.02:
cd frontend && npm install -D babel-plugin-react-compiler

# Activate red phase tests (remove .skip() manually or use implementation workflow)
npm test
npm run build
npx tsc --noEmit
npm run lint
bash tests/e2e/verify-react-compiler.sh
```

### Notes

- **No API tests**: This story is a frontend-only configuration change with no API backend changes
- **Existing tests preserved**: All existing 266 unit tests and 17 E2E tests remain valid
- **No duplicate coverage**: New tests fill gaps in build verification and ESLint configuration verification
- **Risk level**: Low — configuration-only change, easy rollback via removing babel plugin config
- **Rollback**: Remove `babel.plugins` from vite.config.ts, remove `react-compiler` rule from eslint.config.js, uninstall `babel-plugin-react-compiler`