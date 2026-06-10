#!/bin/bash
# Lapdev E2E 测试脚本

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

log_section() {
    echo ""
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${YELLOW}========================================${NC}"
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

# ========================================
# 开始测试
# ========================================
log_section "Lapdev E2E 测试"

# ========================================
# 基础功能测试
# ========================================
log_section "1. 基础功能测试"

check_output "前端健康检查" "curl -s http://localhost:8080/health" "ok"
# 注意：后端和前端运行在同一个端口（8080）
check_output "后端健康检查" "curl -s http://localhost:8080/health" "ok"
check_output "前端页面可访问" "curl -s http://localhost:8080/" "<!DOCTYPE"

# ========================================
# 文件树 API 测试
# ========================================
log_section "2. 文件树 API 测试"

# 创建测试文件
mkdir -p /home/richard/richard/2026/2026/pvm_2/lapdev/workspace/test-project
echo "Hello World" > /home/richard/richard/2026/2026/pvm_2/lapdev/workspace/test-project/readme.txt

check_output "文件树 API" "curl -s http://localhost:8080/api/v1/files/tree" "test-project"

# ========================================
# 容器状态测试
# ========================================
log_section "3. 容器状态测试"

check "容器运行中" "podman ps | grep -q lapdev"

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
