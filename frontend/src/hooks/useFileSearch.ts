import { useState, useEffect, useDeferredValue, useMemo } from 'react';
import type { FileSearchResult } from '../domain/File';

interface UseFileSearchOptions {
  searchFn: (query: string) => Promise<FileSearchResult[]>;
  debounceMs?: number;
}

/**
 * 文件搜索并发优化 Hook
 * 使用 useDeferredValue 实现响应式搜索，避免输入卡顿
 */
export function useFileSearch({ searchFn, debounceMs = 200 }: UseFileSearchOptions) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FileSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 使用 useDeferredValue 延迟搜索查询
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    if (!deferredQuery.trim()) {
      return;
    }

    setIsSearching(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const searchResults = await searchFn(deferredQuery);
        setResults(searchResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : '搜索失败');
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [deferredQuery, searchFn, debounceMs]);

  const isStale = useMemo(() => query !== deferredQuery, [query, deferredQuery]);

  return {
    query,
    setQuery,
    results,
    isSearching: isSearching || isStale,
    error,
    deferredQuery,
  };
}
