import { useMemo } from 'react';
import type { FileInfo } from '../shared/types/file';

export interface FlatFileItem {
  file: FileInfo;
  depth: number;
  isExpanded: boolean;
  hasChildren: boolean;
}

/**
 * 扁平化文件树为虚拟滚动所需的一维列表
 *
 * @param fileTree 文件树根节点
 * @param expandedPaths 当前展开的路径集合
 */
export function useFileTreeFlatten(
  fileTree: FileInfo | null,
  expandedPaths: Set<string>
): FlatFileItem[] {
  const flatItems = useMemo(() => {
    if (!fileTree) return [];

    const result: FlatFileItem[] = [];

    const flatten = (node: FileInfo, depth: number) => {
      const isExpanded = expandedPaths.has(node.path);
      const hasChildren = node.type === 'directory' && !!node.children?.length;

      result.push({
        file: node,
        depth,
        isExpanded,
        hasChildren,
      });

      // 只有展开的目录才递归子节点
      if (hasChildren && isExpanded && node.children) {
        for (const child of node.children) {
          flatten(child, depth + 1);
        }
      }
    };

    flatten(fileTree, 0);
    return result;
  }, [fileTree, expandedPaths]);

  return flatItems;
}
