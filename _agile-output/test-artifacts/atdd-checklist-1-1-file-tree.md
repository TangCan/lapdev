---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-generation-mode', 'step-03-test-strategy', 'step-04c-aggregate', 'step-05-validate-and-complete']
lastStep: 'step-05-validate-and-complete'
lastSaved: '2026-05-26'
storyId: '1.1'
storyKey: '1-1-file-tree'
storyFile: 'implementation_artifacts/1-1-file-tree.md'
atddChecklistPath: '_bmad-output/test-artifacts/atdd-checklist-1-1-file-tree.md'
generatedTestFiles:
  - 'tests/api/file-tree.spec.ts'
  - 'tests/e2e/file-tree.spec.ts'
inputDocuments:
  - '.trae/skills/bmad-tea/resources/knowledge/data-factories.md'
  - '.trae/skills/bmad-tea/resources/knowledge/component-tdd.md'
  - '.trae/skills/bmad-tea/resources/knowledge/test-quality.md'
  - '.trae/skills/bmad-tea/resources/knowledge/test-healing-patterns.md'
  - '.trae/skills/bmad-tea/resources/knowledge/selector-resilience.md'
  - '.trae/skills/bmad-tea/resources/knowledge/timing-debugging.md'
  - '.trae/skills/bmad-tea/resources/knowledge/overview.md'
  - '.trae/skills/bmad-tea/resources/knowledge/api-request.md'
  - '.trae/skills/bmad-tea/resources/knowledge/auth-session.md'
  - 'implementation_artifacts/1-1-file-tree.md'
  - 'playwright.config.ts'
  - '_bmad/tea/config.yaml'
---

# ATDD Checklist: Story 1.1 - 文件树浏览与管理

## Step 1: Preflight & Context Loading

### 技术栈检测
- **检测到的栈**: fullstack
- **前端**: React 18+, TypeScript 5+, Vite 5+
- **后端**: Deno 1.40+, Rust 1.75+
- **测试**: Playwright 1.44+

### 前置条件检查
- ✅ Story文件已批准，状态为`ready-for-dev`
- ✅ Playwright测试框架已配置
- ✅ 开发环境可用（Deno已安装）

### Story上下文
- **Story ID**: 1.1
- **Story Key**: 1-1-file-tree
- **Story File**: `implementation_artifacts/1-1-file-tree.md`
- **Story状态**: ready-for-dev
- **优先级**: P0
- **预估工作量**: 3-5 days

### 验收标准
1. **AC-1: 初始文件树显示**
   - Given 用户打开工作区
   - When 进入IDE首页
   - Then 文件树立即显示根目录下的所有文件和文件夹
   - And 文件夹支持展开/折叠
   - And 遵循.gitignore忽略规则

2. **AC-2: 实时刷新**
   - Given 文件树已显示
   - When 外部创建/修改/删除文件
   - Then 文件树3秒内自动刷新

3. **AC-3: 右键菜单操作**
   - Given 用户右键点击文件/文件夹
   - When 选择操作选项
   - Then 支持新建文件/文件夹、重命名、删除操作

4. **AC-4: 文件打开**
   - Given 用户单击文件
   - When 文件被点击
   - Then 文件在编辑器中打开

### 技术架构
- **前端层 (React)**: 实现文件树UI组件
- **后端层 (Deno)**: 提供文件系统API
- **核心层 (Rust)**: 处理实际文件系统操作

### API规范
- `GET /api/v1/files/tree` - 获取文件树
- `POST /api/v1/files/create` - 创建文件/文件夹
- `POST /api/v1/files/rename` - 重命名
- `DELETE /api/v1/files/delete` - 删除
- WebSocket - 实时推送文件变化

### 测试框架配置
- **Playwright配置**: `playwright.config.ts`已配置
- **测试目录**: `tests/e2e/`（API测试）, `tests/unit/`（单元测试）
- **现有测试模式**: 使用API-first模式，测试夹具（beforeEach/afterEach），测试工厂模式

### TEA配置
- **tea_use_playwright_utils**: true（已加载Playwright Utils知识库）
- **tea_browser_automation**: auto
- **test_stack_type**: auto

### 知识库片段（已加载）
#### 核心片段
- `data-factories.md` - 测试数据工厂模式
- `component-tdd.md` - 组件TDD循环
- `test-quality.md` - 测试质量标准
- `test-healing-patterns.md` - 测试修复模式

#### 前端片段
- `selector-resilience.md` - 选择器韧性
- `timing-debugging.md` - 时序调试

#### Playwright Utils片段
- `overview.md` - Playwright Utils概览
- `api-request.md` - API请求工具
- `auth-session.md` - 认证会话管理

### 现有测试文件
- `tests/e2e/file-api.test.ts` - 文件系统API测试（已启用36个测试用例）
- `tests/e2e/security.test.ts` - 安全测试（已创建20个测试用例）
- `tests/e2e/websocket.test.ts` - WebSocket测试（已创建5个测试用例）
- `tests/unit/fileService.test.ts` - 单元测试（已扩展15个测试用例）

## Step 2: Generation Mode Selection

### 选择的模式
**AI Generation**

### 选择理由
1. ✅ 验收标准清晰明确（BDD格式）
2. ✅ 场景是标准的UI交互模式（展开/折叠、右键菜单、文件打开）
3. ✅ API规范已定义（`/api/v1/files/tree`等）
4. ✅ 现有测试文件提供了测试模式参考
5. ✅ 文件树交互是常见的IDE功能，不需要复杂的浏览器录制验证

### 不选择录制模式的原因
- 文件树UI交互是标准场景，可以通过AI生成准确的选择器和交互逻辑
- 已有`selector-resilience.md`知识库指导选择器最佳实践
- 已有`timing-debugging.md`知识库指导时序处理
- 录制模式更适合复杂的、难以预测的UI流程（如拖放、向导、多步骤状态）

## Step 3: Test Strategy

### 1. 映射验收标准为测试场景

#### AC-1: 初始文件树显示
- E2E: 用户打开IDE，文件树显示根目录内容（P0）
- E2E: 文件夹可以展开和折叠（P0）
- E2E: .gitignore规则被正确应用（P1）
- API: GET /api/v1/files/tree返回正确的文件树结构（P0）
- Component: FileTree组件正确渲染文件树（P1）
- Unit: 文件过滤逻辑正确应用.gitignore规则（P1）
- 边界场景: 空目录、深层嵌套目录、特殊字符文件名（P2）

#### AC-2: 实时刷新
- E2E: 外部创建文件，文件树3秒内刷新（P0）
- E2E: 外部修改文件，文件树3秒内刷新（P0）
- E2E: 外部删除文件，文件树3秒内刷新（P0）
- WebSocket: 文件变更事件正确推送（P0）
- API: WebSocket连接稳定性（P1）
- Unit: 文件监控逻辑正确触发刷新（P1）
- 边界场景: 大量文件变更、网络延迟（P2）

#### AC-3: 右键菜单操作
- E2E: 右键菜单显示正确选项（P0）
- E2E: 新建文件操作成功（P0）
- E2E: 新建文件夹操作成功（P0）
- E2E: 重命名操作成功（P0）
- E2E: 删除操作成功（P0）
- API: POST /api/v1/files/create创建文件/文件夹（P0）
- API: POST /api/v1/files/rename重命名（P0）
- API: DELETE /api/v1/files/delete删除（P0）
- Component: FileTreeContextMenu组件正确渲染和交互（P1）
- 边界场景: 重命名为已存在名称、删除非空文件夹（P1）

#### AC-4: 文件打开
- E2E: 单击文件，文件在编辑器中打开（P0）
- API: GET /api/v1/files/read返回文件内容（P0）
- Component: FileTreeNode组件正确处理点击事件（P1）
- 边界场景: 打开大文件、打开二进制文件（P2）

### 2. 选择测试级别

#### E2E测试（关键用户旅程）
- 文件树初始显示和展开/折叠
- 实时刷新（创建/修改/删除）
- 右键菜单操作（新建/重命名/删除）
- 文件打开

#### API测试（业务逻辑和服务契约）
- GET /api/v1/files/tree - 文件树结构
- POST /api/v1/files/create - 创建文件/文件夹
- POST /api/v1/files/rename - 重命名
- DELETE /api/v1/files/delete - 删除
- GET /api/v1/files/read - 读取文件内容
- WebSocket连接和事件推送

#### Component测试（UI行为）
- FileTree组件渲染
- FileTreeContextMenu组件交互
- FileTreeNode组件点击处理

#### Unit测试（纯函数和业务逻辑）
- 文件过滤逻辑（.gitignore）
- 文件监控逻辑触发
- 路径验证和清理

#### Integration测试（服务交互）
- WebSocket与文件系统监控集成
- 前端与后端API集成

### 3. 优先级分配

#### P0（关键路径，阻塞发布）
- E2E: 文件树初始显示和展开/折叠
- E2E: 实时刷新（创建/修改/删除）
- E2E: 右键菜单操作（新建/重命名/删除）
- E2E: 文件打开
- API: 所有文件系统API端点
- WebSocket: 文件变更事件推送

#### P1（重要功能，影响用户体验）
- E2E: .gitignore规则应用
- Component: FileTree、FileTreeContextMenu、FileTreeNode组件
- Unit: 文件过滤和监控逻辑
- WebSocket: 连接稳定性

#### P2（边界情况和异常处理）
- 空目录、深层嵌套、特殊字符文件名
- 大量文件变更、网络延迟
- 重命名冲突、删除非空文件夹
- 打开大文件、二进制文件

### 4. 红阶段要求确认

所有测试设计为**在实现前失败**：
- ✅ 测试将针对尚未实现的UI组件（FileTree、FileTreeContextMenu、FileTreeNode）
- ✅ 测试将使用尚未完全实现的API端点
- ✅ 测试将验证尚未实现的功能（实时刷新、右键菜单）
- ✅ 遵循TDD红-绿-重构循环

## Step 4C: Aggregate ATDD Test Generation Results

### TDD红阶段验证

**验证结果**: ✅ 通过
- 所有API测试使用`test.skip()`
- 所有E2E测试使用`test.skip()`
- 无占位符断言
- 所有测试标记为`expected_to_fail: true`

### 生成的测试文件

#### API测试
- **文件**: `tests/api/file-tree.spec.ts`
- **测试数量**: 19个
- **优先级覆盖**: P0: 8, P1: 8, P2: 3, P3: 0
- **验收标准覆盖**:
  - AC-1: 初始文件树显示 - GET /api/v1/files/tree
  - AC-3: 右键菜单操作 - POST /api/v1/files/create
  - AC-3: 右键菜单操作 - POST /api/v1/files/rename
  - AC-3: 右键菜单操作 - DELETE /api/v1/files/delete
  - AC-4: 文件打开 - GET /api/v1/files/read

#### E2E测试
- **文件**: `tests/e2e/file-tree.spec.ts`
- **测试数量**: 16个
- **优先级覆盖**: P0: 11, P1: 4, P2: 1, P3: 0
- **验收标准覆盖**:
  - AC-1: 初始文件树显示
  - AC-2: 实时刷新
  - AC-3: 右键菜单操作
  - AC-4: 文件打开

### Fixture基础设施

**已创建**: `tests/fixtures/test-data.ts`
- `testFileData` - 测试文件数据
- `testFolderData` - 测试文件夹数据
- `testWorkspacePath` - 测试工作区路径
- `createTestFile()` - 创建测试文件工厂函数
- `createTestFolder()` - 创建测试文件夹工厂函数

**需要的Fixture**（待实现）:
- `fileDataFactory` - 文件数据工厂
- `authFixture` - 认证夹具
- `fileTreeFixture` - 文件树夹具
- `contextMenuFixture` - 上下文菜单夹具
- `editorFixture` - 编辑器夹具

### 知识库片段使用

**API测试使用的片段**:
- `api-request` - API请求工具
- `data-factories` - 测试数据工厂
- `test-quality` - 测试质量标准
- `selector-resilience` - 选择器韧性
- `timing-debugging` - 时序调试

**E2E测试使用的片段**:
- `selector-resilience` - 选择器韧性
- `timing-debugging` - 时序调试
- `test-quality` - 测试质量标准
- `component-tdd` - 组件TDD循环

### 执行性能

**执行模式**: SEQUENTIAL (API → E2E)
**性能收益**: baseline (无并行加速)
**总测试数**: 35个（API: 19, E2E: 16）

### 实现指南

#### 需要实现的API端点
1. `GET /api/v1/files/tree` - 获取文件树结构
2. `POST /api/v1/files/create` - 创建文件/文件夹
3. `POST /api/v1/files/rename` - 重命名文件/文件夹
4. `DELETE /api/v1/files/delete` - 删除文件/文件夹
5. `GET /api/v1/files/read` - 读取文件内容

#### 需要实现的UI组件
1. `FileTree` - 文件树主组件
2. `FileTreeContextMenu` - 右键上下文菜单组件
3. `FileTreeNode` - 文件树节点组件
4. `Editor` - 编辑器组件（占位）

#### 需要实现的功能
1. 文件树初始显示和展开/折叠
2. 实时刷新（WebSocket文件变更通知）
3. 右键菜单操作（新建/重命名/删除）
4. 文件打开（在编辑器中显示）

### 下一步（任务激活）

在实现每个任务期间：

1. 从当前测试文件或场景中移除`test.skip()`
2. 运行测试: `npm test`
3. 验证激活的测试首先失败，然后在实现后通过（绿阶段）
4. 如果任何激活的测试仍然意外失败：
   - 要么修复实现（功能错误）
   - 要么修复测试（测试错误）
5. 提交通过的测试

### 验收标准覆盖总结

**AC-1: 初始文件树显示**
- ✅ API: GET /api/v1/files/tree (6个测试)
- ✅ E2E: 文件树显示和展开/折叠 (3个测试)

**AC-2: 实时刷新**
- ✅ E2E: 外部创建/修改/删除文件刷新 (3个测试)
- ⚠️ WebSocket: 文件变更事件推送（待实现）

**AC-3: 右键菜单操作**
- ✅ API: POST /api/v1/files/create (4个测试)
- ✅ API: POST /api/v1/files/rename (3个测试)
- ✅ API: DELETE /api/v1/files/delete (3个测试)
- ✅ E2E: 右键菜单和操作 (8个测试)

**AC-4: 文件打开**
- ✅ API: GET /api/v1/files/read (3个测试)
- ✅ E2E: 文件在编辑器中打开 (1个测试)

## Step 5: Validate & Complete

### 验证结果

**✅ 前置条件满足**
- Story文件已批准，状态为`ready-for-dev`
- Playwright测试框架已配置
- 开发环境可用（Deno已安装）

**✅ 测试文件正确创建**
- `tests/api/file-tree.spec.ts` - 19个API测试
- `tests/e2e/file-tree.spec.ts` - 16个E2E测试
- `tests/fixtures/test-data.ts` - 测试数据fixture

**✅ Checklist匹配验收标准**
- AC-1: 初始文件树显示（API + E2E）
- AC-2: 实时刷新（E2E）
- AC-3: 右键菜单操作（API + E2E）
- AC-4: 文件打开（API + E2E）

**✅ 测试生成为红阶段脚手架并标记为test.skip()**
- 所有API测试使用`test.skip()`
- 所有E2E测试使用`test.skip()`
- 无占位符断言
- 所有测试标记为`expected_to_fail: true`

**✅ Story元数据和交接路径已捕获**
- storyId: '1.1'
- storyKey: '1-1-file-tree'
- storyFile: 'implementation_artifacts/1-1-file-tree.md'
- atddChecklistPath: '_bmad-output/test-artifacts/atdd-checklist-1-1-file-tree.md'
- generatedTestFiles: ['tests/api/file-tree.spec.ts', 'tests/e2e/file-tree.spec.ts']

**✅ CLI会话已清理**
- 未使用CLI录制，无浏览器会话残留

**✅ 临时工件存储在正确位置**
- 临时工件存储在`_bmad-output/test-artifacts/`

### 输出优化

**✅ 文档质量检查**
- 无重复
- 术语一致
- 完整性检查通过
- 格式清理完成

### 完成摘要

**测试文件创建**:
- `tests/api/file-tree.spec.ts` - 19个API测试（红阶段）
- `tests/e2e/file-tree.spec.ts` - 16个E2E测试（红阶段）
- `tests/fixtures/test-data.ts` - 测试数据fixture

**Checklist输出路径**:
- `_bmad-output/test-artifacts/atdd-checklist-1-1-file-tree.md`

**Story key / story file交接路径**:
- Story Key: `1-1-file-tree`
- Story File: `implementation_artifacts/1-1-file-tree.md`

**关键风险或假设**:
- WebSocket文件变更事件推送需要实现（AC-2的完整覆盖）
- UI组件（FileTree、FileTreeContextMenu、FileTreeNode）尚未实现
- API端点需要实现以使测试通过

**下一步推荐工作流**:
- 使用`bmad-dev-story`工作流实现Story 1.1
- 在实现期间，逐个移除`test.skip()`并验证测试通过
- 实现完成后，使用`bmad-story-automator`自动化测试

### ATDD工作流完成

**✅ ATDD红阶段完成**
- 所有测试脚手架已生成
- 所有测试使用`test.skip()`标记
- 验收标准已完全覆盖
- 准备进入实现阶段