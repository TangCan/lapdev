import type { Skill, AIRequest } from '../types/skill.ts';
import { SimilarityUtils } from '../utils/similarity.ts';

export class SkillMatchService {
  private activeSkills: Set<string> = new Set();

  /**
   * 计算单个 Skill 与请求的匹配度
   * @param skill - Skill 对象
   * @param request - AI 请求
   * @returns 匹配度分数 (0-1)
   */
  calculateMatchScore(skill: Skill, request: AIRequest): number {
    const { text } = request;
    const { trigger } = skill;

    // 关键词匹配 (50%) - 检查每个技能关键词是否在输入文本中
    const skillKeywords = trigger.keywords || [];
    let keywordMatch = 0;
    if (skillKeywords.length > 0) {
      const matchedCount = skillKeywords.filter(keyword => 
        text.toLowerCase().includes(keyword.toLowerCase())
      ).length;
      keywordMatch = matchedCount / skillKeywords.length;
    }

    // 模式匹配 (20%)
    const patterns = trigger.patterns || [];
    const patternMatch = SimilarityUtils.matchPatterns(patterns, text) ? 1 : 0;

    // 语义相似度 (30%) - 检查技能描述和内容是否与输入文本相关
    const description = skill.description || '';
    const content = skill.content || '';
    const skillText = `${description} ${content}`;
    const semanticMatch = this.calculateSemanticMatch(text, skillText);

    // 综合计算
    const matchScore = (keywordMatch * 0.5) + (semanticMatch * 0.3) + (patternMatch * 0.2);
    
    return Math.min(1, Math.max(0, matchScore));
  }

  /**
   * 计算语义相似度（简化版本）
   * @param text1 - 文本1
   * @param text2 - 文本2
   * @returns 相似度分数
   */
  private calculateSemanticMatch(text1: string, text2: string): number {
    const keywords1 = SimilarityUtils.extractKeywords(text1);
    const keywords2 = SimilarityUtils.extractKeywords(text2);
    
    return SimilarityUtils.jaccardSimilarity(keywords1, keywords2);
  }

  /**
   * 查找匹配的 Skill
   * @param skills - Skill 列表
   * @param request - AI 请求
   * @param threshold - 激活阈值（默认0.7）
   * @returns 匹配的 Skill 列表（按匹配度排序）
   */
  findMatchingSkills(skills: Skill[], request: AIRequest, threshold: number = 0.15): Skill[] {
    console.log('findMatchingSkills called with', skills.length, 'skills');
    console.log('Request text:', request.text);
    
    const matchingSkills = skills.map(skill => {
      const matchScore = this.calculateMatchScore(skill, request);
      console.log('Skill', skill.id, 'match score:', matchScore);
      return { ...skill, matchScore };
    }).filter(skill => skill.matchScore >= threshold);

    console.log('Matching skills found:', matchingSkills.length);
    
    // 按匹配度降序排序
    matchingSkills.sort((a, b) => b.matchScore - a.matchScore);
    
    return matchingSkills;
  }

  /**
   * 激活 Skill
   * @param skillId - Skill ID
   */
  activateSkill(skillId: string): void {
    this.activeSkills.add(skillId);
  }

  /**
   * 禁用 Skill
   * @param skillId - Skill ID
   */
  deactivateSkill(skillId: string): void {
    this.activeSkills.delete(skillId);
  }

  /**
   * 检查 Skill 是否激活
   * @param skillId - Skill ID
   * @returns 是否激活
   */
  isSkillActive(skillId: string): boolean {
    return this.activeSkills.has(skillId);
  }

  /**
   * 获取所有激活的 Skill ID
   * @returns 激活的 Skill ID 列表
   */
  getActiveSkillIds(): string[] {
    return Array.from(this.activeSkills);
  }

  /**
   * 清空所有激活的 Skill
   */
  clearActiveSkills(): void {
    this.activeSkills.clear();
  }

  /**
   * 批量激活 Skill
   * @param skillIds - Skill ID 列表
   */
  activateSkills(skillIds: string[]): void {
    skillIds.forEach(id => this.activeSkills.add(id));
  }

  /**
   * 计算 Jaccard 相似度（暴露给测试）
   * @param keywords1 - 关键词数组1
   * @param keywords2 - 关键词数组2
   * @returns 相似度分数
   */
  calculateJaccardSimilarity(keywords1: string[], keywords2: string[]): number {
    return SimilarityUtils.jaccardSimilarity(keywords1, keywords2);
  }

  /**
   * 模式匹配（暴露给测试）
   * @param patterns - 正则模式数组
   * @param text - 输入文本
   * @returns 是否匹配
   */
  matchPatterns(patterns: RegExp[], text: string): boolean {
    return SimilarityUtils.matchPatterns(patterns, text);
  }
}