/**
 * Skill 服务层
 * 
 * 处理 Skill 文件的加载、解析、匹配和管理，包括：
 * - Skill 文件解析（YAML 元数据 + Markdown 内容）
 * - 路径安全验证（防止路径遍历攻击）
 * - 全局和项目级 Skill 加载
 * - 基于关键词和正则表达式的 Skill 匹配
 * - 系统提示词构建
 * 
 * Skill 文件格式：
 * ```
 * ---
 * name: Skill名称
 * version: 1.0.0
 * description: 描述
 * author: 作者
 * tags: [tag1, tag2]
 * trigger:
 *   keywords: [关键词1, 关键词2]
 *   patterns: [正则表达式1]
 * ---
 * Skill 内容...
 * ```
 */
import type { Skill, SkillTrigger, SkillLoadResult } from '../types/skill';
import { load } from 'js-yaml';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join, basename } from 'path';

/** API 基础 URL */
const API_BASE_URL = '/api/v1/skills';

/**
 * Skill 服务类
 * 
 * 提供 Skill 文件的完整管理功能，支持从本地文件系统加载和从服务器注册。
 */
export class SkillService {
  /** Skill 列表 */
  private skills: Skill[] = [];

  /**
   * 解析 Skill 文件内容
   * 
   * 将 Skill 文件解析为 Skill 对象，支持 YAML 元数据和 Markdown 内容分离。
   * 
   * @param content Skill 文件完整内容
   * @param fileName 文件名（用于生成默认名称）
   * @returns Skill 对象
   * @throws 当文件格式无效时抛出错误
   */
  parseSkillContent(content: string, fileName: string): Skill {
    const lines = content.split('\n');
    
    // 验证文件格式是否以 --- 开头
    if (lines[0] !== '---') {
      throw new Error('无效的Skill文件格式');
    }

    // 找到第二个 --- 的位置，分离元数据和内容
    const endIndex = lines.indexOf('---', 1);
    if (endIndex === -1) {
      throw new Error('无效的Skill文件格式');
    }

    const yamlContent = lines.slice(1, endIndex).join('\n');
    const bodyContent = lines.slice(endIndex + 1).join('\n');

    // 解析 YAML 元数据
    let metadata: Partial<Skill> | undefined;
    try {
      metadata = load(yamlContent) as Partial<Skill>;
    } catch {
      throw new Error('无效的YAML格式');
    }

    // 使用文件名作为默认名称（去除扩展名）
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

  /**
   * 验证 Skill 文件路径安全性
   * 
   * 防止路径遍历攻击，禁止使用 .. 等危险路径。
   * 
   * @param path 文件路径
   * @throws 当路径包含危险字符或路径遍历时抛出错误
   */
  validateSkillPath(path: string): void {
    if (!path || path.trim() === '') {
      throw new Error('文件路径不能为空');
    }

    // 禁止空字符
    if (path.includes('\0')) {
      throw new Error('非法字符');
    }

    // 禁止换行符
    if (path.includes('\n') || path.includes('\r')) {
      throw new Error('非法字符');
    }

    // 禁止特殊命令字符
    if (path.includes(';') || path.includes('|') || path.includes('`')) {
      throw new Error('非法字符');
    }

    // 禁止 Windows 路径遍历
    if (path.includes('..\\') || path.match(/^\.\./)) {
      throw new Error('路径遍历攻击');
    }

    // 禁止 Unix 路径遍历
    if (path.includes('../') || path.match(/^\.\./)) {
      throw new Error('路径遍历攻击');
    }
  }

  /**
   * 加载所有 Skill
   * 
   * 从全局目录和项目目录加载 Skill 文件，并进行去重（项目级覆盖全局级）。
   * 
   * @returns 加载结果，包含 Skill 列表和统计信息
   */
  loadSkills(): SkillLoadResult {
    let globalCount = 0;
    let projectCount = 0;

    const projectSkillsDir = join(process.cwd(), '.lapdev', 'skills');
    const globalSkillsDir = '/global/.lapdev/skills';

    /**
     * 从指定目录加载 Skill
     * @param dirPath 目录路径
     * @returns Skill 数组
     */
    const loadSkillsFromDir = (dirPath: string): Skill[] => {
      const dirSkills: Skill[] = [];
      
      // 如果目录不存在，返回空数组
      if (!existsSync(dirPath)) {
        return dirSkills;
      }

      try {
        const files = readdirSync(dirPath);
        
        for (const file of files) {
          // 只处理 .skill.md 文件
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
        // 忽略目录读取错误（可能是权限问题）
      }

      return dirSkills;
    };

    const globalSkills = loadSkillsFromDir(globalSkillsDir);
    const projectSkills = loadSkillsFromDir(projectSkillsDir);

    globalCount = globalSkills.length;
    projectCount = projectSkills.length;

    // 使用 Map 进行去重，项目级 Skill 覆盖全局级
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

  /**
   * 获取所有已加载的 Skill
   * 
   * @returns Skill 数组
   */
  getSkills(): Skill[] {
    return this.skills;
  }

  /**
   * 根据名称获取 Skill
   * 
   * @param name Skill 名称
   * @returns Skill 对象或 undefined
   */
  getSkillByName(name: string): Skill | undefined {
    return this.skills.find(s => s.name === name);
  }

  /**
   * 根据查询匹配 Skill
   * 
   * 使用关键词和正则表达式进行匹配，返回按匹配度排序的结果。
   * 
   * 评分规则：
   * - 关键词匹配：+1 分
   * - 正则表达式匹配：+2 分
   * 
   * @param query 查询字符串
   * @param skills 待匹配的 Skill 列表
   * @returns 匹配的 Skill 数组（按评分降序排列）
   */
  matchSkills(query: string, skills: Skill[]): Skill[] {
    const queryLower = query.toLowerCase();
    
    const matchedSkills = skills
      .map(skill => {
        let score = 0;
        
        // 关键词匹配
        if (skill.trigger && skill.trigger.keywords) {
          for (const keyword of skill.trigger.keywords) {
            if (queryLower.includes(keyword.toLowerCase())) {
              score += 1;
            }
          }
        }
        
        // 正则表达式匹配
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

  /**
   * 构建系统提示词
   * 
   * 将匹配的 Skill 转换为系统提示词格式，用于 AI 对话。
   * 
   * @param skills Skill 数组
   * @returns 系统提示词字符串
   */
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

  /**
   * 重新加载 Skill
   * 
   * 重新从文件系统加载所有 Skill。
   * 
   * @returns 加载结果
   */
  reload(): SkillLoadResult {
    return this.loadSkills();
  }

  /**
   * 从目录注册 Skill 到服务器
   * 
   * 将本地目录中的 Skill 注册到后端服务器。
   * 
   * @param skillsDir Skill 目录路径
   * @returns Promise<void>
   */
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
      // 忽略网络错误（服务器可能未启动）
    }
  }
}

/** SkillService 单例实例 */
export const skillService = new SkillService();