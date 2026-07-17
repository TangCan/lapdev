import React, { useState, useEffect } from 'react';
import { useAI } from '../../context/AIContext';
import { useInlineCompletion } from '../../context/InlineCompletionContext';
import { maskApiKey } from '../../services/aiService';

interface AIModelForm {
  name: string;
  provider: 'openai' | 'deepseek' | 'custom';
  apiKey: string;
  baseUrl: string;
  model: string;
}

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'custom', label: 'Custom' },
] as const;

const MODEL_BY_PROVIDER: Record<string, { name: string; value: string }[]> = {
  openai: [
    { name: 'GPT-4o', value: 'gpt-4o' },
    { name: 'GPT-4', value: 'gpt-4' },
    { name: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
  ],
  deepseek: [
    { name: 'DeepSeek Chat', value: 'deepseek-chat' },
    { name: 'DeepSeek R1', value: 'deepseek-r1' },
  ],
  custom: [
    { name: 'Custom Model', value: 'custom' },
  ],
};

const BASE_URL_BY_PROVIDER: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  deepseek: 'https://api.deepseek.com/v1',
  custom: '',
};

export const AIConfigPanel: React.FC = () => {
  const {
    models,
    currentModel,
    isTesting,
    testResult,
    addModel,
    updateModel,
    removeModel,
    setActiveModel,
    testConnection,
    clearTestResult,
  } = useAI();

  const { inlineCompletionEnabled, setInlineCompletionEnabled } = useInlineCompletion();

  const [form, setForm] = useState<AIModelForm>({
    name: '',
    provider: 'openai',
    apiKey: '',
    baseUrl: BASE_URL_BY_PROVIDER.openai,
    model: 'gpt-4o',
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 当provider改变时，更新默认的baseUrl和model
  useEffect(() => {
    if (!editingId) {
      setForm(prev => ({
        ...prev,
        baseUrl: BASE_URL_BY_PROVIDER[prev.provider],
        model: MODEL_BY_PROVIDER[prev.provider][0]?.value || '',
      }));
    }
  }, [form.provider, editingId]);

  // 开始编辑模型
  const handleEdit = (model: typeof models[0]) => {
    setEditingId(model.id);
    setForm({
      name: model.name,
      provider: model.provider,
      apiKey: '', // API Key不回显，需要重新输入
      baseUrl: model.baseUrl,
      model: model.model,
    });
    clearTestResult();
  };

  // 取消编辑
  const handleCancel = () => {
    setEditingId(null);
    setForm({
      name: '',
      provider: 'openai',
      apiKey: '',
      baseUrl: BASE_URL_BY_PROVIDER.openai,
      model: 'gpt-4o',
    });
    setErrors({});
    clearTestResult();
  };

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!form.name.trim()) {
      newErrors.name = '请输入模型名称';
    }
    
    if (!form.apiKey.trim()) {
      newErrors.apiKey = '请输入API Key';
    }
    
    if (!form.baseUrl.trim()) {
      newErrors.baseUrl = '请输入Base URL';
    } else if (!/^https?:\/\/.+/i.test(form.baseUrl)) {
      newErrors.baseUrl = '请输入有效的URL';
    }
    
    if (!form.model.trim()) {
      newErrors.model = '请选择模型';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 保存模型
  const handleSave = async () => {
    if (!validateForm()) return;

    if (editingId) {
      // 更新现有模型
      updateModel(editingId, {
        name: form.name,
        provider: form.provider,
        apiKey: form.apiKey,
        baseUrl: form.baseUrl,
        model: form.model,
      });
    } else {
      // 添加新模型
      addModel({
        name: form.name,
        provider: form.provider,
        apiKey: form.apiKey,
        baseUrl: form.baseUrl,
        model: form.model,
      });
    }

    handleCancel();
  };

  // 删除模型
  const handleDelete = (modelId: string) => {
    if (confirm('确定要删除这个模型配置吗？')) {
      removeModel(modelId);
    }
  };

  // 测试连接
  const handleTestConnection = async () => {
    if (!validateForm()) return;
    
    await testConnection({
      apiKey: form.apiKey,
      baseUrl: form.baseUrl,
      model: form.model,
    });
  };

  // 获取当前provider的模型列表
  const currentModels = MODEL_BY_PROVIDER[form.provider] || [];

  return (
    <div className="space-y-6" data-testid="ai-config-section">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>AI模型配置</h2>
        {currentModel && (
          <span 
            className="px-3 py-1 rounded-full text-sm"
            style={{ backgroundColor: 'var(--color-success)', color: '#ffffff' }}
          >
            当前: {currentModel.name}
          </span>
        )}
      </div>

      <div 
        className="rounded-lg p-5"
        style={{ 
          backgroundColor: 'var(--color-surface)', 
          borderColor: 'var(--color-border)',
          borderWidth: '1px',
          borderStyle: 'solid'
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium" style={{ color: 'var(--color-text-primary)' }}>内联代码补全</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
              启用后，在编辑器中输入代码时将自动显示AI补全建议
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              data-testid="inline-completion-toggle"
              checked={inlineCompletionEnabled}
              onChange={(e) => setInlineCompletionEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div 
              className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:rounded-full after:h-5 after:w-5 after:transition-all"
              style={{
                backgroundColor: inlineCompletionEnabled ? 'var(--color-accent)' : 'var(--color-border)',
                boxShadow: 'var(--color-accent) 0 0 0 0',
                transition: 'all 0.2s',
              }}
            />
          </label>
        </div>
      </div>

      <div 
        className="rounded-lg p-6"
        style={{ 
          backgroundColor: 'var(--color-surface)', 
          borderColor: 'var(--color-border)',
          borderWidth: '1px',
          borderStyle: 'solid'
        }}
      >
        <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--color-text-primary)' }}>
          {editingId ? '编辑模型' : '添加新模型'}
        </h3>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              模型名称 <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              type="text"
              data-testid="ai-model-name"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 transition-all`}
              style={{
                borderColor: errors.name ? 'var(--color-danger)' : 'var(--color-border)',
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
              placeholder="输入模型名称，如：My OpenAI"
            />
            {errors.name && <p className="mt-1 text-sm" style={{ color: 'var(--color-danger)' }}>{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              模型提供商 <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <select
              data-testid="ai-provider-select"
              value={form.provider}
              onChange={(e) => setForm(prev => ({ ...prev, provider: e.target.value as AIModelForm['provider'] }))}
              className="w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 transition-all"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
            >
              {PROVIDERS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              API Key <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              type="password"
              data-testid="ai-api-key"
              value={form.apiKey}
              onChange={(e) => setForm(prev => ({ ...prev, apiKey: e.target.value }))}
              className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 transition-all`}
              style={{
                borderColor: errors.apiKey ? 'var(--color-danger)' : 'var(--color-border)',
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
              placeholder="sk-..."
            />
            {errors.apiKey && <p className="mt-1 text-sm" style={{ color: 'var(--color-danger)' }}>{errors.apiKey}</p>}
            <p className="mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              API Key仅存储在内存中，刷新页面后需要重新输入
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Base URL <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              type="text"
              data-testid="ai-base-url"
              value={form.baseUrl}
              onChange={(e) => setForm(prev => ({ ...prev, baseUrl: e.target.value }))}
              className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 transition-all`}
              style={{
                borderColor: errors.baseUrl ? 'var(--color-danger)' : 'var(--color-border)',
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
              placeholder="https://api.example.com/v1"
            />
            {errors.baseUrl && <p className="mt-1 text-sm" style={{ color: 'var(--color-danger)' }}>{errors.baseUrl}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              模型 <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <select
              data-testid="ai-model-select"
              value={form.model}
              onChange={(e) => setForm(prev => ({ ...prev, model: e.target.value }))}
              className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 transition-all`}
              style={{
                borderColor: errors.model ? 'var(--color-danger)' : 'var(--color-border)',
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
            >
              {currentModels.map(m => (
                <option key={m.value} value={m.value}>{m.name}</option>
              ))}
            </select>
            {errors.model && <p className="mt-1 text-sm" style={{ color: 'var(--color-danger)' }}>{errors.model}</p>}
          </div>

          {testResult && (
            <div 
              className="p-4 rounded-lg"
              style={{
                backgroundColor: testResult.status === 'success' 
                  ? 'rgba(63, 185, 80, 0.1)' 
                  : 'rgba(241, 76, 76, 0.1)',
                borderColor: testResult.status === 'success'
                  ? 'var(--color-success)'
                  : 'var(--color-danger)',
                borderWidth: '1px',
                borderStyle: 'solid'
              }}
            >
              <div className="flex items-center">
                <span 
                  className="w-5 h-5 rounded-full flex items-center justify-center mr-2 text-white text-xs"
                  style={{
                    backgroundColor: testResult.status === 'success' 
                      ? 'var(--color-success)' 
                      : 'var(--color-danger)'
                  }}
                >
                  {testResult.status === 'success' ? '✓' : '✗'}
                </span>
                <span style={{ color: testResult.status === 'success' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  {testResult.message}
                </span>
              </div>
              {testResult.latency && (
                <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>延迟: {testResult.latency}ms</p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              data-testid="ai-test-btn"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-5 py-2.5 rounded-lg font-medium transition-all"
              style={{
                backgroundColor: isTesting ? 'var(--color-text-muted)' : 'var(--color-accent)',
                color: '#ffffff',
                cursor: isTesting ? 'not-allowed' : 'pointer'
              }}
            >
              {isTesting ? (
                <span className="flex items-center">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  测试中...
                </span>
              ) : (
                '测试连接'
              )}
            </button>
            <button
              data-testid="ai-save-btn"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-lg font-medium transition-all"
              style={{
                backgroundColor: 'var(--color-success)',
                color: '#ffffff'
              }}
            >
              {editingId ? '保存修改' : '添加模型'}
            </button>
            {editingId && (
              <button
                onClick={handleCancel}
                className="px-5 py-2.5 rounded-lg font-medium transition-all"
                style={{
                  backgroundColor: 'var(--color-surface-hover)',
                  color: 'var(--color-text-primary)',
                  borderColor: 'var(--color-border)',
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}
              >
                取消
              </button>
            )}
          </div>
        </div>
      </div>

      {models.length > 0 && (
        <div 
          className="rounded-lg p-6"
          style={{ 
            backgroundColor: 'var(--color-surface)', 
            borderColor: 'var(--color-border)',
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
        >
          <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--color-text-primary)' }}>已配置的模型</h3>
          <div className="space-y-3">
            {models.map(model => (
              <div
                key={model.id}
                data-testid={`model-item-${model.id}`}
                className="flex items-center justify-between p-4 rounded-lg border transition-all"
                style={{
                  borderColor: model.isActive ? 'var(--color-success)' : 'var(--color-border)',
                  backgroundColor: model.isActive ? 'rgba(63, 185, 80, 0.08)' : 'var(--color-bg)'
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{model.name}</span>
                    {model.isActive && (
                      <span 
                        className="px-2 py-0.5 text-xs rounded-full text-white"
                        style={{ backgroundColor: 'var(--color-success)' }}
                      >
                        活跃
                      </span>
                    )}
                  </div>
                  <div className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {PROVIDERS.find(p => p.value === model.provider)?.label} - {model.model}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {model.apiKey ? maskApiKey(model.apiKey) : '未设置'}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!model.isActive && (
                    <button
                      data-testid={`activate-btn-${model.id}`}
                      onClick={() => setActiveModel(model.id)}
                      className="px-3 py-1.5 text-sm rounded-lg font-medium transition-all"
                      style={{
                        backgroundColor: 'var(--color-success)',
                        color: '#ffffff'
                      }}
                    >
                      激活
                    </button>
                  )}
                  <button
                    data-testid={`edit-btn-${model.id}`}
                    onClick={() => handleEdit(model)}
                    className="px-3 py-1.5 text-sm rounded-lg font-medium transition-all"
                    style={{
                      backgroundColor: 'var(--color-accent)',
                      color: '#ffffff'
                    }}
                  >
                    编辑
                  </button>
                  <button
                    data-testid={`delete-btn-${model.id}`}
                    onClick={() => handleDelete(model.id)}
                    className="px-3 py-1.5 text-sm rounded-lg font-medium transition-all"
                    style={{
                      backgroundColor: 'var(--color-danger)',
                      color: '#ffffff'
                    }}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {models.length === 0 && (
        <div 
          className="rounded-lg p-8 text-center"
          style={{ 
            backgroundColor: 'var(--color-surface)', 
            borderColor: 'var(--color-border)',
            borderWidth: '1px',
            borderStyle: 'dashed'
          }}
        >
          <div className="text-4xl mb-3">🤖</div>
          <div className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>暂无模型配置</div>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            请在上方添加您的AI模型配置，支持 OpenAI、DeepSeek 和自定义 API
          </p>
        </div>
      )}
    </div>
  );
};