---
storyId: '3.1'
storyKey: 'epi3-01-file-search-concurrent-optimization'
storyFile: 'implementation_artifacts/epi3-01-file-search-concurrent-optimization.md'
atddChecklistPath: '_bmad-output/test-artifacts/atdd-checklist-epi3-01-file-search-concurrent-optimization.md'
generatedTestFiles:
  - 'tests/e2e/file-search.spec.ts'
  - 'tests/api/file-search.spec.ts'
  - 'frontend/src/components/FileTree/FileTreeSearch.test.tsx'
  - 'frontend/src/hooks/useFileSearch.extended.test.ts'
  - 'frontend/src/hooks/useFileSearch.test.ts'
stepsCompleted:
  - 'step-01-preflight-and-context'
  - 'step-02-generation-mode'
  - 'step-03-test-strategy'
  - 'step-04-generate-tests'
  - 'step-04c-aggregate'
  - 'step-05-validate-and-complete'
lastStep: 'step-05-validate-and-complete'
lastSaved: '2026-08-04'
---

# ATDD Checklist: EPI3.01 - 文件搜索并发优化

## TDD Red Phase (Current)

✅ Red-phase test scaffolds generated

- **E2E Tests**: 10 tests (all skipped) — `tests/e2e/file-search.spec.ts`
- **API Tests**: 5 tests (all skipped) — `tests/api/file-search.spec.ts`
- **Component Tests**: 6 tests (all skipped) — `frontend/src/components/FileTree/FileTreeSearch.test.tsx`
- **Unit Tests (Extended)**: 7 tests (all skipped) — `frontend/src/hooks/useFileSearch.extended.test.ts`
- **Unit Tests (Existing)**: 12 tests (active) — `frontend/src/hooks/useFileSearch.test.ts`

**Total: 40 tests (28 red-phase scaffolds + 12 existing active tests)**

---

## Acceptance Criteria Coverage

### AC1: 搜索即时响应 + useDeferredValue 延迟更新

| Test | Level | Priority | File |
|------|-------|----------|------|
| EPI3-01-E2E-001: 搜索输入框立即可用并响应 | E2E | P0 | file-search.spec.ts |
| EPI3-01-E2E-002: useDeferredValue 延迟更新 | E2E | P0 | file-search.spec.ts |
| EPI3-01-CMP-001: 渲染搜索输入框 | Component | P0 | FileTreeSearch.test.tsx |
| EPI3-01-EXT-007: useDeferredValue 输入不阻塞 | Unit | P2 | useFileSearch.extended.test.ts |
| EPI3-01-EXT-001: 客户端过滤模式使用 useMemo | Unit | P0 | useFileSearch.extended.test.ts |

### AC2: 防抖 200ms + isStale 标志

| Test | Level | Priority | File |
|------|-------|----------|------|
| EPI3-01-E2E-003: 快速连续输入只触发一次搜索 | E2E | P1 | file-search.spec.ts |
| EPI3-01-E2E-004: isStale 标志正确反映状态 | E2E | P1 | file-search.spec.ts |
| EPI3-01-EXT-002: isStale 在搜索期间为 true | Unit | P1 | useFileSearch.extended.test.ts |
| EPI3-01-EXT-003: 防抖在最后输入后 200ms 触发 | Unit | P1 | useFileSearch.extended.test.ts |
| EPI3-01-API-001: 搜索 API 接受 query 参数 | API | P0 | file-search.spec.ts |

### AC3: 搜索错误处理

| Test | Level | Priority | File |
|------|-------|----------|------|
| EPI3-01-E2E-005: 错误时显示友好错误信息 | E2E | P1 | file-search.spec.ts |
| EPI3-01-E2E-006: 错误后搜索状态恢复 | E2E | P2 | file-search.spec.ts |
| EPI3-01-CMP-003: 错误状态显示错误信息 | Component | P1 | FileTreeSearch.test.tsx |
| EPI3-01-EXT-004: 连续错误后能正常搜索 | Unit | P1 | useFileSearch.extended.test.ts |
| EPI3-01-API-004: 无效路径返回 400 错误 | API | P2 | file-search.spec.ts |

### AC4: 搜索与文件树集成

| Test | Level | Priority | File |
|------|-------|----------|------|
| EPI3-01-E2E-007: 搜索结果高亮匹配文件 | E2E | P0 | file-search.spec.ts |
| EPI3-01-E2E-008: 点击搜索结果打开文件 | E2E | P0 | file-search.spec.ts |
| EPI3-01-E2E-009: 空搜索恢复完整文件树 | E2E | P1 | file-search.spec.ts |
| EPI3-01-E2E-010: 搜索不影响展开/折叠行为 | E2E | P2 | file-search.spec.ts |
| EPI3-01-CMP-002: 搜索结果渲染匹配项 | Component | P1 | FileTreeSearch.test.tsx |
| EPI3-01-CMP-004: 空输入清除搜索结果 | Component | P2 | FileTreeSearch.test.tsx |
| EPI3-01-EXT-005: 清空搜索恢复完整结果 | Unit | P2 | useFileSearch.extended.test.ts |
| EPI3-01-EXT-006: 客户端过滤支持正则匹配 | Unit | P1 | useFileSearch.extended.test.ts |
| EPI3-01-API-002: 空查询返回空结果 | API | P1 | file-search.spec.ts |
| EPI3-01-API-003: 搜索结果包含路径和名称 | API | P1 | file-search.spec.ts |
| EPI3-01-API-005: 搜索支持文件类型过滤 | API | P2 | file-search.spec.ts |

---

## Test Priority Distribution

| Priority | Count | Description |
|----------|-------|-------------|
| P0 | 8 | Critical: core search functionality, useDeferredValue integration |
| P1 | 14 | High: debounce, isStale, error handling, result display |
| P2 | 8 | Medium: edge cases, empty queries, performance verification |

---

## Test Level Distribution

| Level | Count | Status |
|-------|-------|--------|
| E2E | 10 | 🔴 test.skip() — red phase |
| API | 5 | 🔴 test.skip() — red phase |
| Component | 6 | 🔴 test.skip() — red phase |
| Unit (new) | 7 | 🔴 test.skip() — red phase |
| Unit (existing) | 12 | 🟢 Active — already passing |
| **Total** | **40** | **28 red + 12 active** |

---

## Next Steps (Task-by-Task Activation)

During implementation of each task:

1. Remove `test.skip()` from the current test file or scenario
2. Run tests: `npm run test`
3. Verify the activated test fails first, then passes after implementation (green phase)
4. If any activated tests still fail unexpectedly:
   - Either fix implementation (feature bug)
   - Or fix test (test bug)
5. Commit passing tests

### Suggested Activation Order

**Task 1: Extend useFileSearch Hook (AC1, AC2)**
- Activate: `useFileSearch.extended.test.ts` (EXT-001 through EXT-007)
- Implement: `localFiles` parameter, client-side filtering, enhanced debounce
- Run: `cd frontend && npx vitest run src/hooks/useFileSearch.extended.test.ts`

**Task 2: Create FileTreeSearch Component (AC1, AC3, AC4)**
- Activate: `FileTreeSearch.test.tsx` (CMP-001 through CMP-006)
- Implement: search input, loading indicator, error display, results
- Run: `cd frontend && npx vitest run src/components/FileTree/FileTreeSearch.test.tsx`

**Task 3: Integrate into FileTree (AC1, AC4)**
- Activate: `file-search.spec.ts` E2E tests (001, 002, 007, 008 — P0 first)
- Implement: search integration into FileTree.tsx, result filtering
- Run: `npx playwright test tests/e2e/file-search.spec.ts`

**Task 4: Backend Search Integration (AC2, AC3)**
- Activate: `file-search.spec.ts` API tests (API-001 through API-005)
- Implement: backend `/api/v1/files/search` endpoint
- Run: `npx playwright test tests/api/file-search.spec.ts`

**Task 5: Full E2E Validation (AC1-AC4)**
- Activate: remaining E2E tests (all P1, P2)
- Verify: complete user journey from search input to file opening

---

## Implementation Guidance

### Feature endpoints to implement:
- `POST /api/v1/files/search` — File search API with query, path, and filter parameters

### UI components to implement:
- `FileTreeSearch.tsx` — Search input with loading/error/result states
- `FileTree.tsx` integration — Search result filtering, highlighting, click-to-open
- `FileTreeNode.tsx` — Match highlighting

### Key integration points:
- `useFileSearch` Hook → `FileTreeSearch` component → `FileTree` integration
- `fileApiAdapter.searchFiles()` → backend API
- Client-side filtering via `useMemo` when file tree is already loaded

---

## TDD Red Phase Compliance

✅ All 28 new tests use `test.skip()` (documented red-phase scaffolds)
✅ All tests assert expected behavior (not placeholder assertions)
✅ All tests marked with priority tags [P0], [P1], [P2]
✅ Resilient selectors used (getByTestId, getByText)
✅ Tests follow knowledge fragment patterns (fixture-architecture, selector-resilience, data-factories)

---

## Performance Considerations

| Metric | Target | Test |
|--------|--------|------|
| Input response latency | < 16ms | E2E-001, EXT-007 |
| Search result update | < 200ms (debounce) | E2E-003, EXT-003 |
| INP reduction | ≥ 60% | E2E-001, E2E-002 |
| API call reduction | ≥ 50% (debounce) | EXT-001, EXT-003 |

---

## Risks & Assumptions

1. **Assumption**: Backend search API exists or will be created
2. **Risk**: Client-side filtering may be slow for 1000+ files without virtualization
3. **Mitigation**: Use `useMemo` for filtering, consider virtualized list for results > 100
4. **Assumption**: File tree data structure supports search result filtering
5. **Risk**: `useDeferredValue` behavior may differ in React 19
6. **Mitigation**: Test with React 19 compiler integration tests
