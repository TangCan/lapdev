/**
 * NFR-001: 服务器启动时间性能测试
 * 
 * 测试目标: 验证服务器启动时间 < 2秒
 * 
 * 测试方法:
 * 1. 启动后端 Deno 服务器
 * 2. 轮询健康检查端点直到服务就绪
 * 3. 记录从启动到就绪的时间
 * 4. 验证是否在 2秒内完成
 */

import { assert, assertLess } from "https://deno.land/std@0.214.0/testing/asserts.ts";

const SERVER_STARTUP_THRESHOLD_MS = 2000;
const HEALTH_CHECK_URL = "http://localhost:3333/health";
const MAX_RETRY_COUNT = 60;
const RETRY_INTERVAL_MS = 100;

async function waitForHealthCheck(): Promise<boolean> {
  for (let i = 0; i < MAX_RETRY_COUNT; i++) {
    try {
      const response = await fetch(HEALTH_CHECK_URL, { method: "GET" });
      if (response.ok) {
        const data = await response.json();
        if (data.status === "ok") {
          return true;
        }
      }
    } catch {
      // 服务还未启动，继续重试
    }
    await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL_MS));
  }
  return false;
}

async function main() {
  console.log("========== NFR-001: 服务器启动时间测试 ==========");
  console.log(`阈值: ${SERVER_STARTUP_THRESHOLD_MS}ms`);
  console.log(`开始时间: ${new Date().toISOString()}`);
  console.log("=============================================\n");

  const startTime = performance.now();

  let process: Deno.ChildProcess | null = null;

  try {
    console.log("1. 启动后端服务器...");
    
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
    
    const elapsedTime = performance.now() - startTime;

    console.log(`3. 服务器启动完成`);
    console.log(`   启动时间: ${elapsedTime.toFixed(2)}ms`);
    console.log(`   阈值: ${SERVER_STARTUP_THRESHOLD_MS}ms`);
    
    if (isReady) {
      const passed = elapsedTime < SERVER_STARTUP_THRESHOLD_MS;
      
      console.log(`\n结果: ${passed ? '✅ PASS' : '❌ FAIL'}`);
      
      if (passed) {
        console.log(`服务器启动时间 ${elapsedTime.toFixed(2)}ms 小于阈值 ${SERVER_STARTUP_THRESHOLD_MS}ms`);
      } else {
        console.log(`服务器启动时间 ${elapsedTime.toFixed(2)}ms 超过阈值 ${SERVER_STARTUP_THRESHOLD_MS}ms`);
      }
      
      assert(isReady, "服务器健康检查失败");
      assertLess(elapsedTime, SERVER_STARTUP_THRESHOLD_MS, 
        `服务器启动时间应 < ${SERVER_STARTUP_THRESHOLD_MS}ms，实际为 ${elapsedTime.toFixed(2)}ms`);
      
      console.log("\n✅ 测试通过！");
      Deno.exit(0);
    } else {
      console.log("\n❌ 测试失败: 服务器未在预期时间内就绪");
      Deno.exit(1);
    }

  } catch (error) {
    console.log(`\n❌ 测试失败: ${error.message}`);
    console.error(error);
    Deno.exit(1);
  } finally {
    if (process) {
      console.log("\n4. 清理: 停止服务器...");
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