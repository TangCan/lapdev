/**
 * Unit tests for formatCache.ts
 *
 * Story: EPI2.03 - 范围格式化与增量更新
 * Test Levels: Unit (Vitest)
 * Coverage: FormatCache LRU 缓存、内容哈希计算、缓存命中率、淘汰机制
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  computeContentHash,
  FormatCache,
  getFormatCache,
} from './formatCache';

// ============================================================
// 测试套件
// ============================================================

describe('FormatCache - 内容哈希计算', () => {
  let cache: FormatCache;

  beforeEach(() => {
    cache = new FormatCache();
  });

  it('[P1] 相同内容产生相同哈希', () => {
    const hash1 = computeContentHash('function test(){return 1}');
    const hash2 = computeContentHash('function test(){return 1}');
    expect(hash1).toBe(hash2);
  });

  it('[P1] 不同内容产生不同哈希', () => {
    const hash1 = computeContentHash('function test(){return 1}');
    const hash2 = computeContentHash('function test(){return 2}');
    expect(hash1).not.toBe(hash2);
  });

  it('[P1] 哈希为非空字符串', () => {
    const hash = computeContentHash('test content');
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('[P1] 带范围的哈希与不带范围的不同', () => {
    const content = 'function test(){return 1}';
    const hashWithoutRange = computeContentHash(content);
    const hashWithRange = computeContentHash(content, { startLine: 10, endLine: 20 });
    expect(hashWithoutRange).not.toBe(hashWithRange);
  });

  it('[P1] 不同范围产生不同哈希', () => {
    const content = 'function test(){return 1}';
    const hash1 = computeContentHash(content, { startLine: 10, endLine: 20 });
    const hash2 = computeContentHash(content, { startLine: 30, endLine: 40 });
    expect(hash1).not.toBe(hash2);
  });
});

describe('FormatCache - 存储和检索', () => {
  let cache: FormatCache;

  beforeEach(() => {
    cache = new FormatCache();
  });

  it('[P1] 存储后可检索', () => {
    const content = 'function cached(){return 1}';
    const formatted = 'function cached() {\n  return 1;\n}';
    const hash = computeContentHash(content);

    cache.set(hash, formatted);
    const result = cache.get(hash);
    expect(result).toBe(formatted);
  });

  it('[P1] 检索不存在的键返回 undefined', () => {
    const result = cache.get('nonexistent-key');
    expect(result).toBeUndefined();
  });

  it('[P1] 存储相同键会覆盖旧值', () => {
    const key = 'test-key';
    cache.set(key, 'value1');
    cache.set(key, 'value2');
    expect(cache.get(key)).toBe('value2');
    expect(cache.size).toBe(1);
  });

  it('[P1] contains 检测键是否存在', () => {
    const key = 'test-key';
    expect(cache.contains(key)).toBe(false);
    cache.set(key, 'value');
    expect(cache.contains(key)).toBe(true);
  });

  it('[P1] clear 清空缓存', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    expect(cache.size).toBe(2);
    cache.clear();
    expect(cache.size).toBe(0);
  });

  it('[P1] invalidate 使指定条目失效', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.invalidate('key1');
    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key2')).toBe('value2');
  });
});

describe('FormatCache - LRU 淘汰机制', () => {
  it('[P1] 超出容量时淘汰最早条目', () => {
    const cache = new FormatCache({ maxSize: 10 });

    for (let i = 0; i < 20; i++) {
      cache.set(`key${i}`, `value${i}`);
    }

    expect(cache.size).toBeLessThanOrEqual(10);
    expect(cache.get('key0')).toBeUndefined();
    expect(cache.get('key19')).toBe('value19');
  });

  it('[P1] 访问条目后移到末尾 (最近使用)', () => {
    const cache = new FormatCache({ maxSize: 3 });

    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');

    // 访问 key1，使其成为最近使用
    cache.get('key1');

    // 添加新条目，应淘汰 key2 (最久未使用)
    cache.set('key4', 'value4');

    expect(cache.get('key1')).toBe('value1');
    expect(cache.get('key2')).toBeUndefined();
    expect(cache.get('key3')).toBe('value3');
    expect(cache.get('key4')).toBe('value4');
  });

  it('[P1] 默认容量为 50', () => {
    const cache = new FormatCache();
    expect(cache.size).toBe(0);

    for (let i = 0; i < 60; i++) {
      cache.set(`key${i}`, `value${i}`);
    }

    expect(cache.size).toBe(50);
    expect(cache.get('key0')).toBeUndefined();
    expect(cache.get('key59')).toBe('value59');
  });

  it('[P1] 更新已有条目不增加容量', () => {
    const cache = new FormatCache({ maxSize: 10 });

    for (let i = 0; i < 10; i++) {
      cache.set(`key${i}`, `value${i}`);
    }

    cache.set('key0', 'updated-value');
    expect(cache.size).toBe(10);
    expect(cache.get('key0')).toBe('updated-value');
  });
});

describe('FormatCache - 缓存命中率验证', () => {
  it('[P0] 相同内容命中率 ≥80% (连续 5 次编辑同一区域)', () => {
    const cache = new FormatCache({ maxSize: 50 });
    const uniqueContents = Array(10).fill(0).map((_, i) => `function fn${i}(){return ${i}}`);

    let hitCount = 0;
    let totalRequests = 0;

    // 第一轮: 建立缓存
    for (const content of uniqueContents) {
      totalRequests++;
      const hash = computeContentHash(content);
      if (cache.get(hash) !== undefined) {
        hitCount++;
      }
      cache.set(hash, `formatted:${content}`);
    }

    // 后续 4 轮: 命中缓存
    for (let round = 0; round < 4; round++) {
      for (const content of uniqueContents) {
        totalRequests++;
        const hash = computeContentHash(content);
        if (cache.get(hash) !== undefined) {
          hitCount++;
        }
        cache.set(hash, `formatted:${content}`);
      }
    }

    const hitRate = hitCount / totalRequests;
    expect(hitRate).toBeGreaterThanOrEqual(0.80);
  });

  it('[P0] 100 次请求中缓存命中率达标', () => {
    const cache = new FormatCache({ maxSize: 50 });
    const uniqueContents = Array(10).fill(0).map((_, i) => `function fn${i}(){return ${i}}`);

    let hitCount = 0;
    let totalRequests = 0;

    for (let round = 0; round < 10; round++) {
      for (const content of uniqueContents) {
        totalRequests++;
        const hash = computeContentHash(content);
        if (cache.get(hash) !== undefined) {
          hitCount++;
        }
        cache.set(hash, `formatted:${content}`);
      }
    }

    expect(totalRequests).toBe(100);
    const hitRate = hitCount / totalRequests;
    expect(hitRate).toBeGreaterThanOrEqual(0.80);
  });

  it('[P1] 内容变更后缓存不命中', () => {
    const cache = new FormatCache();

    const contentA = 'function original(){return 1}';
    const contentB = 'function modified(){return 2}';

    const hashA = computeContentHash(contentA);
    cache.set(hashA, 'formatted:A');

    const hashB = computeContentHash(contentB);
    expect(cache.get(hashB)).toBeUndefined();

    expect(cache.get(hashA)).toBe('formatted:A');
  });
});

describe('FormatCache - 单例', () => {
  it('[P1] getFormatCache 返回同一个实例', () => {
    const instance1 = getFormatCache();
    const instance2 = getFormatCache();
    expect(instance1).toBe(instance2);
  });
});