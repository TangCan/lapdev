import React, { createContext, useContext, useEffect, useRef, useCallback, useState } from 'react';
import { getMonacoSync } from '../services/monacoLoader';
import type { editor, languages, Range as MonacoRange, IMarkdownString } from 'monaco-editor';
import { lspService, LspDiagnostic, LspConfig } from '../services/lspService';
import { Position } from 'vscode-languageserver-types';

interface LSPContextType {
  isConnected: boolean;
  connect: (config: LspConfig) => Promise<void>;
  disconnect: () => void;
  getDiagnostics: (uri: string) => LspDiagnostic[];
  registerEditor: (editor: editor.IStandaloneCodeEditor, uri: string) => void;
  unregisterEditor: (uri: string) => void;
  subscribeToDiagnostics: (callback: () => void) => () => void;
}

const LSPContext = createContext<LSPContextType | null>(null);

const COMPLETION_ITEM_KIND = {
  Text: 1,
  Method: 2,
  Function: 3,
  Constructor: 4,
  Field: 5,
  Variable: 6,
  Class: 7,
  Interface: 8,
  Module: 9,
  Property: 10,
  Unit: 11,
  Value: 12,
  Enum: 13,
  Keyword: 14,
  Snippet: 15,
  Color: 16,
  File: 17,
  Reference: 18,
};

const convertCompletionKind = (kind: number): number => {
  const kindMap: Record<number, number> = {
    1: COMPLETION_ITEM_KIND.Text,
    2: COMPLETION_ITEM_KIND.Method,
    3: COMPLETION_ITEM_KIND.Function,
    4: COMPLETION_ITEM_KIND.Constructor,
    5: COMPLETION_ITEM_KIND.Field,
    6: COMPLETION_ITEM_KIND.Variable,
    7: COMPLETION_ITEM_KIND.Class,
    8: COMPLETION_ITEM_KIND.Interface,
    9: COMPLETION_ITEM_KIND.Module,
    10: COMPLETION_ITEM_KIND.Property,
    11: COMPLETION_ITEM_KIND.Unit,
    12: COMPLETION_ITEM_KIND.Value,
    13: COMPLETION_ITEM_KIND.Enum,
    14: COMPLETION_ITEM_KIND.Keyword,
    15: COMPLETION_ITEM_KIND.Snippet,
    16: COMPLETION_ITEM_KIND.Color,
    17: COMPLETION_ITEM_KIND.File,
    18: COMPLETION_ITEM_KIND.Reference,
  };
  return kindMap[kind] || COMPLETION_ITEM_KIND.Text;
};

export const LSPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const editorsRef = useRef<Map<string, editor.IStandaloneCodeEditor>>(new Map());
  const diagnosticSubscribersRef = useRef<Set<() => void>>(new Set());
  const disposersRef = useRef<Map<string, Array<{ dispose: () => void }>>>(new Map());

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
    const monacoMod = getMonacoSync();
    if (!monacoMod) return;

    const editorInstance = editorsRef.current.get(uri);
    if (editorInstance) {
      const markers = diagnostics.map((d) => ({
        ...d,
        code: String(d.code || ''),
      }));

      monacoMod.editor.setModelMarkers(
        editorInstance.getModel()!,
        'lsp',
        markers as unknown as editor.IMarkerData[]
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

  const registerEditor = useCallback((editorInstance: editor.IStandaloneCodeEditor, uri: string) => {
    editorsRef.current.set(uri, editorInstance);

    const monacoMod = getMonacoSync();
    if (!monacoMod) return;

    const disposers: Array<{ dispose: () => void }> = [];

    disposers.push(monacoMod.languages.registerCompletionItemProvider(uri, {
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
          })),
        } as unknown as languages.CompletionList;
      },
    }));

    disposers.push(monacoMod.languages.registerDefinitionProvider(uri, {
      provideDefinition: async (model, position) => {
        const lspPosition: Position = {
          line: position.lineNumber - 1,
          character: position.column - 1,
        };

        const locations = await lspService.getDefinition(uri, lspPosition);
        if (!locations) return [];

        return locations.map((loc) => ({
          uri: monacoMod.Uri.parse(loc.uri),
          range: new monacoMod.Range(
            loc.range.start.line + 1,
            loc.range.start.character + 1,
            loc.range.end.line + 1,
            loc.range.end.character + 1
          ),
        }));
      },
    }));

    disposers.push(monacoMod.languages.registerReferenceProvider(uri, {
      provideReferences: async (model, position) => {
        const lspPosition: Position = {
          line: position.lineNumber - 1,
          character: position.column - 1,
        };

        const locations = await lspService.getReferences(uri, lspPosition);
        if (!locations) return [];

        return locations.map((loc) => ({
          uri: monacoMod.Uri.parse(loc.uri),
          range: new monacoMod.Range(
            loc.range.start.line + 1,
            loc.range.start.character + 1,
            loc.range.end.line + 1,
            loc.range.end.character + 1
          ),
        }));
      },
    }));

    disposers.push(monacoMod.languages.registerRenameProvider(uri, {
      provideRenameEdits: async (model, position, newName) => {
        const lspPosition: Position = {
          line: position.lineNumber - 1,
          character: position.column - 1,
        };

        const result = await lspService.renameSymbol(uri, lspPosition, newName);
        if (!result) return { edits: [] };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const edits: any[] = [];
        result.changes?.forEach((change) => {
          change.edits.forEach((edit) => {
            edits.push({
              resource: monacoMod.Uri.parse(change.uri),
              edits: [
                {
                  range: new monacoMod.Range(
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { edits } as any;
      },
    }));

    disposers.push(monacoMod.languages.registerDocumentFormattingEditProvider(uri, {
      provideDocumentFormattingEdits: async () => {
        const result = await lspService.formatDocument(uri);
        if (!result) return [];

        return result.map((edit) => ({
          range: new monacoMod.Range(
            edit.range.start.line + 1,
            edit.range.start.character + 1,
            edit.range.end.line + 1,
            edit.range.end.character + 1
          ),
          text: edit.newText,
        }));
      },
    }));

    disposers.push(monacoMod.languages.registerSignatureHelpProvider(uri, {
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
        } as languages.SignatureHelpResult;
      },
    }));

    disposers.push(monacoMod.languages.registerHoverProvider(uri, {
      provideHover: async (model, position) => {
        const lspPosition: Position = {
          line: position.lineNumber - 1,
          character: position.column - 1,
        };

        const result = await lspService.getHover(uri, lspPosition);
        if (!result) return null;

        const contents: IMarkdownString[] = [];

        if (result.contents) {
          if (Array.isArray(result.contents)) {
            result.contents.forEach((content) => {
              if (typeof content === 'string') {
                contents.push({ value: content });
              } else {
                contents.push({ value: content.value });
              }
            });
          } else if (typeof result.contents === 'string') {
            contents.push({ value: result.contents });
          } else {
            contents.push({ value: result.contents.value });
          }
        }

        let range: MonacoRange | undefined;
        if (result.range) {
          range = new monacoMod.Range(
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
    }));

    disposersRef.current.set(uri, disposers);
  }, []);

  const unregisterEditor = useCallback((uri: string) => {
    const disposers = disposersRef.current.get(uri);
    if (disposers) {
      disposers.forEach(d => d.dispose());
      disposersRef.current.delete(uri);
    }
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