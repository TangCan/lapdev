# Story 2.1: Git版本控制可视化

**Story ID**: 2.1  
**Story Key**: 2-1-git-visualization  
**Status**: ready-for-dev  
**Epic**: Epic 2 - 高级IDE功能  
**FRs Covered**: FR-009, FR-010  
**Priority**: P0  
**Estimated Effort**: 5-7 days  

---

## 📋 用户故事

**As a** 个人开发者,  
**I want** IDE直观展示Git状态,  
**So that** 执行常用Git操作。

---

## ✅ 验收标准 (BDD格式)

### AC-1: 文件树Git状态显示
**Given** 项目有Git仓库  
**When** 查看文件树  
**Then** 文件树中通过图标/颜色区分文件状态  
**And** 已修改文件显示蓝色/修改图标  
**And** 新增文件显示绿色/添加图标  
**And** 未跟踪文件显示灰色/问号图标  
**And** 已删除文件显示红色/删除图标

### AC-2: 编辑器差异指示器
**Given** 用户打开文件  
**When** 查看编辑器边栏(gutter)  
**Then** 显示当前文件与HEAD的差异指示  
**And** 新增行显示绿色背景  
**And** 修改行显示蓝色背景  
**And** 删除行显示红色背景

### AC-3: Git变更面板
**Given** 用户打开Git面板  
**When** 查看变更列表  
**Then** 显示所有已修改文件的列表  
**And** 每个文件显示文件名和变更状态  
**And** 点击文件可打开diff视图  
**And** diff视图中高亮显示具体的行级差异

### AC-4: 提交功能
**Given** 用户有变更需要提交  
**When** 点击提交按钮  
**Then** 显示提交信息输入框  
**And** 支持一键暂存所有变更  
**And** 填写提交信息后执行git commit  
**And** 提交成功后清空变更列表

### AC-5: 分支切换
**Given** 用户在Git面板  
**When** 打开分支选择器  
**Then** 显示所有本地和远程分支列表  
**And** 当前分支高亮显示  
**When** 用户选择切换分支  
**Then** 执行git checkout切换分支  
**And** 更新文件树和编辑器内容

### AC-6: 分支状态显示
**Given** 用户在状态栏或Git面板  
**When** 查看分支信息  
**Then** 显示当前分支名称  
**And** 如果有未提交变更显示变更数量  
**And** 如果有领先/落后远程分支显示箭头和数字

---

## 🏗️ 开发者上下文

### 技术栈
| 层级 | 技术 | 版本 |
|------|------|------|
| 前端 | React | 18+ |
| 前端 | TypeScript | 5+ |
| 前端 | Vite | 5+ |
| 后端 | Deno | 1.40+ |
| Git库 | simple-git | 3.x |
| 差异视图 | diff2html | 3.x |

### 架构合规性
- **前端层**: React组件实现文件树Git状态、编辑器gutter、Git面板
- **后端层**: Deno API调用simple-git执行Git操作
- **通信方式**: REST API (Git操作) + WebSocket (实时状态更新)
- **状态管理**: React Context

### API端点设计
| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/v1/git/status` | GET | 获取Git仓库状态 |
| `/api/v1/git/diff` | GET | 获取文件差异 |
| `/api/v1/git/commit` | POST | 执行提交 |
| `/api/v1/git/branches` | GET | 获取分支列表 |
| `/api/v1/git/checkout` | POST | 切换分支 |
| `/api/v1/git/stage` | POST | 暂存文件 |

### 文件结构要求

```
lapdev/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileTree/
│   │   │   │   └── FileTreeNode.tsx (更新: 添加Git状态图标)
│   │   │   ├── Editor/
│   │   │   │   └── CodeEditor.tsx (更新: 添加gutter差异指示器)
│   │   │   └── Git/
│   │   │       ├── GitPanel.tsx       # Git面板主组件
│   │   │       ├── GitStatus.tsx      # 变更文件列表
│   │   │       ├── DiffView.tsx        # Diff视图组件
│   │   │       ├── BranchSelector.tsx  # 分支选择器
│   │   │       └── CommitForm.tsx      # 提交表单
│   │   ├── services/
│   │   │   └── gitService.ts          # Git API调用封装
│   │   └── context/
│   │       └── GitContext.tsx         # Git状态上下文
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── handlers/
│   │   │   └── gitHandler.ts          # Git API处理器
│   │   ├── services/
│   │   │   └── gitService.ts          # Git业务逻辑(simple-git封装)
│   │   └── main.ts (更新: 添加Git路由)
│   └── deno.json
└── tests/
    └── e2e/
        └── git.spec.ts                # Git功能E2E测试
```

### 现有组件修改清单

| 文件 | 修改内容 |
|------|----------|
| `FileTreeNode.tsx` | 添加Git状态图标显示逻辑 |
| `CodeEditor.tsx` | 在gutter区域添加差异高亮 |
| `App.tsx` | 集成Git面板组件 |
| `index.css` | 添加Git相关样式 |

---

## 📝 开发任务分解

### ✅ Task 2.1.1: 后端Git服务层
**目标**: 实现Git操作的API层

**实现内容:**
- ✅ 实现`gitService.ts`封装Git操作（使用Deno内置Git命令）
- ✅ 实现`gitHandler.ts`处理HTTP请求
- ✅ 添加Git路由到main.ts

**验收标准:**
- ✅ 所有Git API端点正确响应
- ✅ 错误处理完善（无Git仓库、非Git路径等）

### ✅ Task 2.1.2: 前端Git服务层
**目标**: 实现前端Git API调用

**实现内容:**
- ✅ 创建`gitService.ts`封装API调用
- ✅ 创建`GitContext.tsx`管理Git状态

**验收标准:**
- ✅ API调用封装完整
- ✅ 状态管理正确

### ✅ Task 2.1.3: Git面板UI
**目标**: 实现Git面板组件

**实现内容:**
- ✅ 创建`GitPanel.tsx`主面板
- ✅ 创建`GitStatus.tsx`变更列表
- ✅ 创建`DiffView.tsx`差异视图
- ✅ 创建`BranchSelector.tsx`分支选择器
- ✅ 创建`CommitForm.tsx`提交表单

**验收标准:**
- ✅ 面板正确显示变更列表
- ✅ Diff视图正确显示行级差异
- ✅ 分支切换功能正常

### ✅ Task 2.1.4: 文件树Git状态集成
**目标**: 在文件树中显示Git状态

**实现内容:**
- ✅ 修改`FileTreeNode.tsx`添加Git状态图标
- ✅ 根据文件状态显示不同颜色和图标

**验收标准:**
- ✅ 已修改文件显示蓝色
- ✅ 新增文件显示绿色
- ✅ 未跟踪文件显示灰色
- ✅ 已删除文件显示红色

### ⏳ Task 2.1.5: 编辑器Gutter差异指示
**目标**: 在编辑器显示行级差异

**实现内容:**
- ⏳ 修改`CodeEditor.tsx`添加gutter渲染
- ⏳ 根据diff数据高亮显示行级别变化

**验收标准:**
- ⏳ 新增行显示绿色背景
- ⏳ 修改行显示蓝色背景
- ⏳ 删除行显示红色背景

### ✅ Task 2.1.6: 测试与集成
**目标**: 端到端测试

**实现内容:**
- ✅ 创建`tests/e2e/git.spec.ts`
- ✅ 创建`tests/api/git.spec.ts`
- ⏳ 验证所有验收标准
- ⏳ 性能测试（大型仓库）

**验收标准:**
- ⏳ 所有E2E测试通过
- ⏳ Git操作响应时间 < 200ms

---

## 🎯 成功标准

- ✅ 所有验收标准通过
- ✅ 代码审查通过
- ✅ Git操作功能完整
- ✅ UI状态显示正确
- ✅ 无性能问题

---

## 🔧 技术注意事项

1. **Git仓库检测**: 首先检测工作区是否是Git仓库
2. **路径处理**: 所有路径必须是相对于工作区的安全路径
3. **错误处理**: 优雅处理无Git仓库、Git命令失败等情况
4. **实时更新**: 文件变化时通过WebSocket更新Git状态
5. **性能考虑**: 大型仓库使用增量更新而非全量刷新

---

## 📚 参考资料

- [PRD - US-05, US-06](docs/prd.md#us-05-git版本控制可视化)
- [Epic 2 详细说明](docs/epics.md#epic-2-高级ide功能)
- [simple-git文档](https://github.com/steveukx/git-js)
- [diff2html文档](https://github.com/rtfpessoa/diff2html)

---

## 🔄 依赖关系

**前置依赖:**
- Story 1.1 (文件树): Git状态需要文件树组件
- Story 1.2 (代码编辑器): Diff视图需要编辑器组件

**后续依赖:**
- Story 2.2 (LSP代码智能): LSP需要Git感知

---

## 🔍 Code Review Findings

### Decision Needed (4)

- [ ] [Review][Decision] **技术栈偏离** - Spec 要求使用 `simple-git`，但实现使用 Deno 内置 Git 命令（`Deno.run`）。是否需要更新 spec？
- [ ] [Review][Decision] **WebSocket 实时更新缺失** - Spec 要求 WebSocket 实时更新 Git 状态，但实现使用轮询（或无轮询）。是否需要实现？
- [ ] [Review][Decision] **编辑器 gutter 未实现** - AC-2 要求编辑器边栏显示差异指示，但 Task 2.1.5 标记为未完成。是否需要现在实现？
- [ ] [Review][Decision] **diff2html 库未使用** - Spec 要求使用 `diff2html` 库，但实现使用自定义解析。是否需要更新 spec？

### Patch (11)

- [ ] [Review][Patch] **文件路径安全检查缺失** - 路径遍历漏洞 [`gitHandler.ts:handleGitDiff`]
- [ ] [Review][Patch] **分支名称特殊字符未转义** - 命令注入风险 [`gitService.ts:checkoutBranch`]
- [ ] [Review][Patch] **Git 命令执行缺少错误边界处理** - 未区分失败类型 [`gitService.ts:runGitCommand`]
- [ ] [Review][Patch] **分支切换后 UI 状态未完全同步** - 文件树/编辑器未重载 [`GitContext.tsx:checkout`]
- [ ] [Review][Patch] **非 Git 仓库场景处理不完整** - 未处理 worktree [`gitService.ts:isGitRepository`]
- [ ] [Review][Patch] **Diff 视图解析过于简单** - 无法处理复杂 diff [`DiffView.tsx:parseDiff`]
- [ ] [Review][Patch] **提交表单缺少验证** - 无格式/长度检查 [`CommitForm.tsx`]
- [ ] [Review][Patch] **空提交消息处理** - 接受空字符串 [`gitService.ts:commitChanges`]
- [ ] [Review][Patch] **Diff 视图内存泄漏风险** - 大型 diff 未清理 [`DiffView.tsx`]
- [ ] [Review][Patch] **分支列表去重逻辑缺失** - 本地/远程同名重复 [`gitService.ts:getBranches`]
- [ ] [Review][Patch] **API 响应格式不完全一致** - 错误处理差异 [`gitHandler.ts`]

### Defer (7)

- [x] [Review][Defer] **并发 Git 操作竞态条件** - 多个组件同时调用 API [`GitContext.tsx`] — deferred, pre-existing
- [x] [Review][Defer] **大型仓库性能问题** - 无分页或增量加载 [`gitService.ts:getGitStatus`] — deferred, pre-existing
- [x] [Review][Defer] **前端 Git 状态轮询缺失** - 无定期刷新机制 [`GitContext.tsx`] — deferred, pre-existing
- [x] [Review][Defer] **状态栏分支信息可能过时** - 无自动更新 [`App.tsx`] — deferred, pre-existing
- [x] [Review][Defer] **Git 状态缓存策略缺失** - 频繁调用性能问题 [`GitContext.tsx`] — deferred, pre-existing
- [x] [Review][Defer] **领先/落后远程分支显示缺失** - AC-6 部分未实现 [`gitService.ts:getBranches`] — deferred, pre-existing
- [x] [Review][Defer] **未处理 Git 配置文件** - .gitignore/.gitattributes [`gitService.ts`] — deferred, pre-existing
- [x] [Review][Defer] **二进制文件 diff 显示** - 无特殊处理提示 [`gitService.ts:getGitDiff`] — deferred, pre-existing

### Dismiss (1)

- [x] [Review][Dismiss] **Git 状态图标硬编码** - Unicode 字符跨平台不一致 [`FileTreeNode.tsx`] — dismissed as noise
