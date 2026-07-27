import { useState, useCallback } from 'react';
import { writeFile, formatCode } from '../services/fileService';
import type { Tab } from './useEditorTabs';

interface UseFileOperationsParams {
  tabs: Tab[];
  activeTabId: string | null;
  markSaved: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  refreshGitStatus?: () => void;
}

/**
 * 文件操作 Hook
 * 提取自 IDE.tsx，负责文件保存和格式化操作
 */
export function useFileOperations({
  tabs,
  activeTabId,
  markSaved,
  updateTabContent,
  refreshGitStatus,
}: UseFileOperationsParams) {
  const [isSaving, setIsSaving] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showError = useCallback((message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 5000);
  }, []);

  const handleSave = useCallback(async () => {
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    if (!activeTab || !activeTab.isModified) return;

    setIsSaving(true);
    try {
      const result = await writeFile(activeTab.file.path, activeTab.content);

      if (result.status === 'success') {
        markSaved(activeTabId!);
        refreshGitStatus?.();
      } else {
        showError(result.message || '保存失败');
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  }, [tabs, activeTabId, markSaved, showError, refreshGitStatus]);

  const handleFormat = useCallback(async () => {
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    if (!activeTab) return;

    setIsFormatting(true);
    try {
      const result = await formatCode(activeTab.content, activeTab.language);

      if (result.status === 'success' && result.data && result.data.formatted) {
        updateTabContent(activeTabId!, result.data.formatted);
      } else {
        showError(result.message || '格式化失败');
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '格式化失败');
    } finally {
      setIsFormatting(false);
    }
  }, [tabs, activeTabId, updateTabContent, showError]);

  const saveFile = useCallback(async (tab: Tab) => {
    setIsSaving(true);
    try {
      const result = await writeFile(tab.file.path, tab.content);
      if (result.status === 'success') {
        markSaved(tab.id);
        refreshGitStatus?.();
      } else {
        showError(result.message || '保存失败');
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  }, [markSaved, showError, refreshGitStatus]);

  return {
    isSaving,
    isFormatting,
    errorMessage,
    showError,
    handleSave,
    handleFormat,
    saveFile,
  };
}
