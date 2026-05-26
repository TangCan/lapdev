import { useEffect, useRef, useCallback } from 'react';
import * as Monaco from 'monaco-editor';

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  minimap?: boolean;
  fontSize?: number;
}

export function CodeEditor({
  value,
  language,
  onChange,
  readOnly = false,
  minimap = true,
  fontSize = 14
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'F') {
      e.preventDefault();
      // Formatting will be handled by the parent component
    }
  }, []);

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

  return (
    <div 
      ref={containerRef} 
      className="code-editor" 
      data-testid="code-editor"
      style={{ height: '100%', width: '100%' }}
    />
  );
}