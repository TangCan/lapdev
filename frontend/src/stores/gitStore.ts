import { create } from 'zustand';
import { fetchGitStatus, fetchBranches, stageFiles as stageFilesService, commitChanges, checkoutBranch, fetchGitDiff } from '../services/gitService';
import type { GitStatus, GitBranch } from '../services/gitService';
import { WS_URL } from '../config';

interface GitState {
  status: GitStatus | null;
  branches: GitBranch[];
  currentBranch: string;
  isLoading: boolean;
  error: string | null;
  selectedFileDiff: string | null;
  selectedFilePath: string | null;
  refreshStatus: () => Promise<void>;
  getFileDiff: (path: string) => Promise<void>;
  stageFile: (path: string) => Promise<void>;
  stageFiles: (paths: string[]) => Promise<void>;
  commit: (message: string) => Promise<void>;
  checkout: (branch: string) => Promise<void>;
  subscribeToBranchChange: (callback: (branch: string) => void) => () => void;
  notifyBranchChange: (branch: string) => void;
  setStatus: (status: GitStatus | null) => void;
  setError: (error: string | null) => void;
  setBranches: (branches: GitBranch[]) => void;
  setCurrentBranch: (branch: string) => void;
  loadGitData: (isInitialLoad?: boolean) => Promise<void>;
}

const MAX_RECONNECT_ATTEMPTS = 10;

// 全局 WebSocket 引用（在 store 外部管理，避免组件重渲染影响）
let wsRef: WebSocket | null = null;
let reconnectDelay = 1000;
let reconnectAttempts = 0;
const branchChangeSubscribers = new Set<(branch: string) => void>();
let previousStatusJson: string | null = null;
let previousBranchesJson: string | null = null;

function connectWebSocket(notifyBranchChange: (branch: string) => void) {
  try {
    if (wsRef) {
      wsRef.close();
    }

    const ws = new WebSocket(`${WS_URL}`);
    wsRef = ws;

    ws.onopen = () => {
      console.log('WebSocket connected (git store)');
      reconnectDelay = 1000;
      reconnectAttempts = 0;
      ws.send(JSON.stringify({ type: 'subscribeToGit' }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case 'gitStatus':
            if (message.status && message.status.data) {
              useGitStore.getState().setStatus(message.status.data);
              useGitStore.getState().setError(null);
            } else if (message.status?.message) {
              useGitStore.getState().setError(message.status.message);
              useGitStore.getState().setStatus(null);
            }
            break;
          case 'ping':
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
      reconnectAttempts += 1;
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('WebSocket max reconnection attempts reached, stopping');
        useGitStore.getState().setError('WebSocket connection failed after multiple attempts');
        return;
      }
      console.log('WebSocket disconnected, reconnecting in', reconnectDelay, 'ms', '(attempt', reconnectAttempts, '/', MAX_RECONNECT_ATTEMPTS, ')');
      setTimeout(() => connectWebSocket(notifyBranchChange), reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay * 2, 30000);
    };
  } catch (err) {
    console.error('Failed to connect WebSocket:', err);
  }
}

export const useGitStore = create<GitState>((set, get) => ({
  status: null,
  branches: [],
  currentBranch: '',
  isLoading: false,
  error: null,
  selectedFileDiff: null,
  selectedFilePath: null,

  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  setBranches: (branches) => set({ branches }),
  setCurrentBranch: (currentBranch) => set({ currentBranch }),

  notifyBranchChange: (branch: string) => {
    branchChangeSubscribers.forEach((callback) => {
      try {
        callback(branch);
      } catch (error) {
        console.error('Error notifying branch change subscriber:', error);
      }
    });
  },

  loadGitData: async (isInitialLoad = false) => {
    if (isInitialLoad) {
      set({ isLoading: true, error: null });
    }

    try {
      const [statusResult, branchesResult] = await Promise.all([
        fetchGitStatus(),
        fetchBranches()
      ]);

      if (statusResult.status === 'success' && statusResult.data) {
        const newStatusJson = JSON.stringify(statusResult.data);
        if (newStatusJson !== previousStatusJson) {
          previousStatusJson = newStatusJson;
          set({ status: statusResult.data });
        }
      } else if (statusResult.message) {
        if (isInitialLoad) {
          set({ error: statusResult.message, status: null });
        }
      }

      if (branchesResult.status === 'success' && branchesResult.data) {
        const newBranchesJson = JSON.stringify(branchesResult.data);
        if (newBranchesJson !== previousBranchesJson) {
          previousBranchesJson = newBranchesJson;
          set({ branches: branchesResult.data.branches, currentBranch: branchesResult.data.current });
        }
      }
    } catch (err) {
      if (isInitialLoad) {
        set({ error: err instanceof Error ? err.message : 'Failed to load Git data', status: null });
      }
    } finally {
      if (isInitialLoad) {
        set({ isLoading: false });
      }
    }
  },

  refreshStatus: async () => {
    await get().loadGitData();
  },

  getFileDiff: async (path: string) => {
    try {
      const result = await fetchGitDiff(path);
      if (result.status === 'success' && result.data) {
        set({ selectedFileDiff: result.data.diff, selectedFilePath: path });
      } else {
        set({ selectedFileDiff: null, error: result.message });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to get diff', selectedFileDiff: null });
    }
  },

  stageFile: async (path: string) => {
    try {
      const result = await stageFilesService([path]);
      if (result.status !== 'success') {
        set({ error: result.message });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to stage file' });
    }
  },

  stageFiles: async (paths: string[]) => {
    try {
      const result = await stageFilesService(paths);
      if (result.status !== 'success') {
        set({ error: result.message });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to stage files' });
    }
  },

  commit: async (message: string) => {
    try {
      const result = await commitChanges(message);
      if (result.status === 'success') {
        set({ selectedFileDiff: null, selectedFilePath: null });
      } else {
        set({ error: result.message });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to commit' });
    }
  },

  checkout: async (branch: string) => {
    try {
      const result = await checkoutBranch(branch);
      if (result.status === 'success') {
        set({ selectedFileDiff: null, selectedFilePath: null });
        // Refresh branches after checkout
        const branchesResult = await fetchBranches();
        if (branchesResult.status === 'success' && branchesResult.data) {
          set({ branches: branchesResult.data.branches, currentBranch: branchesResult.data.current });
          get().notifyBranchChange(branchesResult.data.current);
        }
      } else {
        set({ error: result.message });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to checkout' });
    }
  },

  subscribeToBranchChange: (callback: (branch: string) => void): (() => void) => {
    branchChangeSubscribers.add(callback);
    return () => {
      branchChangeSubscribers.delete(callback);
    };
  },
}));

/**
 * 初始化 Git WebSocket 连接
 * 应在应用启动时调用一次
 */
export function initGitWebSocket() {
  const { notifyBranchChange, loadGitData } = useGitStore.getState();
  loadGitData(true);
  connectWebSocket(notifyBranchChange);
}

/**
 * 关闭 Git WebSocket 连接
 * 应在应用卸载时调用
 */
export function closeGitWebSocket() {
  if (wsRef) {
    wsRef.close();
    wsRef = null;
  }
}
