import { test, expect } from '@playwright/test';

test.describe('[Story 1.1] 文件树 API 测试 (ATDD)', () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';
  const testPrefix = `/workspace/test-${Date.now()}`;

  test.skip('[P0] GET /api/v1/files/tree should return directory structure', async ({ request }) => {
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

  test.skip('[P0] GET /api/v1/files/tree with depth parameter', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/v1/files/tree`, {
      params: { path: testPrefix, depth: 1 }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.data).toHaveProperty('children');
    expect(Array.isArray(data.data.children)).toBe(true);
  });

  test.skip('[P1] GET /api/v1/files/tree should respect .gitignore rules', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/v1/files/tree`, {
      params: { path: testPrefix, depth: 2 }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    const hasNodeModules = JSON.stringify(data).includes('node_modules');
    expect(hasNodeModules).toBe(false);
  });

  test.skip('[P1] GET /api/v1/files/tree should handle empty directory', async ({ request }) => {
    const emptyPath = `${testPrefix}/empty`;
    await request.post(`${baseURL}/api/v1/files/create`, {
      data: { path: emptyPath, type: 'directory' }
    });

    const response = await request.get(`${baseURL}/api/v1/files/tree`, {
      params: { path: emptyPath, depth: 1 }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.data).toHaveProperty('children', []);
  });

  test.skip('[P2] GET /api/v1/files/tree should handle deep nesting', async ({ request }) => {
    const deepPath = `${testPrefix}/level1/level2/level3/level4`;
    await request.post(`${baseURL}/api/v1/files/create`, {
      data: { path: deepPath, type: 'directory' }
    });

    const response = await request.get(`${baseURL}/api/v1/files/tree`, {
      params: { path: testPrefix, depth: 5 }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    const hasDeepNesting = JSON.stringify(data).includes('level4');
    expect(hasDeepNesting).toBe(true);
  });

  test.skip('[P2] GET /api/v1/files/tree should handle special characters in filenames', async ({ request }) => {
    const specialPath = `${testPrefix}/test file with spaces`;
    await request.post(`${baseURL}/api/v1/files/create`, {
      data: { path: specialPath, type: 'directory' }
    });

    const response = await request.get(`${baseURL}/api/v1/files/tree`, {
      params: { path: testPrefix, depth: 1 }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    const hasSpecialChars = JSON.stringify(data).includes('test file with spaces');
    expect(hasSpecialChars).toBe(true);
  });

  test.skip('[P0] POST /api/v1/files/create should create file', async ({ request }) => {
    const filePath = `${testPrefix}/test.txt`;
    const response = await request.post(`${baseURL}/api/v1/files/create`, {
      data: { path: filePath, type: 'file', content: 'test content' }
    });

    expect(response.status()).toBe(201);
    const data = await response.json();

    expect(data).toHaveProperty('status', 'success');
    expect(data.data).toHaveProperty('path', filePath);
    expect(data.data).toHaveProperty('type', 'file');
  });

  test.skip('[P0] POST /api/v1/files/create should create directory', async ({ request }) => {
    const dirPath = `${testPrefix}/newdir`;
    const response = await request.post(`${baseURL}/api/v1/files/create`, {
      data: { path: dirPath, type: 'directory' }
    });

    expect(response.status()).toBe(201);
    const data = await response.json();

    expect(data).toHaveProperty('status', 'success');
    expect(data.data).toHaveProperty('path', dirPath);
    expect(data.data).toHaveProperty('type', 'directory');
  });

  test.skip('[P1] POST /api/v1/files/create should return 400 if path already exists', async ({ request }) => {
    const existingPath = `${testPrefix}/existing.txt`;
    await request.post(`${baseURL}/api/v1/files/create`, {
      data: { path: existingPath, type: 'file', content: 'content' }
    });

    const response = await request.post(`${baseURL}/api/v1/files/create`, {
      data: { path: existingPath, type: 'file', content: 'content' }
    });

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error.message).toContain('already exists');
  });

  test.skip('[P1] POST /api/v1/files/create should return 400 for invalid path', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/v1/files/create`, {
      data: { path: '../../../etc/passwd', type: 'file', content: 'content' }
    });

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error.message).toContain('invalid path');
  });

  test.skip('[P0] POST /api/v1/files/rename should rename file', async ({ request }) => {
    const oldPath = `${testPrefix}/old.txt`;
    const newPath = `${testPrefix}/new.txt`;

    await request.post(`${baseURL}/api/v1/files/create`, {
      data: { path: oldPath, type: 'file', content: 'content' }
    });

    const response = await request.post(`${baseURL}/api/v1/files/rename`, {
      data: { oldPath, newPath }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty('status', 'success');
    expect(data.data).toHaveProperty('oldPath', oldPath);
    expect(data.data).toHaveProperty('newPath', newPath);
  });

  test.skip('[P1] POST /api/v1/files/rename should return 400 if old path does not exist', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/v1/files/rename`, {
      data: { oldPath: `${testPrefix}/nonexistent.txt`, newPath: `${testPrefix}/new.txt` }
    });

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error.message).toContain('does not exist');
  });

  test.skip('[P1] POST /api/v1/files/rename should return 400 if new path already exists', async ({ request }) => {
    const path1 = `${testPrefix}/file1.txt`;
    const path2 = `${testPrefix}/file2.txt`;

    await request.post(`${baseURL}/api/v1/files/create`, {
      data: { path: path1, type: 'file', content: 'content' }
    });
    await request.post(`${baseURL}/api/v1/files/create`, {
      data: { path: path2, type: 'file', content: 'content' }
    });

    const response = await request.post(`${baseURL}/api/v1/files/rename`, {
      data: { oldPath: path1, newPath: path2 }
    });

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error.message).toContain('already exists');
  });

  test.skip('[P0] DELETE /api/v1/files/delete should delete file', async ({ request }) => {
    const filePath = `${testPrefix}/delete.txt`;
    await request.post(`${baseURL}/api/v1/files/create`, {
      data: { path: filePath, type: 'file', content: 'content' }
    });

    const response = await request.delete(`${baseURL}/api/v1/files/delete`, {
      data: { path: filePath }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty('status', 'success');
    expect(data.data).toHaveProperty('path', filePath);
  });

  test.skip('[P1] DELETE /api/v1/files/delete should return 400 if path does not exist', async ({ request }) => {
    const response = await request.delete(`${baseURL}/api/v1/files/delete`, {
      data: { path: `${testPrefix}/nonexistent.txt` }
    });

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error.message).toContain('does not exist');
  });

  test.skip('[P1] DELETE /api/v1/files/delete should return 400 if directory is not empty', async ({ request }) => {
    const dirPath = `${testPrefix}/dir-with-files`;
    await request.post(`${baseURL}/api/v1/files/create`, {
      data: { path: dirPath, type: 'directory' }
    });
    await request.post(`${baseURL}/api/v1/files/create`, {
      data: { path: `${dirPath}/file.txt`, type: 'file', content: 'content' }
    });

    const response = await request.delete(`${baseURL}/api/v1/files/delete`, {
      data: { path: dirPath }
    });

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error.message).toContain('not empty');
  });

  test.skip('[P0] GET /api/v1/files/read should return file content', async ({ request }) => {
    const filePath = `${testPrefix}/read.txt`;
    const content = 'Hello, World!';
    await request.post(`${baseURL}/api/v1/files/create`, {
      data: { path: filePath, type: 'file', content }
    });

    const response = await request.get(`${baseURL}/api/v1/files/read`, {
      params: { path: filePath }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data).toHaveProperty('status', 'success');
    expect(data.data).toHaveProperty('content', content);
  });

  test.skip('[P1] GET /api/v1/files/read should return 400 if path does not exist', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/v1/files/read`, {
      params: { path: `${testPrefix}/nonexistent.txt` }
    });

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error.message).toContain('does not exist');
  });

  test.skip('[P2] GET /api/v1/files/read should handle large files', async ({ request }) => {
    const filePath = `${testPrefix}/large.txt`;
    const largeContent = 'x'.repeat(1024 * 1024);
    await request.post(`${baseURL}/api/v1/files/create`, {
      data: { path: filePath, type: 'file', content: largeContent }
    });

    const response = await request.get(`${baseURL}/api/v1/files/read`, {
      params: { path: filePath }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.data.content).toBe(largeContent);
  });
});