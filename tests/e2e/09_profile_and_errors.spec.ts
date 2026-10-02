import { test, expect } from '@playwright/test';

test.describe('9. Profile, Multi-Branch & 404 Error Suite', () => {

  test('47: User can navigate to Profile from Navbar and view account details', async ({ page }) => {
    // Authenticate as Sarah Jenkins
    await page.goto('/login');
    await page.fill('input[type="email"]', 'sarah@example.com');
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.pathname === '/appointments' || url.pathname === '/');

    // Click profile link in Navbar
    const profileLink = page.locator('#navbar-profile-link');
    await expect(profileLink).toBeVisible();
    await profileLink.click();

    await page.waitForURL('/profile');
    await expect(page.locator('h1')).toContainText('Sarah');
    await expect(page.locator('body')).toContainText('sarah@example.com');
    await expect(page.locator('body')).toContainText('Verified');
    await expect(page.locator('body')).toContainText('Customer');
  });

  test('48: User can edit profile full name and phone number', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'sarah@example.com');
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.pathname === '/appointments' || url.pathname === '/');

    await page.goto('/profile');
    const nameInput = page.locator('input[placeholder*="full name"]');
    await nameInput.fill('Sarah Jenkins');

    const phoneInput = page.locator('input[placeholder*="+91 98250 12345"]');
    await phoneInput.fill('+91 98250 99887');

    await page.click('button:has-text("Save Profile Changes")');
    await expect(page.locator('body')).toContainText('Profile information updated successfully');
  });

  test('49: User can log out directly from profile page', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'sarah@example.com');
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.pathname === '/appointments' || url.pathname === '/');

    await page.goto('/profile');
    const logoutBtn = page.locator('button:has-text("Sign Out"), button:has-text("Log Out")').first();
    await logoutBtn.click();

    await page.waitForURL('/login');
    await expect(page.locator('h1')).toContainText('Sign in to Aura');
  });

  test('50: Invalid route renders polished Aura 404 page', async ({ page }) => {
    await page.goto('/non-existent-atelier-url-12345');
    await expect(page.locator('h1')).toContainText('We lost this salon chair');
    await expect(page.locator('body')).toContainText('404 Error');
    await expect(page.locator('a:has-text("Back to Salons")')).toBeVisible();
  });

  test('51: Store booking uses real database UUIDs and loads valid slots without demo fallbacks', async ({ page }) => {
    await page.goto('/');
    await page.locator('a:has-text("Book Appointment")').first().click();
    await page.waitForURL(/\/book\/.+/);

    // Verify no demo text exists
    await expect(page.locator('body')).not.toContainText('demo-rahul');

    // Available slots are loaded from PostgreSQL
    const slotGridButtons = page.locator('div.grid button:has-text("AM"), div.grid button:has-text("PM")');
    await expect(slotGridButtons.first()).toBeVisible({ timeout: 10000 });
  });

});
