# Lapdev

> Open-source Web IDE with AI integration - 开源的 AI 集成 Web 开发环境

[![Build Status](https://github.com/lapdev-io/lapdev/actions/workflows/build.yml/badge.svg)](https://github.com/lapdev-io/lapdev/actions/workflows/build.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/github/v/release/lapdev-io/lapdev)](https://github.com/lapdev-io/lapdev/releases)

Lapdev 是一款现代化的开源 Web IDE，集成了 AI 智能辅助功能，提供高效的代码开发体验。

---

## 🚀 功能特性

### 基础 IDE 功能
- **文件树管理**: 支持文件/文件夹的创建、删除、重命名和浏览
- **代码编辑器**: 基于 Monaco Editor，支持语法高亮、代码折叠、括号匹配
- **内置终端**: 支持多标签页终端，可执行系统命令
- **Git 版本控制**: 可视化的 Git 操作界面

### AI 智能功能
- **AI 聊天面板**: 与 AI 助手对话，获取代码建议和问题解答
- **内联代码补全**: 智能代码补全，提升编码效率
- **Agent 模式**: AI Agent 可以读取和修改项目文件
- **模型配置**: 支持多种 AI 模型（OpenAI、DeepSeek、Anthropic）

### 扩展功能
- **Skill 系统**: 可扩展的技能插件系统，支持自定义技能开发
- **主题系统**: 支持 5 种主题（深色、浅色、高对比度、Solarized），支持跟随系统主题
- **国际化**: 支持中文/English 双语切换
- **性能监控**: 实时监控 FPS、CPU、内存等性能指标

### 部署特性
- **容器化部署**: 支持 Docker 和 Podman
- **多平台支持**: Linux/amd64, Linux/arm64
- **离线降级**: 支持离线环境下的功能降级

---

## 🛠️ 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| **前端框架** | React | 18.2.0 |
| **前端语言** | TypeScript | 5.5.0 |
| **构建工具** | Vite | 6.0.0 |
| **样式框架** | Tailwind CSS | 4.3.2 |
| **代码编辑器** | Monaco Editor | 0.55.1 |
| **终端组件** | xterm.js | 5.5.0 |
| **后端语言** | Deno | - |
| **测试框架** | Vitest / Playwright | 2.0.5 / 1.44.0 |

---

## 📦 快速开始

### 环境要求

- Node.js >= 20.x
- Deno >= 1.42.0
- Docker / Podman（可选，用于容器部署）

### 开发环境

```bash
# 克隆项目
git clone https://github.com/lapdev-io/lapdev.git
cd lapdev

# 安装前端依赖
cd frontend
npm install

# 返回项目根目录
cd ..

# 启动开发服务器
npm run dev

# 访问地址: http://localhost:5173
```

### 构建生产版本

```bash
# 构建前端
cd frontend
npm run build

# 返回项目根目录
cd ..

# 启动生产服务器
npm run start
```

---

## 🐳 容器部署

### 使用 Docker

```bash
# 拉取镜像
docker pull registry.gitee.com/lapdev/lapdev:latest

# 运行容器
docker run -d -p 8080:8080 -p 3333:3333 \
  -v $(pwd)/workspace:/workspace \
  registry.gitee.com/lapdev/lapdev:latest
```

### 使用 Podman

```bash
# 拉取镜像
podman pull registry.gitee.com/lapdev/lapdev:latest

# 运行容器
podman run -d -p 8080:8080 -p 3333:3333 \
  -v $(pwd)/workspace:/workspace \
  registry.gitee.com/lapdev/lapdev:latest
```

### 本地构建镜像

```bash
# 使用发布脚本构建
./scripts/release.sh

# 运行本地构建的镜像
podman run -d --rm --name lapdev \
  -p 3333:3333 \
  -v $(pwd)/workspace:/workspace \
  localhost/lapdev:latest
```

---

## ⚙️ 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `production` |
| `WORKSPACE_PATH` | 工作区路径 | `/workspace` |
| `PORT` | HTTP 端口 | `8080` |
| `DENO_PORT` | Deno 端口 | `3333` |
| `OPENAI_API_KEY` | OpenAI API 密钥 | - |
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | - |
| `ANTHROPIC_API_KEY` | Anthropic API 密钥 | - |

### AI 配置

在设置页面中配置 AI 模型：

1. 点击右上角设置图标
2. 选择 AI 配置选项
3. 输入 API 密钥
4. 选择默认模型

---

## 📖 使用指南

### 文件管理

- **创建文件**: 右键点击文件树，选择"新建文件"
- **创建文件夹**: 右键点击文件树，选择"新建文件夹"
- **重命名**: 右键点击文件，选择"重命名"
- **删除**: 右键点击文件，选择"删除"

### 代码编辑

- **快捷键**: 支持常用的代码编辑快捷键（Ctrl+S 保存、Ctrl+Z 撤销等）
- **语法高亮**: 支持多种编程语言
- **代码格式化**: 右键选择"格式化文档"

### 终端操作

- **打开终端**: 点击底部终端按钮
- **新建标签页**: 点击终端面板的"+"按钮
- **关闭标签页**: 点击标签页右侧的"×"按钮
- **切换标签页**: 点击标签页名称

### AI 功能

- **打开 AI 聊天**: 点击左侧面板的 AI 图标
- **内联补全**: 在编辑器中自动触发，按 Tab 接受建议
- **Agent 模式**: 在 AI 聊天中使用 `/agent` 命令

---

## 👨‍💻 开发指南

### 项目结构

```
lapdev/
├── frontend/              # 前端应用
│   ├── src/              # 源代码
│   │   ├── components/   # React 组件
│   │   ├── services/     # 服务层
│   │   ├── hooks/        # 自定义 Hooks
│   │   ├── types/        # TypeScript 类型定义
│   │   ├── theme/        # 主题配置
│   │   └── utils/        # 工具函数
│   ├── tests/            # 测试文件
│   └── package.json      # 前端依赖配置
├── backend/              # 后端服务
│   └── src/              # 后端源代码
├── docs/                 # 项目文档
├── scripts/              # 脚本文件
├── implementation_artifacts/  # 实施文档
└── package.json          # 项目配置
```

### 代码规范

- **TypeScript**: 使用严格模式，所有类型必须明确
- **ESLint**: 遵循项目的 ESLint 规则
- **Prettier**: 使用 Prettier 格式化代码
- **JSDoc**: 核心函数和类需要添加 JSDoc 注释

### 添加新功能

1. 创建新组件或服务文件
2. 添加对应的单元测试
3. 确保 TypeScript 和 ESLint 检查通过
4. 提交代码

---

## 🧪 测试说明

### 运行测试

```bash
# 运行快速测试（单元测试）
npm run test:quick

# 运行回归测试（包含 E2E 测试）
npm run test:regression

# 运行所有测试
npm run test

# 运行前端单元测试
cd frontend && npm test
```

### 测试类型

- **单元测试**: 使用 Vitest 测试组件和函数
- **集成测试**: 测试 API 和服务的集成
- **E2E 测试**: 使用 Playwright 测试完整的用户流程

---

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支：`git checkout -b feature/your-feature`
3. 提交代码：`git commit -m "feat: add your feature"`
4. 推送分支：`git push origin feature/your-feature`
5. 创建 Pull Request

### 提交规范

- `feat`: 新功能
- `fix`: 修复 Bug
- `docs`: 更新文档
- `perf`: 性能优化
- `refactor`: 代码重构
- `test`: 添加测试

---

## 📜 许可证

MIT License - 详见 [LICENSE](LICENSE)

---

## 📞 联系方式

- **GitHub**: [https://github.com/lapdev-io/lapdev](https://github.com/lapdev-io/lapdev)
- **Gitee**: [https://gitee.com/lapdev/lapdev](https://gitee.com/lapdev/lapdev)

---

**Lapdev - 让开发更智能**