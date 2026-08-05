interface FileTreeSearchProps {
  query: string;
  onQueryChange: (value: string) => void;
  isSearching: boolean;
  isStale: boolean;
  error: string | null;
  resultCount?: number;
}

export function FileTreeSearch({
  query,
  onQueryChange,
  isSearching,
  isStale,
  error,
  resultCount,
}: FileTreeSearchProps) {
  return (
    <div className="file-tree-search" data-testid="file-tree-search">
      <div className="file-tree-search-input-wrapper">
        <span className="file-tree-search-icon">🔍</span>
        <input
          type="text"
          className="file-tree-search-input"
          data-testid="file-tree-search-input"
          placeholder="搜索文件..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          aria-label="搜索文件"
        />
        {isSearching && (
          <span className="file-tree-search-loading" data-testid="file-tree-search-loading">
            ⏳
          </span>
        )}
        {isStale && !isSearching && (
          <span className="file-tree-search-stale" data-testid="file-tree-search-stale">
            ⟳
          </span>
        )}
        {query && !isSearching && !isStale && (
          <button
            className="file-tree-search-clear"
            onClick={() => onQueryChange('')}
            data-testid="file-tree-search-clear"
            aria-label="清除搜索"
          >
            ✕
          </button>
        )}
        {query && (isSearching || isStale) && (
          <button
            className="file-tree-search-clear file-tree-search-clear-loading"
            onClick={() => onQueryChange('')}
            data-testid="file-tree-search-clear"
            aria-label="清除搜索"
          >
            ✕
          </button>
        )}
      </div>

      {error && (
        <div className="file-tree-search-error" data-testid="file-tree-search-error">
          <span>⚠️</span> {error}
        </div>
      )}

      {resultCount !== undefined && query.trim() && !error && (
        <div className="file-tree-search-results-info" data-testid="file-tree-search-results">
          {resultCount > 0
            ? `找到 ${resultCount} 个结果`
            : '未找到匹配的文件'}
        </div>
      )}
    </div>
  );
}