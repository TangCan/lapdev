import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { skillService } from '../services/skillService';

const SKILL_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

const OFFICIAL_SKILLS_REGISTRY = 'https://github.com/lapdev/skills';
const GLOBAL_SKILLS_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || '/',
  '.lapdev',
  'skills'
);

export class SkillCLI {
  install(skillName: string): void {
    if (!this.validateSkillName(skillName)) {
      console.error(`❌ 无效的Skill名称: ${skillName}`);
      console.error(`   Skill名称只能包含字母、数字、下划线和连字符`);
      throw new Error(`Invalid skill name: ${skillName}`);
    }

    const skillDir = path.join(GLOBAL_SKILLS_DIR, `${skillName}.skill.md`);

    if (fs.existsSync(skillDir)) {
      console.log(`✅ Skill "${skillName}" 已安装`);
      return;
    }

    try {
      console.log(`📥 正在安装 Skill: ${skillName}`);
      
      if (!fs.existsSync(GLOBAL_SKILLS_DIR)) {
        fs.mkdirSync(GLOBAL_SKILLS_DIR, { recursive: true });
      }

      const downloadUrl = `${OFFICIAL_SKILLS_REGISTRY}/raw/main/skills/${skillName}.skill.md`;
      
      const result = spawnSync('curl', ['-sL', downloadUrl, '-o', skillDir]);
      
      if (result.error) {
        console.error(`❌ 下载失败: ${result.error.message}`);
        throw new Error(`Failed to download skill: ${skillName}`);
      }
      
      if (result.status !== 0) {
        const stderr = result.stderr?.toString() || 'Unknown error';
        console.error(`❌ 下载失败，退出码: ${result.status}`);
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

  showHelp(): void {
    console.log(`
📖 Lapdev Skill CLI 命令帮助

命令:
  lapdev skill install <name>    安装官方Skill
  lapdev skill list              列出已安装的Skill
  lapdev skill reload            重新加载Skill
  lapdev skill help              显示此帮助信息

示例:
  lapdev skill install code-review
  lapdev skill install documentation
  lapdev skill list

说明:
  - 全局Skill安装路径: ${GLOBAL_SKILLS_DIR}
  - 项目级Skill路径: .lapdev/skills/
  - 项目级Skill优先级高于全局Skill
    `);
  }

  execute(command: string, args: string[]): void {
    switch (command) {
      case 'install':
        if (args.length === 0) {
          console.error('❌ 请提供Skill名称');
          return;
        }
        this.install(args[0]);
        break;
      case 'list':
        this.list();
        break;
      case 'reload':
        this.reload();
        break;
      case 'help':
      default:
        this.showHelp();
        break;
    }
  }
}

export const skillCli = new SkillCLI();
