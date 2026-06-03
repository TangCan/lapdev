import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { SkillService } from '../../src/services/skillService';
import type { Skill, SkillTrigger } from '../../src/types/skill';

// 使用vi.hoisted确保mock函数在vi.mock提升之前就被定义
const { mockExistsSync, mockReadDirSync, mockReadFileSync, mockStatSync } = vi.hoisted(() => ({
  mockExistsSync: vi.fn(),
  mockReadDirSync: vi.fn(),
  mockReadFileSync: vi.fn(),
  mockStatSync: vi.fn(),
}));

vi.mock('fs', () => ({
  default: {
    existsSync: mockExistsSync,
    readdirSync: mockReadDirSync,
    readFileSync: mockReadFileSync,
    statSync: mockStatSync,
  },
  existsSync: mockExistsSync,
  readdirSync: mockReadDirSync,
  readFileSync: mockReadFileSync,
  statSync: mockStatSync,
}));

describe('SkillService - ATDD Acceptance Tests', () => {
  let skillService: SkillService;

  beforeEach(() => {
    skillService = new SkillService();
    vi.clearAllMocks();
  });

  describe('Scenario 1: Skill文件解析', () => {
    it('Given 有效的.skill.md文件 When 解析 Then 正确提取YAML元数据', () => {
      const mockSkillContent = `---
name: "test-skill"
version: "1.0.0"
description: "测试Skill"
author: "Test Author"
tags: ["test", "demo"]
trigger:
  keywords: ["hello", "world"]
  patterns: ["^test.*"]
---

## 指令说明

这是测试Skill的指令说明。`;

      const result = skillService.parseSkillContent(mockSkillContent, 'test-skill.skill.md');

      expect(result.name).toBe('test-skill');
      expect(result.version).toBe('1.0.0');
      expect(result.description).toBe('测试Skill');
      expect(result.author).toBe('Test Author');
      expect(result.tags).toEqual(['test', 'demo']);
      expect(result.trigger).toEqual({
        keywords: ['hello', 'world'],
        patterns: ['^test.*'],
      });
      expect(result.content).toContain('## 指令说明');
      expect(result.content).toContain('这是测试Skill的指令说明。');
      expect(result.fileName).toBe('test-skill.skill.md');
    });

    it('Given 缺少YAML元数据的文件 When 解析 Then 返回错误', () => {
      const invalidContent = '这是没有YAML头的内容';

      expect(() => skillService.parseSkillContent(invalidContent, 'invalid.skill.md')).toThrow('无效的Skill文件格式');
    });

    it('Given 只有一个分隔符的文件 When 解析 Then 返回错误', () => {
      const invalidContent = `---
name: "test"
content`;

      expect(() => skillService.parseSkillContent(invalidContent, 'invalid.skill.md')).toThrow('无效的Skill文件格式');
    });

    it('Given YAML元数据为空 When 解析 Then 使用默认值', () => {
      const minimalContent = `---
---

内容`;

      const result = skillService.parseSkillContent(minimalContent, 'minimal.skill.md');

      expect(result.name).toBe('minimal');
      expect(result.version).toBe('1.0.0');
      expect(result.description).toBe('');
      expect(result.author).toBe('');
      expect(result.tags).toEqual([]);
      expect(result.trigger).toEqual({});
    });

    it('Given YAML解析失败 When 解析 Then 抛出错误', () => {
      const invalidYaml = `---
name: [invalid: yaml
---
content`;

      expect(() => skillService.parseSkillContent(invalidYaml, 'invalid.skill.md')).toThrow();
    });

    it('Given 复杂嵌套YAML结构 When 解析 Then 正确处理', () => {
      const complexContent = `---
name: "complex-skill"
version: "2.0.0"
description: "Complex skill"
author: "Developer"
tags: ["nested", "complex"]
trigger:
  keywords: ["deep", "nested"]
  patterns: ["^complex.*"]
---

复杂内容`;

      const result = skillService.parseSkillContent(complexContent, 'complex.skill.md');

      expect(result.name).toBe('complex-skill');
      expect(result.version).toBe('2.0.0');
      expect(result.tags).toEqual(['nested', 'complex']);
    });
  });

  describe('Scenario 2: Skill文件加载', () => {
    it('Given 全局目录存在Skill文件 When 加载 Then 正确加载全局Skill', () => {
      const mockGlobalSkill = `---
name: "global-skill"
version: "1.0.0"
description: "全局Skill"
author: "Global"
tags: []
trigger: {}
---

全局Skill内容`;

      mockExistsSync.mockImplementation((path: string) => {
        // 只让全局目录存在，项目级目录不存在
        return path.includes('.lapdev/skills') && !path.includes(process.cwd());
      });
      mockReadDirSync.mockReturnValue(['global-skill.skill.md']);
      mockReadFileSync.mockReturnValue(mockGlobalSkill);
      mockStatSync.mockReturnValue({ isFile: () => true });

      const result = skillService.loadSkills();

      expect(result.skills.length).toBe(1);
      expect(result.skills[0].name).toBe('global-skill');
      expect(result.globalCount).toBe(1);
      expect(result.projectCount).toBe(0);
    });

    it('Given 项目级目录存在Skill文件 When 加载 Then 正确加载项目级Skill', () => {
      const mockProjectSkill = `---
name: "project-skill"
version: "1.0.0"
description: "项目级Skill"
author: "Project"
tags: []
trigger: {}
---

项目级Skill内容`;

      mockExistsSync.mockImplementation((path: string) => {
        // 只让项目级目录存在，全局目录不存在
        return path.includes('.lapdev/skills') && path.includes(process.cwd());
      });
      mockReadDirSync.mockReturnValue(['project-skill.skill.md']);
      mockReadFileSync.mockReturnValue(mockProjectSkill);
      mockStatSync.mockReturnValue({ isFile: () => true });

      const result = skillService.loadSkills();

      expect(result.skills.length).toBe(1);
      expect(result.skills[0].name).toBe('project-skill');
      expect(result.globalCount).toBe(0);
      expect(result.projectCount).toBe(1);
    });

    it('Given 全局和项目级存在同名Skill When 加载 Then 项目级覆盖全局', () => {
      const globalSkill = `---
name: "common-skill"
version: "1.0.0"
description: "全局版本"
author: "Global"
tags: []
trigger: {}
---

全局内容`;

      const projectSkill = `---
name: "common-skill"
version: "2.0.0"
description: "项目版本"
author: "Project"
tags: []
trigger: {}
---

项目内容`;

      mockExistsSync.mockReturnValue(true);
      mockReadDirSync.mockReturnValue(['common-skill.skill.md']);
      mockStatSync.mockReturnValue({ isFile: () => true });
      mockReadFileSync.mockImplementation((path: string) => {
        if (path.includes('.lapdev/skills')) {
          return projectSkill;
        }
        return globalSkill;
      });

      const result = skillService.loadSkills();

      const skill = result.skills.find(s => s.name === 'common-skill');
      expect(skill).toBeDefined();
      expect(skill!.version).toBe('2.0.0');
      expect(skill!.description).toBe('项目版本');
    });

    it('Given 目录不存在 When 加载 Then 返回空数组', () => {
      mockExistsSync.mockReturnValue(false);

      const result = skillService.loadSkills();

      expect(result.skills.length).toBe(0);
      expect(result.globalCount).toBe(0);
      expect(result.projectCount).toBe(0);
    });

    it('Given 目录包含非skill文件 When 加载 Then 只加载skill文件', () => {
      const mockSkill = `---
name: "test-skill"
version: "1.0.0"
description: "Test"
author: "Test"
tags: []
trigger: {}
---

内容`;

      mockExistsSync.mockReturnValue(true);
      mockReadDirSync.mockReturnValue([
        'test-skill.skill.md',
        'readme.txt',
        'config.json',
        'another-skill.skill.md',
      ]);
      mockStatSync.mockReturnValue({ isFile: () => true });
      mockReadFileSync.mockReturnValue(mockSkill);

      const result = skillService.loadSkills();

      expect(result.skills.length).toBe(2);
    });

    it('Given 目录包含子目录 When 加载 Then 跳过子目录', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadDirSync.mockReturnValue(['subdir', 'test-skill.skill.md']);
      mockStatSync.mockImplementation((path: string) => ({
        isFile: () => path.includes('.skill.md'),
      }));
      mockReadFileSync.mockReturnValue(`---
name: "test-skill"
version: "1.0.0"
description: "Test"
author: "Test"
tags: []
trigger: {}
---

内容`);

      const result = skillService.loadSkills();

      expect(result.skills.length).toBe(1);
    });

    it('Given Skill文件解析失败 When 加载 Then 记录警告并继续', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockExistsSync.mockReturnValue(true);
      mockReadDirSync.mockReturnValue(['valid.skill.md', 'invalid.skill.md']);
      mockStatSync.mockReturnValue({ isFile: () => true });
      mockReadFileSync.mockImplementation((path: string) => {
        if (path.includes('invalid')) {
          return 'invalid content without yaml';
        }
        return `---
name: "valid"
version: "1.0.0"
description: "Valid"
author: "Test"
tags: []
trigger: {}
---

内容`;
      });

      const result = skillService.loadSkills();

      expect(result.skills.length).toBe(1);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Scenario 3: Skill触发匹配', () => {
    const testSkill: Skill = {
      name: 'test-skill',
      version: '1.0.0',
      description: '测试Skill',
      author: 'Test',
      tags: [],
      trigger: {
        keywords: ['hello', 'world'],
        patterns: ['^test.*'],
      },
      content: '测试内容',
      fileName: 'test.skill.md',
    };

    it('Given 用户输入包含关键词 When 匹配 Then 返回匹配的Skill', () => {
      const result = skillService.matchSkills('hello world', [testSkill]);

      expect(result.length).toBe(1);
      expect(result[0].name).toBe('test-skill');
    });

    it('Given 用户输入匹配正则模式 When 匹配 Then 返回匹配的Skill', () => {
      const result = skillService.matchSkills('test something', [testSkill]);

      expect(result.length).toBe(1);
      expect(result[0].name).toBe('test-skill');
    });

    it('Given 用户输入不匹配任何触发条件 When 匹配 Then 返回空数组', () => {
      const result = skillService.matchSkills('no match', [testSkill]);

      expect(result.length).toBe(0);
    });

    it('Given 多个Skill匹配 When 匹配 Then 按匹配分数排序', () => {
      const skillA: Skill = {
        name: 'skill-a',
        version: '1.0.0',
        description: 'Skill A',
        author: 'Test',
        tags: [],
        trigger: {
          keywords: ['hello'],
          patterns: ['^test.*'],
        },
        content: 'Content',
        fileName: 'a.skill.md',
      };

      const skillB: Skill = {
        name: 'skill-b',
        version: '1.0.0',
        description: 'Skill B',
        author: 'Test',
        tags: [],
        trigger: {
          keywords: ['hello', 'world'],
          patterns: ['^test.*', '.*world.*'],
        },
        content: 'Content',
        fileName: 'b.skill.md',
      };

      const result = skillService.matchSkills('hello world test', [skillA, skillB]);

      expect(result.length).toBe(2);
      expect(result[0].name).toBe('skill-b');
      expect(result[1].name).toBe('skill-a');
    });

    it('Given 空触发条件 When 匹配 Then 返回空数组', () => {
      const skillWithNoTrigger: Skill = {
        name: 'no-trigger',
        version: '1.0.0',
        description: 'No trigger',
        author: 'Test',
        tags: [],
        trigger: {},
        content: 'Content',
        fileName: 'no-trigger.skill.md',
      };

      const result = skillService.matchSkills('hello', [skillWithNoTrigger]);

      expect(result.length).toBe(0);
    });

    it('Given 无效正则表达式 When 匹配 Then 跳过并继续', () => {
      const skillWithInvalidPattern: Skill = {
        name: 'invalid-pattern',
        version: '1.0.0',
        description: 'Invalid pattern',
        author: 'Test',
        tags: [],
        trigger: {
          patterns: ['[invalid'],
        },
        content: 'Content',
        fileName: 'invalid.skill.md',
      };

      const result = skillService.matchSkills('test', [skillWithInvalidPattern]);

      expect(result.length).toBe(0);
    });

    it('Given 关键词匹配不分大小写 When 匹配 Then 返回匹配结果', () => {
      const result = skillService.matchSkills('HELLO WORLD', [testSkill]);

      expect(result.length).toBe(1);
    });
  });

  describe('Scenario 4: Skill注入到系统提示', () => {
    const testSkill: Skill = {
      name: 'test-skill',
      version: '1.0.0',
      description: '测试Skill',
      author: 'Test',
      tags: [],
      trigger: {
        keywords: ['test'],
      },
      content: '## 指令\n这是技能指令',
      fileName: 'test.skill.md',
    };

    it('Given 匹配的Skill When 构建系统提示 Then Skill内容被注入', () => {
      const systemPrompt = skillService.buildSystemPrompt([testSkill]);

      expect(systemPrompt).toContain('test-skill');
      expect(systemPrompt).toContain('这是技能指令');
    });

    it('Given 多个匹配的Skill When 构建系统提示 Then 所有Skill内容都被注入', () => {
      const anotherSkill: Skill = {
        name: 'another-skill',
        version: '1.0.0',
        description: '另一个测试Skill',
        author: 'Test',
        tags: [],
        trigger: {
          keywords: ['test'],
        },
        content: '## 另一个指令\n更多内容',
        fileName: 'another.skill.md',
      };

      const systemPrompt = skillService.buildSystemPrompt([testSkill, anotherSkill]);

      expect(systemPrompt).toContain('test-skill');
      expect(systemPrompt).toContain('another-skill');
    });

    it('Given 空Skill列表 When 构建系统提示 Then 返回空字符串', () => {
      const systemPrompt = skillService.buildSystemPrompt([]);

      expect(systemPrompt).toBe('');
    });

    it('Given Skill包含特殊字符 When 构建系统提示 Then 正确处理', () => {
      const skillWithSpecialChars: Skill = {
        name: 'special-skill',
        version: '1.0.0',
        description: 'Skill with special chars: <>&"',
        author: 'Test',
        tags: [],
        trigger: {},
        content: 'Content with special chars: *[]()',
        fileName: 'special.skill.md',
      };

      const systemPrompt = skillService.buildSystemPrompt([skillWithSpecialChars]);

      expect(systemPrompt).toContain('special-skill');
      expect(systemPrompt).toContain('Content with special chars');
    });
  });

  describe('安全测试', () => {
    it('Given 路径包含遍历字符 When 加载Skill Then 抛出错误', () => {
      const maliciousPath = '../../etc/passwd';

      expect(() => skillService.validateSkillPath(maliciousPath)).toThrow('路径遍历攻击');
    });

    it('Given 空路径 When 加载Skill Then 抛出错误', () => {
      expect(() => skillService.validateSkillPath('')).toThrow('文件路径不能为空');
    });

    it('Given 包含非法字符的路径 When 加载Skill Then 抛出错误', () => {
      const invalidPath = '/path/with/\0/character';

      expect(() => skillService.validateSkillPath(invalidPath)).toThrow('非法字符');
    });

    it('Given 包含换行符的路径 When 加载Skill Then 抛出错误', () => {
      const maliciousPath = '/path/to/file\nrm -rf /';

      expect(() => skillService.validateSkillPath(maliciousPath)).toThrow('非法字符');
    });

    it('Given 包含命令注入字符的路径 When 加载Skill Then 抛出错误', () => {
      const maliciousPath = '/path/; rm -rf /';

      expect(() => skillService.validateSkillPath(maliciousPath)).toThrow('非法字符');
    });

    it('Given Windows路径遍历 When 加载Skill Then 抛出错误', () => {
      const windowsPathTraversal = '..\\..\\windows\\system32';

      expect(() => skillService.validateSkillPath(windowsPathTraversal)).toThrow('路径遍历攻击');
    });

    it('Given 正常路径 When 加载Skill Then 不抛出错误', () => {
      const normalPaths = [
        '/home/user/.lapdev/skills',
        '.lapdev/skills',
        '~/skills/test.skill.md',
        'C:\\Users\\User\\.lapdev\\skills',
        '/home/user/skills/my-skill.skill.md',
      ];

      for (const path of normalPaths) {
        expect(() => skillService.validateSkillPath(path)).not.toThrow();
      }
    });
  });

  describe('辅助方法测试', () => {
    it('getSkillByName 正确返回指定Skill', () => {
      const mockSkill = `---
name: "find-me"
version: "1.0.0"
description: "Findable"
author: "Test"
tags: []
trigger: {}
---

内容`;

      mockExistsSync.mockReturnValue(true);
      mockReadDirSync.mockReturnValue(['find-me.skill.md']);
      mockStatSync.mockReturnValue({ isFile: () => true });
      mockReadFileSync.mockReturnValue(mockSkill);

      skillService.loadSkills();
      const result = skillService.getSkillByName('find-me');

      expect(result).toBeDefined();
      expect(result!.name).toBe('find-me');
    });

    it('getSkillByName 返回undefined当Skill不存在', () => {
      mockExistsSync.mockReturnValue(false);

      skillService.loadSkills();
      const result = skillService.getSkillByName('not-found');

      expect(result).toBeUndefined();
    });

    it('getSkills 返回所有已加载的Skill', () => {
      const mockSkill1 = `---
name: "skill1"
version: "1.0.0"
description: "Skill 1"
author: "Test"
tags: []
trigger: {}
---

内容1`;

      const mockSkill2 = `---
name: "skill2"
version: "2.0.0"
description: "Skill 2"
author: "Test"
tags: []
trigger: {}
---

内容2`;

      mockExistsSync.mockReturnValue(true);
      mockReadDirSync.mockReturnValue(['skill1.skill.md', 'skill2.skill.md']);
      mockStatSync.mockReturnValue({ isFile: () => true });
      mockReadFileSync.mockImplementation((path: string) => {
        if (path.includes('skill1')) return mockSkill1;
        return mockSkill2;
      });

      skillService.loadSkills();
      const result = skillService.getSkills();

      expect(result.length).toBe(2);
      expect(result.some(s => s.name === 'skill1')).toBe(true);
      expect(result.some(s => s.name === 'skill2')).toBe(true);
    });

    it('reload 重新加载Skill', () => {
      const mockSkill = `---
name: "reload-skill"
version: "1.0.0"
description: "Reload test"
author: "Test"
tags: []
trigger: {}
---

内容`;

      mockExistsSync.mockReturnValue(true);
      mockReadDirSync.mockReturnValue(['reload-skill.skill.md']);
      mockStatSync.mockReturnValue({ isFile: () => true });
      mockReadFileSync.mockReturnValue(mockSkill);

      const result = skillService.reload();

      expect(result.skills.length).toBe(1);
      expect(result.skills[0].name).toBe('reload-skill');
    });
  });
});
