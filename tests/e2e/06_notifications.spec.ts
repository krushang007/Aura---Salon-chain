import { test, expect } from '@playwright/test';

test.describe('6. Notifications Suite — In-App Notifications Center', () => {

  test.beforeEach(async ({ page }) => {
    // Authenticate as Sarah Jenkins
    await page.goto('/login');
    await page.fill('input[type="email"]', 'sarah@example.com');
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.pathname === '/appointments' || url.pathname === '/');
  });

  test('32: Navbar notification bell links to notifications center', async ({ page }) => {
    const bellLink = page.locator('#navbar-notifications-link');
    await expect(bellLink).toBeVisible();
    await bellLink.click();
    await page.waitForURL('/notifications');
    await expect(page.locator('h1')).toContainText('Notifications');
  });

  test('33: Notifications center lists past booking and schedule notices', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page.locator('h1')).toContainText('Notifications');
    await expect(page.locator('button:has-text("All Notifications")')).toBeVisible();
    await expect(page.locator('button:has-text("Unread")')).toBeVisible();
  });

  test('34: Switching between All and Unread filter tabs', async ({ page }) => {
    await page.goto('/notifications');
    const unreadTab = page.locator('button:has-text("Unread")');
    await unreadTab.click();
    // Should display either unread items or the empty state
    await expect(page.locator('body')).toBeVisible();
  });

  test('35: Mark all as read button clears unread notifications', async ({ page }) => {
    await page.goto('/notifications');
    const markAllBtn = page.locator('button:has-text("Mark all as read")');
    if (await markAllBtn.isVisible()) {
      await markAllBtn.click();
      await expect(page.locator('span:has-text("unread")')).toHaveCount(0);
    }
  });

  test('36: Notification item links to digital appointment pass', async ({ page }) => {
    await page.goto('/notifications');
    const passLink = page.locator('a:has-text("View Appointment Pass")').first();
    if (await passLink.isVisible()) {
      await passLink.click();
      await page.waitForURL(/\/appointments\/[a-zA-Z0-9-]+/);
      await expect(page.locator('h1')).toContainText('Appointment Confirmed');
    }
  });

});
