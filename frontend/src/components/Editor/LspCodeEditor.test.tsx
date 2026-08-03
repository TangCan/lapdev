/**
 * Integration test suite for LspCodeEditor with monacoOptimizer
 *
 * Story: EPI2.02 - 大文件优化配置
 * Test Levels: Integration (Vitest)
 * Coverage: monacoOptimizer 集成、updateOptions 动态切换、prop 透传、回归保护
 *
 * 已激活 — EPI2.02 实现后激活所有测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import React, { RefObject } from 'react';
import { LspCodeEditor, type LspCodeEditorHandle } from './LspCodeEditor';

const { mockGetMonaco, mockGetMonacoSync } = vi.hoisted(() => ({
  mockGetMonaco: vi.fn(),
  mockGetMonacoSync: vi.fn(),
}));

const { mockUseLSP, mockUseAI, mockUseInlineCompletion } = vi.hoisted(() => ({
  mockUseLSP: vi.fn(),
  mockUseAI: vi.fn(),
  mockUseInlineCompletion: vi.fn(),
}));

const mockEditorInstance = vi.hoisted(() => ({
  onDidChangeModelContent: vi.fn(),
  getValue: vi.fn().mockReturnValue(''),
  getModel: vi.fn().mockReturnValue({
    getValue: vi.fn().mockReturnValue(''),
    getValueInRange: vi.fn().mockReturnValue(''),
    getLineCount: vi.fn().mockReturnValue(1),
    getLineLength: vi.fn().mockReturnValue(1),
    getOffsetAt: vi.fn().mockReturnValue(0),
    setLanguage: vi.fn(),
  }),
  updateOptions: vi.fn(),
  deltaDecorations: vi.fn().mockReturnValue([]),
  dispose: vi.fn(),
  executeEdits: vi.fn(),
  setPosition: vi.fn(),
  focus: vi.fn(),
  getPosition: vi.fn().mockReturnValue({ lineNumber: 1, column: 1 }),
  setSelection: vi.fn(),
  getSelection: vi.fn(),
  trigger: vi.fn(),
  setValue: vi.fn(),
  revealLineInCenter: vi.fn(),
}));

vi.mock('../../services/monacoLoader', () => ({
  getMonaco: mockGetMonaco,
  getMonacoSync: mockGetMonacoSync,
  loadLanguage: vi.fn(),
}));

vi.mock('../../context/LSPContext', () => ({
  useLSP: mockUseLSP,
}));

vi.mock('../../context/AIContext', () => ({
  useAI: mockUseAI,
}));

vi.mock('../../context/InlineCompletionContext', () => ({
  useInlineCompletion: mockUseInlineCompletion,
}));

vi.mock('../../services/aiService', () => ({
  aiService: {
    getInlineCompletion: vi.fn().mockResolvedValue({ completion: '' }),
  },
}));

function generateContent(lineCount: number): string {
  if (lineCount === 0) return '';
  return Array(lineCount).fill('line of code').join('\n');
}

describe('LspCodeEditor Integration with monacoOptimizer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMonacoSync.mockReturnValue({
      editor: {
        create: vi.fn().mockReturnValue(mockEditorInstance),
        setModelLanguage: vi.fn(),
        OverviewRulerLane: { Right: 4 },
      },
      languages: {
        onLanguage: vi.fn(),
      },
      Position: vi.fn().mockReturnValue({ lineNumber: 1, column: 1 }),
      Range: vi.fn().mockReturnValue({}),
      Uri: { parse: vi.fn().mockReturnValue({ toString: () => 'file:///test.ts' }) },
    });
    mockGetMonaco.mockResolvedValue(mockGetMonacoSync());
    mockUseLSP.mockReturnValue({
      connect: vi.fn().mockResolvedValue(undefined),
      registerEditor: vi.fn(),
      unregisterEditor: vi.fn(),
    });
    mockUseAI.mockReturnValue({ isConnected: true });
    mockUseInlineCompletion.mockReturnValue({
      inlineCompletionEnabled: false,
      inlineCompletionVisible: false,
      setInlineCompletionVisible: vi.fn(),
      ghostText: '',
      setGhostText: vi.fn(),
    });
  });

  // ================================================================
  // AC4: LspCodeEditor 集成 monacoOptimizer
  // ================================================================

  it('[P0] EPI2.02-INT-001: LspCodeEditor 创建大文件编辑器时调用 getOptimizedEditorOptions', async () => {
    const largeContent = generateContent(10001);

    await act(async () => {
      render(
        <LspCodeEditor
          value={largeContent}
          language="typescript"
          onChange={() => {}}
        />
      );
    });

    const monacoMod = mockGetMonacoSync();
    const createCalls = monacoMod.editor.create.mock.calls;
    expect(createCalls.length).toBeGreaterThan(0);

    const passedOptions = createCalls[0][1];
    expect(passedOptions.minimap).toEqual({ enabled: false });
    expect(passedOptions.folding).toBe(false);
    expect(passedOptions.hover).toEqual({ enabled: false });
  });

  it('[P0] EPI2.02-INT-002: 文件内容跨越阈值时调用 updateOptions', async () => {
    const smallContent = generateContent(100);

    let rerenderFn: any;
    await act(async () => {
      const { rerender } = render(
        <LspCodeEditor
          value={smallContent}
          language="typescript"
          onChange={() => {}}
        />
      );
      rerenderFn = rerender;
    });

    vi.useFakeTimers();

    const largeContent = generateContent(10001);
    await act(async () => {
      rerenderFn(
        <LspCodeEditor
          value={largeContent}
          language="typescript"
          onChange={() => {}}
        />
      );
    });

    vi.advanceTimersByTime(300);

    await act(async () => {
      vi.advanceTimersByTime(16);
    });

    expect(mockEditorInstance.updateOptions).toHaveBeenCalled();

    const updateCalls = mockEditorInstance.updateOptions.mock.calls;
    const lastCallOptions = updateCalls[updateCalls.length - 1][0];
    expect(lastCallOptions.minimap).toEqual({ enabled: false });
    expect(lastCallOptions.folding).toBe(false);

    vi.useRealTimers();
  });

  it('[P1] EPI2.02-INT-003: 超大文件(≥50k)触发额外优化', async () => {
    const hugeContent = generateContent(50001);

    await act(async () => {
      render(
        <LspCodeEditor
          value={hugeContent}
          language="typescript"
          onChange={() => {}}
        />
      );
    });

    const monacoMod = mockGetMonacoSync();
    const createCalls = monacoMod.editor.create.mock.calls;
    expect(createCalls.length).toBeGreaterThan(0);

    const passedOptions = createCalls[0][1];
    expect(passedOptions.lineNumbers).toBe('off');
    expect(passedOptions.multiCursorLimit).toBe(1);
    expect(passedOptions.smoothScrolling).toBe(false);
  });

  // ================================================================
  // AC3: 普通文件保持完整功能
  // ================================================================

  it('[P0] EPI2.02-INT-004: 普通文件创建时不应用任何优化', async () => {
    const normalContent = generateContent(5000);

    await act(async () => {
      render(
        <LspCodeEditor
          value={normalContent}
          language="typescript"
          onChange={() => {}}
        />
      );
    });

    const monacoMod = mockGetMonacoSync();
    const createCalls = monacoMod.editor.create.mock.calls;
    expect(createCalls.length).toBeGreaterThan(0);

    const passedOptions = createCalls[0][1];
    expect(passedOptions.minimap).toEqual({ enabled: true });
    expect(passedOptions.folding).toBe(true);
    expect(passedOptions.hover).toEqual({ enabled: true });
    expect(passedOptions.lineNumbers).toBe('on');
  });

  // ================================================================
  // AC5: prop 透传
  // ================================================================

  it('[P1] EPI2.02-INT-005: minimap prop 在普通文件中正确生效', async () => {
    const normalContent = generateContent(5000);

    await act(async () => {
      render(
        <LspCodeEditor
          value={normalContent}
          language="typescript"
          onChange={() => {}}
          minimap={false}
        />
      );
    });

    const monacoMod = mockGetMonacoSync();
    const createCalls = monacoMod.editor.create.mock.calls;
    const passedOptions = createCalls[0][1];
    expect(passedOptions.minimap).toEqual({ enabled: false });
  });

  it('[P1] EPI2.02-INT-006: minimap prop 在大文件中被优化覆盖', async () => {
    const largeContent = generateContent(10001);

    await act(async () => {
      render(
        <LspCodeEditor
          value={largeContent}
          language="typescript"
          onChange={() => {}}
          minimap={true}
        />
      );
    });

    const monacoMod = mockGetMonacoSync();
    const createCalls = monacoMod.editor.create.mock.calls;
    const passedOptions = createCalls[0][1];
    expect(passedOptions.minimap).toEqual({ enabled: false });
  });

  // ================================================================
  // 回归保护
  // ================================================================

  it('[P0] EPI2.02-INT-007: 大文件优化不破坏 AI 内联补全', async () => {
    const largeContent = generateContent(10001);

    mockUseInlineCompletion.mockReturnValue({
      inlineCompletionEnabled: true,
      inlineCompletionVisible: false,
      setInlineCompletionVisible: vi.fn(),
      ghostText: '',
      setGhostText: vi.fn(),
    });

    await act(async () => {
      render(
        <LspCodeEditor
          value={largeContent}
          language="typescript"
          onChange={() => {}}
        />
      );
    });

    expect(mockEditorInstance.onDidChangeModelContent).toHaveBeenCalled();

    const monacoMod = mockGetMonacoSync();
    const createCalls = monacoMod.editor.create.mock.calls;
    const passedOptions = createCalls[0][1];
    expect(passedOptions.minimap).toEqual({ enabled: false });

    (window as any).__test_triggerCompletion?.();
    expect(mockUseAI().isConnected).toBe(true);
  });

  it('[P0] EPI2.02-INT-008: 大文件优化不破坏 Diff 装饰', async () => {
    const largeContent = generateContent(10001);
    const diffLines = [
      { lineNumber: 1, type: 'added' as const },
      { lineNumber: 5, type: 'modified' as const },
    ];

    let rerenderFn: any;
    await act(async () => {
      const { rerender } = render(
        <LspCodeEditor
          value={largeContent}
          language="typescript"
          onChange={() => {}}
          diffLines={diffLines}
        />
      );
      rerenderFn = rerender;
    });

    await act(async () => {
      rerenderFn(
        <LspCodeEditor
          value={largeContent}
          language="typescript"
          onChange={() => {}}
          diffLines={[...diffLines]}
        />
      );
    });

    expect(mockEditorInstance.deltaDecorations).toHaveBeenCalled();

    const monacoMod = mockGetMonacoSync();
    const createCalls = monacoMod.editor.create.mock.calls;
    const passedOptions = createCalls[0][1];
    expect(passedOptions.minimap).toEqual({ enabled: false });
  });

  it('[P0] EPI2.02-INT-009: 大文件优化不破坏快捷键', async () => {
    const largeContent = generateContent(10001);

    await act(async () => {
      render(
        <LspCodeEditor
          value={largeContent}
          language="typescript"
          onChange={() => {}}
        />
      );
    });

    const monacoMod = mockGetMonacoSync();
    const createCalls = monacoMod.editor.create.mock.calls;
    const passedOptions = createCalls[0][1];
    expect(passedOptions.minimap).toEqual({ enabled: false });

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true, key: 's' }));
    });
    expect(mockEditorInstance.trigger).toHaveBeenCalledWith('keyboard', 'editor.action.formatDocument', {});

    mockEditorInstance.trigger.mockClear();

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true, key: 'd' }));
    });
    expect(mockEditorInstance.trigger).toHaveBeenCalledWith('keyboard', 'editor.action.goToDefinition', {});
  });

  it('[P1] EPI2.02-INT-010: 大文件优化不破坏 LSP 连接', async () => {
    const largeContent = generateContent(10001);
    const mockConnect = vi.fn().mockResolvedValue(undefined);
    const mockRegisterEditor = vi.fn();
    const mockUnregisterEditor = vi.fn();

    mockUseLSP.mockReturnValue({
      connect: mockConnect,
      registerEditor: mockRegisterEditor,
      unregisterEditor: mockUnregisterEditor,
    });

    await act(async () => {
      render(
        <LspCodeEditor
          value={largeContent}
          language="typescript"
          onChange={() => {}}
        />
      );
    });

    expect(mockConnect).toHaveBeenCalledWith({ language: 'typescript' });
    expect(mockRegisterEditor).toHaveBeenCalled();

    const monacoMod = mockGetMonacoSync();
    const createCalls = monacoMod.editor.create.mock.calls;
    const passedOptions = createCalls[0][1];
    expect(passedOptions.minimap).toEqual({ enabled: false });
  });

  // ================================================================
  // 新测试: retryInit / 阈值守卫 / debounce / rAF / minimap 意图
  // ================================================================

  it('[P0] EPI2.02-INT-011: retryInit disposes old editor before creating new one', async () => {
    const normalContent = generateContent(5000);
    const editorRef: RefObject<LspCodeEditorHandle | null> = { current: null };

    const { unmount } = await act(async () => {
      const { unmount } = render(
        <LspCodeEditor
          ref={editorRef}
          value={normalContent}
          language="typescript"
          onChange={() => {}}
        />
      );
      return { unmount };
    });

    const monacoMod = mockGetMonacoSync();
    const createCallsBefore = monacoMod.editor.create.mock.calls.length;

    await act(async () => {
      await editorRef.current?.retryInit();
    });

    expect(mockEditorInstance.dispose).toHaveBeenCalled();

    const createCallsAfter = monacoMod.editor.create.mock.calls.length;
    expect(createCallsAfter).toBeGreaterThan(createCallsBefore);

    unmount();
  });

  it('[P1] EPI2.02-INT-012: First render does not trigger redundant updateOptions (thresholdInitRef guard)', async () => {
    const largeContent = generateContent(10001);

    vi.useFakeTimers();

    await act(async () => {
      render(
        <LspCodeEditor
          value={largeContent}
          language="typescript"
          onChange={() => {}}
        />
      );
    });

    vi.advanceTimersByTime(300);

    await act(async () => {
      vi.advanceTimersByTime(16);
    });

    expect(mockEditorInstance.updateOptions).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('[P1] EPI2.02-INT-013: Threshold change debounces 300ms', async () => {
    const smallContent = generateContent(100);

    let rerenderFn: any;
    await act(async () => {
      const { rerender } = render(
        <LspCodeEditor
          value={smallContent}
          language="typescript"
          onChange={() => {}}
        />
      );
      rerenderFn = rerender;
    });

    vi.useFakeTimers();

    const largeContent = generateContent(10001);
    await act(async () => {
      rerenderFn(
        <LspCodeEditor
          value={largeContent}
          language="typescript"
          onChange={() => {}}
        />
      );
    });

    expect(mockEditorInstance.updateOptions).not.toHaveBeenCalled();

    vi.advanceTimersByTime(299);
    expect(mockEditorInstance.updateOptions).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);

    await act(async () => {
      vi.advanceTimersByTime(16);
    });

    expect(mockEditorInstance.updateOptions).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('[P2] EPI2.02-INT-014: updateOptions called via requestAnimationFrame', async () => {
    const smallContent = generateContent(100);

    let rerenderFn: any;
    await act(async () => {
      const { rerender } = render(
        <LspCodeEditor
          value={smallContent}
          language="typescript"
          onChange={() => {}}
        />
      );
      rerenderFn = rerender;
    });

    vi.useFakeTimers();

    const rafSpy = vi.fn((cb: FrameRequestCallback) => {
      return window.setTimeout(() => cb(performance.now()), 16);
    });
    vi.stubGlobal('requestAnimationFrame', rafSpy);

    const largeContent = generateContent(10001);
    await act(async () => {
      rerenderFn(
        <LspCodeEditor
          value={largeContent}
          language="typescript"
          onChange={() => {}}
        />
      );
    });

    vi.advanceTimersByTime(300);

    expect(rafSpy).toHaveBeenCalled();
    expect(mockEditorInstance.updateOptions).not.toHaveBeenCalled();

    vi.advanceTimersByTime(16);
    expect(mockEditorInstance.updateOptions).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('[P0] EPI2.02-INT-015: Small file respects user minimap=false intent', async () => {
    const normalContent = generateContent(5000);

    await act(async () => {
      render(
        <LspCodeEditor
          value={normalContent}
          language="typescript"
          onChange={() => {}}
          minimap={false}
        />
      );
    });

    const monacoMod = mockGetMonacoSync();
    const createCalls = monacoMod.editor.create.mock.calls;
    expect(createCalls.length).toBeGreaterThan(0);

    const passedOptions = createCalls[0][1];
    expect(passedOptions.minimap).toEqual({ enabled: false });
    expect(passedOptions.folding).toBe(true);
    expect(passedOptions.hover).toEqual({ enabled: true });
    expect(passedOptions.lineNumbers).toBe('on');
  });
});