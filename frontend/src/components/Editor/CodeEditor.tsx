import { useEffect, useRef, useCallback } from 'react';
import * as Monaco from 'monaco-editor';
import { aiService } from '../../services/aiService';
import { useAI } from '../../context/AIContext';
import { useInlineCompletion } from '../../context/InlineCompletionContext';

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

const DEBOUNCE_DELAY = 500;
const SPECIAL_KEYS = ['Tab', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape'];
const SUPPORTED_LANGUAGES = ['typescript', 'javascript', 'rust', 'python', 'go', 'java', 'cpp', 'c'];

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
  const decorationRef = useRef<string[]>([] as string[]);
  const ghostTextDecorationRef = useRef<string[]>([]);
  const debounceTimerRef = useRef<number | null>(null);
  const currentCompletionRequestRef = useRef<AbortController | null>(null);

  const { isConnected } = useAI();
  const { inlineCompletionEnabled, inlineCompletionVisible, setInlineCompletionVisible, ghostText, setGhostText } = useInlineCompletion();

  const cancelCurrentCompletion = useCallback(() => {
    if (currentCompletionRequestRef.current) {
      currentCompletionRequestRef.current.abort();
      currentCompletionRequestRef.current = null;
    }
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const clearGhostText = useCallback(() => {
    if (editorRef.current && ghostTextDecorationRef.current.length > 0) {
      editorRef.current.deltaDecorations(ghostTextDecorationRef.current, []);
      ghostTextDecorationRef.current = [];
    }
    setGhostText('');
    setInlineCompletionVisible(false);
  }, [setGhostText, setInlineCompletionVisible]);

  const acceptCompletion = useCallback(() => {
    if (!inlineCompletionVisible || !ghostText) return;

    const editor = editorRef.current;
    if (!editor) return;

    const position = editor.getPosition();
    if (!position) return;

    const range = new Monaco.Range(
      position.lineNumber,
      position.column,
      position.lineNumber,
      position.column + ghostText.length
    );

    editor.executeEdits('inline-completion', [{
      range,
      text: ghostText,
      forceMoveMarkers: true
    }]);

    clearGhostText();
    editor.setPosition(position);
    editor.focus();
  }, [inlineCompletionVisible, ghostText, clearGhostText]);

  const triggerCompletion = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return;

    if (!inlineCompletionEnabled || !isConnected) {
      clearGhostText();
      return;
    }

    if (!SUPPORTED_LANGUAGES.includes(language.toLowerCase())) {
      clearGhostText();
      return;
    }

    cancelCurrentCompletion();

    const model = editor.getModel();
    if (!model) return;

    const position = editor.getPosition();
    if (!position) return;

    const fullContent = model.getValue();
    const offset = model.getOffsetAt(position);
    const prefix = fullContent.substring(0, offset);
    const suffix = fullContent.substring(offset);

    const currentCompletion = new AbortController();
    currentCompletionRequestRef.current = currentCompletion;

    debounceTimerRef.current = window.setTimeout(() => {
      // 使用 IIFE 包裹异步操作，确保所有 Promise rejection 都被正确处理
      (async () => {
        try {
          const result = await aiService.getInlineCompletion({
            prompt: prefix.split('\n').pop() || '',
            prefix,
            suffix,
            fileContent: fullContent,
            language: language.toLowerCase(),
            maxTokens: 50,
          });

          if (currentCompletion.signal.aborted) return;

          if (result.completion && result.completion.trim()) {
            setGhostText(result.completion.trim());

            const ghostTextPosition = new Monaco.Range(
              position.lineNumber,
              position.column,
              position.lineNumber,
              position.column
            );

            const oldDecorations = ghostTextDecorationRef.current.length > 0
              ? ghostTextDecorationRef.current
              : [];
            ghostTextDecorationRef.current = editor.deltaDecorations(
              oldDecorations,
              [{
                range: ghostTextPosition,
                options: {
                  inlineClassName: 'inline-completion-ghost',
                  hoverMessage: { value: '' }
                }
              }]
            );

            setInlineCompletionVisible(true);
          }
        } catch (error) {
          // 处理中止错误
          if (error instanceof Error && error.message.includes('aborted')) {
            return;
          }
          // 处理其他错误
          console.error('Inline completion error:', error);
        }
      })().catch((error) => {
        // 兜底捕获所有未处理的 Promise rejection
        console.error('Unhandled inline completion error:', error);
      });
    }, DEBOUNCE_DELAY);
  }, [inlineCompletionEnabled, isConnected, language, cancelCurrentCompletion, clearGhostText, setGhostText, setInlineCompletionVisible]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'F') {
      e.preventDefault();
      return;
    }

    if (inlineCompletionVisible) {
      if (e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        acceptCompletion();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        clearGhostText();
        return;
      }
    }

    if (!SPECIAL_KEYS.includes(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (inlineCompletionVisible) {
        clearGhostText();
      }
    }

    if (e.key === 'Enter' && inlineCompletionVisible) {
      // Let the completion be cleared by the content change
    }
  }, [inlineCompletionVisible, acceptCompletion, clearGhostText]);

  const updateDiffDecorations = useCallback(() => {
    if (!editorRef.current) return;

    if (decorationRef.current && decorationRef.current.length > 0) {
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

    const editorOptions: Monaco.editor.IStandaloneEditorConstructionOptions = {
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
    };

    editorRef.current = Monaco.editor.create(containerRef.current, editorOptions);

    const editor = editorRef.current;

    editor.onDidChangeModelContent(() => {
      const newValue = editor.getValue() || '';
      onChange(newValue);

      if (inlineCompletionVisible) {
        clearGhostText();
      }

      triggerCompletion();
    });

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelCurrentCompletion();
      editor.dispose();
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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

  return (
    <div 
      ref={containerRef} 
      className="code-editor" 
      data-testid="code-editor"
      style={{ height: '100%', width: '100%' }}
    />
  );
}
