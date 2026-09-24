# Story EPI7.01: 修复 LSPContext providers 未 dispose 内存泄漏

Status: backlog

## Story

As a 开发者,
I want LSPContext 注册的所有 Monaco language feature providers 在其生命周期结束时被正确 dispose,
so that 长时间会话或频繁开关标签页不会累积已失效的 provider，避免内存泄漏与重复的补全/悬停建议。

## Acceptance Criteria

1. **Given** 同一 URI 被重复注册（例如 LSP 重连或编辑器重新挂载）
   **When** `registerEditor(uri)` 再次被调用
   **Then** 先 dispose 该 URI 既有的所有 disposers
   **And** 再写入新的 disposers
   **And** 不产生重复的 completion/definition/hover provider

2. **Given** LSP 连接断开或 LSPProvider 组件卸载
   **When** `disconnect()` 被调用
   **Then** 遍历 `disposersRef` 中所有 URI 的 disposers 并调用 `dispose()`
   **And** 清空 `disposersRef` 与 `editorsRef`

3. **Given** 编辑器正常卸载（Tab 关闭）
   **When** `unregisterEditor(uri)` 被调用
   **Then** 该 URI 的 disposers 被 dispose 并从 `disposersRef` 删除（保持既有行为）

4. **Given** 现有 LSP 功能（补全、定义、引用、重命名、格式化、范围格式化、签名、悬停）
   **When** 完成 dispose 修复后
   **Then** 所有 LSP 功能行为保持不变（回归测试通过）

## Tasks / Subtasks

- [ ] Task 1: 修复 `registerEditor` 重复注册未先 dispose（AC: #1）
  - [ ] 在 `disposersRef.current.set(uri, disposers)` 前，检查并 dispose 已有 disposers
- [ ] Task 2: 修复 `disconnect` 未清理 disposersRef（AC: #2）
  - [ ] 遍历 `disposersRef` 调用 dispose，并 clear `disposersRef`
- [ ] Task 3: 核对 `unregisterEditor` / `editorsRef` 一致性（AC: #3）
- [ ] Task 4: 编写单元测试（AC: #1-#3）
- [ ] Task 5: 回归验证 LSP 功能（AC: #4）

## Technical Context

### 已有代码（需理解，勿重造轮子）

| 文件 | 状态 | 说明 |
|------|------|------|
| `frontend/src/context/LSPContext.tsx` | ⚠️ 需修改 | `registerEditor`（L121-356）、`disconnect`（L111-115）、`unregisterEditor`（L358-365） |
| `frontend/src/components/Editor/LspCodeEditor.tsx` | ✅ 无需修改 | `registerEditor`/`unregisterEditor` 调用方（L533 / L543） |

### 根因定位（必读）

`LSPContext.tsx` 中 `disposersRef` 的生命周期管理有两处缺陷：

**缺陷 1 — `registerEditor` 覆盖未先 dispose（L355）**

```typescript
// L355: disposersRef.current.set(uri, disposers);
```

当同一 URI 被 `registerEditor` 重复调用时（LSP 重连、`language`/`uri` 变化触发 effect 重跑、编辑器重新挂载），`set(uri, disposers)` 会**覆盖**该 URI 既有的 disposers 数组，旧数组中 8 个 provider（completion/definition/reference/rename/documentFormatting/rangeFormatting/signatureHelp/hover）的 `dispose` 引用被丢弃，永远无法回收。同时 Monaco 对同一 languageId 注册多个 provider 会产生**重复的补全/悬停建议**。

**缺陷 2 — `disconnect` 未清理 disposersRef（L111-115）**

```typescript
const disconnect = useCallback(() => {
  lspService.disconnect();
  setIsConnected(false);
  editorsRef.current.clear();   // ← 只 clear editorsRef，未处理 disposersRef
}, []);
```

LSPProvider 卸载时的 `useEffect` cleanup（L374-378）调用 `disconnect()`，但 `disconnect` 未遍历 `disposersRef` 调用 `dispose()`。结果是所有已注册 provider 在组件卸载时被泄漏。

### 修复方向

1. `registerEditor` 中，写入新 disposers 前先 `const existing = disposersRef.current.get(uri); existing?.forEach(d => d.dispose());`
2. `disconnect` 中，遍历 `disposersRef.current.forEach(disposers => disposers.forEach(d => d.dispose()))` 后 `disposersRef.current.clear()`
3. 保持 `unregisterEditor` 的既有 dispose 逻辑不变；确认 `editorsRef` 与 `disposersRef` 清理一致性

### 技术约束

1. 不改变任何 LSP provider 的功能行为（补全/定义/引用/重命名/格式化/签名/悬停）
2. 不改变 `lspService` 接口（`frontend/src/services/lspService.ts`）
3. 保持 Monaco 懒加载（`getMonacoSync()`）模式不变

### 参考资料

- TD-03 backlog 条目（`sprint-status.yaml`）
- 前序 story：`implementation_artifacts/epi2-01-monaco-editor-lazy-loading.md`（LSP 架构引入）
- deferred-work.md「LSP 连接竞态」条目

## Success Criteria

### 功能完整性
- [ ] 重复注册同 URI 时旧 disposers 先被 dispose
- [ ] disconnect 时所有 disposers 被 dispose

### 代码质量
- [ ] TypeScript 类型安全
- [ ] 单元测试覆盖 dispose 路径
- [ ] 无 ESLint 错误

## Change Log

- 2026-09-24: 创建 story（EPI7.01），源自 TD-03（LSPContext providers 未 dispose 内存泄漏），供 dev-story 实施