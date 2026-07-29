import { useState, useRef, Suspense, lazy, forwardRef, useCallback, Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import type { LspCodeEditorHandle } from './LspCodeEditor';
import { getMonaco, getMonacoSync } from '../../services/monacoLoader';
import type { DiffLine } from '../../types/diff';

const LspCodeEditor = lazy(() =>
  import('../Editor/LspCodeEditor').then((module) => ({ default: module.LspCodeEditor }))
);

interface LazyCodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  diffLines?: DiffLine[];
  uri?: string;
  fontSize?: number;
  minimap?: boolean;
  readOnly?: boolean;
}

type LoadState = 'idle' | 'loading' | 'loaded' | 'error';

let editorLoadedOnce = false;

export function resetEditorState() {
  editorLoadedOnce = false;
}

class EditorErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Editor error:', error, info);
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export const LazyCodeEditor = forwardRef<LspCodeEditorHandle, LazyCodeEditorProps>(
  function LazyCodeEditor({ value, language, onChange, diffLines, uri, fontSize, minimap, readOnly }, ref) {
    const [loadState, setLoadState] = useState<LoadState>(() =>
      editorLoadedOnce || getMonacoSync() ? 'loaded' : 'idle'
    );
    const containerRef = useRef<HTMLDivElement>(null);

    const startLoading = useCallback(async () => {
      if (loadState === 'loading' || loadState === 'loaded') return;
      setLoadState('loading');
      try {
        await getMonaco();
        setLoadState('loaded');
        editorLoadedOnce = true;
      } catch (e) {
        console.error('Failed to load Monaco editor:', e);
        setLoadState('error');
      }
    }, [loadState]);

    const handleRetry = useCallback(async () => {
      setLoadState('loading');
      try {
        await getMonaco();
        setLoadState('loaded');
        editorLoadedOnce = true;
      } catch (e) {
        console.error('Failed to load Monaco editor:', e);
        setLoadState('error');
      }
    }, []);

    if (loadState === 'loaded') {
      return (
        <EditorErrorBoundary
          fallback={
            <div className="flex items-center justify-center h-full bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">
              <span>Failed to load editor. Please refresh the page.</span>
            </div>
          }
        >
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">
                <span className="animate-pulse">Preparing editor...</span>
              </div>
            }
          >
            <LspCodeEditor
              ref={ref}
              value={value}
              language={language}
              onChange={onChange}
              diffLines={diffLines}
              uri={uri}
              fontSize={fontSize}
              minimap={minimap}
              readOnly={readOnly}
            />
          </Suspense>
        </EditorErrorBoundary>
      );
    }

    if (loadState === 'error') {
      return (
        <div
          ref={containerRef}
          onClick={handleRetry}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleRetry();
            }
          }}
          className="relative h-full flex items-center justify-center bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] cursor-text"
          tabIndex={0}
          data-testid="code-editor-placeholder"
          role="button"
          aria-label="Click to retry loading editor"
        >
          <span>Click to retry</span>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        onMouseEnter={startLoading}
        onFocus={startLoading}
        onClick={startLoading}
        className="relative h-full flex items-center justify-center bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] cursor-text"
        tabIndex={0}
        data-testid="code-editor-placeholder"
      >
        {loadState === 'loading' ? (
          <span className="animate-pulse">Loading editor...</span>
        ) : (
          <span>Click to edit</span>
        )}
      </div>
    );
  }
);