# Lapdev Podman 部署指南

## 概述

本文档介绍如何使用 Podman 部署 Lapdev IDE。Podman 是一个无守护进程的容器引擎，比 Docker 更安全且更轻量。

## 前置要求

- Podman 4.0+
- podman-compose
- 至少 2GB 内存
- 至少 10GB 磁盘空间

## 快速开始

### 1. 使用自动化脚本安装

```bash
# 下载并执行安装脚本
curl -fsSL https://raw.githubusercontent.com/lapdev/lapdev/main/scripts/setup_podman.sh | bash

# 重新登录或执行
newgrp podman
```

### 2. 手动安装（如果脚本不适用）

#### CentOS/RHEL

```bash
sudo dnf install -y podman podman-compose
```

#### Debian/Ubuntu

```bash
sudo apt-get update
sudo apt-get install -y podman podman-compose
```

## 配置国内镜像源

### 方法一：使用安装脚本（推荐）

安装脚本会自动配置国内镜像源。

### 方法二：手动配置

编辑 `/etc/containers/registries.conf`：

```toml
[[registry]]
prefix = "docker.io"
location = "docker.io"

[[registry.mirror]]
location = "registry.cn-hangzhou.aliyuncs.com"
```

## 启动服务

```bash
# 进入项目目录
cd lapdev

# 启动服务（后台模式）
podman-compose up -d

# 查看日志
podman-compose logs -f
```

## 访问服务

- **前端**: http://localhost:8080
- **API**: http://localhost:3000

## 使用离线镜像包

如果网络受限，可以使用离线镜像包：

```bash
# 加载离线镜像
podman load -i lapdev-offline.tar.gz

# 启动服务
podman-compose up -d
```

## 停止服务

```bash
# 停止服务
podman-compose down

# 停止并删除数据
podman-compose down -v
```

## 配置说明

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| WORKSPACE_PATH | /workspace | 工作区目录路径 |
| PORT | 8080 | 前端端口 |
| API_PORT | 3000 | API端口 |
| NODE_ENV | production | 运行环境 |

### 目录结构

```
lapdev/
├── podman-compose.yml    # Compose配置
├── Dockerfile            # 镜像构建文件
├── scripts/
│   └── setup_podman.sh   # 安装脚本
└── workspace/            # 工作区目录
```

## 故障排除

### 权限问题

```bash
# 确保当前用户在podman组中
sudo usermod -aG podman $USER
newgrp podman
```

### 端口占用

```bash
# 检查端口占用
podman ps

# 停止占用端口的容器
podman stop <container-id>
```

### 镜像拉取失败

确保已正确配置国内镜像源，或使用离线镜像包。

## 常见命令

```bash
# 查看运行中的容器
podman ps

# 查看容器日志
podman logs lapdev

# 进入容器
podman exec -it lapdev bash

# 查看镜像
podman images

# 删除镜像
podman rmi lapdev:latest
```