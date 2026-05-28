# 测试覆盖文档

## 概述

本文档记录项目的测试覆盖情况和自动化测试策略。

## 测试类型

### 单元测试 (Unit Tests)
- 测试独立的函数和组件
- 运行速度快
- 覆盖核心业务逻辑

### API测试 (API Tests)
- 测试后端API端点
- 验证接口响应和数据格式

### 端到端测试 (E2E Tests)
- 测试完整的用户流程
- 模拟真实用户交互

## 测试文件结构

```
tests/
├── unit/                    # 单元测试
│   ├── formatting.test.ts   # 代码格式化测试
│   ├── fileService.test.ts  # 文件服务测试
│   └── gitUtils.test.ts     # Git工具函数测试
├── api/                     # API测试
│   ├── git.spec.ts          # Git API测试
│   ├── terminal.spec.ts     # 终端API测试
│   ├── file-tree.spec.ts    # 文件树API测试
│   └── code-editor.spec.ts  # 代码编辑器API测试
├── e2e/                     # 端到端测试
│   ├── git.spec.ts          # Git可视化E2E测试
│   ├── terminal.spec.ts     # 终端E2E测试
│   ├── file-tree.spec.ts    # 文件树E2E测试
│   ├── code-editor.spec.ts  # 代码编辑器E2E测试
│   ├── websocket.test.ts    # WebSocket测试
│   ├── security.test.ts     # 安全性测试
│   └── file-api.test.ts     # 文件API测试
```

## 前端测试结构

```
frontend/
├── src/
│   └── test/
│       └── setup.ts         # 测试设置和Mock配置
├── vitest.config.ts         # Vitest配置
└── src/components/
    └── Editor/
        └── CodeEditor.test.tsx  # 代码编辑器组件测试
```

## 后端测试结构

```
backend/
└── tests/
    └── gitService.test.ts   # Git服务单元测试
```

## 测试覆盖矩阵

### Story 1-1: 文件树浏览与管理

| 功能 | 单元测试 | API测试 | E2E测试 |
|------|---------|---------|---------|
| 文件列表获取 | ✅ | ✅ | ✅ |
| 文件树渲染 | ✅ | - | ✅ |
| 路径验证 | ✅ | ✅ | ✅ |
| 忽略文件过滤 | ✅ | ✅ | - |

### Story 1-2: 现代代码编辑器体验

| 功能 | 单元测试 | API测试 | E2E测试 |
|------|---------|---------|---------|
| 编辑器初始化 | ✅ | ✅ | ✅ |
| 代码格式化 | ✅ | ✅ | ✅ |
| 语法高亮 | - | - | ✅ |
| 行号显示 | - | - | ✅ |

### Story 1-3: 内置终端

| 功能 | 单元测试 | API测试 | E2E测试 |
|------|---------|---------|---------|
| 终端连接 | - | ✅ | ✅ |
| 命令执行 | - | ✅ | ✅ |
| 输出显示 | - | - | ✅ |

### Story 2-1: Git版本控制可视化

| 功能 | 单元测试 | API测试 | E2E测试 |
|------|---------|---------|---------|
| Git状态获取 | ✅ | ✅ | ✅ |
| Diff解析 | ✅ | ✅ | ✅ |
| 分支管理 | - | ✅ | ✅ |
| 代码提交 | - | ✅ | ✅ |
| 行级差异指示 | ✅ | - | ✅ |
| WebSocket实时更新 | - | ✅ | ✅ |

### 安全性测试

| 测试项 | 状态 |
|--------|------|
| 路径遍历攻击防护 | ✅ |
| 命令注入防护 | ✅ |
| 输入验证 | ✅ |
| WebSocket安全 | ✅ |

## 测试运行命令

### 前端测试

```bash
cd frontend
npm install
npm test          # 运行所有测试
npm run test:watch # 监听模式
npm run test:coverage # 覆盖率报告
```

### 后端测试 (Deno)

```bash
cd backend
deno test --allow-all
```

### E2E测试 (Playwright)

```bash
npm run e2e
```

## 测试覆盖率目标

| 模块 | 目标覆盖率 | 当前状态 |
|------|-----------|---------|
| 后端服务 | 80% | ⏳ |
| 前端组件 | 70% | ⏳ |
| API端点 | 90% | ✅ |
| 安全功能 | 100% | ✅ |

## 持续集成

测试集成到CI流程：
- 代码提交时自动运行单元测试
- Pull Request时运行完整测试套件
- 部署前运行E2E测试

## 测试维护

### 测试命名规范

- 单元测试文件：`*.test.ts`
- API测试文件：`*.spec.ts`
- E2E测试文件：`*.spec.ts` (在 e2e/ 目录下)

### 测试注释规范

每个测试文件应包含：
- Story引用
- 功能描述
- 验收标准引用

### 测试数据管理

- 使用Mock数据进行单元测试
- 使用测试数据库进行集成测试
- 测试后清理测试数据