import { aiService, AIModelConfig, maskApiKey } from '../services/aiService.ts';

const VALID_PROVIDERS = ['openai', 'deepseek', 'custom'] as const;
type Provider = typeof VALID_PROVIDERS[number];

function isValidProvider(provider: string): provider is Provider {
  return VALID_PROVIDERS.includes(provider as Provider);
}

// 存储模型配置（仅内存存储）
const modelConfigs: Map<string, AIModelConfig> = new Map();
let currentModelId: string | null = null;

// 添加默认测试模型配置
const defaultModel: AIModelConfig = {
  id: 'mock-model-1',
  name: 'Mock AI',
  provider: 'openai',
  apiKey: 'sk-mock-key',
  baseUrl: 'https://mock.localhost/v1',
  model: 'mock-model',
  isActive: true,
};
modelConfigs.set(defaultModel.id, defaultModel);
currentModelId = defaultModel.id;

export async function handleAiConfigGet(req: Request): Promise<Response> {
  try {
    const models = Array.from(modelConfigs.values()).map(config => ({
      ...config,
      apiKey: maskApiKey(config.apiKey),
    }));
    const currentModel = currentModelId ? modelConfigs.get(currentModelId) || null : null;
    const maskedCurrentModel = currentModel ? {
      ...currentModel,
      apiKey: maskApiKey(currentModel.apiKey),
    } : null;

    return new Response(
      JSON.stringify({
        status: 'success',
        data: {
          models,
          currentModel: maskedCurrentModel,
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error instanceof Error ? error.message : '获取配置失败',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function handleAiConfigPost(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { name, provider, apiKey, baseUrl, model } = body;

    if (!name || !provider || !apiKey || !baseUrl || !model) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: '缺少必填字段: name, provider, apiKey, baseUrl, model',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidProvider(provider)) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: `无效的提供商: ${provider}。支持的提供商: ${VALID_PROVIDERS.join(', ')}`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const newConfig: AIModelConfig = {
      id: crypto.randomUUID(),
      name,
      provider: provider as Provider,
      apiKey,
      baseUrl,
      model,
      isActive: modelConfigs.size === 0,
    };

    modelConfigs.set(newConfig.id, newConfig);

    if (newConfig.isActive) {
      currentModelId = newConfig.id;
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        data: {
          ...newConfig,
          apiKey: maskApiKey(newConfig.apiKey),
        },
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error instanceof Error ? error.message : '保存配置失败',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function handleAiConfigPut(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { id, name, provider, apiKey, baseUrl, model } = body;

    if (!id) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: '缺少必填字段: id',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (provider && !isValidProvider(provider)) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: `无效的提供商: ${provider}。支持的提供商: ${VALID_PROVIDERS.join(', ')}`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const existingConfig = modelConfigs.get(id);
    if (!existingConfig) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: '模型配置不存在',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updatedConfig: AIModelConfig = {
      ...existingConfig,
      name: name ?? existingConfig.name,
      provider: (provider as Provider) ?? existingConfig.provider,
      apiKey: apiKey ?? existingConfig.apiKey,
      baseUrl: baseUrl ?? existingConfig.baseUrl,
      model: model ?? existingConfig.model,
    };

    modelConfigs.set(id, updatedConfig);

    return new Response(
      JSON.stringify({
        status: 'success',
        data: {
          ...updatedConfig,
          apiKey: maskApiKey(updatedConfig.apiKey),
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error instanceof Error ? error.message : '更新配置失败',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function handleAiConfigDelete(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: '缺少必填参数: id',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const existingConfig = modelConfigs.get(id);
    if (!existingConfig) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: '模型配置不存在',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    modelConfigs.delete(id);

    if (currentModelId === id) {
      const remainingModels = Array.from(modelConfigs.values());
      if (remainingModels.length > 0) {
        const firstModel = modelConfigs.values().next().value;
        if (firstModel) {
          currentModelId = firstModel.id;
          firstModel.isActive = true;
          modelConfigs.set(firstModel.id, firstModel);
        }
      } else {
        currentModelId = null;
      }
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        message: '删除成功',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error instanceof Error ? error.message : '删除配置失败',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function handleAiActiveModel(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: '缺少必填字段: id',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const config = modelConfigs.get(id);
    if (!config) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: '模型配置不存在',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    modelConfigs.forEach((cfg, key) => {
      cfg.isActive = key === id;
      modelConfigs.set(key, cfg);
    });

    currentModelId = id;

    return new Response(
      JSON.stringify({
        status: 'success',
        data: config,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error instanceof Error ? error.message : '设置活跃模型失败',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function handleAiTest(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { apiKey, baseUrl, model } = body;

    if (!apiKey || !baseUrl || !model) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: '缺少必填字段: apiKey, baseUrl, model',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await aiService.testConnection({ apiKey, baseUrl, model });

    return new Response(
      JSON.stringify(result),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error instanceof Error ? error.message : '测试连接失败',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function handleAiChat(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { modelId, messages } = body;

    if (!modelId || !messages) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: '缺少必填字段: modelId, messages',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const modelConfig = modelConfigs.get(modelId);
    if (!modelConfig) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: '模型配置不存在',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await aiService.sendChatRequest(modelConfig, messages);

    return new Response(
      JSON.stringify({
        status: 'success',
        data: result,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error instanceof Error ? error.message : '聊天请求失败',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function handleAiModels(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const provider = url.searchParams.get('provider');
    
    let models = aiService.getSupportedModels();
    
    if (provider) {
      models = models.filter(m => m.provider === provider);
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        data: models,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error instanceof Error ? error.message : '获取模型列表失败',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function handleAiChatStream(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { modelId, messages } = body;

    if (!modelId || !messages) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: '缺少必填字段: modelId, messages',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let modelConfig: AIModelConfig | undefined = modelConfigs.get(modelId);
    
    if (!modelConfig && modelId === 'current') {
      modelConfig = currentModelId ? modelConfigs.get(currentModelId) : undefined;
    }

    if (!modelConfig) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: '模型配置不存在',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of aiService.sendStreamChatRequest(modelConfig!, messages)) {
            const sseData = `data: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(encoder.encode(sseData));
          }
        } catch (error) {
          const errorEvent = {
            type: 'error',
            error: error instanceof Error ? error.message : 'Stream error',
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error instanceof Error ? error.message : '流式聊天请求失败',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function handleAiCompletion(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { modelId, prompt, prefix, suffix, fileContent, language, maxTokens } = body;

    // 验证必填字段
    if (!modelId) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: '缺少必填字段: modelId',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 验证字符串字段不为过长（防止滥用）
    const MAX_CONTENT_LENGTH = 100000; // 100KB
    const fieldsToValidate: { name: string; value: string | undefined; maxLength?: number }[] = [
      { name: 'prompt', value: prompt, maxLength: 1000 },
      { name: 'prefix', value: prefix, maxLength: MAX_CONTENT_LENGTH },
      { name: 'suffix', value: suffix, maxLength: MAX_CONTENT_LENGTH },
      { name: 'fileContent', value: fileContent, maxLength: MAX_CONTENT_LENGTH },
      { name: 'language', value: language, maxLength: 50 },
    ];

    for (const field of fieldsToValidate) {
      if (field.value !== undefined && field.value !== null) {
        if (typeof field.value !== 'string') {
          return new Response(
            JSON.stringify({
              status: 'error',
              message: `字段 ${field.name} 必须是字符串类型`,
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (field.maxLength && field.value.length > field.maxLength) {
          return new Response(
            JSON.stringify({
              status: 'error',
              message: `字段 ${field.name} 长度超过限制 (最大 ${field.maxLength} 字符)`,
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // 验证 maxTokens 范围
    if (maxTokens !== undefined && maxTokens !== null) {
      if (typeof maxTokens !== 'number' || !Number.isInteger(maxTokens)) {
        return new Response(
          JSON.stringify({
            status: 'error',
            message: 'maxTokens 必须是整数',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (maxTokens < 1 || maxTokens > 1000) {
        return new Response(
          JSON.stringify({
            status: 'error',
            message: 'maxTokens 必须在 1 到 1000 之间',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    let modelConfig: AIModelConfig | undefined = modelConfigs.get(modelId);
    
    if (!modelConfig && modelId === 'current') {
      modelConfig = currentModelId ? modelConfigs.get(currentModelId) : undefined;
    }

    if (!modelConfig) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: '模型配置不存在',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await aiService.getInlineCompletion(modelConfig, {
      prompt: prompt || '',
      prefix: prefix || '',
      suffix: suffix || '',
      fileContent: fileContent || '',
      language: language || 'typescript',
      maxTokens: maxTokens || 50,
    });

    return new Response(
      JSON.stringify({
        status: 'success',
        data: result,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error instanceof Error ? error.message : '内联补全请求失败',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}