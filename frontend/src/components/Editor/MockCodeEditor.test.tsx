import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { MockCodeEditor } from './MockCodeEditor';

describe('MockCodeEditor Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('[P0] should render editor with initial content', () => {
    const { container } = render(<MockCodeEditor />);
    expect(container.querySelector('[data-testid="code-editor"]')).toBeTruthy();
    expect(container.textContent).toContain('Hello World');
  });

  it('[P0] should display line numbers', () => {
    const { container } = render(<MockCodeEditor />);
    const lineNumbers = container.querySelectorAll('.line-number');
    expect(lineNumbers.length).toBeGreaterThan(0);
    expect(lineNumbers[0].textContent).toBe('1');
  });

  it('[P1] should update content when character key is pressed', () => {
    const { container } = render(<MockCodeEditor />);
    const initialContent = container.textContent;
    const editor = container.querySelector('.code-area')!;
    fireEvent.keyDown(editor, { key: 'x' });
    expect(container.textContent!.length).toBeGreaterThan(initialContent!.length);
  });

  it('[P1] should create new line when Enter key is pressed', () => {
    const { container } = render(<MockCodeEditor />);
    const initialContent = container.textContent;
    const editor = container.querySelector('.code-area')!;
    fireEvent.keyDown(editor, { key: 'Enter' });
    expect(container.textContent!.length).toBeGreaterThan(initialContent!.length);
  });

  it('[P1] should delete character when Backspace key is pressed', () => {
    const { container } = render(<MockCodeEditor />);
    const initialContent = container.textContent;
    const editor = container.querySelector('.code-area')!;
    fireEvent.keyDown(editor, { key: 'Backspace' });
    expect(container.textContent!.length).toBeLessThan(initialContent!.length);
  });

  it('[P2] should insert indentation when Tab key is pressed', () => {
    const { container } = render(<MockCodeEditor />);
    const initialContent = container.textContent;
    const editor = container.querySelector('.code-area')!;
    fireEvent.keyDown(editor, { key: 'Tab' });
    expect(container.textContent!.length).toBeGreaterThan(initialContent!.length);
  });

  it('[P2] should expose __test_setEditorValue global function', () => {
    render(<MockCodeEditor />);
    expect(window.__test_setEditorValue).toBeDefined();

    act(() => {
      window.__test_setEditorValue?.('const a = 1;');
    });

    const codeArea = document.querySelector('.code-area');
    expect(codeArea?.textContent).toContain('const a = 1;');
  });

  it('[P2] should clean up __test_setEditorValue on unmount', () => {
    const { unmount } = render(<MockCodeEditor />);
    expect(window.__test_setEditorValue).toBeDefined();

    unmount();

    expect(window.__test_setEditorValue).toBeUndefined();
  });

  it('[P2] should show problems panel when diagnostics exist', () => {
    render(<MockCodeEditor />);

    act(() => {
      window.__test_setEditorValue?.('const x: number = "string";');
    });

    expect(screen.getByTestId('problems-panel')).toBeTruthy();
  });

  it('[P2] should display status bar with language and encoding info', () => {
    const { container } = render(<MockCodeEditor />);
    expect(container.textContent).toContain('TypeScript');
    expect(container.textContent).toContain('UTF-8');
  });
});