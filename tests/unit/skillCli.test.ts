import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { SkillCLI } from '../../frontend/src/cli/skillCli';

// 使用vi.hoisted确保mock函数在vi.mock提升之前就被定义
const { mockSpawnSync, mockExistsSync, mockMkdirSync, mockReload, mockGetSkills } = vi.hoisted(() => ({
  mockSpawnSync: vi.fn(() => ({ error: null, status: 0, stderr: Buffer.from('') })),
  mockExistsSync: vi.fn(),
  mockMkdirSync: vi.fn(),
  mockReload: vi.fn(() => ({ skills: [], globalCount: 0, projectCount: 0 })),
  mockGetSkills: vi.fn(() => []),
}));

vi.mock('child_process', () => ({
  spawnSync: mockSpawnSync,
}));

vi.mock('fs', () => ({
  default: {
    existsSync: mockExistsSync,
    mkdirSync: mockMkdirSync,
  },
  existsSync: mockExistsSync,
  mkdirSync: mockMkdirSync,
}));

vi.mock('../../frontend/src/services/skillService', () => ({
  skillService: {
    reload: mockReload,
    getSkills: mockGetSkills,
  },
}));

describe('Skill CLI - ATDD Acceptance Tests', () => {
  let skillCli: SkillCLI;

  beforeEach(() => {
    skillCli = new SkillCLI();
    vi.clearAllMocks();
  });

  describe('Scenario: CLI安装Skill', () => {
    it('Given 官方Skill存在 When 执行install命令 Then 使用spawnSync下载并安装Skill', () => {
      mockExistsSync.mockReturnValue(false);

      skillCli.install('official-skill');

      expect(mockSpawnSync).toHaveBeenCalledWith(
        'curl',
        expect.arrayContaining(['-sL', '-o'])
      );
      expect(mockMkdirSync).toHaveBeenCalled();
    });

    it('Given Skill已安装 When 执行install命令 Then 提示已安装且不重复下载', () => {
      mockExistsSync.mockReturnValue(true);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      skillCli.install('existing-skill');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('已安装'));
      expect(mockSpawnSync).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('Given Skill名称包含非法字符 When 执行install命令 Then 提示错误并拒绝安装', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => skillCli.install('invalid skill!@#')).toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('无效的Skill名称'));
      
      consoleSpy.mockRestore();
    });

    it('Given Skill名称为空 When 执行install命令 Then 提示错误', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => skillCli.install('')).toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('无效的Skill名称'));
      
      consoleSpy.mockRestore();
    });

    it('Given 下载失败 When 执行install命令 Then 抛出错误并提示', () => {
      mockExistsSync.mockReturnValue(false);
      mockSpawnSync.mockReturnValue({ 
        error: null, 
        status: 1, 
        stderr: Buffer.from('curl: (22) The requested URL returned error: 404') 
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => skillCli.install('missing-skill')).toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('下载失败'));
      
      consoleSpy.mockRestore();
    });

    it('Given curl命令出错 When 执行install命令 Then 抛出错误', () => {
      mockExistsSync.mockReturnValue(false);
      mockSpawnSync.mockReturnValue({ 
        error: new Error('Command not found'), 
        status: null, 
        stderr: Buffer.from('') 
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => skillCli.install('test-skill')).toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('下载失败'));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Scenario: CLI列出Skill', () => {
    it('Given 已安装Skill When 执行list命令 Then 列出所有Skill', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      mockGetSkills.mockReturnValue([
        {
          name: 'test-skill',
          version: '1.0.0',
          description: 'Test Skill',
          author: 'Author',
          tags: ['test'],
          trigger: {},
          content: 'Content',
          fileName: 'test-skill.skill.md',
        },
      ]);

      skillCli.list();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('test-skill'));
      
      consoleSpy.mockRestore();
    });

    it('Given 没有已安装Skill When 执行list命令 Then 提示暂无Skill', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      mockGetSkills.mockReturnValue([]);

      skillCli.list();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('暂无已安装的Skill'));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Scenario: CLI重新加载Skill', () => {
    it('When 执行reload命令 Then 触发Skill重新加载', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      mockReload.mockReturnValue({ 
        skills: [], 
        globalCount: 3, 
        projectCount: 2 
      });

      skillCli.reload();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('重新加载完成'));
      expect(mockReload).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('When 重新加载失败 Then 提示错误', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockReload.mockImplementation(() => {
        throw new Error('Failed to reload');
      });

      expect(() => skillCli.reload()).toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('重新加载失败'));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Scenario: CLI帮助命令', () => {
    it('When 执行help命令 Then 显示帮助信息', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      skillCli.showHelp();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Skill CLI 命令帮助'));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Scenario: CLI执行命令', () => {
    it('When 执行未知命令 Then 显示帮助信息', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      skillCli.execute('unknown', []);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Skill CLI 命令帮助'));
      
      consoleSpy.mockRestore();
    });

    it('When 执行install命令不带参数 Then 提示错误', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      skillCli.execute('install', []);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('请提供Skill名称'));
      
      consoleSpy.mockRestore();
    });
  });
});
