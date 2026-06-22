#!/bin/bash

# ========================================
# Lapdev 脚本配置文件
# ========================================
# 所有脚本共享的配置定义
# 修改端口时，只需更新此文件或 .env.ports
# 其他脚本通过 source 此文件获取配置

# ========================================
# 服务端口配置
# ========================================

# 后端 API 端口
BACKEND_PORT=${BACKEND_PORT:-3333}

# 前端开发服务器端口
FRONTEND_PORT=${FRONTEND_PORT:-5173}

# 前端生产服务器端口
FRONTEND_PROD_PORT=${FRONTEND_PROD_PORT:-8080}

# 容器内部端口
CONTAINER_PORT=${CONTAINER_PORT:-3333}

# 宿主机前端端口映射
HOST_FRONTEND_PORT=${HOST_FRONTEND_PORT:-8080}

# 宿主机后端端口映射
HOST_BACKEND_PORT=${HOST_BACKEND_PORT:-3333}

# ========================================
# URL 配置
# ========================================

# 后端基础 URL
BACKEND_URL="http://localhost:${BACKEND_PORT}"

# 前端基础 URL（动态）
FRONTEND_URL=""

# ========================================
# CORS 配置
# ========================================

# 允许的前端源
ALLOWED_ORIGINS="http://localhost:${BACKEND_PORT},http://localhost:${FRONTEND_PORT},http://localhost:5174,http://localhost:5175,http://127.0.0.1:${BACKEND_PORT},http://127.0.0.1:${FRONTEND_PORT}"

# ========================================
# 目录配置
# ========================================

# 项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# 后端目录
BACKEND_DIR="${PROJECT_ROOT}/backend"

# 前端目录
FRONTEND_DIR="${PROJECT_ROOT}/frontend"

# 工作区目录
WORKSPACE_PATH="${WORKSPACE_PATH:-${PROJECT_ROOT}/workspace}"

# ========================================
# 容器配置
# ========================================

# 镜像名称
IMAGE_NAME="lapdev"

# 默认版本
VERSION="1.1.0"

# ========================================
# 超时配置（秒）
# ========================================

# 服务启动超时
STARTUP_TIMEOUT=${STARTUP_TIMEOUT:-30}

# 健康检查超时
HEALTH_CHECK_TIMEOUT=${HEALTH_CHECK_TIMEOUT:-10}
