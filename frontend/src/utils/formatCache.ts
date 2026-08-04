/**
 * FormatCache - 格式化结果缓存模块
 *
 * Story: EPI2.03 - 范围格式化与增量更新
 *
 * 基于 LRU 策略的格式化结果缓存，使用内容 hash 作为键。
 * 支持范围格式化场景的缓存键（content + range）。
 *
 * 设计约束：
 * - 不依赖 Monaco，纯数据结构，可静态导入
 * - 模块级单例，避免重复创建
 * - 异步操作不阻塞 UI（get/set 均同步，但格式化本身是异步的）
 */

/** 缓存条目结构 */
export interface FormatCacheEntry {
  hash: string;
  formatted: string;
  timestamp: number;
  range?: { startLine: number; endLine: number };
}

/** 缓存选项 */
export interface FormatCacheOptions {
  maxSize?: number;
}

/** 默认缓存容量 */
const DEFAULT_MAX_SIZE = 50;

/**
 * 使用 djb2 算法计算内容哈希
 * @param content 文件内容
 * @param range 可选的范围信息（用于范围格式化缓存键）
 * @returns 十六进制哈希字符串
 */
export function computeContentHash(
  content: string,
  range?: { startLine: number; endLine: number }
): string {
  let hash = 5381;
  const input = range
    ? `${content}:${range.startLine}-${range.endLine}`
    : content;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) + input.charCodeAt(i);
    hash = hash >>> 0; // 转为无符号 32 位整数
  }
  return hash.toString(16);
}

/**
 * FormatCache - LRU 缓存实现
 *
 * 使用 Map 的插入顺序特性实现 LRU：
 * - get 时删除再插入（移到末尾 = 最近使用）
 * - set 时超出容量则删除最早条目（第一个键）
 */
export class FormatCache {
  private cache: Map<string, FormatCacheEntry>;
  private maxSize: number;

  constructor(options?: FormatCacheOptions) {
    this.cache = new Map();
    this.maxSize = options?.maxSize ?? DEFAULT_MAX_SIZE;
  }

  /**
   * 获取缓存的格式化结果
   * @param key 缓存键（content hash）
   * @returns 格式化内容，未命中返回 undefined
   */
  get(key: string): string | undefined {
    const entry = this.cache.get(key);
    if (entry !== undefined) {
      // LRU: 移到末尾（最近使用）
      this.cache.delete(key);
      this.cache.set(key, entry);
      return entry.formatted;
    }
    return undefined;
  }

  /**
   * 存储格式化结果
   * @param key 缓存键（content hash）
   * @param formatted 格式化后的内容
   * @param range 可选的范围信息
   */
  set(key: string, formatted: string, range?: { startLine: number; endLine: number }): void {
    // 如果已存在，先删除再插入（更新为最近使用）
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    const entry: FormatCacheEntry = {
      hash: key,
      formatted,
      timestamp: Date.now(),
      range,
    };

    this.cache.set(key, entry);

    // LRU 淘汰：超出容量时移除最早的条目
    while (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
  }

  /**
   * 使指定缓存条目失效
   * @param key 缓存键
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 检查缓存中是否存在指定键
   * @param key 缓存键
   */
  contains(key: string): boolean {
    return this.cache.has(key);
  }

  /** 当前缓存条目数量 */
  get size(): number {
    return this.cache.size;
  }
}

/**
 * 模块级单例 - 全局共享的格式化缓存
 */
let formatCacheInstance: FormatCache | null = null;

/**
 * 获取全局 FormatCache 单例
 * @returns FormatCache 实例
 */
export function getFormatCache(): FormatCache {
  if (!formatCacheInstance) {
    formatCacheInstance = new FormatCache();
  }
  return formatCacheInstance;
}