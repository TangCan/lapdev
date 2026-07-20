import React, { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import * as Monaco from 'monaco-editor';
import { useLSP } from '../../context/LSPContext';
import { Position } from 'vscode-languageserver-types';
import { aiService } from '../../services/aiService';
import { useAI } from '../../context/AIContext';
import { useInlineCompletion } from '../../context/InlineCompletionContext';

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

// 支持内联补全的语言
const SUPPORTED_LANGUAGES = ['javascript', 'typescript', 'python', 'rust', 'go', 'java', 'cpp', 'csharp'];

// 防抖延迟（毫秒）
const DEBOUNCE_DELAY = 500;

const LspCodeEditorComponent = forwardRef<LspCodeEditorHandle, LspCodeEditorProps>(({
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
  
  // 内联补全相关状态
  const { isConnected } = useAI();
  const { inlineCompletionEnabled, inlineCompletionVisible, setInlineCompletionVisible, ghostText, setGhostText } = useInlineCompletion();
  
  // 使用 ref 存储最新版本的值，避免闭包问题
  const inlineCompletionEnabledRef = useRef(inlineCompletionEnabled);
  const isConnectedRef = useRef(isConnected);
  const ghostTextDecorationRef = useRef<string[]>([]);
  const debounceTimerRef = useRef<number | null>(null);
  const currentCompletionRequestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    inlineCompletionEnabledRef.current = inlineCompletionEnabled;
  }, [inlineCompletionEnabled]);

  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

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

  // 清除幽灵文本
  const clearGhostText = useCallback(() => {
    if (ghostTextDecorationRef.current.length > 0 && editorRef.current) {
      editorRef.current.deltaDecorations(ghostTextDecorationRef.current, []);
      ghostTextDecorationRef.current = [];
    }
    setGhostText('');
    setInlineCompletionVisible(false);
  }, [setGhostText, setInlineCompletionVisible]);

  // 应用幽灵文本装饰
  const applyGhostText = useCallback((text: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    const position = editor.getPosition();
    if (!position) return;

    const range = new Monaco.Range(
      position.lineNumber,
      position.column,
      position.lineNumber,
      position.column + text.length
    );

    // 清除之前的装饰
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

  // 取消当前进行中的补全请求
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

  // 触发内联补全
  const triggerCompletion = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) {
      console.log('triggerCompletion: editor is null');
      return;
    }

    // 使用 ref 访问最新值，避免闭包问题
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

    // 获取完整文件内容作为上下文
    const fileContent = model.getValue();

    // 构建补全请求
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
      
      // 使用 AbortController 支持取消请求
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
  }, [language, cancelCurrentCompletion, clearGhostText, setGhostText, setInlineCompletionVisible, inlineCompletionEnabled, isConnected]);

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

      // 内联补全快捷键处理
      if (inlineCompletionVisible) {
        if (e.key === 'Tab') {
          e.preventDefault();
          // 接受补全建议
          if (ghostText && editorRef.current) {
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
                text: ghostText,
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

    // 为测试暴露全局方法
    (window as any).__test_triggerCompletion = () => {
      console.log('Global __test_triggerCompletion called');
      triggerCompletion();
    };

    (window as any).__test_setEditorValue = (val: string) => {
      editorRef.current?.setValue(val);
      // 设置光标到文本末尾
      const model = editorRef.current?.getModel();
      if (model) {
        const lineCount = model.getLineCount();
        const lastLineLength = model.getLineLength(lineCount);
        editorRef.current?.setPosition(new Monaco.Position(lineCount, lastLineLength + 1));
      }
      console.log('Global __test_setEditorValue called:', val);
    };

    return () => {
      cancelCurrentCompletion();
      editorRef.current?.dispose();
      document.removeEventListener('keydown', handleKeyDown);
      delete (window as any).__test_triggerCompletion;
      delete (window as any).__test_setEditorValue;
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

  // 应用幽灵文本装饰
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

  const getPosition = useCallback((): Monaco.Position | undefined => {
    return editorRef.current?.getPosition() ?? undefined;
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
});

const LspCodeEditor = LspCodeEditorComponent;
export { LspCodeEditor };
export default LspCodeEditor;
