import { describe, it, beforeEach, afterEach } from 'https://deno.land/std@0.200.0/testing/bdd.ts';
import { assert, assertEquals } from 'https://deno.land/std@0.200.0/testing/asserts.ts';
import { handleLspHover } from './lspHandler.ts';

describe('handleLspHover', () => {
  it('[P0] TC-8.1.18 should handle hover request correctly', async () => {
    const request = new Request('http://localhost:3333/api/v1/lsp/hover', {
      method: 'POST',
      body: JSON.stringify({
        path: '/workspace/test.ts',
        content: 'const testVar: string = "hello";',
        position: { line: 0, character: 6 }
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await handleLspHover(request);
    
    assertEquals(response.status, 200);
    
    const result = await response.json();
    assert(result.status === 'success');
    assert(result.hover !== null);
  });

  it('[P0] TC-8.1.19 should return hover information for function', async () => {
    const request = new Request('http://localhost:3333/api/v1/lsp/hover', {
      method: 'POST',
      body: JSON.stringify({
        path: '/workspace/test.ts',
        content: 'function greet(name: string): void {\n  return `Hello, ${name}`;\n}',
        position: { line: 0, character: 10 }
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await handleLspHover(request);
    const result = await response.json();
    
    assert(result.status === 'success');
    assert(result.hover !== null);
    assert(result.hover.contents !== undefined);
  });

  it('[P0] TC-8.1.20 should return hover information for class', async () => {
    const request = new Request('http://localhost:3333/api/v1/lsp/hover', {
      method: 'POST',
      body: JSON.stringify({
        path: '/workspace/test.ts',
        content: 'class MyClass {\n  name: string;\n  constructor(name: string) {\n    this.name = name;\n  }\n}',
        position: { line: 0, character: 6 }
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await handleLspHover(request);
    const result = await response.json();
    
    assert(result.status === 'success');
    assert(result.hover !== null);
  });

  it('[P1] TC-8.1.21 should handle LSP server errors', async () => {
    const request = new Request('http://localhost:3333/api/v1/lsp/hover', {
      method: 'POST',
      body: JSON.stringify({
        path: '/nonexistent/file.ts',
        content: 'const x = 1;',
        position: { line: 0, character: 6 }
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await handleLspHover(request);
    
    assertEquals(response.status, 200);
    const result = await response.json();
    assert(result.status === 'success');
  });

  it('[P1] TC-8.1.22 should validate request body', async () => {
    const request = new Request('http://localhost:3333/api/v1/lsp/hover', {
      method: 'POST',
      body: JSON.stringify({
        path: '/workspace/test.ts'
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await handleLspHover(request);
    
    assertEquals(response.status, 400);
  });

  it('[P1] TC-8.1.23 should handle missing position', async () => {
    const request = new Request('http://localhost:3333/api/v1/lsp/hover', {
      method: 'POST',
      body: JSON.stringify({
        path: '/workspace/test.ts',
        content: 'const x = 1;'
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await handleLspHover(request);
    
    assertEquals(response.status, 400);
  });
});
