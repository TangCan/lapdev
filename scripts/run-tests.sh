#!/bin/bash

set -e

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

start_backend() {
    log_info "启动后端服务..."
    cd backend
    WORKSPACE_PATH="${WORKSPACE_PATH:-$(pwd)/../workspace}" \
    NO_PROXY=localhost,127.0.0.1 no_proxy=localhost,127.0.0.1 \
    deno run --allow-all src/main.ts &
    BACKEND_PID=$!
    cd ..
    
    log_info "等待后端服务启动..."
    local max_wait=30
    local wait_count=0
    while ! NO_PROXY=localhost,127.0.0.1 no_proxy=localhost,127.0.0.1 curl -s "http://localhost:${PORT}/health" > /dev/null 2>&1; do
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
(cd backend && NO_PROXY=localhost,127.0.0.1 no_proxy=localhost,127.0.0.1 deno test --allow-all) || log_error "后端测试失败"

log_info ""
log_info "3. 通用单元测试"
log_info "----------------------------------------"
NO_PROXY=localhost,127.0.0.1 no_proxy=localhost,127.0.0.1 deno test --allow-all tests/unit/ || log_error "通用单元测试失败"

log_info ""
log_info "4. API 集成测试"
log_info "----------------------------------------"
start_backend
NO_PROXY=localhost,127.0.0.1 no_proxy=localhost,127.0.0.1 deno test --allow-all tests/api/ai.test.ts || log_error "API 测试失败"

log_info ""
log_info "5. E2E 测试"
log_info "----------------------------------------"
NO_PROXY=localhost,127.0.0.1 no_proxy=localhost,127.0.0.1 playwright test tests/e2e/ || log_error "E2E 测试失败"

log_info ""
log_info "========================================"
log_success "所有测试通过！"
log_info "========================================"