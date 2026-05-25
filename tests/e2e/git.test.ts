import { test } from './fixtures/git.fixture';

test.describe('Git Operations', () => {
  test('should stage and commit changes', async ({ page, git }) => {
    await page.goto('/');
    
    await git.openGitPanel();
    await git.stageFile('README.md');
    await git.commit('Initial commit');
    
    const status = await git.getStatus();
    test.expect(status).toContain('Initial commit');
  });

  test('should create and checkout branch', async ({ page, git }) => {
    await page.goto('/');
    
    await git.openGitPanel();
    await git.createBranch('feature/test');
    await git.checkoutBranch('feature/test');
    
    await page.waitForSelector('[data-testid="branch-feature/test-active"]');
  });
});