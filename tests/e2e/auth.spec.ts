import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login as maintainer', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-identifier').fill('0000000001');
    await page.getByTestId('login-password').fill('test123');
    await page.getByTestId('login-submit').click();
    await page.waitForURL('/app/overview', { timeout: 10000 });
    await expect(page.locator('h1').first()).toContainText('Admin Dashboard');
  });

  test('should login as member', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-identifier').fill('1234567890');
    await page.getByTestId('login-password').fill('test123');
    await page.getByTestId('login-submit').click();
    await page.waitForURL('/app/overview', { timeout: 10000 });
    await expect(page.locator('h1').first()).toContainText('Halo');
  });

  test('should fail with wrong password', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="identifier"]', '0000000001');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    // Should stay on login page or show error
    await page.waitForTimeout(500);
    const url = page.url();
    expect(url).toContain('/login');
  });

  test('should fail with unknown NISN', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="identifier"]', '9999999999');
    await page.fill('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/login');
  });

  test('should logout', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="identifier"]', '0000000001');
    await page.fill('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/app/overview');

    // Open profile dropdown in sidebar
    await page.click('#profile-dropdown-btn');
    await page.waitForTimeout(200);

    // Click logout
    await page.click('#logout-btn');
    await expect(page).toHaveURL('/login');
  });

  test('should redirect unauthenticated user from /app to /login', async ({ page }) => {
    await page.goto('/app/overview');
    await expect(page).toHaveURL('/login');
  });

  test('should redirect member from maintainer-only page', async ({ page }) => {
    // Login as member
    await page.goto('/login');
    await page.fill('input[name="identifier"]', '1234567890');
    await page.fill('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/app/overview');

    // Try to access maintainer-only page
    await page.goto('/app/members');
    await expect(page).toHaveURL('/app/overview');
  });
});
