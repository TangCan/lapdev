import { useState, useEffect } from 'react';
import type { FileInfo } from '../../types/file';
import { MockFileTreeNode } from './MockFileTreeNode';
import { FileTreeContextMenu } from './FileTreeContextMenu';

export interface MockFileTreeProps {
  onFileOpen: (file: FileInfo) => void;
}

// Mock data for testing
const mockFileTree: FileInfo = {
  name: 'workspace',
  type: 'directory',
  path: '/workspace',
  children: [
    {
      name: 'src',
      type: 'directory',
      path: '/workspace/src',
      children: [
        {
          name: 'main.ts',
          type: 'file',
          path: '/workspace/src/main.ts',
        },
        {
          name: 'utils.ts',
          type: 'file',
          path: '/workspace/src/utils.ts',
        },
        {
          name: 'components',
          type: 'directory',
          path: '/workspace/src/components',
          children: [
            {
              name: 'App.tsx',
              type: 'file',
              path: '/workspace/src/components/App.tsx',
            },
          ],
        },
      ],
    },
    {
      name: 'test.ts',
      type: 'file',
      path: '/workspace/test.ts',
    },
    {
      name: 'tests',
      type: 'directory',
      path: '/workspace/tests',
      children: [
        {
          name: 'app.test.ts',
          type: 'file',
          path: '/workspace/tests/app.test.ts',
        },
      ],
    },
    {
      name: 'package.json',
      type: 'file',
      path: '/workspace/package.json',
    },
  ],
};

export function MockFileTree({ onFileOpen }: MockFileTreeProps) {
  const [fileTree, setFileTree] = useState<FileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<{
    file: FileInfo;
    position: { x: number; y: number };
  } | null>(null);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setFileTree(mockFileTree);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleFileClick = (file: FileInfo) => {
    if (file.type === 'file') {
      onFileOpen(file);
    }
  };

  const handleContextMenu = (file: FileInfo, event: React.MouseEvent) => {
    setContextMenu({
      file,
      position: { x: event.clientX, y: event.clientY }
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  useEffect(() => {
    const handleClick = () => {
      handleCloseContextMenu();
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

  return (
    <div className="file-tree" data-testid="file-tree" role="tree">
      <div className="file-tree-content">
        <MockFileTreeNode
          file={fileTree}
          depth={0}
          onFileClick={handleFileClick}
          onContextMenu={handleContextMenu}
        />
      </div>
      {contextMenu && (
        <FileTreeContextMenu
          file={contextMenu.file}
          position={contextMenu.position}
          onClose={handleCloseContextMenu}
          onRefresh={() => {}}
        />
      )}
    </div>
  );
}
