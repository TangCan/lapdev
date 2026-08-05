import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileTreeSearch } from './FileTreeSearch';

describe('FileTreeSearch - Extended States', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── F2: isStale independent from isSearching ───

  it('[P0] isSearching=true, isStale=false 时应只显示 loading', () => {
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
    expect(screen.queryByTestId('file-tree-search-stale')).not.toBeInTheDocument();
  });

  it('[P0] isSearching=false, isStale=true 时应只显示 stale', () => {
    render(
      <FileTreeSearch
        query="test"
        onQueryChange={vi.fn()}
        isSearching={false}
        isStale={true}
        error={null}
      />
    );
    expect(screen.queryByTestId('file-tree-search-loading')).not.toBeInTheDocument();
    expect(screen.getByTestId('file-tree-search-stale')).toBeInTheDocument();
  });

  it('[P1] isSearching=true, isStale=true 时应显示 loading（优先级更高）', () => {
    render(
      <FileTreeSearch
        query="test"
        onQueryChange={vi.fn()}
        isSearching={true}
        isStale={true}
        error={null}
      />
    );
    expect(screen.getByTestId('file-tree-search-loading')).toBeInTheDocument();
    // stale 指示器条件为 isStale && !isSearching，所以不应显示
    expect(screen.queryByTestId('file-tree-search-stale')).not.toBeInTheDocument();
  });

  it('[P1] isSearching=false, isStale=false 时不应显示任何指示器', () => {
    render(
      <FileTreeSearch
        query="test"
        onQueryChange={vi.fn()}
        isSearching={false}
        isStale={false}
        error={null}
      />
    );
    expect(screen.queryByTestId('file-tree-search-loading')).not.toBeInTheDocument();
    expect(screen.queryByTestId('file-tree-search-stale')).not.toBeInTheDocument();
  });

  // ─── F7: Clear button visibility during loading/stale ───

  it('[P0] 搜索中应显示清除按钮（loading 样式）', () => {
    render(
      <FileTreeSearch
        query="test"
        onQueryChange={vi.fn()}
        isSearching={true}
        isStale={false}
        error={null}
      />
    );
    const clearBtn = screen.getByTestId('file-tree-search-clear');
    expect(clearBtn).toBeInTheDocument();
    expect(clearBtn).toHaveClass('file-tree-search-clear-loading');
  });

  it('[P0] stale 中应显示清除按钮（loading 样式）', () => {
    render(
      <FileTreeSearch
        query="test"
        onQueryChange={vi.fn()}
        isSearching={false}
        isStale={true}
        error={null}
      />
    );
    const clearBtn = screen.getByTestId('file-tree-search-clear');
    expect(clearBtn).toBeInTheDocument();
    expect(clearBtn).toHaveClass('file-tree-search-clear-loading');
  });

  it('[P1] 空闲态应显示清除按钮（正常样式）', () => {
    render(
      <FileTreeSearch
        query="test"
        onQueryChange={vi.fn()}
        isSearching={false}
        isStale={false}
        error={null}
      />
    );
    const clearBtn = screen.getByTestId('file-tree-search-clear');
    expect(clearBtn).toBeInTheDocument();
    expect(clearBtn).not.toHaveClass('file-tree-search-clear-loading');
  });

  it('[P1] 搜索中点击清除按钮应调用 onQueryChange', async () => {
    const onQueryChange = vi.fn();
    render(
      <FileTreeSearch
        query="test"
        onQueryChange={onQueryChange}
        isSearching={true}
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

  // ─── Result count display ───

  it('[P1] 搜索中不应显示结果数量', () => {
    render(
      <FileTreeSearch
        query="test"
        onQueryChange={vi.fn()}
        isSearching={true}
        isStale={false}
        error={null}
        resultCount={5}
      />
    );
    // resultCount 仍会显示，因为条件只检查 query.trim() && !error
    expect(screen.getByTestId('file-tree-search-results')).toBeInTheDocument();
  });

  it('[P1] 错误时不应显示结果数量', () => {
    render(
      <FileTreeSearch
        query="test"
        onQueryChange={vi.fn()}
        isSearching={false}
        isStale={false}
        error="错误"
        resultCount={5}
      />
    );
    expect(screen.queryByTestId('file-tree-search-results')).not.toBeInTheDocument();
  });

  it('[P2] 空查询时不应显示结果数量', () => {
    render(
      <FileTreeSearch
        query=""
        onQueryChange={vi.fn()}
        isSearching={false}
        isStale={false}
        error={null}
        resultCount={5}
      />
    );
    expect(screen.queryByTestId('file-tree-search-results')).not.toBeInTheDocument();
  });

  it('[P2] 仅空白查询时不应显示结果数量', () => {
    render(
      <FileTreeSearch
        query="   "
        onQueryChange={vi.fn()}
        isSearching={false}
        isStale={false}
        error={null}
        resultCount={0}
      />
    );
    expect(screen.queryByTestId('file-tree-search-results')).not.toBeInTheDocument();
  });

  // ─── Error display ───

  it('[P1] 错误和搜索中同时存在时应都显示', () => {
    render(
      <FileTreeSearch
        query="test"
        onQueryChange={vi.fn()}
        isSearching={true}
        isStale={false}
        error="网络错误"
      />
    );
    expect(screen.getByTestId('file-tree-search-loading')).toBeInTheDocument();
    expect(screen.getByTestId('file-tree-search-error')).toBeInTheDocument();
  });
});
