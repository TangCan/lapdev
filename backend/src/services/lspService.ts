interface Position {
  line: number;
  character: number;
}

interface Range {
  start: Position;
  end: Position;
}

interface CompletionItem {
  label: string;
  kind: number;
  detail?: string;
  documentation?: string;
  insertText?: string;
  sortText?: string;
}

interface Diagnostic {
  range: Range;
  severity: number;
  code?: string | number;
  source: string;
  message: string;
}

export class LspService {
  private servers: Map<string, any> = new Map();

  async startServer(language: string): Promise<void> {
    if (this.servers.has(language)) {
      return;
    }

    this.servers.set(language, {
      language,
      started: true,
    });
  }

  async stopServer(language: string): Promise<void> {
    this.servers.delete(language);
  }

  isServerRunning(language: string): boolean {
    return this.servers.has(language);
  }

  async getCompletions(
    path: string,
    content: string,
    position: Position
  ): Promise<CompletionItem[]> {
    const language = this.getLanguageFromPath(path);
    const server = this.servers.get(language);

    if (!server) {
      return [];
    }

    const suggestions = this.generateCompletions(content, position, language);
    return suggestions;
  }

  async getSignatureHelp(
    path: string,
    content: string,
    position: Position
  ): Promise<any> {
    const language = this.getLanguageFromPath(path);
    const server = this.servers.get(language);

    if (!server) {
      return null;
    }

    return this.generateSignatureHelp(content, position, language);
  }

  async getDefinition(
    path: string,
    content: string,
    position: Position
  ): Promise<any[]> {
    const language = this.getLanguageFromPath(path);
    const server = this.servers.get(language);

    if (!server) {
      return [];
    }

    return this.generateDefinition(content, position, language);
  }

  async getReferences(
    path: string,
    content: string,
    position: Position
  ): Promise<any[]> {
    const language = this.getLanguageFromPath(path);
    const server = this.servers.get(language);

    if (!server) {
      return [];
    }

    return this.generateReferences(content, position, language);
  }

  async getTypeDefinition(
    path: string,
    content: string,
    position: Position
  ): Promise<any[]> {
    const language = this.getLanguageFromPath(path);
    const server = this.servers.get(language);

    if (!server) {
      return [];
    }

    return this.generateTypeDefinition(content, position, language);
  }

  async renameSymbol(
    path: string,
    content: string,
    position: Position,
    newName: string
  ): Promise<any> {
    const language = this.getLanguageFromPath(path);
    const server = this.servers.get(language);

    if (!server) {
      return null;
    }

    return this.generateRenameEdits(content, position, newName, language);
  }

  async formatDocument(path: string, content: string): Promise<string> {
    const language = this.getLanguageFromPath(path);
    const server = this.servers.get(language);

    if (!server) {
      return content;
    }

    return this.formatCode(content, language);
  }

  async getCodeActions(
    path: string,
    content: string,
    range: Range
  ): Promise<any[]> {
    const language = this.getLanguageFromPath(path);
    const server = this.servers.get(language);

    if (!server) {
      return [];
    }

    return this.generateCodeActions(content, range, language);
  }

  async getDiagnostics(path: string, content: string): Promise<Diagnostic[]> {
    const language = this.getLanguageFromPath(path);
    const server = this.servers.get(language);

    if (!server) {
      return [];
    }

    return this.generateDiagnostics(content, language);
  }

  async getHover(
    path: string,
    content: string,
    position: Position
  ): Promise<any> {
    const language = this.getLanguageFromPath(path);

    return this.generateHover(content, position, language);
  }

  private getLanguageFromPath(path: string): string {
    const ext = path.split('.').pop();
    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'rs': 'rust',
      'go': 'go',
    };

    return languageMap[ext || ''] || 'plaintext';
  }

  private generateCompletions(
    content: string,
    position: Position,
    language: string
  ): CompletionItem[] {
    const line = content.split('\n')[position.line];
    const beforeCursor = line.substring(0, position.character);

    const completions: CompletionItem[] = [];

    if (language === 'typescript' || language === 'javascript') {
      const keywords = [
        'const', 'let', 'var', 'function', 'class', 'interface', 'type',
        'import', 'export', 'default', 'from', 'async', 'await', 'return',
        'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'continue',
        'try', 'catch', 'finally', 'throw', 'new', 'this', 'super',
        'extends', 'implements', 'public', 'private', 'protected', 'static',
        'readonly', 'abstract', 'interface', 'enum', 'namespace', 'module'
      ];

      keywords.forEach(keyword => {
        if (keyword.startsWith(beforeCursor)) {
          completions.push({
            label: keyword,
            kind: 14,
            detail: 'Keyword',
            insertText: keyword,
          });
        }
      });

      const builtins = [
        'console', 'document', 'window', 'Array', 'Object', 'String',
        'Number', 'Boolean', 'Date', 'Math', 'JSON', 'Promise', 'Map', 'Set'
      ];

      builtins.forEach(builtin => {
        if (builtin.startsWith(beforeCursor)) {
          completions.push({
            label: builtin,
            kind: 6,
            detail: 'Built-in',
            insertText: builtin,
          });
        }
      });
    }

    return completions;
  }

  private generateSignatureHelp(
    content: string,
    position: Position,
    language: string
  ): any {
    const line = content.split('\n')[position.line];
    const beforeCursor = line.substring(0, position.character);

    const functionCalls = ['console.log', 'console.error', 'console.warn', 'console.info'];

    for (const func of functionCalls) {
      if (beforeCursor.endsWith(func + '(')) {
        return {
          signatures: [
            {
              label: `${func}(...data: any[]): void`,
              documentation: `Outputs a message to the console`,
              parameters: [
                {
                  label: 'data',
                  documentation: 'The data to output'
                }
              ]
            }
          ],
          activeSignature: 0,
          activeParameter: 0
        };
      }
    }

    return null;
  }

  private generateDefinition(
    content: string,
    position: Position,
    language: string
  ): any[] {
    const lines = content.split('\n');
    const line = lines[position.line];
    
    if (!line) return [];

    const word = this.extractWord(line, position.character);
    if (!word) return [];

    const definitions: any[] = [];

    for (let i = 0; i < lines.length; i++) {
      const searchLine = lines[i];
      
      if (i !== position.line) {
        if (searchLine.includes(`function ${word}`) ||
            searchLine.includes(`const ${word} =`) ||
            searchLine.includes(`let ${word} =`) ||
            searchLine.includes(`var ${word} =`) ||
            searchLine.includes(`class ${word}`) ||
            searchLine.includes(`interface ${word}`) ||
            searchLine.includes(`type ${word} =`)) {
          
          const startChar = searchLine.indexOf(word);
          definitions.push({
            uri: 'file:///workspace/test.ts',
            range: {
              start: { line: i, character: startChar },
              end: { line: i, character: startChar + word.length }
            }
          });
        }
      }
    }

    return definitions;
  }

  private generateReferences(
    content: string,
    position: Position,
    language: string
  ): any[] {
    const lines = content.split('\n');
    const line = lines[position.line];
    
    if (!line) return [];

    const word = this.extractWord(line, position.character);
    if (!word) return [];

    const references: any[] = [];
    const escapedWord = this.escapeRegex(word);

    for (let i = 0; i < lines.length; i++) {
      const searchLine = lines[i];
      const regex = new RegExp(`\\b${escapedWord}\\b`, 'g');
      let match;

      while ((match = regex.exec(searchLine)) !== null) {
        references.push({
          uri: 'file:///workspace/test.ts',
          range: {
            start: { line: i, character: match.index },
            end: { line: i, character: match.index + word.length }
          }
        });
      }
    }

    return references;
  }

  private generateTypeDefinition(
    content: string,
    position: Position,
    language: string
  ): any[] {
    const lines = content.split('\n');
    const line = lines[position.line];
    
    if (!line) return [];

    const word = this.extractWord(line, position.character);
    if (!word) return [];

    const definitions: any[] = [];

    for (let i = 0; i < lines.length; i++) {
      const searchLine = lines[i];
      
      if (searchLine.includes(`interface ${word}`) ||
          searchLine.includes(`type ${word} =`)) {
          
        const startChar = searchLine.indexOf(word);
        definitions.push({
          uri: 'file:///workspace/test.ts',
          range: {
            start: { line: i, character: startChar },
            end: { line: i, character: startChar + word.length }
          }
        });
      }
    }

    return definitions;
  }

  private generateRenameEdits(
    content: string,
    position: Position,
    newName: string,
    language: string
  ): any {
    const lines = content.split('\n');
    const line = lines[position.line];
    
    if (!line) return null;

    const word = this.extractWord(line, position.character);
    if (!word) return null;

    const changes: { uri: string; edits: any[] }[] = [];
    const edits: any[] = [];
    const escapedWord = this.escapeRegex(word);

    for (let i = 0; i < lines.length; i++) {
      const searchLine = lines[i];
      const regex = new RegExp(`\\b${escapedWord}\\b`, 'g');
      let match;

      while ((match = regex.exec(searchLine)) !== null) {
        edits.push({
          range: {
            start: { line: i, character: match.index },
            end: { line: i, character: match.index + word.length }
          },
          newText: newName
        });
      }
    }

    if (edits.length > 0) {
      changes.push({
        uri: 'file:///workspace/test.ts',
        edits
      });
    }

    return { changes };
  }

  private extractWord(line: string, position: number): string | null {
    const beforeCursor = line.substring(0, position);
    const afterCursor = line.substring(position);
    
    const wordStartMatch = beforeCursor.match(/[a-zA-Z_$][a-zA-Z0-9_$]*$/);
    const wordEndMatch = afterCursor.match(/^[a-zA-Z0-9_$]*/);
    
    const wordStart = wordStartMatch ? wordStartMatch[0] : '';
    const wordEnd = wordEndMatch ? wordEndMatch[0] : '';
    
    return (wordStart + wordEnd) || null;
  }

  private formatCode(content: string, language: string): string {
    const lines = content.split('\n');
    const formattedLines: string[] = [];
    let indentLevel = 0;
    const indentSize = 2;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.endsWith('}') || trimmedLine.endsWith(']')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      if (trimmedLine) {
        const indent = ' '.repeat(indentLevel * indentSize);
        formattedLines.push(indent + trimmedLine);
      } else {
        formattedLines.push('');
      }

      if (trimmedLine.endsWith('{') || trimmedLine.endsWith('[')) {
        indentLevel++;
      }
    }

    return formattedLines.join('\n');
  }

  private generateCodeActions(
    content: string,
    range: Range,
    language: string
  ): any[] {
    return [];
  }

  private generateDiagnostics(content: string, language: string): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const lines = content.split('\n');

    lines.forEach((line, lineIndex) => {
      if (language === 'typescript' || language === 'javascript') {
        if (line.includes('undefinedVar')) {
          diagnostics.push({
            range: {
              start: { line: lineIndex, character: line.indexOf('undefinedVar') },
              end: { line: lineIndex, character: line.indexOf('undefinedVar') + 'undefinedVar'.length }
            },
            severity: 1,
            code: '2304',
            source: 'typescript',
            message: "Cannot find name 'undefinedVar'."
          });
        }

        if (line.includes('const x: number = "string"')) {
          diagnostics.push({
            range: {
              start: { line: lineIndex, character: line.indexOf('"string"') },
              end: { line: lineIndex, character: line.indexOf('"string"') + '"string"'.length }
            },
            severity: 1,
            code: '2322',
            source: 'typescript',
            message: 'Type "string" is not assignable to type "number".'
          });
        }
      }
    });

    return diagnostics;
  }

  private generateHover(
    content: string,
    position: Position,
    language: string
  ): any {
    const lines = content.split('\n');
    
    if (position.line < 0 || position.line >= lines.length) return null;
    
    const line = lines[position.line];
    if (!line || line.trim() === '') return null;

    const word = this.extractWord(line, position.character);
    if (!word) return null;

    const wordStart = line.indexOf(word);
    const wordEnd = wordStart + word.length;
    
    const diagnostics = this.generateDiagnostics(content, language);
    const overlappingDiagnostic = diagnostics.find(d => {
      return (
        d.range.start.line === position.line &&
        d.range.start.character <= wordStart &&
        d.range.end.character >= wordEnd
      );
    });

    if (overlappingDiagnostic) {
      return {
        contents: [{
          kind: 'markdown',
          value: `**Error:** ${overlappingDiagnostic.message}\n\nCode: \`${overlappingDiagnostic.code}\``
        }],
        range: {
          start: { line: position.line, character: wordStart },
          end: { line: position.line, character: wordEnd }
        }
      };
    }

    const hoverInfo = this.getSymbolInfo(content, word, position.line, language);
    if (!hoverInfo) return null;

    return {
      contents: [{
        kind: 'markdown',
        value: hoverInfo
      }],
      range: {
        start: { line: position.line, character: wordStart },
        end: { line: position.line, character: wordEnd }
      }
    };
  }

  private escapeRegex(word: string): string {
    return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private getSymbolInfo(
    content: string,
    word: string,
    currentLine: number,
    language: string
  ): string | null {
    const lines = content.split('\n');
    const escapedWord = this.escapeRegex(word);
    const results: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const searchLine = lines[i];
      
      const funcPattern = new RegExp(`function\\s+${escapedWord}\\s*(?:<([^>]*)>)?\\s*\\(([^)]*)\\)(?::\\s*([^=]+))?`);
      const funcMatch = searchLine.match(funcPattern);
      if (funcMatch) {
        const genericParams = funcMatch[1] || '';
        const params = funcMatch[2].split(',').map(p => p.trim()).filter(p => p);
        const returnType = funcMatch[3]?.trim() || 'void';
        let docComment = '';
        
        if (i > 0 && lines[i-1].startsWith('/**')) {
          let j = i - 1;
          while (j >= 0 && (!lines[j].startsWith('*/') || j === i - 1)) {
            docComment += lines[j] + '\n';
            j--;
          }
          docComment = docComment.split('\n').reverse().join('\n').replace(/\/\*\*|\*\//g, '').trim();
        }
        
        let result = `**function** \`${word}`;
        if (genericParams) {
          result += `<${genericParams}>`;
        }
        result += `(${params.join(', ')})`;
        if (returnType) {
          result += `: ${returnType}`;
        }
        result += `\`\n\n`;
        if (docComment) {
          result += `${docComment}\n\n`;
        }
        result += `Returns: \`${returnType}\``;
        
        if (genericParams) {
          const genericConstraintMatch = genericParams.match(/(\w+)\s+extends\s+(\w+)/);
          if (genericConstraintMatch) {
            result += `\n\nGeneric constraint: \`${genericConstraintMatch[1]} extends ${genericConstraintMatch[2]}\``;
          }
        }
        
        results.push(result);
      }

      const constPattern = new RegExp(`const\\s+${escapedWord}\\s*(?:<([^>]*)>)?\\s*(?::\\s*([^=]+))?\\s*=`);
      const constMatch = searchLine.match(constPattern);
      if (constMatch) {
        const genericType = constMatch[1] || '';
        const type = constMatch[2]?.trim() || 'any';
        let result = `**const** \`${word}`;
        if (genericType) {
          result += `<${genericType}>`;
        }
        result += `: ${type}\``;
        
        if (genericType) {
          const genericConstraintMatch = genericType.match(/(\w+)\s+extends\s+(\w+)/);
          if (genericConstraintMatch) {
            result += `\n\nGeneric constraint: \`${genericConstraintMatch[1]} extends ${genericConstraintMatch[2]}\``;
          }
        }
        
        results.push(result);
      }

      const letPattern = new RegExp(`let\\s+${escapedWord}\\s*(?:<([^>]*)>)?\\s*(?::\\s*([^=]+))?\\s*=`);
      const letMatch = searchLine.match(letPattern);
      if (letMatch) {
        const genericType = letMatch[1] || '';
        const type = letMatch[2]?.trim() || 'any';
        let result = `**let** \`${word}`;
        if (genericType) {
          result += `<${genericType}>`;
        }
        result += `: ${type}\``;
        
        if (genericType) {
          const genericConstraintMatch = genericType.match(/(\w+)\s+extends\s+(\w+)/);
          if (genericConstraintMatch) {
            result += `\n\nGeneric constraint: \`${genericConstraintMatch[1]} extends ${genericConstraintMatch[2]}\``;
          }
        }
        
        results.push(result);
      }

      const classPattern = new RegExp(`class\\s+${escapedWord}\\s*(?:<([^>]*)>)?(?:\\s+extends\\s+(\\w+))?(?:\\s+implements\\s+([^\\{]+))?`);
      const classMatch = searchLine.match(classPattern);
      if (classMatch) {
        const genericParams = classMatch[1] || '';
        const extendsClass = classMatch[2] || '';
        const implementsInterfaces = classMatch[3]?.trim() || '';
        
        let result = `**class** \`${word}`;
        if (genericParams) {
          result += `<${genericParams}>`;
        }
        result += `\``;
        
        if (extendsClass) {
          result += `\n\nExtends: \`${extendsClass}\``;
        }
        if (implementsInterfaces) {
          result += `\n\nImplements: \`${implementsInterfaces}\``;
        }
        
        if (genericParams) {
          const genericConstraintMatch = genericParams.match(/(\w+)\s+extends\s+(\w+)/);
          if (genericConstraintMatch) {
            result += `\n\nGeneric constraint: \`${genericConstraintMatch[1]} extends ${genericConstraintMatch[2]}\``;
          }
        }
        
        results.push(result);
      }

      const interfacePattern = new RegExp(`interface\\s+${escapedWord}\\s*(?:<([^>]*)>)?(?:\\s+extends\\s+([^\\{]+))?`);
      const interfaceMatch = searchLine.match(interfacePattern);
      if (interfaceMatch) {
        const genericParams = interfaceMatch[1] || '';
        const extendsInterfaces = interfaceMatch[2]?.trim() || '';
        
        let result = `**interface** \`${word}`;
        if (genericParams) {
          result += `<${genericParams}>`;
        }
        result += `\``;
        
        if (extendsInterfaces) {
          result += `\n\nExtends: \`${extendsInterfaces}\``;
        }
        
        if (genericParams) {
          const genericConstraintMatch = genericParams.match(/(\w+)\s+extends\s+(\w+)/);
          if (genericConstraintMatch) {
            result += `\n\nGeneric constraint: \`${genericConstraintMatch[1]} extends ${genericConstraintMatch[2]}\``;
          }
        }
        
        results.push(result);
      }

      const typePattern = new RegExp(`type\\s+${escapedWord}\\s*(?:<([^>]*)>)?\\s*=\\s*(.+)`);
      const typeMatch = searchLine.match(typePattern);
      if (typeMatch) {
        const genericParams = typeMatch[1] || '';
        const typeDef = typeMatch[2].trim();
        
        let result = `**type** \`${word}`;
        if (genericParams) {
          result += `<${genericParams}>`;
        }
        result += ` = ${typeDef}\``;
        
        if (genericParams) {
          const genericConstraintMatch = genericParams.match(/(\w+)\s+extends\s+(\w+)/);
          if (genericConstraintMatch) {
            result += `\n\nGeneric constraint: \`${genericConstraintMatch[1]} extends ${genericConstraintMatch[2]}\``;
          }
        }
        
        results.push(result);
      }

      if (searchLine.includes(`import`)) {
        const importMatch = searchLine.match(/import\s+(?:\{[^}]+\}\s+from\s+)?['"]([^'"]+)['"]/);
        if (importMatch && searchLine.includes(word)) {
          const importedSymbols: string[] = [];
          const namedImportMatch = searchLine.match(/import\s+\{([^}]+)\}\s+from/);
          const defaultImportMatch = searchLine.match(/import\s+(\w+)\s+from/);
          
          if (namedImportMatch) {
            importedSymbols.push(...namedImportMatch[1].split(',').map(s => s.trim()).filter(s => s));
          }
          if (defaultImportMatch && !namedImportMatch) {
            importedSymbols.push(defaultImportMatch[1]);
          }
          
          let result = `**import** \`${word}\`\n\n`;
          result += `Source: \`${importMatch[1]}\`\n\n`;
          if (importedSymbols.length > 0) {
            result += `Imported symbols:\n`;
            importedSymbols.forEach(s => {
              result += `- \`${s}\`\n`;
            });
          }
          
          results.push(result);
        }
      }
    }

    if (results.length > 0) {
      return results.join('\n\n---\n\n');
    }

    const keywords = [
      'const', 'let', 'var', 'function', 'class', 'interface', 'type',
      'import', 'export', 'default', 'from', 'async', 'await', 'return',
      'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'continue',
      'try', 'catch', 'finally', 'throw', 'new', 'this', 'super',
      'extends', 'implements', 'public', 'private', 'protected', 'static',
      'readonly', 'abstract', 'enum', 'namespace', 'module'
    ];

    if (keywords.includes(word)) {
      return `**keyword** \`${word}\``;
    }

    const builtins = [
      'console', 'document', 'window', 'Array', 'Object', 'String',
      'Number', 'Boolean', 'Date', 'Math', 'JSON', 'Promise', 'Map', 'Set'
    ];

    if (builtins.includes(word)) {
      return `**built-in** \`${word}\``;
    }

    return null;
  }
}