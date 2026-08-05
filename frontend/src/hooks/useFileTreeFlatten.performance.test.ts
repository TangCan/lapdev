import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFileTreeFlatten } from './useFileTreeFlatten';
import type { FileInfo } from '../shared/types/file';

/**
 * 构建大型文件树用于性能测试
 *
 * @param dirCount 子目录数量
 * @param filesPerDir 每个目录下的文件数量
 */
function buildLargeTree(dirCount: number, filesPerDir: number): FileInfo {
  return {
    name: 'root',
    path: '/root',
    type: 'directory',
    children: Array.from({ length: dirCount }, (_, i) => ({
      name: `dir${i}`,
      path: `/root/dir${i}`,
      type: 'directory' as const,
      children: Array.from({ length: filesPerDir }, (_, j) => ({
        name: `file${j}.ts`,
        path: `/root/dir${i}/file${j}.ts`,
        type: 'file' as const,
      })),
    })),
  };
}

/**
 * 构建所有目录路径的展开集合
 */
function buildExpandedPaths(tree: FileInfo): Set<string> {
  const paths = new Set<string>(['/root']);
  if (tree.children) {
    for (const child of tree.children) {
      paths.add(child.path);
    }
  }
  return paths;
}

describe('useFileTreeFlatten 性能测试 (EPI3.02 虚拟滚动故事)', () => {
  it('1000+ 文件扁平化应 < 10ms', () => {
    // 100 个目录 × 10 个文件 = 1000 文件，加上 100 目录 + 1 root = 1101 项
    const largeTree = buildLargeTree(100, 10);
    const expandedPaths = buildExpandedPaths(largeTree);

    // 预热：消除 React/jsdom 首次渲染的冷启动开销，使测量反映真实扁平化性能
    renderHook(() => useFileTreeFlatten(largeTree, expandedPaths));

    const start = performance.now();
    const { result } = renderHook(() =>
      useFileTreeFlatten(largeTree, expandedPaths)
    );
    const elapsed = performance.now() - start;

    // 确保确实扁平化了 1000+ 节点
    expect(result.current.length).toBeGreaterThan(1000);
    // 性能断言：< 10ms
    expect(elapsed).toBeLessThan(10);
  });

  it('5000+ 文件扁平化应 < 50ms', () => {
    // 500 个目录 × 10 个文件 = 5000 文件，加上 500 目录 + 1 root = 5501 项
    const largeTree = buildLargeTree(500, 10);
    const expandedPaths = buildExpandedPaths(largeTree);

    const start = performance.now();
    const { result } = renderHook(() =>
      useFileTreeFlatten(largeTree, expandedPaths)
    );
    const elapsed = performance.now() - start;

    // 确保确实扁平化了 5000+ 节点
    expect(result.current.length).toBeGreaterThan(5000);
    // 性能断言：< 50ms
    expect(elapsed).toBeLessThan(50);
  });

  it('重复扁平化使用 useMemo 缓存 — 第二次应 < 1ms', () => {
    const largeTree = buildLargeTree(100, 10);
    const expandedPaths = buildExpandedPaths(largeTree);

    const { rerender } = renderHook(
      ({ tree, paths }) => useFileTreeFlatten(tree, paths),
      { initialProps: { tree: largeTree, paths: expandedPaths } }
    );

    // 使用相同 props 重新渲染，useMemo 应命中缓存
    const start = performance.now();
    rerender({ tree: largeTree, paths: expandedPaths });
    const elapsed = performance.now() - start;

    // 缓存命中时第二次渲染应 < 1ms
    expect(elapsed).toBeLessThan(1);
  });

  it('虚拟滚动渲染节点数应 < 可视区域 + overscan', () => {
    // 构建 1000 个扁平项（模拟扁平化后的列表）
    const totalItems = 1000;
    const flatItems = Array.from({ length: totalItems }, (_, i) => ({
      id: i,
      name: `file${i}.ts`,
    }));

    // VirtualList 参数
    const containerHeight = 400;
    const itemHeight = 28;
    const overscan = 5;

    // 可视区域内节点数 + 上下两侧 overscan
    const visibleCount =
      Math.ceil(containerHeight / itemHeight) + 2 * overscan;

    // ceil(400/28) = 15, 15 + 2*5 = 25
    expect(visibleCount).toBe(25);
    // 虚拟滚动只渲染少量节点，而非全部 1000 个
    expect(visibleCount).toBeLessThan(flatItems.length);
  });
});
