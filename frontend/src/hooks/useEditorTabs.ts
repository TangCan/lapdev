import { useState, useCallback } from 'react';
import type { FileInfo } from '../types/file';
import { readFile } from '../services/fileService';
import { fetchGitDiff } from '../services/gitService';
import type { DiffLine } from '../components/Editor/CodeEditor';

export interface Tab {
  id: string;
  file: FileInfo;
  content: string;
  isModified: boolean;
  language: string;
}

/**
 * 检测文件语言
 */
function detectLanguage(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase() || '';

  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    rs: 'rust',
    go: 'go',
    java: 'java',
    cpp: 'cpp',
    c: 'cpp',
    cs: 'csharp',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    html: 'html',
    css: 'css',
  };

  return languageMap[extension] || 'plaintext';
}

/**
 * 解析 diff 行
 */
function parseDiffLines(diff: string): DiffLine[] {
  const lines: DiffLine[] = [];
  const diffLines = diff.split('\n');
  let currentLineNumber = 0;

  for (const line of diffLines) {
    if (line.startsWith('---') || line.startsWith('+++') || line.startsWith('@@')) {
      const match = line.match(/@@ -\d+,\d+ \+(\d+),/);
      if (match) {
        currentLineNumber = parseInt(match[1], 10) - 1;
      }
      continue;
    }

    if (line.startsWith('index ')) {
      continue;
    }

    if (line.startsWith('+')) {
      currentLineNumber++;
      lines.push({ lineNumber: currentLineNumber, type: 'added' });
    } else if (line.startsWith('-')) {
      lines.push({ lineNumber: currentLineNumber + 1, type: 'deleted' });
    } else if (line.length > 0 && !line.startsWith('\\')) {
      currentLineNumber++;
      const prevLine = diffLines[diffLines.indexOf(line) - 1];
      if (prevLine && (prevLine.startsWith('-') || prevLine.startsWith('+'))) {
        const prevPrevLine = diffLines[diffLines.indexOf(line) - 2];
        if (prevPrevLine && prevPrevLine.startsWith('-')) {
          lines.push({ lineNumber: currentLineNumber, type: 'modified' });
        }
      }
    }
  }

  return lines;
}

/**
 * 编辑器标签页管理 Hook
 * 提取自 IDE.tsx，负责标签页的打开、关闭、切换和内容管理
 */
export function useEditorTabs() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [loadingFiles, setLoadingFiles] = useState<Set<string>>(new Set());
  const [diffLines, setDiffLines] = useState<Record<string, DiffLine[]>>({});

  const openFile = useCallback(async (file: FileInfo) => {
    const existingTab = tabs.find(tab => tab.file.path === file.path);

    if (existingTab) {
      setActiveTabId(existingTab.id);
      if (!diffLines[file.path]) {
        try {
          const result = await fetchGitDiff(file.path);
          if (result.status === 'success' && result.data) {
            const parsedLines = parseDiffLines(result.data.diff);
            setDiffLines(prev => ({ ...prev, [file.path]: parsedLines }));
          }
        } catch (error) {
          console.error('Failed to load diff:', error);
        }
      }
      return;
    }

    setLoadingFiles(prev => new Set([...prev, file.path]));

    try {
      const [fileResult, diffResult] = await Promise.all([
        readFile(file.path),
        fetchGitDiff(file.path).catch(() => ({ status: 'error' }))
      ]);

      if (fileResult.status === 'success' && fileResult.data) {
        const newTab: Tab = {
          id: `tab-${Date.now()}`,
          file,
          content: fileResult.data.content,
          isModified: false,
          language: detectLanguage(file.path)
        };
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTab.id);

        if (diffResult.status === 'success' && 'data' in diffResult && diffResult.data) {
          const parsedLines = parseDiffLines(diffResult.data.diff);
          setDiffLines(prev => ({ ...prev, [file.path]: parsedLines }));
        }
      }
    } catch (error) {
      console.error('Failed to open file:', error);
    } finally {
      setLoadingFiles(prev => {
        const next = new Set(prev);
        next.delete(file.path);
        return next;
      });
    }
  }, [tabs, diffLines]);

  const closeTab = useCallback((tabId: string) => {
    setTabs(prev => prev.filter(tab => tab.id !== tabId));

    setActiveTabId(currentActive => {
      if (currentActive === tabId) {
        const remaining = tabs.filter(tab => tab.id !== tabId);
        return remaining.length > 0 ? remaining[remaining.length - 1].id : null;
      }
      return currentActive;
    });
  }, [tabs]);

  const switchTab = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  const updateContent = useCallback((tabId: string, newContent: string) => {
    setTabs(prev => prev.map(tab =>
      tab.id === tabId
        ? { ...tab, content: newContent, isModified: true }
        : tab
    ));
  }, []);

  const markSaved = useCallback((tabId: string) => {
    setTabs(prev => prev.map(tab =>
      tab.id === tabId ? { ...tab, isModified: false } : tab
    ));
  }, []);

  const updateTabContent = useCallback((tabId: string, content: string) => {
    setTabs(prev => prev.map(tab =>
      tab.id === tabId ? { ...tab, content, isModified: true } : tab
    ));
  }, []);

  return {
    tabs,
    activeTabId,
    loadingFiles,
    diffLines,
    activeTab: tabs.find(tab => tab.id === activeTabId) || null,
    openFile,
    closeTab,
    switchTab,
    updateContent,
    markSaved,
    updateTabContent,
  };
}
