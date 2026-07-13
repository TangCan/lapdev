import * as yaml from 'js-yaml';

const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

const VALID_TAG_PATTERN = /^[a-zA-Z0-9_-]+$/;

export interface SkillValidationResult {
  isValid: boolean;
  errors: string[];
  suggestions: string[];
}

export class SkillValidator {
  validateFile(content: string): SkillValidationResult {
    const errors: string[] = [];
    const suggestions: string[] = [];

    const frontmatterResult = this.validateFrontmatter(content);
    if (!frontmatterResult.isValid) {
      errors.push(...frontmatterResult.errors);
      suggestions.push(...frontmatterResult.suggestions);
      return { isValid: false, errors, suggestions };
    }

    const yamlContent = frontmatterResult.yamlContent!;
    const metadataResult = this.validateMetadata(yamlContent);
    if (!metadataResult.isValid) {
      errors.push(...metadataResult.errors);
      suggestions.push(...metadataResult.suggestions);
    }

    return { isValid: errors.length === 0, errors, suggestions };
  }

  private validateFrontmatter(content: string): { isValid: boolean; errors: string[]; suggestions: string[]; yamlContent?: string } {
    const errors: string[] = [];
    const suggestions: string[] = [];

    const lines = content.split('\n');
    
    if (lines.length === 0 || lines[0].trim() !== '---') {
      errors.push('无效的Skill文件格式：缺少YAML frontmatter开始标记');
      suggestions.push('请在文件开头添加 "---" 作为YAML frontmatter的开始标记');
      return { isValid: false, errors, suggestions };
    }

    let endIndex = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        endIndex = i;
        break;
      }
    }

    if (endIndex === -1) {
      errors.push('无效的Skill文件格式：缺少YAML frontmatter结束标记');
      suggestions.push('请在YAML内容结束后添加 "---" 作为结束标记');
      return { isValid: false, errors, suggestions };
    }

    const yamlContent = lines.slice(1, endIndex).join('\n').trim();
    
    if (yamlContent.length === 0) {
      errors.push('无效的Skill文件格式：YAML frontmatter内容为空');
      suggestions.push('请在frontmatter中添加必要的元数据字段');
      return { isValid: false, errors, suggestions };
    }

    return { isValid: true, errors: [], suggestions: [], yamlContent };
  }

  private validateMetadata(yamlContent: string): SkillValidationResult {
    const errors: string[] = [];
    const suggestions: string[] = [];

    let metadata: Record<string, unknown>;
    try {
      const loadedMetadata = yaml.load(yamlContent);
      metadata = (loadedMetadata && typeof loadedMetadata === 'object' ? loadedMetadata : {}) as Record<string, unknown>;
    } catch (e) {
      errors.push(`无效的YAML格式：${e instanceof Error ? e.message : '解析失败'}`);
      suggestions.push('请检查YAML语法，确保缩进和格式正确');
      return { isValid: false, errors, suggestions };
    }

    if (!metadata.name || typeof metadata.name !== 'string' || metadata.name.trim() === '') {
      errors.push('缺少必填字段：name（Skill名称）');
      suggestions.push('请添加 name 字段，例如：name: "my-skill"');
    }

    if (!metadata.version || typeof metadata.version !== 'string' || metadata.version.trim() === '') {
      errors.push('缺少必填字段：version（版本号）');
      suggestions.push('请添加 version 字段，例如：version: "1.0.0"');
    } else if (!this.validateVersion(metadata.version as string)) {
      errors.push(`无效的版本号格式：${metadata.version}`);
      suggestions.push('版本号必须符合语义化版本规范（semver），例如：1.0.0 或 1.0.0-beta.1');
    }

    if (!metadata.description || typeof metadata.description !== 'string' || metadata.description.trim() === '') {
      errors.push('缺少必填字段：description（描述）');
      suggestions.push('请添加 description 字段，描述Skill的功能');
    }

    if (!metadata.author || typeof metadata.author !== 'string' || metadata.author.trim() === '') {
      errors.push('缺少必填字段：author（作者）');
      suggestions.push('请添加 author 字段，例如：author: "Your Name"');
    }

    if (metadata.tags && !Array.isArray(metadata.tags)) {
      errors.push('tags 字段必须是数组格式');
      suggestions.push('请将 tags 改为数组格式，例如：tags: ["tag1", "tag2"]');
    } else if (Array.isArray(metadata.tags)) {
      for (const tag of metadata.tags) {
        if (typeof tag !== 'string') {
          errors.push('tags 数组中包含非字符串元素');
          suggestions.push('tags 数组中的每个元素必须是字符串');
          break;
        }
        if (!VALID_TAG_PATTERN.test(tag)) {
          errors.push(`无效的标签格式：${tag}`);
          suggestions.push('标签只能包含字母、数字、下划线和连字符');
        }
      }
    }

    if (metadata.trigger) {
      if (typeof metadata.trigger !== 'object') {
        errors.push('trigger 字段必须是对象格式');
        suggestions.push('请将 trigger 改为对象格式，例如：trigger: { keywords: ["hello"] }');
      } else {
        const trigger = metadata.trigger as Record<string, unknown>;
        if (trigger.keywords) {
          if (!Array.isArray(trigger.keywords)) {
            errors.push('trigger.keywords 必须是数组格式');
            suggestions.push('请将 keywords 改为数组格式，例如：keywords: ["hello"]');
          } else {
            for (const keyword of trigger.keywords as unknown[]) {
              if (typeof keyword !== 'string') {
                errors.push('trigger.keywords 数组中包含非字符串元素');
                suggestions.push('keywords 数组中的每个元素必须是字符串');
                break;
              }
            }
          }
        }
        if (trigger.patterns) {
          if (!Array.isArray(trigger.patterns)) {
            errors.push('trigger.patterns 必须是数组格式');
            suggestions.push('请将 patterns 改为数组格式，例如：patterns: ["^test"]');
          } else {
            for (const pattern of trigger.patterns as unknown[]) {
              if (typeof pattern !== 'string') {
                errors.push('trigger.patterns 数组中包含非字符串元素');
                suggestions.push('patterns 数组中的每个元素必须是字符串');
                break;
              }
              try {
                new RegExp(pattern as string);
              } catch {
                errors.push(`无效的正则表达式模式：${pattern}`);
                suggestions.push('请检查正则表达式语法是否正确');
              }
            }
          }
        }
      }
    }

    return { isValid: errors.length === 0, errors, suggestions };
  }

  validateVersion(version: string): boolean {
    return SEMVER_PATTERN.test(version);
  }

  async validateSkillFile(filePath: string): Promise<SkillValidationResult> {
    let content: string;
    try {
      content = await Deno.readTextFile(filePath);
    } catch {
      return {
        isValid: false,
        errors: [`文件不存在或无法读取：${filePath}`],
        suggestions: ['请检查文件路径是否正确'],
      };
    }

    return this.validateFile(content);
  }
}

export const skillValidator = new SkillValidator();
