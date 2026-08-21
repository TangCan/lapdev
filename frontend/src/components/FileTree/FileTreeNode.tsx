import React from 'react';
import type { FileInfo } from '../../types/file';
import { useGitStore } from '../../stores/gitStore';

interface FileTreeNodeProps {
  file: FileInfo;
  depth: number;
  onFileClick: (file: FileInfo) => void;
  onContextMenu: (file: FileInfo, event: React.MouseEvent) => void;
  expandedPaths: Set<string>;
  onToggleExpand: (path: string) => void;
  highlightMatch?: string | null;
  /** 是否渲染子节点。虚拟滚动模式下为 false，由 VirtualList 管理子节点渲染 */
  renderChildren?: boolean;
  /** 虚拟滚动模式下直接传入展开状态，避免 Set 引用变化导致 React.memo 失效 */
  isExpandedOverride?: boolean;
}

export const FileTreeNode = React.memo(function FileTreeNode({
  file,
  depth,
  onFileClick,
  onContextMenu,
  expandedPaths,
  onToggleExpand,
  highlightMatch,
  renderChildren = true,
  isExpandedOverride,
}: FileTreeNodeProps) {
  const { status } = useGitStore();

  const isExpanded = isExpandedOverride ?? expandedPaths.has(file.path);

  const gitStatus = !status
    ? null
    : (status.changes.find(c => c.path === file.path)?.status
        ?? (status.untracked.includes(file.path) ? 'untracked' : null));

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

  const renderName = (name: string, match: string | null | undefined) => {
    if (!match || match.length === 0) {
      return <span className="name">{name}</span>;
    }

    const lowerName = name.toLowerCase();
    const lowerMatch = match.toLowerCase();

    if (!lowerName.includes(lowerMatch)) {
      return <span className="name">{name}</span>;
    }

    // Highlight ALL matches, not just the first
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let matchIndex = lowerName.indexOf(lowerMatch, lastIndex);

    while (matchIndex !== -1) {
      if (matchIndex > lastIndex) {
        parts.push(name.substring(lastIndex, matchIndex));
      }
      parts.push(
        <span
          key={matchIndex}
          className="file-tree-search-highlight"
          data-testid="file-tree-search-highlight"
        >
          {name.substring(matchIndex, matchIndex + match.length)}
        </span>
      );
      lastIndex = matchIndex + match.length;
      matchIndex = lowerName.indexOf(lowerMatch, lastIndex);
    }

    if (lastIndex < name.length) {
      parts.push(name.substring(lastIndex));
    }

    return <span className="name">{parts}</span>;
  };

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
        {renderName(file.name, highlightMatch)}
        {gitIconInfo && (
          <span className={gitIconInfo.className}>{gitIconInfo.icon}</span>
        )}
      </div>
      {renderChildren && file.type === 'directory' && isExpanded && file.children && (
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
              highlightMatch={highlightMatch}
            />
          ))}
        </div>
      )}
    </div>
  );
});

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