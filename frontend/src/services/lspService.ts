import { getMonacoSync, type MonacoModule } from './monacoLoader';
import type { Range as MonacoRange, MarkerSeverity } from 'monaco-editor';
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
import { computeContentHash, getFormatCache } from '../utils/formatCache';

export interface LspConfig {
  language: string;
  serverPath?: string;
}

export interface LspDiagnostic {
  range: MonacoRange;
  severity: MarkerSeverity;
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

const MARKER_SEVERITY = {
  Error: 8,
  Warning: 4,
  Info: 2,
  Hint: 1,
};

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

  private convertSeverity(severity?: number): MarkerSeverity {
    switch (severity) {
      case 1:
        return MARKER_SEVERITY.Error as MarkerSeverity;
      case 2:
        return MARKER_SEVERITY.Warning as MarkerSeverity;
      case 3:
        return MARKER_SEVERITY.Info as MarkerSeverity;
      case 4:
        return MARKER_SEVERITY.Hint as MarkerSeverity;
      default:
        return MARKER_SEVERITY.Error as MarkerSeverity;
    }
  }

  private getFilePathFromUri(uri: string): string {
    if (uri.startsWith('file://')) {
      return uri.slice(7);
    }
    return uri;
  }

  private getMonacoMod() {
    const mod = getMonacoSync();
    if (mod) return mod;
    
    return {
      Range: class {
        constructor(public startLineNumber: number, public startColumn: number, public endLineNumber: number, public endColumn: number) {}
      },
      Position: class {
        constructor(public lineNumber: number, public column: number) {}
      },
      MarkerSeverity: { Error: 8, Warning: 4, Info: 2, Hint: 1 },
      Uri: { parse: () => ({ toString: () => '', scheme: '', authority: '', path: '' }) },
      editor: {
        getModels: () => [],
        setModelMarkers: () => {},
        create: () => ({ dispose: () => {}, getModel: () => null, onDidChangeModelContent: () => ({ dispose: () => {} }) }),
      },
      languages: {
        register: () => {},
        setLanguageConfiguration: () => {},
        onLanguage: () => {},
      },
    } as unknown as MonacoModule;
  }

  async getCompletions(
    uri: string,
    position: Position
  ): Promise<LspCompletionItem[]> {
    const monacoMod = this.getMonacoMod();
    const model = monacoMod.editor.getModels().find(m => m.uri.toString() === uri);
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
    const monacoMod = this.getMonacoMod();
    const model = monacoMod.editor.getModels().find(m => m.uri.toString() === uri);
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
    const monacoMod = this.getMonacoMod();
    const model = monacoMod.editor.getModels().find(m => m.uri.toString() === uri);
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
    const monacoMod = this.getMonacoMod();
    const model = monacoMod.editor.getModels().find(m => m.uri.toString() === uri);
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
    const monacoMod = this.getMonacoMod();
    const model = monacoMod.editor.getModels().find(m => m.uri.toString() === uri);
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
    const monacoMod = this.getMonacoMod();
    const model = monacoMod.editor.getModels().find(m => m.uri.toString() === uri);
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
    const monacoMod = this.getMonacoMod();
    const model = monacoMod.editor.getModels().find(m => m.uri.toString() === uri);
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
    const monacoMod = this.getMonacoMod();
    const model = monacoMod.editor.getModels().find(m => m.uri.toString() === uri);
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

  /**
   * 范围格式化 - 仅格式化选中区域的代码
   *
   * 逻辑：获取 model 内容 → 提取 range 对应的子内容 → 调用 /api/v1/format → 合并回完整内容
   * 集成 formatCache：先查缓存 → 命中则直接返回 → 未命中则格式化后缓存
   *
   * @param uri Monaco model URI
   * @param range 行范围 { startLine, endLine } (0-based)
   * @returns 格式化编辑数组，或 null 表示无变化
   */
  async formatRange(
    uri: string,
    range: { startLine: number; endLine: number }
  ): Promise<{ range: Range; newText: string }[] | null> {
    const monacoMod = this.getMonacoMod();
    const model = monacoMod.editor.getModels().find(m => m.uri.toString() === uri);
    const fullContent = model?.getValue() || '';

    if (!fullContent) return null;

    // 处理末尾换行：split('\n') 对末尾有 \n 的内容会多出一个空元素
    const trimmedContent = fullContent.endsWith('\n') ? fullContent.slice(0, -1) : fullContent;
    const allLines = trimmedContent.split('\n');
    const { startLine, endLine } = range;

    // 边界检查（含负值守卫）
    if (startLine < 0 || endLine < 0 || startLine >= allLines.length || endLine >= allLines.length || startLine > endLine) {
      console.warn('[formatRange] Invalid range:', range);
      return null;
    }

    // 提取选中区域的子内容
    const selectedLines = allLines.slice(startLine, endLine + 1);
    const selectedContent = selectedLines.join('\n');

    if (!selectedContent) return null;

    // 缓存查找
    const cache = getFormatCache();
    const cacheKey = computeContentHash(selectedContent, { startLine, endLine });
    const cachedResult = cache.get(cacheKey);

    let formattedContent: string;
    if (cachedResult !== undefined) {
      formattedContent = cachedResult;
    } else {
      // 调用后端格式化 API（带超时）
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(`${API_BASE_URL}/format`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: this.getFilePathFromUri(uri),
            content: selectedContent,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.error('[formatRange] API returned non-OK status:', response.status);
          return null;
        }

        let result: { status: string; content?: string };
        try {
          result = await response.json();
        } catch {
          console.error('[formatRange] Failed to parse API response as JSON');
          return null;
        }

        if (result.status === 'success' && result.content !== undefined) {
          formattedContent = result.content;
          cache.set(cacheKey, formattedContent, { startLine, endLine });
        } else {
          return null;
        }
      } catch (error) {
        console.error('Error formatting range:', error);
        return null;
      }
    }

    // 仅返回选中范围的编辑（不替换整个文档）
    const formattedLines = formattedContent.split('\n');
    const lastLine = allLines[startLine] || '';
    const lastFormattedLine = formattedLines[formattedLines.length - 1] || '';

    if (formattedContent !== selectedContent) {
      return [{
        range: {
          start: { line: startLine, character: 0 },
          end: { line: endLine, character: lastLine.length },
        },
        newText: formattedContent,
      }];
    }

    return null;
  }

  async getCodeActions(
    uri: string,
    range: Range
  ): Promise<MonacoRange[]> {
    const monacoMod = this.getMonacoMod();
    const model = monacoMod.editor.getModels().find(m => m.uri.toString() === uri);
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
        const monacoMod = this.getMonacoMod();

        const lspDiagnostics: LspDiagnostic[] = result.diagnostics.map((d: Diagnostic) => ({
          range: new monacoMod.Range(
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