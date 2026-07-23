#!/bin/bash

# ========================================
# Lapdev Container Build & Release Script
# 支持 Docker 和 Podman
# ========================================

set -e

# 加载共享配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/config.sh"

# 配置
IMAGE_NAME="${IMAGE_NAME:-lapdev}"
VERSION="${VERSION:-1.1.0}"
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

# 检测 Podman 网络是否可用
is_podman_network_available() {
    # 检查默认网络是否存在
    if ! podman network ls 2>/dev/null | grep -q "podman"; then
        return 1
    fi
    
    # 检查网络是否可用（尝试拉取一个小镜像测试）
    # 使用子shell避免timeout影响主shell环境
    (
        set +e
        timeout 10 podman pull --quiet docker.io/library/alpine:latest 2>/dev/null
        exit $?
    )
    
    # timeout返回124表示超时，返回其他非零表示失败
    local exit_code=$?
    if [ $exit_code -eq 0 ]; then
        return 0
    else
        return 1
    fi
}

# 检查 Podman 网络状态（详细诊断）
check_podman_network() {
    log_info "========== Podman 网络诊断 =========="
    
    # 1. 检查 Podman 是否安装
    if ! command -v podman &> /dev/null; then
        log_error "Podman 未安装"
        return 1
    fi
    log_info "✓ Podman 已安装: $(podman --version)"
    
    # 2. 检查默认网络
    log_info ""
    log_info "--- 网络列表 ---"
    podman network ls
    
    # 3. 检查默认网络详情
    log_info ""
    log_info "--- 默认网络详情 ---"
    if podman network inspect podman &> /dev/null; then
        podman network inspect podman | head -30
    else
        log_error "默认网络 'podman' 不存在"
        return 1
    fi
    
    # 4. 检查 CNI 插件
    log_info ""
    log_info "--- CNI 插件检查 ---"
    local cni_dir="/etc/cni/net.d"
    if [ -d "$cni_dir" ]; then
        log_info "CNI 目录存在: $cni_dir"
        ls -la $cni_dir
    else
        log_warn "CNI 目录不存在: $cni_dir"
    fi
    
    # 5. 测试网络连通性
    log_info ""
    log_info "--- 网络连通性测试 ---"
    
    # 测试 DNS 解析
    log_info "测试 DNS 解析..."
    if timeout 5 podman run --rm --network podman docker.io/library/alpine:latest nslookup google.com &> /dev/null; then
        log_info "✓ DNS 解析正常"
    else
        log_error "✗ DNS 解析失败"
    fi
    
    # 测试外网访问
    log_info "测试外网访问..."
    if timeout 10 podman run --rm --network podman docker.io/library/alpine:latest wget -qO- https://www.google.com &> /dev/null; then
        log_info "✓ 外网访问正常"
    else
        log_error "✗ 外网访问失败"
    fi
    
    # 6. 总结
    log_info ""
    log_info "========== 诊断完成 =========="
    if is_podman_network_available; then
        log_info "✓ Podman 网络状态: 正常"
        return 0
    else
        log_error "✗ Podman 网络状态: 异常"
        return 1
    fi
}

# 检测容器工具
detect_container_tool() {
    log_info "检测容器工具..."
    
    # 优先使用 Podman（如果可用且网络正常）
    if command -v podman &> /dev/null; then
        log_info "检测到 Podman，检查网络可用性..."
        
        if is_podman_network_available; then
            CONTAINER_TOOL="podman"
            log_info "Podman 网络可用，使用 Podman"
            
            # 设置 rootless Podman 的运行时目录（解决 /run 只读问题）
            setup_podman_runtime
            return 0
        else
            log_warn "Podman 网络不可用"
        fi
    fi
    
    # 其次使用 Docker
    if command -v docker &> /dev/null; then
        CONTAINER_TOOL="docker"
        log_info "检测到 Docker，使用 Docker"
        return 0
    fi
    
    log_error "未检测到 Docker 或 Podman，请先安装其中之一"
    exit 1
}

# 设置 Podman 运行时环境
setup_podman_runtime() {
    # 检测是否使用 sudo
    local original_user="$USER"
    if [ -n "$SUDO_USER" ]; then
        original_user="$SUDO_USER"
        log_info "检测到 sudo，原始用户: $original_user"
    fi
    
    log_info "Podman 运行时环境已设置"
}



# 检查并准备 Deno 二进制
prepare_deno() {
    log_info "检查 Deno 二进制..."
    
    # 检查系统中是否安装了 deno
    local system_deno=$(which deno 2>/dev/null)
    
    # 如果系统路径中找不到，尝试常见的安装位置
    if [ -z "$system_deno" ]; then
        local possible_paths=(
            "/home/$SUDO_USER/.cargo/bin/deno"
            "/home/$SUDO_USER/.deno/bin/deno"
            "/root/.cargo/bin/deno"
            "/root/.deno/bin/deno"
            "$HOME/.cargo/bin/deno"
            "$HOME/.deno/bin/deno"
        )
        
        for path in "${possible_paths[@]}"; do
            if [ -f "$path" ] && [ -x "$path" ]; then
                system_deno="$path"
                log_info "在 $path 找到 Deno"
                break
            fi
        done
    fi
    
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
        sudo docker build \
            --no-cache \
            --ulimit nofile=65536:65536 \
            --tag ${IMAGE_NAME}:${version} \
            --tag ${IMAGE_NAME}:latest \
            --build-arg VERSION=${version} \
            .
    else
        # Podman 构建
        sudo podman build \
            --no-cache \
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
        
        # 如果使用 Docker 构建，同时导入到 Podman
        if [ "$CONTAINER_TOOL" = "docker" ] && command -v podman &> /dev/null; then
            log_info "将镜像导入到 Podman..."
            sudo docker save ${IMAGE_NAME}:latest -o /tmp/${IMAGE_NAME}.tar
            sudo podman load -i /tmp/${IMAGE_NAME}.tar > /dev/null 2>&1
            sudo podman tag localhost/latest:latest localhost/${IMAGE_NAME}:latest > /dev/null 2>&1
            sudo rm -f /tmp/${IMAGE_NAME}.tar
            log_info "镜像已导入 Podman: localhost/${IMAGE_NAME}:latest"
        fi
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
    
    # 启动容器（映射前端和后端端口）
    if [ "$CONTAINER_TOOL" = "docker" ]; then
        CONTAINER_ID=$(docker run -d --rm -p ${HOST_FRONTEND_PORT}:${FRONTEND_PROD_PORT} -p ${HOST_BACKEND_PORT}:${CONTAINER_PORT} ${run_image})
    else
        # Podman 使用 --pull never 强制使用本地镜像，避免尝试从远程拉取
        # 使用 --cgroup-manager=cgroupfs 避免 systemd D-Bus 权限问题
        CONTAINER_ID=$(podman run --pull never --cgroup-manager=cgroupfs -d --rm -p ${HOST_FRONTEND_PORT}:${FRONTEND_PROD_PORT} -p ${HOST_BACKEND_PORT}:${CONTAINER_PORT} ${run_image})
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
    
    # 测试 HTTP 端点
    log_info "测试 HTTP 健康端点..."
    if curl --noproxy '*' -f http://localhost:${HOST_FRONTEND_PORT}/health > /dev/null 2>&1; then
        log_info "HTTP 健康检查通过（端口 ${HOST_FRONTEND_PORT}）"
    elif curl --noproxy '*' -f http://localhost:${HOST_BACKEND_PORT}/health > /dev/null 2>&1; then
        log_info "HTTP 健康检查通过（端口 ${HOST_BACKEND_PORT}）"
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
docker run -d -p ${HOST_FRONTEND_PORT}:${FRONTEND_PROD_PORT} -p ${HOST_BACKEND_PORT}:${CONTAINER_PORT} \\
  -v \$(pwd)/workspace:/workspace \\
  ${IMAGE_NAME}:${version}
\`\`\`

### Docker Compose
\`\`\`bash
docker-compose up -d
\`\`\`

### Podman 运行
\`\`\`bash
podman run -d -p ${HOST_FRONTEND_PORT}:${FRONTEND_PROD_PORT} -p ${HOST_BACKEND_PORT}:${CONTAINER_PORT} \\
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
        network-check)
            check_podman_network
            ;;
        version)
            echo ${version}
            ;;
        cleanup)
            cleanup
            ;;
        help)
            echo "用法: $0 {build|test|push|release|images|network-check|version|cleanup|help}"
            echo
            echo "命令说明:"
            echo "  build         - 构建镜像（自动检测 Docker/Podman）"
            echo "  test          - 测试镜像"
            echo "  push          - 推送镜像到仓库"
            echo "  release       - 完整发布流程（构建+测试+创建发布说明）"
            echo "  images        - 列出本地镜像"
            echo "  network-check - 检测 Podman 网络状态"
            echo "  version       - 显示版本号"
            echo "  cleanup       - 清理临时文件（如 deno 二进制）"
            echo "  help          - 显示帮助信息"
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