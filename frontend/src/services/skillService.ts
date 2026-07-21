import type { Skill, SkillTrigger, SkillLoadResult } from '../types/skill';
import { load } from 'js-yaml';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join, basename } from 'path';

const API_BASE_URL = '/api/v1/skills';

export class SkillService {
  private skills: Skill[] = [];

  parseSkillContent(content: string, fileName: string): Skill {
    const lines = content.split('\n');
    
    if (lines[0] !== '---') {
      throw new Error('无效的Skill文件格式');
    }

    const endIndex = lines.indexOf('---', 1);
    if (endIndex === -1) {
      throw new Error('无效的Skill文件格式');
    }

    const yamlContent = lines.slice(1, endIndex).join('\n');
    const bodyContent = lines.slice(endIndex + 1).join('\n');

    let metadata: Partial<Skill> | undefined;
    try {
      metadata = load(yamlContent) as Partial<Skill>;
    } catch {
      throw new Error('无效的YAML格式');
    }

    const baseName = basename(fileName, '.skill.md');
    const safeMetadata = metadata || {};
    
    return {
      name: safeMetadata.name || baseName,
      version: safeMetadata.version || '1.0.0',
      description: safeMetadata.description || '',
      author: safeMetadata.author || '',
      tags: safeMetadata.tags || [],
      trigger: (safeMetadata.trigger as SkillTrigger) || {},
      content: bodyContent.trim(),
      fileName,
    };
  }

  validateSkillPath(path: string): void {
    if (!path || path.trim() === '') {
      throw new Error('文件路径不能为空');
    }

    if (path.includes('\0')) {
      throw new Error('非法字符');
    }

    if (path.includes('\n') || path.includes('\r')) {
      throw new Error('非法字符');
    }

    if (path.includes(';') || path.includes('|') || path.includes('`')) {
      throw new Error('非法字符');
    }

    if (path.includes('..\\') || path.match(/^\.\./)) {
      throw new Error('路径遍历攻击');
    }

    if (path.includes('../') || path.match(/^\.\./)) {
      throw new Error('路径遍历攻击');
    }
  }

  loadSkills(): SkillLoadResult {
    let globalCount = 0;
    let projectCount = 0;

    const projectSkillsDir = join(process.cwd(), '.lapdev', 'skills');
    const globalSkillsDir = '/global/.lapdev/skills';

    const loadSkillsFromDir = (dirPath: string): Skill[] => {
      const dirSkills: Skill[] = [];
      
      if (!existsSync(dirPath)) {
        return dirSkills;
      }

      try {
        const files = readdirSync(dirPath);
        
        for (const file of files) {
          if (file.endsWith('.skill.md')) {
            const filePath = join(dirPath, file);
            const stat = statSync(filePath);
            
            if (stat.isFile()) {
              try {
                const content = readFileSync(filePath, 'utf-8');
                const skill = this.parseSkillContent(content, file);
                dirSkills.push(skill);
              } catch (error) {
                console.warn(`Failed to load skill file ${file}:`, error);
              }
            }
          }
        }
      } catch {
        // 忽略错误
      }

      return dirSkills;
    };

    const globalSkills = loadSkillsFromDir(globalSkillsDir);
    const projectSkills = loadSkillsFromDir(projectSkillsDir);

    globalCount = globalSkills.length;
    projectCount = projectSkills.length;

    const skillMap = new Map<string, Skill>();

    for (const skill of globalSkills) {
      skillMap.set(skill.fileName, skill);
    }

    for (const skill of projectSkills) {
      skillMap.set(skill.fileName, skill);
    }

    this.skills = Array.from(skillMap.values());
    return { skills: this.skills, globalCount, projectCount };
  }

  getSkills(): Skill[] {
    return this.skills;
  }

  getSkillByName(name: string): Skill | undefined {
    return this.skills.find(s => s.name === name);
  }

  matchSkills(query: string, skills: Skill[]): Skill[] {
    const queryLower = query.toLowerCase();
    
    const matchedSkills = skills
      .map(skill => {
        let score = 0;
        
        if (skill.trigger && skill.trigger.keywords) {
          for (const keyword of skill.trigger.keywords) {
            if (queryLower.includes(keyword.toLowerCase())) {
              score += 1;
            }
          }
        }
        
        if (skill.trigger && skill.trigger.patterns) {
          for (const pattern of skill.trigger.patterns) {
            try {
              if (new RegExp(pattern, 'i').test(query)) {
                score += 2;
              }
            } catch {
              // 忽略无效的正则表达式
            }
          }
        }
        
        return { skill, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.skill);
    
    return matchedSkills;
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

  reload(): SkillLoadResult {
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