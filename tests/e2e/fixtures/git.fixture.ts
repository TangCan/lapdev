import { test as base } from '@playwright/test';

type GitFixtures = {
  git: GitHelper;
};

export const test = base.extend<GitFixtures>({
  git: async ({ page }, use) => {
    await use(new GitHelper(page));
  },
});

export class GitHelper {
  constructor(private page: Page) {}

  async openGitPanel() {
    await this.page.click('[data-testid="git-panel-toggle"]');
  }

  async stageFile(fileName: string) {
    await this.page.click(`[data-testid="git-stage-${fileName}"]`);
  }

  async unstageFile(fileName: string) {
    await this.page.click(`[data-testid="git-unstage-${fileName}"]`);
  }

  async commit(message: string) {
    await this.page.fill('[data-testid="git-commit-message"]', message);
    await this.page.click('[data-testid="git-commit-button"]');
  }

  async push() {
    await this.page.click('[data-testid="git-push"]');
  }

  async pull() {
    await this.page.click('[data-testid="git-pull"]');
  }

  async getStatus() {
    return this.page.textContent('[data-testid="git-status"]');
  }

  async createBranch(name: string) {
    await this.page.click('[data-testid="git-branch-create"]');
    await this.page.fill('[data-testid="branch-name-input"]', name);
    await this.page.click('[data-testid="confirm-create-branch"]');
  }

  async checkoutBranch(name: string) {
    await this.page.click('[data-testid="git-branch-selector"]');
    await this.page.click(`[data-testid="branch-${name}"]`);
  }
}