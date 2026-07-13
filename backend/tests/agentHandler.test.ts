import { assert, assertEquals, assertObjectMatch } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { join, resolve } from 'https://deno.land/std@0.224.0/path/mod.ts';

const __dirname = import.meta.dirname ? import.meta.dirname.replace('file://', '') : Deno.cwd();
const TEST_WORKSPACE = resolve(__dirname, '..', '..', 'tests', 'fixtures', 'test-workspace');

Deno.env.set('WORKSPACE_PATH', TEST_WORKSPACE);

import { handleAgentReadFile, handleAgentListFiles, handleAgentSearchCode, handleAgentWriteFile } from '../src/handlers/agentHandler.ts';

function createMockRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost:3333/api/v1/agent/test', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.test('[9.1] agentHandler unit tests', async (t) => {
  await t.step('[P0] UT-9.1.1 should read file successfully', async () => {
    const req = createMockRequest({ filePath: 'test-file.ts' });
    const response = await handleAgentReadFile(req);
    const result = await response.json();

    assertEquals(response.status, 200);
    assertEquals(result.status, 'success');
    assert(result.data);
    assert(typeof result.data.content === 'string');
    assert(result.data.content.includes('export function greet'));
  });

  await t.step('[P1] UT-9.1.2 should return error for non-existent file', async () => {
    const req = createMockRequest({ filePath: 'non-existent-file-xyz-123.ts' });
    const response = await handleAgentReadFile(req);
    const result = await response.json();

    assertEquals(response.status, 404);
    assertEquals(result.status, 'error');
    assert(result.error);
    assert(result.error.message.includes('不存在'));
  });

  await t.step('[P0] UT-9.1.3 should block path traversal attack', async () => {
    const req = createMockRequest({ filePath: '../etc/passwd' });
    const response = await handleAgentReadFile(req);
    const result = await response.json();

    assertEquals(response.status, 400);
    assertEquals(result.status, 'error');
    assert(result.error.message.includes('无效') || result.error.message.includes('超出'));
  });

  await t.step('[P0] UT-9.1.4 should list directory contents', async () => {
    const req = createMockRequest({ directoryPath: '.' });
    const response = await handleAgentListFiles(req);
    const result = await response.json();

    assertEquals(response.status, 200);
    assertEquals(result.status, 'success');
    assert(Array.isArray(result.data));
    assert(result.data.length > 0);

    const names = result.data.map((item: any) => item.name);
    assert(names.includes('test-file.ts'));
    assert(names.includes('search-target.ts'));
    assert(names.includes('nested'));
  });

  await t.step('[P1] UT-9.1.5 should return error for non-existent directory', async () => {
    const req = createMockRequest({ directoryPath: 'non-existent-dir-xyz' });
    const response = await handleAgentListFiles(req);
    const result = await response.json();

    assertEquals(response.status, 404);
    assertEquals(result.status, 'error');
  });

  await t.step('[P0] UT-9.1.6 should search code successfully', async () => {
    const req = createMockRequest({ pattern: 'search', directory: '.' });
    const response = await handleAgentSearchCode(req);
    const result = await response.json();

    assertEquals(response.status, 200);
    assertEquals(result.status, 'success');
    assert(Array.isArray(result.data));
    assert(result.data.length > 0);

    const filePaths = result.data.map((item: any) => item.filePath);
    assert(filePaths.some((path: string) => path.includes('search-target.ts')));
  });

  await t.step('[P1] UT-9.1.7 should return empty results for non-matching pattern', async () => {
    const req = createMockRequest({ pattern: 'xyz-nonexistent-pattern-123', directory: '.' });
    const response = await handleAgentSearchCode(req);
    const result = await response.json();

    assertEquals(response.status, 200);
    assertEquals(result.status, 'success');
    assertEquals(result.data, []);
  });

  await t.step('[P1] UT-9.1.8 should return error for empty pattern', async () => {
    const req = createMockRequest({ pattern: '', directory: '.' });
    const response = await handleAgentSearchCode(req);
    const result = await response.json();

    assertEquals(response.status, 400);
    assertEquals(result.status, 'error');
    assert(result.error.message.includes('不能为空'));
  });

  await t.step('[P1] UT-9.1.9 should return error for invalid JSON', async () => {
    const req = new Request('http://localhost:3333/api/v1/agent/read-file', {
      method: 'POST',
      body: 'not valid json',
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await handleAgentReadFile(req);
    const result = await response.json();

    assertEquals(response.status, 400);
    assertEquals(result.status, 'error');
  });

  await t.step('[P1] UT-9.1.10 should search across nested directories', async () => {
    const req = createMockRequest({ pattern: 'nested', directory: '.' });
    const response = await handleAgentSearchCode(req);
    const result = await response.json();

    assertEquals(response.status, 200);
    assertEquals(result.status, 'success');
    assert(Array.isArray(result.data));
    assert(result.data.length > 0);

    const filePaths = result.data.map((item: any) => item.filePath);
    assert(filePaths.some((path: string) => path.includes('nested/nested-file.ts')));
  });

  await t.step('[P0] UT-9.2.1 should write file successfully', async () => {
    const outputFile = 'test-output-921.ts';
    const content = 'export const testValue = "written by agent";';
    
    const req = createMockRequest({ filePath: outputFile, content });
    const response = await handleAgentWriteFile(req);
    const result = await response.json();

    assertEquals(response.status, 200);
    assertEquals(result.status, 'success');
    assert(result.data);
    assert(result.data.filePath.includes(outputFile));

    const writtenContent = await Deno.readTextFile(join(TEST_WORKSPACE, outputFile));
    assertEquals(writtenContent, content);

    await Deno.remove(join(TEST_WORKSPACE, outputFile));
  });

  await t.step('[P0] UT-9.2.2 should block path traversal attack', async () => {
    const req = createMockRequest({ filePath: '../etc/passwd', content: 'malicious' });
    const response = await handleAgentWriteFile(req);
    const result = await response.json();

    assertEquals(response.status, 400);
    assertEquals(result.status, 'error');
    assert(result.error.message.includes('无效') || result.error.message.includes('超出'));
  });

  await t.step('[P1] UT-9.2.3 should return error for non-existent directory', async () => {
    const req = createMockRequest({ filePath: 'non-existent-dir/test.ts', content: 'test' });
    const response = await handleAgentWriteFile(req);
    const result = await response.json();

    assertEquals(response.status, 404);
    assertEquals(result.status, 'error');
  });

  await t.step('[P1] UT-9.2.4 should return error for empty file path', async () => {
    const req = createMockRequest({ filePath: '', content: 'test' });
    const response = await handleAgentWriteFile(req);
    const result = await response.json();

    assertEquals(response.status, 400);
    assertEquals(result.status, 'error');
    assert(result.error.message.includes('不能为空'));
  });

  await t.step('[P1] UT-9.2.5 should return error for missing content', async () => {
    const req = createMockRequest({ filePath: 'test.ts' });
    const response = await handleAgentWriteFile(req);
    const result = await response.json();

    assertEquals(response.status, 400);
    assertEquals(result.status, 'error');
  });

  await t.step('[P1] UT-9.2.6 should return error for invalid JSON', async () => {
    const req = new Request('http://localhost:3333/api/v1/agent/write-file', {
      method: 'POST',
      body: 'not valid json',
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await handleAgentWriteFile(req);
    const result = await response.json();

    assertEquals(response.status, 400);
    assertEquals(result.status, 'error');
  });

  await t.step('[P0] UT-9.2.7 should return error for file content exceeding size limit', async () => {
    const largeContent = 'a'.repeat(11 * 1024 * 1024);
    const req = createMockRequest({ filePath: 'large-file.ts', content: largeContent });
    const response = await handleAgentWriteFile(req);
    const result = await response.json();

    assertEquals(response.status, 400);
    assertEquals(result.status, 'error');
    assert(result.error.message.includes('大小限制'));
  });

  await t.step('[P1] UT-9.2.8 should return error for undefined content', async () => {
    const req = createMockRequest({ filePath: 'test.ts', content: undefined });
    const response = await handleAgentWriteFile(req);
    const result = await response.json();

    assertEquals(response.status, 400);
    assertEquals(result.status, 'error');
    assert(result.error.message.includes('不能为空'));
  });

  await t.step('[P1] UT-9.2.9 should return error for null content', async () => {
    const req = createMockRequest({ filePath: 'test.ts', content: null });
    const response = await handleAgentWriteFile(req);
    const result = await response.json();

    assertEquals(response.status, 400);
    assertEquals(result.status, 'error');
    assert(result.error.message.includes('不能为空'));
  });
});
