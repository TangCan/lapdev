/**
 * FileTree Component
 * Displays directory structure with real-time updates
 */

import React, { useState, useEffect } from 'react';
import { Folder, FolderOpen, File } from 'lucide-react';

interface FileTreeItem {
  name: string;
  path: string;
  type: 'directory' | 'file';
  children?: FileTreeItem[];
  size?: number;
  lastModified?: string;
}

interface FileTreeProps {
  rootPath?: string;
  onFileSelect?: (path: string) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({ 
  rootPath = '/workspace',
  onFileSelect 
}) => {
  const [tree, setTree] = useState<FileTreeItem[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadTree(rootPath);
  }, [rootPath]);

  const loadTree = async (path: string) => {
    try {
      const response = await fetch(`/api/v1/files/tree?path=${encodeURIComponent(path)}`);
      const data = await response.json();
      if (data.status === 'success') {
        setTree(data.data.children || []);
      }
    } catch (error) {
      console.error('Failed to load file tree:', error);
    }
  };

  const toggleExpand = (path: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpanded(newExpanded);
  };

  const renderItem = (item: FileTreeItem, depth: number = 0) => {
    const isExpanded = expanded.has(item.path);
    const Icon = item.type === 'directory' 
      ? (isExpanded ? FolderOpen : Folder) 
      : File;

    return (
      <div key={item.path}>
        <div
          className="flex items-center gap-2 px-2 py-1 hover:bg-gray-700 cursor-pointer text-sm"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (item.type === 'directory') {
              toggleExpand(item.path);
            } else {
              onFileSelect?.(item.path);
            }
          }}
        >
          <Icon size={16} className="text-blue-400" />
          <span className={item.type === 'file' ? 'text-gray-300' : 'text-blue-300'}>
            {item.name}
          </span>
        </div>
        {item.type === 'directory' && isExpanded && item.children && (
          <div>
            {item.children.map(child => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full bg-gray-800 text-white overflow-auto">
      <div className="px-3 py-2 bg-gray-700 font-semibold text-sm">
        {rootPath}
      </div>
      <div className="py-1">
        {tree.map(item => renderItem(item))}
      </div>
    </div>
  );
};

export default FileTree;