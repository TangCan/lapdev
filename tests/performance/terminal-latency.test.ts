/**
 * NFR-003: 终端响应延迟性能测试
 * 
 * 测试目标: 验证终端响应延迟 < 50ms
 * 
 * 测试方法:
 * 1. 启动后端服务器
 * 2. 创建终端会话
 * 3. 发送命令（echo "hello"、ls、pwd）
 * 4. 轮询输出直到收到响应
 * 5. 测量从发送命令到收到响应的时间
 * 6. 验证是否在阈值内完成
 */

import { assert, assertLess } from "https://deno.land/std@0.214.0/testing/asserts.ts";

const TERMINAL_LATENCY_THRESHOLD_MS = 50;
const BASE_URL = "http://localhost:3333";
const MAX_RETRY_COUNT = 50;
const RETRY_INTERVAL_MS = 5;

async function measureTime<T>(fn: () => Promise<T> | T): Promise<{ duration: number; result: T }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { duration, result };
}

async function waitForHealthCheck(): Promise<boolean> {
  for (let i = 0; i < 60; i++) {
    try {
      const response = await fetch(`${BASE_URL}/health`, { method: "GET" });
      if (response.ok) {
        const data = await response.json();
        if (data.status === "ok") return true;
      }
    } catch {
      // continue
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return false;
}

async function createTerminalSession(): Promise<string> {
  const response = await fetch(`${BASE_URL}/api/v1/terminal/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  
  const data = await response.json();
  assert(data.status === "success", "创建终端会话失败");
  return data.sessionId;
}

async function sendCommand(sessionId: string, command: string): Promise<void> {
  await fetch(`${BASE_URL}/api/v1/terminal/command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, command }),
  });
}

async function waitForOutput(sessionId: string, expectedContent: string): Promise<string> {
  for (let i = 0; i < MAX_RETRY_COUNT; i++) {
    const response = await fetch(`${BASE_URL}/api/v1/terminal/output?sessionId=${sessionId}`, {
      method: "GET",
    });
    
    const data = await response.json();
    if (data.output && data.output.includes(expectedContent)) {
      return data.output;
    }
    
    await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL_MS));
  }
  
  throw new Error(`等待输出超时，未找到内容: ${expectedContent}`);
}

async function main() {
  console.log("========== NFR-003: 终端响应延迟测试 ==========");
  console.log(`阈值: ${TERMINAL_LATENCY_THRESHOLD_MS}ms`);
  console.log(`开始时间: ${new Date().toISOString()}`);
  console.log("=============================================\n");

  let process: Deno.ChildProcess | null = null;
  let sessionId: string | null = null;

  try {
    console.log("1. 启动后端服务器...");
    
    await Deno.mkdir("/tmp/lapdev-test-workspace", { recursive: true });
    
    process = new Deno.Command(Deno.execPath(), {
      args: ["run", "--no-lock", "-A", "backend/src/main.ts"],
      cwd: Deno.cwd(),
      stdout: "piped",
      stderr: "piped",
      env: {
        ...Deno.env.toObject(),
        "WORKSPACE_PATH": "/tmp/lapdev-test-workspace",
        "PORT": "3333",
      },
    }).spawn();

    console.log("2. 等待服务器就绪...");
    const isReady = await waitForHealthCheck();
    assert(isReady, "服务器未在预期时间内就绪");

    console.log("3. 创建终端会话...");
    sessionId = await createTerminalSession();
    console.log(`   会话ID: ${sessionId}`);

    console.log("4. 预热: 发送空命令初始化 bash 环境...");
    await sendCommand(sessionId, '');
    await waitForOutput(sessionId, '$');
    console.log("   bash 环境初始化完成");

    const testCommands = [
      { command: 'echo "hello"', expected: 'hello' },
      { command: 'pwd', expected: '/tmp/lapdev-test-workspace' },
      { command: 'ls', expected: '' },
    ];

    let allPassed = true;

    for (const testCmd of testCommands) {
      console.log(`\n--- 测试命令: ${testCmd.command} ---`);
      
      const { duration } = await measureTime(async () => {
        await sendCommand(sessionId!, testCmd.command);
        await waitForOutput(sessionId!, testCmd.expected || testCmd.command);
      });

      const passed = duration < TERMINAL_LATENCY_THRESHOLD_MS;
      
      console.log(`   响应延迟: ${duration.toFixed(2)}ms`);
      console.log(`   阈值: ${TERMINAL_LATENCY_THRESHOLD_MS}ms`);
      console.log(`   结果: ${passed ? '✅ PASS' : '❌ FAIL'}`);
      
      if (!passed) {
        allPassed = false;
      }
      
      assertLess(duration, TERMINAL_LATENCY_THRESHOLD_MS, 
        `终端响应延迟应 < ${TERMINAL_LATENCY_THRESHOLD_MS}ms，实际为 ${duration.toFixed(2)}ms`);
    }

    console.log("\n=============================================");
    
    if (allPassed) {
      console.log("✅ 所有测试通过！");
      console.log(`终端响应延迟 < ${TERMINAL_LATENCY_THRESHOLD_MS}ms`);
      Deno.exit(0);
    } else {
      console.log("❌ 部分测试失败");
      Deno.exit(1);
    }

  } catch (error) {
    console.log(`\n❌ 测试失败: ${error.message}`);
    console.error(error);
    Deno.exit(1);
  } finally {
    if (sessionId) {
      console.log("\n4. 清理: 关闭终端会话...");
      try {
        await fetch(`${BASE_URL}/api/v1/terminal/close`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        console.log("终端会话已关闭");
      } catch {
        // ignore
      }
    }
    
    if (process) {
      console.log("5. 清理: 停止服务器...");
      process.kill();
      await process.status;
      console.log("服务器已停止");
    }
    console.log("\n=============================================");
  }
}

if (import.meta.main) {
  await main();
}