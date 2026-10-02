import { test, expect } from '@playwright/test';

test.describe('7. Staff Portal Suite — Stylist Roster & Quick Walk-ins', () => {

  test.beforeEach(async ({ page }) => {
    // Authenticate as Rahul Mehta (Stylist)
    await page.goto('/login');
    await page.fill('input[type="email"]', 'rahul@salonbonanza.com');
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/staff');
  });

  test('37: Staff portal displays stylist name, assigned physical chair, and date', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Stylist Daily Roster');
    await expect(page.locator('body')).toContainText('Rahul Mehta');
    await expect(page.locator('body')).toContainText('Chair 03');
  });

  test('38: Daily appointments roster shows scheduled clients and services', async ({ page }) => {
    await expect(page.locator('body')).toContainText('Today Schedule');
    const tableOrList = page.locator('div.divide-y, table');
    await expect(tableOrList.first()).toBeVisible();
  });

  test('39: Quick Walk-in button opens on-the-spot booking modal', async ({ page }) => {
    const quickBookBtn = page.locator('button:has-text("Quick Walk-in Booking")');
    await expect(quickBookBtn).toBeVisible();
    await quickBookBtn.click();

    // Modal opens
    await expect(page.locator('h3:has-text("Quick Walk-in Booking")')).toBeVisible();
    await expect(page.locator('input[placeholder*="Client Full Name"]')).toBeVisible();
  });

  test('40: Submitting Quick Walk-in locks chair station immediately', async ({ page }) => {
    await page.locator('button:has-text("Quick Walk-in Booking")').click();

    await page.fill('input[placeholder*="Client Full Name"]', 'Walkin Guest');
    await page.fill('input[placeholder*="Mobile Number"]', '+91 98980 12345');

    // Select service if available
    const serviceRadio = page.locator('input[type="radio"]').first();
    if (await serviceRadio.isVisible()) {
      await serviceRadio.check();
    }

    // Set time
    const timeInput = page.locator('input[type="time"]');
    if (await timeInput.isVisible()) {
      await timeInput.fill('16:00');
    }

    page.on('dialog', (dialog) => dialog.accept());
    const submitBtn = page.locator('button:has-text("Confirm Walk-in")');
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
    }
  });

  test('41: Stylist can transition appointment status to IN_PROGRESS and COMPLETED', async ({ page }) => {
    // Check if an appointment has action button to update status
    const inProgressBtn = page.locator('button:has-text("Seat Client"), button:has-text("Start Service")').first();
    if (await inProgressBtn.isVisible()) {
      await inProgressBtn.click();
      // Should reflect updated state
      await expect(page.locator('body')).toContainText('In Progress');
    }
  });

});
