import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFileTreeFlatten } from './useFileTreeFlatten';
import type { FileInfo } from '../shared/types/file';

describe('useFileTreeFlatten Hook', () => {
  describe('基础功能', () => {
    it('[P0] 空文件树返回空数组', () => {
      const expandedPaths = new Set<string>();

      const { result } = renderHook(() =>
        useFileTreeFlatten(null, expandedPaths)
      );

      expect(result.current).toEqual([]);
    });

    it('[P0] 单文件树返回一个元素', () => {
      const singleFile: FileInfo = {
        name: 'readme.md',
        path: '/readme.md',
        type: 'file',
      };
      const expandedPaths = new Set<string>();

      const { result } = renderHook(() =>
        useFileTreeFlatten(singleFile, expandedPaths)
      );

      expect(result.current).toHaveLength(1);
      expect(result.current[0].file).toEqual(singleFile);
      expect(result.current[0].depth).toBe(0);
      expect(result.current[0].isExpanded).toBe(false);
      expect(result.current[0].hasChildren).toBe(false);
    });

    it('[P0] 展开/折叠目录控制子节点可见性', () => {
      const tree: FileInfo = {
        name: 'src',
        path: '/src',
        type: 'directory',
        children: [
          { name: 'App.tsx', path: '/src/App.tsx', type: 'file' },
        ],
      };

      // 折叠状态：只有根目录
      const collapsedPaths = new Set<string>();
      const { result, rerender } = renderHook(
        ({ paths }) => useFileTreeFlatten(tree, paths),
        { initialProps: { paths: collapsedPaths } }
      );

      expect(result.current).toHaveLength(1);
      expect(result.current[0].file.path).toBe('/src');
      expect(result.current[0].isExpanded).toBe(false);

      // 展开状态：根目录 + 子文件
      const expandedPaths = new Set<string>(['/src']);
      rerender({ paths: expandedPaths });

      expect(result.current).toHaveLength(2);
      expect(result.current[0].file.path).toBe('/src');
      expect(result.current[0].isExpanded).toBe(true);
      expect(result.current[1].file.path).toBe('/src/App.tsx');
    });
  });

  describe('深度与嵌套', () => {
    it('[P1] 多层嵌套目录深度正确递增', () => {
      const tree: FileInfo = {
        name: 'src',
        path: '/src',
        type: 'directory',
        children: [
          {
            name: 'components',
            path: '/src/components',
            type: 'directory',
            children: [
              { name: 'App.tsx', path: '/src/components/App.tsx', type: 'file' },
            ],
          },
          { name: 'index.ts', path: '/src/index.ts', type: 'file' },
        ],
      };
      const expandedPaths = new Set<string>(['/src', '/src/components']);

      const { result } = renderHook(() =>
        useFileTreeFlatten(tree, expandedPaths)
      );

      // /src (depth 0) -> /src/components (depth 1) -> App.tsx (depth 2), /src/index.ts (depth 1)
      expect(result.current).toHaveLength(4);
      expect(result.current[0].file.path).toBe('/src');
      expect(result.current[0].depth).toBe(0);
      expect(result.current[1].file.path).toBe('/src/components');
      expect(result.current[1].depth).toBe(1);
      expect(result.current[2].file.path).toBe('/src/components/App.tsx');
      expect(result.current[2].depth).toBe(2);
      expect(result.current[3].file.path).toBe('/src/index.ts');
      expect(result.current[3].depth).toBe(1);
    });

    it('[P2] 深层嵌套(10层)正确扁平化', () => {
      // 构建 10 层嵌套的目录树，最内层为文件
      let tree: FileInfo = {
        name: 'file.txt',
        path: '/level9/file.txt',
        type: 'file',
      };
      for (let i = 8; i >= 0; i--) {
        const dirPath = i === 0 ? '/root' : `/level${i}`;
        tree = {
          name: i === 0 ? 'root' : `level${i}`,
          path: dirPath,
          type: 'directory',
          children: [tree],
        };
      }

      // 展开所有目录
      const expandedPaths = new Set<string>();
      let node: FileInfo | undefined = tree;
      while (node) {
        expandedPaths.add(node.path);
        node = node.children?.[0];
      }

      const { result } = renderHook(() =>
        useFileTreeFlatten(tree, expandedPaths)
      );

      // 9 个目录 + 1 个文件 = 10 个元素
      expect(result.current).toHaveLength(10);
      for (let i = 0; i < 10; i++) {
        expect(result.current[i].depth).toBe(i);
      }
    });
  });

  describe('性能', () => {
    it('[P1] 大量文件(1000+)扁平化性能 < 10ms', () => {
      // 构建包含 1000+ 文件的树：100 个目录 × 10 个文件
      const largeTree: FileInfo = {
        name: 'root',
        path: '/root',
        type: 'directory',
        children: Array.from({ length: 100 }, (_, i) => ({
          name: `dir${i}`,
          path: `/root/dir${i}`,
          type: 'directory' as const,
          children: Array.from({ length: 10 }, (_, j) => ({
            name: `file${j}.ts`,
            path: `/root/dir${i}/file${j}.ts`,
            type: 'file' as const,
          })),
        })),
      };
      const expandedPaths = new Set<string>([
        '/root',
        ...largeTree.children!.map((d) => d.path),
      ]);

      const start = performance.now();
      const { result } = renderHook(() =>
        useFileTreeFlatten(largeTree, expandedPaths)
      );
      const elapsed = performance.now() - start;

      // 1 root + 100 dirs + 1000 files = 1101 items
      expect(result.current.length).toBeGreaterThan(1000);
      expect(elapsed).toBeLessThan(10);
    });
  });

  describe('边界情况', () => {
    it('[P2] 折叠目录的子节点不出现在列表中', () => {
      const tree: FileInfo = {
        name: 'src',
        path: '/src',
        type: 'directory',
        children: [
          {
            name: 'components',
            path: '/src/components',
            type: 'directory',
            children: [
              { name: 'App.tsx', path: '/src/components/App.tsx', type: 'file' },
            ],
          },
        ],
      };
      // 只展开 /src，不展开 /src/components
      const expandedPaths = new Set<string>(['/src']);

      const { result } = renderHook(() =>
        useFileTreeFlatten(tree, expandedPaths)
      );

      const paths = result.current.map((item) => item.file.path);
      // /src 和 /src/components 应出现
      expect(paths).toContain('/src');
      expect(paths).toContain('/src/components');
      // /src/components 的子节点不应出现
      expect(paths).not.toContain('/src/components/App.tsx');
    });

    it('[P2] 同级多个目录展开正确', () => {
      const tree: FileInfo = {
        name: 'root',
        path: '/root',
        type: 'directory',
        children: [
          {
            name: 'dirA',
            path: '/root/dirA',
            type: 'directory',
            children: [
              { name: 'file1.ts', path: '/root/dirA/file1.ts', type: 'file' },
            ],
          },
          {
            name: 'dirB',
            path: '/root/dirB',
            type: 'directory',
            children: [
              { name: 'file2.ts', path: '/root/dirB/file2.ts', type: 'file' },
            ],
          },
        ],
      };
      const expandedPaths = new Set<string>([
        '/root',
        '/root/dirA',
        '/root/dirB',
      ]);

      const { result } = renderHook(() =>
        useFileTreeFlatten(tree, expandedPaths)
      );

      // root + dirA + file1 + dirB + file2 = 5
      expect(result.current).toHaveLength(5);
      const paths = result.current.map((item) => item.file.path);
      expect(paths).toContain('/root/dirA/file1.ts');
      expect(paths).toContain('/root/dirB/file2.ts');
    });

    it('[P2] 空目录(无children)正确处理', () => {
      const tree: FileInfo = {
        name: 'src',
        path: '/src',
        type: 'directory',
      };
      const expandedPaths = new Set<string>(['/src']);

      const { result } = renderHook(() =>
        useFileTreeFlatten(tree, expandedPaths)
      );

      expect(result.current).toHaveLength(1);
      expect(result.current[0].file.path).toBe('/src');
      expect(result.current[0].hasChildren).toBe(false);
      expect(result.current[0].isExpanded).toBe(true);
    });
  });
});
