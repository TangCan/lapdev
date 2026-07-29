import React, { useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useState } from 'react';
import { getMonaco, getMonacoSync, loadLanguage, type MonacoModule } from '../../services/monacoLoader';
import type { Position, editor } from 'monaco-editor';
import { useLSP } from '../../context/LSPContext';
import { aiService } from '../../services/aiService';
import { useAI } from '../../context/AIContext';
import { useInlineCompletion } from '../../context/InlineCompletionContext';
import { getOptimizedEditorOptions, getLineCount, LARGE_FILE_THRESHOLD, HUGE_FILE_THRESHOLD } from '../../utils/monacoOptimizer';

import type { DiffLine } from '../../types/diff';

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
  getPosition: () => Position | undefined;
  setPosition: (line: number, column: number) => void;
  retryInit: () => Promise<void>;
}

const SUPPORTED_LANGUAGES = ['javascript', 'typescript', 'python', 'rust', 'go', 'java', 'cpp', 'csharp'];

const DEBOUNCE_DELAY = 500;

function buildBaseOptions(params: {
  value: string;
  language: string;
  readOnly: boolean;
  minimap: boolean;
  fontSize: number;
}): editor.IStandaloneEditorConstructionOptions {
  const { value, language, readOnly, minimap, fontSize } = params;
  return {
    value,
    language,
    readOnly,
    minimap: { enabled: minimap },
    fontSize,
    lineNumbers: 'on',
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
  };
}

function LspCodeEditorComponent(props: LspCodeEditorProps, ref: React.ForwardedRef<LspCodeEditorHandle>) {
  const {
    value,
    language,
    onChange,
    readOnly = false,
    minimap = true,
    fontSize = 14,
    diffLines = [],
    uri = 'file:///workspace/test.ts',
  } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const decorationRef = useRef<string[]>([]);
  const monacoModuleRef = useRef<MonacoModule | null>(null);
  const [monacoReady, setMonacoReady] = useState(false);
  const [initError, setInitError] = useState(false);
  const prevIsLargeRef = useRef(false);
  const prevIsHugeRef = useRef(false);
  const thresholdInitRef = useRef(false);
  const thresholdDebounceRef = useRef<number | null>(null);
  const { connect, registerEditor, unregisterEditor } = useLSP();

  const { isConnected } = useAI();
  const { inlineCompletionEnabled, inlineCompletionVisible, setInlineCompletionVisible, ghostText, setGhostText } = useInlineCompletion();

  const inlineCompletionEnabledRef = useRef(inlineCompletionEnabled);
  const isConnectedRef = useRef(isConnected);
  const ghostTextRef = useRef(ghostText);
  const ghostTextDecorationRef = useRef<string[]>([]);
  const debounceTimerRef = useRef<number | null>(null);
  const currentCompletionRequestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    inlineCompletionEnabledRef.current = inlineCompletionEnabled;
  }, [inlineCompletionEnabled]);

  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  useEffect(() => {
    ghostTextRef.current = ghostText;
  }, [ghostText]);

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

  const updateDiffDecorations = useCallback(() => {
    if (!editorRef.current) return;

    if (decorationRef.current.length > 0) {
      editorRef.current.deltaDecorations(decorationRef.current, []);
      decorationRef.current = [];
    }

    const monacoMod = monacoModuleRef.current;
    if (!monacoMod) return;

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
            color: getDiffColor(diffLine.type),
          },
          overviewRuler: {
            position: monacoMod.editor.OverviewRulerLane.Right,
            color: getDiffColor(diffLine.type),
          },
        },
      });
    });

    if (decorations.length > 0) {
      decorationRef.current = editorRef.current.deltaDecorations([], decorations);
    }
  }, [diffLines]);

  const clearGhostText = useCallback(() => {
    if (ghostTextDecorationRef.current.length > 0 && editorRef.current) {
      editorRef.current.deltaDecorations(ghostTextDecorationRef.current, []);
      ghostTextDecorationRef.current = [];
    }
    setGhostText('');
    setInlineCompletionVisible(false);
  }, [setGhostText, setInlineCompletionVisible]);

  const applyGhostText = useCallback((text: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    const monacoMod = monacoModuleRef.current;
    if (!monacoMod) return;

    const position = editor.getPosition();
    if (!position) return;

    const range = new monacoMod.Range(
      position.lineNumber,
      position.column,
      position.lineNumber,
      position.column + text.length
    );

    if (ghostTextDecorationRef.current.length > 0) {
      editor.deltaDecorations(ghostTextDecorationRef.current, []);
    }

    ghostTextDecorationRef.current = editor.deltaDecorations([], [{
      range,
      options: {
        isWholeLine: false,
        inlineClassName: 'inline-completion-ghost',
      },
    }]);
  }, []);

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

    console.log('triggerCompletion: proceeding with completion request');
    cancelCurrentCompletion();

    const model = editor.getModel();
    if (!model) return;

    const position = editor.getPosition();
    if (!position) return;

    const lineContent = model.getValueInRange({
      startLineNumber: position.lineNumber,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column,
    });

    const fileContent = model.getValue();

    const requestData = {
      prompt: lineContent,
      prefix: lineContent,
      suffix: model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: model.getLineCount(),
        endColumn: model.getLineLength(model.getLineCount()) + 1,
      }),
      fileContent,
      language: language.toLowerCase(),
      maxTokens: 50,
    };

    debounceTimerRef.current = window.setTimeout(() => {
      debounceTimerRef.current = null;

      console.log('triggerCompletion: debounce timer fired, sending request');

      const abortController = new AbortController();
      currentCompletionRequestRef.current = abortController;

      (async () => {
        try {
          if (abortController.signal.aborted) {
            console.log('triggerCompletion: request was aborted before sending');
            return;
          }

          console.log('triggerCompletion: calling aiService.getInlineCompletion');
          const result = await aiService.getInlineCompletion(requestData);

          if (abortController.signal.aborted) {
            console.log('triggerCompletion: request was aborted after response');
            return;
          }

          if (result.completion && result.completion.trim()) {
            console.log('triggerCompletion: got completion result:', result.completion);
            setGhostText(result.completion.trim());
            setInlineCompletionVisible(true);
          } else {
            console.log('triggerCompletion: empty completion result');
            clearGhostText();
          }
        } catch (error) {
          if (error instanceof Error && error.name !== 'AbortError') {
            console.error('Inline completion error:', error);
          } else if (error instanceof Error && error.name === 'AbortError') {
            console.log('Inline completion request aborted');
          }
        }
      })().catch((error) => {
        console.error('Unhandled inline completion error:', error);
      });
    }, DEBOUNCE_DELAY);
  }, [language, cancelCurrentCompletion, clearGhostText, setGhostText, setInlineCompletionVisible]);

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | null = null;

    const init = async () => {
      try {
        setInitError(false);
        const monacoMod = await getMonaco();
        if (cancelled) return;

        monacoModuleRef.current = monacoMod;

        loadLanguage(language);

        const createEditor = () => {
          if (!containerRef.current || cancelled) return;

          const baseOptions = buildBaseOptions({ value, language, readOnly, minimap, fontSize });
          const options = getOptimizedEditorOptions(value, baseOptions);

          editorRef.current = monacoMod.editor.create(containerRef.current, options);

          editorRef.current.onDidChangeModelContent(() => {
            const newValue = editorRef.current?.getValue() || '';
            onChange(newValue);

            if (inlineCompletionVisible) {
              clearGhostText();
            }

            triggerCompletion();
          });

          const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 's') {
              e.preventDefault();
              editorRef.current?.trigger('keyboard', 'editor.action.formatDocument', {});
            }
            if (e.ctrlKey && e.key === 'F') {
              e.preventDefault();
              editorRef.current?.trigger('keyboard', 'editor.action.formatDocument', {});
            }
            if (e.ctrlKey && e.key === 'd') {
              e.preventDefault();
              editorRef.current?.trigger('keyboard', 'editor.action.goToDefinition', {});
            }
            if (e.ctrlKey && e.key === 'r') {
              e.preventDefault();
              editorRef.current?.trigger('keyboard', 'editor.action.rename', {});
            }

            if (inlineCompletionVisible) {
              if (e.key === 'Tab') {
                e.preventDefault();
                if (ghostTextRef.current && editorRef.current) {
                  const editor = editorRef.current;
                  const position = editor.getPosition();
                  if (position) {
                    editor.executeEdits('inline-completion', [{
                      range: {
                        startLineNumber: position.lineNumber,
                        startColumn: position.column,
                        endLineNumber: position.lineNumber,
                        endColumn: position.column,
                      },
                      text: ghostTextRef.current,
                    }]);
                    clearGhostText();
                  }
                }
              } else if (e.key === 'Escape') {
                e.preventDefault();
                clearGhostText();
              }
            }
          };

          document.addEventListener('keydown', handleKeyDown);

          window.__test_triggerCompletion = () => {
            console.log('Global __test_triggerCompletion called');
            triggerCompletion();
          };

          window.__test_setEditorValue = (val: string) => {
            editorRef.current?.setValue(val);
            const model = editorRef.current?.getModel();
            if (model && monacoModuleRef.current) {
              const lineCount = model.getLineCount();
              const lastLineLength = model.getLineLength(lineCount);
              editorRef.current?.setPosition(new monacoModuleRef.current.Position(lineCount, lastLineLength + 1));
            }
            console.log('Global __test_setEditorValue called:', val);
          };

          setMonacoReady(true);

          cleanup = () => {
            cancelCurrentCompletion();
            editorRef.current?.dispose();
            document.removeEventListener('keydown', handleKeyDown);
            delete window.__test_triggerCompletion;
            delete window.__test_setEditorValue;
          };
        };

        createEditor();
      } catch (error) {
        console.error('Failed to load Monaco editor:', error);
        if (!cancelled) {
          setMonacoReady(false);
          setInitError(true);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const initLSP = async () => {
      try {
        await connect({ language });

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
    if (!thresholdInitRef.current) {
      thresholdInitRef.current = true;
      const lineCount = getLineCount(value);
      prevIsLargeRef.current = lineCount > LARGE_FILE_THRESHOLD;
      prevIsHugeRef.current = lineCount > HUGE_FILE_THRESHOLD;
      return;
    }

    if (thresholdDebounceRef.current !== null) {
      window.clearTimeout(thresholdDebounceRef.current);
    }

    thresholdDebounceRef.current = window.setTimeout(() => {
      thresholdDebounceRef.current = null;

      const lineCount = getLineCount(value);
      const isLarge = lineCount > LARGE_FILE_THRESHOLD;
      const isHuge = lineCount > HUGE_FILE_THRESHOLD;
      const thresholdChanged = isLarge !== prevIsLargeRef.current || isHuge !== prevIsHugeRef.current;

      if (thresholdChanged && editorRef.current) {
        const baseOptions = buildBaseOptions({ value, language, readOnly, minimap, fontSize });
        const newOptions = getOptimizedEditorOptions(value, baseOptions);
        requestAnimationFrame(() => {
          if (editorRef.current) {
            editorRef.current.updateOptions(newOptions);
          }
        });
      }

      prevIsLargeRef.current = isLarge;
      prevIsHugeRef.current = isHuge;
    }, 300);

    return () => {
      if (thresholdDebounceRef.current !== null) {
        window.clearTimeout(thresholdDebounceRef.current);
      }
    };
  }, [value, language, readOnly, minimap, fontSize]);

  useEffect(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      const monacoMod = monacoModuleRef.current;
      if (model && monacoMod) {
        monacoMod.editor.setModelLanguage(model, language);
      }
    }
  }, [language]);

  useEffect(() => {
    updateDiffDecorations();
  }, [updateDiffDecorations]);

  useEffect(() => {
    if (ghostText && inlineCompletionVisible) {
      applyGhostText(ghostText);
    } else {
      clearGhostText();
    }
  }, [ghostText, inlineCompletionVisible, applyGhostText, clearGhostText]);

  const focus = useCallback(() => {
    editorRef.current?.focus();
  }, []);

  const getPosition = useCallback((): Position | undefined => {
    return editorRef.current?.getPosition() ?? undefined;
  }, []);

  const setPosition = useCallback((line: number, column: number) => {
    const monacoMod = monacoModuleRef.current || getMonacoSync();
    if (!monacoMod) return;
    editorRef.current?.setPosition(new monacoMod.Position(line, column));
    editorRef.current?.revealLineInCenter(line);
  }, []);

  const retryInit = useCallback(async () => {
    setInitError(false);
    try {
      const monacoMod = await getMonaco();
      monacoModuleRef.current = monacoMod;

      if (!containerRef.current) return;

      editorRef.current?.dispose();
      editorRef.current = null;
      decorationRef.current = [];
      ghostTextDecorationRef.current = [];

      editorRef.current = monacoMod.editor.create(containerRef.current, getOptimizedEditorOptions(value, buildBaseOptions({ value, language, readOnly, minimap, fontSize })));

      editorRef.current.onDidChangeModelContent(() => {
        const newValue = editorRef.current?.getValue() || '';
        onChange(newValue);

        if (inlineCompletionVisible) {
          clearGhostText();
        }

        triggerCompletion();
      });

      setMonacoReady(true);
    } catch (error) {
      console.error('Failed to retry Monaco editor:', error);
      setInitError(true);
    }
  }, [value, language, readOnly, minimap, fontSize, onChange, inlineCompletionVisible, clearGhostText, triggerCompletion]);

  useImperativeHandle(ref, () => ({
    focus,
    getPosition,
    setPosition,
    retryInit,
  }), [focus, getPosition, setPosition, retryInit]);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      {!monacoReady && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#1e1e1e',
            color: '#8b949e',
            zIndex: 1,
          }}
        >
          {initError ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 8 }}>Failed to load editor</div>
              <button
                onClick={() => retryInit()}
                style={{
                  padding: '6px 16px',
                  background: '#3794ff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                Retry
              </button>
            </div>
          ) : (
            'Loading editor...'
          )}
        </div>
      )}
      <div
        ref={containerRef}
        className="code-editor"
        data-testid="code-editor"
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
}

const LspCodeEditor = forwardRef(LspCodeEditorComponent);
export { LspCodeEditor };
export default LspCodeEditor;