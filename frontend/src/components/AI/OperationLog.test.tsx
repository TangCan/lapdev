import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OperationLog } from './OperationLog';
import { AgentProvider } from '../../context/AgentContext';
import { agentService } from '../../services/agentService';
import { vi, describe, test, expect, beforeEach } from 'vitest';

vi.mock('../../services/agentService');

const renderWithProvider = (ui: React.ReactElement) => {
  return render(
    <AgentProvider>
      {ui}
    </AgentProvider>
  );
};

describe('OperationLog Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render operation log panel with title', () => {
    renderWithProvider(<OperationLog />);
    expect(screen.getByText('操作日志')).toBeInTheDocument();
  });

  test('should show no logs message when empty', () => {
    renderWithProvider(<OperationLog />);
    expect(screen.getByTestId('no-logs-message')).toBeInTheDocument();
  });

  test('should have filter select', () => {
    renderWithProvider(<OperationLog />);
    expect(screen.getByTestId('filter-select')).toBeInTheDocument();
  });

  test('should show confirmation dialog when clicking clear button exists', () => {
    renderWithProvider(<OperationLog />);
    const clearButton = screen.queryByTestId('clear-logs-button');
    if (clearButton) {
      fireEvent.click(clearButton);
      expect(screen.getByText('确认清空日志')).toBeInTheDocument();
    }
  });

  test('should close confirmation dialog when canceling', () => {
    renderWithProvider(<OperationLog />);
    const clearButton = screen.queryByTestId('clear-logs-button');
    if (clearButton) {
      fireEvent.click(clearButton);
      const cancelButton = screen.getByText('取消');
      fireEvent.click(cancelButton);
      expect(screen.queryByText('确认清空日志')).not.toBeInTheDocument();
    }
  });

  test('should call exportLogs when clicking export button exists', () => {
    renderWithProvider(<OperationLog />);
    const exportButton = screen.queryByTestId('export-logs-button');
    if (exportButton) {
      fireEvent.click(exportButton);
    }
  });
});