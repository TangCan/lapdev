#!/bin/bash

# ========================================
# 端口配置同步脚本
# ========================================
# 用途：根据 .env.ports 文件中的配置，自动更新所有相关文件中的端口配置
# 使用：./scripts/update-config.sh

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 获取项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# 加载端口配置
load_config() {
    local config_file="$PROJECT_ROOT/.env.ports"
    
    if [ ! -f "$config_file" ]; then
        log_error "配置文件不存在: $config_file"
        exit 1
    fi
    
    # 导出配置变量
    export BACKEND_PORT=$(grep '^BACKEND_PORT=' "$config_file" | cut -d'=' -f2)
    export FRONTEND_PORT=$(grep '^FRONTEND_PORT=' "$config_file" | cut -d'=' -f2)
    export FRONTEND_PROD_PORT=$(grep '^FRONTEND_PROD_PORT=' "$config_file" | cut -d'=' -f2)
    export CONTAINER_PORT=$(grep '^CONTAINER_PORT=' "$config_file" | cut -d'=' -f2)
    export HOST_FRONTEND_PORT=$(grep '^HOST_FRONTEND_PORT=' "$config_file" | cut -d'=' -f2)
    export HOST_BACKEND_PORT=$(grep '^HOST_BACKEND_PORT=' "$config_file" | cut -d'=' -f2)
    export DEV_API_URL=$(grep '^DEV_API_URL=' "$config_file" | cut -d'=' -f2)
    export PROD_API_URL=$(grep '^PROD_API_URL=' "$config_file" | cut -d'=' -f2)
    export ALLOWED_ORIGINS=$(grep '^ALLOWED_ORIGINS=' "$config_file" | cut -d'=' -f2)
    export DEV_WS_URL=$(grep '^DEV_WS_URL=' "$config_file" | cut -d'=' -f2)
    export PROD_WS_URL=$(grep '^PROD_WS_URL=' "$config_file" | cut -d'=' -f2)
    
    log_info "配置加载成功"
    log_info "后端端口: $BACKEND_PORT"
    log_info "前端端口: $FRONTEND_PORT"
}

# 更新后端配置文件
update_backend_config() {
    log_info "更新后端配置文件..."
    
    local config_file="$PROJECT_ROOT/backend/src/config/index.ts"
    
    # 确保配置目录存在
    mkdir -p "$(dirname "$config_file")"
    
    # 创建后端配置文件
    cat > "$config_file" << EOF
export const PORT = parseInt(Deno.env.get('PORT') || '$BACKEND_PORT');

export const FRONTEND_PORT = parseInt(Deno.env.get('FRONTEND_PORT') || '$FRONTEND_PORT');

export const ALLOWED_ORIGINS = [
  \`http://localhost:\${PORT}\`,
  \`http://localhost:\${FRONTEND_PORT}\`,
  \`http://127.0.0.1:\${PORT}\`,
  \`http://127.0.0.1:\${FRONTEND_PORT}\`,
];

export const API_TIMEOUT = 30000;

export const WS_HEARTBEAT_INTERVAL = 30000;

export const FILE_WATCHER_INTERVAL = 3000;
EOF
    
    log_success "后端配置文件更新完成"
}

# 更新前端配置文件
update_frontend_config() {
    log_info "更新前端配置文件..."
    
    local config_file="$PROJECT_ROOT/frontend/src/config/index.ts"
    
    # 确保配置目录存在
    mkdir -p "$(dirname "$config_file")"
    
    # 创建前端配置文件
    cat > "$config_file" << EOF
export const API_URL = import.meta.env.VITE_API_URL || '$DEV_API_URL';

export const WS_URL = API_URL.replace('http://', 'ws://').replace('https://', 'wss://');

export const BACKEND_PORT = parseInt(import.meta.env.VITE_BACKEND_PORT || '$BACKEND_PORT');

export const FRONTEND_PORT = parseInt(import.meta.env.VITE_PORT || '$FRONTEND_PORT');

export const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000');

export const WS_TIMEOUT = parseInt(import.meta.env.VITE_WS_TIMEOUT || '30000');

export const FILE_TREE_REFRESH_INTERVAL = parseInt(import.meta.env.VITE_FILE_TREE_REFRESH_INTERVAL || '3000');

export const PAGE_LOAD_TIMEOUT = parseInt(import.meta.env.VITE_PAGE_LOAD_TIMEOUT || '3000');

export const HEARTBEAT_INTERVAL = parseInt(import.meta.env.VITE_HEARTBEAT_INTERVAL || '30000');
EOF
    
    log_success "前端配置文件更新完成"
}

# 更新测试配置文件
update_tests_config() {
    log_info "更新测试配置文件..."
    
    local config_file="$PROJECT_ROOT/tests/config/index.ts"
    
    # 确保配置目录存在
    mkdir -p "$(dirname "$config_file")"
    
    # 创建测试配置文件
    cat > "$config_file" << EOF
export const TEST_CONFIG = {
  BASE_URL: process.env.BASE_URL || '$DEV_API_URL',
  API_BASE_URL: process.env.API_BASE_URL || '$DEV_API_URL',
  VITE_API_URL: process.env.VITE_API_URL || '$DEV_API_URL',
  WS_URL: (process.env.BASE_URL || '$DEV_API_URL').replace('http://', 'ws://').replace('https://', 'wss://'),
  
  TIMEOUTS: {
    DEFAULT: 30000,
    LONG: 60000,
    SHORT: 5000,
  },
  
  PORTS: {
    BACKEND: parseInt(process.env.TEST_BACKEND_PORT || '$BACKEND_PORT'),
    FRONTEND: parseInt(process.env.TEST_FRONTEND_PORT || '$FRONTEND_PORT'),
  },
} as const;

export const {
  BASE_URL,
  API_BASE_URL,
  VITE_API_URL,
  WS_URL,
  TIMEOUTS,
  PORTS,
} = TEST_CONFIG;
EOF
    
    log_success "测试配置文件更新完成"
}

# 更新脚本配置文件
update_scripts_config() {
    log_info "更新脚本配置文件..."
    
    local config_file="$PROJECT_ROOT/scripts/config.sh"
    
    # 更新默认端口值
    sed -i "s/BACKEND_PORT=\${BACKEND_PORT:-[0-9]*}/BACKEND_PORT=\${BACKEND_PORT:-$BACKEND_PORT}/g" "$config_file"
    sed -i "s/FRONTEND_PORT=\${FRONTEND_PORT:-[0-9]*}/FRONTEND_PORT=\${FRONTEND_PORT:-$FRONTEND_PORT}/g" "$config_file"
    sed -i "s/FRONTEND_PROD_PORT=\${FRONTEND_PROD_PORT:-[0-9]*}/FRONTEND_PROD_PORT=\${FRONTEND_PROD_PORT:-$FRONTEND_PROD_PORT}/g" "$config_file"
    sed -i "s/CONTAINER_PORT=\${CONTAINER_PORT:-[0-9]*}/CONTAINER_PORT=\${CONTAINER_PORT:-$CONTAINER_PORT}/g" "$config_file"
    sed -i "s/HOST_FRONTEND_PORT=\${HOST_FRONTEND_PORT:-[0-9]*}/HOST_FRONTEND_PORT=\${HOST_FRONTEND_PORT:-$HOST_FRONTEND_PORT}/g" "$config_file"
    sed -i "s/HOST_BACKEND_PORT=\${HOST_BACKEND_PORT:-[0-9]*}/HOST_BACKEND_PORT=\${HOST_BACKEND_PORT:-$HOST_BACKEND_PORT}/g" "$config_file"
    
    log_success "脚本配置文件更新完成"
}

# 更新 Dockerfile
update_dockerfile() {
    log_info "更新 Dockerfile..."
    
    local dockerfile="$PROJECT_ROOT/Dockerfile"
    
    # 更新 ARG 默认值
    sed -i "s/ARG BACKEND_PORT=[0-9]*/ARG BACKEND_PORT=$BACKEND_PORT/g" "$dockerfile"
    
    log_success "Dockerfile 更新完成"
}

# 更新 Docker Compose
update_docker_compose() {
    log_info "更新 Docker Compose..."
    
    local docker_compose="$PROJECT_ROOT/docker-compose.yml"
    local podman_compose="$PROJECT_ROOT/podman-compose.yml"
    
    # 更新 docker-compose.yml
    if [ -f "$docker_compose" ]; then
        # 更新环境变量默认值
        sed -i "s/\${BACKEND_PORT:-[0-9]*}/\${BACKEND_PORT:-$BACKEND_PORT}/g" "$docker_compose"
        sed -i "s/\${HOST_BACKEND_PORT:-[0-9]*}/\${HOST_BACKEND_PORT:-$HOST_BACKEND_PORT}/g" "$docker_compose"
        sed -i "s/\${CONTAINER_PORT:-[0-9]*}/\${CONTAINER_PORT:-$CONTAINER_PORT}/g" "$docker_compose"
        log_success "docker-compose.yml 更新完成"
    fi
    
    # 更新 podman-compose.yml
    if [ -f "$podman_compose" ]; then
        sed -i "s/\${BACKEND_PORT:-[0-9]*}/\${BACKEND_PORT:-$BACKEND_PORT}/g" "$podman_compose"
        sed -i "s/\${HOST_BACKEND_PORT:-[0-9]*}/\${HOST_BACKEND_PORT:-$HOST_BACKEND_PORT}/g" "$podman_compose"
        sed -i "s/\${CONTAINER_PORT:-[0-9]*}/\${CONTAINER_PORT:-$CONTAINER_PORT}/g" "$podman_compose"
        log_success "podman-compose.yml 更新完成"
    fi
}

# 更新文档
update_docs() {
    log_info "更新文档..."
    
    # 更新 README.Docker.md
    local readme_docker="$PROJECT_ROOT/README.Docker.md"
    if [ -f "$readme_docker" ]; then
        sed -i "s/3000:3000/$HOST_BACKEND_PORT:$CONTAINER_PORT/g" "$readme_docker"
        sed -i "s/DENO_PORT.*3000/DENO_PORT | Deno 端口 | $BACKEND_PORT/g" "$readme_docker"
    fi
    
    # 更新 RELEASE_GUIDE.md
    local release_guide="$PROJECT_ROOT/RELEASE_GUIDE.md"
    if [ -f "$release_guide" ]; then
        sed -i "s/3000:3000/$HOST_BACKEND_PORT:$CONTAINER_PORT/g" "$release_guide"
    fi
    
    # 更新 RELEASE_SUMMARY.md
    local release_summary="$PROJECT_ROOT/RELEASE_SUMMARY.md"
    if [ -f "$release_summary" ]; then
        sed -i "s/3000:3000/$HOST_BACKEND_PORT:$CONTAINER_PORT/g" "$release_summary"
    fi
    
    log_success "文档更新完成"
}

# 创建 .env 文件（用于开发环境）
create_env_file() {
    log_info "创建 .env 文件..."
    
    local env_file="$PROJECT_ROOT/frontend/.env"
    
    cat > "$env_file" << EOF
# API 配置
VITE_API_URL=$DEV_API_URL

# WebSocket 配置（自动从 API URL 转换）
EOF
    
    log_success ".env 文件创建完成"
}

# 验证更新
verify_updates() {
    log_info "验证更新..."
    
    local errors=0
    
    # 检查后端配置文件
    if [ ! -f "$PROJECT_ROOT/backend/src/config/index.ts" ]; then
        log_error "后端配置文件不存在"
        errors=$((errors + 1))
    elif ! grep -q "parseInt(Deno.env.get('PORT') || '$BACKEND_PORT')" "$PROJECT_ROOT/backend/src/config/index.ts"; then
        log_error "后端端口配置不正确"
        errors=$((errors + 1))
    fi
    
    # 检查前端配置文件
    if [ ! -f "$PROJECT_ROOT/frontend/src/config/index.ts" ]; then
        log_error "前端配置文件不存在"
        errors=$((errors + 1))
    elif ! grep -q "$DEV_API_URL" "$PROJECT_ROOT/frontend/src/config/index.ts"; then
        log_error "前端 API URL 配置不正确"
        errors=$((errors + 1))
    fi
    
    # 检查测试配置文件
    if [ ! -f "$PROJECT_ROOT/tests/config/index.ts" ]; then
        log_error "测试配置文件不存在"
        errors=$((errors + 1))
    elif ! grep -q "$DEV_API_URL" "$PROJECT_ROOT/tests/config/index.ts"; then
        log_error "测试 API URL 配置不正确"
        errors=$((errors + 1))
    fi
    
    # 检查脚本配置文件
    if [ ! -f "$PROJECT_ROOT/scripts/config.sh" ]; then
        log_error "脚本配置文件不存在"
        errors=$((errors + 1))
    elif ! grep -q "BACKEND_PORT=\${BACKEND_PORT:-$BACKEND_PORT}" "$PROJECT_ROOT/scripts/config.sh"; then
        log_error "脚本配置文件端口配置不正确"
        errors=$((errors + 1))
    fi
    
    # 检查前端服务文件是否从配置导入
    if ! grep -q "import.*from.*config" "$PROJECT_ROOT/frontend/src/services/gitService.ts"; then
        log_warn "gitService.ts 可能未使用配置模块"
    fi
    
    if [ $errors -eq 0 ]; then
        log_success "所有更新验证通过"
        return 0
    else
        log_error "发现 $errors 个更新失败"
        return 1
    fi
}

# 主函数
main() {
    log_info "开始端口配置同步..."
    log_info "项目根目录: $PROJECT_ROOT"
    
    # 加载配置
    load_config
    
    # 更新配置文件
    update_backend_config
    update_frontend_config
    update_tests_config
    update_scripts_config
    update_dockerfile
    update_docker_compose
    update_docs
    create_env_file
    
    # 验证更新
    if verify_updates; then
        log_success "端口配置同步完成！"
        echo ""
        log_info "下一步："
        log_info "1. 检查修改的文件: git diff"
        log_info "2. 提交修改: git add -A && git commit -m '更新端口配置'"
        log_info "3. 重启服务: npm run dev"
    else
        log_error "端口配置同步失败"
        exit 1
    fi
}

# 执行主函数
main "$@"