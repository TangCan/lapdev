import React, { useState, useEffect } from 'react';

interface SkillSearchProps {
  onSearch: (query: string) => void;
}

export function SkillSearch({ onSearch }: SkillSearchProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      onSearch(query);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, onSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <div className="p-3 bg-[#252526] border-b border-[#3c3c3c]" data-testid="skill-search">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center bg-[#3c3c3c] rounded px-3 py-2">
          <span className="text-sm mr-2 text-[#858585]">🔍</span>
          <input
            type="text"
            className="flex-1 bg-transparent border-none text-[#d4d4d4] text-sm outline-none placeholder:text-[#858585]"
            placeholder="搜索Skill名称、描述或标签..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            data-testid="search-input"
          />
          {query && (
            <button
              type="button"
              className="bg-transparent border-none text-[#858585] text-sm cursor-pointer p-1 rounded hover:bg-[#4a4a4a] hover:text-[#d4d4d4] transition-colors"
              onClick={() => setQuery('')}
              data-testid="search-clear"
            >
              ✕
            </button>
          )}
        </div>
      </form>
    </div>
  );
}