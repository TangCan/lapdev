---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-generation-mode', 'step-03-test-strategy', 'step-04-generate-tests']
lastStep: 'step-04-generate-tests'
lastSaved: '2026-05-26'
storyId: '1.1'
storyKey: '1-1-file-tree'
storyFile: 'implementation_artifacts/1-1-file-tree.md'
atddChecklistPath: 'tests/e2e/atdd-checklist-1-1-file-tree.md'
generatedTestFiles:
  - 'tests/e2e/file-tree.test.ts'
  - 'tests/e2e/file-api.test.ts'
inputDocuments:
  - 'implementation_artifacts/1-1-file-tree.md'
  - 'docs/prd.md'
  - 'docs/architecture.md'
  - 'docs/api-spec.md'
---

# ATDD Checklist: Story 1.1 - 文件树浏览与管理

## 📋 验收标准映射

| 验收标准 | 测试级别 | 优先级 | 测试文件 |
|----------|----------|--------|----------|
| AC-1: 初始文件树显示 | E2E | P0 | file-tree.test.ts |
| AC-2: 实时刷新 | E2E | P0 | file-tree.test.ts |
| AC-3: 右键菜单操作 | E2E | P0 | file-tree.test.ts |
| AC-4: 文件打开 | E2E | P0 | file-tree.test.ts |
| API: 获取文件树 | API | P1 | file-api.test.ts |
| API: 创建文件/目录 | API | P1 | file-api.test.ts |
| API: 读取文件 | API | P1 | file-api.test.ts |
| API: 重命名 | API | P1 | file-api.test.ts |
| API: 删除 | API | P1 | file-api.test.ts |
| 安全: 路径遍历防护 | API | P0 | file-api.test.ts |

## 🔴 TDD Red Phase Status

- ✅ 所有测试使用 `test.skip()` 标记
- ✅ 测试断言预期行为
- ✅ 测试会在实现前失败

## 📝 生成的测试文件

### E2E测试 (`tests/e2e/file-tree.test.ts`)
1. `should display file tree on workspace load` - 验证初始文件树显示
2. `should auto-refresh file tree when files change externally` - 验证实时刷新
3. `should show context menu and create new file` - 验证新建文件功能
4. `should rename file via context menu` - 验证重命名功能
5. `should delete file via context menu` - 验证删除功能
6. `should open file in editor when clicked` - 验证文件打开
7. `should expand and collapse folders` - 验证文件夹展开/折叠

### API测试 (`tests/e2e/file-api.test.ts`)
1. `GET /api/v1/files/tree should return directory structure` - 获取文件树
2. `GET /api/v1/files/tree with depth parameter` - 带深度参数
3. `GET /api/v1/files/read should return file content` - 读取文件
4. `POST /api/v1/files/create should create new file` - 创建文件
5. `POST /api/v1/files/create should create new directory` - 创建目录
6. `POST /api/v1/files/rename should rename file` - 重命名
7. `DELETE /api/v1/files/delete should delete file` - 删除文件
8. `GET /api/v1/files/read should return error for non-existent file` - 错误处理
9. `should prevent path traversal attacks` - 安全防护

## 🎯 测试优先级矩阵

| 优先级 | 测试数量 | 说明 |
|--------|----------|------|
| P0 | 3 | 核心用户旅程、安全 |
| P1 | 6 | API功能、边界条件 |
| P2 | 3 | 次要功能、UI细节 |

## 🔧 技术栈检测

- **检测类型**: fullstack
- **测试框架**: Playwright 1.44.x
- **配置文件**: `playwright.config.ts` ✅

## 🚀 下一步

1. 运行 `npm run test:e2e` 验证测试框架配置
2. 开始实现 Story 1.1（Rust核心层 → Deno后端 → React前端）
3. 实现完成后移除 `test.skip()` 标记
4. 运行测试验证实现正确性