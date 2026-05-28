import { describe, it } from "https://deno.land/std@0.214.0/testing/bdd.ts";
import { assertEquals, assertArrayIncludes } from "https://deno.land/std@0.214.0/testing/asserts.ts";

// LSP Utility Functions

interface Position {
  line: number;
  character: number;
}

interface Range {
  start: Position;
  end: Position;
}

interface Diagnostic {
  range: Range;
  severity: number;
  code: string | number | undefined;
  source: string;
  message: string;
}

interface CompletionItem {
  label: string;
  kind: number;
  detail?: string;
  documentation?: string;
  insertText?: string;
}

function parseLspPosition(position: { line: number; column: number }): Position {
  return {
    line: position.line,
    character: position.column,
  };
}

function parseLspRange(start: { line: number; column: number }, end: { line: number; column: number }): Range {
  return {
    start: parseLspPosition(start),
    end: parseLspPosition(end),
  };
}

function formatDiagnostics(diagnostics: Diagnostic[]): Array<{
  line: number;
  column: number;
  severity: string;
  message: string;
}> {
  return diagnostics.map((d) => ({
    line: d.range.start.line + 1,
    column: d.range.start.character + 1,
    severity: d.severity === 1 ? 'error' : d.severity === 2 ? 'warning' : 'info',
    message: d.message,
  }));
}

function filterCompletionsByPrefix(items: CompletionItem[], prefix: string): CompletionItem[] {
  if (!prefix) return items;
  
  const lowerPrefix = prefix.toLowerCase();
  return items.filter((item) =>
    item.label.toLowerCase().startsWith(lowerPrefix)
  );
}

function groupDiagnosticsBySeverity(diagnostics: Diagnostic[]): {
  errors: Diagnostic[];
  warnings: Diagnostic[];
  infos: Diagnostic[];
} {
  return diagnostics.reduce(
    (acc: { errors: Diagnostic[]; warnings: Diagnostic[]; infos: Diagnostic[] }, d) => {
      if (d.severity === 1) acc.errors.push(d);
      else if (d.severity === 2) acc.warnings.push(d);
      else acc.infos.push(d);
      return acc;
    },
    { errors: [], warnings: [], infos: [] }
  );
}

function validateLspRequest(request: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!request || typeof request !== 'object') {
    return { valid: false, errors: ['Request must be an object'] };
  }
  
  if (!request.path || typeof request.path !== 'string') {
    errors.push('Path is required and must be a string');
  }
  
  if (!request.content || typeof request.content !== 'string') {
    errors.push('Content is required and must be a string');
  }
  
  if (request.position) {
    if (typeof request.position !== 'object' || 
        !('line' in request.position) || 
        !('column' in request.position)) {
      errors.push('Position must be an object with line and column');
    }
  }
  
  return { valid: errors.length === 0, errors };
}

describe('LSP Utils - Position Parsing', () => {
  it('should parse position correctly', () => {
    const result = parseLspPosition({ line: 0, column: 10 });
    
    assertEquals(result.line, 0);
    assertEquals(result.character, 10);
  });

  it('should parse range correctly', () => {
    const result = parseLspRange(
      { line: 0, column: 0 },
      { line: 1, column: 10 }
    );
    
    assertEquals(result.start.line, 0);
    assertEquals(result.start.character, 0);
    assertEquals(result.end.line, 1);
    assertEquals(result.end.character, 10);
  });
});

describe('LSP Utils - Diagnostic Formatting', () => {
  it('should format diagnostics with line numbers', () => {
    const diagnostics: Diagnostic[] = [
      {
        range: {
          start: { line: 0, character: 10 },
          end: { line: 0, character: 15 },
        },
        severity: 1,
        code: undefined,
        source: 'typescript',
        message: 'Type mismatch',
      },
    ];
    
    const result = formatDiagnostics(diagnostics);
    
    assertEquals(result.length, 1);
    assertEquals(result[0].line, 1);
    assertEquals(result[0].column, 11);
    assertEquals(result[0].severity, 'error');
    assertEquals(result[0].message, 'Type mismatch');
  });

  it('should handle different severity levels', () => {
    const diagnostics: Diagnostic[] = [
      {
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } },
        severity: 1,
        code: undefined,
        source: 'typescript',
        message: 'Error',
      },
      {
        range: { start: { line: 1, character: 0 }, end: { line: 1, character: 5 } },
        severity: 2,
        code: undefined,
        source: 'typescript',
        message: 'Warning',
      },
      {
        range: { start: { line: 2, character: 0 }, end: { line: 2, character: 5 } },
        severity: 3,
        code: undefined,
        source: 'typescript',
        message: 'Info',
      },
    ];
    
    const result = formatDiagnostics(diagnostics);
    
    assertEquals(result[0].severity, 'error');
    assertEquals(result[1].severity, 'warning');
    assertEquals(result[2].severity, 'info');
  });
});

describe('LSP Utils - Completion Filtering', () => {
  it('should filter completions by prefix', () => {
    const items: CompletionItem[] = [
      { label: 'console', kind: 1 },
      { label: 'const', kind: 1 },
      { label: 'class', kind: 1 },
      { label: 'function', kind: 1 },
    ];
    
    const result = filterCompletionsByPrefix(items, 'con');
    
    assertEquals(result.length, 2);
    assertArrayIncludes(result.map((i) => i.label), ['console', 'const']);
  });

  it('should return all items for empty prefix', () => {
    const items: CompletionItem[] = [
      { label: 'console', kind: 1 },
      { label: 'const', kind: 1 },
    ];
    
    const result = filterCompletionsByPrefix(items, '');
    
    assertEquals(result.length, 2);
  });

  it('should be case insensitive', () => {
    const items: CompletionItem[] = [
      { label: 'Console', kind: 1 },
      { label: 'CONST', kind: 1 },
      { label: 'function', kind: 1 },
    ];
    
    const result = filterCompletionsByPrefix(items, 'con');
    
    assertEquals(result.length, 2);
  });
});

describe('LSP Utils - Diagnostic Grouping', () => {
  it('should group diagnostics by severity', () => {
    const diagnostics: Diagnostic[] = [
      { range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } }, severity: 1, code: undefined, source: 'ts', message: 'Error 1' },
      { range: { start: { line: 1, character: 0 }, end: { line: 1, character: 5 } }, severity: 2, code: undefined, source: 'ts', message: 'Warning 1' },
      { range: { start: { line: 2, character: 0 }, end: { line: 2, character: 5 } }, severity: 1, code: undefined, source: 'ts', message: 'Error 2' },
      { range: { start: { line: 3, character: 0 }, end: { line: 3, character: 5 } }, severity: 3, code: undefined, source: 'ts', message: 'Info 1' },
    ];
    
    const result = groupDiagnosticsBySeverity(diagnostics);
    
    assertEquals(result.errors.length, 2);
    assertEquals(result.warnings.length, 1);
    assertEquals(result.infos.length, 1);
  });
});

describe('LSP Utils - Request Validation', () => {
  it('should validate valid request', () => {
    const request = {
      path: '/workspace/test.ts',
      content: 'const x = 1;',
      position: { line: 0, column: 10 },
    };
    
    const result = validateLspRequest(request);
    
    assertEquals(result.valid, true);
    assertEquals(result.errors.length, 0);
  });

  it('should reject request without path', () => {
    const request = {
      content: 'const x = 1;',
    };
    
    const result = validateLspRequest(request);
    
    assertEquals(result.valid, false);
    assertArrayIncludes(result.errors, ['Path is required and must be a string']);
  });

  it('should reject request without content', () => {
    const request = {
      path: '/workspace/test.ts',
    };
    
    const result = validateLspRequest(request);
    
    assertEquals(result.valid, false);
    assertArrayIncludes(result.errors, ['Content is required and must be a string']);
  });

  it('should reject invalid position', () => {
    const request = {
      path: '/workspace/test.ts',
      content: 'const x = 1;',
      position: { line: 0 },
    };
    
    const result = validateLspRequest(request);
    
    assertEquals(result.valid, false);
    assertArrayIncludes(result.errors, ['Position must be an object with line and column']);
  });

  it('should reject non-object request', () => {
    // @ts-ignore - testing invalid input
    const result = validateLspRequest('invalid');
    
    assertEquals(result.valid, false);
    assertArrayIncludes(result.errors, ['Request must be an object']);
  });
});

describe('LSP Utils - Error Handling', () => {
  it('should handle empty diagnostics', () => {
    const result = formatDiagnostics([]);
    assertEquals(result.length, 0);
  });

  it('should handle empty completions', () => {
    const result = filterCompletionsByPrefix([], 'test');
    assertEquals(result.length, 0);
  });

  it('should handle empty grouping', () => {
    const result = groupDiagnosticsBySeverity([]);
    assertEquals(result.errors.length, 0);
    assertEquals(result.warnings.length, 0);
    assertEquals(result.infos.length, 0);
  });
});