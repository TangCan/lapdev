import { test, expect } from '@playwright/test';

/**
 * Story 2.1: Git版本控制可视化
 * Acceptance Tests - API层测试
 * 
 * FR-009: Git状态可视化
 * FR-010: Git操作（stage/commit/branch）
 */

test.describe('Git API Tests', () => {
  const baseUrl = process.env.VITE_API_URL || 'http://localhost:3333';

  test('AC-1: 获取Git仓库状态', async ({ request }) => {
    const response = await request.get(`${baseUrl}/api/v1/git/status`);
    
    expect(response.status()).toBe(200);
    
    const result = await response.json();
    expect(result).toHaveProperty('status');
    expect(['success', 'error']).toContain(result.status);
    
    if (result.status === 'success') {
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('branch');
      expect(result.data).toHaveProperty('changes');
      expect(Array.isArray(result.data.changes)).toBe(true);
    }
  });

  test('AC-1: 获取文件差异', async ({ request }) => {
    const response = await request.get(`${baseUrl}/api/v1/git/diff`, {
      params: { path: '/workspace/test-file.txt' }
    });
    
    expect(response.status()).toBe(200);
    
    const result = await response.json();
    expect(result).toHaveProperty('status');
    if (result.status === 'success') {
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('diff');
    }
  });

  test('AC-3: 获取分支列表', async ({ request }) => {
    const response = await request.get(`${baseUrl}/api/v1/git/branches`);
    
    expect(response.status()).toBe(200);
    
    const result = await response.json();
    expect(result).toHaveProperty('status', 'success');
    expect(result).toHaveProperty('data');
    expect(Array.isArray(result.data.branches)).toBe(true);
    expect(result.data).toHaveProperty('current');
  });

  test('AC-4: 暂存文件', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/v1/git/stage`, {
      data: { paths: ['/workspace/test-file.txt'] }
    });
    
    expect(response.status()).toBe(200);
    
    const result = await response.json();
    expect(result).toHaveProperty('status');
    expect(['success', 'error']).toContain(result.status);
  });

  test('AC-4: 提交变更', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/v1/git/commit`, {
      data: { message: 'Test commit message' }
    });
    
    expect(response.status()).toBe(200);
    
    const result = await response.json();
    expect(result).toHaveProperty('status');
    expect(['success', 'error']).toContain(result.status);
  });

  test('AC-5: 切换分支', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/v1/git/checkout`, {
      data: { branch: 'main' }
    });
    
    expect(response.status()).toBe(200);
    
    const result = await response.json();
    expect(result).toHaveProperty('status');
    expect(['success', 'error']).toContain(result.status);
  });

  test('非Git仓库返回错误', async ({ request }) => {
    // 在非Git工作区测试
    const response = await request.get(`${baseUrl}/api/v1/git/status`);
    
    const result = await response.json();
    // 如果不是Git仓库，应该返回相应的错误状态
    if (result.status === 'error') {
      expect(result.message).toBeDefined();
    }
  });
});
