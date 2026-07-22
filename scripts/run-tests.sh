#!/bin/bash

set -e

# 加载共享配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/config.sh"

# 设置 NO_PROXY 环境变量，防止测试请求被代理拦截
export NO_PROXY=localhost,127.0.0.1
export no_proxy=localhost,127.0.0.1
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY

log_info() {
    echo -e "\033[1;34m[INFO]\033[0m $1"
}

log_success() {
    echo -e "\033[1;32m[PASS]\033[0m $1"
}

log_error() {
    echo -e "\033[1;31m[ERROR]\033[0m $1"
    exit 1
}

BACKEND_PID=""
FRONTEND_PID=""
PORT="${PORT:-${BACKEND_PORT}}"

check_port() {
    ss -tln | grep -q ":${1} "
}

wait_for_service() {
    local url=$1
    local max_attempts=$2
    local attempts=0

    while [ $attempts -lt $max_attempts ]; do
        if curl --noproxy '*' -s --max-time 2 "${url}" > /dev/null 2>&1; then
            return 0
        fi
        sleep 1
        attempts=$((attempts + 1))
    done
    return 1
}

cleanup_port() {
    local port=$1
    log_info "清理端口 ${port} 上的进程..."
    local pids=$(lsof -ti:$port 2>/dev/null || ss -tlnp | grep ":$port" | awk '{print $NF}' | sed 's/.*\///' 2>/dev/null)
    if [ -n "$pids" ]; then
        kill -9 $pids 2>/dev/null || true
        sleep 1
        log_info "端口 ${port} 已清理"
    else
        log_info "端口 ${port} 未被占用"
    fi
}

prepare_git_repo() {
    log_info "准备 Git 测试仓库: ${WORKSPACE_PATH}"
    
    mkdir -p "${WORKSPACE_PATH}"
    
    if [ ! -d "${WORKSPACE_PATH}/.git" ]; then
        log_info "初始化 Git 仓库..."
        cd "${WORKSPACE_PATH}"
        git init
        git config user.email "test@lapdev.local"
        git config user.name "Test User"
        echo "# Test Project" > README.md
        git add README.md
        git commit -m "Initial commit"
        cd - > /dev/null
    fi
    
    local current_branch=$(git -C "${WORKSPACE_PATH}" branch --show-current)
    if [ -z "$current_branch" ]; then
        current_branch="master"
    fi
    
    if ! git -C "${WORKSPACE_PATH}" branch | grep -q "develop"; then
        git -C "${WORKSPACE_PATH}" checkout -b develop
        git -C "${WORKSPACE_PATH}" checkout "$current_branch"
    fi
    
    if ! git -C "${WORKSPACE_PATH}" branch | grep -q "feature-branch"; then
        git -C "${WORKSPACE_PATH}" branch feature-branch
    fi
    
    if [ ! -d "${WORKSPACE_PATH}/test-folder" ]; then
        mkdir -p "${WORKSPACE_PATH}/test-folder"
        echo "Folder file" > "${WORKSPACE_PATH}/test-folder/nested.txt"
        git -C "${WORKSPACE_PATH}" add .
        git -C "${WORKSPACE_PATH}" commit -m "Add test folder" 2>/dev/null || true
    fi
    
    rm -f "${WORKSPACE_PATH}/uncommitted.txt" 2>/dev/null || true
    echo "Uncommitted change $(date +%s)" > "${WORKSPACE_PATH}/uncommitted.txt"
    git -C "${WORKSPACE_PATH}" add uncommitted.txt
    
    echo "Modified content $(date +%s)" > "${WORKSPACE_PATH}/README.md"
    
    log_success "Git 仓库准备完成"
}

start_backend() {
    log_info "启动后端服务..."
    cleanup_port $PORT
    prepare_git_repo
    
    cd "${BACKEND_DIR}"
    export WORKSPACE_PATH="${WORKSPACE_PATH}"
    export ALLOWED_ORIGINS="${ALLOWED_ORIGINS}"
    
    nohup deno run --allow-all src/main.ts > /tmp/backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    echo "${BACKEND_PID}" > /tmp/lapdev_backend.pid
    
    log_info "等待后端服务启动..."
    if wait_for_service "${BACKEND_URL}/api/v1/git/status" 30; then
        log_success "后端服务已启动 (PID: ${BACKEND_PID})"
        return 0
    fi
    
    log_error "后端服务启动超时"
}

start_frontend() {
    log_info "启动前端服务..."
    
    cd "${FRONTEND_DIR}"
    
    nohup npm run dev -- --host 0.0.0.0 --port ${FRONTEND_PORT} > /tmp/frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    echo "${FRONTEND_PID}" > /tmp/lapdev_frontend.pid
    
    log_info "等待前端服务启动..."
    local attempts=0
    local max_attempts=40

    while [ $attempts -lt $max_attempts ]; do
        for port in 5173 5174 5175 5176; do
            if check_port ${port}; then
                if wait_for_service "http://localhost:${port}" 2; then
                    FRONTEND_URL="http://localhost:${port}"
                    log_success "前端服务已启动 (PID: ${FRONTEND_PID}, 端口: ${port})"
                    return 0
                fi
            fi
        done
        sleep 1
        attempts=$((attempts + 1))
    done

    log_error "前端服务启动超时"
}

stop_backend() {
    if [ -n "$BACKEND_PID" ]; then
        log_info "停止后端服务..."
        kill $BACKEND_PID 2>/dev/null || true
        wait $BACKEND_PID 2>/dev/null || true
        rm -f /tmp/lapdev_backend.pid
        log_success "后端服务已停止"
    fi
}

stop_frontend() {
    if [ -n "$FRONTEND_PID" ]; then
        log_info "停止前端服务..."
        kill $FRONTEND_PID 2>/dev/null || true
        wait $FRONTEND_PID 2>/dev/null || true
        rm -f /tmp/lapdev_frontend.pid
        log_success "前端服务已停止"
    fi
}

cleanup_all() {
    log_info "清理所有进程..."
    (
        set +e
        stop_backend
        stop_frontend
        pkill -f "playwright" 2>/dev/null || true
        pkill -f "chromium" 2>/dev/null || true
        sleep 2
    )
    log_success "清理完成"
}

cleanup() {
    (
        set +e
        cleanup_all
    )
}

trap cleanup EXIT INT TERM

cleanup_all

if ! start_backend; then
    log_error "后端服务启动失败"
fi

if ! start_frontend; then
    log_error "前端服务启动失败"
fi

export BASE_URL="${FRONTEND_URL}"
export API_BASE_URL="${BACKEND_URL}"

log_info "========================================"
log_info "Lapdev 完整测试套件"
log_info "========================================"

log_info ""
log_info "1. 前端单元测试"
log_info "----------------------------------------"
npm run test:frontend || log_error "前端测试失败"

log_info ""
log_info "2. 后端单元测试"
log_info "----------------------------------------"
npm run test:backend || log_error "后端测试失败"

log_info ""
log_info "3. 通用单元测试"
log_info "----------------------------------------"
npm run test:unit || log_error "通用单元测试失败"

log_info ""
log_info "4. API 集成测试"
log_info "----------------------------------------"
if ! wait_for_service "${BACKEND_URL}/api/v1/git/status" 5; then
    log_info "后端服务不可用，尝试重启..."
    stop_backend
    start_backend
fi
npm run test:api || log_error "API 测试失败"

log_info ""
log_info "5. E2E 测试"
log_info "----------------------------------------"
if ! wait_for_service "${FRONTEND_URL}" 5; then
    log_info "前端服务不可用，尝试重启..."
    stop_frontend
    start_frontend
fi
if ! wait_for_service "${BACKEND_URL}/api/v1/git/status" 5; then
    log_info "后端服务不可用，尝试重启..."
    stop_backend
    start_backend
fi
npx playwright test tests/e2e/ || log_error "E2E 测试失败"

log_info ""
log_info "========================================"
log_success "所有测试通过！"
log_info "========================================"
