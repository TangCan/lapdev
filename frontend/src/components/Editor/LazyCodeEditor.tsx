import { useState, useRef, Suspense, lazy } from 'react';

const LspCodeEditor = lazy(() =>
  import('../Editor/LspCodeEditor').then((module) => ({ default: module.LspCodeEditor }))
);

interface LazyCodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  diffLines?: Array<{ lineNumber: number; type: 'added' | 'deleted' | 'modified' }>;
  uri?: string;
}

type LoadState = 'idle' | 'loading' | 'loaded';

let editorLoadedOnce = false;

/**
 * 懒加载代码编辑器组件
 * 只在用户首次聚焦编辑器区域时加载 Monaco Editor，减少首屏加载时间
 */
export function LazyCodeEditor({ value, language, onChange, diffLines, uri }: LazyCodeEditorProps) {
  const [loadState, setLoadState] = useState<LoadState>(editorLoadedOnce ? 'loaded' : 'idle');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFocus = () => {
    if (loadState !== 'idle') return;
    setLoadState('loading');
    // 开始加载编辑器
    setTimeout(() => {
      setLoadState('loaded');
      editorLoadedOnce = true;
    }, 0);
  };

  if (loadState === 'loaded') {
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">
            <span className="animate-pulse">Initializing editor...</span>
          </div>
        }
      >
        <LspCodeEditor
          value={value}
          language={language}
          onChange={onChange}
          diffLines={diffLines}
          uri={uri}
        />
      </Suspense>
    );
  }

  return (
    <div
      ref={containerRef}
      onFocus={handleFocus}
      onClick={handleFocus}
      className="relative h-full flex items-center justify-center bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] cursor-text"
      tabIndex={0}
    >
      {loadState === 'loading' ? (
        <span className="animate-pulse">Loading editor...</span>
      ) : (
        <span>Click to edit</span>
      )}
    </div>
  );
}
