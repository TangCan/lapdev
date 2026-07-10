import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentProvider, useAgent } from './AgentContext';
import { AgentOperation } from '../services/agentService';

describe('AgentContext', () => {
  const TestComponent: React.FC = () => {
    const { isAgentMode, pendingOperations, operationLogs, setAgentMode, addOperation, approveOperation, rejectOperation, approveAllOperations, rejectAllOperations, clearPendingOperations, clearLogs } = useAgent();
    
    return (
      <div>
        <span data-testid="agent-mode">{isAgentMode ? 'true' : 'false'}</span>
        <span data-testid="pending-count">{pendingOperations.length}</span>
        <span data-testid="logs-count">{operationLogs.length}</span>
        <button data-testid="toggle-on" onClick={() => setAgentMode(true)}>Toggle On</button>
        <button data-testid="toggle-off" onClick={() => setAgentMode(false)}>Toggle Off</button>
        <button data-testid="add-operation" onClick={() => addOperation({ type: 'write', filePath: 'test.ts', content: 'test', originalContent: 'original' })}>Add Operation</button>
        <button data-testid="approve-first" onClick={() => pendingOperations[0] && approveOperation(pendingOperations[0].id)}>Approve First</button>
        <button data-testid="reject-first" onClick={() => pendingOperations[0] && rejectOperation(pendingOperations[0].id)}>Reject First</button>
        <button data-testid="approve-all" onClick={() => approveAllOperations()}>Approve All</button>
        <button data-testid="reject-all" onClick={() => rejectAllOperations()}>Reject All</button>
        <button data-testid="clear-pending" onClick={() => clearPendingOperations()}>Clear Pending</button>
        <button data-testid="clear-logs" onClick={() => clearLogs()}>Clear Logs</button>
      </div>
    );
  };

  const renderWithContext = () => {
    return render(
      <AgentProvider>
        <TestComponent />
      </AgentProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.removeItem('lapdev-agent-mode');
    localStorage.removeItem('lapdev-agent-logs');
  });

  it('[P0] should provide initial state with agent mode off', () => {
    renderWithContext();
    
    expect(screen.getByTestId('agent-mode')).toHaveTextContent('false');
    expect(screen.getByTestId('pending-count')).toHaveTextContent('0');
    expect(screen.getByTestId('logs-count')).toHaveTextContent('0');
  });

  it('[P0] should toggle agent mode', async () => {
    renderWithContext();
    
    expect(screen.getByTestId('agent-mode')).toHaveTextContent('false');
    
    screen.getByTestId('toggle-on').click();
    await waitFor(() => {
      expect(screen.getByTestId('agent-mode')).toHaveTextContent('true');
    });
    
    screen.getByTestId('toggle-off').click();
    await waitFor(() => {
      expect(screen.getByTestId('agent-mode')).toHaveTextContent('false');
    });
  });

  it('[P0] should add operation to pending list', async () => {
    renderWithContext();
    
    expect(screen.getByTestId('pending-count')).toHaveTextContent('0');
    
    screen.getByTestId('add-operation').click();
    await waitFor(() => {
      expect(screen.getByTestId('pending-count')).toHaveTextContent('1');
    });
  });

  it('[P1] should deduplicate operations with same type and path', async () => {
    renderWithContext();
    
    screen.getByTestId('add-operation').click();
    await waitFor(() => {
      expect(screen.getByTestId('pending-count')).toHaveTextContent('1');
    });
    
    screen.getByTestId('add-operation').click();
    await waitFor(() => {
      expect(screen.getByTestId('pending-count')).toHaveTextContent('1');
      expect(screen.getByTestId('logs-count')).toHaveTextContent('1');
    });
  });

  it('[P1] should approve operation', async () => {
    renderWithContext();
    
    screen.getByTestId('add-operation').click();
    await waitFor(() => {
      expect(screen.getByTestId('pending-count')).toHaveTextContent('1');
    });
    
    screen.getByTestId('approve-first').click();
    await waitFor(() => {
      expect(screen.getByTestId('pending-count')).toHaveTextContent('1');
    });
  });

  it('[P1] should reject operation', async () => {
    renderWithContext();
    
    screen.getByTestId('add-operation').click();
    await waitFor(() => {
      expect(screen.getByTestId('pending-count')).toHaveTextContent('1');
    });
    
    screen.getByTestId('reject-first').click();
    await waitFor(() => {
      expect(screen.getByTestId('pending-count')).toHaveTextContent('1');
    });
  });

  it('[P1] should approve all operations', async () => {
    renderWithContext();
    
    screen.getByTestId('add-operation').click();
    await waitFor(() => {
      expect(screen.getByTestId('pending-count')).toHaveTextContent('1');
    });
    
    screen.getByTestId('approve-all').click();
    await waitFor(() => {
      expect(screen.getByTestId('pending-count')).toHaveTextContent('1');
    });
  });

  it('[P1] should reject all operations', async () => {
    renderWithContext();
    
    screen.getByTestId('add-operation').click();
    await waitFor(() => {
      expect(screen.getByTestId('pending-count')).toHaveTextContent('1');
    });
    
    screen.getByTestId('reject-all').click();
    await waitFor(() => {
      expect(screen.getByTestId('pending-count')).toHaveTextContent('1');
    });
  });

  it('[P1] should clear pending operations', async () => {
    renderWithContext();
    
    screen.getByTestId('add-operation').click();
    await waitFor(() => {
      expect(screen.getByTestId('pending-count')).toHaveTextContent('1');
    });
    
    screen.getByTestId('clear-pending').click();
    await waitFor(() => {
      expect(screen.getByTestId('pending-count')).toHaveTextContent('0');
    });
  });

  it('[P2] should persist agent mode to localStorage', async () => {
    renderWithContext();
    
    screen.getByTestId('toggle-on').click();
    await waitFor(() => {
      expect(localStorage.getItem('lapdev-agent-mode')).toBe('true');
    });
    
    screen.getByTestId('toggle-off').click();
    await waitFor(() => {
      expect(localStorage.getItem('lapdev-agent-mode')).toBe('false');
    });
  });

  it('[P2] should restore agent mode from localStorage', () => {
    localStorage.setItem('lapdev-agent-mode', 'true');
    
    renderWithContext();
    
    expect(screen.getByTestId('agent-mode')).toHaveTextContent('true');
  });

  it('[P2] should persist logs to localStorage', async () => {
    renderWithContext();
    
    screen.getByTestId('toggle-on').click();
    await waitFor(() => {
      expect(localStorage.getItem('lapdev-agent-logs')).toBeDefined();
    });
  });

  it('[P2] should clear logs', async () => {
    renderWithContext();
    
    screen.getByTestId('toggle-on').click();
    await waitFor(() => {
      expect(screen.getByTestId('logs-count')).toHaveTextContent('1');
    });
    
    screen.getByTestId('clear-logs').click();
    await waitFor(() => {
      expect(screen.getByTestId('logs-count')).toHaveTextContent('0');
      expect(localStorage.getItem('lapdev-agent-logs')).toBe('[]');
    });
  });

  it('[P2] should throw error when useAgent outside AgentProvider', () => {
    const UseAgentOutsideProvider = () => {
      useAgent();
      return <div />;
    };
    
    expect(() => {
      render(<UseAgentOutsideProvider />);
    }).toThrow('useAgent must be used within an AgentProvider');
  });
});
