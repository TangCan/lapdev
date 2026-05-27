import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { fetchGitStatus, fetchBranches, stageFiles, commitChanges, checkoutBranch, fetchGitDiff } from '../services/gitService';
import type { GitStatus, GitBranch, GitChange } from '../services/gitService';

interface GitContextType {
  status: GitStatus | null;
  branches: GitBranch[];
  currentBranch: string;
  isLoading: boolean;
  error: string | null;
  selectedFileDiff: string | null;
  selectedFilePath: string | null;
  refreshStatus: () => void;
  getFileDiff: (path: string) => void;
  stageFile: (path: string) => void;
  commit: (message: string) => void;
  checkout: (branch: string) => void;
}

const GitContext = createContext<GitContextType | null>(null);

export function GitProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [currentBranch, setCurrentBranch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFileDiff, setSelectedFileDiff] = useState<string | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);

  const loadGitData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [statusResult, branchesResult] = await Promise.all([
        fetchGitStatus(),
        fetchBranches()
      ]);

      if (statusResult.status === 'success' && statusResult.data) {
        setStatus(statusResult.data);
      } else if (statusResult.message) {
        setError(statusResult.message);
        setStatus(null);
      }

      if (branchesResult.status === 'success' && branchesResult.data) {
        setBranches(branchesResult.data.branches);
        setCurrentBranch(branchesResult.data.current);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Git data');
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGitData();
  }, [loadGitData]);

  const refreshStatus = useCallback(() => {
    loadGitData();
  }, [loadGitData]);

  const getFileDiff = useCallback(async (path: string) => {
    try {
      const result = await fetchGitDiff(path);
      if (result.status === 'success' && result.data) {
        setSelectedFileDiff(result.data.diff);
        setSelectedFilePath(path);
      } else {
        setSelectedFileDiff(null);
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get diff');
      setSelectedFileDiff(null);
    }
  }, []);

  const stageFile = useCallback(async (path: string) => {
    try {
      const result = await stageFiles([path]);
      if (result.status === 'success') {
        await loadGitData();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stage file');
    }
  }, [loadGitData]);

  const commit = useCallback(async (message: string) => {
    try {
      const result = await commitChanges(message);
      if (result.status === 'success') {
        await loadGitData();
        setSelectedFileDiff(null);
        setSelectedFilePath(null);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to commit');
    }
  }, [loadGitData]);

  const checkout = useCallback(async (branch: string) => {
    try {
      const result = await checkoutBranch(branch);
      if (result.status === 'success') {
        await loadGitData();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to checkout');
    }
  }, [loadGitData]);

  return (
    <GitContext.Provider
      value={{
        status,
        branches,
        currentBranch,
        isLoading,
        error,
        selectedFileDiff,
        selectedFilePath,
        refreshStatus,
        getFileDiff,
        stageFile,
        commit,
        checkout
      }}
    >
      {children}
    </GitContext.Provider>
  );
}

export function useGit() {
  const context = useContext(GitContext);
  if (!context) {
    throw new Error('useGit must be used within a GitProvider');
  }
  return context;
}
