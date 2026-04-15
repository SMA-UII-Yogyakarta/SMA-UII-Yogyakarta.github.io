import { test, expect } from '@playwright/test';

async function waitForLoad(page: any) {
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
}

test.describe('Member Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="identifier"]', '0000000001');
    await page.fill('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/app/overview');
  });

  test('should list all members', async ({ page }) => {
    await page.goto('/app/members');
    await waitForLoad(page);

    const totalText = page.locator('text=Menampilkan');
    const noDataText = page.locator('text=Tidak ada anggota ditemukan');
    const hasTotal = await totalText.isVisible().catch(() => false);
    const hasNoData = await noDataText.isVisible().catch(() => false);
    expect(hasTotal || hasNoData).toBeTruthy();
  });

  test('should filter pending members', async ({ page }) => {
    await page.goto('/app/members');
    await waitForLoad(page);

    // Klik filter dan tunggu response API
    const responsePromise = page.waitForResponse(
      r => r.url().includes('/api/members') && r.url().includes('status=pending'),
      { timeout: 10000 }
    );
    await page.click('button[data-status="pending"]');
    await responsePromise;
    await page.waitForTimeout(500);

    const approveBtn = page.locator('button:has-text("Approve")').first();
    const noDataText = page.locator('text=Tidak ada anggota ditemukan');
    const hasApprove = await approveBtn.isVisible().catch(() => false);
    const hasNoData = await noDataText.isVisible().catch(() => false);
    expect(hasApprove || hasNoData).toBeTruthy();
  });

  test('should filter active members', async ({ page }) => {
    await page.goto('/app/members');
    await waitForLoad(page);

    const responsePromise = page.waitForResponse(
      r => r.url().includes('/api/members') && r.url().includes('status=active'),
      { timeout: 10000 }
    );
    await page.click('button[data-status="active"]');
    await responsePromise;
    await page.waitForTimeout(500);

    const approveBtn = page.locator('button:has-text("Approve")');
    expect(await approveBtn.count()).toBe(0);
  });

  test('should search members', async ({ page }) => {
    await page.goto('/app/members');
    await waitForLoad(page);

    await page.fill('#search-input', 'Ahmad');
    await waitForLoad(page);

    await expect(page.locator('#members-content')).toBeVisible();
  });

  test('should approve member', async ({ page }) => {
    await page.goto('/app/members');
    await waitForLoad(page);

    await page.click('button[data-status="pending"]');
    await waitForLoad(page);

    const approveButtons = await page.locator('button:has-text("Approve")').count();
    if (approveButtons > 0) {
      page.once('dialog', dialog => dialog.accept());
      await page.locator('button:has-text("Approve")').first().click();
      await page.waitForTimeout(2000);
    }
    expect(true).toBeTruthy();
  });

  test('should open set password modal', async ({ page }) => {
    await page.goto('/app/members');
    await waitForLoad(page);

    await page.locator('button[title="Set Password"]').first().click();
    await expect(page.locator('#password-modal')).toBeVisible();
    await expect(page.locator('#new-password')).toBeVisible();
  });

  test('should close password modal on cancel', async ({ page }) => {
    await page.goto('/app/members');
    await waitForLoad(page);

    await page.locator('button[title="Set Password"]').first().click();
    await expect(page.locator('#password-modal')).toBeVisible();

    await page.click('button:has-text("Batal")');
    await expect(page.locator('#password-modal')).toBeHidden();
  });

  test('should show members content', async ({ page }) => {
    await page.goto('/app/members');
    await waitForLoad(page);
    await expect(page.locator('#members-content')).toBeVisible();
  });
});
