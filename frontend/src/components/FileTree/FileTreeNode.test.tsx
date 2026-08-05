import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileTreeNode } from './FileTreeNode';
import type { FileInfo } from '../../types/file';

// Mock GitContext
vi.mock('../../context/GitContext', () => ({
  useGit: () => ({ status: null }),
}));

describe('FileTreeNode - renderName Highlighting', () => {
  const mockOnFileClick = vi.fn();
  const mockOnContextMenu = vi.fn();
  const mockOnToggleExpand = vi.fn();
  const expandedPaths = new Set<string>();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── F8: Multi-match highlighting ───

  it('[P0] 应高亮文件名中所有匹配项', () => {
    const file: FileInfo = { path: '/test_test.ts', name: 'test_test.ts', type: 'file' };
    render(
      <FileTreeNode
        file={file}
        depth={0}
        onFileClick={mockOnFileClick}
        onContextMenu={mockOnContextMenu}
        expandedPaths={expandedPaths}
        onToggleExpand={mockOnToggleExpand}
        highlightMatch="test"
      />
    );

    const highlights = screen.getAllByTestId('file-tree-search-highlight');
    expect(highlights).toHaveLength(2);
    expect(highlights[0]).toHaveTextContent('test');
    expect(highlights[1]).toHaveTextContent('test');
  });

  it('[P1] 无匹配时应显示纯文本', () => {
    const file: FileInfo = { path: '/App.tsx', name: 'App.tsx', type: 'file' };
    render(
      <FileTreeNode
        file={file}
        depth={0}
        onFileClick={mockOnFileClick}
        onContextMenu={mockOnContextMenu}
        expandedPaths={expandedPaths}
        onToggleExpand={mockOnToggleExpand}
        highlightMatch="xyz"
      />
    );

    expect(screen.queryByTestId('file-tree-search-highlight')).not.toBeInTheDocument();
    expect(screen.getByText('App.tsx')).toBeInTheDocument();
  });

  it('[P1] 无 highlightMatch 时应显示纯文本', () => {
    const file: FileInfo = { path: '/App.tsx', name: 'App.tsx', type: 'file' };
    render(
      <FileTreeNode
        file={file}
        depth={0}
        onFileClick={mockOnFileClick}
        onContextMenu={mockOnContextMenu}
        expandedPaths={expandedPaths}
        onToggleExpand={mockOnToggleExpand}
      />
    );

    expect(screen.queryByTestId('file-tree-search-highlight')).not.toBeInTheDocument();
    expect(screen.getByText('App.tsx')).toBeInTheDocument();
  });

  it('[P1] 大小写不敏感匹配', () => {
    const file: FileInfo = { path: '/App.tsx', name: 'App.tsx', type: 'file' };
    render(
      <FileTreeNode
        file={file}
        depth={0}
        onFileClick={mockOnFileClick}
        onContextMenu={mockOnContextMenu}
        expandedPaths={expandedPaths}
        onToggleExpand={mockOnToggleExpand}
        highlightMatch="app"
      />
    );

    const highlights = screen.getAllByTestId('file-tree-search-highlight');
    expect(highlights).toHaveLength(1);
    expect(highlights[0]).toHaveTextContent('App');
  });

  it('[P2] 空字符串 highlightMatch 应显示纯文本', () => {
    const file: FileInfo = { path: '/App.tsx', name: 'App.tsx', type: 'file' };
    render(
      <FileTreeNode
        file={file}
        depth={0}
        onFileClick={mockOnFileClick}
        onContextMenu={mockOnContextMenu}
        expandedPaths={expandedPaths}
        onToggleExpand={mockOnToggleExpand}
        highlightMatch=""
      />
    );

    expect(screen.queryByTestId('file-tree-search-highlight')).not.toBeInTheDocument();
  });

  it('[P2] null highlightMatch 应显示纯文本', () => {
    const file: FileInfo = { path: '/App.tsx', name: 'App.tsx', type: 'file' };
    render(
      <FileTreeNode
        file={file}
        depth={0}
        onFileClick={mockOnFileClick}
        onContextMenu={mockOnContextMenu}
        expandedPaths={expandedPaths}
        onToggleExpand={mockOnToggleExpand}
        highlightMatch={null}
      />
    );

    expect(screen.queryByTestId('file-tree-search-highlight')).not.toBeInTheDocument();
  });

  it('[P1] 匹配在开头时应正确高亮', () => {
    const file: FileInfo = { path: '/test_file.ts', name: 'test_file.ts', type: 'file' };
    render(
      <FileTreeNode
        file={file}
        depth={0}
        onFileClick={mockOnFileClick}
        onContextMenu={mockOnContextMenu}
        expandedPaths={expandedPaths}
        onToggleExpand={mockOnToggleExpand}
        highlightMatch="test"
      />
    );

    const highlights = screen.getAllByTestId('file-tree-search-highlight');
    expect(highlights).toHaveLength(1);
    expect(highlights[0]).toHaveTextContent('test');
  });

  it('[P1] 匹配在末尾时应正确高亮', () => {
    const file: FileInfo = { path: '/my_test.ts', name: 'my_test.ts', type: 'file' };
    render(
      <FileTreeNode
        file={file}
        depth={0}
        onFileClick={mockOnFileClick}
        onContextMenu={mockOnContextMenu}
        expandedPaths={expandedPaths}
        onToggleExpand={mockOnToggleExpand}
        highlightMatch="test"
      />
    );

    const highlights = screen.getAllByTestId('file-tree-search-highlight');
    expect(highlights).toHaveLength(1);
    expect(highlights[0]).toHaveTextContent('test');
  });

  it('[P2] 整个文件名匹配时应高亮全部', () => {
    const file: FileInfo = { path: '/test.ts', name: 'test.ts', type: 'file' };
    render(
      <FileTreeNode
        file={file}
        depth={0}
        onFileClick={mockOnFileClick}
        onContextMenu={mockOnContextMenu}
        expandedPaths={expandedPaths}
        onToggleExpand={mockOnToggleExpand}
        highlightMatch="test.ts"
      />
    );

    const highlights = screen.getAllByTestId('file-tree-search-highlight');
    expect(highlights).toHaveLength(1);
    expect(highlights[0]).toHaveTextContent('test.ts');
  });

  // ─── Directory interaction ───

  it('[P1] 点击目录应触发展开/折叠', () => {
    const dir: FileInfo = { path: '/src', name: 'src', type: 'directory', children: [] };
    render(
      <FileTreeNode
        file={dir}
        depth={0}
        onFileClick={mockOnFileClick}
        onContextMenu={mockOnContextMenu}
        expandedPaths={expandedPaths}
        onToggleExpand={mockOnToggleExpand}
      />
    );

    const item = screen.getByTestId('file-item');
    fireEvent.click(item);
    expect(mockOnToggleExpand).toHaveBeenCalledWith('/src');
  });

  it('[P1] 点击文件应触发 onFileClick', () => {
    const file: FileInfo = { path: '/App.tsx', name: 'App.tsx', type: 'file' };
    render(
      <FileTreeNode
        file={file}
        depth={0}
        onFileClick={mockOnFileClick}
        onContextMenu={mockOnContextMenu}
        expandedPaths={expandedPaths}
        onToggleExpand={mockOnToggleExpand}
      />
    );

    const item = screen.getByTestId('file-item');
    fireEvent.click(item);
    expect(mockOnFileClick).toHaveBeenCalledWith(file);
  });

  it('[P2] highlightMatch 应传递给子节点', () => {
    const dir: FileInfo = {
      path: '/src',
      name: 'src',
      type: 'directory',
      children: [
        { path: '/src/test.ts', name: 'test.ts', type: 'file' },
      ],
    };
    const expanded = new Set<string>(['/src']);

    render(
      <FileTreeNode
        file={dir}
        depth={0}
        onFileClick={mockOnFileClick}
        onContextMenu={mockOnContextMenu}
        expandedPaths={expanded}
        onToggleExpand={mockOnToggleExpand}
        highlightMatch="test"
      />
    );

    const highlights = screen.getAllByTestId('file-tree-search-highlight');
    expect(highlights).toHaveLength(1);
    expect(highlights[0]).toHaveTextContent('test');
  });

  // ─── renderChildren prop ───

  it('[P1] renderChildren={false} 时目录展开后不渲染子节点', () => {
    const directory: FileInfo = {
      name: 'src',
      path: '/src',
      type: 'directory',
      children: [
        { name: 'App.tsx', path: '/src/App.tsx', type: 'file' },
        { name: 'index.ts', path: '/src/index.ts', type: 'file' },
      ],
    };
    const expanded = new Set<string>(['/src']);

    render(
      <FileTreeNode
        file={directory}
        depth={0}
        onFileClick={mockOnFileClick}
        onContextMenu={mockOnContextMenu}
        expandedPaths={expanded}
        onToggleExpand={mockOnToggleExpand}
        renderChildren={false}
      />
    );

    expect(screen.queryByText('App.tsx')).not.toBeInTheDocument();
    expect(screen.queryByText('index.ts')).not.toBeInTheDocument();
  });

  it('[P1] renderChildren={true} (默认) 时目录展开后渲染子节点', () => {
    const directory: FileInfo = {
      name: 'src',
      path: '/src',
      type: 'directory',
      children: [
        { name: 'App.tsx', path: '/src/App.tsx', type: 'file' },
        { name: 'index.ts', path: '/src/index.ts', type: 'file' },
      ],
    };
    const expanded = new Set<string>(['/src']);

    render(
      <FileTreeNode
        file={directory}
        depth={0}
        onFileClick={mockOnFileClick}
        onContextMenu={mockOnContextMenu}
        expandedPaths={expanded}
        onToggleExpand={mockOnToggleExpand}
      />
    );

    expect(screen.getByText('App.tsx')).toBeInTheDocument();
    expect(screen.getByText('index.ts')).toBeInTheDocument();
  });

  it('[P1] isExpandedOverride prop 正确控制展开状态', () => {
    const directory: FileInfo = {
      name: 'src',
      path: '/src',
      type: 'directory',
      children: [
        { name: 'App.tsx', path: '/src/App.tsx', type: 'file' },
        { name: 'index.ts', path: '/src/index.ts', type: 'file' },
      ],
    };
    const emptyExpanded = new Set<string>();

    render(
      <FileTreeNode
        file={directory}
        depth={0}
        onFileClick={mockOnFileClick}
        onContextMenu={mockOnContextMenu}
        expandedPaths={emptyExpanded}
        onToggleExpand={mockOnToggleExpand}
        isExpandedOverride={true}
      />
    );

    // 目录节点排在子节点之前，取第一个 folder-expand 即为目录自身的展开图标
    const expandIcon = screen.getAllByTestId('folder-expand')[0];
    expect(expandIcon).toHaveTextContent('▼');
    // 展开后应渲染子节点
    expect(screen.getByText('App.tsx')).toBeInTheDocument();
  });
});
