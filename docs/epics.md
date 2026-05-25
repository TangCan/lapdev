---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - docs/prd.md
  - docs/architecture.md
  - docs/api-spec.md
  - docs/001_需求.md
  - docs/002_requirements.md
  - docs/003_design.md
---

# Lapdev - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Lapdev, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

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

- Rust + Deno + React 三层架构设计
- FFI接口契约管理（使用deno_bindgen）
- WebSocket实时通信协议
- Podman优先容器化部署
- 统一API响应格式和错误处理
- 版本化API设计（v1）
- 状态管理使用React Context + localStorage
- 测试覆盖目标：单元测试80%+，集成测试覆盖核心流程

### UX Design Requirements

UX-DR1: 实现暗色/亮色两套主题系统，支持即时切换
UX-DR2: 实现响应式布局，支持不同屏幕尺寸
UX-DR3: 实现统一的Spinner加载组件
UX-DR4: 实现终端仿真器UI组件（基于xterm.js）
UX-DR5: 实现代码编辑器组件（基于Monaco Editor）
UX-DR6: 实现AI聊天面板组件
UX-DR7: 实现文件树导航组件
UX-DR8: 实现Git状态可视化组件
UX-DR9: 实现设置页面组件
UX-DR10: 实现底部状态栏组件

### FR Coverage Map

FR-001: Epic 1 - 文件树实时显示与刷新  
FR-002: Epic 1 - 文件/文件夹操作（新建/重命名/删除）  
FR-003: Epic 1 - 多Tab文件管理  
FR-004: Epic 1 - 语法高亮、括号匹配、代码折叠  
FR-005: Epic 1 - 多光标编辑  
FR-006: Epic 1 - 主题切换（浅色/深色）  
FR-007: Epic 1 - 内置终端仿真器  
FR-008: Epic 1 - 多终端Tab支持  
FR-009: Epic 2 - Git状态可视化  
FR-010: Epic 2 - Git操作（stage/commit/branch）  
FR-011: Epic 2 - LSP自动补全  
FR-012: Epic 2 - LSP悬停提示  
FR-013: Epic 2 - LSP跳转定义/查找引用  
FR-014: Epic 2 - LSP错误诊断  
FR-015: Epic 3 - AI模型配置（API Key/Base URL/Model）  
FR-016: Epic 3 - 连接测试  
FR-017: Epic 3 - 多模型管理与切换  
FR-018: Epic 3 - AI聊天面板  
FR-019: Epic 3 - 代码上下文引用  
FR-020: Epic 3 - 流式回复显示  
FR-021: Epic 3 - 内联代码补全  
FR-022: Epic 3 - Agent模式文件读取  
FR-023: Epic 3 - Agent操作确认机制  
FR-024: Epic 3 - Agent操作日志  
FR-025: Epic 4 - Skill文件规范（.skill.md）  
FR-026: Epic 4 - 全局/项目级Skill加载  
FR-027: Epic 4 - Skill市场CLI安装  
FR-028: Epic 4 - Skill自动匹配激活  
FR-029: Epic 5 - BMAD一键启用  
FR-030: Epic 5 - 在线安装（npx bmad-method install）  
FR-031: Epic 5 - 离线降级策略  
FR-032: Epic 5 - 内置简化版BMAD  
FR-033: Epic 6 - Podman-compose支持  
FR-034: Epic 6 - 国内镜像加速配置  
FR-035: Epic 6 - Gitee主仓库托管  
FR-036: Epic 6 - GitHub镜像同步  

## Epic List

### Epic 1: 基础IDE功能
**目标：** 用户可以在浏览器中进行基础代码开发，包括文件管理、代码编辑和终端访问。
**FRs covered:** FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008

### Epic 2: 高级IDE功能
**目标：** 用户可以使用Git版本控制和LSP代码智能功能，提升编码效率。
**FRs covered:** FR-009, FR-010, FR-011, FR-012, FR-013, FR-014

### Epic 3: AI功能（BYOK模式）
**目标：** 用户可以配置和使用自己的AI模型，获得智能代码补全和Agent辅助开发能力。
**FRs covered:** FR-015, FR-016, FR-017, FR-018, FR-019, FR-020, FR-021, FR-022, FR-023, FR-024

### Epic 4: Skill系统
**目标：** 用户和社区贡献者可以扩展AI能力，通过编写Skill为IDE添加新功能。
**FRs covered:** FR-025, FR-026, FR-027, FR-028

### Epic 5: BMAD敏捷方法论支持
**目标：** 用户可以在IDE中使用BMAD敏捷工作流，提升开发效率和团队协作。
**FRs covered:** FR-029, FR-030, FR-031, FR-032

### Epic 6: 部署与国内环境适配
**目标：** 用户可以轻松部署Lapdev，并在中国网络环境中获得良好体验。
**FRs covered:** FR-033, FR-034, FR-035, FR-036

## Epic 1: 基础IDE功能

### 目标
实现基础IDE功能，包括文件管理、代码编辑和终端访问。

#### Story 1.1: 文件树浏览与管理

As a 个人开发者,
I want 在浏览器中看到实时文件树,
So that 导航和操作项目文件。

**Acceptance Criteria:**

**Given** 用户打开工作区
**When** 进入IDE首页
**Then** 文件树立即显示根目录下的所有文件和文件夹
**And** 文件夹支持展开/折叠
**And** 遵循.gitignore忽略规则

**Given** 文件树已显示
**When** 外部创建/修改/删除文件
**Then** 文件树3秒内自动刷新

**Given** 用户右键点击文件/文件夹
**When** 选择操作选项
**Then** 支持新建文件/文件夹、重命名、删除操作

**Given** 用户单击文件
**When** 文件被点击
**Then** 文件在编辑器中打开

#### Story 1.2: 现代代码编辑器体验

As a 个人开发者,
I want 功能全面的代码编辑器,
So that 高效编写代码。

**Acceptance Criteria:**

**Given** 用户打开代码文件
**When** 查看编辑器
**Then** 支持语法高亮、括号匹配、代码折叠、缩进指南

**Given** 用户在编辑器中
**When** 启用多光标
**Then** 支持多光标编辑

**Given** 用户打开设置
**When** 切换主题
**Then** 支持至少深浅两套主题，即时切换

**Given** 用户打开多个文件
**When** 查看顶部
**Then** 已打开的文件以Tab标签形式显示
**And** 支持Tab拖动排序
**And** Ctrl+S保存文件
**And** Ctrl+W关闭Tab

#### Story 1.3: 内置终端

As a 个人开发者,
I want 在IDE中直接使用终端,
So that 执行命令和脚本。

**Acceptance Criteria:**

**Given** 用户打开IDE
**When** 点击终端按钮
**Then** 底部面板打开终端仿真器

**Given** 终端已打开
**When** 输入命令
**Then** 连接到服务器上的真实Shell，正确显示提示符
**And** 输入命令到显示结果的延迟 < 50ms

**Given** 用户需要多个终端
**When** 点击添加终端
**Then** 支持多个终端Tab
**And** 可添加、关闭和重命名

**Given** 用户调整终端尺寸
**When** 拖动调整
**Then** 终端尺寸调整后发送SIGWINCH至PTY

## Epic 2: 高级IDE功能

### 目标
实现Git版本控制和LSP代码智能功能，提升编码效率。

#### Story 2.1: Git版本控制可视化

As a 个人开发者,
I want IDE直观展示Git状态,
So that 执行常用操作。

**Acceptance Criteria:**

**Given** 项目有Git仓库
**When** 查看文件树
**Then** 文件树中通过图标/颜色区分文件状态：已修改、新增、未跟踪

**Given** 用户打开文件
**When** 查看编辑器边栏
**Then** 显示当前文件与HEAD的差异指示（绿色新增、蓝色修改、红色删除）

**Given** 用户打开Git面板
**When** 查看变更
**Then** 可查看变更文件列表
**And** 点击打开diff视图

**Given** 用户有变更
**When** 点击提交
**Then** 支持一键暂存所有变更
**And** 填写提交信息并提交

**Given** 用户需要切换分支
**When** 选择分支
**Then** 支持切换已有分支

#### Story 2.2: LSP代码智能

As a 个人开发者,
I want 代码自动补全、错误诊断和导航功能,
So that 提高编码效率。

**Acceptance Criteria:**

**Given** 用户打开.rs或.ts文件
**When** 查看底部状态栏
**Then** 显示LSP初始化状态

**Given** 用户在编辑器中输入代码
**When** 暂停输入
**Then** 实时显示补全候选列表
**And** 包含方法签名和文档

**Given** 用户悬停在符号上
**When** 悬停操作
**Then** 显示类型信息和文档

**Given** 用户按F12
**When** 光标在符号上
**Then** 跳转到定义

**Given** 用户按Shift+F12
**When** 光标在符号上
**Then** 查找所有引用

**Given** 代码有错误或警告
**When** 查看编辑器
**Then** 错误和警告以波浪线突出显示
**And** 出现在"问题"面板中

## Epic 3: AI功能（BYOK）

### 目标
实现AI辅助功能，支持用户自带API密钥，提供聊天、代码补全和Agent模式。

#### Story 3.1: AI模型配置

As a 个人开发者,
I want 在设置页面配置AI模型,
So that 使用自己的AI服务。

**Acceptance Criteria:**

**Given** 用户打开设置页面
**When** 进入AI配置部分
**Then** 提供表单：API Key（密码框）、Base URL、Model名称

**Given** 用户填写配置
**When** 点击"测试连接"按钮
**Then** 发送简单请求
**And** 返回成功或失败提示

**Given** 用户配置完成
**When** 刷新页面
**Then** Key不持久化，需重新输入

**Given** 用户有多个模型
**When** 添加配置
**Then** 可添加多个模型配置
**And** 选择一个作为"当前活跃模型"

**Given** 用户查看日志
**When** 检查日志内容
**Then** 日志和网络面板中不暴露明文API Key

#### Story 3.2: AI聊天面板

As a 个人开发者,
I want 通过侧边栏聊天窗口与AI对话,
So that 获取代码建议和帮助。

**Acceptance Criteria:**

**Given** 用户打开IDE
**When** 点击AI面板按钮
**Then** 侧边栏打开AI Chat面板

**Given** 用户在输入框中
**When** 输入内容
**Then** 支持普通文本和@file:path引用文件
**And** 支持@selection引用当前选中的代码

**Given** 用户发送消息
**When** AI响应
**Then** AI回复以流式方式逐字显示

**Given** 用户有对话历史
**When** 查看面板
**Then** 对话历史在同一个会话内保留
**And** 支持新建会话和清空历史

**Given** 用户未配置AI Key
**When** 打开AI面板
**Then** 显示引导提示"请先在设置中配置AI"

#### Story 3.3: AI内联代码补全

As a 个人开发者,
I want AI内联代码建议,
So that 更快完成代码行。

**Acceptance Criteria:**

**Given** 用户在编辑器中输入代码
**When** 暂停输入500ms
**Then** 自动触发补全请求

**Given** AI返回建议
**When** 查看编辑器
**Then** 建议以幽灵文本形式显示在当前光标位置

**Given** 用户看到建议
**When** 按Tab
**Then** 接受建议

**Given** 用户看到建议
**When** 按Esc
**Then** 取消建议

**Given** 用户打开设置
**When** 找到AI选项
**Then** 可通过开关启用/禁用该功能

#### Story 3.4: Agent模式

As a 个人开发者,
I want AI Agent自动执行任务,
So that 提高开发效率。

**Acceptance Criteria:**

**Given** 用户在AI面板中
**When** 开启Agent模式
**Then** AI可以自主读取文件和搜索代码

**Given** AI决定修改文件
**When** 准备操作
**Then** 编辑器自动显示diff预览
**And** 弹出确认对话框

**Given** 用户看到确认对话框
**When** 做出选择
**Then** 可逐个批准或拒绝
**And** 可一次性全部批准

**Given** Agent执行操作
**When** 完成操作
**Then** 所有操作记录在活动日志中

## Epic 4: Skill系统

### 目标
实现Skill插件系统，支持社区贡献者扩展AI能力。

#### Story 4.1: Skill开发与加载

As a 社区贡献者,
I want 编写.skill.md文件,
So that 为AI增加新能力。

**Acceptance Criteria:**

**Given** 用户需要开发Skill
**When** 查看文档
**Then** 提供清晰的Skill规范文档
**And** 定义YAML元数据和Markdown指令

**Given** 用户创建.skill.md文件
**When** 放入指定目录
**Then** 放入~/.lapdev/skills/（全局）生效
**And** 放入.lapdev/skills/（项目级）生效
**And** 重启或重新加载后生效

**Given** 用户使用CLI
**When** 执行命令
**Then** 通过lapdev skill install <name>安装官方Skill

**Given** Skill加载成功
**When** AI接收请求
**Then** Skill指令注入到系统提示中

#### Story 4.2: Skill自动匹配

As a 个人开发者,
I want AI自动启用合适的Skill,
So that 获得相关帮助。

**Acceptance Criteria:**

**Given** 用户发送请求
**When** AI接收请求
**Then** 扫描已加载Skill的描述

**Given** Skill匹配度计算
**When** 超过阈值（>0.7）
**Then** 自动激活该Skill

**Given** Skill已激活
**When** 用户操作
**Then** 可手动禁用已激活的Skill

## Epic 5: BMAD敏捷方法论支持

### 目标
集成BMAD敏捷工作流，支持一键启用和离线降级。

#### Story 5.1: BMAD一键启用

As a 个人开发者,
I want 一键启用BMAD工作流,
So that 使用敏捷开发方法。

**Acceptance Criteria:**

**Given** 用户打开项目
**When** 项目根目录无_bmad文件夹
**Then** BMAD面板显示"启用BMAD工作流"按钮

**Given** 用户点击按钮
**When** 执行安装
**Then** 系统首先尝试执行npx bmad-method install

**Given** 在线安装成功
**When** 安装完成
**Then** 项目下生成完整的_bmad目录
**And** Skill注册表自动添加BMAD相关技能

#### Story 5.2: BMAD离线降级

As a 个人开发者,
I want 在网络不可用时仍使用BMAD,
So that 继续工作。

**Acceptance Criteria:**

**Given** 在线安装失败
**When** 网络或Node.js不可用
**Then** 系统自动切换至降级策略

**Given** 降级模式激活
**When** 安装执行
**Then** 内置简化版BMAD文件写入项目_bmad/core/目录
**And** 包含quick-flow工作流
**And** 包含developer和pm智能体

**Given** 降级安装完成
**When** 启动IDE
**Then** AI面板自动加载bmad-quick-flow技能

## Epic 6: 部署与国内环境适配

### 目标
支持Podman部署和国内环境适配，确保在国内网络环境中流畅运行。

#### Story 6.1: Podman原生支持

As a 团队负责人,
I want 使用Podman部署Lapdev,
So that 简化部署流程。

**Acceptance Criteria:**

**Given** 用户获取项目
**When** 查看项目根目录
**Then** 提供podman-compose.yml文件
**And** 一键启动Lapdev及其依赖

**Given** 用户需要配置
**When** 执行脚本
**Then** 提供scripts/setup_podman.sh
**And** 自动化安装Podman、配置镜像加速

**Given** 用户有Docker镜像
**When** 使用Podman
**Then** Dockerfile构建的镜像可直接在Podman中使用

**Given** 用户需要文档
**When** 查看文档
**Then** 明确说明如何配置国内镜像源
**And** 说明如何加载离线镜像包

#### Story 6.2: 国内代码托管与社区

As a 个人开发者,
I want 代码和社区资源在国内高速访问,
So that 提升开发体验。

**Acceptance Criteria:**

**Given** 用户访问仓库
**When** 选择托管平台
**Then** Lapdev主仓库托管在Gitee
**And** 提供稳定快速的Git操作和Issue/PR入口

**Given** 用户在GitHub
**When** 查看仓库
**Then** GitHub仓库通过Gitee镜像功能自动同步

**Given** 代码提交
**When** 触发CI
**Then** Gitee仓库启用DevOps CI
**And** 自动化测试和构建镜像