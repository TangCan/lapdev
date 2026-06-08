# Lapdev 发布指南

## 版本信息

- **当前版本**: v1.0.0
- **发布日期**: 2026-06-08
- **Git Tag**: v1.0.0

## 发布前检查清单

### ✅ 代码质量

- [x] 所有单元测试通过 (33/33)
- [x] 所有集成测试通过
- [x] 所有性能测试通过 (NFR 验证)
- [x] 所有 UAT 测试通过 (13/13)
- [x] 代码审查完成

### ✅ 功能完整性

- [x] Epic 1-6 全部完成
- [x] 17 个 Story 全部完成
- [x] 36 个功能需求全部实现
- [x] 4 个非功能需求全部达标
- [x] 5 个验收标准全部通过

### ✅ 文档完整性

- [x] README.md
- [x] README.Docker.md
- [x] 性能测试报告
- [x] 发布说明

## 构建 Docker 镜像

### 方案 A: 使用 Docker

```bash
# 1. 安装 Docker (如未安装)
# Ubuntu/Debian:
sudo apt-get update
sudo apt-get install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker

# 2. 构建镜像
docker build -t lapdev:latest -t lapdev:v1.0.0 .

# 3. 验证镜像
docker images lapdev

# 4. 测试镜像
docker run -d --rm -p 8080:8080 --name lapdev-test lapdev:latest
sleep 10
curl http://localhost:8080/health
docker stop lapdev-test
```

### 方案 B: 使用 Podman

```bash
# 1. 安装 Podman (如未安装)
# Ubuntu/Debian:
sudo apt-get update
sudo apt-get install -y podman

# 2. 构建镜像
podman build -t lapdev:latest -t lapdev:v1.0.0 .

# 3. 验证镜像
podman images lapdev

# 4. 测试镜像
podman run -d --rm -p 8080:8080 --name lapdev-test lapdev:latest
sleep 10
curl http://localhost:8080/health
podman stop lapdev-test
```

### 方案 C: 使用构建脚本

```bash
# 1. 运行构建脚本
./scripts/release.sh build

# 2. 运行测试
./scripts/release.sh test

# 3. 查看镜像
docker images lapdev
```

## 推送到镜像仓库

### Gitee 镜像仓库

```bash
# 1. 登录 Gitee 镜像仓库
export DOCKER_REGISTRY_USER=your-gitee-username
export DOCKER_REGISTRY_PASSWORD=your-gitee-password

# 2. 标记镜像
docker tag lapdev:latest registry.gitee.com/your-namespace/lapdev:latest
docker tag lapdev:v1.0.0 registry.gitee.com/your-namespace/lapdev:v1.0.0

# 3. 推送镜像
docker push registry.gitee.com/your-namespace/lapdev:latest
docker push registry.gitee.com/your-namespace/lapdev:v1.0.0

# 或使用脚本
./scripts/release.sh push
```

### Docker Hub

```bash
# 1. 登录 Docker Hub
docker login

# 2. 标记镜像
docker tag lapdev:latest your-dockerhub-username/lapdev:latest
docker tag lapdev:v1.0.0 your-dockerhub-username/lapdev:v1.0.0

# 3. 推送镜像
docker push your-dockerhub-username/lapdev:latest
docker push your-dockerhub-username/lapdev:v1.0.0
```

### GitHub Container Registry (GHCR)

```bash
# 1. 登录 GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u your-github-username --password-stdin

# 2. 标记镜像
docker tag lapdev:latest ghcr.io/your-github-username/lapdev:latest
docker tag lapdev:v1.0.0 ghcr.io/your-github-username/lapdev:v1.0.0

# 3. 推送镜像
docker push ghcr.io/your-github-username/lapdev:latest
docker push ghcr.io/your-github-username/lapdev:v1.0.0
```

## 创建 Git Tag

```bash
# 1. 创建版本标签
git tag -a v1.0.0 -m "Lapdev v1.0.0 - Initial Release"

# 2. 推送标签到 Gitee
git push origin v1.0.0

# 3. 推送所有标签
git push origin --tags
```

## 发布到 Gitee Release

1. 访问 Gitee 项目页面
2. 进入 "发布" 标签
3. 创建新发布
4. 填写发布信息：
   - 版本号：v1.0.0
   - 发布标题：Lapdev v1.0.0 - AI 驱动的开发环境
   - 发布说明：使用 RELEASE_NOTES_v1.0.0.md 内容
5. 上传附件（可选）：
   - Docker 镜像导出文件
   - 文档 PDF
6. 点击"发布"

## 导出 Docker 镜像（离线分发）

```bash
# 1. 保存镜像为 tar 文件
docker save -o lapdev-v1.0.0.tar lapdev:v1.0.0

# 2. 压缩（可选）
gzip lapdev-v1.0.0.tar

# 3. 加载镜像（在其他机器上）
docker load -i lapdev-v1.0.0.tar
# 或
podman load -i lapdev-v1.0.0.tar
```

## 验证发布

### 镜像验证

```bash
# 检查镜像大小
docker images lapdev:v1.0.0

# 检查镜像历史
docker history lapdev:v1.0.0

# 扫描镜像漏洞
docker scan lapdev:v1.0.0
# 或
trivy image lapdev:v1.0.0
```

### 功能验证

```bash
# 1. 启动容器
docker run -d -p 8080:8080 -p 3000:3000 \
  -v $(pwd)/workspace:/workspace \
  lapdev:v1.0.0

# 2. 访问应用
# 浏览器打开：http://localhost:8080

# 3. 测试 API
curl http://localhost:8080/health
curl http://localhost:8080/api/v1/files/tree

# 4. 查看日志
docker logs -f <container-id>
```

## 回滚方案

如需回滚到旧版本：

```bash
# 1. 停止当前容器
docker stop lapdev

# 2. 删除容器
docker rm lapdev

# 3. 启动旧版本
docker run -d -p 8080:8080 -p 3000:3000 \
  -v $(pwd)/workspace:/workspace \
  lapdev:previous-version
```

## 发布后检查

- [ ] Docker 镜像已推送到所有目标仓库
- [ ] Git 标签已创建并推送
- [ ] Gitee Release 已发布
- [ ] 文档已更新
- [ ] 团队已通知
- [ ] 监控已配置

## 联系支持

如有问题，请联系：
- Email: support@lapdev.dev
- Issues: https://gitee.com/your-namespace/lapdev/issues
