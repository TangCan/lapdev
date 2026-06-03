import { test, expect } from '@playwright/test';

test('Debug page load', async ({ page }) => {
  await page.goto('/');
  
  // Wait for a bit to let React render
  await page.waitForTimeout(5000);
  
  // Check if root element has content
  const rootContent = await page.$eval('#root', (el) => el.innerHTML);
  console.log('Root content length:', rootContent.length);
  console.log('Root content:', rootContent.substring(0, 500));
  
  // Check for any console errors
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  // Try to find file-tree
  const fileTree = page.getByTestId('file-tree');
  const fileTreeExists = await fileTree.count();
  console.log('File tree exists:', fileTreeExists > 0);
  
  if (fileTreeExists > 0) {
    const isVisible = await fileTree.isVisible();
    console.log('File tree visible:', isVisible);
  }
  
  // Check for errors
  if (errors.length > 0) {
    console.log('Console errors:', errors);
  }
  
  // Take a screenshot
  await page.screenshot({ path: 'test-results/debug-screenshot.png' });
});
