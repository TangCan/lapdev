# 构建状态监控指南

## 1. GitHub Actions 监控

### 查看当前运行的 Actions
```bash
# 使用 GitHub CLI（需要先安装 gh）
gh run list --repo TangCan/lapdev

# 查看最近的运行
gh run list --repo TangCan/lapdev --limit 10

# 查看特定运行的详细信息
gh run view <run-id> --repo TangCan/lapdev

# 查看运行日志
gh run view <run-id> --repo TangCan/lapdev --log
```

### 本地监控脚本
```bash
#!/bin/bash
# monitor-build.sh
REPO="TangCan/lapdev"

echo "=== 最近的 GitHub Actions 运行 ==="
gh run list --repo $REPO --limit 5 --json status,state,createdAt,name,databaseId

echo -e "\n=== 当前正在运行的构建 ==="
gh run list --repo $REPO --json status,state,createdAt,name,databaseId | jq -r '.[] | select(.status == "in_progress")'

echo -e "\n=== 最近失败的构建 ==="
gh run list --repo $REPO --json status,state,createdAt,name,databaseId | jq -r '.[] | select(.state == "failure")'
```

## 2. 本地构建监控

### 监控 release.sh 脚本
```bash
# 实时查看构建日志
tail -f /tmp/lapdev-release.log &

# 运行构建（输出到日志）
./scripts/release.sh build 2>&1 | tee /tmp/lapdev-release.log

# 查看当前运行的构建进程
ps aux | grep release.sh
ps aux | grep docker | grep build
```

### 监控 Docker 构建进度
```bash
# 查看当前 Docker 构建任务
docker buildx du

# 查看 Docker 构建日志
docker buildx logs

# 查看实时容器
docker stats

# 查看构建缓存
docker system df
```

## 3. 阿里云 ACR 监控

### 使用阿里云 CLI
```bash
# 安装阿里云 CLI
curl -sSL https://oss-cli.oss-cn-hangzhou.aliyuncs.com/ossutil-installer.sh | sudo bash

# 查看镜像仓库状态
aliyun cr GetRepoList --InstanceId <instance-id>

# 查看镜像标签
aliyun cr GetRepoTags --InstanceId <instance-id> --RepoName <repo-name>
```

### 使用 Docker 命令
```bash
# 查看本地镜像
docker images | grep lapdev

# 检查镜像推送进度
docker push registry.cn-guangzhou.aliyuncs.com/lapdev/lapdev:tag --progress=plain
```

## 4. 实用监控脚本

### 实时构建监控
```bash
#!/bin/bash
# build-watcher.sh
while true; do
    echo "=== $(date) ==="
    echo "GitHub Actions:"
    gh run list --repo TangCan/lapdev --limit 3 --json status,name,startedAt | jq -r '.[] | "\(.name) - \(.status) - \(.startedAt)"'
    
    echo -e "\nDocker containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo -e "\nLocal processes:"
    ps aux | grep -E "(release\.sh|docker.*build)" | grep -v grep
    
    echo -e "\nPress Ctrl+C to stop monitoring\n"
    sleep 10
done
```

## 5. Web 界面监控

### GitHub Actions Dashboard
- URL: https://github.com/TangCan/lapdev/actions
- 显示所有工作流运行状态
- 可点击查看详情和日志

### 阿里云 ACR 控制台
- URL: https://cr.console.aliyun.com/
- 显示镜像仓库状态
- 显示推送历史和镜像列表

## 6. 通知设置

### GitHub 通知
- 在仓库设置中启用 Action 通知
- 邮件或 Slack 通知构建状态

### 钉钉/企业微信群机器人（阿里云）
- 在阿里云控制台配置 Webhook
- 接收 ACR 构建通知
```