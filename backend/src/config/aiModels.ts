/**
 * AI Model Configuration
 * 
 * Supported models for BYOK (Bring Your Own Key)
 */

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  baseUrl: string;
  apiKeyEnv: string;
  defaultModel: string;
}

export const aiModels: AIModel[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    provider: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKeyEnv: 'OPENAI_API_KEY',
    defaultModel: 'gpt-4o'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    provider: 'deepseek',
    baseUrl: 'https://api.deepseek.com/v1',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    defaultModel: 'deepseek-chat'
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    provider: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    defaultModel: 'claude-3-sonnet'
  },
  {
    id: 'custom',
    name: 'Custom',
    provider: 'custom',
    baseUrl: '',
    apiKeyEnv: 'CUSTOM_API_KEY',
    defaultModel: ''
  }
];

export function getModelById(id: string): AIModel | undefined {
  return aiModels.find(model => model.id === id);
}

export function getDefaultModel(): AIModel {
  return aiModels[0];
}