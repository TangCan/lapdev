import { test, expect } from '@playwright/test';
import { BASE_URL, PORTS } from '../config/index.ts';

test.describe('文件系统 API', () => {
  const baseURL = BASE_URL;
  const ORIGIN = `http://localhost:${PORTS.BACKEND}`;
  const testPrefix = `/workspace/test-${Date.now()}`;

  // 在所有测试前设置
  test.beforeEach(async ({ request }) => {
    // 创建测试目录
    await request.post(`${baseURL}/api/v1/files/create`, {
      data: {
        path: `${testPrefix}`,
        type: 'directory'
      }
    });
  });

  // 在所有测试后清理
  test.afterEach(async ({ request }) => {
    // 删除测试目录
    await request.delete(`${baseURL}/api/v1/files/delete`, {
      data: { path: `${testPrefix}` }
    }).catch(() => {});
  });

  // GET /api/v1/files/tree - 获取文件树
  test('[P0] GET /api/v1/files/tree should return directory structure', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/v1/files/tree`, {
      params: { path: testPrefix, depth: 2 }
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
  test('[P1] GET /api/v1/files/tree with depth parameter', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/v1/files/tree`, {
      params: { path: testPrefix, depth: 1 }
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

  // GET /api/v1/files/tree - 递归深度限制
  test('[P0] GET /api/v1/files/tree should respect max depth limit', async ({ request }) => {
    // 创建深度嵌套目录
    let currentPath = testPrefix;
    for (let i = 0; i < 25; i++) {
      currentPath += `/level-${i}`;
      await request.post(`${baseURL}/api/v1/files/create`, {
        data: { path: currentPath, type: 'directory' }
      });
    }
    
    const response = await request.get(`${baseURL}/api/v1/files/tree`, {
      params: { path: testPrefix, depth: 30 }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // 验证深度不超过MAX_DEPTH (20)
    const checkDepth = (node: any, depth: number): number => {
      if (!node.children || node.children.length === 0) return depth;
      return Math.max(...node.children.map((child: any) => checkDepth(child, depth + 1)));
    };
    
    const actualDepth = checkDepth(data.data, 0);
    expect(actualDepth).toBeLessThanOrEqual(20);
  });

  // GET /api/v1/files/read - 读取文件内容
  test('[P0] GET /api/v1/files/read should return file content', async ({ request }) => {
    const filePath = `${testPrefix}/test-read-file.txt`;
    
    await request.post(`${baseURL}/api/v1/files/create`, {
      data: {
        path: filePath,
        type: 'file',
        content: 'Hello, World!'
      }
    });
    
    const response = await request.get(`${baseURL}/api/v1/files/read`, {
      params: { path: filePath }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data).toHaveProperty('status', 'success');
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('content', 'Hello, World!');
    expect(data.data).toHaveProperty('path', filePath);
  });

  // POST /api/v1/files/create - 创建文件
  test('[P0] POST /api/v1/files/create should create new file', async ({ request }) => {
    const filePath = `${testPrefix}/new-test-file.txt`;
    
    const response = await request.post(`${baseURL}/api/v1/files/create`, {
      data: {
        path: filePath,
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
      params: { path: filePath }
    });
    expect(readResponse.ok()).toBeTruthy();
  });

  // POST /api/v1/files/create - 创建目录
  test('[P0] POST /api/v1/files/create should create new directory', async ({ request }) => {
    const dirPath = `${testPrefix}/new-directory`;
    
    const response = await request.post(`${baseURL}/api/v1/files/create`, {
      data: {
        path: dirPath,
        type: 'directory'
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data).toHaveProperty('status', 'success');
    expect(data).toHaveProperty('message', 'Directory created successfully');
    
    // 验证目录确实创建
    const treeResponse = await request.get(`${baseURL}/api/v1/files/tree`, {
      params: { path: testPrefix, depth: 1 }
    });
    const treeData = await treeResponse.json();
    const newDir = treeData.data.children.find((item: any) => item.name === 'new-directory');
    expect(newDir).toBeDefined();
    expect(newDir.type).toBe('directory');
  });

  // POST /api/v1/files/rename - 重命名文件
  test('[P1] POST /api/v1/files/rename should rename file', async ({ request }) => {
    const sourcePath = `${testPrefix}/rename-source.txt`;
    const targetPath = `${testPrefix}/rename-target.txt`;
    
    await request.post(`${baseURL}/api/v1/files/create`, {
      data: {
        path: sourcePath,
        type: 'file',
        content: 'content'
      }
    });
    
    const response = await request.post(`${baseURL}/api/v1/files/rename`, {
      data: {
        oldPath: sourcePath,
        newPath: targetPath
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data).toHaveProperty('status', 'success');
    expect(data).toHaveProperty('message', 'File renamed successfully');
    
    // 验证新路径存在，旧路径不存在
    const targetExists = await request.get(`${baseURL}/api/v1/files/read`, {
      params: { path: targetPath }
    });
    expect(targetExists.ok()).toBeTruthy();
    
    const sourceExists = await request.get(`${baseURL}/api/v1/files/read`, {
      params: { path: sourcePath }
    });
    expect(sourceExists.ok()).toBeFalsy();
  });

  // DELETE /api/v1/files/delete - 删除文件
  test('[P1] DELETE /api/v1/files/delete should delete file', async ({ request }) => {
    const filePath = `${testPrefix}/to-delete.txt`;
    
    await request.post(`${baseURL}/api/v1/files/create`, {
      data: {
        path: filePath,
        type: 'file',
        content: 'to be deleted'
      }
    });
    
    const response = await request.delete(`${baseURL}/api/v1/files/delete`, {
      data: { path: filePath }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data).toHaveProperty('status', 'success');
    expect(data).toHaveProperty('message', 'File deleted successfully');
    
    // 验证文件已删除
    const readResponse = await request.get(`${baseURL}/api/v1/files/read`, {
      params: { path: filePath }
    });
    expect(readResponse.ok()).toBeFalsy();
  });

  // POST /api/v1/files/write - 写入文件内容
  test('[P0] POST /api/v1/files/write should update file content', async ({ request }) => {
    const filePath = `${testPrefix}/write-test.txt`;
    
    // 先创建文件
    await request.post(`${baseURL}/api/v1/files/create`, {
      data: {
        path: filePath,
        type: 'file',
        content: 'Initial content'
      }
    });
    
    // 写入新内容
    const response = await request.post(`${baseURL}/api/v1/files/write`, {
      params: { path: filePath },
      data: 'Updated content'
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data).toHaveProperty('status', 'success');
    
    // 验证内容已更新
    const readResponse = await request.get(`${baseURL}/api/v1/files/read`, {
      params: { path: filePath }
    });
    const readData = await readResponse.json();
    expect(readData.data.content).toBe('Updated content');
  });

  // 错误处理 - 文件不存在
  test('[P1] GET /api/v1/files/read should return error for non-existent file', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/v1/files/read`, {
      params: { path: `${testPrefix}/non-existent.txt` }
    });
    
    expect(response.ok()).toBeFalsy();
    const data = await response.json();
    
    expect(data).toHaveProperty('status', 'error');
    expect(data).toHaveProperty('message');
  });

  // 安全测试 - 路径遍历攻击防护
  test('[P0] should prevent path traversal attacks with ../', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/v1/files/read`, {
      params: { path: '../../etc/passwd' }
    });
    
    expect(response.ok()).toBeFalsy();
    const data = await response.json();
    
    expect(data).toHaveProperty('status', 'error');
    expect(data.message).toContain('invalid');
  });

  // 安全测试 - 绝对路径攻击防护
  test('[P0] should prevent absolute path attacks', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/v1/files/read`, {
      params: { path: '/etc/passwd' }
    });
    
    expect(response.ok()).toBeFalsy();
    const data = await response.json();
    
    expect(data).toHaveProperty('status', 'error');
  });

  // 安全测试 - 多级路径遍历
  test('[P0] should prevent multi-level path traversal', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/v1/files/read`, {
      params: { path: '../../../etc/passwd' }
    });
    
    expect(response.ok()).toBeFalsy();
    const data = await response.json();
    
    expect(data).toHaveProperty('status', 'error');
  });

  // 边界条件 - 空路径
  test('[P1] should handle empty path parameter', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/v1/files/read`, {
      params: { path: '' }
    });
    
    expect(response.ok()).toBeFalsy();
  });

  // 边界条件 - 超大文件内容
  test('[P2] should handle large file content', async ({ request }) => {
    const filePath = `${testPrefix}/large-file.txt`;
    const largeContent = 'x'.repeat(1024 * 1024); // 1MB
    
    const response = await request.post(`${baseURL}/api/v1/files/create`, {
      data: {
        path: filePath,
        type: 'file',
        content: largeContent
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('status', 'success');
  });

  // CORS测试 - 预检请求
  test('[P1] should handle CORS preflight request', async ({ request }) => {
    const response = await request.fetch(`${baseURL}/api/v1/files/tree`, {
      method: 'OPTIONS',
      headers: {
        'Origin': ORIGIN,
        'Access-Control-Request-Method': 'GET'
      }
    });
    
    expect(response.status()).toBe(200);
    const headers = response.headers();
    expect(headers['access-control-allow-methods']).toBeDefined();
  });

  // CORS测试 - 不允许的Origin
  test('[P1] should reject requests from disallowed origin', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/v1/files/tree`, {
      headers: {
        'Origin': 'http://malicious.com'
      }
    });
    
    // 在生产模式下应该拒绝
    const headers = response.headers();
    const corsHeader = headers['access-control-allow-origin'];
    expect(corsHeader).toBeUndefined();
  });
});