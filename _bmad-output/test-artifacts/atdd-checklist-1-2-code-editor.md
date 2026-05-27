---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-generation-mode', 'step-03-test-strategy', 'step-04c-aggregate', 'step-05-validate-and-complete']
lastStep: 'step-05-validate-and-complete'
lastSaved: '2026-05-26'
storyId: '1.2'
storyKey: '1-2-code-editor'
storyFile: 'implementation_artifacts/1-2-code-editor.md'
atddChecklistPath: '_bmad-output/test-artifacts/atdd-checklist-1-2-code-editor.md'
generatedTestFiles:
  - 'tests/api/code-editor.spec.ts'
  - 'tests/e2e/code-editor.spec.ts'
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
  - 'implementation_artifacts/1-2-code-editor.md'
  - 'playwright.config.ts'
  - '_bmad/tea/config.yaml'
---

# ATDD Checklist: Story 1.2 - 现代代码编辑器体验

## Step 1: Preflight & Context Loading

### 技术栈检测
- **检测到的栈**: fullstack
- **前端**: React 18+, TypeScript 5+, Vite 5+, Monaco Editor 0.45+
- **后端**: Deno 1.40+, Rust 1.75+
- **测试**: Playwright 1.44+

### 前置条件检查
- ✅ Story文件已创建，状态为`ready-for-dev`
- ✅ Playwright测试框架已配置
- ✅ 开发环境可用（Deno已安装）

### Story上下文
- **Story ID**: 1.2
- **Story Key**: 1-2-code-editor
- **Story File**: `implementation_artifacts/1-2-code-editor.md`
- **Story状态**: ready-for-dev
- **优先级**: P0
- **预估工作量**: 5-7 days

### 验收标准
1. **AC-1: 代码编辑器初始化**
   - Given 用户打开IDE
   - When 进入编辑器页面
   - Then 编辑器显示空白文档
   - And 支持语法高亮
   - And 显示行号

2. **AC-2: 文件打开与编辑**
   - Given 文件树中存在一个文件
   - When 用户点击文件
   - Then 文件内容加载到编辑器中
   - And 用户可以编辑文件内容
   - And 编辑后文件标记为已修改

3. **AC-3: 代码语法高亮**
   - Given 用户打开一个代码文件
   - When 文件加载完成
   - Then 代码根据语言类型显示语法高亮
   - And 支持常见编程语言

4. **AC-4: 代码格式化**
   - Given 用户编辑代码后
   - When 用户触发格式化命令（Ctrl+Shift+F）
   - Then 代码自动格式化
   - And 保持正确的缩进和换行

5. **AC-5: 代码折叠**
   - Given 文件包含多层代码块
   - When 用户点击折叠图标
   - Then 代码块折叠/展开
   - And 支持函数、类、条件语句的折叠

6. **AC-6: 行操作**
   - Given 用户在编辑器中
   - When 用户选择一行或多行
   - Then 支持复制、剪切、删除操作
   - And 支持多行编辑（列选择模式）

### 技术架构
- **前端层 (React + Monaco Editor)**: 实现代码编辑器组件
- **后端层 (Deno)**: 提供文件系统API
- **核心层 (Rust)**: 处理实际文件系统操作

### API规范
- `GET /api/v1/files/read` - 读取文件内容
- `POST /api/v1/files/write` - 写入文件内容
- `POST /api/v1/files/format` - 格式化代码
- `GET /api/v1/languages` - 获取支持的语言列表

## Step 2: Generation Mode Selection

### 选择的模式
**AI Generation**

### 选择理由
1. ✅ 验收标准清晰明确（BDD格式）
2. ✅ 场景是标准的代码编辑器交互模式
3. ✅ API规范已定义
4. ✅ 现有测试文件提供了测试模式参考
5. ✅ 代码编辑器是常见的IDE功能

## Step 3: Test Strategy

### 1. 映射验收标准为测试场景

#### AC-1: 代码编辑器初始化
- E2E: 编辑器显示空白文档（P0）
- E2E: 显示行号（P1）

#### AC-2: 文件打开与编辑
- E2E: 点击文件在编辑器中打开（P0）
- E2E: 编辑文件内容（P0）
- E2E: 标记为已修改（P0）
- API: GET /api/v1/files/read读取文件（P0）
- API: POST /api/v1/files/write写入文件（P0）

#### AC-3: 代码语法高亮
- E2E: JavaScript语法高亮（P0）
- E2E: TypeScript语法高亮（P0）
- E2E: Python语法高亮（P1）
- API: GET /api/v1/languages获取支持语言（P1）

#### AC-4: 代码格式化
- E2E: Ctrl+Shift+F格式化（P0）
- E2E: 右键菜单格式化（P0）
- API: POST /api/v1/files/format格式化代码（P0）

#### AC-5: 代码折叠
- E2E: 折叠代码块（P1）
- E2E: 展开代码块（P1）

#### AC-6: 行操作
- E2E: 行选择（P1）
- E2E: 列选择/多行编辑（P1）

### 2. 选择测试级别

#### E2E测试
- 编辑器初始化和显示
- 文件打开和编辑
- 语法高亮
- 代码格式化
- 代码折叠
- 行操作

#### API测试
- GET /api/v1/files/read
- POST /api/v1/files/write
- POST /api/v1/files/format
- GET /api/v1/languages

### 3. 优先级分配

#### P0（关键路径）
- E2E: 编辑器初始化
- E2E: 文件打开和编辑
- E2E: 语法高亮（JS/TS）
- E2E: 代码格式化
- API: 所有文件系统API端点

#### P1（重要功能）
- E2E: 行号显示
- E2E: 代码折叠
- E2E: 行操作
- API: 语言列表

#### P2（边界情况）
- 大文件处理
- 编码指示
- 行尾指示

## Step 4C: Aggregate ATDD Test Generation Results

### TDD红阶段验证

**验证结果**: ✅ 通过
- 所有API测试使用`test.skip()`
- 所有E2E测试使用`test.skip()`
- 无占位符断言
- 所有测试标记为`expected_to_fail: true`

### 生成的测试文件

#### API测试
- **文件**: `tests/api/code-editor.spec.ts`
- **测试数量**: 15个
- **优先级覆盖**: P0: 8, P1: 5, P2: 2

#### E2E测试
- **文件**: `tests/e2e/code-editor.spec.ts`
- **测试数量**: 16个
- **优先级覆盖**: P0: 8, P1: 6, P2: 2

### Fixture基础设施

**已创建**: `tests/fixtures/code-editor-data.ts`
- 测试文件数据
- 支持的语言列表
- 工厂函数

## Step 5: Validate & Complete

### 验证结果

**✅ 前置条件满足**
**✅ 测试文件正确创建**
**✅ Checklist匹配验收标准**
**✅ 测试生成为红阶段脚手架**
**✅ Story元数据和交接路径已捕获**

### 完成摘要

**测试文件创建**:
- `tests/api/code-editor.spec.ts` - 15个API测试（红阶段）
- `tests/e2e/code-editor.spec.ts` - 16个E2E测试（红阶段）
- `tests/fixtures/code-editor-data.ts` - 测试数据fixture

**Checklist输出路径**:
- `_bmad-output/test-artifacts/atdd-checklist-1-2-code-editor.md`

**Story key / story file交接路径**:
- Story Key: `1-2-code-editor`
- Story File: `implementation_artifacts/1-2-code-editor.md`

### ATDD工作流完成

**✅ ATDD红阶段完成**
- 所有测试脚手架已生成
- 所有测试使用`test.skip()`标记
- 验收标准已完全覆盖
- 准备进入实现阶段