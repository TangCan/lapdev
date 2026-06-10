/**
 * CodeEditor Component
 * Monaco-based code editor with syntax highlighting and LSP support
 */

import React, { useEffect, useRef } from 'react';
import * as Monaco from 'monaco-editor';

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
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (!editorContainer.current) return;

    // Initialize Monaco editor
    editorRef.current = Monaco.editor.create(editorContainer.current, {
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

    // Load file if modelUri is provided
    if (modelUri) {
      loadFile(modelUri);
    }

    // Handle save
    editorRef.current.onDidChangeModelContent(() => {
      const content = editorRef.current?.getValue() || '';
      onSave?.(content);
    });

    return () => {
      editorRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (modelUri && editorRef.current) {
      loadFile(modelUri);
    }
  }, [modelUri]);

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

  return (
    <div className="h-full w-full">
      <div ref={editorContainer} className="h-full w-full" />
    </div>
  );
};

export default CodeEditor;