---
stepsCompleted: [1, 2]
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

## 3. 架构决策记录

_待补充：架构决策将在此逐步记录_