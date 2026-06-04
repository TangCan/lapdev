import { test, expect } from '@playwright/test';

test.describe('[E2E] Skill自动匹配', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // 场景1: Skill扫描与匹配
  test('[P0] should scan and match skills based on user request', async ({ page }) => {
    // Given 用户发送AI请求
    await page.getByTestId('ai-chat-input').fill('帮我查看git状态');
    
    // When AI接收请求
    await page.getByTestId('ai-chat-send').click();
    
    // Then 扫描已加载Skill的描述和触发条件
    await page.waitForSelector('[data-testid="skill-panel"]');
    
    // And 计算每个Skill与请求的匹配度
    const matchScores = await page.locator('[data-testid="skill-match-score"]').allTextContents();
    expect(matchScores.length).toBeGreaterThan(0);
  });

  // 场景2: 自动激活
  test('[P0] should auto activate skill when match score exceeds threshold', async ({ page }) => {
    // Given Skill匹配度计算完成
    await page.getByTestId('ai-chat-input').fill('帮我查看git状态');
    await page.getByTestId('ai-chat-send').click();
    
    await page.waitForSelector('[data-testid="skill-panel"]');
    
    // When 匹配度超过阈值（>0.7）
    const activeSkills = page.locator('[data-testid="active-skill"]');
    
    // Then 自动激活该Skill
    await expect(activeSkills).toHaveCount(1);
    
    // And 在UI中显示已激活的Skill
    const skillName = await activeSkills.locator('[data-testid="skill-name"]').textContent();
    expect(skillName).toBe('git-helper');
    
    // And 将Skill指令注入AI系统提示
    const systemPrompt = await page.evaluate(() => {
      return window.__test_getSystemPrompt?.();
    });
    expect(systemPrompt).toContain('git-helper');
  });

  // 场景3: 手动禁用
  test('[P0] should allow manual deactivation of active skill', async ({ page }) => {
    // Given Skill已激活
    await page.getByTestId('ai-chat-input').fill('帮我查看git状态');
    await page.getByTestId('ai-chat-send').click();
    await page.waitForSelector('[data-testid="active-skill"]');
    
    // When 用户点击禁用按钮
    await page.getByTestId('deactivate-skill-button').click();
    
    // Then Skill被禁用
    await expect(page.locator('[data-testid="active-skill"]')).toHaveCount(0);
    
    // And 从系统提示中移除Skill指令
    const systemPrompt = await page.evaluate(() => {
      return window.__test_getSystemPrompt?.();
    });
    expect(systemPrompt).not.toContain('git-helper');
    
    // And UI更新显示禁用状态
    const deactivatedSkill = page.locator('[data-testid="deactivated-skill"]');
    await expect(deactivatedSkill).toHaveCount(1);
  });

  // 场景4: 多Skill组合
  test('[P1] should support multiple skills activation', async ({ page }) => {
    // Given 多个Skill匹配成功
    await page.getByTestId('ai-chat-input').fill('帮我审查代码并生成测试用例');
    await page.getByTestId('ai-chat-send').click();
    
    await page.waitForSelector('[data-testid="skill-panel"]');
    
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
    await page.getByTestId('ai-chat-send').click();
    
    await page.waitForSelector('[data-testid="skill-panel"]');
    
    // When 匹配度低于阈值
    // Then 不激活任何Skill
    await expect(page.locator('[data-testid="active-skill"]')).toHaveCount(0);
  });

  // 边界条件: 激活提示显示
  test('[P1] should show activation notification when skills auto-activated', async ({ page }) => {
    // Given 用户发送请求
    await page.getByTestId('ai-chat-input').fill('帮我查看git状态');
    await page.getByTestId('ai-chat-send').click();
    
    // When Skill自动激活
    // Then 显示激活提示
    const notification = page.locator('[data-testid="skill-activation-notification"]');
    await expect(notification).toBeVisible();
    await expect(notification).toContainText('已自动激活');
  });
});