---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - docs/prd.md
  - docs/architecture.md
---

# Lapdev - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Lapdev, decomposing the requirements from the PRD and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR-001: 文件树实时显示与刷新
FR-002: 文件/文件夹操作（新建/重命名/删除）
FR-003: 多Tab文件管理
FR-004: 语法高亮、括号匹配、代码折叠
FR-005: 多光标编辑
FR-006: 主题切换（浅色/深色）
FR-007: 内置终端仿真器
FR-008: 多终端Tab支持
FR-009: Git状态可视化
FR-010: Git操作（stage/commit/branch）
FR-011: LSP自动补全
FR-012: LSP悬停提示
FR-013: LSP跳转定义/查找引用
FR-014: LSP错误诊断
FR-015: AI模型配置（API Key/Base URL/Model）
FR-016: 连接测试
FR-017: 多模型管理与切换
FR-018: AI聊天面板
FR-019: 代码上下文引用
FR-020: 流式回复显示
FR-021: 内联代码补全
FR-022: Agent模式文件读取
FR-023: Agent操作确认机制
FR-024: Agent操作日志
FR-025: Skill文件规范（.skill.md）
FR-026: 全局/项目级Skill加载
FR-027: Skill市场CLI安装
FR-028: Skill自动匹配激活
FR-029: BMAD一键启用
FR-030: 在线安装（npx bmad-method install）
FR-031: 离线降级策略
FR-032: 内置简化版BMAD
FR-033: Podman-compose支持
FR-034: 国内镜像加速配置
FR-035: Gitee主仓库托管
FR-036: GitHub镜像同步

### NonFunctional Requirements

NFR-001: 服务器启动时间 < 2秒
NFR-002: 大型文件打开延迟 < 500ms
NFR-003: 终端响应延迟 < 50ms
NFR-004: 页面加载时间 < 3秒
NFR-005: 系统可用性 > 99.9%
NFR-006: API Key安全 - 仅内存存储，不持久化
NFR-007: 文件访问限制 - 工作区严格限制在指定目录
NFR-008: Agent操作授权 - 所有文件操作需用户确认
NFR-009: 传输加密 - TLS 1.3
NFR-010: 单容器部署 - Podman镜像支持
NFR-011: 环境变量配置 - 工作区路径可配置

### Additional Requirements

- 使用 deno_bindgen 管理 FFI 契约
- 使用 Protobuf 处理复杂数据结构
- REST + WebSocket 混合 API 通信模式
- React Context + localStorage 状态管理
- Podman 优先，兼容 Docker 容器化部署
- GitHub Actions + Gitee CI 双平台 CI/CD
- 工作区隔离 + 操作白名单授权模式
- 统一的 API 响应格式和错误处理

### UX Design Requirements

UX-DR1: 终端Tab管理界面 - 支持添加、关闭、重命名终端Tab
UX-DR2: 主题切换UI - 设置面板中提供主题选择下拉菜单
UX-DR3: LSP悬停提示样式 - 悬停时显示类型信息和文档的浮动提示框
UX-DR4: Agent操作确认对话框 - 显示diff预览和批准/拒绝按钮
UX-DR5: Skill市场界面 - 搜索、安装、管理已安装的Skill

### FR Coverage Map

FR-001: Epic 1 - 文件树实时显示与刷新
FR-002: Epic 1 - 文件/文件夹操作
FR-003: Epic 1 - 多Tab文件管理
FR-004: Epic 1 - 语法高亮、括号匹配、代码折叠
FR-005: Epic 1 - 多光标编辑
FR-006: Epic 11 - 主题切换（浅色/深色）
FR-007: Epic 1 - 内置终端仿真器
FR-008: Epic 7 - 多终端Tab支持
FR-009: Epic 2 - Git状态可视化
FR-010: Epic 2 - Git操作（stage/commit/branch）
FR-011: Epic 2 - LSP自动补全
FR-012: Epic 8 - LSP悬停提示
FR-013: Epic 2 - LSP跳转定义/查找引用
FR-014: Epic 2 - LSP错误诊断
FR-015: Epic 3 - AI模型配置
FR-016: Epic 3 - 连接测试
FR-017: Epic 3 - 多模型管理与切换
FR-018: Epic 3 - AI聊天面板
FR-019: Epic 3 - 代码上下文引用
FR-020: Epic 3 - 流式回复显示
FR-021: Epic 3 - 内联代码补全
FR-022: Epic 9 - Agent模式文件读取
FR-023: Epic 9 - Agent操作确认机制
FR-024: Epic 9 - Agent操作日志
FR-025: Epic 4 - Skill文件规范
FR-026: Epic 4 - 全局/项目级Skill加载
FR-027: Epic 10 - Skill市场CLI安装
FR-028: Epic 4 - Skill自动匹配激活
FR-029: Epic 5 - BMAD一键启用
FR-030: Epic 5 - 在线安装
FR-031: Epic 5 - 离线降级策略
FR-032: Epic 5 - 内置简化版BMAD
FR-033: Epic 6 - Podman-compose支持
FR-034: Epic 6 - 国内镜像加速配置
FR-035: Epic 6 - Gitee主仓库托管
FR-036: Epic 6 - GitHub镜像同步

## Epic List

### Epic 1: 基础IDE功能
用户可以浏览和管理文件、使用现代代码编辑器、打开内置终端
**FRs covered:** FR-001, FR-002, FR-003, FR-004, FR-005, FR-007

### Epic 2: 高级IDE功能
用户可以使用Git版本控制和LSP代码智能功能
**FRs covered:** FR-009, FR-010, FR-011, FR-013, FR-014

### Epic 3: AI功能（BYOK）
用户可以配置AI模型、使用聊天面板和内联代码补全
**FRs covered:** FR-015, FR-016, FR-017, FR-018, FR-019, FR-020, FR-021

### Epic 4: Skill系统
用户可以开发、加载和自动匹配Skill
**FRs covered:** FR-025, FR-026, FR-028

### Epic 5: BMAD敏捷方法论支持
用户可以一键启用BMAD工作流，支持在线安装和离线降级
**FRs covered:** FR-029, FR-030, FR-031, FR-032

### Epic 6: 部署适配
用户可以使用Podman部署，并享受国内镜像加速和代码托管
**FRs covered:** FR-033, FR-034, FR-035, FR-036

### Epic 7: 终端多Tab支持
开发者可以同时打开多个终端会话，执行不同命令
**FRs covered:** FR-008

### Epic 8: LSP悬停提示
开发者在编码时可以快速查看符号类型信息和文档
**FRs covered:** FR-012

### Epic 9: Agent模式增强
AI Agent可以安全地执行文件操作，所有修改需要用户确认
**FRs covered:** FR-022, FR-023, FR-024

### Epic 10: Skill市场
社区贡献者可以发布Skill，用户可以发现和安装新Skill
**FRs covered:** FR-027

### Epic 11: 主题切换
开发者可以根据偏好切换浅色/深色主题
**FRs covered:** FR-006

## Epic 7: 终端多Tab支持

开发者可以同时打开多个终端会话，执行不同命令

### Story 7.1: 终端Tab管理界面

As a 个人开发者,
I want 终端面板支持多个Tab标签页,
So that 我可以同时运行多个命令会话。

**Acceptance Criteria:**

**Given** 用户打开了终端面板
**When** 用户点击终端右上角的 "+" 按钮
**Then** 新建一个终端Tab，显示默认标题 "Terminal N"
**And** 新Tab自动获得焦点并创建新的终端会话

**Given** 终端面板有多个Tab
**When** 用户点击某个Tab
**Then** 切换到该Tab对应的终端会话
**And** 终端内容正确显示该会话的输出

**Given** 终端面板有多个Tab
**When** 用户点击Tab上的关闭按钮 "×"
**Then** 关闭该Tab并终止对应的终端会话
**And** 如果关闭的是当前活动Tab，切换到相邻Tab

**Given** 用户右键点击终端Tab
**When** 选择"重命名"选项并输入新名称
**Then** Tab标题更新为新名称
**And** 名称在当前会话期间持久化

## Epic 8: LSP悬停提示

开发者在编码时可以快速查看符号类型信息和文档

### Story 8.1: 注册LSP悬停提供商

As a 个人开发者,
I want 鼠标悬停在代码符号上时显示类型信息和文档,
So that 我可以快速了解符号的用途和用法。

**Acceptance Criteria:**

**Given** 用户打开了一个 .ts 或 .rs 文件
**And** LSP 服务已初始化完成
**When** 用户将鼠标悬停在变量、函数或类名上
**Then** 弹出浮动提示框显示符号的类型信息
**And** 如果有文档注释，显示文档内容

**Given** 用户打开了一个 .ts 文件
**When** 用户悬停在导入语句的模块名上
**Then** 提示框显示模块导出的符号列表

**Given** 用户悬停在有类型错误的符号上
**Then** 提示框显示错误信息和可能的修复建议

**Given** 用户悬停在泛型类型参数上
**Then** 提示框显示类型约束和边界信息

## Epic 9: Agent模式增强

AI Agent可以安全地执行文件操作，所有修改需要用户确认

### Story 9.1: Agent文件读取能力

As a 个人开发者,
I want Agent模式下AI可以读取项目文件内容,
So that AI可以理解代码上下文并提供更精准的建议。

**Acceptance Criteria:**

**Given** 用户在AI面板中开启了Agent模式
**When** AI需要读取文件来理解上下文
**Then** AI自动读取当前打开的文件内容
**And** 用户在活动日志中看到"读取文件: xxx"的记录

**Given** Agent模式已开启
**When** AI需要搜索代码
**Then** AI可以遍历工作区目录查找匹配的文件
**And** 搜索结果显示在聊天面板中

**Given** 用户关闭了Agent模式
**When** AI尝试读取文件
**Then** 显示提示"请先开启Agent模式"

### Story 9.2: Agent操作确认机制

As a 个人开发者,
I want AI修改文件前需要我的确认,
So that 我可以审查并拒绝不安全的操作。

**Acceptance Criteria:**

**Given** Agent模式已开启且AI决定修改文件
**When** AI准备执行修改操作
**Then** 编辑器自动显示diff预览，标记新增/修改/删除的内容
**And** 弹出确认对话框，显示操作类型和影响范围

**Given** 确认对话框已弹出
**When** 用户点击"批准"按钮
**Then** AI执行修改操作
**And** 文件内容更新为新内容

**Given** 确认对话框已弹出
**When** 用户点击"拒绝"按钮
**Then** AI放弃修改操作
**And** 显示消息"操作已拒绝"

**Given** AI有多个文件修改请求
**When** 用户点击"全部批准"按钮
**Then** AI依次执行所有修改操作
**And** 每个文件修改完成后显示状态

### Story 9.3: Agent操作日志

As a 个人开发者,
I want 所有Agent操作都有完整的审计日志,
So that 我可以追溯和审查AI的所有操作。

**Acceptance Criteria:**

**Given** Agent模式已开启
**When** AI执行任何操作（读取、修改、搜索）
**Then** 操作记录到活动日志中，包含时间、操作类型、目标文件

**Given** 用户打开活动日志面板
**When** 查看Agent操作记录
**Then** 可以按时间倒序查看所有操作
**And** 每条记录显示操作结果（成功/失败）

**Given** 用户在活动日志中点击某条记录
**Then** 展开显示详细信息，包括操作前后的diff

## Epic 10: Skill市场

社区贡献者可以发布Skill，用户可以发现和安装新Skill

### Story 10.1: Skill发布命令

As a 社区贡献者,
I want 通过CLI命令发布Skill到市场,
So that 其他用户可以发现和使用我的Skill。

**Acceptance Criteria:**

**Given** 用户编写了一个符合规范的 .skill.md 文件
**When** 用户执行 `lapdev skill publish` 命令
**Then** CLI验证Skill文件格式是否正确
**And** 验证通过后上传到Skill注册中心

**Given** 用户执行 `lapdev skill publish` 命令
**When** Skill文件格式不正确
**Then** CLI显示错误信息和修复建议

**Given** 用户执行 `lapdev skill publish` 命令
**When** 用户未登录
**Then** CLI提示用户先登录或配置API Key

### Story 10.2: Skill搜索与安装

As a 个人开发者,
I want 在Skill市场中搜索和安装新Skill,
So that 我可以扩展Lapdev的功能。

**Acceptance Criteria:**

**Given** 用户打开Skill市场界面
**When** 在搜索框输入关键词
**Then** 显示匹配的Skill列表，包含名称、描述、作者和评分

**Given** 用户在Skill列表中点击某个Skill
**Then** 显示Skill详情页面，包含完整描述、使用说明和版本历史

**Given** 用户点击"安装"按钮
**When** 确认安装
**Then** Skill被下载并安装到本地
**And** 显示安装成功提示

**Given** 用户已安装某个Skill
**When** Skill有新版本可用
**Then** 显示更新提示和"更新"按钮

## Epic 11: 主题切换

开发者可以根据偏好切换浅色/深色主题

### Story 11.1: 主题切换UI

As a 个人开发者,
I want 在设置面板中切换主题,
So that 我可以根据环境和偏好选择合适的主题。

**Acceptance Criteria:**

**Given** 用户打开设置面板
**When** 找到主题设置选项
**Then** 显示主题选择下拉菜单，包含"浅色"和"深色"选项

**Given** 用户选择"浅色"主题
**When** 确认选择
**Then** Monaco编辑器切换到浅色主题
**And** IDE整体样式切换为浅色模式

**Given** 用户选择"深色"主题
**When** 确认选择
**Then** Monaco编辑器切换到深色主题
**And** IDE整体样式切换为深色模式

**Given** 用户切换主题
**When** 刷新页面
**Then** 主题偏好从localStorage恢复
**And** 页面加载时应用用户选择的主题