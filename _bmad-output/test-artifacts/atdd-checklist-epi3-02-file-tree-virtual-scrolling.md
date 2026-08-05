---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-generation-mode', 'step-03-test-strategy', 'step-04-generate-tests', 'step-04c-aggregate', 'step-05-validate-and-complete']
lastStep: 'step-05-validate-and-complete'
lastSaved: '2026-08-05'
storyId: 'EPI3.02'
storyKey: 'epi3-02-file-tree-virtual-scrolling'
storyFile: 'implementation_artifacts/epi3-02-file-tree-virtual-scrolling.md'
atddChecklistPath: '_bmad-output/test-artifacts/atdd-checklist-epi3-02-file-tree-virtual-scrolling.md'
generatedTestFiles:
  - 'tests/e2e/file-tree-virtual-scroll.spec.ts'
  - 'frontend/src/hooks/useFileTreeFlatten.test.ts'
  - 'frontend/src/components/common/VirtualList.test.tsx'
  - 'frontend/src/hooks/useFileTreeFlatten.ts'
inputDocuments:
  - 'docs/epics.md'
  - 'docs/architecture.md'
  - 'implementation_artifacts/epi3-02-file-tree-virtual-scrolling.md'
  - 'implementation_artifacts/epi3-01-file-search-concurrent-optimization.md'
---

# ATDD Checklist: EPI3.02 - 文件树虚拟滚动

## TDD Red Phase (Current)

✅ Red-phase test scaffolds generated

- **E2E Tests**: 10 tests (all `test.skip()`)
- **Hook Unit Tests**: 10 tests (all `it.skip()`)
- **Component Tests**: 10 tests (all `it.skip()`)
- **Total**: 30 tests (all skipped)

## Generated Test Files

| 文件 | 类型 | 测试数 | 状态 |
|------|------|--------|------|
| `tests/e2e/file-tree-virtual-scroll.spec.ts` | E2E | 10 | RED (test.skip) |
| `frontend/src/hooks/useFileTreeFlatten.test.ts` | Unit | 10 | RED (it.skip) |
| `frontend/src/components/common/VirtualList.test.tsx` | Component | 10 | RED (it.skip) |
| `frontend/src/hooks/useFileTreeFlatten.ts` | Stub | — | TDD stub (returns []) |

## Acceptance Criteria Coverage

| AC | 描述 | 测试覆盖 | 优先级 |
|----|------|----------|--------|
| AC1 | 大量文件时虚拟滚动只渲染可视区域 | E2E-001, E2E-007, E2E-009, Hook-001~006, VL-001~006 | P0-P3 |
| AC2 | 50项阈值自动切换虚拟/传统渲染 | E2E-002, E2E-010 | P0-P3 |
| AC3 | 展开/折叠目录后虚拟滚动正确更新 | E2E-003, E2E-008, Hook-003~009 | P1-P2 |
| AC4 | 搜索过滤后虚拟滚动正常工作 | E2E-004 | P1 |
| AC5 | 虚拟滚动中交互功能保持正常 | E2E-005, E2E-006 | P1-P2 |

## Test Scenarios

### E2E Tests (tests/e2e/file-tree-virtual-scroll.spec.ts)

| ID | 优先级 | AC | 描述 |
|----|--------|-----|------|
| EPI3-02-E2E-001 | P0 | AC1 | 大量文件时使用虚拟滚动 |
| EPI3-02-E2E-002 | P0 | AC2 | 文件数>50启用虚拟滚动 |
| EPI3-02-E2E-003 | P1 | AC3 | 展开/折叠目录后虚拟滚动正确更新 |
| EPI3-02-E2E-004 | P1 | AC4 | 搜索过滤后虚拟滚动正常工作 |
| EPI3-02-E2E-005 | P1 | AC5 | 虚拟滚动中点击文件正常打开 |
| EPI3-02-E2E-006 | P2 | AC5 | 虚拟滚动中右键菜单正常工作 |
| EPI3-02-E2E-007 | P2 | AC1 | 快速滚动不出现白屏 |
| EPI3-02-E2E-008 | P2 | AC3 | 深层嵌套目录展开后虚拟滚动正确 |
| EPI3-02-E2E-009 | P3 | AC1 | 空文件树处理 |
| EPI3-02-E2E-010 | P3 | AC2 | 搜索结果为空时处理 |

### Hook Unit Tests (frontend/src/hooks/useFileTreeFlatten.test.ts)

| ID | 优先级 | 描述 |
|----|--------|------|
| Hook-001 | P0 | 空文件树返回空数组 |
| Hook-002 | P0 | 单文件树返回一个元素 |
| Hook-003 | P0 | 展开/折叠目录控制子节点可见性 |
| Hook-004 | P1 | 多层嵌套目录深度正确递增 |
| Hook-005 | P1 | matchingPaths 过滤只包含匹配文件 |
| Hook-006 | P1 | 大量文件(1000+)扁平化性能 < 10ms |
| Hook-007 | P2 | 折叠目录的子节点不出现在列表中 |
| Hook-008 | P2 | 同级多个目录展开正确 |
| Hook-009 | P2 | 空目录(无children)正确处理 |
| Hook-010 | P2 | 深层嵌套(10层)正确扁平化 |

### Component Tests (frontend/src/components/common/VirtualList.test.tsx)

| ID | 优先级 | 描述 |
|----|--------|------|
| VL-001 | P0 | 只渲染可视区域的项 |
| VL-002 | P0 | overscan 正确扩展渲染范围 |
| VL-003 | P0 | 滚动后正确更新可视项 |
| VL-004 | P1 | 空列表正确处理 |
| VL-005 | P1 | 单项列表正确渲染 |
| VL-006 | P1 | 大量项(1000+)只渲染有限数量 |
| VL-007 | P2 | 动态高度(ResizeObserver)正确更新 |
| VL-008 | P2 | className prop 正确应用 |
| VL-009 | P2 | containerRef 正确传递 |
| VL-010 | P3 | 边界滚动(顶部/底部)正确处理 |

## Next Steps (Task-by-Task Activation)

During implementation of each task:

1. Remove `test.skip()` from the current test file or scenario
2. Run tests: `npm test` (unit) or `npx playwright test` (E2E)
3. Verify the activated test fails first, then passes after implementation (green phase)
4. If any activated tests still fail unexpectedly:
   - Either fix implementation (feature bug)
   - Or fix test (test bug)
5. Commit passing tests

## Implementation Guidance

**Hook to implement:**
- `frontend/src/hooks/useFileTreeFlatten.ts` — 扁平化文件树为 FlatFileItem[]

**Components to enhance:**
- `frontend/src/components/common/VirtualList.tsx` — 添加动态高度、className、containerRef
- `frontend/src/components/FileTree/FileTreeNode.tsx` — 支持 renderChildren prop
- `frontend/src/components/FileTree/FileTree.tsx` — 集成虚拟滚动

**Test data:**
- E2E beforeAll 创建 65 个测试文件（>50 阈值）
- Hook 测试使用内联 FileInfo 构造
- Component 测试使用 generateItems 工厂函数

## TDD Phase

🔴 **RED** — all new tests use `test.skip()` / `it.skip()` and assert expected behavior. Activate per task during implementation.
