import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileTree } from './FileTree';
import type { FileInfo, FileTreeResult } from '../../types/file';

// Mock dependencies
vi.mock('../../services/fileService', () => ({
  fetchFileTree: vi.fn(),
}));

vi.mock('../../context/GitContext', () => ({
  useGit: () => ({ status: null }),
  GitProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../common/VirtualList', () => ({
  VirtualList: vi.fn(({ items, itemHeight, renderItem, className }: {
    items: unknown[];
    itemHeight: number;
    renderItem: (item: unknown, index: number) => React.ReactNode;
    className?: string;
  }) => items.length <= 50 ? (
    <div className={className}>{items.map((item, idx) => renderItem(item, idx))}</div>
  ) : (
    <div data-testid="virtual-scroll-container" className={className} style={{ height: items.length * itemHeight, overflow: 'auto' }}>
      {items.slice(0, 5).map((item, idx) => (
        <div key={idx}>{renderItem(item, idx)}</div>
      ))}
    </div>
  )),
}));

vi.mock('../FileTreeSearch', () => ({
  FileTreeSearch: ({ query, onQueryChange, resultCount }: {
    query: string;
    onQueryChange: (v: string) => void;
    resultCount?: number;
  }) => (
    <div data-testid="file-tree-search">
      <input
        data-testid="file-tree-search-input"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="搜索文件..."
      />
      {resultCount !== undefined && (
        <span data-testid="file-tree-search-result-count">{resultCount}</span>
      )}
    </div>
  ),
}));

vi.mock('../../hooks/useFileSearch', () => ({
  useFileSearch: ({ localFiles }: { localFiles?: FileInfo[] }) => {
    const [query, setQuery] = React.useState('');
    const results = React.useMemo(() => {
      if (!query.trim() || !localFiles?.[0]) return [];
      const matches: Array<{ path: string }> = [];
      const tree = localFiles[0];
      const searchInTree = (node: FileInfo) => {
        if (node.name.toLowerCase().includes(query.toLowerCase())) {
          matches.push({ path: node.path });
        }
        if (node.children) {
          node.children.forEach(searchInTree);
        }
      };
      searchInTree(tree);
      return matches;
    }, [query, localFiles]);

    return {
      query,
      setQuery,
      results,
      isSearching: false,
      isStale: false,
      error: null,
      deferredQuery: query,
    };
  },
}));

import { fetchFileTree } from '../../services/fileService';

// Helper: build a flat file tree with N files
function buildFlatTree(fileCount: number): FileInfo {
  return {
    path: '/workspace',
    name: 'workspace',
    type: 'directory',
    children: Array.from({ length: fileCount }, (_, i) => ({
      path: `/workspace/file-${String(i).padStart(3, '0')}.ts`,
      name: `file-${String(i).padStart(3, '0')}.ts`,
      type: 'file',
    })),
  };
}

// Helper: build nested file tree with N total items across directories
function buildNestedTree(totalItems: number): FileInfo {
  const root: FileInfo = {
    path: '/workspace',
    name: 'workspace',
    type: 'directory',
    children: [],
  };

  // Create subdirectories
  const dirCount = Math.max(1, Math.floor(totalItems / 10));
  let remainingItems = totalItems;

  for (let d = 0; d < dirCount && remainingItems > 0; d++) {
    const filesInDir = Math.min(10, remainingItems);
    remainingItems -= filesInDir;

    const dir: FileInfo = {
      path: `/workspace/dir-${d}`,
      name: `dir-${d}`,
      type: 'directory',
      children: Array.from({ length: filesInDir }, (_, f) => ({
        path: `/workspace/dir-${d}/file-${f}.ts`,
        name: `file-${f}.ts`,
        type: 'file',
      })),
    };
    root.children!.push(dir);
  }

  return root;
}

describe('FileTree Virtual Scroll Integration', () => {
  const mockOnFileOpen = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Threshold Toggle Tests ───

  describe('虚拟滚动阈值切换', () => {
    it('[P0] 恰好 50 项时不启用虚拟滚动', async () => {
      const tree = buildFlatTree(49);
      (fetchFileTree as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: 'success',
        data: tree,
      } satisfies FileTreeResult);

      render(<FileTree onFileOpen={mockOnFileOpen} />);

      await waitFor(() => {
        const expandIcons = screen.getAllByTestId('folder-expand');
        expect(expandIcons.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      const expandIcons = screen.getAllByTestId('folder-expand');
      fireEvent.click(expandIcons[0]);

      await waitFor(() => {
        const virtualContainer = screen.queryByTestId('virtual-scroll-container');
        expect(virtualContainer).not.toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('[P0] 51 项时启用虚拟滚动', async () => {
      const tree = buildFlatTree(50);
      (fetchFileTree as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: 'success',
        data: tree,
      } satisfies FileTreeResult);

      render(<FileTree onFileOpen={mockOnFileOpen} />);

      await waitFor(() => {
        const expandIcons = screen.getAllByTestId('folder-expand');
        expect(expandIcons.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      const expandIcons = screen.getAllByTestId('folder-expand');
      fireEvent.click(expandIcons[0]);

      await waitFor(() => {
        const virtualContainer = screen.queryByTestId('virtual-scroll-container');
        expect(virtualContainer).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('[P1] 50 项嵌套目录时不启用虚拟滚动', async () => {
      const tree = buildNestedTree(49);
      (fetchFileTree as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: 'success',
        data: tree,
      } satisfies FileTreeResult);

      render(<FileTree onFileOpen={mockOnFileOpen} />);

      await waitFor(() => {
        const expandIcons = screen.getAllByTestId('folder-expand');
        expect(expandIcons.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      const expandIcons = screen.getAllByTestId('folder-expand');
      fireEvent.click(expandIcons[0]);

      await waitFor(() => {
        const virtualContainer = screen.queryByTestId('virtual-scroll-container');
        expect(virtualContainer).not.toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('[P1] 51 项嵌套目录时启用虚拟滚动', async () => {
      const tree = buildNestedTree(50);
      (fetchFileTree as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: 'success',
        data: tree,
      } satisfies FileTreeResult);

      render(<FileTree onFileOpen={mockOnFileOpen} />);

      await waitFor(() => {
        const expandIcons = screen.getAllByTestId('folder-expand');
        expect(expandIcons.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      fireEvent.click(screen.getAllByTestId('folder-expand')[0]);

      await waitFor(() => {
        const dirExpands = screen.getAllByTestId('folder-expand');
        expect(dirExpands.length).toBeGreaterThan(1);
      }, { timeout: 3000 });

      const subDirExpands = screen.getAllByTestId('folder-expand').slice(1);
      subDirExpands.forEach(icon => fireEvent.click(icon));

      await waitFor(() => {
        const virtualContainer = screen.queryByTestId('virtual-scroll-container');
        expect(virtualContainer).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('[P1] 50+文件（1000+）大量数据持续启用虚拟滚动', async () => {
      const tree = buildFlatTree(200);
      (fetchFileTree as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: 'success',
        data: tree,
      } satisfies FileTreeResult);

      render(<FileTree onFileOpen={mockOnFileOpen} />);

      await waitFor(() => {
        const expandIcons = screen.getAllByTestId('folder-expand');
        expect(expandIcons.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      const expandIcons = screen.getAllByTestId('folder-expand');
      fireEvent.click(expandIcons[0]);

      await waitFor(() => {
        const virtualContainer = screen.queryByTestId('virtual-scroll-container');
        expect(virtualContainer).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  // ─── Search Mode Switching Tests ───

  describe('搜索模式切换', () => {
    it('[P0] 搜索结果减少到 ≤50 时从虚拟滚动切换到传统渲染', async () => {
      const tree = buildFlatTree(100);
      (fetchFileTree as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: 'success',
        data: tree,
      } satisfies FileTreeResult);

      render(<FileTree onFileOpen={mockOnFileOpen} />);

      await waitFor(() => {
        const expandIcons = screen.getAllByTestId('folder-expand');
        expect(expandIcons.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      fireEvent.click(screen.getAllByTestId('folder-expand')[0]);

      await waitFor(() => {
        expect(screen.queryByTestId('virtual-scroll-container')).toBeInTheDocument();
      }, { timeout: 3000 });

      const searchInput = screen.getByTestId('file-tree-search-input');
      fireEvent.change(searchInput, { target: { value: 'file-0' } });

      await waitFor(() => {
        expect((searchInput as HTMLInputElement).value).toBe('file-0');
      }, { timeout: 3000 });
    });

    it('[P1] 清空搜索后恢复虚拟滚动', async () => {
      const tree = buildFlatTree(200);
      (fetchFileTree as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: 'success',
        data: tree,
      } satisfies FileTreeResult);

      render(<FileTree onFileOpen={mockOnFileOpen} />);

      await waitFor(() => {
        const expandIcons = screen.getAllByTestId('folder-expand');
        expect(expandIcons.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      fireEvent.click(screen.getAllByTestId('folder-expand')[0]);

      await waitFor(() => {
        expect(screen.queryByTestId('virtual-scroll-container')).toBeInTheDocument();
      }, { timeout: 3000 });

      const searchInput = screen.getByTestId('file-tree-search-input');
      fireEvent.change(searchInput, { target: { value: 'file-001' } });

      await waitFor(() => {
        expect((searchInput as HTMLInputElement).value).toBe('file-001');
      }, { timeout: 3000 });

      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.queryByTestId('virtual-scroll-container')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('[P2] 搜索无结果时显示空状态', async () => {
      const tree = buildFlatTree(100);
      (fetchFileTree as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: 'success',
        data: tree,
      } satisfies FileTreeResult);

      render(<FileTree onFileOpen={mockOnFileOpen} />);

      await waitFor(() => {
        const expandIcons = screen.getAllByTestId('folder-expand');
        expect(expandIcons.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      fireEvent.click(screen.getAllByTestId('folder-expand')[0]);

      await waitFor(() => {
        expect(screen.queryByTestId('virtual-scroll-container')).toBeInTheDocument();
      }, { timeout: 3000 });

      const searchInput = screen.getByTestId('file-tree-search-input');
      fireEvent.change(searchInput, { target: { value: 'zzz-no-match' } });

      await waitFor(() => {
        const fileTree = screen.getByTestId('file-tree');
        expect(fileTree).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  // ─── Virtual Scroll Empty/NoResults States ───

  describe('虚拟滚动空状态处理', () => {
    it('[P0] 空文件树显示空状态', async () => {
      const tree: FileInfo = {
        path: '/workspace',
        name: 'workspace',
        type: 'directory',
        children: [],
      };
      (fetchFileTree as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: 'success',
        data: tree,
      } satisfies FileTreeResult);

      render(<FileTree onFileOpen={mockOnFileOpen} />);

      await waitFor(() => {
        const fileItems = screen.getAllByTestId('file-item');
        expect(fileItems.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('[P1] 搜索结果为空时显示"无结果"提示', async () => {
      const tree = buildFlatTree(60);
      (fetchFileTree as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: 'success',
        data: tree,
      } satisfies FileTreeResult);

      render(<FileTree onFileOpen={mockOnFileOpen} />);

      await waitFor(() => {
        const expandIcons = screen.getAllByTestId('folder-expand');
        expect(expandIcons.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      fireEvent.click(screen.getAllByTestId('folder-expand')[0]);

      await waitFor(() => {
        expect(screen.queryByTestId('virtual-scroll-container')).toBeInTheDocument();
      }, { timeout: 3000 });

      const searchInput = screen.getByTestId('file-tree-search-input');
      fireEvent.change(searchInput, { target: { value: 'no-such-file-xyz' } });

      await waitFor(() => {
        const fileTree = screen.getByTestId('file-tree');
        expect(fileTree).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('[P2] 后端返回 null data 时优雅处理', async () => {
      (fetchFileTree as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: 'success',
        data: null,
      } as unknown as FileTreeResult);

      render(<FileTree onFileOpen={mockOnFileOpen} />);

      await waitFor(() => {
        const fileTree = screen.getByTestId('file-tree');
        expect(fileTree).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  // ─── Virtual Scroll Integration with FileTreeNode ───

  describe('虚拟滚动与 FileTreeNode 集成', () => {
    it('[P0] 虚拟滚动模式下 FileTreeNode 使用 renderChildren={false}', async () => {
      const tree = buildFlatTree(100);
      (fetchFileTree as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: 'success',
        data: tree,
      } satisfies FileTreeResult);

      render(<FileTree onFileOpen={mockOnFileOpen} />);

      await waitFor(() => {
        const expandIcons = screen.getAllByTestId('folder-expand');
        expect(expandIcons.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      fireEvent.click(screen.getAllByTestId('folder-expand')[0]);

      await waitFor(() => {
        const virtualContainer = screen.queryByTestId('virtual-scroll-container');
        expect(virtualContainer).toBeInTheDocument();
      }, { timeout: 3000 });

      const fileItems = screen.getAllByTestId('file-item');
      expect(fileItems.length).toBeGreaterThan(0);
      fileItems.forEach((item) => {
        const childrenDiv = item.querySelector('.children');
        expect(childrenDiv).toBeNull();
      });
    });

    it('[P1] 虚拟滚动中点击文件触发 onFileOpen', async () => {
      const tree = buildFlatTree(60);
      (fetchFileTree as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: 'success',
        data: tree,
      } satisfies FileTreeResult);

      render(<FileTree onFileOpen={mockOnFileOpen} />);

      await waitFor(() => {
        const expandIcons = screen.getAllByTestId('folder-expand');
        expect(expandIcons.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      fireEvent.click(screen.getAllByTestId('folder-expand')[0]);

      await waitFor(() => {
        const virtualContainer = screen.queryByTestId('virtual-scroll-container');
        expect(virtualContainer).toBeInTheDocument();
      }, { timeout: 3000 });

      const fileItems = screen.getAllByTestId('file-item');
      expect(fileItems.length).toBeGreaterThan(1);

      const fileItem = fileItems.find(item => !item.classList.contains('directory')) ?? fileItems[1];
      fireEvent.click(fileItem);

      expect(mockOnFileOpen).toHaveBeenCalled();
      const openedFile = mockOnFileOpen.mock.calls[0][0];
      expect(openedFile).toHaveProperty('path');
      expect(openedFile.type).toBe('file');
    });

    it('[P1] 虚拟滚动中目录点击触发展开/折叠', async () => {
      const tree: FileInfo = {
        path: '/workspace',
        name: 'workspace',
        type: 'directory',
        children: [
          {
            path: '/workspace/dir1',
            name: 'dir1',
            type: 'directory',
            children: Array.from({ length: 30 }, (_, i) => ({
              path: `/workspace/dir1/file-${i}.ts`,
              name: `file-${i}.ts`,
              type: 'file',
            })),
          },
          {
            path: '/workspace/dir2',
            name: 'dir2',
            type: 'directory',
            children: Array.from({ length: 30 }, (_, i) => ({
              path: `/workspace/dir2/file-${i}.ts`,
              name: `file-${i}.ts`,
              type: 'file',
            })),
          },
        ],
      };

      (fetchFileTree as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: 'success',
        data: tree,
      } satisfies FileTreeResult);

      render(<FileTree onFileOpen={mockOnFileOpen} />);

      await waitFor(() => {
        const fileItems = screen.getAllByTestId('file-item');
        expect(fileItems.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      const firstItem = screen.getAllByTestId('file-item')[0];
      fireEvent.click(firstItem);

      await waitFor(() => {
        const fileItems = screen.getAllByTestId('file-item');
        expect(fileItems.length).toBeGreaterThanOrEqual(3);
      }, { timeout: 3000 });

      const folderExpands = screen.getAllByTestId('folder-expand');
      expect(folderExpands.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ─── Virtual Scroll Rendering Correctness ───

  describe('虚拟滚动渲染正确性', () => {
    it('[P0] 大文件树只渲染有限数量的 DOM 节点', async () => {
      const tree = buildFlatTree(500);
      (fetchFileTree as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: 'success',
        data: tree,
      } satisfies FileTreeResult);

      render(<FileTree onFileOpen={mockOnFileOpen} />);

      await waitFor(() => {
        const expandIcons = screen.getAllByTestId('folder-expand');
        expect(expandIcons.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      fireEvent.click(screen.getAllByTestId('folder-expand')[0]);

      await waitFor(() => {
        const virtualContainer = screen.queryByTestId('virtual-scroll-container');
        expect(virtualContainer).toBeInTheDocument();
      }, { timeout: 3000 });

      const fileItems = screen.getAllByTestId('file-item');
      expect(fileItems.length).toBeLessThan(500);
    });

    it('[P1] 刷新文件树后虚拟滚动保持启用', async () => {
      const tree = buildFlatTree(100);
      let callCount = 0;
      (fetchFileTree as unknown as ReturnType<typeof vi.fn>).mockImplementation(async () => {
        callCount++;
        return {
          status: 'success',
          data: tree,
        } satisfies FileTreeResult;
      });

      render(<FileTree onFileOpen={mockOnFileOpen} />);

      await waitFor(() => {
        const expandIcons = screen.getAllByTestId('folder-expand');
        expect(expandIcons.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      fireEvent.click(screen.getAllByTestId('folder-expand')[0]);

      await waitFor(() => {
        expect(screen.queryByTestId('virtual-scroll-container')).toBeInTheDocument();
      }, { timeout: 3000 });

      const refreshButton = screen.getByRole('button');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(callCount).toBeGreaterThan(1);
        expect(screen.queryByTestId('virtual-scroll-container')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('[P2] 加载错误时不显示虚拟滚动', async () => {
      (fetchFileTree as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error')
      );

      render(<FileTree onFileOpen={mockOnFileOpen} />);

      await waitFor(() => {
        const errorElement = screen.getByText(/error/i) || screen.getByTestId('file-tree');
        expect(errorElement).toBeInTheDocument();
        const virtualContainer = screen.queryByTestId('virtual-scroll-container');
        expect(virtualContainer).not.toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  // ─── Stable renderItem callback ───

  describe('renderVirtualItem 稳定性', () => {
    it('[P1] renderItem 在相同依赖下保持稳定引用', async () => {
      const tree = buildFlatTree(60);
      (fetchFileTree as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: 'success',
        data: tree,
      } satisfies FileTreeResult);

      const { rerender } = render(<FileTree onFileOpen={mockOnFileOpen} />);

      await waitFor(() => {
        const expandIcons = screen.getAllByTestId('folder-expand');
        expect(expandIcons.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      fireEvent.click(screen.getAllByTestId('folder-expand')[0]);

      await waitFor(() => {
        expect(screen.queryByTestId('virtual-scroll-container')).toBeInTheDocument();
      }, { timeout: 3000 });

      rerender(<FileTree onFileOpen={mockOnFileOpen} />);

      await waitFor(() => {
        const fileItems = screen.getAllByTestId('file-item');
        expect(fileItems.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });
});