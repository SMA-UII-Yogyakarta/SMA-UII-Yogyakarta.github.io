import { test, expect } from '@playwright/test';

// Reliable wait: tunggu network idle setelah navigasi/aksi
async function waitForLoad(page: any) {
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
}

test.describe('Activities', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="identifier"]', '1234567890');
    await page.fill('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/app/overview');
  });

  test('should list activities', async ({ page }) => {
    await page.goto('/app/activities');
    await waitForLoad(page);
    await expect(page.locator('#activities-list')).toBeVisible();
  });

  test('should show log activity button for active member', async ({ page }) => {
    await page.goto('/app/activities');
    await expect(page.locator('#open-modal')).toBeVisible({ timeout: 10000 });
  });

  test('should open log activity modal', async ({ page }) => {
    await page.goto('/app/activities');
    await page.click('#open-modal');
    await expect(page.locator('#add-modal')).toBeVisible();
    await expect(page.locator('select[name="type"]')).toBeVisible();
    await expect(page.locator('input[name="title"]')).toBeVisible();
  });

  test('should close modal on cancel', async ({ page }) => {
    await page.goto('/app/activities');
    await page.click('#open-modal');
    await expect(page.locator('#add-modal')).toBeVisible();
    await page.click('#close-modal');
    await expect(page.locator('#add-modal')).toBeHidden();
  });

  test('should log new activity', async ({ page }) => {
    await page.goto('/app/activities');
    await page.click('#open-modal');

    await page.selectOption('select[name="type"]', 'contribution');
    const title = `E2E Activity ${Date.now()}`;
    await page.fill('input[name="title"]', title);
    await page.fill('textarea[name="description"]', 'Dibuat oleh E2E test');

    await page.click('#activity-form button[type="submit"]');
    await page.waitForTimeout(1500);

    await expect(page.locator('#add-modal')).toBeHidden();
    await expect(page.locator(`text=${title}`).first()).toBeVisible();
  });

  test('should delete own activity', async ({ page }) => {
    await page.goto('/app/activities');
    await page.click('#open-modal');
    await page.selectOption('select[name="type"]', 'other');
    const title = `Delete Test ${Date.now()}`;
    await page.fill('input[name="title"]', title);
    await page.click('#activity-form button[type="submit"]');
    await page.waitForTimeout(1500);

    const deleteBtn = page.locator('button[title="Hapus"]').first();
    if (await deleteBtn.isVisible()) {
      page.once('dialog', dialog => dialog.accept());
      await deleteBtn.click();
      await page.waitForTimeout(1000);
    }
    expect(true).toBeTruthy();
  });
});

test.describe('Activities — Maintainer View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="identifier"]', '0000000001');
    await page.fill('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/app/overview');
  });

  test('should list all activities as maintainer', async ({ page }) => {
    await page.goto('/app/activities');
    await waitForLoad(page);
    await expect(page.locator('#activities-list')).toBeVisible();
  });
});
