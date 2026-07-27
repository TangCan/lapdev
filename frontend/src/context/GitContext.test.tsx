import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, act, screen } from '@testing-library/react';
import React from 'react';
import { GitProvider, useGit } from './GitContext';
import { fetchGitStatus, fetchBranches, stageFiles as stageFilesService, commitChanges, checkoutBranch, fetchGitDiff } from '../services/gitService';

vi.mock('../services/gitService', () => ({
  fetchGitStatus: vi.fn(),
  fetchBranches: vi.fn(),
  stageFiles: vi.fn(),
  commitChanges: vi.fn(),
  checkoutBranch: vi.fn(),
  fetchGitDiff: vi.fn(),
}));

function TestConsumer() {
  const ctx = useGit();
  return (
    <div data-testid="consumer">
      <span data-testid="branch">{ctx.currentBranch}</span>
      <span data-testid="loading">{String(ctx.isLoading)}</span>
      <span data-testid="error">{ctx.error || 'null'}</span>
      <span data-testid="status-branch">{ctx.status?.branch || 'null'}</span>
      <span data-testid="branches-count">{ctx.branches.length}</span>
      <span data-testid="selected-diff">{ctx.selectedFileDiff || 'null'}</span>
      <span data-testid="selected-path">{ctx.selectedFilePath || 'null'}</span>
    </div>
  );
}

function renderWithProvider(ui: React.ReactElement) {
  return render(<GitProvider>{ui}</GitProvider>);
}

describe('GitProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (fetchGitStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 'success',
      data: { branch: 'main', changes: [], staged: [], untracked: [] },
    });
    (fetchBranches as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 'success',
      data: { branches: [{ name: 'main', isCurrent: true, isRemote: false }], current: 'main' },
    });
  });

  it('[P0] should load git data on mount', async () => {
    renderWithProvider(<TestConsumer />);

    await waitFor(() => {
      expect(fetchGitStatus).toHaveBeenCalledTimes(1);
      expect(fetchBranches).toHaveBeenCalledTimes(1);
    });
  });

  it('[P0] should set current branch from fetched data', async () => {
    renderWithProvider(<TestConsumer />);

    await waitFor(() => {
      expect(screen.getByTestId('branch').textContent).toBe('main');
      expect(screen.getByTestId('status-branch').textContent).toBe('main');
      expect(screen.getByTestId('branches-count').textContent).toBe('1');
    });
  });

  it('[P1] should set loading state during initial load', async () => {
    renderWithProvider(<TestConsumer />);

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
  });

  it('[P1] should handle error from fetchGitStatus failure', async () => {
    (fetchGitStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 'error',
      message: 'Failed to get git status',
    });

    renderWithProvider(<TestConsumer />);

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('Failed to get git status');
      expect(screen.getByTestId('status-branch').textContent).toBe('null');
    });
  });

  it('[P1] should handle error when fetchGitStatus throws', async () => {
    (fetchGitStatus as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    renderWithProvider(<TestConsumer />);

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('Network error');
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
  });

  it('[P1] stageFile should call service and handle success', async () => {
    (stageFilesService as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 'success',
    });

    let stageFileFn: ((path: string) => void) | null = null;
    function StageConsumer() {
      const ctx = useGit();
      stageFileFn = ctx.stageFile;
      return <span data-testid="error">{ctx.error || 'null'}</span>;
    }

    renderWithProvider(<StageConsumer />);

    await act(async () => {
      stageFileFn!('/test/file.ts');
    });

    expect(stageFilesService).toHaveBeenCalledWith(['/test/file.ts']);
    expect(screen.getByTestId('error').textContent).toBe('null');
  });

  it('[P1] stageFile should set error on failure', async () => {
    (stageFilesService as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 'error',
      message: 'Failed to stage',
    });

    let stageFileFn: ((path: string) => void) | null = null;
    function StageFailConsumer() {
      const ctx = useGit();
      stageFileFn = ctx.stageFile;
      return <span data-testid="error">{ctx.error || 'null'}</span>;
    }

    renderWithProvider(<StageFailConsumer />);

    await act(async () => {
      stageFileFn!('/test/file.ts');
    });

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('Failed to stage');
    });
  });

  it('[P1] commit should trigger git operation and clear diff on success', async () => {
    (commitChanges as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 'success',
    });

    let commitFn: ((msg: string) => void) | null = null;
    function CommitConsumer() {
      const ctx = useGit();
      commitFn = ctx.commit;
      return (
        <div>
          <span data-testid="diff">{ctx.selectedFileDiff || 'null'}</span>
          <span data-testid="path">{ctx.selectedFilePath || 'null'}</span>
        </div>
      );
    }

    renderWithProvider(<CommitConsumer />);

    await act(async () => {
      commitFn!('test commit');
    });

    expect(commitChanges).toHaveBeenCalledWith('test commit');
    await waitFor(() => {
      expect(screen.getByTestId('diff').textContent).toBe('null');
      expect(screen.getByTestId('path').textContent).toBe('null');
    });
  });

  it('[P1] commit should set error on failure', async () => {
    (commitChanges as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 'error',
      message: 'Commit failed',
    });

    let commitFn: ((msg: string) => void) | null = null;
    function CommitFailConsumer() {
      const ctx = useGit();
      commitFn = ctx.commit;
      return <span data-testid="error">{ctx.error || 'null'}</span>;
    }

    renderWithProvider(<CommitFailConsumer />);

    await act(async () => {
      commitFn!('test commit');
    });

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('Commit failed');
    });
  });

  it('[P1] checkout should trigger branch operation', async () => {
    (checkoutBranch as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 'success',
    });
    (fetchBranches as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 'success',
      data: { branches: [{ name: 'feature-branch', isCurrent: true, isRemote: false }], current: 'feature-branch' },
    });

    let checkoutFn: ((branch: string) => void) | null = null;
    function CheckoutConsumer() {
      const ctx = useGit();
      checkoutFn = ctx.checkout;
      return <span data-testid="branch">{ctx.currentBranch}</span>;
    }

    renderWithProvider(<CheckoutConsumer />);

    await act(async () => {
      checkoutFn!('feature-branch');
    });

    expect(checkoutBranch).toHaveBeenCalledWith('feature-branch');
  });

  it('[P1] getFileDiff should fetch and set selected diff', async () => {
    (fetchGitDiff as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 'success',
      data: { diff: '--- a/test\n+++ b/test\n@@ -1 +1 @@\n-old\n+new' },
    });

    let diffFn: ((path: string) => void) | null = null;
    function DiffConsumer() {
      const ctx = useGit();
      diffFn = ctx.getFileDiff;
      return (
        <div>
          <span data-testid="diff">{ctx.selectedFileDiff || 'null'}</span>
          <span data-testid="path">{ctx.selectedFilePath || 'null'}</span>
        </div>
      );
    }

    renderWithProvider(<DiffConsumer />);

    await act(async () => {
      diffFn!('/test/file.ts');
    });

    await waitFor(() => {
      expect(screen.getByTestId('diff').textContent).not.toBe('null');
      expect(screen.getByTestId('path').textContent).toBe('/test/file.ts');
    });
  });

  it('[P2] subscribeToBranchChange should return unsubscribe function', () => {
    let subscribeFn: ((cb: (branch: string) => void) => () => void) | null = null;
    function SubscribeConsumer() {
      const ctx = useGit();
      subscribeFn = ctx.subscribeToBranchChange;
      return <span />;
    }

    renderWithProvider(<SubscribeConsumer />);

    const unsubscribe = subscribeFn!(() => {});
    expect(typeof unsubscribe).toBe('function');
  });

  it('[P2] subscribeToBranchChange should notify subscribers on checkout', async () => {
    (checkoutBranch as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 'success',
    });
    (fetchBranches as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 'success',
      data: { branches: [{ name: 'feature', isCurrent: true, isRemote: false }], current: 'feature' },
    });

    let subscribeFn: ((cb: (branch: string) => void) => () => void) | null = null;
    let checkoutFn: ((branch: string) => void) | null = null;
    const branchChangeSpy = vi.fn();

    function SubNotifyConsumer() {
      const ctx = useGit();
      subscribeFn = ctx.subscribeToBranchChange;
      checkoutFn = ctx.checkout;
      return <span />;
    }

    renderWithProvider(<SubNotifyConsumer />);

    subscribeFn!(branchChangeSpy);

    await act(async () => {
      checkoutFn!('feature');
    });

    await waitFor(() => {
      expect(branchChangeSpy).toHaveBeenCalledWith('feature');
    });
  });

  it('[P2] useGit should throw when used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      render(<TestConsumer />);
    } catch (e) {
      expect((e as Error).message).toContain('useGit must be used within a GitProvider');
    }
    spy.mockRestore();
  });

  it('[P2] refreshStatus should re-fetch git data', async () => {
    let refreshFn: (() => void) | null = null;
    function RefreshConsumer() {
      const ctx = useGit();
      refreshFn = ctx.refreshStatus;
      return <span />;
    }

    renderWithProvider(<RefreshConsumer />);

    await waitFor(() => {
      expect(fetchGitStatus).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      refreshFn!();
    });

    expect(fetchGitStatus).toHaveBeenCalledTimes(2);
  });
});