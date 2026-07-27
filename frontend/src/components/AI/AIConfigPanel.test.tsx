import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { AIConfigPanel } from './AIConfigPanel';

const mockAddModel = vi.fn();
const mockUpdateModel = vi.fn();
const mockRemoveModel = vi.fn();
const mockSetActiveModel = vi.fn();
const mockTestConnection = vi.fn();
const mockClearTestResult = vi.fn();
const mockSetInlineCompletionEnabled = vi.fn();

vi.mock('../../context/AIContext', () => ({
  useAI: () => ({
    models: [],
    currentModel: null,
    isConnected: false,
    isTesting: false,
    testResult: null,
    addModel: mockAddModel,
    updateModel: mockUpdateModel,
    removeModel: mockRemoveModel,
    setActiveModel: mockSetActiveModel,
    testConnection: mockTestConnection,
    clearTestResult: mockClearTestResult,
  }),
  AIProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../context/InlineCompletionContext', () => ({
  useInlineCompletion: () => ({
    inlineCompletionEnabled: true,
    setInlineCompletionEnabled: mockSetInlineCompletionEnabled,
    inlineCompletionVisible: false,
    setInlineCompletionVisible: vi.fn(),
    ghostText: '',
    setGhostText: vi.fn(),
  }),
  InlineCompletionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('AIConfigPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('[P0] should render panel with model list', () => {
    render(<AIConfigPanel />);
    expect(screen.getByTestId('ai-config-section')).toBeTruthy();
    expect(screen.getByText('AI模型配置')).toBeTruthy();
  });

  it('[P0] should display inline completion toggle', () => {
    render(<AIConfigPanel />);
    const toggle = screen.getByTestId('inline-completion-toggle');
    expect(toggle).toBeTruthy();
    expect(toggle.checked).toBe(true);
  });

  it('[P0] should display provider selector with all options', () => {
    render(<AIConfigPanel />);
    const providerSelect = screen.getByTestId('ai-provider-select') as HTMLSelectElement;
    expect(providerSelect).toBeTruthy();
    expect(providerSelect.options.length).toBe(3);
    expect(providerSelect.options[0].text).toBe('OpenAI');
    expect(providerSelect.options[1].text).toBe('DeepSeek');
    expect(providerSelect.options[2].text).toBe('Custom');
  });

  it('[P1] should render all form inputs: model name, API key, base URL', () => {
    render(<AIConfigPanel />);
    expect(screen.getByTestId('ai-model-name')).toBeTruthy();
    expect(screen.getByTestId('ai-provider-select')).toBeTruthy();
    expect(screen.getByTestId('ai-model-select')).toBeTruthy();
    expect(screen.getByTestId('ai-api-key')).toBeTruthy();
    expect(screen.getByTestId('ai-base-url')).toBeTruthy();
  });

  it('[P1] should update model name input on change', () => {
    render(<AIConfigPanel />);
    const nameInput = screen.getByTestId('ai-model-name') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'My Custom Model' } });
    expect(nameInput.value).toBe('My Custom Model');
  });

  it('[P1] should update API key input on change', () => {
    render(<AIConfigPanel />);
    const apiKeyInput = screen.getByTestId('ai-api-key') as HTMLInputElement;
    fireEvent.change(apiKeyInput, { target: { value: 'sk-test-key-123' } });
    expect(apiKeyInput.value).toBe('sk-test-key-123');
  });

  it('[P1] should update base URL input on change', () => {
    render(<AIConfigPanel />);
    const baseUrlInput = screen.getByTestId('ai-base-url') as HTMLInputElement;
    fireEvent.change(baseUrlInput, { target: { value: 'https://custom.api.com/v1' } });
    expect(baseUrlInput.value).toBe('https://custom.api.com/v1');
  });

  it('[P1] should update model select when provider switches', () => {
    render(<AIConfigPanel />);
    const providerSelect = screen.getByTestId('ai-provider-select') as HTMLSelectElement;
    fireEvent.change(providerSelect, { target: { value: 'deepseek' } });
    expect(providerSelect.value).toBe('deepseek');

    const modelSelect = screen.getByTestId('ai-model-select') as HTMLSelectElement;
    expect(modelSelect.options.length).toBeGreaterThan(0);
  });

  it('[P1] should validate required fields on save click', () => {
    render(<AIConfigPanel />);
    const saveBtn = screen.getByTestId('ai-save-btn');
    fireEvent.click(saveBtn);
    expect(screen.getByText('请输入模型名称')).toBeTruthy();
    expect(screen.getByText('请输入API Key')).toBeTruthy();
  });

  it('[P1] should validate invalid base URL format', () => {
    render(<AIConfigPanel />);
    const nameInput = screen.getByTestId('ai-model-name') as HTMLInputElement;
    const apiKeyInput = screen.getByTestId('ai-api-key') as HTMLInputElement;
    const baseUrlInput = screen.getByTestId('ai-base-url') as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: 'Test Model' } });
    fireEvent.change(apiKeyInput, { target: { value: 'sk-test123' } });
    fireEvent.change(baseUrlInput, { target: { value: 'not-a-valid-url' } });

    const saveBtn = screen.getByTestId('ai-save-btn');
    fireEvent.click(saveBtn);

    expect(screen.getByText('请输入有效的URL')).toBeTruthy();
  });

  it('[P2] should show empty model list state when no models configured', () => {
    render(<AIConfigPanel />);
    expect(screen.getByText('暂无模型配置')).toBeTruthy();
    expect(screen.getByText(/请在上方添加您的AI模型配置/)).toBeTruthy();
  });

  it('[P2] should trigger testConnection when test button clicked', () => {
    render(<AIConfigPanel />);

    const nameInput = screen.getByTestId('ai-model-name') as HTMLInputElement;
    const apiKeyInput = screen.getByTestId('ai-api-key') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Test' } });
    fireEvent.change(apiKeyInput, { target: { value: 'sk-test' } });

    const testBtn = screen.getByTestId('ai-test-btn');
    fireEvent.click(testBtn);

    expect(mockTestConnection).toHaveBeenCalled();
  });

  it('[P2] should call setInlineCompletionEnabled when toggle is clicked', () => {
    render(<AIConfigPanel />);
    const toggle = screen.getByTestId('inline-completion-toggle') as HTMLInputElement;
    fireEvent.click(toggle);
    expect(mockSetInlineCompletionEnabled).toHaveBeenCalledWith(false);
  });
});