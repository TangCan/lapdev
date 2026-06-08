import { SkillService } from './skillService.ts';
import { exists, existsSync } from 'https://deno.land/std/fs/mod.ts';

export type BMADStatus = 'not-installed' | 'installing' | 'installing-offline' | 'installed' | 'installed-offline' | 'error';

export interface BMADService {
  isBMADInstalled(): Promise<boolean>;
  hasBMADDirectory(): boolean;
  installOnline(onLog?: (line: string) => void): Promise<{ success: boolean; error?: string; log: string[] }>;
  installOffline(onLog?: (line: string) => void): Promise<{ success: boolean; error?: string; log: string[] }>;
  upgradeToFull(onLog?: (line: string) => void): Promise<{ success: boolean; error?: string; log: string[] }>;
  isOfflineMode(): boolean;
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

  isOfflineMode(): boolean {
    return this.status === 'installed-offline';
  }

  getStatus(): BMADStatus {
    return this.status;
  }

  refreshStatus(): void {
    if (this.hasBMADDirectory()) {
      // 检查是否为离线模式（只有_core目录，没有完整的_bmad结构）
      const offlinePath = `${this.workspacePath}/_bmad/core`;
      const skillsPath = `${this.workspacePath}/_bmad/skills`;
      if (existsSync(offlinePath) && !existsSync(skillsPath)) {
        this.status = 'installed-offline';
      } else {
        this.status = 'installed';
      }
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
        addLog('Warning: Node.js not found, attempting offline fallback...');
        return this.installOffline(onLog);
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
        addLog(`Installation failed with exit code ${code}, attempting offline fallback...`);
        return this.installOffline(onLog);
      }
    } catch (error) {
      const err = error as Error;
      addLog(`Installation error: ${err.message}, attempting offline fallback...`);
      return this.installOffline(onLog);
    }
  }

  async installOffline(onLog?: (line: string) => void): Promise<{ success: boolean; error?: string; log: string[] }> {
    this.status = 'installing-offline';
    const log: string[] = [];

    const addLog = (line: string) => {
      log.push(line);
      if (onLog) {
        onLog(line);
      }
    };

    try {
      addLog('Starting offline BMAD installation...');

      // 创建_bmad/core目录
      const corePath = `${this.workspacePath}/_bmad/core`;
      await Deno.mkdir(corePath, { recursive: true });
      addLog(`Created directory: ${corePath}`);

      // 写入内置的简化版BMAD文件
      await this.writeOfflineBMADFiles(corePath, addLog);

      this.status = 'installed-offline';
      addLog('Offline BMAD installation completed successfully');

      // 注册离线模式下的BMAD技能
      await this.registerBMADSkills();
      addLog('BMAD skills registered successfully');

      return { success: true, log };
    } catch (error) {
      const err = error as Error;
      addLog(`Offline installation error: ${err.message}`);
      this.status = 'error';
      return { success: false, error: err.message, log };
    }
  }

  async upgradeToFull(onLog?: (line: string) => void): Promise<{ success: boolean; error?: string; log: string[] }> {
    // 如果当前不是离线模式，不需要升级
    if (this.status !== 'installed-offline') {
      return { success: true, error: 'Not in offline mode', log: ['Already in full BMAD mode'] };
    }

    // 保存当前状态，用于失败时恢复
    const originalStatus = this.status;
    const log: string[] = [];

    const addLog = (line: string) => {
      log.push(line);
      if (onLog) {
        onLog(line);
      }
    };

    addLog('Starting upgrade from offline mode to full BMAD...');

    try {
      // 尝试在线安装升级
      const result = await this.installOnline(onLog);

      if (result.success) {
        addLog('Upgrade to full BMAD completed successfully');
        return { success: true, log: [...log, ...result.log] };
      } else {
        // 在线安装失败，需要恢复到离线模式
        addLog(`Upgrade failed: ${result.error || 'Unknown error'}`);
        
        // 检查离线文件是否仍然存在
        const corePath = `${this.workspacePath}/_bmad/core`;
        const offlineFilesExist = existsSync(corePath);

        if (offlineFilesExist) {
          // 离线文件存在，恢复到离线模式
          this.status = 'installed-offline';
          addLog('Restored to offline mode');
        } else {
          // 离线文件也不存在，尝试重新创建
          addLog('Offline files missing, attempting to restore...');
          const restoreResult = await this.restoreOfflineMode(addLog);
          if (restoreResult.success) {
            this.status = 'installed-offline';
            addLog('Successfully restored offline mode');
          } else {
            this.status = 'error';
            addLog(`Failed to restore offline mode: ${restoreResult.error}`);
          }
        }

        return { 
          success: false, 
          error: result.error || 'Upgrade failed and offline mode restoration failed', 
          log: [...log, ...result.log] 
        };
      }
    } catch (error) {
      // 捕获任何未处理的异常
      const err = error as Error;
      addLog(`Upgrade error: ${err.message}`);

      // 尝试恢复到原始状态
      try {
        const corePath = `${this.workspacePath}/_bmad/core`;
        if (existsSync(corePath)) {
          this.status = 'installed-offline';
          addLog('Recovered to offline mode after error');
        } else {
          this.status = originalStatus;
          addLog(`Recovered to original status: ${originalStatus}`);
        }
      } catch {
        this.status = 'error';
        addLog('Failed to recover status after error');
      }

      return { success: false, error: err.message, log };
    }
  }

  private async restoreOfflineMode(addLog: (line: string) => void): Promise<{ success: boolean; error?: string }> {
    try {
      const corePath = `${this.workspacePath}/_bmad/core`;
      await Deno.mkdir(corePath, { recursive: true });
      addLog(`Created directory: ${corePath}`);
      
      await this.writeOfflineBMADFiles(corePath, addLog);
      return { success: true };
    } catch (error) {
      const err = error as Error;
      return { success: false, error: err.message };
    }
  }

  private async writeOfflineBMADFiles(corePath: string, addLog: (line: string) => void): Promise<void> {
    // 写入config.yaml
    const configContent = `# BMAD Configuration (Offline Mode)
version: "1.0"
mode: offline
workflows:
  - quick-flow
agents:
  - developer
  - pm
`;
    await Deno.writeTextFile(`${corePath}/config.yaml`, configContent);
    addLog('Created: config.yaml');

    // 写入quick-flow.skill.md
    const quickFlowContent = `---
id: bmad-quick-flow
name: BMAD Quick Flow
category: BMAD
description: Quick workflow for BMAD agile methodology
tags: [bmad, workflow, agile]
---

# BMAD Quick Flow Skill

## Overview
Quick flow workflow for rapid development cycles.

## Commands
- Start new story
- Run tests
- Code review
- Complete story
`;
    await Deno.writeTextFile(`${corePath}/quick-flow.skill.md`, quickFlowContent);
    addLog('Created: quick-flow.skill.md');

    // 写入developer.skill.md
    const developerContent = `---
id: bmad-developer
name: Developer Agent
category: BMAD
description: Developer agent for implementation tasks
tags: [bmad, agent, developer]
---

# Developer Agent

## Overview
Handles implementation tasks and code development.

## Capabilities
- Code implementation
- Test writing
- Bug fixing
- Code review
`;
    await Deno.writeTextFile(`${corePath}/developer.skill.md`, developerContent);
    addLog('Created: developer.skill.md');

    // 写入pm.skill.md
    const pmContent = `---
id: bmad-pm
name: PM Agent
category: BMAD
description: Product manager agent for requirements management
tags: [bmad, agent, pm]
---

# PM Agent

## Overview
Handles product management tasks and requirements.

## Capabilities
- Story creation
- Requirements analysis
- Sprint planning
- Acceptance criteria
`;
    await Deno.writeTextFile(`${corePath}/pm.skill.md`, pmContent);
    addLog('Created: pm.skill.md');
  }

  private async registerBMADSkills(): Promise<void> {
    const bmadSkillsPath = `${this.workspacePath}/_bmad/skills`;
    if (await exists(bmadSkillsPath)) {
      await this.skillService.registerSkillsFromDirectory(bmadSkillsPath);
    }
    
    // 也检查core目录（离线模式）
    const corePath = `${this.workspacePath}/_bmad/core`;
    if (await exists(corePath)) {
      await this.skillService.registerSkillsFromDirectory(corePath);
    }
  }
}