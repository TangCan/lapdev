import { useEffect, useRef, useCallback } from 'react';
import { getMonaco, getMonacoSync, type MonacoModule } from '../../services/monacoLoader';
import type { editor, Range as MonacoRange } from 'monaco-editor';
import { aiService } from '../../services/aiService';
import { useAI } from '../../context/AIContext';
import { useInlineCompletion } from '../../context/InlineCompletionContext';
import { useTheme } from '../../theme/ThemeContext';

import type { DiffLine } from '../../types/diff';

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  _readOnly?: boolean;
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
  _readOnly = false,
  minimap = true,
  fontSize = 14,
  diffLines = []
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoModuleRef = useRef<MonacoModule | null>(null);
  const decorationRef = useRef<string[]>([] as string[]);
  const ghostTextDecorationRef = useRef<string[]>([]);
  const debounceTimerRef = useRef<number | null>(null);
  const currentCompletionRequestRef = useRef<AbortController | null>(null);

  const { isConnected } = useAI();
  const { inlineCompletionEnabled, inlineCompletionVisible, setInlineCompletionVisible, ghostText, setGhostText } = useInlineCompletion();
  const { themeName } = useTheme();

  const inlineCompletionEnabledRef = useRef(inlineCompletionEnabled);
  const isConnectedRef = useRef(isConnected);

  useEffect(() => {
    inlineCompletionEnabledRef.current = inlineCompletionEnabled;
  }, [inlineCompletionEnabled]);

  useEffect(() => {
    isConnectedRef.current = isConnected;
    console.log('isConnected updated:', isConnected);
  }, [isConnected]);

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

    const monacoMod = monacoModuleRef.current || getMonacoSync();
    if (!monacoMod) return;

    const position = editor.getPosition();
    if (!position) return;

    const range = new monacoMod.Range(
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
    if (!editor) {
      console.log('triggerCompletion: editor is null');
      return;
    }

    if (!inlineCompletionEnabledRef.current) {
      console.log('triggerCompletion: inlineCompletionEnabled is false');
      clearGhostText();
      return;
    }

    if (!isConnectedRef.current) {
      console.log('triggerCompletion: isConnected is false');
      clearGhostText();
      return;
    }

    if (!SUPPORTED_LANGUAGES.includes(language.toLowerCase())) {
      console.log('triggerCompletion: unsupported language:', language);
      clearGhostText();
      return;
    }

    console.log('triggerCompletion: proceeding with completion');
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

            const monacoMod = monacoModuleRef.current || getMonacoSync();
            if (!monacoMod) return;

            const ghostTextPosition = new monacoMod.Range(
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
          if (error instanceof Error && error.message.includes('aborted')) {
            return;
          }
          console.error('Inline completion error:', error);
        }
      })().catch((error) => {
        console.error('Unhandled inline completion error:', error);
      });
    }, DEBOUNCE_DELAY);
  }, [language, cancelCurrentCompletion, clearGhostText, setGhostText, setInlineCompletionVisible]);

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
    }
  }, [inlineCompletionVisible, acceptCompletion, clearGhostText]);

  const updateDiffDecorations = useCallback(() => {
    if (!editorRef.current) return;

    if (decorationRef.current && decorationRef.current.length > 0) {
      editorRef.current.deltaDecorations(decorationRef.current, []);
      decorationRef.current = [];
    }

    const monacoMod = monacoModuleRef.current || getMonacoSync();
    if (!monacoMod) return;

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

    const decorations: editor.IModelDeltaDecoration[] = [];

    diffLines.forEach((diffLine) => {
      if (diffLine.type === 'deleted') return;

      decorations.push({
        range: new monacoMod.Range(diffLine.lineNumber, 1, diffLine.lineNumber, 1),
        options: {
          isWholeLine: true,
          className: `diff-${diffLine.type}`,
          glyphMarginClassName: `diff-glyph-${diffLine.type}`,
          minimap: {
            position: 1,
            color: getDiffColor(diffLine.type)
          },
          overviewRuler: {
            position: monacoMod.editor.OverviewRulerLane.Right,
            color: getDiffColor(diffLine.type)
          }
        }
      });
    });

    if (decorations.length > 0) {
      decorationRef.current = editorRef.current.deltaDecorations([], decorations);
    }
  }, [diffLines]);

  useEffect(() => {
    if (!containerRef.current) {
      console.log('CodeEditor: containerRef is null');
      return;
    }

    let cancelled = false;
    let cleanup: (() => void) | null = null;

    const init = async () => {
      try {
        const monacoMod = await getMonaco();
        if (cancelled) return;

        monacoModuleRef.current = monacoMod;

        const editorOptions: editor.IStandaloneEditorConstructionOptions = {
          value: value || '',
          language: language,
          minimap: { enabled: minimap },
          fontSize,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          theme: themeName === 'dark' ? 'vs-dark' : 'vs',
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

        editorRef.current = monacoMod.editor.create(containerRef.current!, editorOptions);
        console.log('CodeEditor: Monaco editor created successfully');

        const editor = editorRef.current;

        console.log('CodeEditor: attaching onDidChangeModelContent listener');

        editor.onDidChangeModelContent(() => {
          console.log('onDidChangeModelContent: called');
          const newValue = editor.getValue() || '';
          onChange(newValue);

          if (inlineCompletionVisible) {
            clearGhostText();
          }

          console.log('onDidChangeModelContent: calling triggerCompletion');
          triggerCompletion();
        });

        document.addEventListener('keydown', handleKeyDown);

        window.__test_triggerCompletion = () => {
          console.log('Global triggerCompletion called');
          triggerCompletion();
        };

        window.__test_setEditorValue = (val: string) => {
          editor.setValue(val);
          console.log('Global setEditorValue called:', val);
        };

        cleanup = () => {
          cancelCurrentCompletion();
          editor.dispose();
          document.removeEventListener('keydown', handleKeyDown);
          delete window.__test_triggerCompletion;
          delete window.__test_setEditorValue;
        };
      } catch (error) {
        console.error('Failed to load Monaco editor:', error);
      }
    };

    init();

    return () => {
      cancelled = true;
      cleanup?.();
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== value) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  useEffect(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      const monacoMod = monacoModuleRef.current || getMonacoSync();
      if (model && monacoMod) {
        monacoMod.editor.setModelLanguage(model, language);
      }
    }
  }, [language]);

  useEffect(() => {
    updateDiffDecorations();
  }, [updateDiffDecorations]);

  useEffect(() => {
    if (editorRef.current) {
      const monacoMod = monacoModuleRef.current || getMonacoSync();
      if (monacoMod && monacoMod.editor.setTheme) {
        const monacoTheme = themeName === 'dark' ? 'vs-dark' : 'vs';
        monacoMod.editor.setTheme(monacoTheme);
      }
    }
  }, [themeName]);

  return (
    <div 
      ref={containerRef} 
      className="code-editor" 
      data-testid="code-editor"
      style={{ height: '100%', width: '100%' }}
    />
  );
}