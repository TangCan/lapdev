import * as Monaco from 'monaco-editor';
import {
  CompletionItem,
  CompletionItemKind,
  Diagnostic,
  Position,
  Range,
  Location,
  SignatureHelp,
  Hover,
} from 'vscode-languageserver-types';
import { API_URL } from '../config';

export interface LspConfig {
  language: string;
  serverPath?: string;
}

export interface LspDiagnostic {
  range: Monaco.Range;
  severity: Monaco.MarkerSeverity;
  message: string;
  code?: string | number;
  source: string;
}

export interface LspCompletionItem {
  label: string;
  kind: CompletionItemKind;
  detail?: string;
  documentation?: string;
  insertText?: string;
  sortText?: string;
}

const API_BASE_URL = `${API_URL}/v1/lsp`;

class LspService {
  private diagnostics: Map<string, LspDiagnostic[]> = new Map();
  private onDiagnosticsChange?: (uri: string, diagnostics: LspDiagnostic[]) => void;
  private isConnected = false;
  private currentLanguage = '';

  async connect(config: LspConfig): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: config.language }),
      });
      
      if (response.ok) {
        this.isConnected = true;
        this.currentLanguage = config.language;
      } else {
        throw new Error('Failed to start LSP server');
      }
    } catch (error) {
      console.warn('LSP server start failed, but will continue with fallback:', error);
      this.isConnected = true;
      this.currentLanguage = config.language;
    }
  }

  disconnect(): void {
    fetch(`${API_BASE_URL}/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: this.currentLanguage }),
    }).catch(() => {});
    this.isConnected = false;
    this.currentLanguage = '';
    this.diagnostics.clear();
  }

  private convertSeverity(severity?: number): Monaco.MarkerSeverity {
    switch (severity) {
      case 1: // Error
        return Monaco.MarkerSeverity.Error;
      case 2: // Warning
        return Monaco.MarkerSeverity.Warning;
      case 3: // Info
        return Monaco.MarkerSeverity.Info;
      case 4: // Hint
        return Monaco.MarkerSeverity.Hint;
      default:
        return Monaco.MarkerSeverity.Error;
    }
  }

  private getFilePathFromUri(uri: string): string {
    if (uri.startsWith('file://')) {
      return uri.slice(7);
    }
    return uri;
  }

  async getCompletions(
    uri: string,
    position: Position
  ): Promise<LspCompletionItem[]> {
    const model = Monaco.editor.getModels().find(m => m.uri.toString() === uri);
    const content = model?.getValue() || '';

    try {
      const response = await fetch(`${API_BASE_URL}/completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: this.getFilePathFromUri(uri),
          content,
          position,
        }),
      });

      const result = await response.json();
      
      if (result.status === 'success' && result.items) {
        return result.items.map((item: CompletionItem) => ({
          label: item.label,
          kind: item.kind || CompletionItemKind.Text,
          detail: item.detail,
          documentation: item.documentation
            ? typeof item.documentation === 'string'
              ? item.documentation
              : item.documentation.value
            : undefined,
          insertText: item.insertText || item.label,
          sortText: item.sortText,
        }));
      }
    } catch (error) {
      console.error('Error fetching completions:', error);
    }

    return [];
  }

  async getSignatureHelp(
    uri: string,
    position: Position
  ): Promise<SignatureHelp | null> {
    const model = Monaco.editor.getModels().find(m => m.uri.toString() === uri);
    const content = model?.getValue() || '';

    try {
      const response = await fetch(`${API_BASE_URL}/signature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: this.getFilePathFromUri(uri),
          content,
          position,
        }),
      });

      const result = await response.json();
      
      if (result.status === 'success' && result.signatures) {
        return result.signatures;
      }
    } catch (error) {
      console.error('Error fetching signature help:', error);
    }

    return null;
  }

  async getDefinition(
    uri: string,
    position: Position
  ): Promise<Location[] | null> {
    const model = Monaco.editor.getModels().find(m => m.uri.toString() === uri);
    const content = model?.getValue() || '';

    try {
      const response = await fetch(`${API_BASE_URL}/definition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: this.getFilePathFromUri(uri),
          content,
          position,
        }),
      });

      const result = await response.json();
      
      if (result.status === 'success' && result.locations) {
        return result.locations;
      }
    } catch (error) {
      console.error('Error fetching definition:', error);
    }

    return null;
  }

  async getReferences(
    uri: string,
    position: Position
  ): Promise<Location[] | null> {
    const model = Monaco.editor.getModels().find(m => m.uri.toString() === uri);
    const content = model?.getValue() || '';

    try {
      const response = await fetch(`${API_BASE_URL}/references`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: this.getFilePathFromUri(uri),
          content,
          position,
        }),
      });

      const result = await response.json();
      
      if (result.status === 'success' && result.locations) {
        return result.locations;
      }
    } catch (error) {
      console.error('Error fetching references:', error);
    }

    return null;
  }

  async getTypeDefinition(
    uri: string,
    position: Position
  ): Promise<Location[] | null> {
    const model = Monaco.editor.getModels().find(m => m.uri.toString() === uri);
    const content = model?.getValue() || '';

    try {
      const response = await fetch(`${API_BASE_URL}/typeDefinition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: this.getFilePathFromUri(uri),
          content,
          position,
        }),
      });

      const result = await response.json();
      
      if (result.status === 'success' && result.locations) {
        return result.locations;
      }
    } catch (error) {
      console.error('Error fetching type definition:', error);
    }

    return null;
  }

  async getHover(
    uri: string,
    position: Position
  ): Promise<Hover | null> {
    const model = Monaco.editor.getModels().find(m => m.uri.toString() === uri);
    const content = model?.getValue() || '';

    try {
      const response = await fetch(`${API_BASE_URL}/hover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: this.getFilePathFromUri(uri),
          content,
          position,
        }),
      });

      const result = await response.json();
      
      if (result.status === 'success' && result.hover) {
        return result.hover;
      }
    } catch (error) {
      console.error('Error fetching hover info:', error);
    }

    return null;
  }

  async renameSymbol(
    uri: string,
    position: Position,
    newName: string
  ): Promise<{ changes: { uri: string; edits: { range: Range; newText: string }[] }[] } | null> {
    const model = Monaco.editor.getModels().find(m => m.uri.toString() === uri);
    const content = model?.getValue() || '';

    try {
      const response = await fetch(`${API_BASE_URL}/rename`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: this.getFilePathFromUri(uri),
          content,
          position,
          newName,
        }),
      });

      const result = await response.json();
      
      if (result.status === 'success' && result.edits) {
        return result.edits;
      }
    } catch (error) {
      console.error('Error renaming symbol:', error);
    }

    return null;
  }

  async formatDocument(uri: string): Promise<{ range: Range; newText: string }[] | null> {
    const model = Monaco.editor.getModels().find(m => m.uri.toString() === uri);
    const content = model?.getValue() || '';

    try {
      const response = await fetch(`${API_BASE_URL}/format`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: this.getFilePathFromUri(uri),
          content,
        }),
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        const formattedContent = result.content;
        if (formattedContent !== content) {
          return [{
            range: {
              start: { line: 0, character: 0 },
              end: { line: content.split('\n').length, character: 0 },
            },
            newText: formattedContent,
          }];
        }
      }
    } catch (error) {
      console.error('Error formatting document:', error);
    }

    return null;
  }

  async getCodeActions(
    uri: string,
    range: Range
  ): Promise<Monaco.languages.CodeAction[]> {
    const model = Monaco.editor.getModels().find(m => m.uri.toString() === uri);
    const content = model?.getValue() || '';

    try {
      const response = await fetch(`${API_BASE_URL}/codeActions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: this.getFilePathFromUri(uri),
          content,
          range,
        }),
      });

      const result = await response.json();
      
      if (result.status === 'success' && result.actions) {
        return result.actions;
      }
    } catch (error) {
      console.error('Error fetching code actions:', error);
    }

    return [];
  }

  async didChange(uri: string, text: string): Promise<void> {
    await this.updateDiagnostics(uri, text);
  }

  async didOpen(uri: string, languageId: string, text: string): Promise<void> {
    await this.updateDiagnostics(uri, text);
  }

  async didClose(uri: string): Promise<void> {
    this.diagnostics.delete(uri);
    if (this.onDiagnosticsChange) {
      this.onDiagnosticsChange(uri, []);
    }
  }

  private async updateDiagnostics(uri: string, content: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/diagnostics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: this.getFilePathFromUri(uri),
          content,
        }),
      });

      const result = await response.json();
      
      if (result.status === 'success' && result.diagnostics) {
        const lspDiagnostics: LspDiagnostic[] = result.diagnostics.map((d: Diagnostic) => ({
          range: new Monaco.Range(
            d.range.start.line + 1,
            d.range.start.character + 1,
            d.range.end.line + 1,
            d.range.end.character + 1
          ),
          severity: this.convertSeverity(d.severity),
          message: d.message,
          code: d.code,
          source: d.source || 'LSP',
        }));

        this.diagnostics.set(uri, lspDiagnostics);

        if (this.onDiagnosticsChange) {
          this.onDiagnosticsChange(uri, lspDiagnostics);
        }
      }
    } catch (error) {
      console.error('Error fetching diagnostics:', error);
    }
  }

  getDiagnostics(uri: string): LspDiagnostic[] {
    return this.diagnostics.get(uri) || [];
  }

  setOnDiagnosticsChange(callback: (uri: string, diagnostics: LspDiagnostic[]) => void): void {
    this.onDiagnosticsChange = callback;
  }

  isServerConnected(): boolean {
    return this.isConnected;
  }
}

export const lspService = new LspService();
