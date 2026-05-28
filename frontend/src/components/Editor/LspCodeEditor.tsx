import React, { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import * as Monaco from 'monaco-editor';
import { useLSP } from '../../context/LSPContext';
import { Position } from 'vscode-languageserver-types';

export interface DiffLine {
  lineNumber: number;
  type: 'added' | 'modified' | 'deleted';
}

interface LspCodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  minimap?: boolean;
  fontSize?: number;
  diffLines?: DiffLine[];
  uri?: string;
}

export interface LspCodeEditorHandle {
  focus: () => void;
  getPosition: () => Monaco.Position | undefined;
  setPosition: (line: number, column: number) => void;
}

export const LspCodeEditor = forwardRef<LspCodeEditorHandle, LspCodeEditorProps>(({
  value,
  language,
  onChange,
  readOnly = false,
  minimap = true,
  fontSize = 14,
  diffLines = [],
  uri = 'file:///workspace/test.ts',
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const decorationRef = useRef<string[]>([]);
  const { connect, registerEditor, unregisterEditor } = useLSP();
  const [isLspConnected, setIsLspConnected] = useState(false);

  const updateDiffDecorations = useCallback(() => {
    if (!editorRef.current) return;

    if (decorationRef.current.length > 0) {
      editorRef.current.deltaDecorations(decorationRef.current, []);
      decorationRef.current = [];
    }

    const decorations: Monaco.editor.IModelDeltaDecoration[] = [];

    diffLines.forEach((diffLine) => {
      if (diffLine.type === 'deleted') return;

      decorations.push({
        range: new Monaco.Range(diffLine.lineNumber, 1, diffLine.lineNumber, 1),
        options: {
          isWholeLine: true,
          className: `diff-${diffLine.type}`,
          glyphMarginClassName: `diff-glyph-${diffLine.type}`,
          minimap: {
            position: 1,
            color: getDiffColor(diffLine.type),
          },
          overviewRuler: {
            position: Monaco.editor.OverviewRulerLane.Right,
            color: getDiffColor(diffLine.type),
          },
        },
      });
    });

    if (decorations.length > 0) {
      decorationRef.current = editorRef.current.deltaDecorations([], decorations);
    }
  }, [diffLines]);

  const getDiffColor = (type: string): string => {
    switch (type) {
      case 'added':
        return '#3fb950';
      case 'modified':
        return '#3794ff';
      case 'deleted':
        return '#f85149';
      default:
        return '#8b949e';
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

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
      suggest: {
        enabled: true,
        showWords: true,
        showFunctions: true,
        showMethods: true,
        showVariables: true,
        showClasses: true,
        showInterfaces: true,
        showModules: true,
        showProperties: true,
        showEvents: true,
        showOperators: true,
        showConstructors: true,
        showEnumMembers: true,
        showKeywords: true,
        showTypeParameters: true,
        showSnippets: true,
        showFiles: true,
        showReferences: true,
      },
      quickSuggestions: {
        other: true,
        comments: false,
        strings: false,
      },
      acceptSuggestionOnCommitCharacter: true,
      acceptSuggestionOnEnter: 'on',
    });

    editorRef.current.onDidChangeModelContent(() => {
      const newValue = editorRef.current?.getValue() || '';
      onChange(newValue);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        editorRef.current?.trigger('keyboard', 'editor.action.formatDocument', {});
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        editorRef.current?.trigger('keyboard', 'editor.action.formatDocument', {});
      }
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        editorRef.current?.trigger('keyboard', 'editor.action.goToDefinition', {});
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'r') {
        e.preventDefault();
        editorRef.current?.trigger('keyboard', 'editor.action.rename', {});
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      editorRef.current?.dispose();
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const initLSP = async () => {
      try {
        await connect({ language });
        setIsLspConnected(true);

        if (editorRef.current) {
          registerEditor(editorRef.current, uri);
        }
      } catch (error) {
        console.warn('LSP connection failed, proceeding without LSP features:', error);
      }
    };

    initLSP();

    return () => {
      unregisterEditor(uri);
    };
  }, [connect, registerEditor, unregisterEditor, language, uri]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== value) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  useEffect(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        Monaco.editor.setModelLanguage(model, language);
      }
    }
  }, [language]);

  useEffect(() => {
    updateDiffDecorations();
  }, [updateDiffDecorations]);

  const focus = useCallback(() => {
    editorRef.current?.focus();
  }, []);

  const getPosition = useCallback((): Monaco.Position | undefined => {
    return editorRef.current?.getPosition();
  }, []);

  const setPosition = useCallback((line: number, column: number) => {
    editorRef.current?.setPosition(new Monaco.Position(line, column));
    editorRef.current?.revealLineInCenter(line);
  }, []);

  useImperativeHandle(ref, () => ({
    focus,
    getPosition,
    setPosition,
  }), [focus, getPosition, setPosition]);

  return (
    <div
      ref={containerRef}
      className="code-editor"
      data-testid="code-editor"
      style={{ height: '100%', width: '100%' }}
    />
  );
};

export default LspCodeEditor;
