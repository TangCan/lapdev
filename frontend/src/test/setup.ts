import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Monaco Editor using Vitest
vi.mock('monaco-editor', () => ({
  editor: {
    create: vi.fn().mockReturnValue({
      onDidChangeModelContent: vi.fn(),
      setValue: vi.fn(),
      getValue: vi.fn().mockReturnValue(''),
      getModel: vi.fn().mockReturnValue({}),
      deltaDecorations: vi.fn().mockReturnValue([]),
      dispose: vi.fn(),
    }),
    setModelLanguage: vi.fn(),
    OverviewRulerLane: {
      Right: 1,
    },
  },
  Range: vi.fn().mockReturnValue({}),
}));

// Mock WebSocket
interface MockWebSocket {
  new (url: string | URL, protocols?: string | string[] | undefined): WebSocket;
  prototype: WebSocket;
  readonly CONNECTING: 0;
  readonly OPEN: 1;
  readonly CLOSING: 2;
  readonly CLOSED: 3;
  (url: string | URL, protocols?: string | string[]): WebSocket;
}

const mockWebSocket = vi.fn((url: string | URL, protocols?: string | string[]) => ({
  onopen: null,
  onmessage: null,
  onerror: null,
  onclose: null,
  send: vi.fn(),
  close: vi.fn(),
  readyState: 0,
  url: typeof url === 'string' ? url : url.toString(),
})) as unknown as MockWebSocket;

mockWebSocket.CONNECTING = 0;
mockWebSocket.OPEN = 1;
mockWebSocket.CLOSING = 2;
mockWebSocket.CLOSED = 3;

global.WebSocket = mockWebSocket;

// Mock fetch
global.fetch = vi.fn().mockResolvedValue({
  json: vi.fn().mockResolvedValue({ status: 'success', data: {} }),
});