# Lapdev 用户指南

> **版本**: v1.0.0  
> **最后更新**: 2026-06-10

---

## 📖 目录

1. [简介](#1-简介)
2. [快速开始](#2-快速开始)
3. [核心功能](#3-核心功能)
4. [AI 功能](#4-ai-功能)
5. [BMAD 工作流](#5-bmad-工作流)
6. [部署指南](#6-部署指南)
7. [故障排除](#7-故障排除)

---

## 1. 简介

### 1.1 什么是 Lapdev？

**Lapdev** 是一个 AI 驱动的 Web IDE（集成开发环境），让你可以在浏览器中编写、运行和协作代码。

### 1.2 核心特性

| 特性 | 描述 |
|------|------|
| 🌳 文件树 | 直观的项目文件浏览和管理 |
| ✏️ 代码编辑器 | 现代代码编辑器，支持语法高亮 |
| 💻 内置终端 | 浏览器内运行的命令行终端 |
| 📊 Git 可视化 | 直观的版本控制界面 |
| 🤖 AI 助手 | AI 代码补全和聊天功能 |
| ⚡ BMAD 工作流 | AI 驱动的开发方法论 |

### 1.3 系统要求

- **浏览器**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **网络**: 需要访问 AI API（OpenAI/DeepSeek/Anthropic）
- **容器**: Docker 或 Podman（本地运行）

---

## 2. 快速开始

### 2.1 方式一：使用 Docker（推荐）

```bash
# 拉取并运行镜像
docker run -d \
  --name lapdev \
  -p 8080:8080 \
  -p 3000:3000 \
  -v $(pwd)/workspace:/workspace \
  crpi-ygp4wzq7icdrlm64.cn-shenzhen.personal.cr.aliyuncs.com/lapdev/lapdev:main

# 访问应用
open http://localhost:8080
```

### 2.2 方式二：使用 Podman

```bash
# 运行镜像
podman run -d \
  --name lapdev \
  -p 8080:8080 \
  -p 3000:3000 \
  -v $(pwd)/workspace:/workspace \
  crpi-ygp4wzq7icdrlm64.cn-shenzhen.personal.cr.aliyuncs.com/lapdev/lapdev:main

# 访问应用
open http://localhost:8080
```

### 2.3 方式三：使用 Docker Compose

创建 `docker-compose.yml`:

```yaml
version: '3.8'
services:
  lapdev:
    image: crpi-ygp4wzq7icdrlm64.cn-shenzhen.personal.cr.aliyuncs.com/lapdev/lapdev:main
    ports:
      - "8080:8080"
      - "3000:3000"
    volumes:
      - ./workspace:/workspace
    restart: unless-stopped
```

运行：

```bash
docker-compose up -d
open http://localhost:8080
```

---

## 3. 核心功能

### 3.1 文件树

文件树位于界面左侧，显示项目目录结构。

**操作：**
- **展开/折叠**: 点击文件夹或使用箭头键
- **创建文件**: 右键菜单 → "新建文件"
- **创建文件夹**: 右键菜单 → "新建文件夹"
- **重命名**: 右键菜单 → "重命名"
- **删除**: 右键菜单 → "删除"（会显示确认对话框）
- **刷新**: 点击刷新按钮

**快捷键：**
| 功能 | 快捷键 |
|------|--------|
| 聚焦文件树 | `Ctrl+1` |
| 新建文件 | `Ctrl+N` |
| 新建文件夹 | `Ctrl+Shift+N` |
| 搜索文件 | `Ctrl+P` |

### 3.2 代码编辑器

中央区域是功能完整的代码编辑器。

**特性：**
- 语法高亮（支持 50+ 语言）
- 行号显示
- 代码折叠
- 多标签页
- 自动保存

**快捷键：**
| 功能 | 快捷键 |
|------|--------|
| 保存 | `Ctrl+S` |
| 撤销 | `Ctrl+Z` |
| 重做 | `Ctrl+Shift+Z` |
| 查找 | `Ctrl+F` |
| 替换 | `Ctrl+H` |
| 跳转到行 | `Ctrl+G` |

### 3.3 内置终端

底部面板是可用的命令行终端。

**功能：**
- 支持 bash/sh 命令
- 历史命令（使用上下箭头）
- 支持多标签页
- 支持复制粘贴

**常用命令：**
```bash
# 查看文件
ls -la

# 创建项目
mkdir my-project
cd my-project

# Git 操作
git init
git status

# 安装依赖
npm install
pip install -r requirements.txt
```

### 3.4 Git 版本控制

**Git 面板** 位于右侧边栏，显示当前仓库状态。

**功能：**
- 查看已修改文件
- 查看暂存区
- 查看提交历史
- 执行 commit、push、pull 等操作

**工作流程：**
1. 修改文件
2. 在 Git 面板查看变更
3. 选择要暂存的文件
4. 填写提交信息
5. 点击 "Commit"
6. 如需推送，点击 "Push"

---

## 4. AI 功能

### 4.1 配置 AI 模型

首次使用时，需要配置 AI API。

**步骤：**
1. 点击左下角 **设置图标**
2. 选择 **AI 设置** 标签
3. 选择模型提供商：
   - **OpenAI**: 需要 OpenAI API Key
   - **DeepSeek**: 需要 DeepSeek API Key
   - **Anthropic**: 需要 Anthropic API Key
4. 输入 API Key
5. 点击 **保存**

### 4.2 AI 聊天面板

**打开方式**: 点击工具栏的 **AI 图标** 或 `Ctrl+Shift+A`

**功能：**
- 提问关于代码的问题
- 请求代码解释
- 请求代码审查
- 生成文档注释

**示例问题：**
```
- "这段代码是做什么的？"
- "帮我优化这个函数"
- "为什么这段代码报错？"
```

### 4.3 AI 代码补全

编辑器自动提供 AI 代码补全建议。

**触发方式：**
- 开始输入代码后，自动显示建议
- 按 `Tab` 接受建议
- 按 `Esc` 拒绝建议

### 4.4 Agent 模式

Agent 模式允许 AI 执行更复杂的任务。

**功能：**
- 执行多步骤任务
- 创建和修改多个文件
- 运行终端命令
- Git 操作

**启动 Agent 模式：**
1. 打开 AI 聊天面板
2. 输入 `/agent` 或选择 "Agent 模式"
3. 描述你要完成的任务
4. AI 将逐步执行并报告进度

---

## 5. BMAD 工作流

BMAD（Business Model-driven AI Development）是 Lapdev 的核心开发方法论。

### 5.1 启用 BMAD

**方式一：自动检测**
首次打开项目时，如果检测到 BMAD 配置文件，将提示启用。

**方式二：手动启用**
1. 点击左下角 **设置图标**
2. 选择 **BMAD** 标签
3. 点击 **启用 BMAD**

### 5.2 BMAD 核心概念

| 概念 | 描述 |
|------|------|
| **Epic** | 大的功能模块/里程碑 |
| **Story** | 可交付的用户功能 |
| **Skill** | AI 技能配置 |
| **Agent** | AI 执行者角色 |

### 5.3 创建新 Epic

1. 打开 BMAD 面板
2. 点击 **"新建 Epic"**
3. 输入 Epic 名称和描述
4. 系统自动创建 Epic 结构

### 5.4 创建新 Story

1. 在 Epic 内，点击 **"新建 Story"**
2. 填写用户故事模板：
   - **As a [角色]**
   - **I want [功能]**
   - **So that [收益]**
3. 定义验收标准
4. 开始开发

### 5.5 Skill 自动匹配

Lapdev 根据任务类型自动匹配相关 Skill。

**示例：**
- 编写前端代码 → 匹配前端开发 Skill
- 数据分析任务 → 匹配数据分析 Skill
- 文档编写 → 匹配技术写作 Skill

---

## 6. 部署指南

### 6.1 环境变量配置

可以通过环境变量自定义 Lapdev 配置。

| 变量 | 默认值 | 描述 |
|------|--------|------|
| `PORT` | 8080 | 前端端口 |
| `API_PORT` | 3000 | API 端口 |
| `WORKSPACE` | /workspace | 工作区目录 |
| `AI_PROVIDER` | openai | AI 提供商 |
| `AI_API_KEY` | - | AI API Key |

### 6.2 Docker 部署示例

```bash
docker run -d \
  --name lapdev \
  -p 8080:8080 \
  -p 3000:3000 \
  -v /path/to/workspace:/workspace \
  -e AI_PROVIDER=deepseek \
  -e AI_API_KEY=your-api-key \
  crpi-ygp4wzq7icdrlm64.cn-shenzhen.personal.cr.aliyuncs.com/lapdev/lapdev:main
```

### 6.3 Nginx 反向代理配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 7. 故障排除

### 7.1 常见问题

#### Q: 镜像拉取失败？

```bash
# 检查镜像地址
docker pull crpi-ygp4wzq7icdrlm64.cn-shenzhen.personal.cr.aliyuncs.com/lapdev/lapdev:main

# 如果超时，配置 Docker 镜像加速
# 编辑 /etc/docker/daemon.json
{
  "registry-mirrors": ["https://mirror.ccs.tencentyun.com"]
}
```

#### Q: AI 功能不工作？

1. 检查 API Key 是否正确配置
2. 确认 API Key 有足够额度
3. 检查网络连接
4. 查看浏览器控制台错误信息

#### Q: 终端命令不执行？

1. 确认命令语法正确
2. 检查是否需要特定权限
3. 某些系统命令可能不可用

#### Q: 文件修改后没保存？

Lapdev 有自动保存功能，但如果手动关闭页面，可能来不及保存。请经常使用 `Ctrl+S` 手动保存。

### 7.2 获取帮助

- **GitHub Issues**: https://github.com/TangCan/lapdev/issues
- **文档**: 查看项目 README.md

### 7.3 日志查看

```bash
# 查看容器日志
docker logs lapdev

# 实时查看日志
docker logs -f lapdev

# 查看最近 100 行
docker logs --tail 100 lapdev
```

---

## 🎯 E2E 测试检查清单

完成以下测试以验证 Lapdev 功能：

### 基础功能测试

- [ ] 1.1 Docker/Podman 镜像启动成功
- [ ] 1.2 浏览器访问 http://localhost:8080
- [ ] 1.3 主页加载正常，无控制台错误

### 文件操作测试

- [ ] 2.1 文件树正确显示工作区目录
- [ ] 2.2 创建新文件成功
- [ ] 2.3 编辑文件内容并保存
- [ ] 2.4 删除文件成功
- [ ] 2.5 刷新后文件树更新

### 代码编辑器测试

- [ ] 3.1 打开文件，代码正确显示
- [ ] 3.2 语法高亮正常工作
- [ ] 3.3 撤销/重做功能正常
- [ ] 3.4 多标签页切换正常
- [ ] 3.5 搜索功能正常

### 终端测试

- [ ] 4.1 终端可输入命令
- [ ] 4.2 `ls` 命令正常执行
- [ ] 4.3 命令历史（上箭头）正常
- [ ] 4.4 支持多标签页

### Git 功能测试

- [ ] 5.1 Git 面板显示仓库状态
- [ ] 5.2 可以查看文件变更
- [ ] 5.3 可以提交变更
- [ ] 5.4 可以推送代码

### AI 功能测试

- [ ] 6.1 AI 设置面板可访问
- [ ] 6.2 可以配置 API Key
- [ ] 6.3 AI 聊天面板可打开
- [ ] 6.4 可以发送消息并获得回复
- [ ] 6.5 AI 代码补全正常工作

### BMAD 功能测试

- [ ] 7.1 BMAD 面板可访问
- [ ] 7.2 可以启用 BMAD
- [ ] 7.3 可以查看 Epic 列表
- [ ] 7.4 Skill 自动匹配功能正常

### 部署测试

- [ ] 8.1 健康检查端点正常：`curl http://localhost:3000/health`
- [ ] 8.2 API 响应正常

---

**祝你测试愉快！** 🚀
