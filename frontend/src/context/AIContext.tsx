import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { aiService, AIModelConfig, TestConnectionRequest, TestConnectionResponse } from '../services/aiService';

interface AIContextType {
  models: AIModelConfig[];
  currentModel: AIModelConfig | null;
  isConnected: boolean;
  isTesting: boolean;
  testResult: TestConnectionResponse | null;
  
  addModel: (config: Omit<AIModelConfig, 'id' | 'isActive'>) => void;
  updateModel: (modelId: string, updates: Partial<Omit<AIModelConfig, 'id' | 'isActive'>>) => void;
  removeModel: (modelId: string) => void;
  setActiveModel: (modelId: string) => void;
  testConnection: (config: TestConnectionRequest) => Promise<void>;
  clearTestResult: () => void;
}

const AIContext = createContext<AIContextType | null>(null);

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [models, setModels] = useState<AIModelConfig[]>([]);
  const [currentModel, setCurrentModel] = useState<AIModelConfig | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResponse | null>(null);

  // 初始化加载模型
  useEffect(() => {
    // 确保重新加载最新的存储数据（处理测试环境中存储在代码执行前设置的情况）
    aiService.reloadFromStorage();
    
    const loadedModels = aiService.getModels();
    const loadedCurrentModel = aiService.getCurrentModel();
    
    console.log('AIContext init: models loaded:', loadedModels.length);
    console.log('AIContext init: currentModel:', loadedCurrentModel?.name || null);
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setModels(loadedModels);
    setCurrentModel(loadedCurrentModel);
    setIsConnected(loadedCurrentModel !== null);
  }, []);

  // 添加模型
  const addModel = useCallback((config: Omit<AIModelConfig, 'id' | 'isActive'>) => {
    aiService.addModel(config);
    setModels(aiService.getModels());
    setCurrentModel(aiService.getCurrentModel());
    setIsConnected(true);
  }, []);

  // 更新模型
  const updateModel = useCallback((modelId: string, updates: Partial<Omit<AIModelConfig, 'id' | 'isActive'>>) => {
    aiService.updateModel(modelId, updates);
    setModels(aiService.getModels());
    setCurrentModel(aiService.getCurrentModel());
  }, []);

  // 删除模型
  const removeModel = useCallback((modelId: string) => {
    aiService.removeModel(modelId);
    setModels(aiService.getModels());
    setCurrentModel(aiService.getCurrentModel());
    setIsConnected(aiService.getCurrentModel() !== null);
  }, []);

  // 设置活跃模型
  const setActiveModel = useCallback((modelId: string) => {
    aiService.setActiveModel(modelId);
    setModels(aiService.getModels());
    setCurrentModel(aiService.getCurrentModel());
    setIsConnected(true);
  }, []);

  // 测试连接
  const testConnection = useCallback(async (config: TestConnectionRequest) => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await aiService.testConnection(config);
      setTestResult(result);
      
      if (result.status === 'success') {
        setIsConnected(true);
      }
    } catch (error) {
      setTestResult({
        status: 'error',
        message: error instanceof Error ? error.message : '测试连接失败',
      });
    } finally {
      setIsTesting(false);
    }
  }, []);

  // 清除测试结果
  const clearTestResult = useCallback(() => {
    setTestResult(null);
  }, []);

  return (
    <AIContext.Provider
      value={{
        models,
        currentModel,
        isConnected,
        isTesting,
        testResult,
        addModel,
        updateModel,
        removeModel,
        setActiveModel,
        testConnection,
        clearTestResult,
      }}
    >
      {children}
    </AIContext.Provider>
  );
};

export const useAI = (): AIContextType => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};