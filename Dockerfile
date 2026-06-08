FROM denoland/deno:alpine-1.42.0

WORKDIR /app

# 安装依赖
RUN apk add --no-cache \
    bash \
    curl \
    git \
    && rm -rf /var/cache/apk/*

# 复制项目文件
COPY . .

# 设置工作区目录
RUN mkdir -p /workspace

# 设置环境变量
ENV NODE_ENV=production
ENV WORKSPACE_PATH=/workspace

# 构建前端
WORKDIR /app/frontend
RUN npm install && npm run build

# 构建后端
WORKDIR /app/backend
RUN deno cache --allow-all src/main.ts

# 暴露端口
EXPOSE 8080 3000

# 启动命令
WORKDIR /app
CMD ["deno", "run", "--allow-all", "backend/src/main.ts"]