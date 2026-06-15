import { test, expect } from '@playwright/test';

test.describe('[E2E] Skill自动匹配', () => {
  /**
   * 带重试的等待文件树加载函数
   */
  async function waitForFileTree(page: any, maxRetries: number = 5, timeout: number = 30000): Promise<void> {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        console.log(`Waiting for file-tree (attempt ${retries + 1}/${maxRetries})...`);
        await page.waitForSelector('[data-testid="file-tree"]', { timeout });
        console.log('✓ file-tree found');
        return;
      } catch (error: any) {
        retries++;
        console.log(`✗ file-tree not found, retrying (${retries}/${maxRetries})`);
        if (retries === maxRetries - 1) {
          const testIds = await page.evaluate(() => {
            const elements = document.querySelectorAll('[data-testid]');
            return Array.from(elements).map(el => el.getAttribute('data-testid'));
          });
          console.log('Available data-testids:', testIds);
        }
        if (retries >= maxRetries) {
          throw error;
        }
        await page.waitForTimeout(2000);
      }
    }
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // 设置AI配置
    await page.evaluate(() => {
      const mockAIConfig = {
        models: [
          {
            id: 'mock-model-1',
            name: 'Mock AI',
            provider: 'openai',
            apiKey: 'sk-mock-key',
            baseUrl: 'https://api.mock.com/v1',
            model: 'mock-model',
            isActive: true
          }
        ],
        currentModelId: 'mock-model-1'
      };
      sessionStorage.setItem('lapdev-ai-models', JSON.stringify(mockAIConfig));
    });

    // 刷新页面使AI配置生效
    await page.reload();
    
    await waitForFileTree(page);

    // 设置技能数据（通过前端API）
    const skillsLoaded = await page.evaluate(() => {
      const mockSkills = [
        {
          id: 'git-helper',
          name: 'git-helper',
          version: '1.0.0',
          description: 'Git操作助手',
          author: 'test',
          tags: ['git'],
          trigger: {
            keywords: ['git', '状态', '提交', '分支'],
            patterns: []
          },
          content: '这是Git助手技能'
        },
        {
          id: 'code-review',
          name: 'code-review',
          version: '1.0.0',
          description: '代码审查',
          author: 'test',
          tags: ['code', 'review'],
          trigger: {
            keywords: ['审查', '代码', 'review'],
            patterns: []
          },
          content: '这是代码审查技能'
        },
        {
          id: 'test-generator',
          name: 'test-generator',
          version: '1.0.0',
          description: '测试用例生成',
          author: 'test',
          tags: ['test', 'generator'],
          trigger: {
            keywords: ['测试', '生成', 'test'],
            patterns: []
          },
          content: '这是测试生成技能'
        }
      ];
      
      // 使用全局函数加载技能
      if (window.__test_loadSkills) {
        window.__test_loadSkills(mockSkills);
        // 等待一下让状态更新
        return new Promise(resolve => {
          setTimeout(() => {
            if (window.__test_getAllSkills) {
              resolve(window.__test_getAllSkills().length);
            } else {
              resolve(0);
            }
          }, 500);
        });
      } else {
        console.warn('__test_loadSkills not available');
        return 0;
      }
    });
    console.log('Skills loaded:', skillsLoaded);

    // 清理之前激活的技能状态
    await page.evaluate(() => {
      if (window.__test_clearActiveSkills) {
        window.__test_clearActiveSkills();
      }
    });

    // 打开AI面板
    const aiButton = page.locator('[data-testid="ai-panel-button"]');
    await aiButton.click();
    await page.waitForSelector('[data-testid="ai-chat-panel"]');
  });

  // 场景1: Skill扫描与匹配
  test('[P0] should scan and match skills based on user request', async ({ page }) => {
    // Given 用户发送AI请求
    await page.getByTestId('ai-chat-input').fill('帮我查看git状态');
    
    // When AI接收请求
    await page.getByTestId('ai-send-button').click();
    
    // Then 显示激活通知
    const notification = page.locator('[data-testid="skill-activation-notification"]');
    await expect(notification).toBeVisible({ timeout: 5000 });
  });

  // 场景2: 自动激活
  test('[P0] should auto activate skill when match score exceeds threshold', async ({ page }) => {
    // Given Skill匹配度计算完成
    await page.getByTestId('ai-chat-input').fill('帮我查看git状态');
    await page.getByTestId('ai-send-button').click();
    
    // 等待激活通知
    const notification = page.locator('[data-testid="skill-activation-notification"]');
    await expect(notification).toBeVisible({ timeout: 5000 });
    
    // Then 在UI中显示已激活的Skill
    const activeSkills = page.locator('[data-testid="active-skill"]');
    await expect(activeSkills).toHaveCount(1);
    
    const skillName = await activeSkills.locator('[data-testid="skill-name"]').textContent();
    expect(skillName).toBe('git-helper');
  });

  // 场景3: 手动禁用
  test('[P0] should allow manual deactivation of active skill', async ({ page }) => {
    // Given Skill已激活
    await page.getByTestId('ai-chat-input').fill('帮我查看git状态');
    await page.getByTestId('ai-send-button').click();
    
    // 等待激活通知
    const notification = page.locator('[data-testid="skill-activation-notification"]');
    await expect(notification).toBeVisible({ timeout: 5000 });
    
    // When 用户点击禁用按钮
    await page.getByTestId('deactivate-skill-button').click();
    
    // Then Skill被禁用
    await expect(page.locator('[data-testid="active-skill"]')).toHaveCount(0);
  });

  // 场景4: 多Skill组合
  test('[P1] should support multiple skills activation', async ({ page }) => {
    // Given 多个Skill匹配成功
    await page.getByTestId('ai-chat-input').fill('帮我审查代码并生成测试用例');
    await page.getByTestId('ai-send-button').click();
    
    // 等待激活通知
    const notification = page.locator('[data-testid="skill-activation-notification"]');
    await expect(notification).toBeVisible({ timeout: 5000 });
    
    // When 所有匹配Skill激活
    const activeSkills = page.locator('[data-testid="active-skill"]');
    
    // Then 支持多个Skill指令组合
    await expect(activeSkills).toHaveCount(2);
    
    // And 按优先级排序注入
    const skillNames = await activeSkills.locator('[data-testid="skill-name"]').allTextContents();
    expect(skillNames).toContain('code-review');
    expect(skillNames).toContain('test-generator');
  });

  // 边界条件: 低匹配度不激活
  test('[P1] should not activate skill when match score below threshold', async ({ page }) => {
    // Given 用户发送与所有Skill无关的请求
    await page.getByTestId('ai-chat-input').fill('今天天气怎么样');
    await page.getByTestId('ai-send-button').click();
    
    // 等待消息发送完成
    await page.waitForTimeout(2000);
    
    // When 匹配度低于阈值
    // Then 不激活任何Skill
    const activeSkills = page.locator('[data-testid="active-skill"]');
    await expect(activeSkills).toHaveCount(0);
  });

  // 边界条件: 激活提示显示
  test('[P1] should show activation notification when skills auto-activated', async ({ page }) => {
    // Given 用户发送请求
    await page.getByTestId('ai-chat-input').fill('帮我查看git状态');
    await page.getByTestId('ai-send-button').click();
    
    // When Skill自动激活
    // Then 显示激活提示
    const notification = page.locator('[data-testid="skill-activation-notification"]');
    await expect(notification).toBeVisible();
    await expect(notification).toContainText('已自动激活');
  });
});