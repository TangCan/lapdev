import { test } from './fixtures/ide.fixture';

test.describe('File Tree Operations', () => {
  test('should create a new file', async ({ page, fileTree }) => {
    await page.goto('/');
    
    await fileTree.createFile('test.txt', 'Hello, World!');
    
    await page.waitForSelector('[data-testid="file-test.txt"]');
  });

  test('should rename a file', async ({ page, fileTree }) => {
    await page.goto('/');
    
    await fileTree.createFile('old-name.txt');
    await fileTree.renameFile('old-name.txt', 'new-name.txt');
    
    await page.waitForSelector('[data-testid="file-new-name.txt"]');
  });

  test('should delete a file', async ({ page, fileTree }) => {
    await page.goto('/');
    
    await fileTree.createFile('to-delete.txt');
    await fileTree.deleteFile('to-delete.txt');
    
    await page.waitForSelector('[data-testid="file-to-delete.txt"]', { state: 'hidden' });
  });
});