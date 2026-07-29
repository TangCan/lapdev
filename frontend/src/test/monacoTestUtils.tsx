import React, { ReactNode } from 'react';
import { render, RenderOptions, act, waitFor } from '@testing-library/react';
import { vi, Mock } from 'vitest';
import { ThemeProvider } from '../theme/ThemeContext';
import { AIProvider } from '../context/AIContext';
import { InlineCompletionProvider } from '../context/InlineCompletionContext';
import { GitProvider } from '../context/GitContext';
import type { MonacoModule } from '../services/monacoLoader';

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

let mockEditorInstance: MockEditor | null = null;
let mockMonacoModule: MonacoModule | null = null;

vi.mock('../services/monacoLoader', () => {
  const mod = {
    getMonaco: vi.fn(),
    getMonacoSync: vi.fn(),
  };
  mod.getMonaco.mockImplementation(() => Promise.resolve(mockMonacoModule));
  mod.getMonacoSync.mockImplementation(() => mockMonacoModule);
  return mod;
});

export const createMockEditor = (initialValue: string = ''): MockEditor => ({
  onDidChangeModelContent: vi.fn(),
  setValue: vi.fn(),
  getValue: vi.fn().mockReturnValue(initialValue),
  getModel: vi.fn().mockReturnValue({
    getValue: vi.fn().mockReturnValue(initialValue),
    getOffsetAt: vi.fn().mockReturnValue(initialValue.length),
    setLanguage: vi.fn(),
    getLineCount: vi.fn().mockReturnValue(1),
    getLineLength: vi.fn().mockReturnValue(initialValue.length),
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

export const setupMonacoMock = (initialValue: string = ''): MockEditor => {
  mockEditorInstance = createMockEditor(initialValue);

  const mockRange = vi.fn().mockReturnValue({
    startLineNumber: 1,
    startColumn: 1,
    endLineNumber: 1,
    endColumn: 1,
  });

  const mockUriParse = vi.fn().mockReturnValue({ toString: () => 'file:///test.ts' });

  mockMonacoModule = {
    editor: {
      create: vi.fn().mockReturnValue(mockEditorInstance),
      setModelLanguage: vi.fn(),
      setTheme: vi.fn(),
      setModelMarkers: vi.fn(),
      getModels: vi.fn().mockReturnValue([]),
      OverviewRulerLane: { Right: 4 },
    },
    languages: {
      registerCompletionItemProvider: vi.fn(),
      registerDefinitionProvider: vi.fn(),
      registerReferenceProvider: vi.fn(),
      registerRenameProvider: vi.fn(),
      registerDocumentFormattingEditProvider: vi.fn(),
      registerSignatureHelpProvider: vi.fn(),
      registerHoverProvider: vi.fn(),
      CompletionItemKind: { Text: 1, Method: 2, Function: 3, Constructor: 4, Field: 5, Variable: 6, Class: 7, Interface: 8, Module: 9, Property: 10, Unit: 11, Value: 12, Enum: 13, Keyword: 14, Snippet: 15, Color: 16, File: 17, Reference: 18 },
    },
    Range: mockRange,
    Uri: { parse: mockUriParse },
    Position: vi.fn().mockReturnValue({ lineNumber: 1, column: 1 }),
    MarkerSeverity: { Error: 8, Warning: 4, Info: 2, Hint: 1 },
  } as unknown as MonacoModule;

  return mockEditorInstance;
};

export const getMockEditor = (): MockEditor => {
  if (!mockEditorInstance) {
    throw new Error('Monaco mock not initialized. Call setupMonacoMock() first.');
  }
  return mockEditorInstance;
};

export const getMockMonacoModule = (): MonacoModule | null => {
  return mockMonacoModule;
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