# Story EPI7.02: 修复格式化边界缺陷

Status: backlog

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

- [ ] Task 1: 修复空文件误判（AC: #1）
  - [ ] 将 `result.data.formatted` 的真值判断改为 `typeof ... === 'string'`
- [ ] Task 2: 修复 `setIsFormatting(false)` 与 `updateTabContent` 竞态（AC: #2）
  - [ ] 确保内容更新与状态复位顺序一致
- [ ] Task 3: 编写单元测试（AC: #1-#2）
- [ ] Task 4: 回归验证保存 / 格式化（AC: #3）

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
- [ ] 空文件格式化不再误报失败
- [ ] 格式化状态复位与内容更新无竞态

### 代码质量
- [ ] TypeScript 类型安全
- [ ] 单元测试覆盖空文件与竞态路径
- [ ] 无 ESLint 错误

## Change Log

- 2026-09-24: 创建 story（EPI7.02），源自 deferred epi3-03 两条（空文件误判 + setIsFormatting 竞态），供 dev-story 实施