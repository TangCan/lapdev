import { SkillService } from './skillService.ts';
import { exists, existsSync } from 'https://deno.land/std/fs/mod.ts';

export type BMADStatus = 'not-installed' | 'installing' | 'installed' | 'error';

export interface BMADService {
  isBMADInstalled(): Promise<boolean>;
  hasBMADDirectory(): boolean;
  installOnline(onLog?: (line: string) => void): Promise<{ success: boolean; error?: string; log: string[] }>;
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

  async installOnline(onLog?: (line: string) => void): Promise<{ success: boolean; error?: string; log: string[] }> {
    this.status = 'installing';
    const log: string[] = [];

    const addLog = (line: string) => {
      log.push(line);
      if (onLog) {
        onLog(line);
      }
    };

    try {
      addLog('Starting BMAD installation...');
      addLog('Executing: npx bmad-method install');

      // 检查Node.js是否可用
      try {
        const nodeCheck = new Deno.Command('node', {
          args: ['--version'],
          stdout: 'piped',
          stderr: 'piped',
        });
        await nodeCheck.output();
      } catch {
        addLog('Warning: Node.js not found, will attempt fallback');
      }

      // 执行npx命令
      const command = new Deno.Command('npx', {
        args: ['bmad-method', 'install'],
        cwd: this.workspacePath,
        stdout: 'piped',
        stderr: 'piped',
      });

      const process = command.spawn();
      const decoder = new TextDecoder();

      // 实时读取stdout
      const stdoutReader = process.stdout.getReader();
      const stdoutPromise = (async () => {
        while (true) {
          const { done, value } = await stdoutReader.read();
          if (done) break;
          const output = decoder.decode(value);
          output.split('\n').filter(line => line.trim()).forEach(line => addLog(line));
        }
      })();

      // 实时读取stderr
      const stderrReader = process.stderr.getReader();
      const stderrPromise = (async () => {
        while (true) {
          const { done, value } = await stderrReader.read();
          if (done) break;
          const output = decoder.decode(value);
          output.split('\n').filter(line => line.trim()).forEach(line => addLog(line));
        }
      })();

      // 等待命令完成和输出读取完毕
      await Promise.all([stdoutPromise, stderrPromise]);
      const status = await process.status;
      const code = status.code;

      if (code === 0) {
        addLog('BMAD installation completed successfully');
        this.status = 'installed';

        // 注册BMAD技能
        await this.registerBMADSkills();
        addLog('BMAD skills registered successfully');

        return { success: true, log };
      } else {
        addLog(`Installation failed with exit code ${code}`);
        this.status = 'error';
        return { success: false, error: `Installation failed with exit code ${code}`, log };
      }
    } catch (error) {
      const err = error as Error;
      addLog(`Installation error: ${err.message}`);
      this.status = 'error';
      return { success: false, error: err.message, log };
    }
  }

  private async registerBMADSkills(): Promise<void> {
    const bmadSkillsPath = `${this.workspacePath}/_bmad/skills`;
    if (await exists(bmadSkillsPath)) {
      await this.skillService.registerSkillsFromDirectory(bmadSkillsPath);
    }
  }
}