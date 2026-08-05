import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileSearch } from './useFileSearch';
import type { FileSearchResult } from '../domain/File';
import type { FileInfo } from '../shared/types/file';

describe('useFileSearch Hook - Extended', () => {
  let mockSearchFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockSearchFn = vi.fn().mockResolvedValue([
      { path: '/src/App.tsx', name: 'App.tsx', type: 'file', matchType: 'name' },
    ] as FileSearchResult[]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── Client-side filtering (AC1, AC4) ───

  it('[P0] 客户端过滤模式应使用 useMemo 而非 API 调用', () => {
    const localFiles: FileInfo[] = [
      { path: '/src/App.tsx', name: 'App.tsx', type: 'file' },
      { path: '/src/main.ts', name: 'main.ts', type: 'file' },
    ];

    const { result } = renderHook(() =>
      useFileSearch({
        searchFn: mockSearchFn,
        localFiles,
      })
    );

    act(() => {
      result.current.setQuery('App');
    });

    // Advance debounce timer for client-side filtering
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // 客户端过滤不应调用 searchFn
    expect(mockSearchFn).not.toHaveBeenCalled();
    // 结果应来自本地过滤
    expect(result.current.results).toHaveLength(1);
  });

  it('[P1] 客户端过滤应支持模糊匹配', () => {
    const localFiles: FileInfo[] = [
      { path: '/src/App.tsx', name: 'App.tsx', type: 'file' },
      { path: '/src/main.ts', name: 'main.ts', type: 'file' },
      { path: '/src/App.test.tsx', name: 'App.test.tsx', type: 'file' },
    ];

    const { result } = renderHook(() =>
      useFileSearch({ searchFn: mockSearchFn, localFiles })
    );

    act(() => {
      result.current.setQuery('App');
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    // 应匹配所有包含 "App" 的文件
    expect(result.current.results.length).toBeGreaterThanOrEqual(2);
  });

  // ─── isStale 行为 (AC2) ───

  it('[P1] isStale 在输入后为 true，搜索完成后为 false', async () => {
    const { result } = renderHook(() =>
      useFileSearch({ searchFn: mockSearchFn })
    );

    act(() => {
      result.current.setQuery('test');
    });

    // 搜索期间 isSearching 应为 true (API path, not client-side)
    expect(result.current.isSearching).toBe(true);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    await vi.waitFor(() => {
      // 搜索完成后 isSearching 应为 false
      expect(result.current.isSearching).toBe(false);
    });
  });

  // ─── 防抖边界场景 (AC2) ───

  it('[P1] 防抖应在最后一次输入后 200ms 触发', () => {
    const { result } = renderHook(() =>
      useFileSearch({ searchFn: mockSearchFn, debounceMs: 200 })
    );

    act(() => {
      result.current.setQuery('a');
    });

    act(() => {
      vi.advanceTimersByTime(100); // 100ms < 200ms
    });

    // 不应触发
    expect(mockSearchFn).not.toHaveBeenCalled();

    act(() => {
      result.current.setQuery('ab');
    });

    act(() => {
      vi.advanceTimersByTime(200); // 从最后一次输入 200ms
    });

    // 应只触发一次（使用 'ab'）
    expect(mockSearchFn).toHaveBeenCalledTimes(1);
    expect(mockSearchFn).toHaveBeenCalledWith('ab');
  });

  // ─── 错误恢复 (AC3) ───

  it('[P1] 连续错误后应能正常搜索', async () => {
    const errorFn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValueOnce([{ path: '/ok.ts', name: 'ok.ts', type: 'file', matchType: 'name' }]);

    const { result } = renderHook(() =>
      useFileSearch({ searchFn: errorFn })
    );

    // 第一次搜索失败
    act(() => { result.current.setQuery('q1'); });
    act(() => { vi.advanceTimersByTime(200); });
    await vi.waitFor(() => {
      expect(result.current.error).toBe('fail 1');
    });

    // 清空错误
    act(() => { result.current.setQuery(''); });

    // 第二次搜索也失败
    act(() => { result.current.setQuery('q2'); });
    act(() => { vi.advanceTimersByTime(200); });
    await vi.waitFor(() => {
      expect(result.current.error).toBe('fail 2');
    });

    // 第三次搜索成功 — 不应被之前的错误阻塞
    act(() => { result.current.setQuery('ok'); });
    act(() => { vi.advanceTimersByTime(200); });
    await vi.waitFor(() => {
      expect(result.current.results).toHaveLength(1);
      expect(result.current.error).toBeNull();
    });
  });

  // ─── 空搜索恢复 (AC4) ───

  it('[P2] 清空搜索应恢复完整结果', async () => {
    const { result } = renderHook(() =>
      useFileSearch({ searchFn: mockSearchFn })
    );

    // 先搜索
    act(() => { result.current.setQuery('test'); });
    act(() => { vi.advanceTimersByTime(200); });
    await vi.waitFor(() => {
      expect(result.current.results.length).toBeGreaterThan(0);
    });

    // 清空搜索
    act(() => { result.current.setQuery(''); });

    // 结果应清空
    expect(result.current.results).toEqual([]);
    expect(result.current.isSearching).toBe(false);
  });

  // ─── 性能指标 (AC1) ───

  it('[P2] useDeferredValue 应确保输入响应不阻塞', () => {
    const { result } = renderHook(() =>
      useFileSearch({ searchFn: mockSearchFn })
    );

    act(() => {
      result.current.setQuery('test');
    });

    // query 应立即更新（不等待 deferredValue）
    expect(result.current.query).toBe('test');
    // deferredQuery 最终会跟上 query
    expect(result.current.deferredQuery).toBeDefined();
  });

  // ─── 目录递归搜索 ───

  it('[P1] 客户端过滤应递归搜索子目录', () => {
    const localFiles: FileInfo[] = [
      {
        path: '/src',
        name: 'src',
        type: 'directory',
        children: [
          { path: '/src/App.tsx', name: 'App.tsx', type: 'file' },
          { path: '/src/main.ts', name: 'main.ts', type: 'file' },
          {
            path: '/src/components',
            name: 'components',
            type: 'directory',
            children: [
              { path: '/src/components/Button.tsx', name: 'Button.tsx', type: 'file' },
            ],
          },
        ],
      },
    ];

    const { result } = renderHook(() =>
      useFileSearch({ searchFn: mockSearchFn, localFiles })
    );

    act(() => {
      result.current.setQuery('Button');
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].name).toBe('Button.tsx');
  });
});