---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-generation-mode', 'step-03-test-strategy', 'step-04c-aggregate']
lastStep: 'step-04c-aggregate'
lastSaved: '2026-08-03'
storyId: 'EPI2.03'
storyKey: 'epi2-03-range-formatting-incremental-update'
storyFile: 'implementation_artifacts/epi2-03-range-formatting-incremental-update.md'
atddChecklistPath: '_bmad-output/test-artifacts/atdd-checklist-epi2-03-range-formatting-incremental-update.md'
generatedTestFiles:
  - 'tests/api/range-formatting.test.ts'
  - 'tests/e2e/range-formatting.spec.ts'
  - 'frontend/src/services/formatCache.test.ts'
---

# ATDD Checklist: EPI2.03 - 范围格式化与增量更新

## TDD Red Phase (Current)

✅ Red-phase test scaffolds generated

- API Tests: 21 tests (all active, using Deno.test)
- E2E Tests: 7 tests (all with test.skip())
- Unit Tests: 17 tests (all active, using Vitest)

**Total: 45 tests covering all 5 acceptance criteria**

## Acceptance Criteria Coverage

| AC | 描述 | API | E2E | Unit | 状态 |
|----|------|-----|-----|------|------|
| AC1 | 大文件选中区域格式化 <100ms | ✅ (3 tests) | ✅ (2 tests) | - | 🔴 RED |
| AC2 | 普通文件全文件格式化保持 | ✅ (2 tests) | ✅ (1 test) | - | 🔴 RED |
| AC3 | 缓存命中率 ≥80% | ✅ (3 tests) | ✅ (1 test) | ✅ (4 tests) | 🔴 RED |
| AC4 | 大文件无选择回退 + 进度指示 | ✅ (2 tests) | ✅ (1 test) | - | 🔴 RED |
| AC5 | 快捷键行为不变 | ✅ (2 tests) | ✅ (2 tests) | - | 🔴 RED |
| AC6 | 测试通过 | - | - | - | ⏳ 待验证 |
| AC7 | 构建通过 | - | - | - | ⏳ 待验证 |

## Test Distribution

### API Tests (Deno) - `tests/api/range-formatting.test.ts`
- **现有端点回归** (7 tests): JavaScript/TypeScript/Python/Rust/Go 格式化 + 错误处理
- **范围格式化端点** (5 tests): 新端点 `/api/files/format/range` 测试
- **缓存行为** (3 tests): 缓存命中、命中率、缓存失效
- **回归保护** (4 tests): 大文件、语言列表、性能

### E2E Tests (Playwright) - `tests/e2e/range-formatting.spec.ts`
- [P0] 大文件选中区域格式化性能验证 (AC1)
- [P0] 普通文件完整格式化行为 (AC2)
- [P1] 大文件无选择回退机制 (AC4)
- [P1] 缓存命中率验证 (AC3)
- [P1] Ctrl+S 快捷键兼容性 (AC5)
- [P1] Ctrl+Shift+F 快捷键验证 (AC5)
- [P1] 区域隔离验证 (AC1)

### Unit Tests (Vitest) - `frontend/src/services/formatCache.test.ts`
- 内容哈希计算 (5 tests): 相同/不同内容、范围影响
- 存储和检索 (5 tests): 基本 CRUD 操作
- LRU 淘汰机制 (4 tests): 容量限制、LRU 顺序
- 缓存命中率验证 (4 tests): ≥80% 命中率、缓存失效

## Priority Distribution

| Priority | Count | Description |
|----------|-------|-------------|
| P0 | 18 | 核心功能验证 |
| P1 | 27 | 重要场景覆盖 |
| P2 | 0 | 边界条件 |
| **Total** | **45** | |

## Next Steps (Task-by-Task Activation)

During story implementation (`bmad-dev-story epi2-03-range-formatting-incremental-update`):

### Task 1: formatCache 模块实现
1. Create `frontend/src/services/formatCache.ts`
2. Run unit tests: `cd frontend && npx vitest run src/services/formatCache.test.ts`
3. Verify all 17 unit tests PASS
4. Commit

### Task 2: 后端范围格式化端点
1. Add `POST /api/files/format/range` to backend
2. Run API tests: `cd backend && deno test tests/api/range-formatting.test.ts`
3. Verify range formatting tests PASS
4. Commit

### Task 3: 前端范围格式化集成
1. Modify `LspCodeEditor.tsx` to support range formatting
2. Activate E2E tests by removing `test.skip()`
3. Run E2E tests: `npm run test:e2e -- tests/e2e/range-formatting.spec.ts`
4. Verify E2E tests PASS
5. Commit

### Task 4: 集成验证
1. Run full regression: `npm run test:regression`
2. Verify all tests pass
3. Build verification: `npm run build`
4. Final commit

## Implementation Guidance

### Feature endpoints to implement:
- `POST /api/files/format/range` - 范围格式化 (选择区域格式化)
- Enhanced `POST /api/files/format` - 添加缓存支持
- Cache metadata in responses (`cacheHit`, `formatType`)

### UI components to implement:
- Range formatting trigger in `LspCodeEditor.tsx`
- Progress indicator for large file formatting
- Cache integration with formatting service
- Keyboard shortcut handling (Ctrl+S, Ctrl+Shift+F)

### Files to create/modify:
- `frontend/src/services/formatCache.ts` - 缓存模块 (LRU + 内容哈希)
- `frontend/src/services/formatService.ts` - 格式化服务集成 (如不存在)
- `frontend/src/components/editor/LspCodeEditor.tsx` - 范围格式化支持
- `backend/src/handlers/fileHandler.ts` - 范围格式化端点
- `backend/src/services/formatter.ts` - 格式化服务增强

## Fixture Requirements

| Fixture | Description | Used By |
|---------|-------------|---------|
| large-file-10500 | 10,500 行大文件 | E2E-001, E2E-003, E2E-004 |
| normal-file-500 | 500 行普通文件 | E2E-002 |
| range-isolation-file | 带标记的大文件 | E2E-007 |
| simple-test-file | 简单测试文件 | E2E-005, E2E-006 |

## Summary

- **TDD Phase**: 🔴 RED (all tests generated, waiting for implementation)
- **Total Tests**: 45
- **Acceptance Criteria Coverage**: 5/5 (100%)
- **Test Levels**: Unit (17), API (21), E2E (7)
- **Next**: Run `bmad-dev-story epi2-03-range-formatting-incremental-update` to implement