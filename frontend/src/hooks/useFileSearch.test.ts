import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileSearch } from './useFileSearch';
import type { FileSearchResult } from '../domain/File';

describe('useFileSearch Hook', () => {
  let mockSearchFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockSearchFn = vi.fn().mockResolvedValue([
      { path: '/src/App.tsx', name: 'App.tsx', type: 'file', matchType: 'name' },
      { path: '/src/main.ts', name: 'main.ts', type: 'file', matchType: 'name' },
    ] as FileSearchResult[]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('[P0] 初始状态应返回空结果和空闲状态', () => {
    const { result } = renderHook(() =>
      useFileSearch({ searchFn: mockSearchFn })
    );

    expect(result.current.results).toEqual([]);
    expect(result.current.isSearching).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.query).toBe('');
  });

  it('[P0] setQuery 应更新 query 状态', () => {
    const { result } = renderHook(() =>
      useFileSearch({ searchFn: mockSearchFn })
    );

    act(() => {
      result.current.setQuery('test query');
    });

    expect(result.current.query).toBe('test query');
  });

  it('[P0] 应暴露 setQuery 函数', () => {
    const { result } = renderHook(() =>
      useFileSearch({ searchFn: mockSearchFn })
    );

    expect(typeof result.current.setQuery).toBe('function');
  });

  it('[P1] 搜索应在防抖延迟后触发', () => {
    const { result } = renderHook(() =>
      useFileSearch({ searchFn: mockSearchFn })
    );

    act(() => {
      result.current.setQuery('test');
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(mockSearchFn).toHaveBeenCalledWith('test');
    expect(mockSearchFn).toHaveBeenCalledTimes(1);
  });

  it('[P1] 搜索期间 isSearching 应为 true', () => {
    const { result } = renderHook(() =>
      useFileSearch({ searchFn: mockSearchFn })
    );

    act(() => {
      result.current.setQuery('test');
    });

    expect(result.current.isSearching).toBe(true);
  });

  it('[P1] 搜索完成后应显示结果', async () => {
    const { result } = renderHook(() =>
      useFileSearch({ searchFn: mockSearchFn })
    );

    act(() => {
      result.current.setQuery('App');
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    await vi.waitFor(() => {
      expect(result.current.results).toHaveLength(2);
    });
  });

  it('[P1] 搜索错误应设置 error 信息', async () => {
    const errorFn = vi.fn().mockRejectedValue(new Error('Search failed'));

    const { result } = renderHook(() =>
      useFileSearch({ searchFn: errorFn })
    );

    act(() => {
      result.current.setQuery('error');
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    await vi.waitFor(() => {
      expect(result.current.error).toBe('Search failed');
    });
  });

  it('[P1] 防抖应防止快速连续搜索', () => {
    const { result } = renderHook(() =>
      useFileSearch({ searchFn: mockSearchFn, debounceMs: 300 })
    );

    act(() => {
      result.current.setQuery('test');
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(mockSearchFn).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(mockSearchFn).toHaveBeenCalledTimes(1);
  });

  it('[P2] 空查询不应触发搜索', () => {
    const { result } = renderHook(() =>
      useFileSearch({ searchFn: mockSearchFn })
    );

    act(() => {
      result.current.setQuery('');
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(mockSearchFn).not.toHaveBeenCalled();
  });

  it('[P2] 仅空白字符的查询不应触发搜索', () => {
    const { result } = renderHook(() =>
      useFileSearch({ searchFn: mockSearchFn })
    );

    act(() => {
      result.current.setQuery('   ');
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(mockSearchFn).not.toHaveBeenCalled();
  });

  it('[P2] 非 Error 对象的异常应返回默认错误信息', async () => {
    const errorFn = vi.fn().mockRejectedValue('string error');

    const { result } = renderHook(() =>
      useFileSearch({ searchFn: errorFn })
    );

    act(() => {
      result.current.setQuery('test');
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    await vi.waitFor(() => {
      expect(result.current.error).toBe('搜索失败');
    });
  });

  it('[P2] deferredQuery 应与 query 独立', () => {
    const { result } = renderHook(() =>
      useFileSearch({ searchFn: mockSearchFn })
    );

    act(() => {
      result.current.setQuery('test query');
    });

    expect(result.current.query).toBe('test query');
    expect(result.current.deferredQuery).toBeDefined();
  });

  it('[P2] 搜索完成后 isSearching 应恢复为 false', async () => {
    const { result } = renderHook(() =>
      useFileSearch({ searchFn: mockSearchFn })
    );

    act(() => {
      result.current.setQuery('test');
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    await vi.waitFor(() => {
      expect(result.current.isSearching).toBe(false);
    });
  });

  it('[P2] 错误发生时结果应被清空', async () => {
    const errorFn = vi.fn().mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() =>
      useFileSearch({ searchFn: errorFn })
    );

    act(() => {
      result.current.setQuery('test');
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    await vi.waitFor(() => {
      expect(result.current.results).toEqual([]);
      expect(result.current.error).toBe('fail');
    });
  });
});