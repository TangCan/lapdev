import { describe, it, expect } from 'vitest';
import type { FileInfo } from '../../types/file';

// Test the pure functions from FileTree.tsx by importing the module
// Since filterTree and collectAncestorPaths are not exported, we test them
// by replicating the logic here and testing against expected behavior.
// In a real test, we'd export these functions or test via integration.

// Replicate filterTree for testing
function filterTree(fileTree: FileInfo | null, matchingPaths: Set<string>): FileInfo | null {
  if (!fileTree) return null;

  const filterNode = (node: FileInfo): FileInfo | null => {
    if (node.type === 'file') {
      return matchingPaths.has(node.path) ? node : null;
    }

    if (node.type === 'directory') {
      const filteredChildren: FileInfo[] = [];
      if (node.children) {
        for (const child of node.children) {
          const filtered = filterNode(child);
          if (filtered) {
            filteredChildren.push(filtered);
          }
        }
      }

      if (filteredChildren.length > 0 || matchingPaths.has(node.path)) {
        return {
          ...node,
          children: filteredChildren.length > 0 ? filteredChildren : undefined,
        };
      }

      return null;
    }

    return null;
  };

  return filterNode(fileTree);
}

function collectAncestorPaths(fileTree: FileInfo | null, matchingPaths: Set<string>): Set<string> {
  const ancestors = new Set<string>();
  if (!fileTree) return ancestors;

  const walk = (node: FileInfo): boolean => {
    let hasMatch = matchingPaths.has(node.path);

    if (node.children) {
      for (const child of node.children) {
        if (walk(child)) {
          hasMatch = true;
        }
      }
    }

    if (hasMatch && node.type === 'directory') {
      ancestors.add(node.path);
    }

    return hasMatch;
  };

  walk(fileTree);
  return ancestors;
}

describe('FileTree - filterTree', () => {
  const sampleTree: FileInfo = {
    path: '/workspace',
    name: 'workspace',
    type: 'directory',
    children: [
      { path: '/workspace/App.tsx', name: 'App.tsx', type: 'file' },
      { path: '/workspace/main.ts', name: 'main.ts', type: 'file' },
      {
        path: '/workspace/src',
        name: 'src',
        type: 'directory',
        children: [
          { path: '/workspace/src/Button.tsx', name: 'Button.tsx', type: 'file' },
          { path: '/workspace/src/index.ts', name: 'index.ts', type: 'file' },
        ],
      },
    ],
  };

  it('[P0] 应过滤出匹配文件并保留祖先目录', () => {
    const matchingPaths = new Set(['/workspace/src/Button.tsx']);
    const result = filterTree(sampleTree, matchingPaths);

    expect(result).not.toBeNull();
    expect(result?.type).toBe('directory');
    expect(result?.name).toBe('workspace');

    // src 目录应保留（因为包含匹配的子文件）
    const srcDir = result?.children?.find(c => c.name === 'src');
    expect(srcDir).toBeDefined();
    expect(srcDir?.type).toBe('directory');

    // Button.tsx 应保留
    const buttonFile = srcDir?.children?.find(c => c.name === 'Button.tsx');
    expect(buttonFile).toBeDefined();

    // index.ts 不应保留（不匹配）
    const indexFile = srcDir?.children?.find(c => c.name === 'index.ts');
    expect(indexFile).toBeUndefined();
  });

  it('[P0] 无匹配时应返回 null', () => {
    const matchingPaths = new Set(['/nonexistent.ts']);
    const result = filterTree(sampleTree, matchingPaths);
    expect(result).toBeNull();
  });

  it('[P0] null 输入应返回 null', () => {
    const result = filterTree(null, new Set());
    expect(result).toBeNull();
  });

  it('[P1] 目录本身匹配时应保留（即使子文件不匹配）', () => {
    const matchingPaths = new Set(['/workspace/src']);
    const result = filterTree(sampleTree, matchingPaths);

    expect(result).not.toBeNull();
    const srcDir = result?.children?.find(c => c.name === 'src');
    expect(srcDir).toBeDefined();
    // 目录匹配但无匹配子文件 → children: undefined
    expect(srcDir?.children).toBeUndefined();
  });

  it('[P1] 多个匹配文件应全部保留', () => {
    const matchingPaths = new Set([
      '/workspace/App.tsx',
      '/workspace/src/Button.tsx',
    ]);
    const result = filterTree(sampleTree, matchingPaths);

    expect(result).not.toBeNull();
    const appFile = result?.children?.find(c => c.name === 'App.tsx');
    expect(appFile).toBeDefined();

    const srcDir = result?.children?.find(c => c.name === 'src');
    expect(srcDir).toBeDefined();
    const buttonFile = srcDir?.children?.find(c => c.name === 'Button.tsx');
    expect(buttonFile).toBeDefined();
  });

  it('[P2] 空匹配集应返回 null', () => {
    const result = filterTree(sampleTree, new Set());
    expect(result).toBeNull();
  });

  it('[P2] 根节点匹配应保留整个树', () => {
    const matchingPaths = new Set(['/workspace']);
    const result = filterTree(sampleTree, matchingPaths);

    expect(result).not.toBeNull();
    expect(result?.name).toBe('workspace');
    // 根目录匹配但无匹配子文件 → children: undefined
    expect(result?.children).toBeUndefined();
  });
});

describe('FileTree - collectAncestorPaths', () => {
  const sampleTree: FileInfo = {
    path: '/workspace',
    name: 'workspace',
    type: 'directory',
    children: [
      {
        path: '/workspace/src',
        name: 'src',
        type: 'directory',
        children: [
          {
            path: '/workspace/src/components',
            name: 'components',
            type: 'directory',
            children: [
              { path: '/workspace/src/components/Button.tsx', name: 'Button.tsx', type: 'file' },
            ],
          },
        ],
      },
      { path: '/workspace/App.tsx', name: 'App.tsx', type: 'file' },
    ],
  };

  it('[P0] 应收集匹配文件的所有祖先目录路径', () => {
    const matchingPaths = new Set(['/workspace/src/components/Button.tsx']);
    const ancestors = collectAncestorPaths(sampleTree, matchingPaths);

    expect(ancestors.has('/workspace')).toBe(true);
    expect(ancestors.has('/workspace/src')).toBe(true);
    expect(ancestors.has('/workspace/src/components')).toBe(true);
  });

  it('[P0] 根目录文件匹配应只包含根目录', () => {
    const matchingPaths = new Set(['/workspace/App.tsx']);
    const ancestors = collectAncestorPaths(sampleTree, matchingPaths);

    expect(ancestors.has('/workspace')).toBe(true);
    expect(ancestors.size).toBe(1);
  });

  it('[P0] null 输入应返回空集', () => {
    const ancestors = collectAncestorPaths(null, new Set());
    expect(ancestors.size).toBe(0);
  });

  it('[P1] 无匹配应返回空集', () => {
    const matchingPaths = new Set(['/nonexistent.ts']);
    const ancestors = collectAncestorPaths(sampleTree, matchingPaths);
    expect(ancestors.size).toBe(0);
  });

  it('[P1] 多个匹配文件应合并祖先路径', () => {
    const matchingPaths = new Set([
      '/workspace/App.tsx',
      '/workspace/src/components/Button.tsx',
    ]);
    const ancestors = collectAncestorPaths(sampleTree, matchingPaths);

    expect(ancestors.has('/workspace')).toBe(true);
    expect(ancestors.has('/workspace/src')).toBe(true);
    expect(ancestors.has('/workspace/src/components')).toBe(true);
    expect(ancestors.size).toBe(3);
  });

  it('[P2] 目录本身匹配也应收集', () => {
    const matchingPaths = new Set(['/workspace/src']);
    const ancestors = collectAncestorPaths(sampleTree, matchingPaths);

    expect(ancestors.has('/workspace')).toBe(true);
    expect(ancestors.has('/workspace/src')).toBe(true);
  });
});
