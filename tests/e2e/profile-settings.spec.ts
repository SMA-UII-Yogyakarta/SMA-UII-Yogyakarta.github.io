import { test, expect } from '@playwright/test';

test.describe('Profile & Settings — Member', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="identifier"]', '1234567890');
    await page.fill('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/app/overview');
  });

  test('should show profile page', async ({ page }) => {
    await page.goto('/app/profile');
    await expect(page.locator('text=NISN')).toBeVisible();
    await expect(page.locator('text=Kelas')).toBeVisible();
  });

  test('should show member card page', async ({ page }) => {
    await page.goto('/app/card');
    const hasCard = await page.locator('text=SMAUII-').isVisible().catch(() => false);
    const noCard = await page.locator('text=Kartu Belum Tersedia').isVisible().catch(() => false);
    const hasQR = await page.locator('text=QR Code').isVisible().catch(() => false);
    const hasCardTitle = await page.locator('text=Member Card').isVisible().catch(() => false);
    expect(hasCard || noCard || hasQR || hasCardTitle).toBeTruthy();
  });

  test('should show settings page', async ({ page }) => {
    await page.goto('/app/settings');
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="githubUsername"]')).toBeVisible();
  });

  test('should update profile name', async ({ page }) => {
    await page.goto('/app/settings');
    await expect(page.locator('input[name="name"]')).toBeVisible();

    await page.fill('input[name="name"]', 'Updated Name E2E');

    const responsePromise = page.waitForResponse(
      (r: any) => r.url().includes('/api/profile') && r.request().method() === 'PATCH',
      { timeout: 10000 }
    );
    // Gunakan selector spesifik — bukan button[type="submit"] yang ambigu
    await page.locator('#account-form button[type="submit"]').click();
    const response = await responsePromise;
    expect(response.status()).toBe(200);
  });
});

// Test yang butuh re-login sebagai maintainer — isolasi di describe terpisah
test.describe('Profile & Settings — Guard Redirects', () => {
  test('should redirect maintainer from profile page', async ({ page }) => {
    // Login sebagai maintainer langsung
    await page.goto('/login');
    await page.fill('input[name="identifier"]', '0000000001');
    await page.fill('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/app/overview');

    await page.goto('/app/profile');
    await expect(page).toHaveURL('/app/overview');
  });

  test('should redirect maintainer from card page', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="identifier"]', '0000000001');
    await page.fill('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/app/overview');

    await page.goto('/app/card');
    await expect(page).toHaveURL('/app/overview');
  });
});
