# Deferred Work

## Deferred from: code review of 2-1-git-visualization (2026-05-27)

- **并发 Git 操作竞态条件** - 多个组件同时调用 Git API 可能导致竞态条件（如同时提交和切换分支）
- **大型仓库性能问题** - `getGitStatus` 和 `getChanges` 可能对大型仓库造成性能问题，没有分页或增量加载机制
- **前端 Git 状态轮询缺失** - `GitContext.tsx` 只在组件挂载时加载一次状态，没有定期刷新或 WebSocket 实时更新机制
- **状态栏分支信息可能过时** - `App.tsx` 中的 `changesCount` 只在组件渲染时计算，不会自动更新
- **Git 状态缓存策略缺失** - 频繁调用 `getGitStatus` 可能导致性能问题，没有缓存或去抖动机制
- **领先/落后远程分支显示缺失** - AC-6 要求显示领先/落后远程分支的箭头和数字，但 `getBranches` 没有实现此功能
- **未处理 Git 配置文件** - 没有考虑 `.gitignore`、`.gitattributes` 等配置文件的影响
- **二进制文件 diff 显示** - `getGitDiff` 对二进制文件返回空 diff，没有特殊处理提示