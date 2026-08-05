import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { FileInfo, FileTreeResult } from '../../types/file';
import { fetchFileTree } from '../../services/fileService';
import { FileTreeNode } from './FileTreeNode';
import { FileTreeContextMenu } from './FileTreeContextMenu';
import { FileTreeSearch } from './FileTreeSearch';
import { useFileSearch } from '../../hooks/useFileSearch';

export interface FileTreeProps {
  onFileOpen: (file: FileInfo) => void;
}

function filterTree(fileTree: FileInfo | null, matchingPaths: Set<string>): FileInfo | null {
  if (!fileTree) return null;

  const filterNode = (node: FileInfo): FileInfo | null => {
    if (node.type === 'file') {
      return matchingPaths.has(node.path) ? node : null;
    }

    if (node.type === 'directory') {
      const filteredChildren: FileInfo[] = [];
      if (node.children) {
        for (const child of node.children) {
          const filtered = filterNode(child);
          if (filtered) {
            filteredChildren.push(filtered);
          }
        }
      }

      // Keep directory if it has matching children or if it itself matches
      if (filteredChildren.length > 0 || matchingPaths.has(node.path)) {
        return {
          ...node,
          children: filteredChildren.length > 0 ? filteredChildren : undefined,
        };
      }

      return null;
    }

    return null;
  };

  return filterNode(fileTree);
}

/** Collect all ancestor directory paths for the given set of matched file paths. */
function collectAncestorPaths(fileTree: FileInfo | null, matchingPaths: Set<string>): Set<string> {
  const ancestors = new Set<string>();
  if (!fileTree) return ancestors;

  const walk = (node: FileInfo): boolean => {
    let hasMatch = matchingPaths.has(node.path);

    if (node.children) {
      for (const child of node.children) {
        if (walk(child)) {
          hasMatch = true;
        }
      }
    }

    if (hasMatch && node.type === 'directory') {
      ancestors.add(node.path);
    }

    return hasMatch;
  };

  walk(fileTree);
  return ancestors;
}

export function FileTree({ onFileOpen }: FileTreeProps) {
  const [fileTree, setFileTree] = useState<FileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{
    file: FileInfo;
    position: { x: number; y: number };
  } | null>(null);
  const isPausedRef = useRef(false);
  const previousTreeRef = useRef<string | null>(null);

  const loadFileTree = useCallback(async (isInitialLoad = false) => {
    if (!isInitialLoad && isPausedRef.current) {
      return;
    }

    if (isInitialLoad) {
      setLoading(true);
      setError(null);
    }

    try {
      const result: FileTreeResult = await fetchFileTree('/workspace');

      if (result.status === 'success' && result.data) {
        const newTreeJson = JSON.stringify(result.data);

        if (newTreeJson !== previousTreeRef.current) {
          previousTreeRef.current = newTreeJson;
          setFileTree(result.data);
        }
      } else if (isInitialLoad) {
        setError(result.message || 'Failed to load file tree');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to server';
      if (isInitialLoad) {
        setError(errorMessage);
      }
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- TODO: Refactor with useEffectEvent in EPI5
    loadFileTree(true);

    const FILE_TREE_REFRESH_INTERVAL = 5000;
    const interval = setInterval(() => loadFileTree(false), FILE_TREE_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [loadFileTree]);

  const handleFileClick = (file: FileInfo) => {
    if (file.type === 'file') {
      onFileOpen(file);
    }
  };

  const handleToggleExpand = (path: string) => {
    setExpandedPaths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const handleContextMenu = (file: FileInfo, event: React.MouseEvent) => {
    setContextMenu({
      file,
      position: { x: event.clientX, y: event.clientY }
    });
    isPausedRef.current = true;
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
    isPausedRef.current = false;
    loadFileTree();
  };

  useEffect(() => {
    const handleClick = () => {
      setContextMenu(null);
      isPausedRef.current = false;
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Search integration
  // F5: Stabilize localFiles reference with useMemo to avoid unnecessary re-renders
  const stableLocalFiles = useMemo(() => {
    return fileTree ? [fileTree] : undefined;
  }, [fileTree]);

  const searchAdapter = useCallback(async (_query: string) => {
    return [];
  }, []);

  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results: searchResults,
    isSearching,
    isStale,
    error: searchError,
    deferredQuery: searchDeferredQuery,
  } = useFileSearch({
    searchFn: searchAdapter,
    debounceMs: 200,
    localFiles: stableLocalFiles,
  });

  const hasSearch = searchQuery.trim().length > 0;

  // F1: Auto-expand ancestor directories of matched files during search
  const effectiveExpandedPaths = useMemo(() => {
    if (!hasSearch || !fileTree) return expandedPaths;
    const matchingPaths = new Set(searchResults.map(r => r.path));
    if (matchingPaths.size === 0) return expandedPaths;
    const ancestors = collectAncestorPaths(fileTree, matchingPaths);
    return new Set([...expandedPaths, ...ancestors]);
  }, [expandedPaths, hasSearch, fileTree, searchResults]);

  const filteredTree = useMemo(() => {
    if (!hasSearch) return fileTree;
    const matchingPaths = new Set(searchResults.map(r => r.path));
    if (matchingPaths.size === 0) return null;
    return filterTree(fileTree, matchingPaths);
  }, [fileTree, searchResults, hasSearch]);

  // F4: Use deferredQuery (not raw searchQuery) so highlight matches the displayed filtered tree
  const highlightMatch = useMemo(() => {
    if (!hasSearch) return null;
    return searchDeferredQuery.toLowerCase();
  }, [searchDeferredQuery, hasSearch]);

  // F6: Don't show "no results" while searching or stale
  const showNoResults = hasSearch && !filteredTree && !isSearching && !isStale;

  if (loading) {
    return (
      <div className="file-tree" data-testid="file-tree" role="tree">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="file-tree" data-testid="file-tree" role="tree">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="file-tree" data-testid="file-tree" role="tree">
      <div className="file-tree-header">
        <h3>文件树</h3>
        <button onClick={() => loadFileTree()} className="refresh-button">
          🔄
        </button>
      </div>

      <FileTreeSearch
        query={searchQuery}
        onQueryChange={setSearchQuery}
        isSearching={isSearching}
        isStale={isStale}
        error={searchError}
        resultCount={hasSearch ? searchResults.length : undefined}
      />

      <div className="file-tree-content">
        {filteredTree && (
          <FileTreeNode
            file={filteredTree}
            depth={0}
            onFileClick={handleFileClick}
            onContextMenu={handleContextMenu}
            expandedPaths={effectiveExpandedPaths}
            onToggleExpand={handleToggleExpand}
            highlightMatch={highlightMatch}
          />
        )}
        {showNoResults && (
          <div className="file-tree-no-results" data-testid="file-tree-no-results">
            没有找到匹配的文件
          </div>
        )}
      </div>

      {contextMenu && (
        <FileTreeContextMenu
          file={contextMenu.file}
          position={contextMenu.position}
          onClose={handleCloseContextMenu}
          onRefresh={loadFileTree}
        />
      )}
    </div>
  );
}
