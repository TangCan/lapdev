import { useState, useEffect, useDeferredValue, useMemo, useRef } from 'react';
import type { FileSearchResult } from '../domain/File';
import type { FileInfo } from '../shared/types/file';

interface UseFileSearchOptions {
  searchFn: (query: string) => Promise<FileSearchResult[]>;
  debounceMs?: number;
  localFiles?: FileInfo[];
}

export function useFileSearch({ searchFn, debounceMs = 200, localFiles }: UseFileSearchOptions) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FileSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deferredQuery = useDeferredValue(query);

  const isStale = useMemo(() => query !== deferredQuery, [query, deferredQuery]);

  // Debounced deferred query for client-side filtering
  const [debouncedClientQuery, setDebouncedClientQuery] = useState('');
  const clientDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!localFiles) {
      setDebouncedClientQuery('');
      return;
    }

    if (!deferredQuery.trim()) {
      setDebouncedClientQuery('');
      return;
    }

    if (clientDebounceRef.current) {
      clearTimeout(clientDebounceRef.current);
    }

    clientDebounceRef.current = setTimeout(() => {
      setDebouncedClientQuery(deferredQuery);
    }, debounceMs);

    return () => {
      if (clientDebounceRef.current) {
        clearTimeout(clientDebounceRef.current);
      }
    };
  }, [deferredQuery, debounceMs, localFiles]);

  // Client-side filtering when localFiles are available
  const clientResults = useMemo(() => {
    if (!localFiles || !debouncedClientQuery.trim()) return null;

    const lowerQuery = debouncedClientQuery.toLowerCase();
    const matched: FileSearchResult[] = [];

    function searchInTree(files: FileInfo[]) {
      for (const file of files) {
        if (file.name.toLowerCase().includes(lowerQuery)) {
          matched.push({
            path: file.path,
            name: file.name,
            type: file.type,
            matchType: 'name',
          });
        }
        if (file.children && file.children.length > 0) {
          searchInTree(file.children);
        }
      }
    }

    searchInTree(localFiles);
    return matched;
  }, [localFiles, debouncedClientQuery]);

  // Use client results when available, otherwise use state results
  const effectiveResults = clientResults ?? results;

  useEffect(() => {
    if (!deferredQuery.trim()) {
      setResults([]);
      setError(null);
      setIsSearching(false);
      return;
    }

    // Skip API call if we have client-side filtering
    if (localFiles) {
      setIsSearching(false);
      setError(null);
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
  }, [deferredQuery, searchFn, debounceMs, localFiles]);

  return {
    query,
    setQuery,
    results: effectiveResults,
    isSearching,
    isStale,
    error,
    deferredQuery,
  };
}
