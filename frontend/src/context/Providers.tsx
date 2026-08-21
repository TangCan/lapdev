import React, { useEffect } from 'react';
import { AIProvider } from './AIContext';
import { AgentProvider } from './AgentContext';
import { InlineCompletionProvider } from './InlineCompletionContext';
import { SkillProvider } from './SkillContext';
import { LSPProvider } from './LSPContext';
import { initGitWebSocket, closeGitWebSocket } from '../stores/gitStore';
import { initThemeWatcher } from '../stores/themeStore';
import { useThemeStore } from '../stores/themeStore';

const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 初始化 Zustand store 的副作用
  useEffect(() => {
    const removeThemeWatcher = initThemeWatcher();
    initGitWebSocket();
    return () => {
      removeThemeWatcher();
      closeGitWebSocket();
    };
  }, []);

  // 将初始主题应用到 DOM
  useEffect(() => {
    useThemeStore.getState().initTheme();
  }, []);

  return (
    <AIProvider>
      <AgentProvider>
        <InlineCompletionProvider>
          <SkillProvider>
            <LSPProvider>
              {children}
            </LSPProvider>
          </SkillProvider>
        </InlineCompletionProvider>
      </AgentProvider>
    </AIProvider>
  );
};

export default Providers;