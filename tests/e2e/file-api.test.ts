import { test, expect } from '@playwright/test';

test.describe('文件系统 API', () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';

  // GET /api/v1/files/tree - 获取文件树
  test.skip('GET /api/v1/files/tree should return directory structure', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/v1/files/tree`, {
      params: { path: '/workspace', depth: 2 }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data).toHaveProperty('status', 'success');
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('name');
    expect(data.data).toHaveProperty('path');
    expect(data.data).toHaveProperty('type', 'directory');
    expect(data.data).toHaveProperty('children');
    expect(Array.isArray(data.data.children)).toBe(true);
  });

  // GET /api/v1/files/tree - 带深度参数
  test.skip('GET /api/v1/files/tree with depth parameter', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/v1/files/tree`, {
      params: { path: '/workspace', depth: 1 }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // 验证只有一级深度
    expect(data.data.children).toBeDefined();
    for (const child of data.data.children) {
      if (child.type === 'directory') {
        expect(child.children).toBeUndefined();
      }
    }
  });

  // GET /api/v1/files/read - 读取文件内容
  test.skip('GET /api/v1/files/read should return file content', async ({ request }) => {
    // 先创建测试文件
    await request.post(`${baseURL}/api/v1/files/create`, {
      data: {
        path: '/workspace/test-read-file.txt',
        type: 'file',
        content: 'Hello, World!'
      }
    });
    
    const response = await request.get(`${baseURL}/api/v1/files/read`, {
      params: { path: '/workspace/test-read-file.txt' }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data).toHaveProperty('status', 'success');
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('content', 'Hello, World!');
    expect(data.data).toHaveProperty('path', '/workspace/test-read-file.txt');
  });

  // POST /api/v1/files/create - 创建文件
  test.skip('POST /api/v1/files/create should create new file', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/v1/files/create`, {
      data: {
        path: '/workspace/new-test-file.txt',
        type: 'file',
        content: 'Test content'
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data).toHaveProperty('status', 'success');
    expect(data).toHaveProperty('message', 'File created successfully');
    
    // 验证文件确实创建
    const readResponse = await request.get(`${baseURL}/api/v1/files/read`, {
      params: { path: '/workspace/new-test-file.txt' }
    });
    expect(readResponse.ok()).toBeTruthy();
  });

  // POST /api/v1/files/create - 创建目录
  test.skip('POST /api/v1/files/create should create new directory', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/v1/files/create`, {
      data: {
        path: '/workspace/new-directory',
        type: 'directory'
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data).toHaveProperty('status', 'success');
    expect(data).toHaveProperty('message', 'Directory created successfully');
    
    // 验证目录确实创建
    const treeResponse = await request.get(`${baseURL}/api/v1/files/tree`, {
      params: { path: '/workspace', depth: 1 }
    });
    const treeData = await treeResponse.json();
    const newDir = treeData.data.children.find((item: any) => item.name === 'new-directory');
    expect(newDir).toBeDefined();
    expect(newDir.type).toBe('directory');
  });

  // POST /api/v1/files/rename - 重命名文件
  test.skip('POST /api/v1/files/rename should rename file', async ({ request }) => {
    // 先创建测试文件
    await request.post(`${baseURL}/api/v1/files/create`, {
      data: {
        path: '/workspace/rename-source.txt',
        type: 'file',
        content: 'content'
      }
    });
    
    const response = await request.post(`${baseURL}/api/v1/files/rename`, {
      data: {
        oldPath: '/workspace/rename-source.txt',
        newPath: '/workspace/rename-target.txt'
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data).toHaveProperty('status', 'success');
    expect(data).toHaveProperty('message', 'File renamed successfully');
    
    // 验证新路径存在，旧路径不存在
    const targetExists = await request.get(`${baseURL}/api/v1/files/read`, {
      params: { path: '/workspace/rename-target.txt' }
    });
    expect(targetExists.ok()).toBeTruthy();
    
    const sourceExists = await request.get(`${baseURL}/api/v1/files/read`, {
      params: { path: '/workspace/rename-source.txt' }
    });
    expect(sourceExists.ok()).toBeFalsy();
  });

  // DELETE /api/v1/files/delete - 删除文件
  test.skip('DELETE /api/v1/files/delete should delete file', async ({ request }) => {
    // 先创建测试文件
    await request.post(`${baseURL}/api/v1/files/create`, {
      data: {
        path: '/workspace/to-delete.txt',
        type: 'file',
        content: 'to be deleted'
      }
    });
    
    const response = await request.delete(`${baseURL}/api/v1/files/delete`, {
      data: { path: '/workspace/to-delete.txt' }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data).toHaveProperty('status', 'success');
    expect(data).toHaveProperty('message', 'File deleted successfully');
    
    // 验证文件已删除
    const readResponse = await request.get(`${baseURL}/api/v1/files/read`, {
      params: { path: '/workspace/to-delete.txt' }
    });
    expect(readResponse.ok()).toBeFalsy();
  });

  // 错误处理 - 文件不存在
  test.skip('GET /api/v1/files/read should return error for non-existent file', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/v1/files/read`, {
      params: { path: '/workspace/non-existent.txt' }
    });
    
    expect(response.ok()).toBeFalsy();
    const data = await response.json();
    
    expect(data).toHaveProperty('status', 'error');
    expect(data).toHaveProperty('message');
  });

  // 安全测试 - 路径遍历攻击防护
  test.skip('should prevent path traversal attacks', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/v1/files/read`, {
      params: { path: '../../etc/passwd' }
    });
    
    expect(response.ok()).toBeFalsy();
    const data = await response.json();
    
    expect(data).toHaveProperty('status', 'error');
    expect(data.message).toContain('invalid');
  });
});