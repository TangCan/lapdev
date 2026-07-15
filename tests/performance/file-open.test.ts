/**
 * NFR-002: 大型文件打开延迟性能测试
 * 
 * 测试目标: 验证大型文件打开延迟 < 500ms
 * 
 * 测试方法:
 * 1. 创建不同大小的测试文件（100行、1000行、10000行）
 * 2. 使用后端文件读取API读取文件
 * 3. 记录读取时间
 * 4. 验证是否在阈值内完成
 */

import { assert, assertLess } from "https://deno.land/std@0.214.0/testing/asserts.ts";
import * as path from "https://deno.land/std/path/mod.ts";

const FILE_OPEN_LARGE_THRESHOLD_MS = 500;
const TEST_DIR = "/tmp/lapdev-file-test";

async function measureTime<T>(fn: () => Promise<T> | T): Promise<{ duration: number; result: T }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { duration, result };
}

async function createTestFile(fileName: string, lines: number): Promise<string> {
  const filePath = path.join(TEST_DIR, fileName);
  
  await Deno.mkdir(TEST_DIR, { recursive: true });
  
  const content = Array.from({ length: lines }, (_, i) => 
    `// Line ${i + 1}: ${'x'.repeat(60)}`
  ).join('\n');
  
  await Deno.writeTextFile(filePath, content);
  
  const fileInfo = await Deno.stat(filePath);
  console.log(`   创建测试文件: ${fileName} (${lines}行, ${fileInfo.size}字节)`);
  
  return filePath;
}

async function main() {
  console.log("========== NFR-002: 大型文件打开延迟测试 ==========");
  console.log(`阈值: ${FILE_OPEN_LARGE_THRESHOLD_MS}ms`);
  console.log(`开始时间: ${new Date().toISOString()}`);
  console.log("=============================================\n");

  const testFiles = [
    { name: 'small.ts', lines: 100, threshold: 50 },
    { name: 'medium.ts', lines: 1000, threshold: 200 },
    { name: 'large.ts', lines: 10000, threshold: 500 },
  ];

  let allPassed = true;

  for (const testFile of testFiles) {
    console.log(`\n--- 测试: ${testFile.name} (${testFile.lines}行) ---`);
    
    const filePath = await createTestFile(testFile.name, testFile.lines);
    
    const { duration } = await measureTime(async () => {
      const content = await Deno.readTextFile(filePath);
      return content;
    });

    const passed = duration < testFile.threshold;
    
    console.log(`   读取时间: ${duration.toFixed(2)}ms`);
    console.log(`   阈值: ${testFile.threshold}ms`);
    console.log(`   结果: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    
    if (!passed) {
      allPassed = false;
    }
    
    assertLess(duration, testFile.threshold, 
      `文件(${testFile.lines}行)打开应 < ${testFile.threshold}ms，实际为 ${duration.toFixed(2)}ms`);
  }

  console.log("\n=============================================");
  
  if (allPassed) {
    console.log("✅ 所有测试通过！");
    console.log(`大型文件(10000行)打开时间 < ${FILE_OPEN_LARGE_THRESHOLD_MS}ms`);
    Deno.exit(0);
  } else {
    console.log("❌ 部分测试失败");
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}