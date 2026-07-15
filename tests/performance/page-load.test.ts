/**
 * NFR-004: 页面加载时间性能测试
 * 
 * 测试目标: 验证页面加载时间 < 3秒
 * 
 * 测试方法:
 * 1. 启动后端服务器（包含前端静态文件服务）
 * 2. 获取 index.html
 * 3. 解析 HTML 获取所有资源引用（JS、CSS、图片等）
 * 4. 并行获取所有资源
 * 5. 测量总加载时间
 * 6. 验证是否在阈值内完成
 */

import { assert, assertLess } from "https://deno.land/std@0.214.0/testing/asserts.ts";
import * as path from "https://deno.land/std/path/mod.ts";

const PAGE_LOAD_THRESHOLD_MS = 3000;
const BASE_URL = "http://localhost:3333";

interface ResourceInfo {
  url: string;
  size: number;
  duration: number;
}

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

function extractResourceUrls(html: string): string[] {
  const urls: string[] = [];
  
  const scriptRegex = /<script[^>]+src=["']([^"']+)["']/gi;
  const linkRegex = /<link[^>]+href=["']([^"']+)["']/gi;
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    urls.push(match[1]);
  }
  while ((match = linkRegex.exec(html)) !== null) {
    urls.push(match[1]);
  }
  while ((match = imgRegex.exec(html)) !== null) {
    urls.push(match[1]);
  }
  
  return urls.filter(url => url.startsWith('/') || url.startsWith('http'));
}

async function fetchResource(url: string): Promise<ResourceInfo> {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  
  const { duration } = await measureTime(async () => {
    const response = await fetch(fullUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }
    const content = await response.text();
    return content.length;
  });
  
  return {
    url,
    size: (await fetch(fullUrl)).headers.get('content-length') 
      ? parseInt((await fetch(fullUrl)).headers.get('content-length')!)
      : 0,
    duration
  };
}

async function main() {
  console.log("========== NFR-004: 页面加载时间测试 ==========");
  console.log(`阈值: ${PAGE_LOAD_THRESHOLD_MS}ms`);
  console.log(`开始时间: ${new Date().toISOString()}`);
  console.log("=============================================\n");

  let process: Deno.ChildProcess | null = null;

  try {
    console.log("1. 确保前端已构建...");
    const distPath = path.join(Deno.cwd(), 'frontend', 'dist');
    if (!await Deno.stat(distPath).catch(() => null)) {
      console.log("   构建前端...");
      const buildProcess = new Deno.Command('npm', {
        args: ['run', 'build'],
        cwd: path.join(Deno.cwd(), 'frontend'),
      });
      const buildResult = await buildProcess.output();
      if (!buildResult.success) {
        console.error("前端构建失败");
        Deno.exit(1);
      }
      console.log("   前端构建完成");
    } else {
      console.log("   前端已构建");
    }

    await Deno.mkdir("/tmp/lapdev-test-workspace", { recursive: true });
    
    console.log("2. 启动后端服务器...");
    
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

    console.log("3. 等待服务器就绪...");
    const isReady = await waitForHealthCheck();
    assert(isReady, "服务器未在预期时间内就绪");

    console.log("\n4. 测量页面加载时间...");
    
    const { duration: totalLoadTime, result: resources } = await measureTime(async () => {
      const htmlResponse = await fetch(`${BASE_URL}/`);
      const html = await htmlResponse.text();
      console.log(`   index.html 加载完成 (${html.length} 字符)`);
      
      const resourceUrls = extractResourceUrls(html);
      console.log(`   发现资源: ${resourceUrls.length} 个`);
      
      const fetchPromises = resourceUrls.map(url => fetchResource(url));
      const results = await Promise.all(fetchPromises);
      
      return results;
    });

    console.log("\n--- 资源加载详情 ---");
    resources.forEach((res, index) => {
      console.log(`${index + 1}. ${res.url}`);
      console.log(`   大小: ${res.size > 0 ? (res.size / 1024).toFixed(2) + 'KB' : '未知'}`);
      console.log(`   加载时间: ${res.duration.toFixed(2)}ms`);
    });

    const passed = totalLoadTime < PAGE_LOAD_THRESHOLD_MS;
    
    console.log(`\n--- 页面加载总时间: ${totalLoadTime.toFixed(2)}ms ---`);
    console.log(`阈值: ${PAGE_LOAD_THRESHOLD_MS}ms`);
    console.log(`结果: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    
    assertLess(totalLoadTime, PAGE_LOAD_THRESHOLD_MS, 
      `页面加载时间应 < ${PAGE_LOAD_THRESHOLD_MS}ms，实际为 ${totalLoadTime.toFixed(2)}ms`);

    console.log("\n=============================================");
    console.log("✅ 测试通过！");
    console.log(`页面加载时间 < ${PAGE_LOAD_THRESHOLD_MS}ms`);
    Deno.exit(0);

  } catch (error) {
    console.log(`\n❌ 测试失败: ${error.message}`);
    console.error(error);
    Deno.exit(1);
  } finally {
    if (process) {
      console.log("\n5. 清理: 停止服务器...");
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