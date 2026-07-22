#!/bin/bash

# 完整回归测试脚本
# 自动启动后端服务，运行所有测试，然后停止服务

# 加载共享配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/config.sh"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 设置代理环境变量 - 绕过 localhost
export no_proxy="localhost,127.0.0.1"
export NO_PROXY="localhost,127.0.0.1"
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY

# 后端服务配置
BACKEND_ENTRY="src/main.ts"

# 前端服务配置
FRONTEND_BASE_PORT="${FRONTEND_PORT}"

# 测试结果
TEST_RESULTS=()
ALL_PASSED=true

# 日志文件
LOG_FILE="/tmp/lapdev_regression_$(date '+%Y%m%d_%H%M%S').log"

# 显示标题
log_header() {
  echo -e "${YELLOW}============================================"
  echo "          完整回归测试套件"
  echo "============================================${NC}"
  echo ""
}

# 日志函数
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1" >> "${LOG_FILE}"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [SUCCESS] $1" >> "${LOG_FILE}"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARNING] $1" >> "${LOG_FILE}"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1" >> "${LOG_FILE}"
}

# 函数：检查端口是否可用
check_port() {
  local port=$1
  ss -tlnp 2>/dev/null | grep -q ":${port} " || netstat -tlnp 2>/dev/null | grep -q ":${port} "
}

# 函数：获取占用端口的进程ID
get_port_pid() {
  local port=$1
  local pid=$(ss -tlnp 2>/dev/null | grep ":${port} " | awk '{print $NF}' | sed 's/.*pid=\([0-9]*\).*/\1/' 2>/dev/null)
  if [ -z "$pid" ]; then
    pid=$(netstat -tlnp 2>/dev/null | grep ":${port} " | awk '{print $7}' | cut -d'/' -f1 2>/dev/null)
  fi
  echo "$pid"
}

# 函数：等待服务健康检查
wait_for_service() {
  local url=$1
  local max_attempts=$2
  local attempts=0

  log_info "等待服务: ${url} (最多 ${max_attempts} 次尝试)"

  while [ $attempts -lt $max_attempts ]; do
    if curl --noproxy '*' -s --max-time 2 "${url}" > /dev/null 2>&1; then
      log_success "服务 ${url} 已就绪"
      return 0
    fi
    sleep 1
    attempts=$((attempts + 1))
    if [ $((attempts % 5)) -eq 0 ]; then
      log_info "等待中... (${attempts}/${max_attempts})"
    fi
  done
  log_error "服务 ${url} 启动超时"
  return 1
}

# 函数：修复目录权限
fix_workspace_permissions() {
  local dir=$1
  if [ -d "${dir}" ]; then
    local current_user=$(whoami)
    local dir_owner=$(stat -c "%U" "${dir}")
    
    if [ "${dir_owner}" != "${current_user}" ]; then
      log_warning "工作目录 ${dir} 所有者为 ${dir_owner}，当前用户为 ${current_user}"
      if command -v sudo >/dev/null 2>&1; then
        log_info "尝试修复目录权限..."
        sudo chown -R "${current_user}":"${current_user}" "${dir}" 2>/dev/null
        if [ $? -eq 0 ]; then
          log_success "目录权限已修复"
        else
          log_warning "无法修复目录权限，可能导致测试失败"
        fi
      else
        log_warning "没有 sudo 权限，无法修复目录权限"
      fi
    fi
    
    chmod -R u+rw "${dir}" 2>/dev/null || true
  fi
}

# 函数：准备 Git 测试仓库
prepare_git_repo() {
  log_info "准备 Git 测试仓库..."
  
  mkdir -p "${WORKSPACE_PATH}"
  
  fix_workspace_permissions "${WORKSPACE_PATH}"
  
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
  if ! echo "Uncommitted change $(date +%s)" > "${WORKSPACE_PATH}/uncommitted.txt"; then
    log_warning "无法创建 uncommitted.txt，尝试使用临时文件"
    echo "Uncommitted change $(date +%s)" > /tmp/uncommitted.txt.tmp && cp /tmp/uncommitted.txt.tmp "${WORKSPACE_PATH}/uncommitted.txt" 2>/dev/null || true
    rm -f /tmp/uncommitted.txt.tmp
  fi
  git -C "${WORKSPACE_PATH}" add uncommitted.txt 2>/dev/null || true
  
  if ! echo "Modified content $(date +%s)" > "${WORKSPACE_PATH}/README.md"; then
    log_warning "无法修改 README.md"
  fi
  
  log_success "Git 仓库准备完成"
}

# 函数：启动后端服务（带重试）
start_backend_with_retry() {
  local max_retries=${1:-3}
  local retry_count=0
  
  while [ $retry_count -lt $max_retries ]; do
    log_info "启动后端服务 (尝试 $((retry_count + 1))/${max_retries})..."
    
    prepare_git_repo
    
    if check_port ${BACKEND_PORT}; then
      local pid=$(get_port_pid ${BACKEND_PORT})
      log_warning "端口 ${BACKEND_PORT} 已被占用 (PID: ${pid})，尝试清理..."
      kill -TERM "${pid}" 2>/dev/null || true
      sleep 2
    fi

    cd "${BACKEND_DIR}"
    
    export WORKSPACE_PATH="${WORKSPACE_PATH}"
    export ALLOWED_ORIGINS="${ALLOWED_ORIGINS}"
    
    nohup deno run --allow-all "${BACKEND_ENTRY}" > /tmp/backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..

    echo "${BACKEND_PID}" > /tmp/lapdev_backend.pid

    log_info "等待服务启动 (PID: ${BACKEND_PID})..."
    if wait_for_service "${BACKEND_URL}/api/v1/git/status" 30; then
      log_success "后端服务已启动 (PID: ${BACKEND_PID})"
      return 0
    fi

    log_error "后端服务启动超时，尝试重启..."
    kill -TERM "${BACKEND_PID}" 2>/dev/null || true
    sleep 2
    retry_count=$((retry_count + 1))
    
    cat /tmp/backend.log | tail -20
    echo "" > /tmp/backend.log
  done

  log_error "后端服务启动失败，已重试 ${max_retries} 次"
  cat /tmp/backend.log
  return 1
}

# 函数：启动前端服务（带重试）
start_frontend_with_retry() {
  local max_retries=${1:-3}
  local retry_count=0
  
  while [ $retry_count -lt $max_retries ]; do
    log_info "启动前端服务 (尝试 ${retry_count + 1}/${max_retries})..."
    
    cd "${FRONTEND_DIR}"
    
    nohup npm run dev -- --host 0.0.0.0 --port ${FRONTEND_BASE_PORT} > /tmp/frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..

    echo "${FRONTEND_PID}" > /tmp/lapdev_frontend.pid

    log_info "等待服务启动 (PID: ${FRONTEND_PID})..."
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
      if [ $((attempts % 10)) -eq 0 ]; then
        log_info "前端服务等待中... (${attempts}/${max_attempts})"
      fi
    done

    log_error "前端服务启动超时，尝试重启..."
    kill -TERM "${FRONTEND_PID}" 2>/dev/null || true
    sleep 2
    retry_count=$((retry_count + 1))
    
    cat /tmp/frontend.log | tail -20
    echo "" > /tmp/frontend.log
  done

  log_error "前端服务启动失败，已重试 ${max_retries} 次"
  cat /tmp/frontend.log
  return 1
}

# 函数：停止后端服务
stop_backend() {
  log_info "停止后端服务..."

  if [ -f /tmp/lapdev_backend.pid ]; then
    BACKEND_PID=$(cat /tmp/lapdev_backend.pid)
    kill -TERM "${BACKEND_PID}" 2>/dev/null || true
    sleep 1
    kill -KILL "${BACKEND_PID}" 2>/dev/null || true
    rm -f /tmp/lapdev_backend.pid
  fi

  pkill -f "deno run.*main.ts" 2>/dev/null || true
  
  sleep 2
  
  if check_port ${BACKEND_PORT}; then
    local pid=$(get_port_pid ${BACKEND_PORT})
    log_warning "端口 ${BACKEND_PORT} 仍被占用 (PID: ${pid})，强制终止..."
    kill -9 "${pid}" 2>/dev/null || true
    sleep 1
  fi
  
  log_success "后端服务已停止"
}

# 函数：停止前端服务
stop_frontend() {
  log_info "停止前端服务..."

  if [ -f /tmp/lapdev_frontend.pid ]; then
    FRONTEND_PID=$(cat /tmp/lapdev_frontend.pid)
    kill -TERM "${FRONTEND_PID}" 2>/dev/null || true
    sleep 1
    kill -KILL "${FRONTEND_PID}" 2>/dev/null || true
    rm -f /tmp/lapdev_frontend.pid
  fi

  pkill -9 -f "vite" 2>/dev/null || true
  pkill -9 -f "node.*vite" 2>/dev/null || true
  
  sleep 2
  
  for port in 5173 5174 5175 5176; do
    if check_port ${port}; then
      local pid=$(get_port_pid ${port})
      log_warning "端口 ${port} 仍被占用 (PID: ${pid})，强制终止..."
      kill -9 "${pid}" 2>/dev/null || true
    fi
  done
  
  log_success "前端服务已停止"
}

# 函数：清理所有测试相关进程
cleanup_all() {
  log_info "清理所有进程..."

  stop_backend
  stop_frontend

  pkill -f "playwright" 2>/dev/null || true
  pkill -f "chromium" 2>/dev/null || true
  pkill -f "firefox" 2>/dev/null || true
  pkill -f "webkit" 2>/dev/null || true

  sleep 2

  log_success "清理完成"
}

# 函数：检查并修复服务状态
ensure_service_available() {
  local service_name=$1
  local url=$2
  local start_func=$3
  local stop_func=$4
  
  log_info "检查 ${service_name} 状态..."
  
  if ! wait_for_service "${url}" 5; then
    log_warning "${service_name} 不可用，尝试重启..."
    ${stop_func}
    sleep 2
    if ! ${start_func}; then
      log_error "${service_name} 重启失败"
      return 1
    fi
  fi
  
  return 0
}

# 函数：运行测试并检查结果
run_test() {
  local test_name="$1"
  local test_command="$2"

  log_info "运行测试: ${test_name}"
  echo -e "\n${YELLOW}${test_name}${NC}"
  echo "------------------------------------------------"

  eval "${test_command}"
  local exit_code=$?

  if [ $exit_code -eq 0 ]; then
    echo -e "${GREEN}✓ ${test_name} 全部通过${NC}"
    TEST_RESULTS+=("✓ ${test_name}")
    log_success "${test_name} 全部通过"
  else
    echo -e "${RED}✗ ${test_name} 失败 (退出码: ${exit_code})${NC}"
    TEST_RESULTS+=("✗ ${test_name}")
    ALL_PASSED=false
    log_error "${test_name} 失败 (退出码: ${exit_code})"
  fi
}

# 清理函数（确保退出时停止服务）
cleanup() {
  cleanup_all
}

# 设置清理陷阱
trap cleanup EXIT INT TERM

# 初始化日志文件
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 回归测试开始" > "${LOG_FILE}"

# 显示标题
log_header

# 确保没有残留进程
cleanup_all

# 启动后端服务
if ! start_backend_with_retry; then
  log_error "后端服务启动失败，退出"
  exit 1
fi

# 启动前端服务
if ! start_frontend_with_retry; then
  log_error "前端服务启动失败，退出"
  exit 1
fi

# 设置环境变量
export BASE_URL="${FRONTEND_URL}"
export API_BASE_URL="${BACKEND_URL}"

# 运行测试套件

# 3. 前端单元测试
run_test "3. 前端单元测试" "npm run test:frontend 2>&1"

# 4. 后端单元测试
run_test "4. 后端单元测试" "npm run test:backend 2>&1"

# 5. 公共单元测试
run_test "5. 公共单元测试" "npm run test:unit 2>&1"

# 6. API集成测试
if ! ensure_service_available "后端服务" "${BACKEND_URL}/api/v1/git/status" "start_backend_with_retry" "stop_backend"; then
  log_error "API测试前后端服务不可用"
  exit 1
fi
run_test "6. API集成测试" "npm run test:api 2>&1"

# 7. E2E测试
if ! ensure_service_available "前端服务" "${FRONTEND_URL}" "start_frontend_with_retry" "stop_frontend"; then
  log_error "E2E测试前前端服务不可用"
  exit 1
fi

if ! ensure_service_available "后端服务" "${BACKEND_URL}/api/v1/git/status" "start_backend_with_retry" "stop_backend"; then
  log_error "E2E测试前后端服务不可用"
  exit 1
fi

run_test "7. E2E测试（除conversation history）" "npx playwright test tests/e2e/ --retries=2 --grep-invert 'conversation history' 2>&1"

# 等待资源释放
sleep 3

# 重启后端服务（确保状态干净）
log_info "重启后端服务..."
stop_backend
sleep 2
if ! start_backend_with_retry; then
  log_error "后端服务重启失败"
  exit 1
fi

# 单独串行运行conversation history测试
echo -e "\n${YELLOW}7b. E2E测试 - conversation history（串行执行）${NC}"
echo "------------------------------------------------"
if npx playwright test tests/e2e/ai-chat.spec.ts --grep "conversation history" --workers=1 --retries=2 2>&1; then
  echo -e "${GREEN}✓ E2E测试 - conversation history 全部通过${NC}"
  TEST_RESULTS+=("✓ E2E测试 - conversation history")
  log_success "E2E测试 - conversation history 全部通过"
else
  echo -e "${RED}✗ E2E测试 - conversation history 失败${NC}"
  TEST_RESULTS+=("✗ E2E测试 - conversation history")
  ALL_PASSED=false
  log_error "E2E测试 - conversation history 失败"
fi

# 显示测试总结
echo -e "\n${YELLOW}============================================"
echo "              测试结果总结"
echo "============================================${NC}"

for result in "${TEST_RESULTS[@]}"; do
  echo "${result}"
done

echo -e "\n"

if [ "$ALL_PASSED" = true ]; then
  echo -e "${GREEN}✓ 所有测试通过！${NC}"
  log_success "所有测试通过！"
  exit 0
else
  echo -e "${RED}✗ 部分测试失败，请查看上面的详细输出${NC}"
  log_error "部分测试失败"
  exit 1
fi