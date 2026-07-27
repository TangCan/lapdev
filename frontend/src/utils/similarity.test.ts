import { describe, it, expect } from 'vitest';
import { SimilarityUtils } from './similarity';

describe('SimilarityUtils', () => {
  describe('jaccardSimilarity', () => {
    it('[P0] 相同数组应返回 1', () => {
      const result = SimilarityUtils.jaccardSimilarity(['a', 'b', 'c'], ['a', 'b', 'c']);
      expect(result).toBe(1);
    });

    it('[P0] 完全不同的数组应返回 0', () => {
      const result = SimilarityUtils.jaccardSimilarity(['a', 'b'], ['c', 'd']);
      expect(result).toBe(0);
    });

    it('[P0] 两个空数组应返回 1', () => {
      const result = SimilarityUtils.jaccardSimilarity([], []);
      expect(result).toBe(1);
    });

    it('[P0] 一个空数组应返回 0', () => {
      const result = SimilarityUtils.jaccardSimilarity(['a'], []);
      expect(result).toBe(0);
    });

    it('[P0] 单元素数组相同应返回 1', () => {
      const result = SimilarityUtils.jaccardSimilarity(['x'], ['x']);
      expect(result).toBe(1);
    });

    it('[P0] 单元素数组不同应返回 0', () => {
      const result = SimilarityUtils.jaccardSimilarity(['x'], ['y']);
      expect(result).toBe(0);
    });

    it('[P1] 部分重叠应返回正确的相似度', () => {
      const result = SimilarityUtils.jaccardSimilarity(['a', 'b', 'c'], ['b', 'c', 'd']);
      expect(result).toBeCloseTo(0.5);
    });

    it('[P1] 应忽略大小写', () => {
      const result = SimilarityUtils.jaccardSimilarity(['Hello', 'World'], ['hello', 'world']);
      expect(result).toBe(1);
    });

    it('[P1] 重复值应正确处理（基于 Set 去重）', () => {
      const result = SimilarityUtils.jaccardSimilarity(['a', 'a', 'b'], ['a', 'b', 'b']);
      expect(result).toBe(1);
    });

    it('[P1] 多元素部分重叠应返回正确分数', () => {
      const result = SimilarityUtils.jaccardSimilarity(['a', 'b', 'c', 'd'], ['b', 'c']);
      expect(result).toBeCloseTo(2 / 4);
    });
  });

  describe('extractKeywords', () => {
    it('[P0] 应提取长度大于 2 的英文单词', () => {
      const result = SimilarityUtils.extractKeywords('hello world hi');
      expect(result).toContain('hello');
      expect(result).toContain('world');
      expect(result).not.toContain('hi');
    });

    it('[P0] 应提取中文字符序列（2 个以上字符）', () => {
      const result = SimilarityUtils.extractKeywords('你好世界测试');
      expect(result.length).toBeGreaterThan(0);
    });

    it('[P0] 空字符串应返回空数组', () => {
      const result = SimilarityUtils.extractKeywords('');
      expect(result).toEqual([]);
    });

    it('[P0] 仅包含短单词的文本应返回空数组', () => {
      const result = SimilarityUtils.extractKeywords('a b c');
      expect(result).toEqual([]);
    });

    it('[P0] 单中文字符不应被提取', () => {
      const result = SimilarityUtils.extractKeywords('你 好 世 界');
      expect(result).toEqual([]);
    });

    it('[P1] 混合中英文本应同时提取两种关键词', () => {
      const result = SimilarityUtils.extractKeywords('你好hello世界world');
      expect(result).toContain('hello');
      expect(result).toContain('world');
      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it('[P1] 应正确处理特殊字符', () => {
      const result = SimilarityUtils.extractKeywords('hello! world? test...');
      expect(result).toContain('hello');
      expect(result).toContain('world');
      expect(result).toContain('test');
    });

    it('[P2] 仅特殊字符的文本应返回空数组', () => {
      const result = SimilarityUtils.extractKeywords('!@#$%^&*()');
      expect(result).toEqual([]);
    });

    it('[P2] 超长文本应正确提取所有关键词', () => {
      const result = SimilarityUtils.extractKeywords('machine learning artificial intelligence 深度学习 机器学习');
      expect(result).toContain('machine');
      expect(result).toContain('learning');
      expect(result).toContain('artificial');
      expect(result).toContain('intelligence');
    });
  });

  describe('matchPatterns', () => {
    it('[P0] 应将字符串模式作为正则匹配', () => {
      const result = SimilarityUtils.matchPatterns(['hello', 'world'], 'hello there');
      expect(result).toBe(true);
    });

    it('[P0] 应匹配 RegExp 模式', () => {
      const result = SimilarityUtils.matchPatterns([/hello/, /world/], 'hello there');
      expect(result).toBe(true);
    });

    it('[P0] 无模式匹配时应返回 false', () => {
      const result = SimilarityUtils.matchPatterns([/foo/, /bar/], 'hello there');
      expect(result).toBe(false);
    });

    it('[P0] 空模式数组应返回 false', () => {
      const result = SimilarityUtils.matchPatterns([], 'hello there');
      expect(result).toBe(false);
    });

    it('[P0] 空文本应返回 false', () => {
      const result = SimilarityUtils.matchPatterns([/hello/, /world/], '');
      expect(result).toBe(false);
    });

    it('[P1] 应匹配中文文本', () => {
      const result = SimilarityUtils.matchPatterns(['你好', '世界'], '你好世界');
      expect(result).toBe(true);
    });

    it('[P2] 应处理无效正则表达式并抛出异常', () => {
      expect(() => SimilarityUtils.matchPatterns(['[invalid(regex'], 'hello')).toThrow();
    });

    it('[P2] 字符串模式中的正则特殊字符应被当作字面量处理', () => {
      const result = SimilarityUtils.matchPatterns(['he.lo'], 'hello');
      expect(result).toBe(true);
    });
  });
});