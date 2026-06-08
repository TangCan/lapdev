#!/bin/bash

# 完整回归测试脚本
# 自动启动后端服务，运行所有测试，然后停止服务

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 设置代理环境变量 - 绕过 localhost
export no_proxy="localhost,127.0.0.1"
export NO_PROXY="localhost,127.0.0.1"
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY

# 后端服务配置
BACKEND_DIR="backend"
BACKEND_ENTRY="src/main.ts"
BACKEND_PORT="3000"
BACKEND_URL="http://localhost:${BACKEND_PORT}"

# 工作区目录配置 - 使用后端期望的 WORKSPACE_PATH 环境变量
WORKSPACE_PATH="${PWD}/workspace"

# 前端服务配置
FRONTEND_DIR="frontend"
FRONTEND_BASE_PORT="5173"
FRONTEND_URL=""  # 动态获取

# 测试结果
TEST_RESULTS=()
ALL_PASSED=true

# 显示标题
echo -e "${YELLOW}============================================"
echo "          完整回归测试套件"
echo "============================================${NC}"
echo ""

# 函数：检查端口是否可用
check_port() {
  local port=$1
  ss -tln | grep -q ":${port} "
}

# 函数：等待服务健康检查
wait_for_service() {
  local url=$1
  local max_attempts=$2
  local attempts=0

  while [ $attempts -lt $max_attempts ]; do
    # 取消代理设置，否则curl会通过代理访问localhost
    if curl --noproxy '*' -s --max-time 2 "${url}" > /dev/null 2>&1; then
      return 0
    fi
    sleep 1
    attempts=$((attempts + 1))
  done
  return 1
}

# 函数：启动后端服务
start_backend() {
  echo -e "${YELLOW}1. 启动后端服务...${NC}"
  
  # 确保端口未被占用
  if check_port ${BACKEND_PORT}; then
    echo -e "   ${RED}端口 ${BACKEND_PORT} 已被占用${NC}"
    return 1
  fi

  cd "${BACKEND_DIR}"
  
  # 设置正确的环境变量：WORKSPACE_PATH 和 ALLOWED_ORIGINS
  export WORKSPACE_PATH="${WORKSPACE_PATH}"
  export ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173,http://localhost:5174,http://localhost:5175"
  
  # 使用 nohup 启动服务，确保在后台持续运行
  nohup deno run --allow-all "${BACKEND_ENTRY}" > /tmp/backend.log 2>&1 &
  BACKEND_PID=$!
  cd ..

  echo "${BACKEND_PID}" > /tmp/lapdev_backend.pid

  echo "   等待服务启动..."
  if wait_for_service "${BACKEND_URL}/api/v1/git/status" 30; then
    echo -e "   ${GREEN}后端服务已启动 (PID: ${BACKEND_PID})${NC}"
    return 0
  fi

  echo -e "   ${RED}后端服务启动超时${NC}"
  cat /tmp/backend.log
  kill -TERM "${BACKEND_PID}" 2>/dev/null || true
  return 1
}

# 函数：启动前端服务
start_frontend() {
  echo -e "${YELLOW}2. 启动前端服务...${NC}"
  
  cd "${FRONTEND_DIR}"
  
  # 使用 nohup 启动服务
  nohup npm run dev -- --host 0.0.0.0 --port ${FRONTEND_BASE_PORT} > /tmp/frontend.log 2>&1 &
  FRONTEND_PID=$!
  cd ..

  echo "${FRONTEND_PID}" > /tmp/lapdev_frontend.pid

  echo "   等待服务启动..."
  local attempts=0
  local max_attempts=40

  while [ $attempts -lt $max_attempts ]; do
    # 检查多个可能的端口
    for port in 5173 5174 5175 5176; do
      if check_port ${port}; then
        # 端口已监听，验证服务是否响应
        if wait_for_service "http://localhost:${port}" 2; then
          FRONTEND_URL="http://localhost:${port}"
          echo -e "   ${GREEN}前端服务已启动 (PID: ${FRONTEND_PID}, 端口: ${port})${NC}"
          return 0
        fi
      fi
    done
    sleep 1
    attempts=$((attempts + 1))
  done

  echo -e "   ${RED}前端服务启动超时${NC}"
  cat /tmp/frontend.log
  kill -TERM "${FRONTEND_PID}" 2>/dev/null || true
  return 1
}

# 函数：停止后端服务
stop_backend() {
  echo -e "\n${YELLOW}7. 停止后端服务...${NC}"

  if [ -f /tmp/lapdev_backend.pid ]; then
    BACKEND_PID=$(cat /tmp/lapdev_backend.pid)
    kill -TERM "${BACKEND_PID}" 2>/dev/null || true
    rm -f /tmp/lapdev_backend.pid
  fi

  # 清理任何残留的 deno 进程
  pkill -f "deno run.*main.ts" 2>/dev/null || true
  echo -e "   ${GREEN}后端服务已停止${NC}"
}

# 函数：停止前端服务
stop_frontend() {
  echo -e "\n${YELLOW}8. 停止前端服务...${NC}"

  if [ -f /tmp/lapdev_frontend.pid ]; then
    FRONTEND_PID=$(cat /tmp/lapdev_frontend.pid)
    kill -TERM "${FRONTEND_PID}" 2>/dev/null || true
    rm -f /tmp/lapdev_frontend.pid
  fi

  # 清理任何残留的 vite 进程
  pkill -9 -f "vite" 2>/dev/null || true
  pkill -9 -f "node.*vite" 2>/dev/null || true
  echo -e "   ${GREEN}前端服务已停止${NC}"
}

# 函数：清理所有测试相关进程
cleanup_all() {
  echo -e "\n${YELLOW}清理所有进程...${NC}"

  # 停止后端
  stop_backend

  # 停止前端
  stop_frontend

  # 清理 Playwright 相关进程
  pkill -f "playwright" 2>/dev/null || true
  pkill -f "chromium" 2>/dev/null || true
  pkill -f "firefox" 2>/dev/null || true
  pkill -f "webkit" 2>/dev/null || true

  # 等待进程完全终止
  sleep 2

  echo -e "   ${GREEN}清理完成${NC}"
}

# 函数：运行测试并检查结果
run_test() {
  local test_name="$1"
  local test_command="$2"

  echo -e "\n${YELLOW}${test_name}${NC}"
  echo "------------------------------------------------"

  eval "${test_command}"
  local exit_code=$?

  if [ $exit_code -eq 0 ]; then
    echo -e "${GREEN}✓ ${test_name} 全部通过${NC}"
    TEST_RESULTS+=("✓ ${test_name}")
  else
    echo -e "${RED}✗ ${test_name} 失败 (退出码: ${exit_code})${NC}"
    TEST_RESULTS+=("✗ ${test_name}")
    ALL_PASSED=false
  fi
}

# 清理函数（确保退出时停止服务）
cleanup() {
  cleanup_all
}

# 设置清理陷阱 - 使用 EXIT 而不是 ERR
trap cleanup EXIT INT TERM

# 确保没有残留进程
cleanup_all

# 启动后端服务
if ! start_backend; then
  echo -e "${RED}后端服务启动失败，退出${NC}"
  exit 1
fi

# 启动前端服务（用于E2E测试）
if ! start_frontend; then
  echo -e "${RED}前端服务启动失败，退出${NC}"
  exit 1
fi

# 设置 Playwright 使用前端地址
export BASE_URL="${FRONTEND_URL}"

# 设置 API 测试使用后端地址
export API_BASE_URL="${BACKEND_URL}"

# 运行测试套件

# 3. 前端单元测试
run_test "3. 前端单元测试" "npm run test:frontend 2>&1"

# 4. 后端单元测试
run_test "4. 后端单元测试" "npm run test:backend 2>&1"

# 5. 公共单元测试
run_test "5. 公共单元测试" "npm run test:unit 2>&1"

# 6. API集成测试（需要后端服务）
run_test "6. API集成测试" "npm run test:api 2>&1"

# 7. E2E测试（需要前端和后端服务）
# 在运行前检查服务状态
echo -e "\n${YELLOW}检查前端服务状态...${NC}"
if ! wait_for_service "${FRONTEND_URL}" 5; then
  echo -e "${RED}前端服务不可用，尝试重启...${NC}"
  stop_frontend
  start_frontend
fi

echo -e "\n${YELLOW}检查后端服务状态...${NC}"
if ! wait_for_service "${BACKEND_URL}/api/v1/git/status" 5; then
  echo -e "${RED}后端服务不可用，尝试重启...${NC}"
  stop_backend
  start_backend
fi

# 先运行除了conversation history测试之外的所有E2E测试
run_test "7. E2E测试（除conversation history）" "npx playwright test tests/e2e/ --retries=2 --grep-invert 'conversation history' 2>&1"

# 等待2秒释放资源
sleep 2

# 重启后端服务，确保AI mock服务状态正常
echo -e "\n${YELLOW}重启后端服务...${NC}"
stop_backend
start_backend

# 单独串行运行conversation history测试
echo -e "\n${YELLOW}7b. E2E测试 - conversation history（串行执行）${NC}"
echo "------------------------------------------------"
if npx playwright test tests/e2e/ai-chat.spec.ts --grep "conversation history" --workers=1 --retries=2 2>&1; then
  echo -e "${GREEN}✓ E2E测试 - conversation history 全部通过${NC}"
  TEST_RESULTS+=("✓ E2E测试 - conversation history")
else
  echo -e "${RED}✗ E2E测试 - conversation history 失败${NC}"
  TEST_RESULTS+=("✗ E2E测试 - conversation history")
  ALL_PASSED=false
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
  exit 0
else
  echo -e "${RED}✗ 部分测试失败，请查看上面的详细输出${NC}"
  exit 1
fi
