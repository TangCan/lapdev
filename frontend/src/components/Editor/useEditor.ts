import { useState, useCallback } from 'react';
import type { FileInfo } from '../../types/file';
import { readFile, writeFile, formatCode as formatCodeApi } from '../../services/fileService';

export function useEditor() {
  const [currentFile, setCurrentFile] = useState<FileInfo | null>(null);
  const [content, setContent] = useState('');
  const [isModified, setIsModified] = useState(false);
  const [language, setLanguage] = useState('plaintext');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectLanguage = useCallback((filePath: string): string => {
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
  }, []);

  const openFile = useCallback(async (file: FileInfo) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await readFile(file.path);
      
      if (result.status === 'success' && result.data) {
        setCurrentFile(file);
        setContent(result.data.content);
        setIsModified(false);
        setLanguage(detectLanguage(file.path));
      } else {
        setError(result.message || 'Failed to read file');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file');
    } finally {
      setIsLoading(false);
    }
  }, [detectLanguage]);

  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
    setIsModified(true);
  }, []);

  const saveFile = useCallback(async () => {
    if (!currentFile || !isModified) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await writeFile(currentFile.path, content);
      
      if (result.status === 'success') {
        setIsModified(false);
      } else {
        setError(result.message || 'Failed to save file');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save file');
    } finally {
      setIsLoading(false);
    }
  }, [currentFile, content, isModified]);

  const formatCode = useCallback(async () => {
    if (!content || !currentFile) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await formatCodeApi(content, language);
      
      if (result.status === 'success' && result.data) {
        setContent(result.data.formatted);
      } else {
        setError(result.message || 'Failed to format code');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to format code');
    } finally {
      setIsLoading(false);
    }
  }, [content, language, currentFile]);

  const closeFile = useCallback(() => {
    setCurrentFile(null);
    setContent('');
    setIsModified(false);
    setLanguage('plaintext');
    setError(null);
  }, []);

  return {
    currentFile,
    content,
    isModified,
    language,
    isLoading,
    error,
    openFile,
    updateContent,
    saveFile,
    formatCode,
    closeFile,
    detectLanguage
  };
}