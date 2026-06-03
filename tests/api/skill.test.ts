import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../backend/src/app';

describe('Skill API - ATDD Acceptance Tests', () => {
  describe('Scenario: Skill管理API', () => {
    it('GET /api/skills - Given 已加载Skill When 获取Skill列表 Then 返回所有Skill', async () => {
      // Act
      const response = await request(app).get('/api/skills');

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('GET /api/skills/:name - Given Skill存在 When 获取单个Skill Then 返回Skill详情', async () => {
      // Act
      const response = await request(app).get('/api/skills/test-skill');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'test-skill');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('description');
    });

    it('GET /api/skills/:name - Given Skill不存在 When 获取单个Skill Then 返回404', async () => {
      // Act
      const response = await request(app).get('/api/skills/nonexistent-skill');

      // Assert
      expect(response.status).toBe(404);
    });

    it('POST /api/skills/reload - When 触发重新加载 Then 返回成功', async () => {
      // Act
      const response = await request(app).post('/api/skills/reload');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Skills reloaded');
    });

    it('POST /api/skills/match - Given 用户输入 When 匹配Skill Then 返回匹配的Skill列表', async () => {
      // Act
      const response = await request(app)
        .post('/api/skills/match')
        .send({ query: 'hello world' });

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
