# Story 1.1: 文件树浏览与管理

**Story ID**: 1.1  
**Story Key**: 1-1-file-tree  
**Status**: ready-for-dev  
**Epic**: Epic 1 - 基础IDE功能  
**FRs Covered**: FR-001, FR-002  
**Priority**: P0  
**Estimated Effort**: 3-5 days  

---

## 📋 用户故事

**As a** 个人开发者,  
**I want** 在浏览器中看到实时文件树,  
**So that** 导航和操作项目文件。

---

## ✅ 验收标准 (BDD格式)

### AC-1: 初始文件树显示
**Given** 用户打开工作区  
**When** 进入IDE首页  
**Then** 文件树立即显示根目录下的所有文件和文件夹  
**And** 文件夹支持展开/折叠  
**And** 遵循.gitignore忽略规则

### AC-2: 实时刷新
**Given** 文件树已显示  
**When** 外部创建/修改/删除文件  
**Then** 文件树3秒内自动刷新

### AC-3: 右键菜单操作
**Given** 用户右键点击文件/文件夹  
**When** 选择操作选项  
**Then** 支持新建文件/文件夹、重命名、删除操作

### AC-4: 文件打开
**Given** 用户单击文件  
**When** 文件被点击  
**Then** 文件在编辑器中打开

---

## 🏗️ 开发者上下文

### 技术栈
| 层级 | 技术 | 版本 |
|------|------|------|
| 前端 | React | 18+ |
| 前端 | TypeScript | 5+ |
| 前端 | Vite | 5+ |
| 后端 | Deno | 1.40+ |
| 核心 | Rust | 1.75+ |
| 测试 | Playwright | 1.44+ |

### 架构合规性

**三层架构要求：**
- **前端层 (React)**: 实现文件树UI组件
- **后端层 (Deno)**: 提供文件系统API
- **核心层 (Rust)**: 处理实际文件系统操作

**API规范：**
- 使用 `/api/v1/files/tree` 获取文件树
- 使用 `/api/v1/files/create` 创建文件/文件夹
- 使用 `/api/v1/files/rename` 重命名
- 使用 `/api/v1/files/delete` 删除
- 使用 WebSocket 实时推送文件变化

**命名规范：**
- 组件: PascalCase (如 `FileTree.tsx`)
- 函数: camelCase (如 `fetchFileTree`)
- API端点: kebab-case (如 `/api/v1/files/tree`)
- JSON字段: camelCase (如 `fileName`, `filePath`)

### 文件结构要求

```
lapdev/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileTree/
│   │   │   │   ├── FileTree.tsx
│   │   │   │   ├── FileTreeNode.tsx
│   │   │   │   ├── FileTreeContextMenu.tsx
│   │   │   │   └── index.ts
│   │   │   └── Editor/
│   │   │       └── Editor.tsx (占位)
│   │   ├── services/
│   │   │   └── fileService.ts
│   │   ├── types/
│   │   │   └── file.ts
│   │   └── App.tsx
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── handlers/
│   │   │   └── fileHandler.ts
│   │   ├── services/
│   │   │   └── fileService.ts
│   │   ├── websocket/
│   │   │   └── fileWatcher.ts
│   │   └── main.ts
│   └── deno.json
├── core/
│   ├── src/
│   │   ├── fs.rs
│   │   └── lib.rs
│   └── Cargo.toml
└── tests/
    └── e2e/
        └── file-tree.test.ts
```

### 测试要求

**单元测试:**
- 文件树组件渲染测试
- 文件服务API测试
- 文件操作逻辑测试

**集成测试:**
- 前端-后端API集成测试
- 文件变化WebSocket推送测试

**E2E测试:**
- 使用已创建的 `tests/e2e/file-tree.test.ts`
- 验证所有验收标准

**覆盖率目标:**
- 单元测试: ≥80%
- 集成测试: 核心流程100%

### 性能要求

| 指标 | 目标值 |
|------|--------|
| 文件树初始加载 | < 500ms |
| 文件变化刷新延迟 | < 3秒 |
| 大目录(>1000文件)渲染 | < 1秒 |

### 安全要求

- 文件访问限制在工作区目录内
- 路径遍历攻击防护
- .gitignore规则严格执行
- 危险操作（如删除）需确认

---

## 📦 实现任务分解

### Task 1.1.1: Rust核心层 - 文件系统操作
**目标**: 实现Rust FFI接口，提供文件系统操作能力

**实现内容:**
- `fs.rs` 文件读取、目录遍历
- `fs.rs` 文件创建、重命名、删除
- `fs.rs` .gitignore解析
- `lib.rs` FFI绑定导出

**验收标准:**
- FFI函数可通过Deno调用
- 支持基本文件系统操作
- .gitignore规则正确应用

### Task 1.1.2: Deno后端层 - 文件API
**目标**: 实现HTTP API和WebSocket文件变化推送

**实现内容:**
- `fileHandler.ts` GET /api/v1/files/tree
- `fileHandler.ts` POST /api/v1/files/create
- `fileHandler.ts` POST /api/v1/files/rename
- `fileHandler.ts` DELETE /api/v1/files/delete
- `fileWatcher.ts` WebSocket文件变化推送
- `fileService.ts` 业务逻辑封装

**验收标准:**
- API端点正确响应
- WebSocket实时推送文件变化
- 错误处理和验证完善

### Task 1.1.3: React前端层 - 文件树UI
**目标**: 实现文件树组件和交互

**实现内容:**
- `FileTree.tsx` 主文件树组件
- `FileTreeNode.tsx` 递归树节点
- `FileTreeContextMenu.tsx` 右键菜单
- `fileService.ts` API调用封装
- `file.ts` TypeScript类型定义

**验收标准:**
- 文件树正确渲染
- 展开/折叠功能正常
- 右键菜单操作可用
- 点击文件打开编辑器

### Task 1.1.4: 集成与测试
**目标**: 端到端测试和性能优化

**实现内容:**
- 集成测试用例编写
- E2E测试执行
- 性能优化（虚拟滚动、懒加载）
- 错误边界处理

**验收标准:**
- 所有测试通过
- 性能指标达标
- 用户体验流畅

---

## 🎯 成功标准

- ✅ 所有验收标准通过
- ✅ 代码覆盖率 ≥80%
- ✅ 性能指标达标
- ✅ 无安全漏洞
- ✅ 代码审查通过

---

## 📚 参考资料

- [PRD - US-01](docs/prd.md#us-01-文件树浏览与管理)
- [架构文档 - 三层架构](docs/architecture.md#3-三层架构设计)
- [API规格 - 文件系统API](docs/api-spec.md#22-文件系统-api)
- [测试设计 - Epic 1](docs/test-design-progress.md)

---

## 🔄 依赖关系

**前置依赖:**
- 无（这是第一个Story）

**后续依赖:**
- Story 1.2: 现代代码编辑器体验（需要文件树打开文件功能）
- Story 2.1: Git版本控制可视化（需要文件树显示Git状态）

---

## 📝 开发注意事项

1. **FFI性能**: Rust-Deno FFI调用有开销，考虑批量操作和缓存
2. **大文件处理**: 大目录使用虚拟滚动或分页加载
3. **实时刷新**: 使用文件系统watcher而非轮询
4. **错误处理**: 所有API调用必须有错误处理
5. **类型安全**: TypeScript类型定义必须完整

---

## 🚀 下一步

完成此Story后：
1. 运行 `bmad-code-review` 进行代码审查
2. 标记Story状态为 `done`
3. 开始 Story 1.2: 现代代码编辑器体验