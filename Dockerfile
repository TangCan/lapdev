# ========================================
# Lapdev Production Docker Image
# 支持条件化使用国内镜像源加速
# ========================================

# Stage 1: Frontend Build
FROM docker.io/library/node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# 使用条件化的 npm 镜像源和代理配置
ARG NPM_REGISTRY=https://registry.npmmirror.com
ARG NPM_PROXY=
ARG NPM_HTTPS_PROXY=
COPY frontend/package*.json ./
RUN npm config set registry ${NPM_REGISTRY} && \
    ([ -z "$NPM_PROXY" ] || npm config set proxy ${NPM_PROXY}) && \
    ([ -z "$NPM_HTTPS_PROXY" ] || npm config set https-proxy ${NPM_HTTPS_PROXY}) && \
    npm install --prefer-offline --no-audit

COPY frontend/ ./
RUN npm run build

# Stage 2: Rust Base（缓存层）
FROM docker.io/library/node:20-slim AS rust-base

# 使用条件化的 Debian 源和 Rust 镜像
ARG USE_CN_MIRROR=true
ARG DEBIAN_MIRROR=mirrors.aliyun.com
ARG RUSTUP_URL=https://rsproxy.cn/rustup-init.sh

# 根据参数决定是否使用国内源
RUN if [ "$USE_CN_MIRROR" = "true" ]; then \
      if [ -f /etc/apt/sources.list ]; then \
        sed -i "s/deb.debian.org/${DEBIAN_MIRROR}/g" /etc/apt/sources.list; \
      fi; \
      if [ -f /etc/apt/sources.list.d/debian.sources ]; then \
        sed -i "s/deb.debian.org/${DEBIAN_MIRROR}/g" /etc/apt/sources.list.d/debian.sources; \
      fi; \
    fi && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 根据参数决定使用哪个 Rust 安装脚本
RUN if [ "$USE_CN_MIRROR" = "true" ]; then \
      curl --proto '=https' --tlsv1.2 -sSf ${RUSTUP_URL} | sh -s -- -y --default-toolchain stable --profile minimal; \
    else \
      curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable --profile minimal; \
    fi
ENV PATH="/root/.cargo/bin:${PATH}"

# Stage 3: Production Runtime
FROM rust-base AS production

WORKDIR /app

# 从构建阶段复制产物
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
COPY backend/ ./backend

# 复制 Deno（由 build.sh 或 CI 提前准备）
COPY deno /usr/local/bin/deno
RUN chmod +x /usr/local/bin/deno && deno --version

# 创建 Deno 缓存目录（用于运行时下载依赖）
RUN mkdir -p /root/.cache/deno

# 复制其他文件
COPY _bmad ./_bmad
COPY package*.json ./

# 创建用户和工作区
RUN groupadd -g 1001 lapdev && \
    useradd -m -u 1001 -g lapdev lapdev && \
    mkdir -p /workspace && \
    chown -R lapdev:lapdev /workspace /app

# 设置环境变量
ENV NODE_ENV=production \
    WORKSPACE_PATH=/workspace \
    PORT=3333 \
    DENO_PORT=3333

USER lapdev
EXPOSE 3333

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD NO_PROXY=localhost,127.0.0.1 curl -f http://localhost:3333/health || exit 1

CMD ["deno", "run", "--no-lock", "-A", "backend/src/main.ts"]

# ========================================
# Build Instructions:
# 
# 默认使用国内源（适合本地构建）:
#   ./scripts/release.sh build
#   
# 使用国外源（适合 GitHub Actions）:
#   docker build --build-arg USE_CN_MIRROR=false --build-arg NPM_REGISTRY=https://registry.npmjs.org -t lapdev:latest .
#
# 所有可选构建参数:
#   - USE_CN_MIRROR: 是否使用国内镜像源 (default: true)
#   - NPM_REGISTRY: npm 镜像源 (default: https://registry.npmmirror.com)
#   - DEBIAN_MIRROR: Debian 镜像源 (default: mirrors.aliyun.com)
#   - RUSTUP_URL: Rust 安装脚本地址 (default: https://rsproxy.cn/rustup-init.sh)
# ========================================
