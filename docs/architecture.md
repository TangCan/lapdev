# Lapdev 架构文档

## 1. 项目概述

### 1.1 产品定位
**Lapdev** 是一个完全开源（MIT协议）、免费、高性能的 Web IDE，运行在 Linux 服务器上，通过浏览器访问。它不基于 VS Code，拥有独立技术栈，并原生支持第三方大语言模型及敏捷开发工作流。

### 1.2 核心价值主张
| 价值点 | 描述 |
|--------|------|
| **自主可控** | 用户完全掌控自己的开发环境和数据 |
| **免费开源** | 零付费功能墙，代码完全公开 |
| **BYOK模式** | 支持自带API密钥，自由选择LLM |
| **敏捷集成** | 内置BMAD敏捷方法论，提升开发效率 |
| **国内适配** | 完美适配国内网络环境 |

---

## 2. 技术栈

| 层级 | 技术 | 版本 | 职责 |
|------|------|------|------|
| **前端** | React 18 + TypeScript + Vite | React 18.2.0 / TS 5.5.0 / Vite 6.0.0 | Web UI 和代码编辑器 |
| **样式** | Tailwind CSS | 4.3.2 | 样式框架 |
| **编辑器** | Monaco Editor | 0.55.1 | 代码编辑核心 |
| **终端** | xterm.js | 5.5.0 | 终端渲染 |
| **后端** | Deno | - | HTTP/WS 服务、会话管理 |
| **测试** | Vitest / Playwright | 2.0.5 / 1.44.0 | 单元测试和 E2E 测试 |

---

## 3. 项目结构

### 3.1 实际项目目录结构

```
lapdev/
├── README.md                    # 项目说明文档
├── LICENSE                      # MIT 许可证
├── .gitignore                   # Git 忽略配置
├── package.json                 # 项目配置
├── playwright.config.ts         # Playwright 测试配置
├── Dockerfile                   # Docker 镜像构建配置
├── scripts/                     # 部署和构建脚本
│   ├── release.sh               # 发布脚本
│   └── start.sh                 # 启动脚本
├── implementation_artifacts/    # 实施文档
│   ├── closure-report.md        # 结项报告
│   └── epics/                   # Epic 文档
├── docs/                        # 技术文档
│   ├── architecture.md          # 架构文档
│   ├── api-spec.md              # API 规范
│   └── contributing.md          # 贡献指南
├── frontend/                    # React 前端应用
│   ├── package.json
│   ├── vite.config.ts           # Vite 配置
│   ├── tsconfig.json
│   ├── tailwind.config.js       # Tailwind CSS 配置
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx             # 应用入口
│   │   ├── App.tsx              # 根组件
│   │   ├── index.css            # 全局样式和主题变量
│   │   ├── components/          # UI 组件
│   │   │   ├── Layout/          # 布局组件（Header、Sidebar）
│   │   │   ├── Editor/          # 编辑器组件（CodeEditor、FileTree）
│   │   │   ├── Terminal/        # 终端组件（Terminal、TerminalTabs）
│   │   │   ├── AI/              # AI 功能组件（AIChat、InlineCompletion）
│   │   │   ├── Settings/        # 设置组件（ThemeSettings、LanguageSelector）
│   │   │   ├── Performance/     # 性能监控组件（PerformancePanel）
│   │   │   └── Common/          # 通用组件
│   │   ├── hooks/               # 自定义 Hooks
│   │   │   ├── usePerformanceMonitor.ts
│   │   │   └── usePerformanceTimer.ts
│   │   ├── services/            # 服务层
│   │   │   ├── performanceService.ts
│   │   │   ├── agentService.ts
│   │   │   └── skillService.ts
│   │   ├── theme/               # 主题系统
│   │   │   ├── themeConfig.ts
│   │   │   └── ThemeContext.tsx
│   │   ├── i18n/                # 国际化配置
│   │   ├── types/               # TypeScript 类型定义
│   │   └── utils/               # 工具函数
│   ├── tests/                   # 单元测试
│   └── public/                  # 静态资源
├── backend/                     # Deno 后端服务
│   ├── src/                     # 后端源代码
│   └── tests/                   # 后端测试
└── tests/                       # E2E 测试
    ├── e2e/                     # 端到端测试
    └── utils/                   # 测试工具函数
```

### 3.2 架构边界

| 模块 | 职责 | 边界 |
|------|------|------|
| **前端** | UI 渲染、用户交互、状态管理 | 浏览器环境 |
| **后端** | API 服务、WebSocket 管理、文件操作 | Deno 运行时 |
| **前端 ↔ 后端** | HTTP/WebSocket 通信 | REST API + WebSocket |

---

## 4. 核心架构决策

### 4.1 数据架构

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 用户配置存储 | localStorage | 轻量级、无需额外依赖、部署简单 |
| 工作区状态 | 内存 + 定时持久化 | 实时性要求高，重启后可恢复 |
| AI 会话历史 | 本地文件存储 | 便于迁移和备份，符合隐私要求 |
| 临时缓存 | 内存 LRU | 终端输出、LSP 响应等短期数据 |

### 4.2 认证与安全

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 认证方式 | 无认证（单用户）+ API Key 保护 | 简化部署，初期用户体验好 |
| 授权模式 | 工作区隔离 + 操作白名单 | 限制危险操作 |
| 传输安全 | TLS 1.3 + WebSocket 加密 | 强制加密传输 |
| API Key 管理 | BYOK 模式，仅内存存储 | 用户自主管理密钥，不持久化 |

### 4.3 API 与通信模式

| 决策项 | 选择 | 理由 |
|--------|------|------|
| API 风格 | REST + WebSocket 混合 | REST 用于配置/操作，WebSocket 用于实时 |
| 实时通信 | WebSocket + xterm.js | 终端和 LSP 实时交互 |
| 错误处理 | HTTP 状态码 + JSON 错误对象 | 标准化错误响应 |
| 限流策略 | 基于会话的速率限制 | 防止资源滥用 |

### 4.4 前端架构

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 状态管理 | React Context + localStorage | 轻量级状态管理，配置持久化 |
| 组件架构 | 按功能组织 | 清晰的组件层级 |
| 路由策略 | React Router | 单页应用路由 |
| 性能优化 | Code Splitting + Lazy Loading | 按需加载，减少首屏时间 |

### 4.5 基础设施与部署

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 容器化 | Podman 优先，兼容 Docker | Podman 无守护进程更安全 |
| CI/CD | GitHub Actions | 自动化测试和部署 |
| 监控日志 | Deno 内置日志 + 结构化输出 | 便于问题排查 |
| 配置管理 | 环境变量 + 配置文件 | 灵活配置 |

---

## 5. 实现模式与一致性规则

### 5.1 命名模式

| 类型 | 规则 | 示例 |
|------|------|------|
| 组件 | PascalCase | `CodeEditor.tsx` |
| 文件 | kebab-case | `code-editor.tsx` |
| 函数/变量 | camelCase | `getUserData`, `userName` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| REST 端点 | kebab-case | `/api/user-preferences` |
| JSON 字段 | camelCase | `userId`, `createdAt` |

### 5.2 API 响应格式

```json
// 成功响应
{
  "status": "success",
  "data": { /* payload */ },
  "timestamp": "2024-01-01T12:00:00Z"
}

// 错误响应
{
  "status": "error",
  "error": {
    "code": "ENOENT",
    "message": "File not found",
    "details": {}
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### 5.3 错误处理

- **全局错误边界**：React Error Boundary 捕获组件错误
- **错误日志**：统一记录到控制台和服务端
- **用户提示**：友好的错误消息，隐藏技术细节

---

## 6. 核心服务说明

### 6.1 PerformanceService

性能监控服务，提供以下功能：
- FPS（帧率）监控
- CPU 使用率估算
- 内存使用监控
- 网络请求监控
- 长任务监控
- 组件渲染时间记录

### 6.2 AgentService

Agent 服务层，处理：
- 文件读取/写入
- 目录列表
- 代码搜索
- 操作日志管理

### 6.3 SkillService

Skill 服务层，管理：
- Skill 文件解析（YAML 元数据 + Markdown 内容）
- 路径安全验证
- 全局和项目级 Skill 加载
- 基于关键词和正则表达式的 Skill 匹配

---

## 7. 架构验证

### 7.1 可行性评估

| 技术项 | 可行性 | 风险等级 |
|--------|--------|----------|
| Monaco Editor | ✅ 高 | 低 |
| WebSocket 终端 | ✅ 高 | 低 |
| Podman 部署 | ✅ 高 | 低 |
| AI 集成 | ✅ 高 | 中 |
| 性能监控 | ✅ 高 | 低 |

### 7.2 关键技术风险

| 风险项 | 风险等级 | 缓解措施 |
|--------|----------|----------|
| WebSocket 连接稳定性 | 中 | 实现心跳和重连机制 |
| LSP 进程管理 | 中 | 实现进程池和超时管理 |
| 测试不稳定性 | 中 | 添加重试机制和安全操作函数 |

### 7.3 性能目标

| 操作 | 目标响应时间 |
|------|------------|
| 文件打开 | < 100ms |
| 代码补全（LSP） | < 200ms |
| 终端输入响应 | < 50ms |
| AI 响应 | < 2s（取决于模型） |

---

## 8. 决策记录

| 决策编号 | 决策内容 | 状态 |
|----------|----------|------|
| ADDR-001 | 采用 React + Deno 架构 | ✅ 已确认 |
| ADDR-002 | 使用 localStorage 存储用户配置 | ✅ 已确认 |
| ADDR-003 | 采用无认证 + API Key 保护模式 | ✅ 已确认 |
| ADDR-004 | 使用 REST + WebSocket 混合 API | ✅ 已确认 |
| ADDR-005 | 使用 Vite + React Router 前端架构 | ✅ 已确认 |
| ADDR-006 | 使用 Podman 优先的容器化部署 | ✅ 已确认 |