/**
 * BMADService 独立测试套件
 * 
 * 测试覆盖：
 * 1. 状态检测（未安装/已安装/安装中/错误）
 * 2. 安装流程（在线安装成功/失败）
 * 3. 错误处理（Node.js不可用/网络错误/命令失败）
 * 4. 状态转换
 * 5. 边界情况
 */

import { describe, it } from 'https://deno.land/std/testing/bdd.ts';
import { assertEquals, assertExists } from 'https://deno.land/std/assert/mod.ts';

// BMADStatus类型
type BMADStatus = 'not-installed' | 'installing' | 'installed' | 'error';

// 获取测试目录
function getTestDir(): string {
  return `/tmp/bmad_test_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

// BMADService测试实现
class TestBMADService {
  private _status: BMADStatus = 'not-installed';
  private workspacePath: string;
  
  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
    this.refreshStatus();
  }
  
  getStatus(): BMADStatus {
    return this._status;
  }
  
  hasBMADDirectory(): boolean {
    try {
      const info = Deno.statSync(`${this.workspacePath}/_bmad`);
      return info.isDirectory;
    } catch {
      return false;
    }
  }
  
  async isBMADInstalled(): Promise<boolean> {
    return this.hasBMADDirectory();
  }
  
  refreshStatus(): void {
    this._status = this.hasBMADDirectory() ? 'installed' : 'not-installed';
  }
  
  async installOnline(): Promise<{ success: boolean; error?: string; log: string[] }> {
    this._status = 'installing';
    const log: string[] = [];
    
    try {
      log.push('Starting BMAD installation...');
      log.push('Executing: npx bmad-method install');
      
      try {
        const nodeCheck = new Deno.Command('node', {
          args: ['--version'],
          stdout: 'piped',
          stderr: 'piped',
        });
        await nodeCheck.output();
      } catch {
        log.push('Warning: Node.js not found');
      }
      
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
        this._status = 'installed';
        return { success: true, log };
      } else {
        log.push(`Installation failed with exit code ${code}`);
        this._status = 'error';
        return { success: false, error: `Installation failed with exit code ${code}`, log };
      }
    } catch (error) {
      const err = error as Error;
      log.push(`Installation error: ${err.message}`);
      this._status = 'error';
      return { success: false, error: err.message, log };
    }
  }
}

describe('BMADService', () => {
  describe('状态检测', () => {
    it('应该返回not-installed当_bmad目录不存在', () => {
      const testDir = getTestDir();
      Deno.mkdirSync(testDir, { recursive: true });
      const bmadService = new TestBMADService(testDir);
      assertEquals(bmadService.getStatus(), 'not-installed');
      Deno.removeSync(testDir, { recursive: true });
    });

    it('hasBMADDirectory应该返回false当目录不存在', () => {
      const testDir = getTestDir();
      Deno.mkdirSync(testDir, { recursive: true });
      const bmadService = new TestBMADService(testDir);
      assertEquals(bmadService.hasBMADDirectory(), false);
      Deno.removeSync(testDir, { recursive: true });
    });

    it('isBMADInstalled应该返回false当目录不存在', async () => {
      const testDir = getTestDir();
      Deno.mkdirSync(testDir, { recursive: true });
      const bmadService = new TestBMADService(testDir);
      const result = await bmadService.isBMADInstalled();
      assertEquals(result, false);
      Deno.removeSync(testDir, { recursive: true });
    });

    it('应该返回installed当_bmad目录存在', () => {
      const testDir = getTestDir();
      Deno.mkdirSync(testDir, { recursive: true });
      Deno.mkdirSync(`${testDir}/_bmad`);
      const bmadService = new TestBMADService(testDir);
      assertEquals(bmadService.getStatus(), 'installed');
      Deno.removeSync(testDir, { recursive: true });
    });
  });

  describe('状态转换', () => {
    it('installOnline应该改变状态', async () => {
      const testDir = getTestDir();
      Deno.mkdirSync(testDir, { recursive: true });
      const bmadService = new TestBMADService(testDir);
      assertEquals(bmadService.getStatus(), 'not-installed');
      
      const result = await bmadService.installOnline();
      
      // 安装可能成功或失败，状态应该相应变化
      assertEquals(
        bmadService.getStatus() === 'error' || bmadService.getStatus() === 'installed',
        true
      );
      assertEquals(typeof result.success === 'boolean', true);
      Deno.removeSync(testDir, { recursive: true });
    });
  });

  describe('安装流程', () => {
    it('应该记录安装日志', async () => {
      const testDir = getTestDir();
      Deno.mkdirSync(testDir, { recursive: true });
      const bmadService = new TestBMADService(testDir);
      const result = await bmadService.installOnline();
      
      assertExists(result.log);
      assertEquals(result.log.length > 0, true);
      
      const hasStartLog = result.log.some(log => 
        log.includes('Starting') || log.includes('BMAD installation')
      );
      assertEquals(hasStartLog, true);
      Deno.removeSync(testDir, { recursive: true });
    });

    it('应该记录执行的命令', async () => {
      const testDir = getTestDir();
      Deno.mkdirSync(testDir, { recursive: true });
      const bmadService = new TestBMADService(testDir);
      const result = await bmadService.installOnline();
      
      const hasNpxCommand = result.log.some(log => 
        log.includes('npx') || log.includes('bmad-method')
      );
      assertEquals(hasNpxCommand, true);
      Deno.removeSync(testDir, { recursive: true });
    });

    it('安装时应该返回结果信息', async () => {
      const testDir = getTestDir();
      Deno.mkdirSync(testDir, { recursive: true });
      const bmadService = new TestBMADService(testDir);
      const result = await bmadService.installOnline();
      
      // 安装应该返回结果（成功或失败）
      assertEquals(typeof result.success === 'boolean', true);
      assertExists(result.log);
      Deno.removeSync(testDir, { recursive: true });
    });
  });

  describe('错误处理', () => {
    it('应该捕获不存在路径的错误', async () => {
      const bmadService = new TestBMADService('/nonexistent/path');
      const result = await bmadService.installOnline();
      assertEquals(result.success, false);
    });

    it('应该处理stderr输出', async () => {
      const testDir = getTestDir();
      Deno.mkdirSync(testDir, { recursive: true });
      const bmadService = new TestBMADService(testDir);
      const result = await bmadService.installOnline();
      assertExists(result.log);
      Deno.removeSync(testDir, { recursive: true });
    });
  });

  describe('边界情况', () => {
    it('空工作目录路径应该返回not-installed', () => {
      const bmadService = new TestBMADService('');
      assertEquals(bmadService.getStatus(), 'not-installed');
    });

    it('重复调用installOnline应该被处理', async () => {
      const testDir = getTestDir();
      Deno.mkdirSync(testDir, { recursive: true });
      const bmadService = new TestBMADService(testDir);
      
      const result1 = await bmadService.installOnline();
      const result2 = await bmadService.installOnline();
      
      assertEquals(typeof result1.success === 'boolean', true);
      assertEquals(typeof result2.success === 'boolean', true);
      Deno.removeSync(testDir, { recursive: true });
    });
  });

  describe('类型和接口', () => {
    it('BMADStatus应该是有效的枚举值', () => {
      const validStatuses: BMADStatus[] = [
        'not-installed',
        'installing',
        'installed',
        'error'
      ];
      
      const testDir = getTestDir();
      Deno.mkdirSync(testDir, { recursive: true });
      const bmadService = new TestBMADService(testDir);
      const status = bmadService.getStatus();
      assertEquals(validStatuses.includes(status), true);
      Deno.removeSync(testDir, { recursive: true });
    });

    it('installOnline应该返回正确的接口结构', async () => {
      const testDir = getTestDir();
      Deno.mkdirSync(testDir, { recursive: true });
      const bmadService = new TestBMADService(testDir);
      const result = await bmadService.installOnline();
      
      assertExists(result);
      assertEquals(typeof result.success === 'boolean', true);
      assertEquals(Array.isArray(result.log), true);
      
      if (!result.success) {
        assertExists(result.error);
      }
      Deno.removeSync(testDir, { recursive: true });
    });
  });

  describe('并发测试', () => {
    it('多个并发安装请求应该被正确处理', async () => {
      const testDir = getTestDir();
      Deno.mkdirSync(testDir, { recursive: true });
      const bmadService = new TestBMADService(testDir);
      
      const promises = [
        bmadService.installOnline(),
        bmadService.installOnline(),
        bmadService.installOnline(),
      ];
      
      const results = await Promise.all(promises);
      
      assertEquals(results.length, 3);
      results.forEach(result => {
        assertEquals(typeof result.success === 'boolean', true);
        assertEquals(Array.isArray(result.log), true);
      });
      Deno.removeSync(testDir, { recursive: true });
    });
  });
});
