import { useEffect, useRef, useCallback } from 'react';
import * as Monaco from 'monaco-editor';

export interface DiffLine {
  lineNumber: number;
  type: 'added' | 'modified' | 'deleted';
}

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  minimap?: boolean;
  fontSize?: number;
  diffLines?: DiffLine[];
}

export function CodeEditor({
  value,
  language,
  onChange,
  readOnly = false,
  minimap = true,
  fontSize = 14,
  diffLines = []
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const decorationRef = useRef<string[]>([]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'F') {
      e.preventDefault();
    }
  }, []);

  const updateDiffDecorations = useCallback(() => {
    if (!editorRef.current) return;

    // Clear existing decorations
    if (decorationRef.current.length > 0) {
      editorRef.current.deltaDecorations(decorationRef.current, []);
      decorationRef.current = [];
    }

    // Create decorations for diff lines
    const decorations: Monaco.editor.IModelDeltaDecoration[] = [];

    diffLines.forEach((diffLine) => {
      // Skip deleted lines for now (they don't exist in current file)
      if (diffLine.type === 'deleted') return;

      decorations.push({
        range: new Monaco.Range(diffLine.lineNumber, 1, diffLine.lineNumber, 1),
        options: {
          isWholeLine: true,
          className: `diff-${diffLine.type}`,
          glyphMarginClassName: `diff-glyph-${diffLine.type}`,
          minimap: {
            position: 1,
            color: getDiffColor(diffLine.type)
          },
          overviewRuler: {
            position: Monaco.editor.OverviewRulerLane.Right,
            color: getDiffColor(diffLine.type)
          }
        }
      });
    });

    if (decorations.length > 0) {
      decorationRef.current = editorRef.current.deltaDecorations([], decorations);
    }
  }, [diffLines]);

  const getDiffColor = (type: string): string => {
    switch (type) {
      case 'added':
        return '#3fb950'; // Green
      case 'modified':
        return '#3794ff'; // Blue
      case 'deleted':
        return '#f85149'; // Red
      default:
        return '#8b949e'; // Gray
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Monaco Editor
    editorRef.current = Monaco.editor.create(containerRef.current, {
      value,
      language,
      readOnly,
      minimap: { enabled: minimap },
      fontSize,
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      theme: 'vs-dark',
      folding: true,
      foldingHighlight: true,
      bracketPairColorization: { enabled: true },
      tabSize: 2,
      insertSpaces: true,
      wordWrap: 'on',
      padding: { top: 16 },
      renderLineHighlight: 'line',
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling: true,
      contextmenu: true,
      fontFamily: "'Fira Code', 'Monaco', 'Consolas', monospace",
      fontLigatures: true,
      overviewRulerBorder: false,
      overviewRulerLanes: 2,
      glyphMargin: true,
    });

    // Handle changes
    editorRef.current.onDidChangeModelContent(() => {
      const newValue = editorRef.current?.getValue() || '';
      onChange(newValue);
    });

    // Register keyboard shortcut handler
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      editorRef.current?.dispose();
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Update value when prop changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== value) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  // Update language when prop changes
  useEffect(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        Monaco.editor.setModelLanguage(model, language);
      }
    }
  }, [language]);

  // Update diff decorations when diffLines changes
  useEffect(() => {
    updateDiffDecorations();
  }, [updateDiffDecorations]);

  return (
    <div 
      ref={containerRef} 
      className="code-editor" 
      data-testid="code-editor"
      style={{ height: '100%', width: '100%' }}
    />
  );
}