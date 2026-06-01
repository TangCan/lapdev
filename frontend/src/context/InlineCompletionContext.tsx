import React, { createContext, useContext, useState, useCallback } from 'react';

interface InlineCompletionContextType {
  inlineCompletionEnabled: boolean;
  setInlineCompletionEnabled: (enabled: boolean) => void;
  inlineCompletionVisible: boolean;
  setInlineCompletionVisible: (visible: boolean) => void;
  ghostText: string;
  setGhostText: (text: string) => void;
}

const InlineCompletionContext = createContext<InlineCompletionContextType | null>(null);

const STORAGE_KEY = 'lapdev-inline-completion-enabled';

export const InlineCompletionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inlineCompletionEnabled, setInlineCompletionEnabledState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored !== null ? JSON.parse(stored) : true;
    } catch (error) {
      console.warn('Failed to load inline completion setting from localStorage:', error);
      return true;
    }
  });

  const [inlineCompletionVisible, setInlineCompletionVisible] = useState(false);
  const [ghostText, setGhostText] = useState('');

  const setInlineCompletionEnabled = useCallback((enabled: boolean) => {
    setInlineCompletionEnabledState(enabled);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(enabled));
    } catch (error) {
      console.warn('Failed to save inline completion setting to localStorage:', error);
    }
  }, []);

  return (
    <InlineCompletionContext.Provider
      value={{
        inlineCompletionEnabled,
        setInlineCompletionEnabled,
        inlineCompletionVisible,
        setInlineCompletionVisible,
        ghostText,
        setGhostText,
      }}
    >
      {children}
    </InlineCompletionContext.Provider>
  );
};

export const useInlineCompletion = (): InlineCompletionContextType => {
  const context = useContext(InlineCompletionContext);
  if (!context) {
    throw new Error('useInlineCompletion must be used within an InlineCompletionProvider');
  }
  return context;
};
