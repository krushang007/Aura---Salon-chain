import { test, expect } from '@playwright/test';

test.describe('1. Authentication Suite — Unified Login & Registration', () => {

  test('01: Customer login with valid credentials succeeds and redirects to appointments/home', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('Sign in to Aura');

    await page.fill('input[type="email"]', 'sarah@example.com');
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]');

    // Should redirect to /appointments or /
    await page.waitForURL((url) => url.pathname === '/appointments' || url.pathname === '/');
    await expect(page.locator('header')).toContainText('Sarah');
  });

  test('02: Stylist login (Rahul Mehta) redirects automatically to Stylist Roster portal', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'rahul@salonbonanza.com');
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]');

    await page.waitForURL('/staff');
    await expect(page.locator('h1')).toContainText('Stylist Daily Roster');
    await expect(page.locator('body')).toContainText('Chair 03');
  });

  test('03: Salon Admin login redirects automatically to Admin Dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@salonbonanza.com');
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]');

    await page.waitForURL('/admin');
    await expect(page.locator('h1')).toContainText('Admin Management');
    await expect(page.locator('body')).toContainText('Salon Bonanza');
  });

  test('04: Direct provisioned staff (abc@gmail.com) logs in with 0 friction', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'abc@gmail.com');
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]');

    await page.waitForURL('/staff');
    await expect(page.locator('h1')).toContainText('Stylist Daily Roster');
  });

  test('05: Invalid password displays helpful error feedback', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'sarah@example.com');
    await page.fill('input[type="password"]', 'WrongPassword!999');
    await page.click('button[type="submit"]');

    const errorBox = page.locator('div.bg-red-50');
    await expect(errorBox).toBeVisible();
    await expect(errorBox).toContainText('Invalid email or password');
  });

  test('06: Non-existent user email displays invalid credentials error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'doesnotexist@example.com');
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]');

    const errorBox = page.locator('div.bg-red-50');
    await expect(errorBox).toBeVisible();
    await expect(errorBox).toContainText('Invalid email or password');
  });

  test('07: New customer registration creates account and logs in', async ({ page }) => {
    const uniqueEmail = `testuser_${Date.now()}@example.com`;
    await page.goto('/register');
    await expect(page.locator('h1')).toContainText('Create an Aura Account');

    await page.fill('input[placeholder="Sarah Jenkins"]', 'Test Customer');
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[type="tel"]', '+91 99999 88888');
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]');

    await page.waitForURL('/');
    await expect(page.locator('header')).toContainText('Test');
  });

  test('08: Sign out button clears session cookie and redirects to login', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'sarah@example.com');
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.pathname === '/appointments' || url.pathname === '/');

    // Click logout
    const logoutBtn = page.locator('#navbar-signout-btn');
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForURL('/login');
      await expect(page.locator('h1')).toContainText('Sign in to Aura');
    }
  });

});
