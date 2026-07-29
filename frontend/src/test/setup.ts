import '@testing-library/jest-dom';
import { vi } from 'vitest';

const createMockEditor = (initialValue: string = '') => ({
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

vi.mock('monaco-editor', () => ({
  editor: {
    create: vi.fn().mockReturnValue(createMockEditor()),
    setModelLanguage: vi.fn(),
    setTheme: vi.fn(),
    setModelMarkers: vi.fn(),
    getModels: vi.fn().mockReturnValue([]),
    OverviewRulerLane: {
      Right: 4,
    },
  },
  languages: {
    onLanguage: vi.fn(),
    registerCompletionItemProvider: vi.fn(),
    registerDefinitionProvider: vi.fn(),
    registerReferenceProvider: vi.fn(),
    registerRenameProvider: vi.fn(),
    registerDocumentFormattingEditProvider: vi.fn(),
    registerSignatureHelpProvider: vi.fn(),
    registerHoverProvider: vi.fn(),
    CompletionItemKind: { Text: 1, Method: 2, Function: 3, Constructor: 4, Field: 5, Variable: 6, Class: 7, Interface: 8, Module: 9, Property: 10, Unit: 11, Value: 12, Enum: 13, Keyword: 14, Snippet: 15, Color: 16, File: 17, Reference: 18 },
  },
  Range: vi.fn().mockReturnValue({}),
  Uri: { parse: vi.fn().mockReturnValue({ toString: () => 'file:///test.ts' }) },
  Position: vi.fn().mockReturnValue({ lineNumber: 1, column: 1 }),
  MarkerSeverity: { Error: 8, Warning: 4, Info: 2, Hint: 1 },
}));

const createMockWebSocket = (url: string | URL, _protocols?: string | string[]) => ({
  onopen: null,
  onmessage: null,
  onerror: null,
  onclose: null,
  send: vi.fn(),
  close: vi.fn(),
  readyState: 0,
  url: typeof url === 'string' ? url : url.toString(),
});

const mockWebSocket = vi.fn(createMockWebSocket);

Object.defineProperty(mockWebSocket, 'CONNECTING', { value: 0, writable: false });
Object.defineProperty(mockWebSocket, 'OPEN', { value: 1, writable: false });
Object.defineProperty(mockWebSocket, 'CLOSING', { value: 2, writable: false });
Object.defineProperty(mockWebSocket, 'CLOSED', { value: 3, writable: false });

globalThis.WebSocket = mockWebSocket as unknown as typeof WebSocket;

globalThis.fetch = vi.fn().mockResolvedValue({
  json: vi.fn().mockResolvedValue({ status: 'success', data: {} }),
});

const storage: Record<string, string> = {};
globalThis.localStorage = {
  getItem: vi.fn((key: string) => storage[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    storage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete storage[key];
  }),
  clear: vi.fn(() => {
    Object.keys(storage).forEach(key => delete storage[key]);
  }),
  length: 0,
  key: vi.fn((index: number) => Object.keys(storage)[index] || null),
};

globalThis.matchMedia = vi.fn().mockReturnValue({
  matches: false,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
});
