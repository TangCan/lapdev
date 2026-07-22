import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { FileInfo, FileTreeResult } from '../../types/file';
import { fetchFileTree } from '../../services/fileService';
import { FileTreeNode } from './FileTreeNode';
import { FileTreeContextMenu } from './FileTreeContextMenu';

export interface FileTreeProps {
  onFileOpen: (file: FileInfo) => void;
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
    console.log('[FileTree] loadFileTree called, isInitialLoad:', isInitialLoad, 'isPausedRef.current:', isPausedRef.current);
    
    if (!isInitialLoad && isPausedRef.current) {
      console.log('[FileTree] loadFileTree skipped because isPaused is true');
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
          console.log('[FileTree] File tree changed, updating state');
          previousTreeRef.current = newTreeJson;
          setFileTree(result.data);
        } else {
          console.log('[FileTree] File tree unchanged, skipping update');
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
    console.log('[FileTree] Initial useEffect, calling loadFileTree(true)');
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
    console.log('[FileTree] handleContextMenu called, file:', file.path);
    setContextMenu({
      file,
      position: { x: event.clientX, y: event.clientY }
    });
    isPausedRef.current = true;
    console.log('[FileTree] isPausedRef set to true');
  };

  const handleCloseContextMenu = () => {
    console.log('[FileTree] handleCloseContextMenu called');
    setContextMenu(null);
    isPausedRef.current = false;
    console.log('[FileTree] isPausedRef set to false, calling loadFileTree()');
    loadFileTree();
  };

  useEffect(() => {
    const handleClick = () => {
      console.log('[FileTree] Global click handler triggered');
      setContextMenu(null);
      isPausedRef.current = false;
    };
    
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

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
      <div className="file-tree-content">
        {fileTree && (
          <FileTreeNode
            file={fileTree}
            depth={0}
            onFileClick={handleFileClick}
            onContextMenu={handleContextMenu}
            expandedPaths={expandedPaths}
            onToggleExpand={handleToggleExpand}
          />
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
