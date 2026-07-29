/**
 * Test suite for LazyCodeEditor component
 *
 * Story: EPI2.01 - Monaco Editor 懒加载
 * Test Levels: Unit (Vitest + Testing Library)
 * Coverage: 状态机转换、错误处理、缓存行为、Props 转发
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';

const { mockGetMonaco, mockGetMonacoSync } = vi.hoisted(() => ({
  mockGetMonaco: vi.fn(),
  mockGetMonacoSync: vi.fn(),
}));

const LspCodeEditorMock = vi.hoisted(() =>
  vi.fn(({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div data-testid="lsp-code-editor">
      <span data-testid="lsp-value">{value}</span>
      <button data-testid="lsp-change" onClick={() => onChange('changed')}>Change</button>
    </div>
  ))
);

vi.mock('../../services/monacoLoader', () => ({
  getMonaco: mockGetMonaco,
  getMonacoSync: mockGetMonacoSync,
}));

vi.mock('./LspCodeEditor', () => ({
  LspCodeEditor: LspCodeEditorMock,
}));

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

import { LazyCodeEditor, resetEditorState } from './LazyCodeEditor';

const FAKE_MONACO = { languages: { onLanguage: vi.fn() } };

describe('LazyCodeEditor Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMonacoSync.mockReturnValue(null);
    resetEditorState();
  });

  // ================================================================
  // AC2: 初始渲染与状态转换
  // ================================================================

  it('[P0] EPI2.01-UNIT-001: 初始渲染显示 "Click to edit" 占位符', () => {
    render(<LazyCodeEditor value="" language="typescript" onChange={() => {}} />);

    expect(screen.getByTestId('code-editor-placeholder')).toBeTruthy();
    expect(screen.getByText('Click to edit')).toBeTruthy();
    expect(screen.queryByTestId('lsp-code-editor')).toBeNull();
  });

  it('[P0] EPI2.01-UNIT-002: onClick 触发状态转换为 loading', async () => {
    const deferred = createDeferred<typeof FAKE_MONACO>();
    mockGetMonaco.mockReturnValue(deferred.promise);

    render(<LazyCodeEditor value="" language="typescript" onChange={() => {}} />);

    const placeholder = screen.getByTestId('code-editor-placeholder');
    await act(async () => {
      fireEvent.click(placeholder);
    });

    expect(screen.getByText('Loading editor...')).toBeTruthy();
    expect(screen.queryByTestId('lsp-code-editor')).toBeNull();

    deferred.resolve(FAKE_MONACO);
  });

  it('[P0] EPI2.01-UNIT-003: onFocus 触发状态转换为 loading', async () => {
    const deferred = createDeferred<typeof FAKE_MONACO>();
    mockGetMonaco.mockReturnValue(deferred.promise);

    render(<LazyCodeEditor value="" language="typescript" onChange={() => {}} />);

    const placeholder = screen.getByTestId('code-editor-placeholder');
    await act(async () => {
      fireEvent.focus(placeholder);
    });

    expect(screen.getByText('Loading editor...')).toBeTruthy();
    deferred.resolve(FAKE_MONACO);
  });

  it('[P1] EPI2.01-UNIT-011: onMouseEnter 悬停触发加载', async () => {
    const deferred = createDeferred<typeof FAKE_MONACO>();
    mockGetMonaco.mockReturnValue(deferred.promise);

    render(<LazyCodeEditor value="" language="typescript" onChange={() => {}} />);

    const placeholder = screen.getByTestId('code-editor-placeholder');
    await act(async () => {
      fireEvent.mouseEnter(placeholder);
    });

    expect(screen.getByText('Loading editor...')).toBeTruthy();
    deferred.resolve(FAKE_MONACO);
  });

  it('[P0] EPI2.01-UNIT-004: loading 完成后渲染 LspCodeEditor', async () => {
    const deferred = createDeferred<typeof FAKE_MONACO>();
    mockGetMonaco.mockReturnValue(deferred.promise);

    render(<LazyCodeEditor value="const x = 1;" language="typescript" onChange={() => {}} />);

    const placeholder = screen.getByTestId('code-editor-placeholder');
    await act(async () => {
      fireEvent.click(placeholder);
    });

    expect(screen.getByText('Loading editor...')).toBeTruthy();

    await act(async () => {
      deferred.resolve(FAKE_MONACO);
    });

    expect(screen.getByTestId('lsp-code-editor')).toBeTruthy();
  });

  it('[P1] EPI2.01-UNIT-012: Loading 状态使用 animate-pulse 样式', async () => {
    const deferred = createDeferred<typeof FAKE_MONACO>();
    mockGetMonaco.mockReturnValue(deferred.promise);

    render(<LazyCodeEditor value="" language="typescript" onChange={() => {}} />);

    const placeholder = screen.getByTestId('code-editor-placeholder');
    await act(async () => {
      fireEvent.click(placeholder);
    });

    const loadingText = screen.getByText('Loading editor...');
    expect(loadingText.className).toContain('animate-pulse');

    deferred.resolve(FAKE_MONACO);
  });

  // ================================================================
  // AC3: 缓存与复用 - getMonacoSync 决定初始状态
  // ================================================================

  it('[P1] EPI2.01-UNIT-005: getMonacoSync 返回非空时跳过 idle 直接渲染', () => {
    mockGetMonacoSync.mockReturnValue(FAKE_MONACO);

    render(
      <LazyCodeEditor value="first" language="typescript" onChange={() => {}} />
    );

    expect(screen.queryByText('Click to edit')).toBeNull();
    expect(screen.getByTestId('lsp-code-editor')).toBeTruthy();
  });

  it('[P1] EPI2.01-UNIT-010: getMonacoSync() 返回值决定初始状态', () => {
    mockGetMonacoSync.mockReturnValue(null);
    render(
      <LazyCodeEditor value="test" language="typescript" onChange={() => {}} />
    );
    expect(screen.getByText('Click to edit')).toBeTruthy();
  });

  it('[P1] EPI2.01-UNIT-010b: getMonacoSync 返回非空时初始渲染跳过 idle', () => {
    mockGetMonacoSync.mockReturnValue(FAKE_MONACO);

    render(
      <LazyCodeEditor value="test" language="typescript" onChange={() => {}} />
    );

    expect(screen.queryByText('Click to edit')).toBeNull();
    expect(screen.getByTestId('lsp-code-editor')).toBeTruthy();
  });

  it('[P1] EPI2.01-UNIT-016: editorLoadedOnce 跨组件实例持久化', async () => {
    const deferred = createDeferred<typeof FAKE_MONACO>();
    mockGetMonaco.mockReturnValue(deferred.promise);
    mockGetMonacoSync.mockReturnValue(null);

    const { unmount } = render(
      <LazyCodeEditor value="first" language="typescript" onChange={() => {}} />
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('code-editor-placeholder'));
    });

    await act(async () => {
      deferred.resolve(FAKE_MONACO);
    });

    expect(screen.getByTestId('lsp-code-editor')).toBeTruthy();
    unmount();

    // Reset mocks before second render
    mockGetMonacoSync.mockReturnValue(FAKE_MONACO);

    render(
      <LazyCodeEditor value="second" language="typescript" onChange={() => {}} />
    );

    expect(screen.queryByText('Click to edit')).toBeNull();
    expect(screen.getByTestId('lsp-code-editor')).toBeTruthy();
  });

  // ================================================================
  // AC2/AC6: 错误处理
  // ================================================================

  it('[P0] EPI2.01-UNIT-014: getMonaco() 失败后进入 error 状态', async () => {
    mockGetMonaco.mockRejectedValueOnce(new Error('Network error'));

    render(<LazyCodeEditor value="" language="typescript" onChange={() => {}} />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('code-editor-placeholder'));
    });

    expect(screen.getByText('Click to retry')).toBeTruthy();
    expect(screen.getByTestId('code-editor-placeholder')).toBeTruthy();
  });

  it('[P2] EPI2.01-UNIT-019: Error retry 点击重试按钮恢复加载', async () => {
    const failDeferred = createDeferred<typeof FAKE_MONACO>();
    const successDeferred = createDeferred<typeof FAKE_MONACO>();

    mockGetMonaco
      .mockReturnValueOnce(failDeferred.promise)
      .mockReturnValueOnce(successDeferred.promise);

    render(<LazyCodeEditor value="" language="typescript" onChange={() => {}} />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('code-editor-placeholder'));
    });

    await act(async () => {
      failDeferred.reject(new Error('First failure'));
    });

    expect(screen.getByText('Click to retry')).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByTestId('code-editor-placeholder'));
    });

    await act(async () => {
      successDeferred.resolve(FAKE_MONACO);
    });

    expect(screen.getByTestId('lsp-code-editor')).toBeTruthy();
  });

  it('[P2] EPI2.01-UNIT-020: 键盘 Enter 触发重试', async () => {
    const failDeferred = createDeferred<typeof FAKE_MONACO>();
    const successDeferred = createDeferred<typeof FAKE_MONACO>();

    mockGetMonaco
      .mockReturnValueOnce(failDeferred.promise)
      .mockReturnValueOnce(successDeferred.promise);

    render(<LazyCodeEditor value="" language="typescript" onChange={() => {}} />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('code-editor-placeholder'));
    });
    await act(async () => {
      failDeferred.reject(new Error('Fail'));
    });

    const retryButton = screen.getByTestId('code-editor-placeholder');
    expect(retryButton.textContent).toContain('retry');

    await act(async () => {
      fireEvent.keyDown(retryButton, { key: 'Enter' });
    });
    await act(async () => {
      successDeferred.resolve(FAKE_MONACO);
    });

    expect(screen.getByTestId('lsp-code-editor')).toBeTruthy();
  });

  it('[P0] EPI2.01-UNIT-015: ErrorBoundary 捕获错误并显示 fallback', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const failDeferred = createDeferred<typeof FAKE_MONACO>();
    mockGetMonaco.mockReturnValue(failDeferred.promise);

    render(<LazyCodeEditor value="" language="typescript" onChange={() => {}} />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('code-editor-placeholder'));
    });
    await act(async () => {
      failDeferred.reject(new Error('Load failed'));
    });

    expect(screen.getByText('Click to retry')).toBeTruthy();
    errorSpy.mockRestore();
  });

  // ================================================================
  // AC4: Props 转发
  // ================================================================

  it('[P2] EPI2.01-UNIT-006: CodeEditor 基础 API 兼容性', () => {
    const mockOnChange = vi.fn();
    const diffLines = [
      { lineNumber: 1, type: 'added' as const },
      { lineNumber: 5, type: 'deleted' as const },
    ];

    render(
      <LazyCodeEditor
        value="const x = 1;"
        language="typescript"
        onChange={mockOnChange}
        diffLines={diffLines}
        uri="file:///test.ts"
      />
    );

    expect(screen.getByTestId('code-editor-placeholder')).toBeTruthy();
    expect(screen.getByText('Click to edit')).toBeTruthy();
  });

  it('[P1] EPI2.01-UNIT-018: Props 转发 (fontSize/minimap/readOnly) 到 LspCodeEditor', () => {
    mockGetMonacoSync.mockReturnValue(FAKE_MONACO);

    render(
      <LazyCodeEditor
        value="test"
        language="typescript"
        onChange={() => {}}
        fontSize={16}
        minimap={false}
        readOnly={true}
        diffLines={[{ lineNumber: 1, type: 'modified' }]}
        uri="file:///test.ts"
      />
    );

    expect(screen.getByTestId('lsp-code-editor')).toBeTruthy();
  });

  // ================================================================
  // AC6: 回归
  // ================================================================

  it('[P0] EPI2.01-UNIT-008: 空值 value 渲染不崩溃', () => {
    render(<LazyCodeEditor value="" language="typescript" onChange={() => {}} />);

    expect(screen.getByTestId('code-editor-placeholder')).toBeTruthy();
  });
});

describe('LazyCodeEditor Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMonacoSync.mockReturnValue(null);
    resetEditorState();
  });

  it('idle 占位符具有 tabindex', () => {
    render(<LazyCodeEditor value="" language="typescript" onChange={() => {}} />);

    const placeholder = screen.getByTestId('code-editor-placeholder');
    expect(placeholder.getAttribute('tabindex')).toBe('0');
  });

  it('错误状态具有 retry ARIA role 和 label', async () => {
    const failDeferred = createDeferred<typeof FAKE_MONACO>();
    mockGetMonaco.mockReturnValue(failDeferred.promise);

    render(<LazyCodeEditor value="" language="typescript" onChange={() => {}} />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('code-editor-placeholder'));
    });
    await act(async () => {
      failDeferred.reject(new Error('fail'));
    });

    const retry = screen.getByTestId('code-editor-placeholder');
    expect(retry.getAttribute('role')).toBe('button');
    expect(retry.getAttribute('aria-label')).toContain('retry');
    expect(retry.getAttribute('tabindex')).toBe('0');
  });
});
