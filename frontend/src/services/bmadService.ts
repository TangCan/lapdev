import { SkillService } from './skillService.ts';
import { exists, existsSync } from 'https://deno.land/std/fs/mod.ts';

export type BMADStatus = 'not-installed' | 'installing' | 'installed' | 'error';

export interface BMADService {
  isBMADInstalled(): Promise<boolean>;
  hasBMADDirectory(): boolean;
  installOnline(): Promise<{ success: boolean; error?: string; log: string[] }>;
  getStatus(): BMADStatus;
  refreshStatus(): void;
}

export class BMADServiceImpl implements BMADService {
  private status: BMADStatus = 'not-installed';
  private workspacePath: string;
  private skillService: SkillService;

  constructor(workspacePath: string, skillService: SkillService) {
    this.workspacePath = workspacePath;
    this.skillService = skillService;
    this.refreshStatus();
  }

  hasBMADDirectory(): boolean {
    const bmadPath = `${this.workspacePath}/_bmad`;
    return existsSync(bmadPath);
  }

  async isBMADInstalled(): Promise<boolean> {
    const bmadPath = `${this.workspacePath}/_bmad`;
    return await exists(bmadPath);
  }

  getStatus(): BMADStatus {
    return this.status;
  }

  refreshStatus(): void {
    if (this.hasBMADDirectory()) {
      this.status = 'installed';
    } else {
      this.status = 'not-installed';
    }
  }

  async installOnline(): Promise<{ success: boolean; error?: string; log: string[] }> {
    this.status = 'installing';
    const log: string[] = [];

    try {
      log.push('Starting BMAD installation...');
      log.push('Executing: npx bmad-method install');

      // 检查Node.js是否可用
      try {
        const nodeCheck = new Deno.Command('node', {
          args: ['--version'],
          stdout: 'piped',
          stderr: 'piped',
        });
        await nodeCheck.output();
      } catch {
        log.push('Warning: Node.js not found, will attempt fallback');
      }

      // 执行npx命令
      const command = new Deno.Command('npx', {
        args: ['bmad-method', 'install'],
        cwd: this.workspacePath,
        stdout: 'piped',
        stderr: 'piped',
      });

      const { code, stdout, stderr } = await command.output();

      const stdoutStr = new TextDecoder().decode(stdout);
      const stderrStr = new TextDecoder().decode(stderr);

      if (stdoutStr) {
        log.push(...stdoutStr.split('\n').filter(line => line.trim()));
      }
      if (stderrStr) {
        log.push(...stderrStr.split('\n').filter(line => line.trim()));
      }

      if (code === 0) {
        log.push('BMAD installation completed successfully');
        this.status = 'installed';

        // 注册BMAD技能
        await this.registerBMADSkills();
        log.push('BMAD skills registered successfully');

        return { success: true, log };
      } else {
        log.push(`Installation failed with exit code ${code}`);
        this.status = 'error';
        return { success: false, error: `Installation failed with exit code ${code}`, log };
      }
    } catch (error) {
      const err = error as Error;
      log.push(`Installation error: ${err.message}`);
      this.status = 'error';
      return { success: false, error: err.message, log };
    }
  }

  private async registerBMADSkills(): Promise<void> {
    const bmadSkillsPath = `${this.workspacePath}/_bmad/skills`;
    if (await exists(bmadSkillsPath)) {
      // @ts-ignore - registerSkillsFromDirectory may not exist yet
      if (typeof this.skillService.registerSkillsFromDirectory === 'function') {
        await this.skillService.registerSkillsFromDirectory(bmadSkillsPath);
      }
    }
  }
}