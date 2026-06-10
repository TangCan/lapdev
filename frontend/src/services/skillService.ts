import type { Skill, SkillTrigger, SkillLoadResult } from '../types/skill';

const API_BASE_URL = '/api/v1/skills';

export class SkillService {
  private skills: Skill[] = [];

  async loadSkills(): Promise<SkillLoadResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/load`);
      if (!response.ok) {
        throw new Error('Failed to load skills');
      }
      const result = await response.json() as SkillLoadResult;
      this.skills = result.skills;
      return result;
    } catch {
      return { skills: [], globalCount: 0, projectCount: 0 };
    }
  }

  getSkills(): Skill[] {
    return this.skills;
  }

  getSkillByName(name: string): Skill | undefined {
    return this.skills.find(s => s.name === name);
  }

  async matchSkills(query: string): Promise<Skill[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      if (!response.ok) {
        throw new Error('Failed to match skills');
      }
      return await response.json() as Skill[];
    } catch {
      return [];
    }
  }

  buildSystemPrompt(skills: Skill[]): string {
    if (skills.length === 0) {
      return '';
    }

    let prompt = '## 可用技能（Skills）\n\n';
    prompt += '以下是当前可用的技能，根据你的请求自动匹配：\n\n';

    for (const skill of skills) {
      prompt += `### ${skill.name} (v${skill.version})\n`;
      prompt += `**描述**: ${skill.description}\n`;
      if (skill.author) {
        prompt += `**作者**: ${skill.author}\n`;
      }
      prompt += '\n';
      prompt += `${skill.content}\n\n`;
    }

    prompt += '---\n';
    prompt += '请根据上述技能的说明，在回答时使用相应的技能指令。\n';

    return prompt;
  }

  async reload(): Promise<SkillLoadResult> {
    return this.loadSkills();
  }

  async registerSkillsFromDirectory(skillsDir: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skillsDir }),
      });
    } catch {
      // 忽略错误
    }
  }
}

export const skillService = new SkillService();
