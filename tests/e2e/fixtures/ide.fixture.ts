import { test as base } from '@playwright/test';

type IdeFixtures = {
  fileTree: FileTreeHelper;
  editor: EditorHelper;
  terminal: TerminalHelper;
};

export const test = base.extend<IdeFixtures>({
  fileTree: async ({ page }, use) => {
    await use(new FileTreeHelper(page));
  },
  editor: async ({ page }, use) => {
    await use(new EditorHelper(page));
  },
  terminal: async ({ page }, use) => {
    await use(new TerminalHelper(page));
  },
});

export class FileTreeHelper {
  constructor(private page: Page) {}

  async createFile(name: string, content?: string) {
    await this.page.click('[data-testid="file-tree-new-file"]');
    await this.page.fill('[data-testid="file-name-input"]', name);
    await this.page.click('[data-testid="confirm-create"]');
    if (content) {
      await this.page.fill('[data-testid="editor-content"]', content);
      await this.page.keyboard.press('Ctrl+S');
    }
  }

  async deleteFile(name: string) {
    await this.page.click(`[data-testid="file-${name}"]`);
    await this.page.click('[data-testid="file-delete"]');
    await this.page.click('[data-testid="confirm-delete"]');
  }

  async renameFile(oldName: string, newName: string) {
    await this.page.click(`[data-testid="file-${oldName}"]`);
    await this.page.click('[data-testid="file-rename"]');
    await this.page.fill('[data-testid="file-name-input"]', newName);
    await this.page.click('[data-testid="confirm-rename"]');
  }

  async expandFolder(name: string) {
    await this.page.click(`[data-testid="folder-${name}-expand"]`);
  }
}

export class EditorHelper {
  constructor(private page: Page) {}

  async type(content: string) {
    await this.page.fill('[data-testid="editor-content"]', content);
  }

  async selectAll() {
    await this.page.keyboard.press('Ctrl+A');
  }

  async delete() {
    await this.page.keyboard.press('Delete');
  }

  async save() {
    await this.page.keyboard.press('Ctrl+S');
  }

  async waitForSyntaxHighlight() {
    await this.page.waitForSelector('[data-testid="syntax-highlight-active"]');
  }

  async getContent() {
    return this.page.textContent('[data-testid="editor-content"]');
  }
}

export class TerminalHelper {
  constructor(private page: Page) {}

  async executeCommand(command: string) {
    await this.page.fill('[data-testid="terminal-input"]', command);
    await this.page.keyboard.press('Enter');
  }

  async waitForOutput(expectedOutput: string) {
    await this.page.waitForFunction(
      (output) => {
        const terminalOutput = document.querySelector('[data-testid="terminal-output"]');
        return terminalOutput?.textContent?.includes(output);
      },
      expectedOutput
    );
  }

  async clear() {
    await this.page.click('[data-testid="terminal-clear"]');
  }

  async getOutput() {
    return this.page.textContent('[data-testid="terminal-output"]');
  }
}