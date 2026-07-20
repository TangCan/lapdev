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
    OverviewRulerLane: {
      Right: 1,
    },
  },
  Range: vi.fn().mockReturnValue({}),
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

(globalThis as any).WebSocket = mockWebSocket as unknown as typeof WebSocket;

(globalThis as any).fetch = vi.fn().mockResolvedValue({
  json: vi.fn().mockResolvedValue({ status: 'success', data: {} }),
});

const storage: Record<string, string> = {};
(globalThis as any).localStorage = {
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
};

(globalThis as any).matchMedia = vi.fn().mockReturnValue({
  matches: false,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
});
