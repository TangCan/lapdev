import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { GitPanel } from './GitPanel';

describe('GitPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('[P0] should display default branch name when no status loaded', () => {
    render(<GitPanel />);
    expect(screen.getByText('main')).toBeTruthy();
  });

  it('[P0] should render Commit, Pull, Push action buttons', () => {
    render(<GitPanel />);
    expect(screen.getByText('Commit')).toBeTruthy();
    expect(screen.getByText('Pull')).toBeTruthy();
    expect(screen.getByText('Push')).toBeTruthy();
  });

  it('[P1] should fetch git status data on mount', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        status: 'success',
        data: {
          branch: 'main',
          ahead: 0,
          behind: 0,
          staged: [],
          modified: [],
          untracked: [],
        },
      }),
    });

    vi.stubGlobal('fetch', mockFetch);

    render(<GitPanel />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/git/status');
    });

    vi.unstubAllGlobals();
  });

  it('[P1] should display untracked files from status', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        status: 'success',
        data: {
          branch: 'main',
          ahead: 0,
          behind: 0,
          staged: [],
          modified: [],
          untracked: ['newfile.ts', 'test.md'],
        },
      }),
    });

    vi.stubGlobal('fetch', mockFetch);

    render(<GitPanel />);

    await waitFor(() => {
      expect(screen.getByText('newfile.ts')).toBeTruthy();
      expect(screen.getByText('test.md')).toBeTruthy();
    });

    vi.unstubAllGlobals();
  });

  it('[P2] should display ahead/behind counts when status has them', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        status: 'success',
        data: {
          branch: 'feature/auth',
          ahead: 3,
          behind: 1,
          staged: [],
          modified: [],
          untracked: [],
        },
      }),
    });

    vi.stubGlobal('fetch', mockFetch);

    render(<GitPanel />);

    await waitFor(() => {
      expect(screen.getByText('feature/auth')).toBeTruthy();
    });

    await waitFor(() => {
      expect(screen.getByText(/↑3/)).toBeTruthy();
      expect(screen.getByText(/↓1/)).toBeTruthy();
    });

    vi.unstubAllGlobals();
  });

  it('[P2] should handle fetch errors gracefully without crashing', () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.stubGlobal('fetch', mockFetch);

    render(<GitPanel />);

    expect(screen.getByText('main')).toBeTruthy();

    vi.unstubAllGlobals();
  });
});