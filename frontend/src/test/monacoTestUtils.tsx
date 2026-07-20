import React, { ReactNode } from 'react';
import { render, RenderOptions, act, waitFor, screen } from '@testing-library/react';
import { vi, Mock } from 'vitest';
import { ThemeProvider } from '../theme/ThemeContext';
import { AIProvider } from '../context/AIContext';
import { InlineCompletionProvider } from '../context/InlineCompletionContext';
import { GitProvider } from '../context/GitContext';
import * as Monaco from 'monaco-editor';

export interface MockEditor {
  onDidChangeModelContent: Mock;
  setValue: Mock;
  getValue: Mock;
  getModel: Mock;
  deltaDecorations: Mock;
  dispose: Mock;
  executeEdits: Mock;
  setPosition: Mock;
  focus: Mock;
  getPosition: Mock;
  setSelection: Mock;
  getSelection: Mock;
}

export const createMockEditor = (initialValue: string = ''): MockEditor => ({
  onDidChangeModelContent: vi.fn(),
  setValue: vi.fn(),
  getValue: vi.fn().mockReturnValue(initialValue),
  getModel: vi.fn().mockReturnValue({
    getValue: vi.fn().mockReturnValue(initialValue),
    getOffsetAt: vi.fn().mockReturnValue(initialValue.length),
    setLanguage: vi.fn(),
  }),
  deltaDecorations: vi.fn().mockReturnValue([]),
  dispose: vi.fn(),
  executeEdits: vi.fn(),
  setPosition: vi.fn(),
  focus: vi.fn(),
  getPosition: vi.fn().mockReturnValue({ lineNumber: 1, column: 1 }),
  setSelection: vi.fn(),
  getSelection: vi.fn(),
});

let currentMockEditor: MockEditor | null = null;

export const setupMonacoMock = (initialValue: string = ''): MockEditor => {
  currentMockEditor = createMockEditor(initialValue);
  
  vi.mocked(Monaco.editor.create).mockReturnValue(currentMockEditor as unknown as Monaco.editor.IStandaloneCodeEditor);
  vi.mocked(Monaco.editor.setModelLanguage).mockReset();
  vi.mocked(Monaco.editor.setTheme).mockReset();
  vi.mocked(Monaco.Range).mockReset().mockReturnValue({} as any);
  
  return currentMockEditor;
};

export const getMockEditor = (): MockEditor => {
  if (!currentMockEditor) {
    throw new Error('Monaco mock not initialized. Call setupMonacoMock() first.');
  }
  return currentMockEditor;
};

export const renderWithProviders = (
  ui: ReactNode,
  options?: RenderOptions
) => {
  return render(
    <ThemeProvider>
      <AIProvider>
        <InlineCompletionProvider>
          <GitProvider>
            {ui}
          </GitProvider>
        </InlineCompletionProvider>
      </AIProvider>
    </ThemeProvider>,
    options
  );
};

export const renderWithMonaco = (
  ui: ReactNode,
  options?: {
    initialValue?: string;
    renderOptions?: RenderOptions;
  }
) => {
  const { initialValue = '', renderOptions } = options || {};
  
  const mockEditor = setupMonacoMock(initialValue);
  const renderResult = renderWithProviders(ui, renderOptions);
  
  return {
    ...renderResult,
    mockEditor,
  };
};

export const renderWithMonacoAsync = async (
  ui: ReactNode,
  options?: {
    initialValue?: string;
    renderOptions?: RenderOptions;
  }
) => {
  const { initialValue = '', renderOptions } = options || {};
  
  const mockEditor = setupMonacoMock(initialValue);
  
  let renderResult: ReturnType<typeof render>;
  
  await act(async () => {
    renderResult = renderWithProviders(ui, renderOptions);
    await waitFor(() => {}, { timeout: 100 });
  });
  
  return {
    ...renderResult!,
    mockEditor,
  };
};

export const simulateEditorChange = (
  editor: MockEditor,
  newValue: string
): void => {
  editor.getValue.mockReturnValue(newValue);
  
  const onChangeHandler = editor.onDidChangeModelContent.mock.calls[0]?.[0];
  if (onChangeHandler) {
    onChangeHandler();
  }
};

export const waitForEditorMount = async (): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 50));
};

export const mockFetchGitStatus = (): void => {
  vi.mock('../services/gitService', () => ({
    fetchGitStatus: vi.fn().mockResolvedValue({ status: 'success', data: { staged: [], unstaged: [], untracked: [] } }),
    fetchBranches: vi.fn().mockResolvedValue({ status: 'success', data: { branches: [], current: 'main' } }),
    stageFiles: vi.fn().mockResolvedValue({ status: 'success' }),
    commitChanges: vi.fn().mockResolvedValue({ status: 'success' }),
    checkoutBranch: vi.fn().mockResolvedValue({ status: 'success' }),
    fetchGitDiff: vi.fn().mockResolvedValue({ status: 'success', data: { diff: '' } }),
  }));
};

export * from '@testing-library/react';
