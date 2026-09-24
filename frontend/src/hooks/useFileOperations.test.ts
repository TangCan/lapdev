import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFileOperations } from './useFileOperations';
import { formatCode, writeFile } from '../services/fileService';

vi.mock('../services/fileService', () => ({
  writeFile: vi.fn(),
  formatCode: vi.fn(),
}));

describe('useFileOperations Hook', () => {
  const mockMarkSaved = vi.fn();
  const mockUpdateTabContent = vi.fn();
  const mockRefreshGitStatus = vi.fn();

  const tabs = [
    {
      id: 'tab-1',
      file: { path: '/workspace/test.ts', name: 'test.ts', type: 'file' },
      content: 'const a = 1',
      isModified: true,
      language: 'typescript',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(formatCode).mockResolvedValue({
      status: 'success',
      data: { formatted: 'const a = 1;' },
    });
    vi.mocked(writeFile).mockResolvedValue({
      status: 'success',
      message: 'ok',
    });
  });

  const renderOp = () =>
    renderHook(() =>
      useFileOperations({
        tabs: tabs as never,
        activeTabId: 'tab-1',
        markSaved: mockMarkSaved,
        updateTabContent: mockUpdateTabContent,
        refreshGitStatus: mockRefreshGitStatus,
      })
    );

  it('[P0] handleFormat 成功时应通过 startTransition 更新编辑器内容', async () => {
    const { result } = renderOp();

    await act(async () => {
      await result.current.handleFormat();
    });

    await waitFor(() => {
      expect(mockUpdateTabContent).toHaveBeenCalledWith('tab-1', 'const a = 1;');
    });
    expect(mockUpdateTabContent).toHaveBeenCalledTimes(1);
  });

  it('[P1] handleFormat 期间 isFormatting 应在完成后恢复为 false', async () => {
    const { result } = renderOp();

    await act(async () => {
      await result.current.handleFormat();
    });

    expect(result.current.isFormatting).toBe(false);
  });

  it('[P1] handleFormat 失败时应调用 showError 设置错误信息', async () => {
    vi.mocked(formatCode).mockResolvedValue({
      status: 'error',
      message: '格式化失败',
    });

    const { result } = renderOp();

    await act(async () => {
      await result.current.handleFormat();
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toBe('格式化失败');
    });
    expect(mockUpdateTabContent).not.toHaveBeenCalled();
  });

  it('[P1] handleFormat 返回 success 但 data 为 null 时应显示错误', async () => {
    vi.mocked(formatCode).mockResolvedValue({
      status: 'success',
      data: null,
    } as never);

    const { result } = renderOp();

    await act(async () => {
      await result.current.handleFormat();
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toBe('格式化失败');
    });
    expect(mockUpdateTabContent).not.toHaveBeenCalled();
    expect(result.current.isFormatting).toBe(false);
  });

  it('[P1] handleFormat formatCode 抛异常时应显示错误信息', async () => {
    vi.mocked(formatCode).mockRejectedValue(new Error('后端格式化崩溃'));

    const { result } = renderOp();

    await act(async () => {
      await result.current.handleFormat();
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toBe('后端格式化崩溃');
    });
    expect(mockUpdateTabContent).not.toHaveBeenCalled();
    expect(result.current.isFormatting).toBe(false);
  });

  it('[P1] handleSave 成功时应调用 markSaved 并刷新 git 状态', async () => {
    const { result } = renderOp();

    await act(async () => {
      await result.current.handleSave();
    });

    await waitFor(() => {
      expect(mockMarkSaved).toHaveBeenCalledWith('tab-1');
    });
    expect(mockRefreshGitStatus).toHaveBeenCalled();
  });

  it('[P2] handleSave 无活动标签或未修改时不执行保存', async () => {
    const { result } = renderHook(() =>
      useFileOperations({
        tabs: tabs as never,
        activeTabId: null,
        markSaved: mockMarkSaved,
        updateTabContent: mockUpdateTabContent,
        refreshGitStatus: mockRefreshGitStatus,
      })
    );

    await act(async () => {
      await result.current.handleSave();
    });

    expect(mockMarkSaved).not.toHaveBeenCalled();
  });
});