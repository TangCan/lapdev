import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileTreeSearch } from './FileTreeSearch';

describe('[P0] FileTreeSearch Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('[P0] 应渲染搜索输入框', () => {
    render(
      <FileTreeSearch
        query=""
        onQueryChange={vi.fn()}
        isSearching={false}
        isStale={false}
        error={null}
      />
    );
    expect(screen.getByTestId('file-tree-search-input')).toBeInTheDocument();
  });

  it('[P0] 输入时应调用 onQueryChange', async () => {
    const onQueryChange = vi.fn();
    render(
      <FileTreeSearch
        query=""
        onQueryChange={onQueryChange}
        isSearching={false}
        isStale={false}
        error={null}
      />
    );
    const input = screen.getByTestId('file-tree-search-input');
    fireEvent.change(input, { target: { value: 'test-query' } });
    await waitFor(() => {
      expect(onQueryChange).toHaveBeenCalledWith('test-query');
    });
  });

  it('[P1] 搜索中状态应显示 loading indicator', () => {
    render(
      <FileTreeSearch
        query="test"
        onQueryChange={vi.fn()}
        isSearching={true}
        isStale={false}
        error={null}
      />
    );
    expect(screen.getByTestId('file-tree-search-loading')).toBeInTheDocument();
  });

  it('[P1] 过期状态应显示 stale indicator', () => {
    render(
      <FileTreeSearch
        query="test"
        onQueryChange={vi.fn()}
        isSearching={false}
        isStale={true}
        error={null}
      />
    );
    expect(screen.getByTestId('file-tree-search-stale')).toBeInTheDocument();
  });

  it('[P1] 错误状态应显示错误信息', () => {
    render(
      <FileTreeSearch
        query="test"
        onQueryChange={vi.fn()}
        isSearching={false}
        isStale={false}
        error="搜索失败"
      />
    );
    expect(screen.getByTestId('file-tree-search-error')).toBeInTheDocument();
    expect(screen.getByText('搜索失败')).toBeInTheDocument();
  });

  it('[P1] 搜索结果数量应显示', () => {
    render(
      <FileTreeSearch
        query="test"
        onQueryChange={vi.fn()}
        isSearching={false}
        isStale={false}
        error={null}
        resultCount={5}
      />
    );
    expect(screen.getByTestId('file-tree-search-results')).toBeInTheDocument();
    expect(screen.getByText('找到 5 个结果')).toBeInTheDocument();
  });

  it('[P1] 无结果时应显示未找到', () => {
    render(
      <FileTreeSearch
        query="test"
        onQueryChange={vi.fn()}
        isSearching={false}
        isStale={false}
        error={null}
        resultCount={0}
      />
    );
    expect(screen.getByText('未找到匹配的文件')).toBeInTheDocument();
  });

  it('[P2] 有输入时应显示清除按钮', () => {
    render(
      <FileTreeSearch
        query="test"
        onQueryChange={vi.fn()}
        isSearching={false}
        isStale={false}
        error={null}
      />
    );
    expect(screen.getByTestId('file-tree-search-clear')).toBeInTheDocument();
  });

  it('[P2] 空输入时不应显示清除按钮', () => {
    render(
      <FileTreeSearch
        query=""
        onQueryChange={vi.fn()}
        isSearching={false}
        isStale={false}
        error={null}
      />
    );
    expect(screen.queryByTestId('file-tree-search-clear')).not.toBeInTheDocument();
  });

  it('[P2] 点击清除按钮应清空输入', async () => {
    const onQueryChange = vi.fn();
    render(
      <FileTreeSearch
        query="test"
        onQueryChange={onQueryChange}
        isSearching={false}
        isStale={false}
        error={null}
      />
    );
    const clearBtn = screen.getByTestId('file-tree-search-clear');
    fireEvent.click(clearBtn);
    await waitFor(() => {
      expect(onQueryChange).toHaveBeenCalledWith('');
    });
  });
});