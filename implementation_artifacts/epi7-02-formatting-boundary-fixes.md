# Story EPI7.02: 修复格式化边界缺陷

Status: done

## Story

As a 开发者,
I want 修复文件格式化流程中的两个边界缺陷（空文件被误判为格式化失败、格式化状态复位与内容更新的竞态窗口）,
so that 格式化空文件得到正确结果，且格式化状态指示与内容更新在并发下保持一致。

## Acceptance Criteria

1. **Given** 用户格式化一个空文件或格式化结果为空的文件
   **When** 后端返回 `status: 'success'` 且 `formatted === ''`
   **Then** 内容更新被正确应用（空结果视为有效格式化）
   **And** 不显示「格式化失败」错误提示

2. **Given** 用户触发格式化操作
   **When** 格式化结果返回并更新编辑器内容（`startTransition` 包装）
   **Then** `isFormatting` 的复位不与其产生竞态（状态指示与内容更新顺序一致）
   **And** 不出现「状态已复位但内容未更新」的窗口

3. **Given** 现有保存 / 格式化功能
   **When** 完成这两个修复后
   **Then** 所有现有功能行为保持不变（回归测试通过）

## Tasks / Subtasks

- [x] Task 1: 修复空文件误判（AC: #1）
  - [x] 将 `result.data.formatted` 的真值判断改为 `typeof ... === 'string'`
- [x] Task 2: 修复 `setIsFormatting(false)` 与 `updateTabContent` 竞态（AC: #2）
  - [x] 确保内容更新与状态复位顺序一致（`setIsFormatting(false)` 移入 transition，error/catch 分支显式复位）
- [x] Task 3: 编写单元测试（AC: #1-#2）
- [x] Task 4: 回归验证保存 / 格式化（AC: #3）

## Technical Context

### 已有代码（需理解，勿重造轮子）

| 文件 | 状态 | 说明 |
|------|------|------|
| `frontend/src/hooks/useFileOperations.ts` | ⚠️ 需修改 | `handleFormat`（L56-77） |
| `frontend/src/hooks/useFileOperations.test.ts` | ⚠️ 需补充 | 现有 7 用例 |

### 根因定位（必读）

**缺陷 1 — 空文件被真值判断误判（L64）**

```typescript
if (result.status === 'success' && result.data && result.data.formatted) {
  const formatted = result.data.formatted;
  startTransition(() => updateTabContent(activeTabId!, formatted));
} else {
  showError(result.message || '格式化失败');   // ← 空文件 formatted==='' 会走到这里
}
```

当格式化空文件时后端返回 `formatted === ''`（合法结果），但 `result.data.formatted` 的真值判断将空字符串视为 falsy，落入 `else` 分支错误提示「格式化失败」。修复为 `typeof result.data.formatted === 'string'`。

**缺陷 2 — `setIsFormatting(false)` 与 `updateTabContent` 竞态（L66-76）**

```typescript
startTransition(() => {
  updateTabContent(activeTabId!, formatted);   // 低优先级 transition
});
...
} finally {
  setIsFormatting(false);                       // 紧急更新，可能先于 transition 提交
}
```

`startTransition` 标记的内容更新为低优先级，而 `finally` 中的 `setIsFormatting(false)` 是紧急更新，可能先于内容更新提交，产生「格式化状态已复位但内容尚未更新」的窗口。修复方向：确保 `isFormatting` 复位与内容更新排序一致（如将复位纳入 transition 完成后的路径，或在内容更新提交后再复位），具体方案在 dev-story 阶段结合 React 19 语义确定。

### 技术约束

1. 保持 `startTransition` 仅包裹同步 React 状态更新的既有约束（参考 EPI3.03 AC5）
2. 不改变 `formatCode` 异步调用与 `formatCache`/`monacoOptimizer` 等既有优化
3. React 版本 19.2.0（`useTransition`/`startTransition` 自 `react` 顶层导入）

### 参考资料

- deferred-work.md epi3-03 defer 条目（空文件误判、setIsFormatting 竞态）
- 前序 story：`implementation_artifacts/epi3-03-complex-operation-concurrent-processing.md`（startTransition 正确用法）

## Success Criteria

### 功能完整性
- [x] 空文件格式化不再误报失败
- [x] 格式化状态复位与内容更新无竞态

### 代码质量
- [x] TypeScript 类型安全
- [x] 单元测试覆盖空文件与竞态路径
- [x] 无 ESLint 错误

## Dev Agent Record

### Agent Model Used

DeepSeek-V4-Pro 正式版

### Completion Notes

1. **空文件误判修复**：`handleFormat` 中 `result.data.formatted` 的真值判断改为 `typeof result.data.formatted === 'string'`，空字符串 `''` 现被视为合法格式化结果，不再落入 `else` 分支误报「格式化失败」。
2. **竞态修复**：将 `setIsFormatting(false)` 移入 `startTransition` 回调内，与 `updateTabContent` 同属低优先级 transition、同批提交，消除「状态已复位但内容未更新」窗口；`else`（错误结果）与 `catch`（异常）分支改为显式 `setIsFormatting(false)`，移除原 `finally`，保证三条路径的复位逻辑完整一致。
3. **新增单测**：`useFileOperations.test.ts` 增加 2 用例（空文件格式化更新为空内容不报错、成功后 isFormatting 复位与内容更新同 transition 提交），从 7 用例扩至 9 用例。红阶段验证：空文件用例 RED，修复后 GREEN（9/9 通过）。
4. **验证**：`tsc --noEmit` 0 错误；targeted `vitest run useFileOperations.test.ts` 9/9 通过。

### File List

| 文件 | 操作 | 说明 |
|------|------|------|
| `frontend/src/hooks/useFileOperations.ts` | UPDATE | 空文件真值判断改 `typeof`；`setIsFormatting(false)` 移入 transition，else/catch 显式复位 |
| `frontend/src/hooks/useFileOperations.test.ts` | UPDATE | 新增空文件与竞态一致 2 用例（7→9） |

## Review Findings

代码审查（bmad-code-review，三层对抗式）结论：**通过，无阻断性问题，无需修改**。

- 空文件误判修复正确：`typeof result.data.formatted === 'string'` 将空字符串视为合法结果；`typeof undefined` 为 false 仍正确落入错误分支，语义无误。
- 竞态修复正确：`setIsFormatting(false)` 移入 `startTransition` 与 `updateTabContent` 同批提交，消除复位先于内容更新的窗口；error/catch 分支显式复位，三条路径复位逻辑完整（无 stuck `isFormatting` 路径）。
- `activeTabId!` 非空断言安全：`handleFormat` 在 `!activeTab` 时已早退，activeTab 存在即保证 activeTabId 非空。
- 移除 `finally` 后无遗漏：success/else/catch 三路径均复位 `isFormatting`。

非阻断性备注（无需处理）：
1. 竞态修复的语义可观察为 `isFormatting` 在内容提交前保持 true（更符合「格式化未完成前不解除忙碌态」），非缺陷。

## Change Log

- 2026-09-24: 创建 story（EPI7.02），源自 deferred epi3-03 两条（空文件误判 + setIsFormatting 竞态），供 dev-story 实施
- 2026-09-24: dev-story 实施完成——空文件 `typeof` 判断修复 + `setIsFormatting(false)` 移入 transition；新增 2 用例，红→绿验证通过，tsc 0 错误；Status → review
- 2026-09-24: code-review 通过（无阻断性问题，无明显修改需求）
- 2026-09-24: testarch-automate 完成——现有 9 用例已覆盖 AC#1 空文件误判与 AC#2 竞态一致，AC#3 由全量回归覆盖，无新增自动化缺口；regression 全通过（tsc 0 错误、targeted 9/9、全量 vitest 682/682、lint 变更文件 0 错误、build 成功）；Status → done