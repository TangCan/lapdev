#!/bin/bash
# Lapdev E2E 测试脚本（容器模式）

# 加载共享配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/config.sh"

# 配置
IMAGE_NAME="${IMAGE_NAME:-lapdev}"
VERSION="${VERSION:-1.1.0}"
CONTAINER_TOOL=""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数器
PASSED=0
FAILED=0
TOTAL=0

# 跳过代理
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY

# 日志函数
log_info() {
    echo -e "${NC}[INFO] $1"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    PASSED=$((PASSED + 1))
    TOTAL=$((TOTAL + 1))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    FAILED=$((FAILED + 1))
    TOTAL=$((TOTAL + 1))
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_section() {
    echo ""
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${YELLOW}========================================${NC}"
}

# 检测容器工具
detect_container_tool() {
    if command -v docker &> /dev/null; then
        CONTAINER_TOOL="docker"
        log_info "检测到 Docker"
        return 0
    fi
    
    if command -v podman &> /dev/null; then
        CONTAINER_TOOL="podman"
        log_info "检测到 Podman"
        return 0
    fi
    
    log_error "未检测到 Docker 或 Podman"
    exit 1
}

# 检查函数
check() {
    local name="$1"
    local cmd="$2"
    
    log_info "测试: $name"
    if eval "$cmd" > /dev/null 2>&1; then
        log_pass "$name"
        return 0
    else
        log_fail "$name"
        return 1
    fi
}

check_output() {
    local name="$1"
    local cmd="$2"
    local expected="$3"
    
    log_info "测试: $name"
    local result
    result=$(eval "$cmd" 2>/dev/null || true)
    if [[ "$result" == *"$expected"* ]]; then
        log_pass "$name"
        return 0
    else
        log_fail "$name (期望: $expected, 实际: $result)"
        return 1
    fi
}

# 清理函数（停止容器）
cleanup() {
    if [ -n "$CONTAINER_ID" ]; then
        log_info "停止容器..."
        if [ "$CONTAINER_TOOL" = "docker" ]; then
            docker stop "$CONTAINER_ID" > /dev/null 2>&1 || true
        else
            podman stop "$CONTAINER_ID" > /dev/null 2>&1 || true
        fi
    fi
}

# ========================================
# 开始测试
# ========================================
log_section "Lapdev E2E 测试"

# 检测容器工具
detect_container_tool

# 设置 Podman 运行时环境（与 release.sh 保持一致）
if [ "$CONTAINER_TOOL" = "podman" ]; then
    export CONTAINERS_STORAGE_DRIVER="vfs"
    export CONTAINERS_CGROUP_MANAGER="cgroupfs"
    
    export XDG_RUNTIME_DIR="$HOME/.podman-run"
    mkdir -p "$XDG_RUNTIME_DIR/libpod" 2>/dev/null || true
fi

# 服务端口（使用配置文件中的后端端口）
PORT=${PORT:-${BACKEND_PORT}}

# 创建测试文件
mkdir -p "${WORKSPACE_PATH}/test-project"
echo "Hello World" > "${WORKSPACE_PATH}/test-project/readme.txt"
log_info "创建测试文件: ${WORKSPACE_PATH}/test-project/readme.txt"

# ========================================
# 启动容器
# ========================================
log_section "启动容器"

# 构建镜像标签
IMAGE_TAG="${IMAGE_NAME}:${VERSION}"

# 对于 Podman，镜像名称需要使用 localhost/ 前缀
RUN_IMAGE="${IMAGE_TAG}"
if [ "$CONTAINER_TOOL" = "podman" ]; then
    RUN_IMAGE="localhost/${IMAGE_TAG}"
fi

log_info "使用镜像: ${RUN_IMAGE}"
log_info "工作空间: ${WORKSPACE_DIR}"

# 启动容器（容器内服务运行在 CONTAINER_PORT 端口）
if [ "$CONTAINER_TOOL" = "docker" ]; then
    CONTAINER_ID=$(docker run -d --rm \
        -p "${PORT}:${CONTAINER_PORT}" \
        -v "${WORKSPACE_PATH}:/workspace" \
        "${RUN_IMAGE}")
else
    CONTAINER_ID=$(podman run --pull never --cgroup-manager=cgroupfs -d --rm \
        -p "${PORT}:${CONTAINER_PORT}" \
        -v "${WORKSPACE_PATH}:/workspace" \
        "${RUN_IMAGE}" 2>/dev/null)
fi

log_info "容器 ID: ${CONTAINER_ID}"

# 检查容器 ID 是否为空
if [ -z "$CONTAINER_ID" ]; then
    log_error "容器启动失败"
    exit 1
fi

# 等待服务启动
log_info "等待服务启动..."
sleep 30

# 检查容器是否运行
RUNNING=false
if [ "$CONTAINER_TOOL" = "docker" ]; then
    RUNNING=$(docker inspect --format='{{.State.Running}}' "${CONTAINER_ID}" 2>/dev/null || echo "false")
else
    RUNNING=$(podman inspect --format='{{.State.Running}}' "${CONTAINER_ID}" 2>/dev/null || echo "false")
fi

if [ "$RUNNING" != "true" ]; then
    log_error "容器未启动成功"
    if [ "$CONTAINER_TOOL" = "docker" ]; then
        docker logs "${CONTAINER_ID}" 2>/dev/null || true
    else
        podman logs "${CONTAINER_ID}" 2>/dev/null || true
    fi
    cleanup
    exit 1
fi

log_info "容器已启动"

# 设置清理陷阱
trap cleanup EXIT

# ========================================
# 基础功能测试
# ========================================
log_section "1. 基础功能测试"

check_output "前端健康检查" "curl -s http://localhost:${PORT}/health" "\"status\":\"ok\""
check_output "后端健康检查" "curl -s http://localhost:${PORT}/health" "\"status\":\"ok\""
check_output "前端页面可访问" "curl -s http://localhost:${PORT}/" "<!DOCTYPE"

# ========================================
# 文件树 API 测试
# ========================================
log_section "2. 文件树 API 测试"

check_output "文件树 API" "curl -s http://localhost:${PORT}/api/v1/files/tree" "test-project"

# ========================================
# 容器状态测试
# ========================================
log_section "3. 容器状态测试"

check "容器运行中" "${CONTAINER_TOOL} ps | grep -q ${CONTAINER_ID:0:12}"

# ========================================
# 测试总结
# ========================================
log_section "测试总结"

echo ""
echo "总计: $TOTAL"
echo -e "通过: ${GREEN}$PASSED${NC}"
echo -e "失败: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}⚠️  有 $FAILED 个测试失败${NC}"
    exit 1
fi