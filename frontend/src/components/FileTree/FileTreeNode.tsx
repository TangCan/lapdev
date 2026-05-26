import { useState } from 'react';
import type { FileInfo } from '../../types/file';

interface FileTreeNodeProps {
  file: FileInfo;
  depth: number;
  onFileClick: (file: FileInfo) => void;
  onContextMenu: (file: FileInfo, event: React.MouseEvent) => void;
}

export function FileTreeNode({ file, depth, onFileClick, onContextMenu }: FileTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (file.type === 'directory') {
      setIsExpanded(!isExpanded);
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

  return (
    <div className="file-tree-node">
      <div
        className={`file-item ${file.type}`}
        style={paddingStyle}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        data-testid="file-item"
      >
        <span className="expand-icon" data-testid="folder-expand">
          {file.type === 'directory' && (
            isExpanded ? '▼' : '▶'
          )}
        </span>
        <span className="icon">{icon}</span>
        <span className="name">{file.name}</span>
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