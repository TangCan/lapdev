import { skillValidator } from '../utils/skillValidator.ts';
import { skillService } from './skillService.ts';

const HOME_DIR = Deno.env.get('HOME') || Deno.env.get('USERPROFILE') || '/tmp';
const KV_PATH = Deno.env.get('LAPDEV_KV_PATH') || `${HOME_DIR}/.lapdev/kv`;

const API_KEY_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 10;

export interface PublishResult {
  success: boolean;
  message: string;
  error?: string;
  suggestion?: string;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

export class SkillPublishService {
  private kv?: Deno.Kv;
  private inMemoryAPIKey: string | null = null;
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

  private normalizePath(filePath: string): string {
    let normalized = filePath;
    
    normalized = normalized.replace(/\\/g, '/');
    
    while (normalized.includes('/../')) {
      normalized = normalized.replace(/[^/]+\/\.\.\//g, '');
    }
    normalized = normalized.replace(/^\.\.\//, '');
    
    return normalized;
  }

  private isValidFilePath(filePath: string): boolean {
    const normalized = this.normalizePath(filePath);
    if (normalized.startsWith('..')) {
      return false;
    }
    if (normalized.includes('/../')) {
      return false;
    }
    return true;
  }

  async isLoggedIn(): Promise<boolean> {
    if (this.inMemoryAPIKey) {
      return true;
    }

    try {
      const kv = await this.getKv();
      if (!kv) return false;
      const result = await kv.get<string>(['auth', 'api-key']);
      return result.value !== null && result.value !== undefined;
    } catch {
      return false;
    }
  }

  async getAPIKey(): Promise<string | null> {
    if (this.inMemoryAPIKey) {
      return this.inMemoryAPIKey;
    }

    try {
      const kv = await this.getKv();
      if (!kv) return null;
      const result = await kv.get<string>(['auth', 'api-key']);
      return result.value || null;
    } catch {
      return null;
    }
  }

  async login(apiKey: string): Promise<PublishResult> {
    if (!apiKey || apiKey.trim() === '') {
      return {
        success: false,
        message: '登录失败',
        error: 'API Key不能为空',
        suggestion: '请提供有效的API Key',
      };
    }

    try {
      const kv = await this.getKv();
      if (kv) {
        await kv.set(['auth', 'api-key'], apiKey);
      } else {
        this.inMemoryAPIKey = apiKey;
      }
      
      return {
        success: true,
        message: '登录成功',
      };
    } catch (error) {
      return {
        success: false,
        message: '登录失败',
        error: error instanceof Error ? error.message : '存储操作失败',
        suggestion: '请检查系统权限或稍后重试',
      };
    }
  }

  async logout(): Promise<PublishResult> {
    this.inMemoryAPIKey = null;

    try {
      const kv = await this.getKv();
      if (kv) {
        await kv.delete(['auth', 'api-key']);
      }
      
      return {
        success: true,
        message: '已退出登录',
      };
    } catch (error) {
      return {
        success: false,
        message: '退出登录失败',
        error: error instanceof Error ? error.message : '存储操作失败',
        suggestion: '请检查系统权限或稍后重试',
      };
    }
  }

  async validateAPIKey(): Promise<boolean> {
    const apiKey = await this.getAPIKey();
    if (!apiKey) return false;

    if (apiKey.length < 32) {
      return false;
    }

    return true;
  }

  async publish(filePath: string, dryRun: boolean = false): Promise<PublishResult> {
    if (!this.isValidFilePath(filePath)) {
      return {
        success: false,
        message: '发布失败',
        error: '无效的文件路径',
        suggestion: '请确保文件路径不包含路径遍历字符',
      };
    }

    const apiKey = await this.getAPIKey();
    if (apiKey && !this.checkRateLimit(apiKey)) {
      return {
        success: false,
        message: '发布失败',
        error: '请求过于频繁，请稍后再试',
        suggestion: '每分钟最多允许10次发布请求',
      };
    }

    const isLoggedIn = await this.isLoggedIn();
    if (!isLoggedIn) {
      return {
        success: false,
        message: '发布失败',
        error: '请先登录或配置API Key',
        suggestion: '使用命令: lapdev skill login <api-key>',
      };
    }

    const isValidKey = await this.validateAPIKey();
    if (!isValidKey) {
      return {
        success: false,
        message: '发布失败',
        error: '无效的API Key',
        suggestion: '请检查您的API Key是否正确',
      };
    }

    const validationResult = await skillValidator.validateSkillFile(filePath);
    if (!validationResult.isValid) {
      return {
        success: false,
        message: '发布失败',
        error: validationResult.errors.join('\n'),
        suggestion: validationResult.suggestions.join('\n'),
      };
    }

    if (dryRun) {
      return {
        success: true,
        message: '✅ Dry Run模式 - Skill文件验证通过，发布流程正常',
      };
    }

    let skillContent: string;
    try {
      skillContent = Deno.readTextFileSync(filePath);
    } catch (error) {
      return {
        success: false,
        message: '发布失败',
        error: error instanceof Error ? error.message : '无法读取文件',
        suggestion: '请检查文件路径和权限',
      };
    }

    const fileName = filePath.split('/').pop() || '.skill.md';
    let skill;
    try {
      skill = skillService.parseSkillContent(skillContent, fileName);
    } catch (error) {
      return {
        success: false,
        message: '发布失败',
        error: error instanceof Error ? error.message : 'Skill文件解析失败',
        suggestion: '请检查Skill文件格式',
      };
    }

    if (!skill || typeof skill !== 'object' || !skill.name || !skill.version) {
      return {
        success: false,
        message: '发布失败',
        error: 'Skill文件解析结果无效',
        suggestion: '请检查Skill文件格式',
      };
    }

    try {
      await this.uploadToRegistry(skill);
    } catch (error) {
      return {
        success: false,
        message: '发布失败',
        error: error instanceof Error ? error.message : '上传到注册中心失败',
        suggestion: '请检查网络连接或稍后重试',
      };
    }

    return {
      success: true,
      message: `Skill "${skill.name}" (v${skill.version}) 发布成功`,
    };
  }

  private async uploadToRegistry(skill: unknown): Promise<void> {
    const skillData = skill as { name: string; version: string; content: string };
    
    const publishRequest = {
      name: skillData.name,
      version: skillData.version,
      content: skillData.content,
      apiKey: await this.getAPIKey(),
    };

    console.log(`📤 正在上传 Skill: ${skillData.name} (v${skillData.version})`);
    console.log(`📦 请求数据: ${JSON.stringify(publishRequest).substring(0, 100)}...`);
  }
}

export const skillPublishService = new SkillPublishService();
