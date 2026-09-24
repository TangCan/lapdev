import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { LSPProvider, useLSP } from './LSPContext';
import { getMonacoSync } from '../services/monacoLoader';

// ============================================================
// ATDD 红阶段：dispose 泄漏验收测试（EPI7.01 / TD-03）
// 目标：验证 registerEditor 重复注册时旧 disposers 先被 dispose，
//       以及 disconnect 时所有 disposers 被 dispose。
// 当前实现存在缺陷 → 以下关键用例预期为 RED（红），修复后转 GREEN。
// ============================================================

vi.mock('../services/monacoLoader', () => ({
  getMonacoSync: vi.fn(),
  getMonaco: vi.fn(),
}));

vi.mock('../services/lspService', () => ({
  lspService: {
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn(),
    setOnDiagnosticsChange: vi.fn(),
    getDiagnostics: vi.fn(() => []),
    getCompletions: vi.fn().mockResolvedValue([]),
    getDefinition: vi.fn().mockResolvedValue(null),
    getReferences: vi.fn().mockResolvedValue(null),
    renameSymbol: vi.fn().mockResolvedValue(null),
    formatDocument: vi.fn().mockResolvedValue(null),
    formatRange: vi.fn().mockResolvedValue(null),
    getSignatureHelp: vi.fn().mockResolvedValue(null),
    getHover: vi.fn().mockResolvedValue(null),
  },
}));

// 收集所有被 register 的 provider 返回的 disposer，便于断言 dispose 调用
function makeMockMonaco(disposersCreated: Array<{ dispose: ReturnType<typeof vi.fn> }>) {
  const register = () => {
    const disposer = { dispose: vi.fn() };
    disposersCreated.push(disposer);
    return disposer;
  };

  return {
    languages: {
      registerCompletionItemProvider: vi.fn(register),
      registerDefinitionProvider: vi.fn(register),
      registerReferenceProvider: vi.fn(register),
      registerRenameProvider: vi.fn(register),
      registerDocumentFormattingEditProvider: vi.fn(register),
      registerDocumentRangeFormattingEditProvider: vi.fn(register),
      registerSignatureHelpProvider: vi.fn(register),
      registerHoverProvider: vi.fn(register),
    },
    editor: { setModelMarkers: vi.fn() },
    Uri: { parse: vi.fn((s: string) => ({ toString: () => s })) },
    Range: class {
      constructor() {}
    },
  };
}

const mockEditor = { getModel: () => ({}) } as never;

function TestConsumer({
  onReady,
}: {
  onReady: (
    api: ReturnType<typeof useLSP>
  ) => void;
}) {
  const ctx = useLSP();
  onReady(ctx);
  return <span />;
}

describe('LSPContext dispose 生命周期（EPI7.01 / TD-03）', () => {
  let disposersCreated: Array<{ dispose: ReturnType<typeof vi.fn> }>;

  beforeEach(() => {
    vi.clearAllMocks();
    disposersCreated = [];
    (getMonacoSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      makeMockMonaco(disposersCreated),
    );
  });

  it('[P0] registerEditor 重复注册同一 uri 时应先 dispose 旧 disposers', async () => {
    let api: ReturnType<typeof useLSP> | null = null;
    render(
      <LSPProvider>
        <TestConsumer onReady={(a) => (api = a)} />
      </LSPProvider>,
    );

    const uri = 'file:///workspace/test.ts';
    api!.registerEditor(mockEditor, uri);
    expect(disposersCreated).toHaveLength(8); // 第一次注册 8 个 provider

    api!.registerEditor(mockEditor, uri);
    expect(disposersCreated).toHaveLength(16); // 第二次再注册 8 个

    // 第一次注册的 8 个 disposers 应被 dispose（当前缺陷：未 dispose → RED）
    const firstBatch = disposersCreated.slice(0, 8);
    for (const disposer of firstBatch) {
      expect(disposer.dispose).toHaveBeenCalled();
    }
  });

  it('[P0] disconnect 时应 dispose 所有已注册的 disposers', async () => {
    let api: ReturnType<typeof useLSP> | null = null;
    const { unmount } = render(
      <LSPProvider>
        <TestConsumer onReady={(a) => (api = a)} />
      </LSPProvider>,
    );

    api!.registerEditor(mockEditor, 'file:///workspace/a.ts');
    api!.registerEditor(mockEditor, 'file:///workspace/b.ts');
    expect(disposersCreated).toHaveLength(16);

    // 直接调用 disconnect（模拟 LSPProvider 卸载时的 cleanup）
    api!.disconnect();

    // 所有 disposer 应被 dispose（当前缺陷：disconnect 未清理 → RED）
    for (const disposer of disposersCreated) {
      expect(disposer.dispose).toHaveBeenCalled();
    }

    unmount();
  });

  it('[P1] unregisterEditor 应 dispose 对应 uri 的 disposers（既有正确行为保持）', async () => {
    let api: ReturnType<typeof useLSP> | null = null;
    render(
      <LSPProvider>
        <TestConsumer onReady={(a) => (api = a)} />
      </LSPProvider>,
    );

    const uri = 'file:///workspace/test.ts';
    api!.registerEditor(mockEditor, uri);
    expect(disposersCreated).toHaveLength(8);

    api!.unregisterEditor(uri);

    for (const disposer of disposersCreated) {
      expect(disposer.dispose).toHaveBeenCalled();
    }
  });

  it('[P2] useLSP 在 Provider 外使用应抛错', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      render(<TestConsumer onReady={() => {}} />);
    } catch (e) {
      expect((e as Error).message).toContain('useLSP must be used within an LSPProvider');
    }
    spy.mockRestore();
  });
});