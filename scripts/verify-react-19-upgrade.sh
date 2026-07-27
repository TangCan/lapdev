#!/bin/bash
# =============================================================================
# EPI1.01: React 19 依赖升级 - 构建验证脚本
# =============================================================================
# 此脚本验证 React 19 升级后的构建和测试状态
# 使用方法: ./scripts/verify-react-19-upgrade.sh [--skip-tests]
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
FRONTEND_DIR="frontend"
EXPECTED_REACT_VERSION="19"
EXPECTED_REACT_DOM_VERSION="19"
EXPECTED_TYPES_REACT_VERSION="19"
EXPECTED_PLUGIN_REACT_VERSION="5"

# 计数器
PASSED=0
FAILED=0
SKIPPED=0

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    PASSED=$((PASSED + 1))
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    FAILED=$((FAILED + 1))
}

log_skip() {
    echo -e "${YELLOW}[SKIP]${NC} $1"
    SKIPPED=$((SKIPPED + 1))
}

# 检查命令是否存在
check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "$1 命令未找到"
        return 1
    fi
    return 0
}

# =============================================================================
# 检查 1: Node.js 和 npm 版本
# =============================================================================
check_node_version() {
    log_info "检查 Node.js 版本..."
    if check_command node; then
        NODE_VERSION=$(node --version)
        log_success "Node.js 版本: $NODE_VERSION"
    fi
}

# =============================================================================
# 检查 2: 依赖版本验证
# =============================================================================
check_dependency_versions() {
    log_info "检查依赖版本..."

    cd "$FRONTEND_DIR"

    # 检查 react 版本
    REACT_VERSION=$(node -p "require('./package.json').dependencies.react")
    if [[ "$REACT_VERSION" == *"$EXPECTED_REACT_VERSION"* ]]; then
        log_success "react 版本: $REACT_VERSION (期望: ^$EXPECTED_REACT_VERSION)"
    else
        log_error "react 版本: $REACT_VERSION (期望: ^$EXPECTED_REACT_VERSION)"
    fi

    # 检查 react-dom 版本
    REACT_DOM_VERSION=$(node -p "require('./package.json').dependencies['react-dom']")
    if [[ "$REACT_DOM_VERSION" == *"$EXPECTED_REACT_DOM_VERSION"* ]]; then
        log_success "react-dom 版本: $REACT_DOM_VERSION (期望: ^$EXPECTED_REACT_DOM_VERSION)"
    else
        log_error "react-dom 版本: $REACT_DOM_VERSION (期望: ^$EXPECTED_REACT_DOM_VERSION)"
    fi

    # 检查 @types/react 版本
    TYPES_REACT_VERSION=$(node -p "require('./package.json').devDependencies['@types/react']")
    if [[ "$TYPES_REACT_VERSION" == *"$EXPECTED_TYPES_REACT_VERSION"* ]]; then
        log_success "@types/react 版本: $TYPES_REACT_VERSION (期望: ^$EXPECTED_TYPES_REACT_VERSION)"
    else
        log_error "@types/react 版本: $TYPES_REACT_VERSION (期望: ^$EXPECTED_TYPES_REACT_VERSION)"
    fi

    # 检查 @types/react-dom 版本
    TYPES_REACT_DOM_VERSION=$(node -p "require('./package.json').devDependencies['@types/react-dom']")
    if [[ "$TYPES_REACT_DOM_VERSION" == *"$EXPECTED_TYPES_REACT_VERSION"* ]]; then
        log_success "@types/react-dom 版本: $TYPES_REACT_DOM_VERSION (期望: ^$EXPECTED_TYPES_REACT_VERSION)"
    else
        log_error "@types/react-dom 版本: $TYPES_REACT_DOM_VERSION (期望: ^$EXPECTED_TYPES_REACT_VERSION)"
    fi

    # 检查 @vitejs/plugin-react 版本
    PLUGIN_REACT_VERSION=$(node -p "require('./package.json').devDependencies['@vitejs/plugin-react']")
    if [[ "$PLUGIN_REACT_VERSION" == *"$EXPECTED_PLUGIN_REACT_VERSION"* ]]; then
        log_success "@vitejs/plugin-react 版本: $PLUGIN_REACT_VERSION (期望: ^$EXPECTED_PLUGIN_REACT_VERSION)"
    else
        log_error "@vitejs/plugin-react 版本: $PLUGIN_REACT_VERSION (期望: ^$EXPECTED_PLUGIN_REACT_VERSION)"
    fi

    cd ..
}

# =============================================================================
# 检查 3: TypeScript 类型检查
# =============================================================================
check_typescript() {
    log_info "运行 TypeScript 类型检查..."

    cd "$FRONTEND_DIR"

    if npx tsc --noEmit 2>&1; then
        log_success "TypeScript 类型检查通过"
    else
        log_error "TypeScript 类型检查失败"
    fi

    cd ..
}

# =============================================================================
# 检查 4: Vite 构建
# =============================================================================
check_build() {
    log_info "运行 Vite 构建..."

    cd "$FRONTEND_DIR"

    if npm run build 2>&1; then
        log_success "Vite 构建成功"

        # 检查构建输出
        if [ -d "dist" ]; then
            log_success "构建输出目录 dist/ 存在"

            # 检查主要 bundle 文件
            if ls dist/assets/*.js 1> /dev/null 2>&1; then
                log_success "JS bundle 文件已生成"
            else
                log_error "未找到 JS bundle 文件"
            fi

            if ls dist/assets/*.css 1> /dev/null 2>&1; then
                log_success "CSS bundle 文件已生成"
            else
                log_error "未找到 CSS bundle 文件"
            fi
        else
            log_error "构建输出目录 dist/ 不存在"
        fi
    else
        log_error "Vite 构建失败"
    fi

    cd ..
}

# =============================================================================
# 检查 5: 单元测试回归
# =============================================================================
check_unit_tests() {
    if [[ "$1" == "--skip-tests" ]]; then
        log_skip "跳过单元测试 (--skip-tests 参数)"
        return
    fi

    log_info "运行单元测试..."

    cd "$FRONTEND_DIR"

    TEST_OUTPUT=$(npm test 2>&1)
    TEST_EXIT_CODE=$?

    if [ $TEST_EXIT_CODE -eq 0 ]; then
        log_success "所有单元测试通过"

        # 检查测试数量
        if echo "$TEST_OUTPUT" | grep -q "passed"; then
            PASSED_COUNT=$(echo "$TEST_OUTPUT" | grep -oP '\d+(?= passed)' | head -1)
            log_success "测试通过数量: $PASSED_COUNT"
        fi
    else
        log_error "单元测试失败"
    fi

    cd ..
}

# =============================================================================
# 检查 6: ESLint 检查
# =============================================================================
check_lint() {
    log_info "运行 ESLint 检查..."

    cd "$FRONTEND_DIR"

    if npm run lint 2>&1; then
        log_success "ESLint 检查通过"
    else
        log_error "ESLint 检查失败"
    fi

    cd ..
}

# =============================================================================
# 检查 7: 开发服务器启动 (可选)
# =============================================================================
check_dev_server() {
    if [[ "$1" == "--skip-server" ]]; then
        log_skip "跳过开发服务器检查 (--skip-server 参数)"
        return
    fi

    log_info "检查开发服务器启动..."

    cd "$FRONTEND_DIR"

    # 启动开发服务器
    npm run dev &
    DEV_SERVER_PID=$!

    # 等待服务器启动
    sleep 10

    # 检查服务器是否运行
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        log_success "开发服务器启动成功 (http://localhost:5173)"
    else
        log_error "开发服务器启动失败"
    fi

    # 停止开发服务器
    kill $DEV_SERVER_PID 2>/dev/null

    cd ..
}

# =============================================================================
# 主函数
# =============================================================================
main() {
    echo ""
    echo "=============================================="
    echo "  EPI1.01: React 19 依赖升级 - 构建验证"
    echo "=============================================="
    echo ""

    check_node_version
    check_dependency_versions
    check_typescript
    check_build
    check_unit_tests "$1"
    check_lint
    check_dev_server "$2"

    echo ""
    echo "=============================================="
    echo "  验证结果汇总"
    echo "=============================================="
    echo ""
    echo -e "${GREEN}通过: $PASSED${NC}"
    echo -e "${RED}失败: $FAILED${NC}"
    echo -e "${YELLOW}跳过: $SKIPPED${NC}"
    echo ""

    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}✅ 所有检查通过！React 19 升级验证成功。${NC}"
        exit 0
    else
        echo -e "${RED}❌ 存在失败的检查，请修复后重新运行。${NC}"
        exit 1
    fi
}

# 运行主函数
main "$@"