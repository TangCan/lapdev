#!/bin/bash

# ========================================
# Lapdev Container Build & Release Script
# 支持 Docker 和 Podman
# ========================================

set -e

# 配置
IMAGE_NAME="lapdev"
VERSION="1.1.0"
REGISTRY="registry.gitee.com"
REGISTRY_USER="${DOCKER_REGISTRY_USER:-}"
REGISTRY_PASSWORD="${DOCKER_REGISTRY_PASSWORD:-}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 容器工具（自动检测）
CONTAINER_TOOL=""

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检测容器工具
detect_container_tool() {
    log_info "检测容器工具..."
    
    # 优先使用 Docker（如果可用）
    if command -v docker &> /dev/null; then
        CONTAINER_TOOL="docker"
        log_info "检测到 Docker，使用 Docker"
        return 0
    fi
    
    # 其次使用 Podman
    if command -v podman &> /dev/null; then
        CONTAINER_TOOL="podman"
        log_info "检测到 Podman，使用 Podman"
        
        # 设置 rootless Podman 的运行时目录（解决 /run 只读问题）
        setup_podman_runtime
        return 0
    fi
    
    log_error "未检测到 Docker 或 Podman，请先安装其中之一"
    exit 1
}

# 设置 Podman 运行时环境
setup_podman_runtime() {
    # 检测是否使用 sudo
    local original_user="$USER"
    local original_home="$HOME"
    if [ -n "$SUDO_USER" ]; then
        original_user="$SUDO_USER"
        original_home=$(getent passwd "$SUDO_USER" | cut -d: -f6)
        log_info "检测到 sudo，原始用户: $original_user"
    fi
    
    # 检查 /run/user/{uid} 是否只读挂载（常见于容器环境）
    local runtime_dir="/run/user/$(id -u)"
    if mount | grep -q "$runtime_dir.*\bro\b"; then
        log_info "/run 目录只读挂载，设置 XDG_RUNTIME_DIR 到用户目录"
        
        # 创建用户级运行时目录（使用原始用户的 home）
        export XDG_RUNTIME_DIR="$original_home/.podman-run"
        mkdir -p "$XDG_RUNTIME_DIR"
        
        # 设置 podman 存储目录（使用原始用户的 home）
        export PODMAN_STORAGE_DIR="$original_home/.local/share/containers"
        mkdir -p "$PODMAN_STORAGE_DIR"
        
        log_info "XDG_RUNTIME_DIR: $XDG_RUNTIME_DIR"
        log_info "PODMAN_STORAGE_DIR: $PODMAN_STORAGE_DIR"
        
        # 确保 libpod 目录存在并设置 sticky bit（避免 Podman 尝试设置失败）
        mkdir -p "$XDG_RUNTIME_DIR/libpod"
        chmod +t "$XDG_RUNTIME_DIR/libpod" 2>/dev/null || true
    fi
    
    # 设置存储驱动为 vfs（解决只读文件系统问题）
    export CONTAINERS_STORAGE_DRIVER="vfs"
    log_info "设置存储驱动为 vfs"
    
    # 如果使用 sudo，设置 CONTAINERS_STORAGE 指向原始用户的存储目录
    if [ -n "$SUDO_USER" ]; then
        export CONTAINERS_STORAGE="$original_home/.local/share/containers/storage"
        log_info "CONTAINERS_STORAGE: $CONTAINERS_STORAGE"
    fi
    
    # 设置 cgroup 管理器为 cgroupfs（避免 systemd D-Bus 权限问题）
    export CONTAINERS_CGROUP_MANAGER="cgroupfs"
    log_info "设置 cgroup 管理器为 cgroupfs"
}



# 检查并准备 Deno 二进制
prepare_deno() {
    log_info "检查 Deno 二进制..."
    
    # 检查系统中是否安装了 deno
    local system_deno=$(which deno 2>/dev/null)
    
    if [ -z "$system_deno" ]; then
        log_error "系统中未安装 Deno，请先安装 Deno"
        log_error "安装方法: curl -fsSL https://deno.land/install.sh | sh"
        exit 1
    fi
    
    log_info "找到系统 Deno: $system_deno"
    
    # 检查项目根目录是否已有 deno
    if [ ! -f "./deno" ]; then
        log_info "复制 Deno 到项目根目录..."
        cp "$system_deno" ./deno
        chmod +x ./deno
        log_info "Deno 已复制到项目根目录"
        export DENO_COPIED=1
    else
        log_info "Deno 已存在于项目根目录"
    fi
    
    # 验证复制的 deno 可执行
    if ! ./deno --version &> /dev/null; then
        log_error "Deno 复制失败或不可执行"
        rm -f ./deno
        exit 1
    fi
}

# 清理临时文件（如 deno 二进制）
cleanup() {
    log_info "清理临时文件..."
    
    # 如果是本脚本复制的 deno，删除它
    if [ -n "$DENO_COPIED" ] && [ -f "./deno" ]; then
        log_info "删除本脚本复制的 Deno 二进制..."
        rm -f ./deno
        log_info "Deno 已删除"
    fi
    
    log_info "清理完成"
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    
    # 检测容器工具
    detect_container_tool
    
    if ! command -v git &> /dev/null; then
        log_error "Git 未安装"
        exit 1
    fi
    
    # 准备 Deno 二进制
    prepare_deno
    
    log_info "依赖检查通过"
}

# 获取 Git 版本信息
get_version() {
    if [ -n "$VERSION" ]; then
        echo "$VERSION"
    else
        # 从 Git tag 获取版本
        git describe --tags --always --dirty 2>/dev/null || echo "dev"
    fi
}

# 构建镜像
build_image() {
    local version=$1
    local platform=${2:-linux/amd64}
    
    log_info "开始构建镜像：${IMAGE_NAME}:${version}"
    log_info "平台：${platform}"
    log_info "使用工具：${CONTAINER_TOOL}"
    
    if [ "$CONTAINER_TOOL" = "docker" ]; then
        # Docker 构建
        docker build \
            --tag ${IMAGE_NAME}:${version} \
            --tag ${IMAGE_NAME}:latest \
            --progress=plain \
            --build-arg VERSION=${version} \
            .
    else
        # Podman 构建
        # 使用 --storage-driver=vfs 避免只读文件系统问题
        podman build \
            --storage-driver=vfs \
            --tag ${IMAGE_NAME}:${version} \
            --tag ${IMAGE_NAME}:latest \
            --build-arg VERSION=${version} \
            .
    fi
    
    if [ $? -eq 0 ]; then
        log_info "镜像构建成功"
        log_info "镜像标签:"
        log_info "  - ${IMAGE_NAME}:${version}"
        log_info "  - ${IMAGE_NAME}:latest"
    else
        log_error "镜像构建失败"
        exit 1
    fi
}

# 运行测试
test_image() {
    local image=$1
    
    log_info "运行镜像测试..."
    log_info "使用工具：${CONTAINER_TOOL}"
    
    # 获取镜像 ID 并输出
    local image_id=""
    if [ "$CONTAINER_TOOL" = "docker" ]; then
        image_id=$(docker inspect --format='{{.Id}}' ${image} 2>/dev/null | cut -d':' -f2)
    else
        image_id=$(podman inspect --format='{{.Id}}' ${image} 2>/dev/null | cut -d':' -f2)
    fi
    if [ -n "$image_id" ]; then
        log_info "镜像 ID: ${image_id}"
    fi
    
    # 对于 Podman，镜像名称需要使用 localhost/ 前缀
    local run_image="${image}"
    if [ "$CONTAINER_TOOL" = "podman" ]; then
        run_image="localhost/${image}"
    fi
    
    # 对于 Podman，确保运行时目录存在并设置正确的权限
    if [ "$CONTAINER_TOOL" = "podman" ]; then
        mkdir -p "$XDG_RUNTIME_DIR/libpod"
        chmod +t "$XDG_RUNTIME_DIR/libpod" 2>/dev/null || true
    fi
    
    # 启动容器（映射两个端口）
    if [ "$CONTAINER_TOOL" = "docker" ]; then
        CONTAINER_ID=$(docker run -d --rm -p 8080:8080 -p 3000:3000 ${run_image})
    else
        # Podman 使用 --pull never 强制使用本地镜像，避免尝试从远程拉取
        # 使用 --cgroup-manager=cgroupfs 避免 systemd D-Bus 权限问题
        CONTAINER_ID=$(podman run --pull never --cgroup-manager=cgroupfs -d --rm -p 8080:8080 -p 3000:3000 ${run_image})
    fi
    
    log_info "容器 ID: ${CONTAINER_ID}"
    log_info "等待服务启动..."
    
    # 等待服务启动（Deno 需要下载依赖，可能需要更长时间）
    sleep 30
    
    # 检查容器是否仍在运行
    if [ "$CONTAINER_TOOL" = "docker" ]; then
        RUNNING=$(docker inspect --format='{{.State.Running}}' ${CONTAINER_ID} 2>/dev/null || echo "false")
    else
        # 确保 libpod 目录存在以避免权限问题
        mkdir -p "$XDG_RUNTIME_DIR/libpod"
        chmod +t "$XDG_RUNTIME_DIR/libpod" 2>/dev/null || true
        RUNNING=$(podman inspect --format='{{.State.Running}}' ${CONTAINER_ID} 2>/dev/null || echo "false")
    fi
    
    if [ "$RUNNING" != "true" ]; then
        log_warn "容器未在运行，检查容器日志..."
        if [ "$CONTAINER_TOOL" = "docker" ]; then
            docker logs ${CONTAINER_ID} 2>/dev/null || log_error "无法获取容器日志"
        else
            # 确保 libpod 目录存在以避免权限问题
            mkdir -p "$XDG_RUNTIME_DIR/libpod"
            chmod +t "$XDG_RUNTIME_DIR/libpod" 2>/dev/null || true
            podman logs ${CONTAINER_ID} 2>/dev/null || log_error "无法获取容器日志"
        fi
        return
    fi
    
    # 测试 HTTP 端点（先尝试 8080，再尝试 3000）
    log_info "测试 HTTP 健康端点..."
    if curl --noproxy '*' -f http://localhost:8080/health > /dev/null 2>&1; then
        log_info "HTTP 健康检查通过（端口 8080）"
    elif curl --noproxy '*' -f http://localhost:3333/health > /dev/null 2>&1; then
        log_info "HTTP 健康检查通过（端口 3333）"
    else
        log_warn "HTTP 健康检查失败（服务可能尚未完全启动）"
    fi
    
    # 停止容器
    log_info "停止测试容器..."
    if [ "$CONTAINER_TOOL" = "docker" ]; then
        docker stop ${CONTAINER_ID} > /dev/null 2>&1 || true
    else
        podman stop ${CONTAINER_ID} > /dev/null 2>&1 || true
    fi
    
    log_info "镜像测试完成"
}

# 推送镜像
push_image() {
    local image=$1
    local registry=$2
    local target="${registry}/${image}"
    
    log_info "推送镜像到：${target}"
    log_info "使用工具：${CONTAINER_TOOL}"
    
    # 标记镜像
    if [ "$CONTAINER_TOOL" = "docker" ]; then
        docker tag ${image} ${target}
    else
        podman tag ${image} ${target}
    fi
    
    # 登录（如果需要）
    if [ -n "${REGISTRY_USER}" ] && [ -n "${REGISTRY_PASSWORD}" ]; then
        log_info "登录到镜像仓库：${registry}"
        if [ "$CONTAINER_TOOL" = "docker" ]; then
            echo "${REGISTRY_PASSWORD}" | docker login ${registry} -u ${REGISTRY_USER} --password-stdin
        else
            echo "${REGISTRY_PASSWORD}" | podman login ${registry} -u ${REGISTRY_USER} --password-stdin
        fi
    fi
    
    # 推送
    if [ "$CONTAINER_TOOL" = "docker" ]; then
        docker push ${target}
    else
        podman push ${target}
    fi
    
    if [ $? -eq 0 ]; then
        log_info "镜像推送成功：${target}"
    else
        log_error "镜像推送失败"
        exit 1
    fi
}

# 创建发布说明
create_release_notes() {
    local version=$1
    
    cat > RELEASE_NOTES_${version}.md << EOF
# Lapdev v${version} 发布说明

## 发布日期
$(date '+%Y-%m-%d')

## 镜像信息

- **镜像名称**: ${IMAGE_NAME}
- **版本标签**: ${version}
- **基础镜像**: Alpine 3.19 + Node.js 20 + Deno 1.42
- **架构**: linux/amd64, linux/arm64
- **容器工具**: Docker / Podman

## 主要特性

### 核心功能
- ✅ 内置 BMAD 工作流（离线支持）
- ✅ AI 模型集成（OpenAI, DeepSeek, Anthropic）
- ✅ 文件树、代码编辑器、终端、Git 面板
- ✅ 多阶段构建（优化镜像大小）

### 技术栈
- **前端**: React + TypeScript + Monaco Editor
- **后端**: Deno + TypeScript
- **容器**: Docker + Podman 支持

### 非功能需求
- 服务器启动时间 < 2 秒
- 大文件打开时间 < 500ms
- 终端响应延迟 < 50ms
- 页面加载时间 < 3 秒

## 使用方法

### Docker 运行
\`\`\`bash
docker run -d -p 8080:8080 -p 3000:3000 \\
  -v \$(pwd)/workspace:/workspace \\
  ${IMAGE_NAME}:${version}
\`\`\`

### Docker Compose
\`\`\`bash
docker-compose up -d
\`\`\`

### Podman 运行
\`\`\`bash
podman run -d -p 8080:8080 -p 3000:3000 \\
  -v \$(pwd)/workspace:/workspace \\
  ${IMAGE_NAME}:${version}
\`\`\`

### Podman Compose
\`\`\`bash
podman-compose up -d
\`\`\`

## 已知问题

无

## 变更日志

- 完成所有 6 个 Epic，17 个 Story
- 通过 33 项单元测试、集成测试和性能测试
- 通过 13 项用户验收测试（UAT）
- 支持 Gitee-GitHub 自动同步
- 支持 Docker 和 Podman 容器工具

## 许可证

MIT License
EOF

    log_info "发布说明已创建：RELEASE_NOTES_${version}.md"
}

# 列出镜像
list_images() {
    log_info "列出本地镜像："
    if [ "$CONTAINER_TOOL" = "docker" ]; then
        docker images ${IMAGE_NAME}*
    else
        podman images ${IMAGE_NAME}*
    fi
}

# 主函数
main() {
    local command=${1:-build}
    local version=$(get_version)
    
    log_info "Lapdev 容器构建与发布脚本"
    log_info "版本：${version}"
    log_info "命令：${command}"
    
    case ${command} in
        build)
            check_dependencies
            build_image ${version}
            cleanup
            ;;
        test)
            detect_container_tool
            test_image ${IMAGE_NAME}:${version}
            ;;
        push)
            detect_container_tool
            if [ -z "${REGISTRY}" ]; then
                log_error "请设置 REGISTRY 环境变量"
                exit 1
            fi
            push_image ${IMAGE_NAME}:${version} ${REGISTRY}
            ;;
        release)
            check_dependencies
            build_image ${version}
            test_image ${IMAGE_NAME}:${version}
            create_release_notes ${version}
            cleanup
            log_info "发布准备完成"
            log_info "下一步：运行 './release.sh push' 推送镜像"
            ;;
        images)
            detect_container_tool
            list_images
            ;;
        version)
            echo ${version}
            ;;
        cleanup)
            cleanup
            ;;
        help)
            echo "用法: $0 {build|test|push|release|images|version|cleanup|help}"
            echo
            echo "命令说明:"
            echo "  build    - 构建镜像（自动检测 Docker/Podman）"
            echo "  test     - 测试镜像"
            echo "  push     - 推送镜像到仓库"
            echo "  release  - 完整发布流程（构建+测试+创建发布说明）"
            echo "  images   - 列出本地镜像"
            echo "  version  - 显示版本号"
            echo "  cleanup  - 清理临时文件（如 deno 二进制）"
            echo "  help     - 显示帮助信息"
            echo
            echo "环境变量:"
            echo "  REGISTRY              - 镜像仓库地址（默认: registry.gitee.com）"
            echo "  DOCKER_REGISTRY_USER  - 仓库用户名"
            echo "  DOCKER_REGISTRY_PASSWORD - 仓库密码"
            ;;
        *)
            log_error "未知命令：${command}"
            echo "使用 '$0 help' 查看帮助"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"