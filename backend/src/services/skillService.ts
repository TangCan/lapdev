import * as yaml from 'js-yaml';
import type { Skill, SkillTrigger, SkillLoadResult, SkillDiscoveryDiagnostic } from '../types/skill.ts';

const PATH_TRAVERSAL_PATTERN = /\.\.[\/\\]/;
const VALID_PATH_PATTERN = /^[a-zA-Z0-9_\-\.\/\\:~]+$/;

export class SkillService {
  private skills: Skill[] = [];
  private globalSkillsDir: string;
  private projectSkillsDir: string;
  private codexSkillsDir: string;
  private projectRoot: string;
  private diagnostics: SkillDiscoveryDiagnostic[] = [];

  constructor() {
    const home = Deno.env.get('HOME') || Deno.env.get('USERPROFILE') || '/';
    const workspace = Deno.env.get('WORKSPACE_PATH') || Deno.cwd();
    this.projectRoot = workspace;
    this.globalSkillsDir = `${home}/.lapdev/skills`;
    this.projectSkillsDir = `${workspace}/.lapdev/skills`;
    this.codexSkillsDir = `${workspace}/.agents/skills`;
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

    const baseName = fileName.replace(/\.skill\.md$/, '');

    return {
      name: typeof metadata.name === 'string' ? metadata.name : baseName,
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
    this.diagnostics = [];
    let globalCount = 0;
    let projectCount = 0;

    const sources: SkillLoadResult['sources'] = [
      { path: '.agents/skills', label: 'codex-primary', available: this.projectPath(this.codexSkillsDir, 'codex-primary') !== null },
      { path: '.lapdev/skills', label: 'lapdev-legacy', available: this.projectPath(this.projectSkillsDir, 'lapdev-legacy') !== null },
      { path: '~/.lapdev/skills', label: 'lapdev-global', available: this.existsSync(this.globalSkillsDir) },
    ];

    if (sources[0].available) {
      const primary = this.loadCodexSkills(this.codexSkillsDir);
      allSkills.push(...primary);
      projectCount += primary.length;
    } else {
      this.diagnostics.push({ code: 'source-unavailable', source: 'codex-primary', path: '.agents/skills', message: 'Codex primary skill source is unavailable', severity: 'warning' });
    }

    if (this.existsSync(this.globalSkillsDir)) {
      const globalSkills = this.loadSkillsFromDir(this.globalSkillsDir);
      for (const globalSkill of globalSkills) {
        if (allSkills.some((skill) => skill.name === globalSkill.name)) {
          this.diagnostics.push({ code: 'duplicate', source: 'lapdev-global', path: globalSkill.fileName, message: `Duplicate skill identity "${globalSkill.name}"; global source is lower precedence`, severity: 'warning' });
        } else {
          allSkills.push({ ...globalSkill, source: 'lapdev-global' as const });
        }
      }
      globalCount = globalSkills.length;
    }

    if (sources[1].available) {
      const projectSkills = this.loadSkillsFromDir(this.projectSkillsDir, true).map((skill) => ({ ...skill, source: 'lapdev-legacy' as const }));
      
      for (const projectSkill of projectSkills) {
        const existingIndex = allSkills.findIndex(s => s.name === projectSkill.name);
        if (existingIndex !== -1) {
          this.diagnostics.push({ code: 'duplicate', source: 'lapdev-legacy', path: projectSkill.fileName, message: `Duplicate skill identity "${projectSkill.name}"; legacy source is lower precedence`, severity: 'warning' });
        } else {
          allSkills.push(projectSkill);
        }
      }
      projectCount = projectSkills.length;
    }

    this.skills = allSkills;
    return { skills: allSkills, globalCount, projectCount, diagnostics: this.diagnostics, sources };
  }

  private loadCodexSkills(dir: string): Skill[] {
    const skills: Skill[] = [];
    try {
      const canonicalDir = this.projectPath(dir, 'codex-primary');
      if (!canonicalDir) return skills;
      for (const entry of Deno.readDirSync(canonicalDir)) {
        if (!entry.isDirectory && !entry.isSymlink) continue;
        const directory = this.projectPath(`${dir}/${entry.name}`, 'codex-primary');
        if (!directory || !Deno.statSync(directory).isDirectory) continue;
        const skillPath = `${dir}/${entry.name}/SKILL.md`;
        const canonicalFile = this.projectPath(skillPath, 'codex-primary');
        if (!canonicalFile) {
          this.diagnostics.push({ code: 'missing-skill-file', source: 'codex-primary', path: skillPath, message: 'Skill directory has no SKILL.md', severity: 'warning' });
          continue;
        }
        try {
          const skill = this.parseSkillContent(Deno.readTextFileSync(canonicalFile), 'SKILL.md');
          const withSource = { ...skill, source: 'codex-primary' as const };
          const duplicate = skills.some((candidate) => candidate.name === withSource.name);
          if (duplicate) {
            this.diagnostics.push({ code: 'duplicate', source: 'codex-primary', path: skillPath, message: `Duplicate skill identity "${withSource.name}"`, severity: 'error' });
            continue;
          }
          skills.push(withSource);
        } catch (error) {
          this.diagnostics.push({ code: 'parse-failure', source: 'codex-primary', path: skillPath, message: error instanceof Error ? error.message : String(error), severity: 'error' });
        }
      }
    } catch (error) {
      this.diagnostics.push({ code: 'source-unavailable', source: 'codex-primary', path: dir, message: error instanceof Error ? error.message : String(error), severity: 'error' });
    }
    return skills;
  }

  private existsSync(path: string): boolean {
    try {
      Deno.statSync(path);
      return true;
    } catch {
      return false;
    }
  }

  private projectPath(path: string, source: string): string | null {
    try {
      const root = Deno.realPathSync(this.projectRoot);
      const canonical = Deno.realPathSync(path);
      const prefix = root.endsWith('/') ? root : `${root}/`;
      if (canonical !== root && !canonical.startsWith(prefix)) throw new Error('Project skill path escapes canonical workspace');
      return canonical;
    } catch (error) {
      this.diagnostics.push({ code: 'source-unavailable', source, path, message: error instanceof Error ? error.message : String(error), severity: 'error' });
      return null;
    }
  }

  private loadSkillsFromDir(dir: string, project = false): Skill[] {
    const skills: Skill[] = [];
    
    try {
      this.validateSkillPath(dir);
      const canonicalDir = project ? this.projectPath(dir, 'lapdev-legacy') : dir;
      if (!canonicalDir) return skills;
      const files = Deno.readDirSync(canonicalDir);
      
      for (const fileInfo of files) {
        if (!fileInfo.name.endsWith('.skill.md')) continue;
        
        const filePath = `${dir}/${fileInfo.name}`;
        this.validateSkillPath(filePath);
        
        const canonicalFile = project ? this.projectPath(filePath, 'lapdev-legacy') : filePath;
        if (!canonicalFile) continue;
        if (fileInfo.isFile || (project && fileInfo.isSymlink && Deno.statSync(canonicalFile).isFile)) {
          const content = Deno.readTextFileSync(canonicalFile);
          try {
            const skill = this.parseSkillContent(content, fileInfo.name);
            skills.push(skill);
          } catch (error) {
            console.warn(`Failed to parse skill file ${fileInfo.name}:`, error);
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

  getDiscoveryDiagnostics(): SkillDiscoveryDiagnostic[] {
    return [...this.diagnostics];
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

  async registerSkillsFromDirectory(skillsDir: string): Promise<void> {
    if (!this.existsSync(skillsDir)) {
      return;
    }

    try {
      this.validateSkillPath(skillsDir);
      const files = Deno.readDirSync(skillsDir);
      
      for (const fileInfo of files) {
        if (!fileInfo.name.endsWith('.skill.md')) continue;
        
        const filePath = `${skillsDir}/${fileInfo.name}`;
        this.validateSkillPath(filePath);
        
        if (fileInfo.isFile) {
          const content = Deno.readTextFileSync(filePath);
          try {
            const skill = this.parseSkillContent(content, fileInfo.name);
            const existingIndex = this.skills.findIndex(s => s.name === skill.name);
            if (existingIndex !== -1) {
              this.skills[existingIndex] = skill;
            } else {
              this.skills.push(skill);
            }
          } catch (error) {
            console.warn(`Failed to parse skill file ${fileInfo.name}:`, error);
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to register skills from ${skillsDir}:`, error);
    }
  }
}

export const skillService = new SkillService();
