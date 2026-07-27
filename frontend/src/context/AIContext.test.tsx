import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import React from 'react';
import { AIProvider, useAI } from './AIContext';
import { aiService, AIModelConfig, TestConnectionResponse } from '../services/aiService';

vi.mock('../services/aiService', () => ({
  aiService: {
    getModels: vi.fn(),
    getCurrentModel: vi.fn(),
    addModel: vi.fn(),
    updateModel: vi.fn(),
    removeModel: vi.fn(),
    setActiveModel: vi.fn(),
    testConnection: vi.fn(),
    reloadFromStorage: vi.fn(),
  },
}));

function TestConsumer() {
  const ctx = useAI();
  return (
    <div data-testid="consumer">
      <span data-testid="models-count">{ctx.models.length}</span>
      <span data-testid="is-connected">{String(ctx.isConnected)}</span>
      <span data-testid="is-testing">{String(ctx.isTesting)}</span>
      <span data-testid="current-model">{ctx.currentModel?.name || 'null'}</span>
      <span data-testid="test-result">{ctx.testResult?.status || 'null'}</span>
    </div>
  );
}

function renderWithProvider(ui: React.ReactElement) {
  return render(<AIProvider>{ui}</AIProvider>);
}

describe('AIProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (aiService.getModels as ReturnType<typeof vi.fn>).mockReturnValue([]);
    (aiService.getCurrentModel as ReturnType<typeof vi.fn>).mockReturnValue(null);
  });

  it('[P0] should provide initial empty state', () => {
    renderWithProvider(<TestConsumer />);

    expect(screen.getByTestId('models-count').textContent).toBe('0');
    expect(screen.getByTestId('is-connected').textContent).toBe('false');
    expect(screen.getByTestId('current-model').textContent).toBe('null');
    expect(screen.getByTestId('is-testing').textContent).toBe('false');
    expect(screen.getByTestId('test-result').textContent).toBe('null');
  });

  it('[P0] should load models from aiService on mount', () => {
    const mockModels: AIModelConfig[] = [
      { id: '1', name: 'Test Model', provider: 'openai', apiKey: 'sk-test', baseUrl: 'https://api.test.com', model: 'gpt-4', isActive: true },
    ];
    (aiService.getModels as ReturnType<typeof vi.fn>).mockReturnValue(mockModels);
    (aiService.getCurrentModel as ReturnType<typeof vi.fn>).mockReturnValue(mockModels[0]);

    renderWithProvider(<TestConsumer />);

    expect(screen.getByTestId('models-count').textContent).toBe('1');
    expect(screen.getByTestId('current-model').textContent).toBe('Test Model');
    expect(screen.getByTestId('is-connected').textContent).toBe('true');
  });

  it('[P0] should call reloadFromStorage on mount', () => {
    renderWithProvider(<TestConsumer />);
    expect(aiService.reloadFromStorage).toHaveBeenCalledTimes(1);
  });

  it('[P0] addModel should add model and set isConnected to true', async () => {
    const mockModels: AIModelConfig[] = [
      { id: '1', name: 'New Model', provider: 'openai', apiKey: 'sk-new', baseUrl: 'https://api.new.com', model: 'gpt-4', isActive: true },
    ];

    let addModelFn: ((config: Omit<AIModelConfig, 'id' | 'isActive'>) => void) | null = null;
    function AddModelConsumer() {
      const ctx = useAI();
      addModelFn = ctx.addModel;
      return (
        <div>
          <span data-testid="count">{ctx.models.length}</span>
          <span data-testid="connected">{String(ctx.isConnected)}</span>
        </div>
      );
    }

    renderWithProvider(<AddModelConsumer />);

    (aiService.getModels as ReturnType<typeof vi.fn>).mockReturnValue(mockModels);
    (aiService.getCurrentModel as ReturnType<typeof vi.fn>).mockReturnValue(mockModels[0]);

    act(() => {
      addModelFn!({ name: 'New Model', provider: 'openai', apiKey: 'sk-new', baseUrl: 'https://api.new.com', model: 'gpt-4' });
    });

    await waitFor(() => {
      expect(aiService.addModel).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('count').textContent).toBe('1');
      expect(screen.getByTestId('connected').textContent).toBe('true');
    });
  });

  it('[P0] setActiveModel should switch active model and set isConnected', async () => {
    const model1: AIModelConfig = { id: '1', name: 'Model 1', provider: 'openai', apiKey: 'sk-1', baseUrl: 'https://api.test.com', model: 'gpt-4', isActive: true };
    const model2: AIModelConfig = { id: '2', name: 'Model 2', provider: 'deepseek', apiKey: 'sk-2', baseUrl: 'https://api.test.com', model: 'deepseek-chat', isActive: false };

    (aiService.getModels as ReturnType<typeof vi.fn>).mockReturnValue([model1, model2]);
    (aiService.getCurrentModel as ReturnType<typeof vi.fn>).mockReturnValue(model1);

    let setActiveFn: ((id: string) => void) | null = null;
    function SetActiveConsumer() {
      const ctx = useAI();
      setActiveFn = ctx.setActiveModel;
      return (
        <div>
          <span data-testid="current">{ctx.currentModel?.name || 'null'}</span>
          <span data-testid="connected">{String(ctx.isConnected)}</span>
        </div>
      );
    }

    renderWithProvider(<SetActiveConsumer />);

    (aiService.getCurrentModel as ReturnType<typeof vi.fn>).mockReturnValue(model2);

    act(() => {
      setActiveFn!('2');
    });

    await waitFor(() => {
      expect(aiService.setActiveModel).toHaveBeenCalledWith('2');
      expect(screen.getByTestId('connected').textContent).toBe('true');
    });
  });

  it('[P1] updateModel should modify model config and refresh state', async () => {
    const model1: AIModelConfig = { id: '1', name: 'Original', provider: 'openai', apiKey: 'sk-original', baseUrl: 'https://api.test.com', model: 'gpt-4', isActive: true };
    const updatedModel: AIModelConfig = { ...model1, name: 'Updated', apiKey: 'sk-updated' };

    (aiService.getModels as ReturnType<typeof vi.fn>).mockReturnValue([model1]);
    (aiService.getCurrentModel as ReturnType<typeof vi.fn>).mockReturnValue(model1);

    let updateFn: ((id: string, updates: Partial<Omit<AIModelConfig, 'id' | 'isActive'>>) => void) | null = null;
    function UpdateConsumer() {
      const ctx = useAI();
      updateFn = ctx.updateModel;
      return (
        <div>
          <span data-testid="model-name">{ctx.currentModel?.name || 'null'}</span>
          <span data-testid="models-count">{ctx.models.length}</span>
        </div>
      );
    }

    renderWithProvider(<UpdateConsumer />);

    (aiService.getModels as ReturnType<typeof vi.fn>).mockReturnValue([updatedModel]);
    (aiService.getCurrentModel as ReturnType<typeof vi.fn>).mockReturnValue(updatedModel);

    act(() => {
      updateFn!('1', { name: 'Updated', apiKey: 'sk-updated' });
    });

    await waitFor(() => {
      expect(aiService.updateModel).toHaveBeenCalledWith('1', { name: 'Updated', apiKey: 'sk-updated' });
      expect(screen.getByTestId('model-name').textContent).toBe('Updated');
      expect(screen.getByTestId('models-count').textContent).toBe('1');
    });
  });

  it('[P1] removeModel should remove model and update isConnected', async () => {
    const mockModels: AIModelConfig[] = [
      { id: '1', name: 'Test', provider: 'openai', apiKey: 'sk-test', baseUrl: 'https://api.test.com', model: 'gpt-4', isActive: true },
    ];
    (aiService.getModels as ReturnType<typeof vi.fn>).mockReturnValue(mockModels);
    (aiService.getCurrentModel as ReturnType<typeof vi.fn>).mockReturnValue(mockModels[0]);

    let removeModelFn: ((id: string) => void) | null = null;
    function RemoveModelConsumer() {
      const ctx = useAI();
      removeModelFn = ctx.removeModel;
      return (
        <div>
          <span data-testid="count">{ctx.models.length}</span>
          <span data-testid="connected">{String(ctx.isConnected)}</span>
        </div>
      );
    }

    renderWithProvider(<RemoveModelConsumer />);

    (aiService.getModels as ReturnType<typeof vi.fn>).mockReturnValue([]);
    (aiService.getCurrentModel as ReturnType<typeof vi.fn>).mockReturnValue(null);

    act(() => {
      removeModelFn!('1');
    });

    await waitFor(() => {
      expect(aiService.removeModel).toHaveBeenCalledWith('1');
      expect(screen.getByTestId('count').textContent).toBe('0');
      expect(screen.getByTestId('connected').textContent).toBe('false');
    });
  });

  it('[P1] testConnection should handle success and set isConnected', async () => {
    const successResult: TestConnectionResponse = { status: 'success', message: 'Connection OK', latency: 100 };
    (aiService.testConnection as ReturnType<typeof vi.fn>).mockResolvedValue(successResult);

    let testFn: ((config: { apiKey: string; baseUrl: string; model: string }) => Promise<void>) | null = null;
    function TestConnConsumer() {
      const ctx = useAI();
      testFn = ctx.testConnection;
      return (
        <div>
          <span data-testid="testing">{String(ctx.isTesting)}</span>
          <span data-testid="result">{ctx.testResult?.status || 'null'}</span>
          <span data-testid="connected">{String(ctx.isConnected)}</span>
        </div>
      );
    }

    renderWithProvider(<TestConnConsumer />);

    await act(async () => {
      await testFn!({ apiKey: 'sk-test', baseUrl: 'https://api.test.com', model: 'gpt-4' });
    });

    expect(aiService.testConnection).toHaveBeenCalledWith({
      apiKey: 'sk-test',
      baseUrl: 'https://api.test.com',
      model: 'gpt-4',
    });

    await waitFor(() => {
      expect(screen.getByTestId('result').textContent).toBe('success');
      expect(screen.getByTestId('connected').textContent).toBe('true');
      expect(screen.getByTestId('testing').textContent).toBe('false');
    });
  });

  it('[P2] testConnection should handle error response', async () => {
    const errorResult: TestConnectionResponse = { status: 'error', message: 'Connection failed' };
    (aiService.testConnection as ReturnType<typeof vi.fn>).mockResolvedValue(errorResult);

    let testFn: ((config: { apiKey: string; baseUrl: string; model: string }) => Promise<void>) | null = null;
    function TestErrConsumer() {
      const ctx = useAI();
      testFn = ctx.testConnection;
      return (
        <div>
          <span data-testid="testing">{String(ctx.isTesting)}</span>
          <span data-testid="result">{ctx.testResult?.status || 'null'}</span>
          <span data-testid="connected">{String(ctx.isConnected)}</span>
        </div>
      );
    }

    renderWithProvider(<TestErrConsumer />);

    await act(async () => {
      await testFn!({ apiKey: 'sk-test', baseUrl: 'https://api.test.com', model: 'gpt-4' });
    });

    await waitFor(() => {
      expect(screen.getByTestId('result').textContent).toBe('error');
      expect(screen.getByTestId('connected').textContent).toBe('false');
      expect(screen.getByTestId('testing').textContent).toBe('false');
    });
  });

  it('[P2] testConnection should handle thrown error', async () => {
    (aiService.testConnection as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    let testFn: ((config: { apiKey: string; baseUrl: string; model: string }) => Promise<void>) | null = null;
    function TestThrowConsumer() {
      const ctx = useAI();
      testFn = ctx.testConnection;
      return (
        <div>
          <span data-testid="testing">{String(ctx.isTesting)}</span>
          <span data-testid="result-message">{ctx.testResult?.message || 'null'}</span>
        </div>
      );
    }

    renderWithProvider(<TestThrowConsumer />);

    await act(async () => {
      await testFn!({ apiKey: 'sk-test', baseUrl: 'https://api.test.com', model: 'gpt-4' });
    });

    await waitFor(() => {
      expect(screen.getByTestId('result-message').textContent).toBe('Network error');
      expect(screen.getByTestId('testing').textContent).toBe('false');
    });
  });

  it('[P2] clearTestResult should set testResult to null', async () => {
    const errorResult: TestConnectionResponse = { status: 'error', message: 'Failed' };
    (aiService.testConnection as ReturnType<typeof vi.fn>).mockResolvedValue(errorResult);

    let clearFn: (() => void) | null = null;
    let testFn: ((config: { apiKey: string; baseUrl: string; model: string }) => Promise<void>) | null = null;
    function ClearConsumer() {
      const ctx = useAI();
      clearFn = ctx.clearTestResult;
      testFn = ctx.testConnection;
      return <span data-testid="result">{ctx.testResult?.status || 'null'}</span>;
    }

    renderWithProvider(<ClearConsumer />);

    await act(async () => {
      await testFn!({ apiKey: 'sk-test', baseUrl: 'https://api.test.com', model: 'gpt-4' });
    });

    await waitFor(() => {
      expect(screen.getByTestId('result').textContent).toBe('error');
    });

    act(() => {
      clearFn!();
    });

    await waitFor(() => {
      expect(screen.getByTestId('result').textContent).toBe('null');
    });
  });

  it('[P2] useAI should throw when used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      render(<TestConsumer />);
    } catch (e) {
      expect((e as Error).message).toContain('useAI must be used within an AIProvider');
    }
    spy.mockRestore();
  });
});