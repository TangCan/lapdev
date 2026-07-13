import { skillService } from '../services/skillService.ts';
import { skillPublishService } from '../services/skillPublishService.ts';
import { skillValidator } from '../utils/skillValidator.ts';

const SKILL_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

const OFFICIAL_SKILLS_REGISTRY = 'https://github.com/lapdev/skills';

function getGlobalSkillsDir(): string {
  const home = Deno.env.get('HOME') || Deno.env.get('USERPROFILE') || '/';
  return `${home}/.lapdev/skills`;
}

function getDefaultSkillFile(): string {
  let currentDir: string;
  try {
    currentDir = Deno.cwd();
  } catch {
    return '.skill.md';
  }
  
  const defaultPath = `${currentDir}/.skill.md`;
  if (Deno.existsSync(defaultPath)) {
    return defaultPath;
  }
  
  try {
    for (const file of Deno.readDirSync(currentDir)) {
      if (file.isFile && file.name.endsWith('.skill.md')) {
        return `${currentDir}/${file.name}`;
      }
    }
  } catch {
    return '.skill.md';
  }
  
  return `${currentDir}/.skill.md`;
}

export class SkillCLI {
  async install(skillName: string): Promise<void> {
    if (!this.validateSkillName(skillName)) {
      console.error(`❌ 无效的Skill名称: ${skillName}`);
      console.error(`   Skill名称只能包含字母、数字、下划线和连字符`);
      throw new Error(`Invalid skill name: ${skillName}`);
    }

    const skillDir = getGlobalSkillsDir();
    const skillPath = `${skillDir}/${skillName}.skill.md`;

    if (Deno.existsSync(skillPath)) {
      console.log(`✅ Skill "${skillName}" 已安装`);
      return;
    }

    try {
      console.log(`📥 正在安装 Skill: ${skillName}`);
      
      if (!Deno.existsSync(skillDir)) {
        Deno.mkdirSync(skillDir, { recursive: true });
      }

      const downloadUrl = `${OFFICIAL_SKILLS_REGISTRY}/raw/main/skills/${skillName}.skill.md`;
      
      const result = Deno.run({
        cmd: ['curl', '-sL', downloadUrl, '-o', skillPath],
        stderr: 'piped',
        stdout: 'piped'
      });

      const status = result.status();
      const stderr = new TextDecoder().decode(await result.stderrOutput());
      
      result.close();
      
      if (!status.success) {
        console.error(`❌ 下载失败，退出码: ${status.code}`);
        console.error(`   错误信息: ${stderr}`);
        throw new Error(`Failed to download skill: ${skillName}`);
      }

      console.log(`✅ Skill "${skillName}" 安装成功`);
      
      skillService.reload();
      console.log(`🔄 Skill已重新加载`);
    } catch (error) {
      console.error(`❌ 安装失败: ${error}`);
      throw error;
    }
  }

  private validateSkillName(skillName: string): boolean {
    if (!skillName || skillName.trim() === '') {
      return false;
    }
    return SKILL_NAME_PATTERN.test(skillName);
  }

  list(): void {
    const skills = skillService.getSkills();

    if (skills.length === 0) {
      console.log('📭 暂无已安装的Skill');
      return;
    }

    console.log('📋 已安装的Skill列表:');
    console.log('='.repeat(60));
    
    for (const skill of skills) {
      console.log(`\n📌 ${skill.name} (v${skill.version})`);
      console.log(`   描述: ${skill.description || '未提供描述'}`);
      console.log(`   作者: ${skill.author || '未知'}`);
      console.log(`   标签: ${skill.tags.length > 0 ? skill.tags.join(', ') : '无'}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log(`总计: ${skills.length} 个Skill`);
  }

  reload(): void {
    try {
      console.log('🔄 正在重新加载Skill...');
      const result = skillService.reload();
      console.log(`✅ 重新加载完成`);
      console.log(`   全局Skill: ${result.globalCount} 个`);
      console.log(`   项目级Skill: ${result.projectCount} 个`);
      console.log(`   总计: ${result.skills.length} 个`);
    } catch (error) {
      console.error(`❌ 重新加载失败: ${error}`);
      throw error;
    }
  }

  async login(apiKey: string): Promise<void> {
    if (!apiKey || apiKey.trim() === '') {
      console.error('❌ 请提供API Key');
      console.error('   使用方法: lapdev skill login <api-key>');
      return;
    }

    const result = await skillPublishService.login(apiKey);
    
    if (result.success) {
      console.log(`✅ ${result.message}`);
    } else {
      console.error(`❌ ${result.message}`);
      if (result.error) {
        console.error(`   错误: ${result.error}`);
      }
      if (result.suggestion) {
        console.error(`   建议: ${result.suggestion}`);
      }
    }
  }

  async logout(): Promise<void> {
    const result = await skillPublishService.logout();
    
    if (result.success) {
      console.log(`✅ ${result.message}`);
    } else {
      console.error(`❌ ${result.message}`);
      if (result.error) {
        console.error(`   错误: ${result.error}`);
      }
    }
  }

  async publish(filePath?: string, dryRun: boolean = false): Promise<void> {
    const targetPath = filePath || getDefaultSkillFile();

    if (!Deno.existsSync(targetPath)) {
      console.error(`❌ 文件不存在: ${targetPath}`);
      console.error('   使用方法: lapdev skill publish [文件路径]');
      console.error('   默认发布当前目录下的 .skill.md 文件');
      return;
    }

    const result = await skillPublishService.publish(targetPath, dryRun);
    
    if (result.success) {
      console.log(`✅ ${result.message}`);
    } else {
      console.error(`❌ ${result.message}`);
      if (result.error) {
        console.error(`   错误: ${result.error}`);
      }
      if (result.suggestion) {
        console.error(`   建议: ${result.suggestion}`);
      }
    }
  }

  async isLoggedIn(): Promise<boolean> {
    return await skillPublishService.isLoggedIn();
  }

  async validateAPIKey(): Promise<boolean> {
    return await skillPublishService.validateAPIKey();
  }

  validateSkillFile(filePath: string): void {
    const result = skillValidator.validateSkillFile(filePath);
    
    if (!result.isValid) {
      throw new Error(result.errors.join('; '));
    }
  }

  validateVersion(version: string): void {
    if (!skillValidator.validateVersion(version)) {
      throw new Error('版本号必须符合语义化版本规范（semver）');
    }
  }

  showHelp(): void {
    console.log(`
📖 Lapdev Skill CLI 命令帮助

命令:
  lapdev skill install <name>    安装官方Skill
  lapdev skill list              列出已安装的Skill
  lapdev skill reload            重新加载Skill
  lapdev skill login <api-key>   登录Skill市场
  lapdev skill logout            退出登录
  lapdev skill publish [path]    发布Skill到市场
  lapdev skill help              显示此帮助信息

示例:
  lapdev skill install code-review
  lapdev skill login my-api-key-123
  lapdev skill publish
  lapdev skill publish ./my-skill.skill.md
  lapdev skill publish --dry-run

选项:
  --dry-run    仅验证Skill文件，不实际发布

说明:
  - 全局Skill安装路径: ${getGlobalSkillsDir()}
  - 项目级Skill路径: .lapdev/skills/
  - 项目级Skill优先级高于全局Skill
  - 发布前需要先登录（lapdev skill login）
    `);
  }

  async execute(command: string, args: string[]): Promise<void> {
    switch (command) {
      case 'install':
        if (args.length === 0) {
          console.error('❌ 请提供Skill名称');
          return;
        }
        await this.install(args[0]);
        break;
      case 'list':
        this.list();
        break;
      case 'reload':
        this.reload();
        break;
      case 'login':
        if (args.length === 0) {
          console.error('❌ 请提供API Key');
          console.error('   使用方法: lapdev skill login <api-key>');
          return;
        }
        await this.login(args[0]);
        break;
      case 'logout':
        await this.logout();
        break;
      case 'publish':
        const dryRun = args.includes('--dry-run') || args.includes('-d');
        const filePath = args.filter(arg => !arg.startsWith('-'))[0];
        await this.publish(filePath, dryRun);
        break;
      case 'help':
      default:
        this.showHelp();
        break;
    }
  }
}

export const skillCli = new SkillCLI();