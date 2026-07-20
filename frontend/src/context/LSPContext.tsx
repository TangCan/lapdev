import React, { createContext, useContext, useEffect, useRef, useCallback, useState } from 'react';
import * as Monaco from 'monaco-editor';
import { lspService, LspDiagnostic, LspConfig } from '../services/lspService';
import { Position } from 'vscode-languageserver-types';

interface LSPContextType {
  isConnected: boolean;
  connect: (config: LspConfig) => Promise<void>;
  disconnect: () => void;
  getDiagnostics: (uri: string) => LspDiagnostic[];
  registerEditor: (editor: Monaco.editor.IStandaloneCodeEditor, uri: string) => void;
  unregisterEditor: (uri: string) => void;
  subscribeToDiagnostics: (callback: () => void) => () => void;
}

const LSPContext = createContext<LSPContextType | null>(null);

const convertCompletionKind = (kind: number): Monaco.languages.CompletionItemKind => {
  const kindMap: Record<number, Monaco.languages.CompletionItemKind> = {
    1: Monaco.languages.CompletionItemKind.Text,
    2: Monaco.languages.CompletionItemKind.Method,
    3: Monaco.languages.CompletionItemKind.Function,
    4: Monaco.languages.CompletionItemKind.Constructor,
    5: Monaco.languages.CompletionItemKind.Field,
    6: Monaco.languages.CompletionItemKind.Variable,
    7: Monaco.languages.CompletionItemKind.Class,
    8: Monaco.languages.CompletionItemKind.Interface,
    9: Monaco.languages.CompletionItemKind.Module,
    10: Monaco.languages.CompletionItemKind.Property,
    11: Monaco.languages.CompletionItemKind.Unit,
    12: Monaco.languages.CompletionItemKind.Value,
    13: Monaco.languages.CompletionItemKind.Enum,
    14: Monaco.languages.CompletionItemKind.Keyword,
    15: Monaco.languages.CompletionItemKind.Snippet,
    16: Monaco.languages.CompletionItemKind.Color,
    17: Monaco.languages.CompletionItemKind.File,
    18: Monaco.languages.CompletionItemKind.Reference,
  };
  return kindMap[kind] || Monaco.languages.CompletionItemKind.Text;
};

export const LSPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const editorsRef = useRef<Map<string, Monaco.editor.IStandaloneCodeEditor>>(new Map());
  const diagnosticSubscribersRef = useRef<Set<() => void>>(new Set());

  const notifyDiagnosticSubscribers = useCallback(() => {
    diagnosticSubscribersRef.current.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error('Error notifying diagnostic subscriber:', error);
      }
    });
  }, []);

  const handleDiagnosticsChange = useCallback((uri: string, diagnostics: LspDiagnostic[]) => {
    const editor = editorsRef.current.get(uri);
    if (editor) {
      const markers = diagnostics.map((d) => ({
        ...d,
        code: String(d.code || ''),
      }));

      Monaco.editor.setModelMarkers(
        editor.getModel()!,
        'lsp',
        markers as unknown as Monaco.editor.IMarkerData[]
      );
    }
    notifyDiagnosticSubscribers();
  }, [notifyDiagnosticSubscribers]);

  const connect = useCallback(async (config: LspConfig) => {
    try {
      await lspService.connect(config);
      lspService.setOnDiagnosticsChange(handleDiagnosticsChange);
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect to LSP server:', error);
      throw error;
    }
  }, [handleDiagnosticsChange]);

  const disconnect = useCallback(() => {
    lspService.disconnect();
    setIsConnected(false);
    editorsRef.current.clear();
  }, []);

  const getDiagnostics = useCallback((uri: string) => {
    return lspService.getDiagnostics(uri);
  }, []);

  const registerEditor = useCallback((editor: Monaco.editor.IStandaloneCodeEditor, uri: string) => {
    editorsRef.current.set(uri, editor);

    // Setup completion provider
    Monaco.languages.registerCompletionItemProvider(uri, {
      provideCompletionItems: async (model, position) => {
        const lspPosition: Position = {
          line: position.lineNumber - 1,
          character: position.column - 1,
        };

        const completions = await lspService.getCompletions(uri, lspPosition);

        return {
          suggestions: completions.map((item) => ({
            label: item.label,
            kind: convertCompletionKind(item.kind),
            detail: item.detail,
            documentation: item.documentation,
            insertText: item.insertText,
            sortText: item.sortText,
            range: model.getWordUntilPosition(position),
          })),
        } as any;
      },
    });

    // Setup definition provider
    Monaco.languages.registerDefinitionProvider(uri, {
      provideDefinition: async (model, position) => {
        const lspPosition: Position = {
          line: position.lineNumber - 1,
          character: position.column - 1,
        };

        const locations = await lspService.getDefinition(uri, lspPosition);
        if (!locations) return [];

        return locations.map((loc) => ({
          uri: Monaco.Uri.parse(loc.uri),
          range: new Monaco.Range(
            loc.range.start.line + 1,
            loc.range.start.character + 1,
            loc.range.end.line + 1,
            loc.range.end.character + 1
          ),
        })) as any;
      },
    });

    // Setup reference provider
    Monaco.languages.registerReferenceProvider(uri, {
      provideReferences: async (model, position, context) => {
        const lspPosition: Position = {
          line: position.lineNumber - 1,
          character: position.column - 1,
        };

        const locations = await lspService.getReferences(uri, lspPosition);
        if (!locations) return [];

        return locations.map((loc) => ({
          uri: Monaco.Uri.parse(loc.uri),
          range: new Monaco.Range(
            loc.range.start.line + 1,
            loc.range.start.character + 1,
            loc.range.end.line + 1,
            loc.range.end.character + 1
          ),
        })) as any;
      },
    });

    // Setup rename provider
    Monaco.languages.registerRenameProvider(uri, {
      provideRenameEdits: async (model, position, newName) => {
        const lspPosition: Position = {
          line: position.lineNumber - 1,
          character: position.column - 1,
        };

        const result = await lspService.renameSymbol(uri, lspPosition, newName);
        if (!result) return { edits: [] };

        const edits: any[] = [];
        result.changes?.forEach((change) => {
          change.edits.forEach((edit) => {
            edits.push({
              resource: Monaco.Uri.parse(change.uri),
              edits: [
                {
                  range: new Monaco.Range(
                    edit.range.start.line + 1,
                    edit.range.start.character + 1,
                    edit.range.end.line + 1,
                    edit.range.end.character + 1
                  ),
                  text: edit.newText,
                },
              ],
            });
          });
        });

        return { edits } as any;
      },
    });

    // Setup document formatter
    Monaco.languages.registerDocumentFormattingEditProvider(uri, {
      provideDocumentFormattingEdits: async (model, options) => {
        const result = await lspService.formatDocument(uri);
        if (!result) return [];

        return result.map((edit) => ({
          range: new Monaco.Range(
            edit.range.start.line + 1,
            edit.range.start.character + 1,
            edit.range.end.line + 1,
            edit.range.end.character + 1
          ),
          text: edit.newText,
        }));
      },
    });

    // Setup signature help provider
    Monaco.languages.registerSignatureHelpProvider(uri, {
      provideSignatureHelp: async (model, position) => {
        const lspPosition: Position = {
          line: position.lineNumber - 1,
          character: position.column - 1,
        };

        const result = await lspService.getSignatureHelp(uri, lspPosition);
        if (!result) return null;

        return {
          value: {
            signatures: result.signatures.map((sig) => ({
              label: sig.label,
              documentation: sig.documentation
                ? typeof sig.documentation === 'string'
                  ? sig.documentation
                  : sig.documentation.value
                : undefined,
              parameters: sig.parameters?.map((param) => ({
                label: param.label,
                documentation: param.documentation
                  ? typeof param.documentation === 'string'
                    ? param.documentation
                    : param.documentation.value
                  : undefined,
              })),
            })),
            activeSignature: result.activeSignature,
            activeParameter: result.activeParameter,
          },
          dispose: () => {},
        } as any;
      },
    });

    // Setup hover provider
    Monaco.languages.registerHoverProvider(uri, {
      provideHover: async (model, position) => {
        const lspPosition: Position = {
          line: position.lineNumber - 1,
          character: position.column - 1,
        };

        const result = await lspService.getHover(uri, lspPosition);
        if (!result) return null;

        const contents: Monaco.IMarkdownString[] = [];
        
        if (result.contents) {
          if (Array.isArray(result.contents)) {
            result.contents.forEach((content) => {
              if (typeof content === 'string') {
                contents.push({ value: content } as Monaco.IMarkdownString);
              } else {
                contents.push({ value: content.value } as Monaco.IMarkdownString);
              }
            });
          } else if (typeof result.contents === 'string') {
            contents.push({ value: result.contents } as Monaco.IMarkdownString);
          } else {
            contents.push({ value: result.contents.value } as Monaco.IMarkdownString);
          }
        }

        let range: Monaco.Range | undefined;
        if (result.range) {
          range = new Monaco.Range(
            result.range.start.line + 1,
            result.range.start.character + 1,
            result.range.end.line + 1,
            result.range.end.character + 1
          );
        }

        return {
          contents,
          range,
        };
      },
    });
  }, []);

  const unregisterEditor = useCallback((uri: string) => {
    editorsRef.current.delete(uri);
  }, []);

  const subscribeToDiagnostics = useCallback((callback: () => void): () => void => {
    diagnosticSubscribersRef.current.add(callback);
    return () => {
      diagnosticSubscribersRef.current.delete(callback);
    };
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return (
    <LSPContext.Provider
      value={{
        isConnected,
        connect,
        disconnect,
        getDiagnostics,
        registerEditor,
        unregisterEditor,
        subscribeToDiagnostics,
      }}
    >
      {children}
    </LSPContext.Provider>
  );
};

export const useLSP = (): LSPContextType => {
  const context = useContext(LSPContext);
  if (!context) {
    throw new Error('useLSP must be used within an LSPProvider');
  }
  return context;
};
