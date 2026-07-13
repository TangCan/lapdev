import React, { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';
import { agentService, AgentOperation, OperationLogEntry } from '../services/agentService';

interface AgentContextType {
  isAgentMode: boolean;
  pendingOperations: AgentOperation[];
  operationLogs: OperationLogEntry[];
  
  setAgentMode: (enabled: boolean) => void;
  addOperation: (operation: Omit<AgentOperation, 'id' | 'status' | 'timestamp'>) => void;
  approveOperation: (operationId: string) => void;
  rejectOperation: (operationId: string) => void;
  approveAllOperations: () => void;
  rejectAllOperations: () => void;
  executeApprovedOperations: () => Promise<void>;
  clearPendingOperations: () => void;
  addLogEntry: (entry: Omit<OperationLogEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  filterLogsByType: (type: OperationLogEntry['operationType'] | 'all') => OperationLogEntry[];
  exportLogs: () => void;
}

const AgentContext = createContext<AgentContextType | null>(null);

export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 从 localStorage 恢复 Agent 模式状态
  const [isAgentMode, setIsAgentModeState] = useState(() => {
    const stored = localStorage.getItem('lapdev-agent-mode');
    if (!stored) return false;
    try {
      return JSON.parse(stored);
    } catch {
      // localStorage 内容格式错误，返回默认值
      return false;
    }
  });
  const [pendingOperations, setPendingOperations] = useState<AgentOperation[]>([]);
  const [operationLogs, setOperationLogs] = useState<OperationLogEntry[]>([]);
  
  // 使用 useRef 存储定时器ID，防止泄漏
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 从 localStorage 恢复日志
  useEffect(() => {
    const storedLogs = localStorage.getItem('lapdev-agent-logs');
    if (storedLogs) {
      try {
        setOperationLogs(JSON.parse(storedLogs));
      } catch {
        // 忽略解析错误
      }
    }
  }, []);

  // 保存日志到 localStorage
  useEffect(() => {
    localStorage.setItem('lapdev-agent-logs', JSON.stringify(operationLogs));
  }, [operationLogs]);

  // 清理定时器（组件卸载时）
  useEffect(() => {
    return () => {
      if (cleanupTimerRef.current) {
        clearTimeout(cleanupTimerRef.current);
      }
    };
  }, []);

  // 添加日志条目（内部辅助函数）
  const appendLogEntry = useCallback((entry: Omit<OperationLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: OperationLogEntry = {
      ...entry,
      id: agentService.generateId(),
      timestamp: Date.now(),
    };
    setOperationLogs(prev => [newEntry, ...prev].slice(0, 100));
  }, []);

  // 设置 Agent 模式（修复闭包问题：直接操作状态而非调用 addLogEntry）
  const setAgentMode = useCallback((enabled: boolean) => {
    setIsAgentModeState(enabled);
    localStorage.setItem('lapdev-agent-mode', JSON.stringify(enabled));
    
    // 直接更新日志状态，避免闭包问题
    appendLogEntry({
      operationType: 'read',
      filePath: '[Agent Mode]',
      result: 'success',
      details: enabled ? 'Agent模式已开启' : 'Agent模式已关闭',
    });
  }, [appendLogEntry]);

  // 添加操作到待确认列表（带去重机制）
  const addOperation = useCallback((operation: Omit<AgentOperation, 'id' | 'status' | 'timestamp'>) => {
    // 检查是否已存在相同类型和路径的操作，防止重复添加
    const exists = pendingOperations.some(
      op => op.type === operation.type && 
           op.filePath === operation.filePath && 
           op.status === 'pending'
    );
    if (exists) {
      appendLogEntry({
        operationType: operation.type,
        filePath: operation.filePath,
        result: 'rejected',
        details: '操作已存在，已去重',
      });
      return;
    }

    const newOperation = agentService.createOperation(
      operation.type,
      operation.filePath,
      operation.content,
      operation.originalContent
    );
    setPendingOperations(prev => [...prev, newOperation]);
  }, [pendingOperations, appendLogEntry]);

  // 批准单个操作
  const approveOperation = useCallback((operationId: string) => {
    setPendingOperations(prev =>
      prev.map(op => op.id === operationId ? { ...op, status: 'approved' } : op)
    );
  }, []);

  // 拒绝单个操作
  const rejectOperation = useCallback((operationId: string) => {
    setPendingOperations(prev =>
      prev.map(op => op.id === operationId ? { ...op, status: 'rejected' } : op)
    );
  }, []);

  // 批准所有操作
  const approveAllOperations = useCallback(() => {
    setPendingOperations(prev =>
      prev.map(op => ({ ...op, status: 'approved' }))
    );
  }, []);

  // 拒绝所有操作
  const rejectAllOperations = useCallback(() => {
    setPendingOperations(prev =>
      prev.map(op => ({ ...op, status: 'rejected' }))
    );
  }, []);

  // 执行已批准的操作（修复定时器泄漏问题）
  const executeApprovedOperations = useCallback(async () => {
    const approvedOperations = pendingOperations.filter(op => op.status === 'approved');
    
    for (const operation of approvedOperations) {
      try {
        const success = await agentService.executeOperation({
          type: operation.type,
          filePath: operation.filePath,
          content: operation.content,
          originalContent: operation.originalContent,
        });

        appendLogEntry({
          operationType: operation.type,
          filePath: operation.filePath,
          result: success ? 'success' : 'failed',
          details: success ? '操作执行成功' : '操作执行失败',
        });

        setPendingOperations(prev =>
          prev.map(op => op.id === operation.id ? { ...op, status: 'executed' } : op)
        );
      } catch (error) {
        appendLogEntry({
          operationType: operation.type,
          filePath: operation.filePath,
          result: 'failed',
          details: error instanceof Error ? error.message : '操作执行异常',
        });
      }
    }

    // 清理已执行的操作（使用 useRef 存储定时器ID，防止泄漏）
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
    }
    cleanupTimerRef.current = setTimeout(() => {
      setPendingOperations(prev => prev.filter(op => op.status !== 'executed'));
      cleanupTimerRef.current = null;
    }, 2000);
  }, [pendingOperations, appendLogEntry]);

  // 清除待确认操作
  const clearPendingOperations = useCallback(() => {
    setPendingOperations([]);
  }, []);

  // 添加日志条目（对外暴露的方法）
  const addLogEntry = useCallback((entry: Omit<OperationLogEntry, 'id' | 'timestamp'>) => {
    appendLogEntry(entry);
  }, [appendLogEntry]);

  // 清除日志
  const clearLogs = useCallback(async () => {
    setOperationLogs([]);
    localStorage.removeItem('lapdev-agent-logs');
    try {
      await agentService.clearServerLogs();
    } catch {
      console.error('Failed to clear server logs');
    }
  }, []);

  // 按操作类型筛选日志
  const filterLogsByType = useCallback((type: OperationLogEntry['operationType'] | 'all'): OperationLogEntry[] => {
    if (type === 'all') {
      return operationLogs;
    }
    return operationLogs.filter(log => log.operationType === type);
  }, [operationLogs]);

  // 导出日志为JSON文件
  const exportLogs = useCallback(() => {
    try {
      const dataStr = JSON.stringify(operationLogs, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `agent-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  }, [operationLogs]);

  return (
    <AgentContext.Provider
      value={{
        isAgentMode,
        pendingOperations,
        operationLogs,
        setAgentMode,
        addOperation,
        approveOperation,
        rejectOperation,
        approveAllOperations,
        rejectAllOperations,
        executeApprovedOperations,
        clearPendingOperations,
        addLogEntry,
        clearLogs,
        filterLogsByType,
        exportLogs,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
};

export const useAgent = (): AgentContextType => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
};