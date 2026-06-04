// 相似度计算工具
export class SimilarityUtils {
  /**
   * 计算两个字符串数组的 Jaccard 相似度
   * @param arr1 - 第一个数组
   * @param arr2 - 第二个数组
   * @returns 相似度分数 (0-1)
   */
  static jaccardSimilarity(arr1: string[], arr2: string[]): number {
    const set1 = new Set(arr1.map(s => s.toLowerCase()));
    const set2 = new Set(arr2.map(s => s.toLowerCase()));
    
    if (set1.size === 0 && set2.size === 0) return 1;
    if (set1.size === 0 || set2.size === 0) return 0;
    
    let intersection = 0;
    set1.forEach(item => {
      if (set2.has(item)) intersection++;
    });
    
    const union = set1.size + set2.size - intersection;
    return intersection / union;
  }

  /**
   * 从文本中提取关键词（中文和英文）
   * @param text - 输入文本
   * @returns 关键词数组
   */
  static extractKeywords(text: string): string[] {
    const keywords: string[] = [];
    
    // 匹配英文单词
    const englishWords = text.match(/[a-zA-Z]+/g) || [];
    keywords.push(...englishWords.filter(w => w.length > 2));
    
    // 匹配中文字符（简单分词）
    const chineseChars = text.match(/[\u4e00-\u9fa5]{2,}/g) || [];
    keywords.push(...chineseChars);
    
    return keywords;
  }

  /**
   * 检查文本是否匹配任何正则模式
   * @param patterns - 正则模式数组
   * @param text - 输入文本
   * @returns 是否匹配
   */
  static matchPatterns(patterns: RegExp[], text: string): boolean {
    return patterns.some(pattern => pattern.test(text));
  }
}