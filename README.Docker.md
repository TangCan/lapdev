# Lapdev Docker 镜像

基于 Web 的 AI 驱动开发环境，内置 BMAD 工作流。

## 快速开始

### Docker 运行

```bash
# 拉取最新镜像
docker pull registry.gitee.com/lapdev/lapdev:latest

# 运行容器
docker run -d -p 8080:8080 -p 3000:3000 \
  -v $(pwd)/workspace:/workspace \
  registry.gitee.com/lapdev/lapdev:latest
```

### Docker Compose

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### Podman 运行

```bash
# 拉取镜像
podman pull registry.gitee.com/lapdev/lapdev:latest

# 运行容器
podman run -d -p 8080:8080 -p 3000:3000 \
  -v $(pwd)/workspace:/workspace \
  registry.gitee.com/lapdev/lapdev:latest
```

## 配置

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `production` |
| `WORKSPACE_PATH` | 工作区路径 | `/workspace` |
| `PORT` | HTTP 端口 | `8080` |
| `DENO_PORT` | Deno 端口 | `3000` |
| `OPENAI_API_KEY` | OpenAI API 密钥 | - |
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | - |
| `ANTHROPIC_API_KEY` | Anthropic API 密钥 | - |

### API 密钥配置

创建 `.env` 文件：

```bash
OPENAI_API_KEY=sk-your-openai-key
DEEPSEEK_API_KEY=your-deepseek-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
```

## 构建镜像

### 本地构建

```bash
# 构建镜像
docker build -t lapdev:latest .

# 指定版本
docker build -t lapdev:v1.1.0 --build-arg VERSION=1.1.0 .
```

### 使用发布脚本

```bash
# 构建
./scripts/release.sh build

# 测试
./scripts/release.sh test

# 推送
export DOCKER_REGISTRY_USER=your-username
export DOCKER_REGISTRY_PASSWORD=your-password
./scripts/release.sh push

# 完整发布流程
./scripts/release.sh release
```

## 多平台构建

```bash
# 启用 Buildx
docker buildx create --use

# 构建多平台镜像
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t lapdev:latest \
  --push \
  .
```

## 健康检查

```bash
# 检查容器健康状态
docker inspect --format='{{.State.Health.Status}}' <container-id>

# 测试健康端点
curl http://localhost:8080/health
```

## 镜像信息

- **基础镜像**: Alpine 3.19
- **Node.js**: 20.x
- **Deno**: 1.42.0
- **架构**: linux/amd64, linux/arm64
- **大小**: ~150MB（多阶段构建优化后）

## 安全最佳实践

1. **非 root 用户**: 容器以非 root 用户运行
2. **只读文件系统**: 生产环境可启用只读模式
3. **密钥管理**: 使用环境变量或密钥管理服务
4. **镜像扫描**: 定期扫描镜像漏洞

```bash
# 扫描镜像漏洞
docker scan lapdev:latest

# 使用 Trivy 扫描
trivy image lapdev:latest
```

## 故障排查

### 查看日志

```bash
docker logs <container-id>
```

### 进入容器

```bash
docker exec -it <container-id> /bin/bash
```

### 重启容器

```bash
docker restart <container-id>
```

### 重新构建

```bash
# 清除缓存
docker builder prune -a

# 重新构建
docker build --no-cache -t lapdev:latest .
```

## 许可证

MIT License
