import { test as base, type Page } from '@playwright/test';
import { LoginPage, MembersPage, ProjectsPage } from './page-objects';

type TestFixtures = {
  loginPage: LoginPage;
  membersPage: MembersPage;
  projectsPage: ProjectsPage;
  authenticatedPage: Page;
};

export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  membersPage: async ({ page }, use) => {
    await use(new MembersPage(page));
  },

  projectsPage: async ({ page }, use) => {
    await use(new ProjectsPage(page));
  },

  // Pre-authenticated page fixture
  authenticatedPage: async ({ page }, use: (page: Page) => Promise<void>) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAsMaintainer();
    await use(page);
  },
});

export { expect } from '@playwright/test';
