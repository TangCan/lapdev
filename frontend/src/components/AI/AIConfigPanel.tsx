import React, { useState, useEffect } from 'react';
import { useAI } from '../../context/AIContext';
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
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">AI模型配置</h2>
        {currentModel && (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            当前: {currentModel.name}
          </span>
        )}
      </div>

      {/* 配置表单 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-700 mb-4">
          {editingId ? '编辑模型' : '添加新模型'}
        </h3>

        <div className="space-y-4">
          {/* 模型名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              模型名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              data-testid="ai-model-name"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
              }`}
              placeholder="输入模型名称，如：My OpenAI"
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* 提供商选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              模型提供商 <span className="text-red-500">*</span>
            </label>
            <select
              data-testid="ai-provider-select"
              value={form.provider}
              onChange={(e) => setForm(prev => ({ ...prev, provider: e.target.value as AIModelForm['provider'] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {PROVIDERS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              data-testid="ai-api-key"
              value={form.apiKey}
              onChange={(e) => setForm(prev => ({ ...prev, apiKey: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.apiKey ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
              }`}
              placeholder="sk-..."
            />
            {errors.apiKey && <p className="mt-1 text-sm text-red-500">{errors.apiKey}</p>}
            <p className="mt-1 text-xs text-gray-500">
              API Key仅存储在内存中，刷新页面后需要重新输入
            </p>
          </div>

          {/* Base URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base URL <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              data-testid="ai-base-url"
              value={form.baseUrl}
              onChange={(e) => setForm(prev => ({ ...prev, baseUrl: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.baseUrl ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
              }`}
              placeholder="https://api.example.com/v1"
            />
            {errors.baseUrl && <p className="mt-1 text-sm text-red-500">{errors.baseUrl}</p>}
          </div>

          {/* 模型选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              模型 <span className="text-red-500">*</span>
            </label>
            <select
              data-testid="ai-model-select"
              value={form.model}
              onChange={(e) => setForm(prev => ({ ...prev, model: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.model ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
              }`}
            >
              {currentModels.map(m => (
                <option key={m.value} value={m.value}>{m.name}</option>
              ))}
            </select>
            {errors.model && <p className="mt-1 text-sm text-red-500">{errors.model}</p>}
          </div>

          {/* 测试连接结果 */}
          {testResult && (
            <div className={`p-3 rounded-md ${
              testResult.status === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 ${
                  testResult.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {testResult.status === 'success' ? '✓' : '✗'}
                </span>
                <span className={testResult.status === 'success' ? 'text-green-700' : 'text-red-700'}>
                  {testResult.message}
                </span>
              </div>
              {testResult.latency && (
                <p className="mt-1 text-sm text-gray-500">延迟: {testResult.latency}ms</p>
              )}
            </div>
          )}

          {/* 按钮组 */}
          <div className="flex gap-3 pt-4">
            <button
              data-testid="ai-test-btn"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              {editingId ? '保存修改' : '添加模型'}
            </button>
            {editingId && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 模型列表 */}
      {models.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">已配置的模型</h3>
          <div className="space-y-3">
            {models.map(model => (
              <div
                key={model.id}
                data-testid={`model-item-${model.id}`}
                className={`flex items-center justify-between p-3 rounded-md border ${
                  model.isActive ? 'border-green-500 bg-green-50' : 'border-gray-200'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{model.name}</span>
                    {model.isActive && (
                      <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">活跃</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {PROVIDERS.find(p => p.value === model.provider)?.label} - {model.model}
                  </div>
                  <div className="text-xs text-gray-400" data-testid={`api-key-display-${model.id}`}>
                    {model.apiKey ? maskApiKey(model.apiKey) : '未设置'}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!model.isActive && (
                    <button
                      data-testid={`activate-btn-${model.id}`}
                      onClick={() => setActiveModel(model.id)}
                      className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                    >
                      激活
                    </button>
                  )}
                  <button
                    data-testid={`edit-btn-${model.id}`}
                    onClick={() => handleEdit(model)}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    编辑
                  </button>
                  <button
                    data-testid={`delete-btn-${model.id}`}
                    onClick={() => handleDelete(model.id)}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 空状态 */}
      {models.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-gray-400 mb-2">暂无模型配置</div>
          <p className="text-sm text-gray-500">
            请在上方添加您的AI模型配置，支持 OpenAI、DeepSeek 和自定义 API
          </p>
        </div>
      )}
    </div>
  );
};