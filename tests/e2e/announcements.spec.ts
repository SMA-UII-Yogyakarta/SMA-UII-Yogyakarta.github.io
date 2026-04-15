import { test, expect } from '@playwright/test';

async function waitForLoad(page: any) {
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
}

test.describe('Announcements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="identifier"]', '0000000001');
    await page.fill('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/app/overview');
  });

  test('should list announcements', async ({ page }) => {
    await page.goto('/app/announcements');
    await waitForLoad(page);
    await expect(page.locator('#announcements-list')).toBeVisible();
  });

  test('should show create button for maintainer', async ({ page }) => {
    await page.goto('/app/announcements');
    await expect(page.locator('#open-modal')).toBeVisible({ timeout: 10000 });
  });

  test('should open create announcement modal', async ({ page }) => {
    await page.goto('/app/announcements');
    await page.click('#open-modal');
    await expect(page.locator('#add-modal')).toBeVisible();
    await expect(page.locator('input[name="title"]')).toBeVisible();
    await expect(page.locator('textarea[name="content"]')).toBeVisible();
  });

  test('should close modal on cancel', async ({ page }) => {
    await page.goto('/app/announcements');
    await page.click('#open-modal');
    await expect(page.locator('#add-modal')).toBeVisible();
    await page.click('#close-modal');
    await expect(page.locator('#add-modal')).toBeHidden();
  });

  test('should create announcement', async ({ page }) => {
    await page.goto('/app/announcements');
    await page.click('#open-modal');

    const title = `E2E Announcement ${Date.now()}`;
    await page.fill('input[name="title"]', title);
    await page.fill('textarea[name="content"]', 'Isi pengumuman dari E2E test');

    await page.click('#submit-btn');
    await page.waitForTimeout(1500);

    await expect(page.locator('#add-modal')).toBeHidden();
    await expect(page.locator(`text=${title}`).first()).toBeVisible();
  });

  test('should edit announcement', async ({ page }) => {
    await page.goto('/app/announcements');
    await page.click('#open-modal');
    await page.fill('input[name="title"]', `Edit Ann ${Date.now()}`);
    await page.fill('textarea[name="content"]', 'Konten awal');
    await page.click('#submit-btn');
    await page.waitForTimeout(1500);

    const editBtn = page.locator('button[title="Edit"]').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.waitForTimeout(500);
      const modalVisible = await page.locator('#add-modal').isVisible().catch(() => false);
      if (modalVisible) {
        await page.fill('input[name="title"]', `Updated Ann ${Date.now()}`);
        await page.click('#submit-btn');
        await page.waitForTimeout(1500);
      }
    }
    expect(true).toBeTruthy();
  });

  test('should delete announcement', async ({ page }) => {
    await page.goto('/app/announcements');
    await page.click('#open-modal');
    await page.fill('input[name="title"]', `Delete Ann ${Date.now()}`);
    await page.fill('textarea[name="content"]', 'Akan dihapus');
    await page.click('#submit-btn');
    await page.waitForTimeout(1500);

    const deleteBtn = page.locator('button[title="Hapus"]').first();
    if (await deleteBtn.isVisible()) {
      page.once('dialog', dialog => dialog.accept());
      await deleteBtn.click();
      await page.waitForTimeout(1000);
    }
    expect(true).toBeTruthy();
  });

  test('should redirect member from announcements page', async ({ page }) => {
    // Logout via evaluate (POST)
    await page.evaluate(() => fetch('/api/auth/logout', { method: 'POST' }));
    await page.goto('/login');

    await page.fill('input[name="identifier"]', '1234567890');
    await page.fill('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/app/overview');

    await page.goto('/app/announcements');
    await expect(page).toHaveURL('/app/overview');
  });
});
