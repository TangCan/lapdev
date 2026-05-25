---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - docs/prd.md
  - docs/001_需求.md
  - docs/002_requirements.md
  - docs/003_design.md
workflowType: 'architecture'
project_name: 'Lapdev'
user_name: 'Developer'
date: '2026-05-25'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

---

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

## 2. 项目上下文分析

### 2.1 需求概述

**功能需求分析：**
根据 PRD 和用户故事文档，Lapdev 包含 **36 条功能需求**，分为 5 大模块：

| 模块 | 需求数量 | 核心功能 |
|------|----------|----------|
| 核心 IDE | 14 | 文件树、编辑器、终端、Git、LSP |
| AI 功能 | 10 | 模型配置、聊天、补全、Agent模式 |
| Skill 系统 | 4 | 加载、匹配、市场安装 |
| BMAD 支持 | 4 | 在线安装、离线降级 |
| 部署适配 | 4 | Podman、国内镜像、代码托管 |

### 2.2 非功能需求

| 类型 | 需求 | 目标值 |
|------|------|--------|
| **性能** | 服务器启动时间 | < 2秒 |
| **性能** | 终端响应延迟 | < 50ms |
| **性能** | 系统可用性 | > 99.9% |
| **安全** | API Key 存储 | 仅内存存储 |
| **安全** | 传输加密 | TLS 1.3 |
| **可部署** | 容器支持 | Podman/Docker |

### 2.3 技术约束与依赖

| 约束类型 | 内容 |
|----------|------|
| **技术栈** | Rust + Deno + React（不基于VS Code） |
| **语言支持** | 第一阶段支持 Rust & TypeScript (LSP) |
| **AI 模型** | BYOK模式（OpenAI/DeepSeek/自定义） |
| **部署** | Podman 优先，兼容 Docker |
| **代码托管** | Gitee 主站 + GitHub 镜像 |

### 2.4 项目规模评估

**复杂度等级：** **高**

**主要原因：**
1. **跨语言架构**：Rust（核心）+ Deno（网关）+ React（前端）三层架构，通过 FFI 通信
2. **实时特性需求**：WebSocket 终端、LSP 智能提示、AI 流式回复
3. **安全要求严格**：API Key 保护、Agent 操作授权、工作区隔离
4. **离线降级能力**：需支持无网络环境下的 BMAD 工作流

**核心技术领域：** 全栈 Web IDE（前端 + 后端 + 系统级服务）

### 2.5 跨领域关注点

| 关注点 | 影响范围 |
|--------|----------|
| **实时通信** | 终端、LSP、AI 流式回复 |
| **安全** | API Key 管理、文件操作授权、工作区隔离 |
| **性能** | 大文件编辑、终端响应、LSP 延迟 |
| **扩展性** | Skill 系统、多模型支持、未来插件系统 |
| **国内适配** | 镜像源、代码托管、网络链路 |

---

## 3. 启动模板评估

### 3.1 主要技术领域

根据项目需求分析，Lapdev 采用**自定义三层架构**：

| 层级 | 技术栈 | 职责 |
|------|--------|------|
| **前端** | React 18 + TypeScript + Vite | Web UI 和代码编辑器 |
| **后端网关** | Deno 1.40+ + TypeScript | HTTP/WS 服务、会话管理 |
| **核心服务** | Rust 1.75+（FFI） | 文件系统、LSP、PTY 终端 |

### 3.2 项目结构

```
lapdev/
├── lapdev-web/          # React 前端应用
│   ├── src/
│   │   ├── components/  # UI 组件
│   │   ├── hooks/       # 自定义 hooks
│   │   └── services/    # API 服务
│   └── package.json
├── lapdev-server/       # Deno 后端网关
│   ├── src/
│   │   ├── handlers/    # HTTP 处理器
│   │   ├── ws/          # WebSocket 管理
│   │   └── ffi/         # Rust FFI 调用
│   └── deno.json
├── lapdev-core/         # Rust 核心库
│   ├── src/
│   │   ├── fs/          # 文件系统服务
│   │   ├── lsp/         # LSP 管理
│   │   └── pty/         # 终端 PTY
│   └── Cargo.toml
└── scripts/             # 部署脚本
    └── setup_podman.sh
```

### 3.3 初始化命令

```bash
# 创建项目目录结构
mkdir -p lapdev/{lapdev-web,lapdev-server,lapdev-core,scripts}

# 初始化 Rust 核心库
cd lapdev/lapdev-core
cargo init --lib

# 初始化 Deno 后端
cd ../lapdev-server
deno init

# 初始化 React 前端
cd ../lapdev-web
npm create vite@6.5.0 . -- --template react-ts
```

### 3.4 FFI 契约管理方案

**决策：**

| 方案 | 适用场景 | 选择 |
|------|----------|------|
| **deno_bindgen** | 基础函数调用 | ✅ 采用 |
| **Protobuf** | 复杂数据结构 | ✅ 采用 |
| **运行时版本检查** | 兼容性保障 | ✅ 采用 |
| **契约测试 CI** | 质量保障 | ✅ 采用 |

**实现策略：**

1. **使用 deno_bindgen** 管理简单函数调用，自动生成 TypeScript 类型定义
2. **使用 Protobuf** 处理复杂请求/响应的序列化
3. **实现运行时版本检查**，确保 FFI 版本兼容性
4. **添加契约测试到 CI 流水线**，验证接口一致性

---

## 4. 核心架构决策

### 4.1 决策优先级分析

**关键决策（阻碍实现）：**
- FFI 契约管理方案
- 数据存储策略
- 认证与安全策略

**重要决策（影响架构）：**
- API 通信模式
- 前端状态管理
- 基础设施部署方案

**延迟决策（Post-MVP）：**
- 多用户认证系统
- 分布式缓存策略

### 4.2 数据架构

| 决策项 | 选择 | 版本 | 理由 |
|--------|------|------|------|
| 用户配置存储 | Deno KV | 内置 | 轻量级、无需额外依赖、部署简单 |
| 工作区状态 | 内存 + 定时持久化 | - | 实时性要求高，重启后可恢复 |
| AI 会话历史 | 本地文件存储 | - | 便于迁移和备份，符合隐私要求 |
| 临时缓存 | 内存 LRU | - | 终端输出、LSP 响应等短期数据 |

**数据访问层设计：**
- 封装统一 DAL（Data Access Layer）便于切换存储后端
- 预留 SQLite 作为生产环境备选方案

### 4.3 认证与安全

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 认证方式 | 无认证（单用户）+ API Key 保护 | 简化部署，初期用户体验好 |
| 授权模式 | 工作区隔离 + 操作白名单 | 限制危险操作（如 rm -rf） |
| 传输安全 | TLS 1.3 + WebSocket 加密 | 强制加密传输 |
| API Key 管理 | BYOK 模式，仅内存存储 | 用户自主管理密钥，不持久化 |

**未来扩展预留：**
- 设计时预留认证接口，便于未来扩展多用户支持
- 提供可选的认证配置，满足不同用户需求

### 4.4 API 与通信模式

| 决策项 | 选择 | 版本 | 理由 |
|--------|------|------|------|
| API 风格 | REST + WebSocket 混合 | - | REST 用于配置/操作，WebSocket 用于实时 |
| 实时通信 | WebSocket + xterm.js | xterm.js 5.x | 终端和 LSP 实时交互 |
| 错误处理 | HTTP 状态码 + JSON 错误对象 | - | 标准化错误响应 |
| 限流策略 | 基于会话的速率限制 | - | 防止资源滥用 |

**消息协议设计：**
```json
{
  "type": "terminal/input",
  "sessionId": "uuid",
  "payload": { "data": "string" },
  "timestamp": "ISO8601"
}
```

### 4.5 前端架构

| 决策项 | 选择 | 版本 | 理由 |
|--------|------|------|------|
| 状态管理 | React Context + localStorage | React 18 | 轻量级状态管理，配置持久化 |
| 组件架构 | 原子设计（Atomic Design） | - | 可复用组件层级 |
| 路由策略 | React Router | v6 | 单页应用路由 |
| 性能优化 | Code Splitting + Lazy Loading | Vite | 按需加载，减少首屏时间 |

**状态管理备选：**
- 复杂场景可升级为 Zustand 或 Jotai

### 4.6 基础设施与部署

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 容器化 | Podman 优先，兼容 Docker | Podman 无守护进程更安全，提供 Dockerfile 备选 |
| CI/CD | GitHub Actions + Gitee CI | 双平台支持，国内国外用户均可访问 |
| 监控日志 | Deno 内置日志 + 结构化输出 | 便于问题排查 |
| 配置管理 | 环境变量 + 配置文件 | 灵活配置 |

**构建脚本设计：**
```bash
deno task dev     # 启动开发服务器
deno task build   # 构建生产版本
deno task test    # 运行测试
```

### 4.7 决策影响分析

**实现顺序：**
1. Rust 核心库（FFI 接口）
2. Deno 后端网关（HTTP/WS）
3. React 前端（UI 组件）
4. 部署脚本（容器化）

**跨组件依赖：**
- FFI 契约 → Deno 后端 → React 前端
- WebSocket 消息协议统一所有实时通信
- 配置存储影响用户体验和数据迁移

---

## 5. 实现模式与一致性规则

### 5.1 冲突点识别

基于 Rust + Deno + React 技术栈，识别出以下潜在冲突领域：

| 冲突类别 | 具体冲突点 |
|----------|------------|
| **命名冲突** | 文件/目录命名、API端点命名、组件/函数命名 |
| **结构冲突** | 测试位置、组件组织、工具函数位置 |
| **格式冲突** | API响应格式、JSON字段命名、错误响应结构 |
| **通信冲突** | 事件命名、消息协议格式、日志格式 |
| **流程冲突** | 错误处理、加载状态、重试机制 |

### 5.2 命名模式

#### 数据库/存储命名
- **键名格式**：`[domain]/[type]/[id]`（如 `config/user/preferences`）
- **JSON字段**：`camelCase`（如 `userId`, `createdAt`）

#### API命名
- **REST端点**：`kebab-case`（如 `/api/user-preferences`）
- **路由参数**：`:snake_case`（如 `/api/projects/:project_id`）
- **查询参数**：`camelCase`（如 `?pageNumber=1&pageSize=10`）

#### 代码命名
- **组件**：`PascalCase`（如 `UserProfile.tsx`）
- **文件**：`kebab-case`（如 `user-profile.tsx`）
- **函数/变量**：`camelCase`（如 `getUserData`, `userName`）
- **常量**：`UPPER_SNAKE_CASE`（如 `MAX_RETRY_COUNT`）

### 5.3 结构模式

#### 项目组织
- **测试位置**：与源代码同目录（`*.test.ts`）
- **组件组织**：按功能组织（如 `components/user/`, `components/project/`）
- **工具函数**：`src/utils/` 目录
- **服务层**：`src/services/` 目录

#### 文件结构
```
lapdev-web/
├── src/
│   ├── components/       # UI组件
│   ├── hooks/            # 自定义hooks
│   ├── services/         # API服务
│   ├── utils/            # 工具函数
│   └── types/            # TypeScript类型定义
└── tests/                # 集成测试
```

### 5.4 格式模式

#### API响应格式
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

#### 数据交换格式
- **日期时间**：ISO 8601 字符串（如 `"2024-01-01T12:00:00Z"`）
- **布尔值**：`true`/`false`（JSON原生）
- **空值**：`null`（不使用 `undefined`）

### 5.5 通信模式

#### 事件系统
- **事件命名**：`domain.event-name`（如 `terminal.input`, `lsp.response`）
- **消息协议**：
```json
{
  "type": "terminal/input",
  "sessionId": "uuid",
  "payload": {},
  "timestamp": "ISO8601"
}
```

#### 状态管理
- **状态更新**：不可变更新（使用展开运算符）
- **Action命名**：`domain/action-name`（如 `user/SET_PREFERENCES`）

### 5.6 流程模式

#### 错误处理
- **全局错误边界**：React Error Boundary 捕获组件错误
- **错误日志**：统一记录到控制台和服务端
- **用户提示**：友好的错误消息，隐藏技术细节

#### 加载状态
- **状态命名**：`isLoading`（布尔值）
- **加载状态管理**：React Context 统一管理全局加载状态
- **加载UI**：统一的 Spinner 组件

### 5.7 强制执行指南

**所有AI代理必须遵守：**
1. ✅ 严格遵循命名约定
2. ✅ 使用统一的API响应格式
3. ✅ 在同目录编写测试文件
4. ✅ 使用不可变状态更新
5. ✅ 实现统一的错误处理

**模式执行：**
- 通过 ESLint/Prettier 自动检查格式
- 通过单元测试验证API响应格式
- 代码审查时检查模式遵循情况

### 5.8 改进建议

| 建议 | 实施优先级 |
|------|------------|
| 添加命名空间规则，避免跨模块命名冲突 | 高 |
| 考虑为简单查询提供直接响应选项（性能优化） | 中 |
| 添加清晰的模块边界定义，避免循环依赖 | 高 |
| 添加事件版本控制机制 | 中 |
| 添加响应格式验证测试 | 高 |

---

## 6. 项目结构与边界

### 6.1 完整项目目录结构

基于三层架构（Rust + Deno + React），Lapdev 的项目结构如下：

```
lapdev/
├── README.md                    # 项目说明文档
├── LICENSE                      # MIT 许可证
├── .gitignore                   # Git 忽略配置
├── Cargo.toml                   # Rust workspace 配置
├── .github/                     # GitHub CI/CD 配置
│   └── workflows/
│       └── ci.yml
├── scripts/                     # 部署和构建脚本
│   ├── setup_podman.sh          # Podman 部署脚本
│   ├── build_all.sh             # 全项目构建脚本
│   └── dev.sh                   # 开发环境启动脚本
├── lapdev-core/                 # Rust 核心库
│   ├── Cargo.toml
│   ├── Cargo.lock
│   ├── src/
│   │   ├── lib.rs               # 库入口
│   │   ├── fs/                  # 文件系统服务
│   │   │   ├── mod.rs
│   │   │   ├── reader.rs
│   │   │   └── writer.rs
│   │   ├── lsp/                 # LSP 管理
│   │   │   ├── mod.rs
│   │   │   └── server.rs
│   │   ├── pty/                 # 终端 PTY
│   │   │   ├── mod.rs
│   │   │   └── terminal.rs
│   │   └── ffi/                 # FFI 接口
│   │       ├── mod.rs
│   │       └── bindings.rs
│   └── tests/                   # Rust 测试
├── lapdev-server/               # Deno 后端网关
│   ├── deno.json                # Deno 配置
│   ├── deno.lock
│   ├── src/
│   │   ├── main.ts              # 服务入口
│   │   ├── handlers/            # HTTP 处理器
│   │   │   ├── mod.ts
│   │   │   ├── config.ts
│   │   │   └── workspace.ts
│   │   ├── middleware/          # 中间件（认证、日志）
│   │   │   └── mod.ts
│   │   ├── ws/                  # WebSocket 管理
│   │   │   ├── mod.ts
│   │   │   ├── terminal.ts
│   │   │   └── lsp.ts
│   │   ├── ffi/                 # Rust FFI 调用
│   │   │   └── mod.ts
│   │   ├── services/            # 业务服务
│   │   │   ├── mod.ts
│   │   │   └── ai.ts
│   │   └── utils/               # 工具函数
│   │       └── mod.ts
│   └── tests/                   # Deno 测试
└── lapdev-web/                  # React 前端
    ├── package.json
    ├── vite.config.ts           # Vite 配置
    ├── tsconfig.json
    ├── tailwind.config.js       # Tailwind CSS 配置
    ├── src/
    │   ├── main.tsx             # 应用入口
    │   ├── App.tsx              # 根组件
    │   ├── components/          # UI 组件
    │   │   ├── layout/          # 布局组件
    │   │   │   ├── Header.tsx
    │   │   │   └── Sidebar.tsx
    │   │   ├── editor/          # 编辑器组件
    │   │   │   ├── CodeEditor.tsx
    │   │   │   └── FileTree.tsx
    │   │   ├── terminal/        # 终端组件
    │   │   │   └── Terminal.tsx
    │   │   ├── ai/              # AI 功能组件
    │   │   │   └── AIChat.tsx
    │   │   └── common/          # 通用组件
    │   │       └── Spinner.tsx
    │   ├── hooks/               # 自定义 hooks
    │   │   ├── useTerminal.ts
    │   │   ├── useAI.ts
    │   │   ├── useFileTree.ts
    │   │   └── useLSP.ts
    │   ├── services/            # API 服务
    │   │   └── api.ts
    │   ├── types/               # TypeScript 类型
    │   │   └── index.ts
    │   └── utils/               # 工具函数
    │       └── index.ts
    └── public/                  # 静态资源
        └── assets/
```

### 6.2 架构边界

#### API 边界
| 模块 | 职责 | 边界 |
|------|------|------|
| **HTTP 层** | 处理 REST 请求 | `/api/*` 端点 |
| **WebSocket 层** | 实时通信 | `/ws/*` 端点 |
| **FFI 层** | Deno-Rust 通信 | `lapdev_ffi_*` 函数 |

#### 组件边界
- **前端** ↔ **后端**：通过 HTTP/WebSocket
- **后端** ↔ **核心**：通过 FFI 调用
- **组件间通信**：React Context + 事件系统

### 6.3 需求到结构映射

| 功能模块 | 位置 |
|----------|------|
| **文件树** | `lapdev-web/src/components/editor/FileTree.tsx` |
| **代码编辑器** | `lapdev-web/src/components/editor/CodeEditor.tsx` |
| **终端** | `lapdev-web/src/components/terminal/` + `lapdev-core/src/pty/` |
| **LSP 支持** | `lapdev-core/src/lsp/` + `lapdev-server/src/ws/lsp.ts` |
| **AI 聊天** | `lapdev-web/src/components/ai/` + `lapdev-server/src/services/ai.ts` |

### 6.4 集成点

**数据流向：**
```
用户操作 → React 组件 → WebSocket/HTTP → Deno 服务 → FFI → Rust 核心 → 文件系统/LSP/PTY
```

**外部集成：**
- AI 模型 API：通过 `lapdev-server/src/services/ai.ts`
- Git 命令：通过 `lapdev-core/src/fs/`

### 6.5 改进建议

| 建议 | 实施优先级 |
|------|------------|
| 添加顶层 Cargo workspace 配置 | 高 |
| 添加统一构建脚本（Makefile/justfile） | 高 |
| 补充 E2E 测试目录 | 中 |

---

## 7. 架构验证

### 7.1 可行性评估

#### 技术可行性
| 技术项 | 可行性 | 风险等级 | 说明 |
|--------|--------|----------|------|
| Rust + Deno FFI | ✅ 高 | 低 | Deno 原生支持 FFI，已有成熟实践 |
| Monaco Editor | ✅ 高 | 低 | 成熟的开源编辑器组件 |
| WebSocket 终端 | ✅ 高 | 低 | xterm.js + WebSocket 是成熟方案 |
| Podman 部署 | ✅ 高 | 低 | Podman 与 Docker 兼容 |
| AI 集成 | ✅ 高 | 中 | 需要处理 API 调用和错误处理 |

#### 资源可行性
- **开发资源**：需要 Rust、Deno、React 开发人员各 1-2 人
- **时间估算**：核心功能 3-4 个月完成
- **预算估算**：开源项目，主要成本为人力

### 7.2 关键技术风险

| 风险项 | 风险等级 | 影响 | 缓解措施 |
|--------|----------|------|----------|
| FFI 调用开销 | 中 | 影响性能 | 使用批处理、缓存策略 |
| 跨语言调试 | 高 | 影响开发效率 | 建立完善的日志和调试工具 |
| WebSocket 连接稳定性 | 中 | 影响用户体验 | 实现心跳和重连机制 |
| LSP 进程管理 | 中 | 资源占用 | 实现进程池和超时管理 |

### 7.3 性能预估

#### 响应时间目标
| 操作 | 目标响应时间 |
|------|------------|
| 文件打开 | < 100ms |
| 代码补全（LSP） | < 200ms |
| 终端输入响应 | < 50ms |
| AI 响应 | < 2s（取决于模型） |

#### 资源占用预估
- **内存**：启动时 ~200MB，运行时 ~500MB
- **CPU**：编辑器空闲 < 5%，编译时 < 50%
- **存储**：镜像 ~500MB

### 7.4 安全性评估

#### 安全边界
| 层级 | 安全措施 |
|------|----------|
| **前端** | XSS 防护、输入验证 |
| **后端** | API 密钥验证、请求限流 |
| **核心** | 沙箱隔离、操作白名单 |
| **数据** | 本地存储、BYOK 模式 |

#### 风险缓解
- 禁止危险命令（如 `rm -rf /`）
- 限制文件系统访问范围
- 实现操作审计日志

### 7.5 可扩展性评估

#### 水平扩展
- **前端**：无状态，可水平扩展
- **后端**：会话绑定，需要会话管理
- **核心**：本地进程，需要容器化部署

#### 功能扩展
- **插件系统**：预留扩展接口
- **主题系统**：CSS 变量支持
- **语言支持**：LSP 插件化

### 7.6 验证结论

**整体评估：** ✅ **可行**

架构设计符合需求，技术选型合理，风险可控。建议按以下顺序实现：

1. **Phase 1**：核心编辑器功能（文件树、编辑器、终端）
2. **Phase 2**：LSP 集成和代码智能提示
3. **Phase 3**：AI 助手功能
4. **Phase 4**：BMAD 技能支持和扩展功能

---

## 8. 决策记录

### 8.1 架构决策清单

| 决策编号 | 决策内容 | 状态 |
|----------|----------|------|
| ADDR-001 | 采用 Rust + Deno + React 三层架构 | ✅ 已确认 |
| ADDR-002 | 使用 Deno KV + 本地文件存储数据 | ✅ 已确认 |
| ADDR-003 | 采用无认证 + API Key 保护模式 | ✅ 已确认 |
| ADDR-004 | 使用 REST + WebSocket 混合 API | ✅ 已确认 |
| ADDR-005 | 使用 deno_bindgen 管理 FFI 契约 | ✅ 已确认 |
| ADDR-006 | 使用 Vite + React Router v6 前端架构 | ✅ 已确认 |
| ADDR-007 | 使用 Podman 优先的容器化部署 | ✅ 已确认 |

### 8.2 待解决问题

| 问题 | 优先级 | 负责人 |
|------|--------|--------|
| FFI 性能优化方案 | 高 | 架构师 |
| 日志和监控方案 | 中 | DevOps |
| 多用户支持方案 | 低 | 产品经理 |

---

## 📋 架构设计完成

架构设计文档已完成，包含以下核心内容：

1. **项目上下文分析**：需求概述、技术约束、项目规模评估
2. **核心架构决策**：技术栈、数据架构、认证安全、API 设计
3. **实现模式**：命名约定、项目结构、API 格式、通信协议
4. **项目结构**：三层架构目录结构、边界定义、集成点
5. **架构验证**：可行性评估、风险分析、性能预估、安全评估

**下一步操作建议：**

- [A] 开始实现：创建项目目录结构和基础代码
- [B] 生成技术规格：详细的 API 文档和接口定义
- [C] 审查和修改：返回修改架构决策