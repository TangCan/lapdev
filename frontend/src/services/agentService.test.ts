import { describe, it, expect, vi, beforeEach } from 'vitest';
import { agentService } from './agentService';

describe('agentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('[P0] should generate unique ID', () => {
    const id1 = agentService.generateId();
    const id2 = agentService.generateId();
    
    expect(id1).toBeDefined();
    expect(id2).toBeDefined();
    expect(id1).not.toBe(id2);
    expect(id1.length).toBeGreaterThan(10);
  });

  it('[P0] should create operation object with pending status', () => {
    const operation = agentService.createOperation('write', 'test.ts', 'content', 'original');
    
    expect(operation.id).toBeDefined();
    expect(operation.type).toBe('write');
    expect(operation.filePath).toBe('test.ts');
    expect(operation.content).toBe('content');
    expect(operation.originalContent).toBe('original');
    expect(operation.status).toBe('pending');
    expect(operation.timestamp).toBeDefined();
  });

  it('[P0] should create operation without content for read type', () => {
    const operation = agentService.createOperation('read', 'test.ts');
    
    expect(operation.type).toBe('read');
    expect(operation.filePath).toBe('test.ts');
    expect(operation.content).toBeUndefined();
    expect(operation.status).toBe('pending');
  });

  it('[P1] should validate empty file path in readFile', async () => {
    await expect(agentService.readFile('')).rejects.toThrow('文件路径不能为空');
    await expect(agentService.readFile('   ')).rejects.toThrow('文件路径不能为空');
  });

  it('[P1] should validate empty file path in listFiles', async () => {
    await expect(agentService.listFiles('')).rejects.toThrow('目录路径不能为空');
    await expect(agentService.listFiles('   ')).rejects.toThrow('目录路径不能为空');
  });

  it('[P1] should validate empty file path in writeFile', async () => {
    await expect(agentService.writeFile('', 'content')).rejects.toThrow('文件路径不能为空');
    await expect(agentService.writeFile('   ', 'content')).rejects.toThrow('文件路径不能为空');
  });

  it('[P1] should validate null content in writeFile', async () => {
    // @ts-expect-error Testing null content
    await expect(agentService.writeFile('test.ts', null)).rejects.toThrow('文件内容不能为空');
    // @ts-expect-error Testing undefined content
    await expect(agentService.writeFile('test.ts', undefined)).rejects.toThrow('文件内容不能为空');
  });

  it('[P2] should validate empty content in executeOperation for write type', async () => {
    const result = await agentService.executeOperation({
      type: 'write',
      filePath: 'test.ts',
      content: '',
    });
    
    expect(result).toBe(false);
  });

  it('[P2] should validate empty trimmed content in executeOperation for write type', async () => {
    const result = await agentService.executeOperation({
      type: 'write',
      filePath: 'test.ts',
      content: '   ',
    });
    
    expect(result).toBe(false);
  });

  it('[P2] should handle unsupported operation type in executeOperation', async () => {
    // @ts-expect-error Testing unsupported type
    const result = await agentService.executeOperation({
      type: 'unknown',
      filePath: 'test.ts',
    });
    
    expect(result).toBe(false);
  });

  it('[P2] should create different types of operations', () => {
    const writeOp = agentService.createOperation('write', 'write.ts', 'c', 'o');
    const readOp = agentService.createOperation('read', 'read.ts');
    const createOp = agentService.createOperation('create', 'create.ts', 'c');
    const deleteOp = agentService.createOperation('delete', 'delete.ts', undefined, 'o');
    const searchOp = agentService.createOperation('search', 'search.ts');
    
    expect(writeOp.type).toBe('write');
    expect(readOp.type).toBe('read');
    expect(createOp.type).toBe('create');
    expect(deleteOp.type).toBe('delete');
    expect(searchOp.type).toBe('search');
  });
});
