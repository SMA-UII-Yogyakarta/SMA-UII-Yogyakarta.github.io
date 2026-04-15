import type { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async login(identifier: string, password: string) {
    await this.page.goto('/login');
    await this.page.fill('input[name="identifier"]', identifier);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('/app/overview', { timeout: 10000 });
  }

  async loginAsMaintainer() {
    await this.login('0000000001', 'test123');
  }

  async loginAsMember() {
    await this.login('1234567890', 'test123');
  }
}

export class MembersPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/app/members');
    await this.waitForDataLoad();
  }

  async waitForDataLoad() {
    // Wait for API response instead of DOM elements
    await this.page.waitForResponse(
      response => response.url().includes('/api/members') && response.status() === 200,
      { timeout: 10000 }
    );
    await this.page.waitForTimeout(300); // Small buffer for DOM update
  }

  async filterByStatus(status: 'pending' | 'active' | '') {
    const buttonText = status === 'pending' ? 'Pending' : status === 'active' ? 'Active' : 'Semua';
    await this.page.click(`button:has-text("${buttonText}")`);
    await this.waitForDataLoad();
  }

  async search(query: string) {
    await this.page.fill('#search-input', query);
    await this.waitForDataLoad();
  }

  async approveFirstPending() {
    this.page.once('dialog', dialog => dialog.accept());
    await this.page.locator('button:has-text("Approve")').first().click();
    await this.page.waitForTimeout(1500);
  }

  async hasApproveButton() {
    return await this.page.locator('button:has-text("Approve")').first().isVisible().catch(() => false);
  }

  async hasMemberData() {
    // Wait for data to load
    await this.page.waitForTimeout(500);
    const hasTotal = await this.page.locator('text=anggota').isVisible().catch(() => false);
    const hasNoData = await this.page.locator('text=Tidak ada anggota').isVisible().catch(() => false);
    return hasTotal || hasNoData;
  }
}

export class ProjectsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/app/projects');
    await this.waitForDataLoad();
  }

  async waitForDataLoad() {
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    await this.page.waitForTimeout(300);
  }

  async createProject(title: string, description: string, url: string) {
    await this.page.click('#open-modal');
    await this.page.fill('input[name="title"]', title);
    await this.page.fill('textarea[name="description"]', description);
    await this.page.fill('input[name="url"]', url);
    await this.page.click('#project-form button[type="submit"]');
    await this.page.waitForTimeout(1000);
  }

  async hasProject(title: string) {
    return await this.page.locator(`text=${title}`).first().isVisible().catch(() => false);
  }
}
