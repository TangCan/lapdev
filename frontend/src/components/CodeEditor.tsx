import React, { useEffect, useRef } from 'react';
import { getMonaco, getMonacoSync, type MonacoModule } from '../services/monacoLoader';
import type { editor } from 'monaco-editor';

interface CodeEditorProps {
  modelUri?: string;
  language?: string;
  onSave?: (content: string) => void;
  readOnly?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  modelUri,
  language = 'typescript',
  onSave,
  readOnly = false
}) => {
  const editorContainer = useRef<HTMLDivElement>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoModuleRef = useRef<MonacoModule | null>(null);

  const loadFile = async (uri: string) => {
    try {
      const response = await fetch(`/api/v1/files/read?path=${encodeURIComponent(uri)}`);
      const data = await response.json();
      if (data.status === 'success') {
        editorRef.current?.setValue(data.content);
      }
    } catch (error) {
      console.error('Failed to load file:', error);
    }
  };

  useEffect(() => {
    if (!editorContainer.current) return;

    let cancelled = false;
    let cleanup: (() => void) | null = null;

    const init = async () => {
      try {
        const monacoMod = await getMonaco();
        if (cancelled) return;

        monacoModuleRef.current = monacoMod;

        editorRef.current = monacoMod.editor.create(editorContainer.current!, {
          value: '',
          language,
          theme: 'vs-dark',
          readOnly,
          fontSize: 14,
          fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace',
          tabSize: 2,
          insertSpaces: true,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          folding: true,
          bracketPairColorization: { enabled: true },
          minimap: {
            enabled: true,
            showSlider: 'always'
          }
        });

        if (modelUri) {
          loadFile(modelUri);
        }

        editorRef.current.onDidChangeModelContent(() => {
          const content = editorRef.current?.getValue() || '';
          onSave?.(content);
        });

        cleanup = () => {
          editorRef.current?.dispose();
        };
      } catch (error) {
        console.error('Failed to load Monaco editor:', error);
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
    if (modelUri && editorRef.current) {
      loadFile(modelUri);
    }
  }, [modelUri]);

  return (
    <div className="h-full w-full">
      <div ref={editorContainer} className="h-full w-full" />
    </div>
  );
};

export default CodeEditor;