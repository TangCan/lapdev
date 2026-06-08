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
  private isInstalling = false;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
    this.refreshStatus();
  }

  hasBMADDirectory(): boolean {
    const bmadPath = `${this.workspacePath}/_bmad`;
    return existsSync(bmadPath);
  }

  async isBMADInstalled(): Promise<boolean> {
    const bmadPath = `${this.workspacePath}/_bmad`;
    const existsDir = await exists(bmadPath);
    if (!existsDir) return false;
    
    // 验证目录内容完整性
    const requiredFiles = ['wds', 'skills', 'config.yaml'];
    for (const file of requiredFiles) {
      const filePath = `${bmadPath}/${file}`;
      if (!(await exists(filePath))) {
        return false;
      }
    }
    return true;
  }

  getStatus(): BMADStatus {
    return this.status;
  }

  refreshStatus(): void {
    if (this.status === 'installing') {
      return;
    }
    if (this.hasBMADDirectory()) {
      this.status = 'installed';
    } else {
      this.status = 'not-installed';
    }
  }

  async checkWritePermission(path: string): Promise<boolean> {
    try {
      const testFile = `${path}/.bmad_write_test_${Date.now()}`;
      await Deno.writeTextFile(testFile, '');
      await Deno.remove(testFile);
      return true;
    } catch {
      return false;
    }
  }

  async validateNodeVersion(): Promise<{ valid: boolean; version?: string; message?: string }> {
    try {
      const nodeCheck = new Deno.Command('node', {
        args: ['--version'],
        stdout: 'piped',
        stderr: 'piped',
      });
      const output = await nodeCheck.output();
      const versionStr = new TextDecoder().decode(output.stdout).trim();
      
      if (!versionStr.startsWith('v')) {
        return { valid: false, message: 'Invalid Node.js version format' };
      }
      
      const versionParts = versionStr.slice(1).split('.');
      const major = parseInt(versionParts[0]);
      
      if (major < 16) {
        return { valid: false, version: versionStr, message: `Node.js version ${versionStr} is too old, requires >= 16.0.0` };
      }
      
      return { valid: true, version: versionStr };
    } catch (error) {
      const err = error as Error;
      return { valid: false, message: err.message };
    }
  }

  async installOnline(onLog?: (line: string) => void): Promise<{ success: boolean; error?: string; log: string[] }> {
    // 并发安装保护
    if (this.isInstalling) {
      return { success: false, error: 'Installation is already in progress', log: [] };
    }
    
    this.isInstalling = true;
    this.status = 'installing';
    const log: string[] = [];

    const addLog = (line: string) => {
      log.push(line);
      if (onLog) {
        // 使用Promise.resolve避免同步回调阻塞
        Promise.resolve().then(() => onLog(line)).catch(() => {});
      }
    };

    try {
      addLog('Starting BMAD installation...');
      addLog('Executing: npx bmad-method install');

      // 检查目录写入权限
      const hasWritePermission = await this.checkWritePermission(this.workspacePath);
      if (!hasWritePermission) {
        addLog('Error: No write permission in workspace directory');
        this.status = 'error';
        this.isInstalling = false;
        return { success: false, error: 'No write permission in workspace directory', log };
      }

      // 检查Node.js版本
      const nodeResult = await this.validateNodeVersion();
      if (!nodeResult.valid) {
        addLog(`Error: ${nodeResult.message}`);
        this.status = 'error';
        this.isInstalling = false;
        return { success: false, error: nodeResult.message, log };
      }
      addLog(`Node.js version: ${nodeResult.version}`);

      // 执行npx命令（带超时控制）
      const command = new Deno.Command('npx', {
        args: ['bmad-method', 'install'],
        cwd: this.workspacePath,
        stdout: 'piped',
        stderr: 'piped',
      });

      const process = command.spawn();
      const decoder = new TextDecoder();

      // 设置超时（10分钟）
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => {
          process.kill('SIGTERM');
          reject(new Error('Installation timed out after 10 minutes'));
        }, 600000);
      });

      // 实时读取stdout
      const stdoutReader = process.stdout.getReader();
      const stdoutPromise = (async () => {
        try {
          while (true) {
            const { done, value } = await stdoutReader.read();
            if (done) break;
            const output = decoder.decode(value);
            output.split('\n').filter(line => line.trim()).forEach(line => addLog(line));
          }
        } catch {
          // 忽略读取错误
        }
      })();

      // 实时读取stderr
      const stderrReader = process.stderr.getReader();
      const stderrPromise = (async () => {
        try {
          while (true) {
            const { done, value } = await stderrReader.read();
            if (done) break;
            const output = decoder.decode(value);
            output.split('\n').filter(line => line.trim()).forEach(line => addLog(line));
          }
        } catch {
          // 忽略读取错误
        }
      })();

      // 等待命令完成和输出读取完毕
      await Promise.race([
        Promise.all([stdoutPromise, stderrPromise, process.status]),
        timeoutPromise
      ]);

      const status = await process.status;
      const code = status.code;

      if (code === 0) {
        addLog('BMAD installation completed successfully');
        this.status = 'installed';
        addLog('BMAD skills registered successfully');
        this.isInstalling = false;
        return { success: true, log };
      } else {
        addLog(`Installation failed with exit code ${code}`);
        this.status = 'error';
        this.isInstalling = false;
        
        // 尝试清理部分安装的文件
        try {
          const bmadPath = `${this.workspacePath}/_bmad`;
          if (await exists(bmadPath)) {
            await Deno.remove(bmadPath, { recursive: true });
            addLog('Cleaned up partial installation');
          }
        } catch {
          addLog('Warning: Failed to clean up partial installation');
        }
        
        return { success: false, error: `Installation failed with exit code ${code}`, log };
      }
    } catch (error) {
      const err = error as Error;
      addLog(`Installation error: ${err.message}`);
      this.status = 'error';
      this.isInstalling = false;
      
      // 尝试清理部分安装的文件
      try {
        const bmadPath = `${this.workspacePath}/_bmad`;
        if (await exists(bmadPath)) {
          await Deno.remove(bmadPath, { recursive: true });
          addLog('Cleaned up partial installation');
        }
      } catch {
        addLog('Warning: Failed to clean up partial installation');
      }
      
      return { success: false, error: err.message, log };
    }
  }
}
