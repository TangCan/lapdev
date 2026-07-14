import {
  SkillMarketEntry,
  SkillSearchResult,
  SkillDetailResult,
  SkillInstallResult,
} from '../types/skill.ts';

const HOME_DIR = Deno.env.get('HOME') || Deno.env.get('USERPROFILE') || '/tmp';
const KV_PATH = Deno.env.get('LAPDEV_KV_PATH') || `${HOME_DIR}/.lapdev/kv`;

const MOCK_SKILLS: SkillMarketEntry[] = [
  {
    name: 'code-review',
    version: '1.0.0',
    latestVersion: '1.2.0',
    description: '智能代码审查工具，帮助发现潜在的代码问题和改进建议',
    author: 'lapdev',
    tags: ['code', 'review', 'quality'],
    rating: 4.8,
    downloads: 1523,
    updatedAt: '2026-07-10',
    downloadUrl: 'https://github.com/lapdev/skills/raw/main/skills/code-review.skill.md',
  },
  {
    name: 'documentation',
    version: '1.0.0',
    latestVersion: '1.1.0',
    description: '自动生成代码文档，包括API文档和代码注释',
    author: 'lapdev',
    tags: ['docs', 'documentation', 'generator'],
    rating: 4.5,
    downloads: 892,
    updatedAt: '2026-07-08',
    downloadUrl: 'https://github.com/lapdev/skills/raw/main/skills/documentation.skill.md',
  },
  {
    name: 'test-generator',
    version: '0.9.0',
    latestVersion: '1.0.0',
    description: '根据代码自动生成单元测试和集成测试',
    author: 'lapdev',
    tags: ['testing', 'test', 'generator'],
    rating: 4.6,
    downloads: 1103,
    updatedAt: '2026-07-12',
    downloadUrl: 'https://github.com/lapdev/skills/raw/main/skills/test-generator.skill.md',
  },
  {
    name: 'refactor-assistant',
    version: '1.0.0',
    latestVersion: '1.0.0',
    description: '代码重构助手，提供重构建议和自动化重构',
    author: 'lapdev',
    tags: ['refactor', 'code', 'quality'],
    rating: 4.4,
    downloads: 654,
    updatedAt: '2026-07-05',
    downloadUrl: 'https://github.com/lapdev/skills/raw/main/skills/refactor-assistant.skill.md',
  },
  {
    name: 'bug-finder',
    version: '1.1.0',
    latestVersion: '1.1.0',
    description: '智能Bug检测工具，帮助定位代码中的潜在缺陷',
    author: 'lapdev',
    tags: ['bug', 'debug', 'quality'],
    rating: 4.7,
    downloads: 987,
    updatedAt: '2026-07-09',
    downloadUrl: 'https://github.com/lapdev/skills/raw/main/skills/bug-finder.skill.md',
  },
  {
    name: 'performance-analyzer',
    version: '1.0.0',
    latestVersion: '1.0.0',
    description: '性能分析工具，识别性能瓶颈和优化机会',
    author: 'lapdev',
    tags: ['performance', 'optimization', 'analysis'],
    rating: 4.3,
    downloads: 432,
    updatedAt: '2026-07-03',
    downloadUrl: 'https://github.com/lapdev/skills/raw/main/skills/performance-analyzer.skill.md',
  },
];

const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 20;

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

function normalizePath(filePath: string): string {
  let normalized = filePath.replace(/\\/g, '/');
  while (normalized.startsWith('../')) {
    normalized = normalized.replace(/^\.\.\//, '');
  }
  while (normalized.includes('/../')) {
    normalized = normalized.replace(/[^/]+\/\.\.\//g, '');
  }
  return normalized;
}

function isValidFilePath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  if (normalized.startsWith('..')) return false;
  if (normalized.includes('/../')) return false;
  if (normalized.includes('./../')) return false;
  return true;
}

function validateSkillContent(content: string): boolean {
  return content.startsWith('---') && content.includes('name:') && content.includes('version:');
}

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map((p) => parseInt(p, 10) || 0);
  const parts2 = v2.split('.').map((p) => parseInt(p, 10) || 0);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

export class SkillMarketService {
  private kv?: Deno.Kv;
  private rateLimitStore: Map<string, RateLimitEntry> = new Map();

  private async getKv(): Promise<Deno.Kv | null> {
    if (!this.kv) {
      try {
        this.kv = await Deno.openKv(KV_PATH);
      } catch {
        return null;
      }
    }
    return this.kv;
  }

  private async isLoggedIn(): Promise<boolean> {
    const kv = await this.getKv();
    if (!kv) return false;
    const result = await kv.get<string>(['auth', 'api-key']);
    return result.value !== null && result.value !== undefined;
  }

  private existsSync(path: string): boolean {
    try {
      Deno.statSync(path);
      return true;
    } catch {
      return false;
    }
  }

  private checkRateLimit(key: string): boolean {
    const now = Date.now();
    const entry = this.rateLimitStore.get(key);

    if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
      this.rateLimitStore.set(key, { count: 1, windowStart: now });
      return true;
    }

    if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
      return false;
    }

    entry.count++;
    return true;
  }

  search(
    query: string,
    options: { tags?: string[]; limit?: number; page?: number } = {},
  ): SkillSearchResult {
    if (!this.checkRateLimit('search')) {
      return {
        skills: [],
        total: 0,
        page: options.page || 1,
        pageSize: options.limit || 10,
      };
    }

    let filtered = [...MOCK_SKILLS];

    if (query && query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        (skill) =>
          skill.name.toLowerCase().includes(lowerQuery) ||
          skill.description.toLowerCase().includes(lowerQuery) ||
          skill.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
      );
    }

    if (options.tags && options.tags.length > 0) {
      filtered = filtered.filter((skill) =>
        options.tags!.some((tag) => skill.tags.includes(tag))
      );
    }

    const pageSize = options.limit || 10;
    const page = options.page || 1;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return {
      skills: filtered.slice(startIndex, endIndex),
      total: filtered.length,
      page,
      pageSize,
    };
  }

  getSkill(name: string): SkillDetailResult {
    if (!this.checkRateLimit('getSkill')) {
      return {
        success: false,
        error: '请求过于频繁，请稍后再试',
      };
    }

    const skill = MOCK_SKILLS.find((s) => s.name === name);

    if (!skill) {
      return {
        success: false,
        error: `Skill "${name}" 不存在`,
      };
    }

    return {
      success: true,
      skill,
    };
  }

  async installSkill(name: string, installDir: string): Promise<SkillInstallResult> {
    if (!isValidFilePath(name)) {
      return {
        success: false,
        message: '安装失败',
        error: `无效的Skill名称，包含非法路径字符: ${name}`,
        suggestion: '请检查Skill名称',
      };
    }

    const skill = MOCK_SKILLS.find((s) => s.name === name);

    if (!skill) {
      return {
        success: false,
        message: '安装失败',
        error: `Skill "${name}" 不存在`,
        suggestion: '请检查Skill名称是否正确',
      };
    }

    try {
      if (!this.existsSync(installDir)) {
        Deno.mkdirSync(installDir, { recursive: true });
      }

      const skillPath = `${installDir}/${name}.skill.md`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(skill.downloadUrl, { signal: controller.signal });
        if (!response.ok) {
          return {
            success: false,
            message: '安装失败',
            error: `下载失败，服务器返回: HTTP ${response.status}`,
            suggestion: '请检查网络连接',
          };
        }
        const content = await response.text();

        if (!content || content.trim() === '') {
          return {
            success: false,
            message: '安装失败',
            error: '下载的Skill内容为空',
            suggestion: '请稍后重试',
          };
        }

        if (!validateSkillContent(content)) {
          return {
            success: false,
            message: '安装失败',
            error: '下载的Skill内容格式无效',
            suggestion: '请联系Skill开发者',
          };
        }

        await Deno.writeTextFile(skillPath, content);

        return {
          success: true,
          message: `Skill "${name}" 安装成功`,
        };
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return {
            success: false,
            message: '安装失败',
            error: '下载超时',
            suggestion: '请检查网络连接或稍后重试',
          };
        }
        return {
          success: false,
          message: '安装失败',
          error: error instanceof Error ? error.message : '未知错误',
          suggestion: '请检查网络连接或系统权限',
        };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      return {
        success: false,
        message: '安装失败',
        error: error instanceof Error ? error.message : '未知错误',
        suggestion: '请检查系统权限',
      };
    }
  }

  async updateSkill(name: string, installDir: string): Promise<SkillInstallResult> {
    if (!isValidFilePath(name)) {
      return {
        success: false,
        message: '更新失败',
        error: `无效的Skill名称，包含非法路径字符: ${name}`,
        suggestion: '请检查Skill名称',
      };
    }

    const skill = MOCK_SKILLS.find((s) => s.name === name);

    if (!skill) {
      return {
        success: false,
        message: '更新失败',
        error: `Skill "${name}" 不存在`,
        suggestion: '请检查Skill名称是否正确',
      };
    }

    const skillPath = `${installDir}/${name}.skill.md`;

    if (!this.existsSync(skillPath)) {
      return {
        success: false,
        message: '更新失败',
        error: `Skill "${name}" 未安装`,
        suggestion: '请先安装Skill',
      };
    }

    let currentVersion = '0.0.0';
    try {
      const content = await Deno.readTextFile(skillPath);
      const versionMatch = content.match(/version:\s*([^\s]+)/);
      if (versionMatch) {
        currentVersion = versionMatch[1];
      }
    } catch {
      // ignore
    }

    if (compareVersions(currentVersion, skill.latestVersion) >= 0) {
      return {
        success: true,
        message: `Skill "${name}" 已是最新版本 (v${skill.latestVersion})`,
      };
    }

    return this.installSkill(name, installDir);
  }

  getAllSkills(): SkillMarketEntry[] {
    return [...MOCK_SKILLS];
  }

  getInstalledSkills(installDir: string): SkillMarketEntry[] {
    if (!this.existsSync(installDir)) {
      return [];
    }

    const installed: SkillMarketEntry[] = [];

    try {
      for (const file of Deno.readDirSync(installDir)) {
        if (file.isFile && file.name.endsWith('.skill.md')) {
          const name = file.name.replace('.skill.md', '');
          if (!isValidFilePath(name)) continue;
          const marketSkill = MOCK_SKILLS.find((s) => s.name === name);
          if (marketSkill) {
            installed.push(marketSkill);
          }
        }
      }
    } catch {
      // ignore
    }

    return installed;
  }
}

export const skillMarketService = new SkillMarketService();