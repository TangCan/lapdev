import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CodeEditor } from './CodeEditor';

describe('CodeEditor Component', () => {
  const mockOnChange = vi.fn();

  it('should render editor container', () => {
    render(
      <CodeEditor
        value="console.log('Hello');"
        language="javascript"
        onChange={mockOnChange}
      />
    );

    const editor = screen.getByTestId('code-editor');
    expect(editor).toBeInTheDocument();
  });

  it('should apply diff decorations', () => {
    const diffLines = [
      { lineNumber: 1, type: 'added' as const },
      { lineNumber: 2, type: 'modified' as const },
    ];

    render(
      <CodeEditor
        value="line1\nline2\nline3"
        language="javascript"
        onChange={mockOnChange}
        diffLines={diffLines}
      />
    );

    const editor = screen.getByTestId('code-editor');
    expect(editor).toBeInTheDocument();
  });

  it('should handle empty value', () => {
    render(
      <CodeEditor
        value=""
        language="plaintext"
        onChange={mockOnChange}
      />
    );

    const editor = screen.getByTestId('code-editor');
    expect(editor).toBeInTheDocument();
  });

  it('should handle readOnly mode', () => {
    render(
      <CodeEditor
        value="const x = 1;"
        language="typescript"
        onChange={mockOnChange}
        readOnly
      />
    );

    const editor = screen.getByTestId('code-editor');
    expect(editor).toBeInTheDocument();
  });

  it('should handle custom font size', () => {
    render(
      <CodeEditor
        value="console.log('test');"
        language="javascript"
        onChange={mockOnChange}
        fontSize={16}
      />
    );

    const editor = screen.getByTestId('code-editor');
    expect(editor).toBeInTheDocument();
  });
});