import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OperationConfirmation from './OperationConfirmation';
import { AgentProvider } from '../../context/AgentContext';
import { AgentOperation } from '../../services/agentService';

describe('OperationConfirmation Component', () => {
  const mockOperations: AgentOperation[] = [
    {
      id: 'op-1',
      type: 'write',
      filePath: 'src/test-file.ts',
      content: 'export const modifiedValue = "modified by agent";',
      originalContent: 'export const originalValue = "original";',
      status: 'pending',
      timestamp: Date.now(),
    },
  ];

  const mockOnClose = vi.fn();

  const renderWithProvider = (operations: AgentOperation[], onClose = mockOnClose) => {
    return render(
      <AgentProvider>
        <OperationConfirmation operations={operations} onClose={onClose} />
      </AgentProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('[P0] should render operation confirmation dialog', () => {
    renderWithProvider(mockOperations);
    
    const dialog = screen.getByTestId('operation-confirmation-dialog');
    expect(dialog).toBeInTheDocument();
    
    const operationCount = screen.getByTestId('operation-count');
    expect(operationCount).toHaveTextContent('共 1 个待确认操作');
  });

  it('[P0] should render operation type and target', () => {
    renderWithProvider(mockOperations);
    
    const operationType = screen.getByTestId('operation-type');
    expect(operationType).toHaveTextContent('修改文件');
    
    const operationTarget = screen.getByTestId('operation-target');
    expect(operationTarget).toHaveTextContent('src/test-file.ts');
  });

  it('[P0] should render diff preview with added lines', () => {
    const operations: AgentOperation[] = [
      {
        id: 'op-added',
        type: 'write',
        filePath: 'test.ts',
        content: 'line1\nline2\nline3',
        originalContent: 'line1',
        status: 'pending',
        timestamp: Date.now(),
      },
    ];
    
    renderWithProvider(operations);
    
    const diffPreview = screen.getByTestId('operation-diff-preview');
    expect(diffPreview).toBeInTheDocument();
    
    const addedLines = diffPreview.querySelectorAll('.diff-line.added');
    expect(addedLines.length).toBe(2);
  });

  it('[P0] should render diff preview with modified lines', () => {
    const operations: AgentOperation[] = [
      {
        id: 'op-modified',
        type: 'write',
        filePath: 'test.ts',
        content: 'line1\nmodified\nline3',
        originalContent: 'line1\noriginal\nline3',
        status: 'pending',
        timestamp: Date.now(),
      },
    ];
    
    renderWithProvider(operations);
    
    const diffPreview = screen.getByTestId('operation-diff-preview');
    const modifiedLines = diffPreview.querySelectorAll('.diff-line.modified');
    expect(modifiedLines.length).toBe(1);
  });

  it('[P0] should render diff preview with deleted lines', () => {
    const operations: AgentOperation[] = [
      {
        id: 'op-deleted',
        type: 'write',
        filePath: 'test.ts',
        content: 'line1\nline3',
        originalContent: 'line1\nline2\nline3',
        status: 'pending',
        timestamp: Date.now(),
      },
    ];
    
    renderWithProvider(operations);
    
    const diffPreview = screen.getByTestId('operation-diff-preview');
    const deletedLines = diffPreview.querySelectorAll('.diff-line.deleted');
    expect(deletedLines.length).toBe(1);
  });

  it('[P0] should call onClose when close button clicked', () => {
    renderWithProvider(mockOperations);
    
    const closeButton = screen.getByRole('button', { name: '✕' });
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('[P0] should handle approval of single operation', async () => {
    renderWithProvider(mockOperations);
    
    const approveButton = screen.getByTestId('operation-approve-button');
    fireEvent.click(approveButton);
    
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('[P0] should handle rejection of single operation', () => {
    renderWithProvider(mockOperations);
    
    const rejectButton = screen.getByTestId('operation-reject-button');
    fireEvent.click(rejectButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('[P1] should render approve-all button when multiple operations', () => {
    const multipleOperations: AgentOperation[] = [
      {
        id: 'op-1',
        type: 'write',
        filePath: 'file1.ts',
        content: 'content1',
        originalContent: 'original1',
        status: 'pending',
        timestamp: Date.now(),
      },
      {
        id: 'op-2',
        type: 'write',
        filePath: 'file2.ts',
        content: 'content2',
        originalContent: 'original2',
        status: 'pending',
        timestamp: Date.now(),
      },
    ];
    
    renderWithProvider(multipleOperations);
    
    const approveAllButton = screen.getByTestId('operation-approve-all-button');
    expect(approveAllButton).toBeInTheDocument();
  });

  it('[P1] should not render approve-all button when single operation', () => {
    renderWithProvider(mockOperations);
    
    expect(screen.queryByTestId('operation-approve-all-button')).not.toBeInTheDocument();
  });

  it('[P1] should handle approve-all operations', async () => {
    const multipleOperations: AgentOperation[] = [
      { id: 'op-1', type: 'write', filePath: 'file1.ts', content: 'c1', originalContent: 'o1', status: 'pending', timestamp: Date.now() },
      { id: 'op-2', type: 'write', filePath: 'file2.ts', content: 'c2', originalContent: 'o2', status: 'pending', timestamp: Date.now() },
    ];
    
    renderWithProvider(multipleOperations);
    
    const approveAllButton = screen.getByTestId('operation-approve-all-button');
    fireEvent.click(approveAllButton);
    
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('[P1] should handle reject-all operations', () => {
    const multipleOperations: AgentOperation[] = [
      { id: 'op-1', type: 'write', filePath: 'file1.ts', content: 'c1', originalContent: 'o1', status: 'pending', timestamp: Date.now() },
      { id: 'op-2', type: 'write', filePath: 'file2.ts', content: 'c2', originalContent: 'o2', status: 'pending', timestamp: Date.now() },
    ];
    
    renderWithProvider(multipleOperations);
    
    const rejectAllButton = screen.getByRole('button', { name: '全部拒绝' });
    fireEvent.click(rejectAllButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('[P2] should handle empty operations array', () => {
    renderWithProvider([]);
    
    const operationCount = screen.getByTestId('operation-count');
    expect(operationCount).toHaveTextContent('共 0 个待确认操作');
    
    const operationsList = screen.getByText('共 0 个待确认操作').parentElement?.nextElementSibling;
    expect(operationsList).toBeInTheDocument();
  });

  it('[P2] should render all operation types correctly', () => {
    const operations: AgentOperation[] = [
      { id: 'op-create', type: 'create', filePath: 'new.ts', content: 'c', status: 'pending', timestamp: Date.now() },
      { id: 'op-delete', type: 'delete', filePath: 'old.ts', originalContent: 'o', status: 'pending', timestamp: Date.now() },
      { id: 'op-read', type: 'read', filePath: 'read.ts', status: 'pending', timestamp: Date.now() },
      { id: 'op-search', type: 'search', filePath: 'search.ts', status: 'pending', timestamp: Date.now() },
    ];
    
    renderWithProvider(operations);
    
    const types = screen.getAllByTestId('operation-type');
    expect(types[0]).toHaveTextContent('创建文件');
    expect(types[1]).toHaveTextContent('删除文件');
    expect(types[2]).toHaveTextContent('读取文件');
    expect(types[3]).toHaveTextContent('搜索代码');
  });
});
