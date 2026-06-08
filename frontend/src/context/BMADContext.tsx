import { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react';
import type { BMADStatus } from '../services/bmadService.ts';

export interface BMADContextValue {
  status: BMADStatus;
  installationLog: string[];
  isInstalling: boolean;
  enableBMAD: () => Promise<void>;
  upgradeBMAD: () => Promise<void>;
  refreshStatus: () => void;
}

const BMADContext = createContext<BMADContextValue | undefined>(undefined);

export function BMADProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<BMADStatus>('not-installed');
  const [installationLog, setInstallationLog] = useState<string[]>([]);
  const [isInstalling, setIsInstalling] = useState(false);

  const refreshStatus = useCallback(() => {
    // 检查_bmad目录是否存在
    fetch('/api/bmad/status')
      .then(response => response.json())
      .then(data => {
        setStatus(data.status);
      })
      .catch(() => {
        setStatus('not-installed');
      });
  }, []);

  const enableBMAD = useCallback(async () => {
    setIsInstalling(true);
    setInstallationLog([]);

    try {
      const response = await fetch('/api/bmad/install', {
        method: 'POST',
      });

      const reader = response.body?.getReader();
      if (!reader) {
        setStatus('error');
        setInstallationLog(['Failed to get response reader']);
        setIsInstalling(false);
        return;
      }

      const decoder = new TextDecoder();
      let result = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        result += chunk;

        // 解析SSE格式
        const lines = chunk.split('\n');
        const newLogs = lines
          .filter(line => line.startsWith('data:'))
          .map(line => line.slice(5).trim());

        if (newLogs.length > 0) {
          setInstallationLog(prev => [...prev, ...newLogs]);
        }
      }

      // 检查安装结果
      const finalResponse = JSON.parse(result.split('\n').pop()?.replace('data:', '') || '{}');
      if (finalResponse.success) {
        setStatus(finalResponse.isOffline ? 'installed-offline' : 'installed');
        setInstallationLog(prev => [...prev, finalResponse.isOffline ? 'BMAD离线模式安装成功！' : 'BMAD安装成功！']);
      } else {
        setStatus('error');
        setInstallationLog(prev => [...prev, `安装失败: ${finalResponse.error || 'Unknown error'}`]);
      }
    } catch (error) {
      setStatus('error');
      setInstallationLog(prev => [...prev, `安装错误: ${error}`]);
    } finally {
      setIsInstalling(false);
    }
  }, []);

  const upgradeBMAD = useCallback(async () => {
    setIsInstalling(true);
    setInstallationLog([]);

    try {
      const response = await fetch('/api/bmad/upgrade', {
        method: 'POST',
      });

      const reader = response.body?.getReader();
      if (!reader) {
        setStatus('error');
        setInstallationLog(['Failed to get response reader']);
        setIsInstalling(false);
        return;
      }

      const decoder = new TextDecoder();
      let result = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        result += chunk;

        // 解析SSE格式
        const lines = chunk.split('\n');
        const newLogs = lines
          .filter(line => line.startsWith('data:'))
          .map(line => line.slice(5).trim());

        if (newLogs.length > 0) {
          setInstallationLog(prev => [...prev, ...newLogs]);
        }
      }

      // 检查升级结果
      const finalResponse = JSON.parse(result.split('\n').pop()?.replace('data:', '') || '{}');
      if (finalResponse.success) {
        setStatus('installed');
        setInstallationLog(prev => [...prev, 'BMAD升级成功！已切换到完整版本']);
      } else {
        setStatus('installed-offline');
        setInstallationLog(prev => [...prev, `升级失败，保持离线模式: ${finalResponse.error || 'Unknown error'}`]);
      }
    } catch (error) {
      setStatus('installed-offline');
      setInstallationLog(prev => [...prev, `升级错误，保持离线模式: ${error}`]);
    } finally {
      setIsInstalling(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  return (
    <BMADContext.Provider
      value={{
        status,
        installationLog,
        isInstalling,
        enableBMAD,
        upgradeBMAD,
        refreshStatus,
      }}
    >
      {children}
    </BMADContext.Provider>
  );
}

export function useBMAD() {
  const context = useContext(BMADContext);
  if (context === undefined) {
    throw new Error('useBMAD must be used within a BMADProvider');
  }
  return context;
}