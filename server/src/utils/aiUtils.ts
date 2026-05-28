// AI工具函数

// API Key脱敏
export function maskApiKey(apiKey: string | null): string {
  if (!apiKey || apiKey.length === 0) return '';
  
  // 短密钥（长度<=8）：全部用星号替换
  if (apiKey.length <= 8) {
    return '*'.repeat(apiKey.length);
  }
  
  const prefix = apiKey.substring(0, Math.min(3, apiKey.length));
  const suffix = apiKey.substring(apiKey.length - Math.min(7, apiKey.length));
  
  return `${prefix}***...${suffix}`;
}

// 验证模型配置
export function validateModelConfig(config: Record<string, unknown>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config.name || typeof config.name !== 'string' || !config.name.trim()) {
    errors.push('请输入模型名称');
  }
  
  if (!config.apiKey || typeof config.apiKey !== 'string' || !config.apiKey.trim()) {
    errors.push('请输入API Key');
  }
  
  if (!config.baseUrl || typeof config.baseUrl !== 'string' || !config.baseUrl.trim()) {
    errors.push('请输入Base URL');
  } else {
    try {
      new URL(config.baseUrl as string);
    } catch {
      errors.push('请输入有效的URL');
    }
  }
  
  if (!config.model || typeof config.model !== 'string' || !config.model.trim()) {
    errors.push('请选择模型');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// 生成模型ID
export function generateModelId(): string {
  return crypto.randomUUID();
}

// 检查是否为OpenAI兼容API
export function isOpenAICompatible(baseUrl: string): boolean {
  try {
    const url = new URL(baseUrl);
    return url.pathname.includes('/v1') || 
           url.hostname.includes('openai') || 
           url.hostname.includes('deepseek');
  } catch {
    return false;
  }
}