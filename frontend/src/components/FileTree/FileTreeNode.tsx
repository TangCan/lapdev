import React, { useMemo } from 'react';
import type { FileInfo } from '../../types/file';
import { useGit } from '../../context/GitContext';

interface FileTreeNodeProps {
  file: FileInfo;
  depth: number;
  onFileClick: (file: FileInfo) => void;
  onContextMenu: (file: FileInfo, event: React.MouseEvent) => void;
  expandedPaths: Set<string>;
  onToggleExpand: (path: string) => void;
}

export function FileTreeNode({ file, depth, onFileClick, onContextMenu, expandedPaths, onToggleExpand }: FileTreeNodeProps) {
  const { status } = useGit();

  const isExpanded = expandedPaths.has(file.path);

  const gitStatus = useMemo(() => {
    if (!status) return null;
    
    const fileChange = status.changes.find(c => c.path === file.path);
    if (fileChange) return fileChange.status;
    
    if (status.untracked.includes(file.path)) return 'untracked';
    
    return null;
  }, [status, file.path]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (file.type === 'directory') {
      onToggleExpand(file.path);
    } else {
      onFileClick(file);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(file, e);
  };

  const paddingStyle = {
    paddingLeft: `${depth * 16}px`
  };

  const icon = file.type === 'directory' 
    ? '📁' 
    : getFileIcon(file.name);

  const getGitStatusIcon = (status: string) => {
    switch (status) {
      case 'modified':
        return { icon: '●', className: 'git-status modified' };
      case 'added':
        return { icon: '●', className: 'git-status added' };
      case 'deleted':
        return { icon: '✕', className: 'git-status deleted' };
      case 'renamed':
        return { icon: '→', className: 'git-status renamed' };
      case 'untracked':
        return { icon: '?', className: 'git-status untracked' };
      default:
        return null;
    }
  };

  const gitIconInfo = gitStatus ? getGitStatusIcon(gitStatus) : null;

  return (
    <div className="file-tree-node">
      <div
        className={`file-item ${file.type}`}
        style={paddingStyle}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        data-testid="file-item"
        data-git-status={gitStatus || undefined}
        role="treeitem"
      >
        <span className="expand-icon" data-testid="folder-expand">
          {file.type === 'directory' && (
            isExpanded ? '▼' : '▶'
          )}
        </span>
        <span className="icon">{icon}</span>
        <span className="name">{file.name}</span>
        {gitIconInfo && (
          <span className={gitIconInfo.className}>{gitIconInfo.icon}</span>
        )}
      </div>
      {file.type === 'directory' && isExpanded && file.children && (
        <div className="children">
          {file.children.map((child) => (
            <FileTreeNode
              key={child.path}
              file={child}
              depth={depth + 1}
              onFileClick={onFileClick}
              onContextMenu={onContextMenu}
              expandedPaths={expandedPaths}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const icons: Record<string, string> = {
    'ts': '📄',
    'tsx': '📃',
    'js': '📄',
    'jsx': '📃',
    'rs': '🦀',
    'py': '🐍',
    'go': '🐹',
    'md': '📝',
    'json': '📋',
    'yaml': '📋',
    'yml': '📋',
    'toml': '📋',
    'txt': '📄',
    'html': '🌐',
    'css': '🎨',
    'scss': '🎨',
    'dockerfile': '🐳',
    'gitignore': '🔒',
    'gitkeep': '📦',
    'cargo': '📦',
    'deno': '🦕',
    'package': '📦',
  };
  
  return icons[ext || ''] || '📄';
}
