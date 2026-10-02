import { test, expect } from '@playwright/test';

test.describe('3. Booking Engine Suite — Slot Selection & Chair Guarantee', () => {

  test.beforeEach(async ({ page }) => {
    // Authenticate as Sarah Jenkins
    await page.goto('/login');
    await page.fill('input[type="email"]', 'sarah@example.com');
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.pathname === '/appointments' || url.pathname === '/');
  });

  test('15: Booking page loads store details and physical chairs guarantee', async ({ page }) => {
    await page.goto('/');
    await page.locator('a:has-text("Book Appointment")').first().click();
    await page.waitForURL(/\/book\/.+/);

    await expect(page.locator('h1')).toContainText('Salon Bonanza');
    await expect(page.locator('body')).toContainText('0 Overbooking Guarantee');
    await expect(page.locator('body')).toContainText('1. Select Stylist');
    await expect(page.locator('body')).toContainText('2. Select Service');
    await expect(page.locator('body')).toContainText('3. Choose Date & Available Slot');
  });

  test('16: Stylist selection updates active stylist card and chair details', async ({ page }) => {
    await page.goto('/');
    await page.locator('a:has-text("Book Appointment")').first().click();
    await page.waitForURL(/\/book\/.+/);

    // Click on Rahul Mehta
    const rahulCard = page.locator('button:has-text("Rahul Mehta")').first();
    await expect(rahulCard).toBeVisible();
    await rahulCard.click();
    await expect(page.locator('body')).toContainText('Chair 03');
  });

  test('17: Service selection displays service duration and sanitization buffer', async ({ page }) => {
    await page.goto('/');
    await page.locator('a:has-text("Book Appointment")').first().click();
    await page.waitForURL(/\/book\/.+/);

    // Select service
    const serviceOption = page.locator('button:has-text("Haircut")').first();
    await serviceOption.click();
    await expect(page.locator('body')).toContainText('buffer');
  });

  test('18: 15-Minute interval slots are generated for selected date', async ({ page }) => {
    await page.goto('/');
    await page.locator('a:has-text("Book Appointment")').first().click();
    await page.waitForURL(/\/book\/.+/);

    // Select stylist & service first
    await page.locator('button:has-text("Rahul Mehta")').first().click();
    await page.locator('button:has-text("Haircut")').first().click();

    // Verify time slots exist
    const slotGrid = page.locator('div.grid button:has-text("AM"), div.grid button:has-text("PM")');
    await expect(slotGrid.first()).toBeVisible();
  });

  test('19: Selecting an available slot updates booking summary breakdown', async ({ page }) => {
    await page.goto('/');
    await page.locator('a:has-text("Book Appointment")').first().click();
    await page.waitForURL(/\/book\/.+/);

    // Stylist & service
    await page.locator('button:has-text("Rahul Mehta")').first().click();
    await page.locator('button:has-text("Haircut")').first().click();

    // Pick first available slot
    const firstAvailableSlot = page.locator('div.grid button:not([disabled]):has-text("AM"), div.grid button:not([disabled]):has-text("PM")').first();
    await firstAvailableSlot.click();

    // Summary card should show price
    await expect(page.locator('body')).toContainText('Pay at Salon Desk');
    await expect(page.locator('button:has-text("Confirm Guaranteed Booking")')).toBeEnabled();
  });

  test('20: Complete booking journey redirects to digital appointment pass', async ({ page }) => {
    await page.goto('/');
    await page.locator('a:has-text("Book Appointment")').first().click();
    await page.waitForURL(/\/book\/.+/);

    // Pick stylist, service, and pick a date in the future
    await page.locator('button:has-text("Rahul Mehta")').first().click();
    await page.locator('button:has-text("Haircut")').first().click();

    // Select slot
    const availableSlot = page.locator('div.grid button:not([disabled]):has-text("PM")').first();
    await availableSlot.click();

    // Confirm booking
    const confirmBtn = page.locator('button:has-text("Confirm Guaranteed Booking")');
    await confirmBtn.click();

    // Should redirect to /appointments/[id]
    await page.waitForURL(/\/appointments\/[a-zA-Z0-9-]+/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Appointment Confirmed');
    await expect(page.locator('body')).toContainText('#AURA-SURAT-');
  });

});
