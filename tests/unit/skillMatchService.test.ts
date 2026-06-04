import { describe, it, expect, beforeEach } from 'https://deno.land/std/testing/bdd.ts';
import { SkillMatchService } from '../../frontend/src/services/skillMatchService.ts';
import type { Skill, AIRequest } from '../../frontend/src/types/skill.ts';

// Mock Skill数据
const mockSkills: Skill[] = [
  {
    id: 'git-helper',
    name: 'git-helper',
    version: '1.0.0',
    description: '帮助用户进行Git操作，包括查看状态、提交、分支管理等',
    author: 'Lapdev Team',
    tags: ['git', 'version-control'],
    trigger: {
      keywords: ['git', 'commit', 'branch', 'status', 'push', 'pull'],
      patterns: [/git.*status/i, /git.*commit/i]
    },
    content: '# Git Helper Skill\n\n## 指令\n帮助用户进行Git操作',
    matchScore: 0
  },
  {
    id: 'code-review',
    name: 'code-review',
    version: '1.0.0',
    description: '帮助用户审查代码，提供代码优化建议',
    author: 'Lapdev Team',
    tags: ['code', 'review', 'quality'],
    trigger: {
      keywords: ['review', '审查', '代码', '优化', '重构'],
      patterns: [/审查代码/i, /代码优化/i]
    },
    content: '# Code Review Skill\n\n## 指令\n帮助用户审查代码',
    matchScore: 0
  },
  {
    id: 'test-generator',
    name: 'test-generator',
    version: '1.0.0',
    description: '帮助用户生成测试用例',
    author: 'Lapdev Team',
    tags: ['test', 'testing', 'unit'],
    trigger: {
      keywords: ['测试', 'test', '单元测试', '用例'],
      patterns: [/生成测试/i, /测试用例/i]
    },
    content: '# Test Generator Skill\n\n## 指令\n帮助用户生成测试用例',
    matchScore: 0
  }
];

describe('SkillMatchService', () => {
  let service: SkillMatchService;

  beforeEach(() => {
    service = new SkillMatchService();
  });

  it('should calculate match score based on keywords', () => {
    const request: AIRequest = { text: '帮我查看git状态' };
    const skill = mockSkills[0];

    const score = service.calculateMatchScore(skill, request);

    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('should return high score for strong keyword match', () => {
    const request: AIRequest = { text: 'git status' };
    const skill = mockSkills[0];

    const score = service.calculateMatchScore(skill, request);

    expect(score).toBeGreaterThan(0.7);
  });

  it('should return low score for no keyword match', () => {
    const request: AIRequest = { text: '今天天气怎么样' };
    const skill = mockSkills[0];

    const score = service.calculateMatchScore(skill, request);

    expect(score).toBeLessThan(0.3);
  });

  it('should return skills with match score above threshold', () => {
    const request: AIRequest = { text: '帮我查看git状态' };

    const matchingSkills = service.findMatchingSkills(mockSkills, request);

    expect(matchingSkills.length).toBeGreaterThan(0);
    matchingSkills.forEach((skill: Skill) => {
      expect(skill.matchScore).toBeGreaterThanOrEqual(0.7);
    });
  });

  it('should return empty array when no skills match', () => {
    const request: AIRequest = { text: '今天天气怎么样' };

    const matchingSkills = service.findMatchingSkills(mockSkills, request);

    expect(matchingSkills).toEqual([]);
  });

  it('should return multiple matching skills', () => {
    const request: AIRequest = { text: '帮我审查代码并生成测试用例' };

    const matchingSkills = service.findMatchingSkills(mockSkills, request);

    expect(matchingSkills.length).toBeGreaterThan(1);
    const ids = matchingSkills.map((s: Skill) => s.id);
    expect(ids).toContain('code-review');
    expect(ids).toContain('test-generator');
  });

  it('should calculate Jaccard similarity correctly', () => {
    const keywords1 = ['git', 'status'];
    const keywords2 = ['git', 'status', 'branch'];

    const similarity = service.calculateJaccardSimilarity(keywords1, keywords2);

    expect(similarity).toBe(2 / 3);
  });

  it('should return 1 for identical sets', () => {
    const keywords1 = ['git', 'status'];
    const keywords2 = ['git', 'status'];

    const similarity = service.calculateJaccardSimilarity(keywords1, keywords2);

    expect(similarity).toBe(1);
  });

  it('should return 0 for disjoint sets', () => {
    const keywords1 = ['git', 'status'];
    const keywords2 = ['weather', 'today'];

    const similarity = service.calculateJaccardSimilarity(keywords1, keywords2);

    expect(similarity).toBe(0);
  });

  it('should match regex patterns', () => {
    const patterns = [/git.*status/i];
    const text = 'git status';

    const matches = service.matchPatterns(patterns, text);

    expect(matches).toBe(true);
  });

  it('should not match non-matching text', () => {
    const patterns = [/git.*status/i];
    const text = 'hello world';

    const matches = service.matchPatterns(patterns, text);

    expect(matches).toBe(false);
  });

  it('should track active skills', () => {
    const activeSkills = new Set<string>();
    
    activeSkills.add('git-helper');
    expect(activeSkills.has('git-helper')).toBe(true);
    
    activeSkills.delete('git-helper');
    expect(activeSkills.has('git-helper')).toBe(false);
  });

  it('should support multiple active skills', () => {
    const activeSkills = new Set<string>();
    
    activeSkills.add('git-helper');
    activeSkills.add('code-review');
    
    expect(activeSkills.size).toBe(2);
    expect(activeSkills.has('git-helper')).toBe(true);
    expect(activeSkills.has('code-review')).toBe(true);
  });
});