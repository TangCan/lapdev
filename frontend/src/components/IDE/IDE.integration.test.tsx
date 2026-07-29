/**
 * Integration tests for IDE / SimpleIDE with LazyCodeEditor
 *
 * Story: EPI2.01 - Monaco Editor 懒加载
 * Test Levels: Integration (Vitest + Testing Library)
 * Coverage:
 *   - IDE.tsx 渲染 LazyCodeEditor 组件
 *   - IDE.tsx Tab 状态与 LazyCodeEditor 集成
 *   - SimpleIDE.tsx 使用 LazyCodeEditor 渲染
 *   - props 转发验证 (value/language/diffLines/onChange)
 *
 * 策略: mock LazyCodeEditor 使其根据 getMonacoSync() 返回值呈现不同状态
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import React from 'react';

const { mockGetMonacoSync, mockGetMonaco } = vi.hoisted(() => ({
  mockGetMonacoSync: vi.fn(),
  mockGetMonaco: vi.fn(),
}));

const { mockReadFile } = vi.hoisted(() => ({
  mockReadFile: vi.fn(),
}));

// ============================================================
// Mock: monacoLoader
// ============================================================
vi.mock('../../services/monacoLoader', () => ({
  getMonaco: mockGetMonaco,
  getMonacoSync: mockGetMonacoSync,
}));

// ============================================================
// Mock: LazyCodeEditor (使用简易实现)
// ============================================================
vi.mock('../Editor/LazyCodeEditor', async () => {
  const React = await import('react');
  const { useState, useRef, useCallback, forwardRef, Suspense, lazy } = React;
  const { getMonaco: gm, getMonacoSync: gms } = await import('../../services/monacoLoader');

  const LspCodeEditor = lazy(() =>
    Promise.resolve({
      default: ({ value, onChange, language, diffLines, uri, fontSize, minimap, readOnly }: {
        value: string;
        onChange: (v: string) => void;
        language: string;
        diffLines?: unknown;
        uri?: string;
        fontSize?: number;
        minimap?: boolean;
        readOnly?: boolean;
      }) => (
        <div data-testid="lsp-code-editor">
          <span data-testid="lsp-value">{value}</span>
          <span data-testid="lsp-language">{language}</span>
          <span data-testid="lsp-diff-lines">{JSON.stringify(diffLines ?? [])}</span>
          <button data-testid="lsp-change" onClick={() => onChange('changed')}>Change</button>
        </div>
      ),
    })
  );

  let editorLoadedOnce = false;

  // 暴露一个全局 reset 工具给测试使用
  (globalThis as unknown as { __resetEditorLoadedOnce: () => void }).__resetEditorLoadedOnce = () => {
    editorLoadedOnce = false;
  };

  const LazyCodeEditor = forwardRef<any, any>(
    function LazyCodeEditor(props, ref) {
      const [loadState, setLoadState] = useState<'idle' | 'loading' | 'loaded' | 'error'>(() =>
        editorLoadedOnce || gms() ? 'loaded' : 'idle'
      );
      const startLoading = useCallback(async () => {
        if (loadState === 'loading' || loadState === 'loaded') return;
        setLoadState('loading');
        try {
          await gm();
          setLoadState('loaded');
          editorLoadedOnce = true;
        } catch {
          setLoadState('error');
        }
      }, [loadState]);

      if (loadState === 'loaded') {
        return (
          <Suspense fallback={<span>Preparing editor...</span>}>
            <LspCodeEditor
              ref={ref}
              value={props.value}
              language={props.language}
              onChange={props.onChange}
              diffLines={props.diffLines}
              uri={props.uri}
              fontSize={props.fontSize}
              minimap={props.minimap}
              readOnly={props.readOnly}
            />
          </Suspense>
        );
      }

      if (loadState === 'error') {
        return (
          <div
            data-testid="code-editor-placeholder"
            onClick={startLoading}
            role="button"
            tabIndex={0}
          >
            <span>Click to retry</span>
          </div>
        );
      }

      return (
        <div
          data-testid="code-editor-placeholder"
          onClick={startLoading}
          role="button"
          tabIndex={0}
        >
          {loadState === 'loading' ? (
            <span>Loading editor...</span>
          ) : (
            <span>Click to edit</span>
          )}
        </div>
      );
    }
  );

  return { LazyCodeEditor };
});

// ============================================================
// Mock: LspCodeEditor (被 LazyCodeEditor lazy 加载)
// ============================================================
vi.mock('../Editor/LspCodeEditor', () => ({
  LspCodeEditor: vi.fn((props: {
    value: string;
    onChange: (v: string) => void;
    language: string;
    diffLines?: unknown;
    uri?: string;
    fontSize?: number;
    minimap?: boolean;
    readOnly?: boolean;
  }) => (
    <div data-testid="lsp-code-editor">
      <span data-testid="lsp-value">{props.value}</span>
      <span data-testid="lsp-language">{props.language}</span>
      <span data-testid="lsp-diff-lines">{JSON.stringify(props.diffLines ?? [])}</span>
      <button data-testid="lsp-change" onClick={() => props.onChange('changed')}>Change</button>
    </div>
  )),
}));

// ============================================================
// Mock: 其他组件
// ============================================================
// Mock FileTree - IDE.tsx 导入路径
vi.mock('../FileTree', () => ({
  FileTree: vi.fn(({ onFileOpen }: { onFileOpen: (file: any) => void }) => (
    <div data-testid="file-tree">
      <button
        data-testid="mock-file"
        onClick={() => onFileOpen({ path: '/workspace/test.ts', name: 'test.ts', type: 'file' })}
      >
        test.ts
      </button>
    </div>
  )),
}));

// Mock FileTree - SimpleIDE.tsx 导入路径 (../FileTree/FileTree)
vi.mock('../FileTree/FileTree', () => ({
  FileTree: vi.fn(({ onFileOpen }: { onFileOpen: (file: any) => void }) => (
    <div data-testid="file-tree">
      <button
        data-testid="mock-file"
        onClick={() => onFileOpen({ path: '/workspace/test.ts', name: 'test.ts', type: 'file' })}
      >
        test.ts
      </button>
    </div>
  )),
}));

vi.mock('../Terminal/Terminal', () => ({
  Terminal: vi.fn(() => <div data-testid="mock-terminal">Terminal</div>),
}));

vi.mock('../Git/GitPanel', () => ({
  default: vi.fn(() => <div data-testid="mock-git-panel">GitPanel</div>),
}));

vi.mock('../Problems/ProblemsPanel', () => ({
  default: vi.fn(() => <div data-testid="mock-problems-panel">ProblemsPanel</div>),
}));

vi.mock('../AI/AIChatPanel', () => ({
  default: vi.fn(() => <div data-testid="mock-ai-chat-panel">AIChatPanel</div>),
}));

vi.mock('../Performance/PerformancePanel', () => ({
  PerformancePanel: vi.fn(() => <div data-testid="mock-performance-panel">PerformancePanel</div>),
}));

vi.mock('../Language/LanguageSelector', () => ({
  LanguageSelector: vi.fn(() => <div data-testid="mock-language-selector">Lang</div>),
}));

// Context
vi.mock('../../context/GitContext', () => ({
  useGit: () => ({
    status: { changes: [], untracked: [] },
    currentBranch: 'main',
    refreshStatus: vi.fn(),
  }),
}));

vi.mock('../../context/ChatContext', () => ({
  useChat: () => ({
    isPanelOpen: false,
    togglePanel: vi.fn(),
  }),
}));

vi.mock('../../context/SkillContext', () => ({
  SkillProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Services
vi.mock('../../services/fileService', () => ({
  readFile: mockReadFile,
  writeFile: vi.fn().mockResolvedValue({ status: 'success' }),
  formatCode: vi.fn().mockResolvedValue({ status: 'success', data: { formatted: 'fc' } }),
}));

vi.mock('../../services/gitService', () => ({
  fetchGitDiff: vi.fn().mockResolvedValue({ status: 'success', data: { diff: '' } }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{children}</a>
  ),
}));

// ============================================================
// Helpers
// ============================================================
function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// ============================================================
// Tests
// ============================================================
describe('IDE + LazyCodeEditor 集成测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 重置 editorLoadedOnce 模块级状态
    (globalThis as unknown as { __resetEditorLoadedOnce?: () => void }).__resetEditorLoadedOnce?.();
    mockGetMonacoSync.mockReturnValue(null);
    mockGetMonaco.mockResolvedValue({});
    mockReadFile.mockResolvedValue({
      status: 'success',
      data: { content: 'console.log("hello");' },
    });
  });

  // ============================================================
  // P0: IDE 基础渲染
  // ============================================================

  it('[P0] EPI2.01-IDE-001: IDE 初始渲染显示欢迎界面', async () => {
    const { default: IDE } = await import('./IDE');
    render(<IDE />);

    expect(screen.getByText(/欢迎使用 Lapdev/)).toBeTruthy();
    expect(screen.queryByTestId('code-editor-placeholder')).toBeNull();
  });

  it('[P0] EPI2.01-IDE-002: 点击文件后显示 LazyCodeEditor 占位符', async () => {
    const { default: IDE } = await import('./IDE');
    render(<IDE />);

    fireEvent.click(screen.getByTestId('mock-file'));

    await waitFor(() => {
      expect(screen.getByTestId('code-editor-placeholder')).toBeTruthy();
    });
    expect(screen.getByText('Click to edit')).toBeTruthy();
  });

  it('[P0] EPI2.01-IDE-003: 点击占位符后加载 Monaco 并渲染 LspCodeEditor', async () => {
    const deferred = createDeferred<unknown>();
    mockGetMonaco.mockReturnValue(deferred.promise);

    const { default: IDE } = await import('./IDE');
    render(<IDE />);

    fireEvent.click(screen.getByTestId('mock-file'));

    const placeholder = await screen.findByTestId('code-editor-placeholder');
    fireEvent.click(placeholder);

    expect(screen.getByText('Loading editor...')).toBeTruthy();

    deferred.resolve({});

    await waitFor(() => {
      expect(screen.getByTestId('lsp-code-editor')).toBeTruthy();
    });
  });

  // ============================================================
  // P1: editorLoadedOnce 缓存行为
  // ============================================================

  it('[P1] EPI2.01-IDE-004: editorLoadedOnce=true 时直接显示 LspCodeEditor', async () => {
    mockGetMonacoSync.mockReturnValue({} as any);

    const { default: IDE } = await import('./IDE');
    render(<IDE />);

    fireEvent.click(screen.getByTestId('mock-file'));

    await waitFor(() => {
      expect(screen.getByTestId('lsp-code-editor')).toBeTruthy();
    });
  });

  // ============================================================
  // P1: Props 转发验证
  // ============================================================

  it('[P1] EPI2.01-IDE-005: LazyCodeEditor 接收正确 value 与 language', async () => {
    mockGetMonacoSync.mockReturnValue({} as any);

    const { default: IDE } = await import('./IDE');
    render(<IDE />);

    fireEvent.click(screen.getByTestId('mock-file'));

    await waitFor(() => {
      expect(screen.getByTestId('lsp-value').textContent).toBe('console.log("hello");');
    });
    expect(screen.getByTestId('lsp-language').textContent).toBe('typescript');
  });

  it('[P1] EPI2.01-IDE-006: onChange 触发更新 tab content', async () => {
    mockGetMonacoSync.mockReturnValue({} as any);

    const { default: IDE } = await import('./IDE');
    render(<IDE />);

    fireEvent.click(screen.getByTestId('mock-file'));

    await waitFor(() => {
      expect(screen.getByTestId('lsp-change')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('lsp-change'));

    await waitFor(() => {
      expect(screen.getByTestId('lsp-value').textContent).toBe('changed');
    });
  });

  // ============================================================
  // P1: SimpleIDE 集成
  // ============================================================

  it('[P1] EPI2.01-SIMPLE-001: SimpleIDE 渲染 LazyCodeEditor 占位符', async () => {
    const { default: SimpleIDE } = await import('./SimpleIDE');
    render(<SimpleIDE />);

    expect(screen.getByText(/欢迎使用 Lapdev/)).toBeTruthy();

    fireEvent.click(screen.getByTestId('mock-file'));

    await waitFor(() => {
      expect(screen.getByTestId('code-editor-placeholder')).toBeTruthy();
    });
    expect(screen.getByText('Click to edit')).toBeTruthy();
  });

  it('[P1] EPI2.01-SIMPLE-002: SimpleIDE 加载后显示 LspCodeEditor 并传递 props', async () => {
    mockGetMonacoSync.mockReturnValue({} as any);

    const { default: SimpleIDE } = await import('./SimpleIDE');
    render(<SimpleIDE />);

    fireEvent.click(screen.getByTestId('mock-file'));

    await waitFor(() => {
      expect(screen.getByTestId('lsp-code-editor')).toBeTruthy();
    });

    // SimpleIDE 当前实现使用 file.extension (pop) 作为 language prop (e.g. 'ts')
    // IDE.tsx 版本使用 detectLanguage() 映射 (返回 'typescript')
    // 此测试验证 SimpleIDE 确实将 language prop 传给 LazyCodeEditor
    const language = screen.getByTestId('lsp-language').textContent;
    expect(language).toBeTruthy();
    // test.ts -> extension = 'ts' (SimpleIDE 使用扩展名作为 language)
    expect(language).toBe('ts');
  });

  // ============================================================
  // P2: 错误处理
  // ============================================================

  it('[P2] EPI2.01-IDE-007: Monaco 加载失败时显示重试按钮', async () => {
    const deferred = createDeferred<unknown>();
    mockGetMonaco.mockReturnValue(deferred.promise);

    const { default: IDE } = await import('./IDE');
    render(<IDE />);

    fireEvent.click(screen.getByTestId('mock-file'));

    const placeholder = await screen.findByTestId('code-editor-placeholder');
    fireEvent.click(placeholder);

    deferred.reject(new Error('Network error'));

    await waitFor(() => {
      expect(screen.getByText('Click to retry')).toBeTruthy();
    });
  });
});
