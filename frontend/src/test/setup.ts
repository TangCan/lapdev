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
global.WebSocket = vi.fn().mockImplementation(() => ({
  onopen: null,
  onmessage: null,
  onerror: null,
  onclose: null,
  send: vi.fn(),
  close: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn().mockResolvedValue({
  json: vi.fn().mockResolvedValue({ status: 'success', data: {} }),
});