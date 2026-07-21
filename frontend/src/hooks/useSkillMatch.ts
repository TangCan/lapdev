import { useCallback } from 'react';
import { useSkill } from '../context/SkillContext';
import { SkillMatchService } from '../services/skillMatchService';
import type { AIRequest } from '../types/skill';

export function useSkillMatch() {
  const { skills, findMatchingSkills, getActiveSkills } = useSkill();
  const matchService = new SkillMatchService();

  const matchAndActivate = useCallback((request: AIRequest) => {
    // 使用服务计算匹配度
    const matchingSkills = matchService.findMatchingSkills(skills, request);
    
    // 激活匹配的技能
    findMatchingSkills(request);
    
    return matchingSkills;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skills, findMatchingSkills]);

  const getSystemPromptWithSkills = useCallback(() => {
    const activeSkills = getActiveSkills();
    
    if (activeSkills.length === 0) {
      return '';
    }

    // 构建 Skill 指令注入
    const skillInstructions = activeSkills.map(skill => {
      return `## ${skill.name}\n${skill.content}`;
    }).join('\n\n');

    return `
以下技能已激活，可以使用：

${skillInstructions}

根据用户请求，选择合适的技能进行响应。
    `.trim();
  }, [getActiveSkills]);

  return {
    matchAndActivate,
    getSystemPromptWithSkills,
    matchService,
  };
}