#!/bin/bash

set -e

# 设置 NO_PROXY 环境变量，防止测试请求被代理拦截
export NO_PROXY=localhost,127.0.0.1
export no_proxy=localhost,127.0.0.1

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
PORT="${PORT:-3000}"

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
    local workspace_dir="${WORKSPACE_PATH:-$(pwd)/workspace}"
    log_info "准备 Git 测试仓库: ${workspace_dir}"
    
    mkdir -p "${workspace_dir}"
    
    if [ ! -d "${workspace_dir}/.git" ]; then
        log_info "初始化 Git 仓库..."
        cd "${workspace_dir}"
        git init
        git config user.email "test@lapdev.local"
        git config user.name "Test User"
        echo "# Test Project" > README.md
        git add README.md
        git commit -m "Initial commit"
        cd - > /dev/null
        log_success "Git 仓库已初始化"
    else
        log_info "Git 仓库已存在"
    fi
    
    # 确保有多个分支用于测试
    local current_branch=$(git -C "${workspace_dir}" branch --show-current)
    if [ -z "$current_branch" ]; then
        current_branch="master"
    fi
    
    if ! git -C "${workspace_dir}" branch | grep -q "develop"; then
        log_info "创建 develop 分支..."
        git -C "${workspace_dir}" checkout -b develop
        git -C "${workspace_dir}" checkout "$current_branch"
    fi
    
    if ! git -C "${workspace_dir}" branch | grep -q "feature-branch"; then
        log_info "创建 feature-branch 分支..."
        git -C "${workspace_dir}" branch feature-branch
    fi
    
    # 确保有一些文件和目录用于文件树测试
    if [ ! -d "${workspace_dir}/test-folder" ]; then
        log_info "创建测试文件夹..."
        mkdir -p "${workspace_dir}/test-folder"
        echo "Folder file" > "${workspace_dir}/test-folder/nested.txt"
        git -C "${workspace_dir}" add .
        git -C "${workspace_dir}" commit -m "Add test folder" 2>/dev/null || true
        log_success "测试文件夹已创建"
    else
        log_info "测试文件夹已存在"
    fi
    
    # 创建一个未提交的变更用于 Git 提交测试
    echo "Uncommitted change" > "${workspace_dir}/uncommitted.txt"
    git -C "${workspace_dir}" add uncommitted.txt
}

start_backend() {
    log_info "启动后端服务..."
    cleanup_port $PORT
    prepare_git_repo
    
    cd backend
    WORKSPACE_PATH="${WORKSPACE_PATH:-$(pwd)/../workspace}" \
    deno run --allow-all src/main.ts &
    BACKEND_PID=$!
    cd ..
    
    log_info "等待后端服务启动..."
    local max_wait=30
    local wait_count=0
    while ! curl -s "http://localhost:${PORT}/health" > /dev/null 2>&1; do
        sleep 1
        wait_count=$((wait_count + 1))
        if [ $wait_count -ge $max_wait ]; then
            log_error "后端服务启动超时"
        fi
    done
    log_success "后端服务已启动"
}

stop_backend() {
    if [ -n "$BACKEND_PID" ]; then
        log_info "停止后端服务..."
        kill $BACKEND_PID 2>/dev/null || true
        wait $BACKEND_PID 2>/dev/null || true
        log_success "后端服务已停止"
    fi
}

trap stop_backend EXIT

log_info "========================================"
log_info "Lapdev 完整测试套件"
log_info "========================================"

log_info ""
log_info "1. 前端单元测试"
log_info "----------------------------------------"
cd frontend && npm test || log_error "前端测试失败"
cd ..

log_info ""
log_info "2. 后端单元测试"
log_info "----------------------------------------"
(cd backend && deno test --allow-all) || log_error "后端测试失败"

log_info ""
log_info "3. 通用单元测试"
log_info "----------------------------------------"
deno test --allow-all tests/unit/ || log_error "通用单元测试失败"

log_info ""
log_info "4. API 集成测试"
log_info "----------------------------------------"
start_backend
deno test --allow-all tests/api/ai.test.ts || log_error "API 测试失败"

log_info ""
log_info "5. E2E 测试"
log_info "----------------------------------------"
playwright test tests/e2e/ || log_error "E2E 测试失败"

log_info ""
log_info "========================================"
log_success "所有测试通过！"
log_info "========================================"