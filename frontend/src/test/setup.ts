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

// 使用 Object.defineProperty 来设置只读属性
Object.defineProperty(mockWebSocket, 'CONNECTING', { value: 0, writable: false });
Object.defineProperty(mockWebSocket, 'OPEN', { value: 1, writable: false });
Object.defineProperty(mockWebSocket, 'CLOSING', { value: 2, writable: false });
Object.defineProperty(mockWebSocket, 'CLOSED', { value: 3, writable: false });

// 使用 globalThis 替代 global（ES模块环境）
(globalThis as any).WebSocket = mockWebSocket as unknown as typeof WebSocket;

// Mock fetch
(globalThis as any).fetch = vi.fn().mockResolvedValue({
  json: vi.fn().mockResolvedValue({ status: 'success', data: {} }),
});