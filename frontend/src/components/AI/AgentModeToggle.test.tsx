import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentModeToggle } from './AgentModeToggle';
import { AgentProvider } from '../../context/AgentContext';

describe('AgentModeToggle Component', () => {
  const renderWithProvider = (ui: React.ReactElement) => {
    return render(
      <AgentProvider>
        {ui}
      </AgentProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.removeItem('lapdev-agent-mode');
  });

  it('[P0] should render toggle button', () => {
    renderWithProvider(<AgentModeToggle />);
    
    const toggle = screen.getByTestId('agent-mode-toggle');
    expect(toggle).toBeInTheDocument();
  });

  it('[P0] should display "Agent 模式" label when off', () => {
    renderWithProvider(<AgentModeToggle />);
    
    const label = screen.getByText('Agent 模式');
    expect(label).toBeInTheDocument();
  });

  it('[P0] should be off by default', () => {
    renderWithProvider(<AgentModeToggle />);
    
    const toggle = screen.getByTestId('agent-mode-toggle');
    expect(toggle).toHaveClass('bg-gray-700');
    expect(toggle).not.toHaveClass('from-purple-500');
  });

  it('[P0] should toggle agent mode on click', () => {
    renderWithProvider(<AgentModeToggle />);
    
    const toggle = screen.getByTestId('agent-mode-toggle');
    
    fireEvent.click(toggle);
    expect(toggle).toHaveClass('from-purple-500');
    expect(screen.getByText('Agent 已开启')).toBeInTheDocument();
    
    fireEvent.click(toggle);
    expect(toggle).toHaveClass('bg-gray-700');
    expect(screen.getByText('Agent 模式')).toBeInTheDocument();
  });

  it('[P1] should persist agent mode to localStorage', () => {
    renderWithProvider(<AgentModeToggle />);
    
    const toggle = screen.getByTestId('agent-mode-toggle');
    
    fireEvent.click(toggle);
    expect(localStorage.getItem('lapdev-agent-mode')).toBe('true');
    
    fireEvent.click(toggle);
    expect(localStorage.getItem('lapdev-agent-mode')).toBe('false');
  });

  it('[P1] should restore agent mode from localStorage', () => {
    localStorage.setItem('lapdev-agent-mode', 'true');
    
    renderWithProvider(<AgentModeToggle />);
    
    const toggle = screen.getByTestId('agent-mode-toggle');
    expect(toggle).toHaveClass('from-purple-500');
    expect(screen.getByText('Agent 已开启')).toBeInTheDocument();
  });

  it('[P2] should handle invalid localStorage value', () => {
    localStorage.setItem('lapdev-agent-mode', 'invalid');
    
    renderWithProvider(<AgentModeToggle />);
    
    const toggle = screen.getByTestId('agent-mode-toggle');
    expect(toggle).toHaveClass('bg-gray-700');
    expect(screen.getByText('Agent 模式')).toBeInTheDocument();
  });
});
