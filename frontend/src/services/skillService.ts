import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import type { Skill, SkillTrigger, SkillLoadResult } from '../types/skill';

const PATH_TRAVERSAL_PATTERN = /\.\.[\/\\]/;
const VALID_PATH_PATTERN = /^[a-zA-Z0-9_\-\.\/\\:~]+$/;

export class SkillService {
  private skills: Skill[] = [];
  private globalSkillsDir: string;
  private projectSkillsDir: string;

  constructor() {
    this.globalSkillsDir = path.join(
      process.env.HOME || process.env.USERPROFILE || '/',
      '.lapdev',
      'skills'
    );
    this.projectSkillsDir = path.join(process.cwd(), '.lapdev', 'skills');
  }

  validateSkillPath(filePath: string): void {
    if (!filePath || filePath.trim() === '') {
      throw new Error('文件路径不能为空');
    }
    if (PATH_TRAVERSAL_PATTERN.test(filePath)) {
      throw new Error('路径遍历攻击检测：文件路径包含非法的路径遍历字符');
    }
    if (!VALID_PATH_PATTERN.test(filePath)) {
      throw new Error('文件路径包含非法字符');
    }
  }

  parseSkillContent(content: string, fileName: string): Skill {
    const yamlSeparator = '---';
    const firstSeparatorIndex = content.indexOf(yamlSeparator);
    const secondSeparatorIndex = content.indexOf(yamlSeparator, firstSeparatorIndex + 3);

    if (firstSeparatorIndex === -1 || secondSeparatorIndex === -1) {
      throw new Error('无效的Skill文件格式：缺少YAML元数据');
    }

    const yamlContent = content.substring(firstSeparatorIndex + 3, secondSeparatorIndex).trim();
    const skillContent = content.substring(secondSeparatorIndex + 3).trim();

    const loadedMetadata = yaml.load(yamlContent);
    const metadata = (loadedMetadata && typeof loadedMetadata === 'object' ? loadedMetadata : {}) as Record<string, unknown>;

    return {
      name: typeof metadata.name === 'string' ? metadata.name : path.basename(fileName, '.skill.md'),
      version: typeof metadata.version === 'string' ? metadata.version : '1.0.0',
      description: typeof metadata.description === 'string' ? metadata.description : '',
      author: typeof metadata.author === 'string' ? metadata.author : '',
      tags: Array.isArray(metadata.tags) ? metadata.tags as string[] : [],
      trigger: typeof metadata.trigger === 'object' && metadata.trigger !== null 
        ? metadata.trigger as SkillTrigger 
        : {},
      content: skillContent,
      fileName,
    };
  }

  loadSkills(): SkillLoadResult {
    const allSkills: Skill[] = [];
    let globalCount = 0;
    let projectCount = 0;

    if (fs.existsSync(this.globalSkillsDir)) {
      const globalSkills = this.loadSkillsFromDir(this.globalSkillsDir);
      allSkills.push(...globalSkills);
      globalCount = globalSkills.length;
    }

    if (fs.existsSync(this.projectSkillsDir)) {
      const projectSkills = this.loadSkillsFromDir(this.projectSkillsDir);
      
      for (const projectSkill of projectSkills) {
        const existingIndex = allSkills.findIndex(s => s.name === projectSkill.name);
        if (existingIndex !== -1) {
          allSkills[existingIndex] = projectSkill;
        } else {
          allSkills.push(projectSkill);
        }
      }
      projectCount = projectSkills.length;
    }

    this.skills = allSkills;
    return { skills: allSkills, globalCount, projectCount };
  }

  private loadSkillsFromDir(dir: string): Skill[] {
    const skills: Skill[] = [];
    
    try {
      this.validateSkillPath(dir);
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        if (!file.endsWith('.skill.md')) continue;
        
        const filePath = path.join(dir, file);
        this.validateSkillPath(filePath);
        
        if (fs.statSync(filePath).isFile()) {
          const content = fs.readFileSync(filePath, 'utf-8');
          try {
            const skill = this.parseSkillContent(content, file);
            skills.push(skill);
          } catch (error) {
            console.warn(`Failed to parse skill file ${file}:`, error);
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to load skills from ${dir}:`, error);
    }

    return skills;
  }

  getSkills(): Skill[] {
    return this.skills;
  }

  getSkillByName(name: string): Skill | undefined {
    return this.skills.find(s => s.name === name);
  }

  matchSkills(query: string, skills?: Skill[]): Skill[] {
    const targetSkills = skills || this.skills;
    const matched: Skill[] = [];

    for (const skill of targetSkills) {
      if (this.doesMatch(query, skill.trigger)) {
        matched.push(skill);
      }
    }

    return matched.sort((a, b) => {
      const scoreA = this.calculateMatchScore(query, a.trigger);
      const scoreB = this.calculateMatchScore(query, b.trigger);
      return scoreB - scoreA;
    });
  }

  private doesMatch(query: string, trigger: SkillTrigger): boolean {
    if (!trigger) return false;

    const lowerQuery = query.toLowerCase();

    if (trigger.keywords) {
      for (const keyword of trigger.keywords) {
        if (lowerQuery.includes(keyword.toLowerCase())) {
          return true;
        }
      }
    }

    if (trigger.patterns) {
      for (const pattern of trigger.patterns) {
        try {
          const regex = new RegExp(pattern, 'i');
          if (regex.test(query)) {
            return true;
          }
        } catch {
          continue;
        }
      }
    }

    return false;
  }

  private calculateMatchScore(query: string, trigger: SkillTrigger): number {
    let score = 0;
    const lowerQuery = query.toLowerCase();

    if (trigger.keywords) {
      for (const keyword of trigger.keywords) {
        if (lowerQuery.includes(keyword.toLowerCase())) {
          score += 1;
        }
      }
    }

    if (trigger.patterns) {
      for (const pattern of trigger.patterns) {
        try {
          const regex = new RegExp(pattern, 'i');
          if (regex.test(query)) {
            score += 2;
          }
        } catch {
          continue;
        }
      }
    }

    return score;
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
}

export const skillService = new SkillService();
