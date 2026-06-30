import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { fetchGitStatus, fetchBranches, stageFiles, commitChanges, checkoutBranch, fetchGitDiff } from '../services/gitService';
import type { GitStatus, GitBranch, GitChange } from '../services/gitService';
import { WS_URL } from '../config';

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
  subscribeToBranchChange: (callback: (branch: string) => void) => () => void;
}

const GitContext = createContext<GitContextType | null>(null);

const MAX_RECONNECT_ATTEMPTS = 10;

export function GitProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [currentBranch, setCurrentBranch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFileDiff, setSelectedFileDiff] = useState<string | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectDelayRef = useRef(1000);
  const reconnectAttemptsRef = useRef(0);
  const branchChangeSubscribersRef = useRef<Set<(branch: string) => void>>(new Set());

  const notifyBranchChange = useCallback((branch: string) => {
    branchChangeSubscribersRef.current.forEach((callback) => {
      try {
        callback(branch);
      } catch (error) {
        console.error('Error notifying branch change subscriber:', error);
      }
    });
  }, []);

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

  const connectWebSocket = useCallback(() => {
    try {
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      const ws = new WebSocket(`${WS_URL}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        reconnectDelayRef.current = 1000;
        reconnectAttemptsRef.current = 0;
        // Subscribe to Git updates
        ws.send(JSON.stringify({ type: 'subscribeToGit' }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          switch (message.type) {
            case 'gitStatus':
              if (message.status && message.status.data) {
                setStatus(message.status.data);
                setError(null);
              } else if (message.status?.message) {
                setError(message.status.message);
                setStatus(null);
              }
              break;
            case 'ping':
              // Respond to heartbeat
              ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
              break;
            default:
              break;
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        reconnectAttemptsRef.current += 1;
        if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          console.error('WebSocket max reconnection attempts reached, stopping');
          setError('WebSocket connection failed after multiple attempts');
          return;
        }
        console.log('WebSocket disconnected, reconnecting in', reconnectDelayRef.current, 'ms', '(attempt', reconnectAttemptsRef.current, '/', MAX_RECONNECT_ATTEMPTS, ')');
        // Reconnect with exponential backoff
        setTimeout(connectWebSocket, reconnectDelayRef.current);
        reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 30000);
      };
    } catch (err) {
      console.error('Failed to connect WebSocket:', err);
    }
  }, []);

  useEffect(() => {
    // Initial load
    loadGitData();
    
    // Connect WebSocket for real-time updates
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [loadGitData, connectWebSocket]);

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
      if (result.status !== 'success') {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stage file');
    }
  }, []);

  const commit = useCallback(async (message: string) => {
    try {
      const result = await commitChanges(message);
      if (result.status === 'success') {
        setSelectedFileDiff(null);
        setSelectedFilePath(null);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to commit');
    }
  }, []);

  const checkout = useCallback(async (branch: string) => {
    try {
      const result = await checkoutBranch(branch);
      if (result.status === 'success') {
        setSelectedFileDiff(null);
        setSelectedFilePath(null);
        // Refresh branches after checkout
        const branchesResult = await fetchBranches();
        if (branchesResult.status === 'success' && branchesResult.data) {
          setBranches(branchesResult.data.branches);
          setCurrentBranch(branchesResult.data.current);
          // Notify subscribers about branch change
          notifyBranchChange(branchesResult.data.current);
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to checkout');
    }
  }, [notifyBranchChange]);

  const subscribeToBranchChange = useCallback((callback: (branch: string) => void): () => void => {
    branchChangeSubscribersRef.current.add(callback);
    return () => {
      branchChangeSubscribersRef.current.delete(callback);
    };
  }, []);

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
        checkout,
        subscribeToBranchChange
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