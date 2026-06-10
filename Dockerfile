# ========================================
# Lapdev Production Docker Image
# Multi-stage build for optimized size
# ========================================

# Stage 1: Frontend Build
FROM docker.io/library/node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# 复制前端依赖文件
COPY frontend/package*.json ./

# 安装前端依赖（使用国内镜像加速）
# 注意：构建需要安装所有依赖（包括开发依赖）来进行 TypeScript 编译
RUN npm config set registry https://registry.npmmirror.com && \
    npm config set fetch-retry-maxtimeout 60000 && \
    npm install --prefer-offline --no-audit

# 复制前端源代码
COPY frontend/ ./

# 构建前端
RUN npm run build

# Stage 2: Backend Build
FROM docker.io/denoland/deno:alpine-1.42.0 AS backend-builder

WORKDIR /app/backend

# 复制后端源代码
COPY backend/ ./

# 预缓存依赖（使用 deno cache 来缓存依赖）
RUN deno cache src/main.ts

# Stage 3: Production Runtime
FROM docker.io/library/alpine:3.19 AS production

# 安装运行时依赖
RUN apk add --no-cache \
    bash \
    curl \
    git \
    nodejs \
    npm \
    && rm -rf /var/cache/apk/*

# 创建非 root 用户
RUN addgroup -g 1001 -S lapdev && \
    adduser -S lapdev -u 1001 -G lapdev

# 安装 Deno（Alpine 兼容版本）
RUN apk add --no-cache deno

WORKDIR /app

# 从构建阶段复制构建产物
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
COPY --from=backend-builder /app/backend ./backend

# 复制 BMAD 核心文件（离线支持）
COPY _bmad ./_bmad

# 复制配置文件
COPY package*.json ./

# 设置工作区目录
RUN mkdir -p /workspace && chown -R lapdev:lapdev /workspace
VOLUME /workspace

# 设置环境变量
ENV NODE_ENV=production \
    WORKSPACE_PATH=/workspace \
    PORT=8080 \
    DENO_PORT=3000

# 设置权限
RUN chown -R lapdev:lapdev /app

# 切换到非 root 用户
USER lapdev

# 暴露端口
EXPOSE 8080 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# 启动命令
CMD ["deno", "run", "--no-lock", "-A", "backend/src/main.ts"]

# ========================================
# Build Instructions:
#   docker build -t lapdev:latest .
#   docker build -t lapdev:v1.0.0 .
#
# Run:
#   docker run -d -p 8080:8080 -p 3000:3000 \
#     -v $(pwd)/workspace:/workspace \
#     lapdev:latest
# ========================================
