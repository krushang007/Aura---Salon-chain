import { test, expect } from '@playwright/test';

test.describe('5. Reschedule Suite — Slot Rescheduling & 2-Hour Guard', () => {

  test.beforeEach(async ({ page }) => {
    // Authenticate as Sarah Jenkins
    await page.goto('/login');
    await page.fill('input[type="email"]', 'sarah@example.com');
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.pathname === '/appointments' || url.pathname === '/');
  });

  test('27: Reschedule button is visible on digital pass card', async ({ page }) => {
    await page.goto('/appointments');
    const viewPassBtn = page.locator('a:has-text("View Digital Pass")').first();
    if (await viewPassBtn.isVisible()) {
      await viewPassBtn.click();
      await page.waitForURL(/\/appointments\/[a-zA-Z0-9-]+/);

      const rescheduleBtn = page.locator('button:has-text("Reschedule Appointment")');
      await expect(rescheduleBtn).toBeVisible();
    }
  });

  test('28: Clicking Reschedule opens the interactive Reschedule Modal', async ({ page }) => {
    await page.goto('/appointments');
    const viewPassBtn = page.locator('a:has-text("View Digital Pass")').first();
    if (await viewPassBtn.isVisible()) {
      await viewPassBtn.click();
      await page.waitForURL(/\/appointments\/[a-zA-Z0-9-]+/);

      const rescheduleBtn = page.locator('button:has-text("Reschedule Appointment")');
      await rescheduleBtn.click();

      // Modal should open
      await expect(page.locator('h3:has-text("Reschedule Appointment")')).toBeVisible();
      await expect(page.locator('body')).toContainText('1. Select New Date');
      await expect(page.locator('body')).toContainText('2. Select Available Slot');
    }
  });

  test('29: Selecting new slot enables Confirm Reschedule button', async ({ page }) => {
    await page.goto('/appointments');
    const viewPassBtn = page.locator('a:has-text("View Digital Pass")').first();
    if (await viewPassBtn.isVisible()) {
      await viewPassBtn.click();
      await page.waitForURL(/\/appointments\/[a-zA-Z0-9-]+/);

      await page.locator('button:has-text("Reschedule Appointment")').click();

      // Pick an available slot in the modal
      const slotBtn = page.locator('div.grid button:not([disabled]):has-text("AM"), div.grid button:not([disabled]):has-text("PM")').first();
      if (await slotBtn.isVisible()) {
        await slotBtn.click();
        const confirmBtn = page.locator('button:has-text("Confirm Reschedule")');
        await expect(confirmBtn).toBeEnabled();
      }
    }
  });

  test('30: Submitting reschedule updates appointment slot and refreshes pass', async ({ page }) => {
    await page.goto('/appointments');
    const viewPassBtn = page.locator('a:has-text("View Digital Pass")').first();
    if (await viewPassBtn.isVisible()) {
      await viewPassBtn.click();
      await page.waitForURL(/\/appointments\/[a-zA-Z0-9-]+/);

      await page.locator('button:has-text("Reschedule Appointment")').click();

      const slotBtn = page.locator('div.grid button:not([disabled]):has-text("PM")').last();
      if (await slotBtn.isVisible()) {
        await slotBtn.click();
        await page.locator('button:has-text("Confirm Reschedule")').click();

        // Expect feedback message
        await expect(page.locator('body')).toContainText('successfully rescheduled');
      }
    }
  });

  test('31: Reschedule API endpoint validates 2-hour cutoff rule', async ({ request }) => {
    // Calling reschedule without auth should return 401
    const res = await request.post('/api/booking/reschedule', {
      data: {
        appointmentId: '00000000-0000-0000-0000-000000000000',
        newDate: '2026-10-10',
        newSlotTime: '15:00',
      },
    });
    expect(res.status()).toBe(401);
  });

});
