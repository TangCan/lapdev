import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ProblemsPanel from './ProblemsPanel';

const { mockOnSelectProblem, mockGetDiagnostics, mockSubscribeToDiagnostics, mockUseLSP, mockGetMonacoSync } = vi.hoisted(() => ({
  mockOnSelectProblem: vi.fn(),
  mockGetDiagnostics: vi.fn(),
  mockSubscribeToDiagnostics: vi.fn(() => vi.fn()),
  mockUseLSP: vi.fn(),
  mockGetMonacoSync: vi.fn(),
}));

vi.mock('../../context/LSPContext', () => ({
  useLSP: mockUseLSP,
  LSPProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../services/monacoLoader', () => ({
  getMonacoSync: mockGetMonacoSync,
}));

const MARKER_SEVERITY = {
  Error: 8,
  Warning: 4,
  Info: 2,
  Hint: 1,
};

describe('ProblemsPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDiagnostics.mockReturnValue([]);
    mockSubscribeToDiagnostics.mockReturnValue(vi.fn());

    mockUseLSP.mockReturnValue({
      isConnected: true,
      connect: vi.fn(),
      disconnect: vi.fn(),
      getDiagnostics: mockGetDiagnostics,
      registerEditor: vi.fn(),
      unregisterEditor: vi.fn(),
      subscribeToDiagnostics: mockSubscribeToDiagnostics,
    });

    mockGetMonacoSync.mockReturnValue({
      editor: {
        getModels: () => [{
          uri: { toString: () => 'file:///test.ts' },
        }],
      },
    });
  });

  it('[P0] should render panel title', () => {
    render(<ProblemsPanel onSelectProblem={mockOnSelectProblem} />);
    expect(screen.getByText('Problems')).toBeTruthy();
  });

  it('[P0] should show empty list state when no problems', () => {
    render(<ProblemsPanel onSelectProblem={mockOnSelectProblem} />);
    expect(screen.getByText('No problems')).toBeTruthy();
    expect(screen.getByText('No problems detected')).toBeTruthy();
  });

  it('[P1] should display error count in header', () => {
    mockGetDiagnostics.mockReturnValue([
      {
        range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 10 },
        severity: MARKER_SEVERITY.Error as any,
        message: 'Type error',
        source: 'ts',
      },
    ]);

    render(<ProblemsPanel onSelectProblem={mockOnSelectProblem} />);
    expect(screen.getByText('1 errors')).toBeTruthy();
  });

  it('[P1] should display warning count in header', () => {
    mockGetDiagnostics.mockReturnValue([
      {
        range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 10 },
        severity: MARKER_SEVERITY.Warning as any,
        message: 'Unused variable',
        source: 'ts',
      },
    ]);

    render(<ProblemsPanel onSelectProblem={mockOnSelectProblem} />);
    expect(screen.getByText('1 warnings')).toBeTruthy();
  });

  it('[P1] should display problem item with message and location', () => {
    mockGetDiagnostics.mockReturnValue([
      {
        range: { startLineNumber: 5, startColumn: 3, endLineNumber: 5, endColumn: 20 },
        severity: MARKER_SEVERITY.Error as any,
        message: 'Cannot find name "foo"',
        source: 'ts',
      },
    ]);

    render(<ProblemsPanel onSelectProblem={mockOnSelectProblem} />);
    expect(screen.getByText('Cannot find name "foo"')).toBeTruthy();
    expect(screen.getByText('Line 5, Column 3')).toBeTruthy();
  });

  it('[P2] should call onSelectProblem when a problem item is clicked', () => {
    mockGetDiagnostics.mockReturnValue([
      {
        range: { startLineNumber: 10, startColumn: 5, endLineNumber: 10, endColumn: 15 },
        severity: MARKER_SEVERITY.Error as any,
        message: 'Test error',
        source: 'ts',
      },
    ]);

    render(<ProblemsPanel onSelectProblem={mockOnSelectProblem} />);

    const problemItem = screen.getByText('Test error');
    fireEvent.click(problemItem);

    expect(mockOnSelectProblem).toHaveBeenCalledWith(10, 5);
  });

  it('[P2] should display error severity icon', () => {
    mockGetDiagnostics.mockReturnValue([
      {
        range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 5 },
        severity: MARKER_SEVERITY.Error as any,
        message: 'Error test',
        source: 'ts',
      },
    ]);

    const { container } = render(<ProblemsPanel onSelectProblem={mockOnSelectProblem} />);
    const errorIcons = container.querySelectorAll('.text-red-500');
    expect(errorIcons.length).toBeGreaterThan(0);
  });

  it('[P2] should display warning severity icon', () => {
    mockGetDiagnostics.mockReturnValue([
      {
        range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 5 },
        severity: MARKER_SEVERITY.Warning as any,
        message: 'Warning test',
        source: 'ts',
      },
    ]);

    const { container } = render(<ProblemsPanel onSelectProblem={mockOnSelectProblem} />);
    const warningIcons = container.querySelectorAll('.text-yellow-500');
    expect(warningIcons.length).toBeGreaterThan(0);
  });

  it('[P0] should handle case when Monaco is not loaded yet', () => {
    mockGetMonacoSync.mockReturnValue(null);

    render(<ProblemsPanel onSelectProblem={mockOnSelectProblem} />);
    expect(screen.getByText('No problems')).toBeTruthy();
    expect(screen.getByText('No problems detected')).toBeTruthy();
  });
});