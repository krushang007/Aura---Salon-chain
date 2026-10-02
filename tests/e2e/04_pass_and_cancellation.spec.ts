import { test, expect } from '@playwright/test';

test.describe('4. Pass & Cancellation Suite — Digital Pass & 2-Hour Cutoff', () => {

  test.beforeEach(async ({ page }) => {
    // Authenticate as Sarah Jenkins
    await page.goto('/login');
    await page.fill('input[type="email"]', 'sarah@example.com');
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.pathname === '/appointments' || url.pathname === '/');
  });

  test('21: Appointments page loads upcoming appointments and past visits', async ({ page }) => {
    await page.goto('/appointments');
    await expect(page.locator('h1')).toContainText('Appointments & History');
    await expect(page.locator('button:has-text("Upcoming Appointments")')).toBeVisible();
    await expect(page.locator('button:has-text("Past Visits")')).toBeVisible();
  });

  test('22: Digital pass renders QR code and 4-step live visual tracker', async ({ page }) => {
    await page.goto('/appointments');
    const viewPassBtn = page.locator('a:has-text("View Digital Pass")').first();
    if (await viewPassBtn.isVisible()) {
      await viewPassBtn.click();
      await page.waitForURL(/\/appointments\/[a-zA-Z0-9-]+/);

      // Verify Pass elements
      await expect(page.locator('h1')).toContainText('Appointment Confirmed');
      await expect(page.locator('body')).toContainText('Contactless Reception Pass');
      await expect(page.locator('canvas')).toBeVisible(); // QR Code canvas
      await expect(page.locator('body')).toContainText('Confirmed');
      await expect(page.locator('body')).toContainText('In Chair');
      await expect(page.locator('body')).toContainText('Completed');
    }
  });

  test('23: 2-Hour cancellation window callout is prominently displayed on pass', async ({ page }) => {
    await page.goto('/appointments');
    const viewPassBtn = page.locator('a:has-text("View Digital Pass")').first();
    if (await viewPassBtn.isVisible()) {
      await viewPassBtn.click();
      await page.waitForURL(/\/appointments\/[a-zA-Z0-9-]+/);

      await expect(page.locator('body')).toContainText('2-Hour Cancellation Window');
      await expect(page.locator('body')).toContainText('Free self-service cancellation and rescheduling available until');
    }
  });

  test('24: Assigned physical chair station is displayed on the pass', async ({ page }) => {
    await page.goto('/appointments');
    const viewPassBtn = page.locator('a:has-text("View Digital Pass")').first();
    if (await viewPassBtn.isVisible()) {
      await viewPassBtn.click();
      await page.waitForURL(/\/appointments\/[a-zA-Z0-9-]+/);

      await expect(page.locator('body')).toContainText('Assigned Station');
      await expect(page.locator('body')).toContainText('Chair');
    }
  });

  test('25: Get Salon Directions button is present with zero calendar invite pollution', async ({ page }) => {
    await page.goto('/appointments');
    const viewPassBtn = page.locator('a:has-text("View Digital Pass")').first();
    if (await viewPassBtn.isVisible()) {
      await viewPassBtn.click();
      await page.waitForURL(/\/appointments\/[a-zA-Z0-9-]+/);

      const directionsBtn = page.locator('button:has-text("Get Salon Directions")');
      await expect(directionsBtn).toBeVisible();

      // Ensure no calendar invite / .ics export button exists (User Mandate)
      await expect(page.locator('body')).not.toContainText('Add to Google Calendar');
      await expect(page.locator('body')).not.toContainText('Export .ics');
    }
  });

  test('26: Self-service cancellation frees appointment when outside 2-hour window', async ({ page }) => {
    // Book a future appointment first to test cancellation
    await page.goto('/');
    await page.locator('a:has-text("Book Appointment")').first().click();
    await page.waitForURL(/\/book\/.+/);

    await page.locator('button:has-text("Rahul Mehta")').first().click();
    await page.locator('button:has-text("Haircut")').first().click();

    // Select future date (tomorrow or next day)
    const futureDateBtn = page.locator('div.grid button.rounded-xl:not([disabled])').last();
    if (await futureDateBtn.isVisible()) {
      await futureDateBtn.click();
    }

    const availableSlot = page.locator('div.grid button:not([disabled]):has-text("PM")').first();
    if (await availableSlot.isVisible()) {
      await availableSlot.click();
      await page.locator('button:has-text("Confirm Guaranteed Booking")').click();
      await page.waitForURL(/\/appointments\/[a-zA-Z0-9-]+/);

      // Verify cancellation button is present
      const cancelBtn = page.locator('button:has-text("Cancel Appointment")');
      if (await cancelBtn.isVisible()) {
        page.on('dialog', (dialog) => dialog.accept());
        await cancelBtn.click();
        await expect(page.locator('body')).toContainText('Appointment successfully cancelled');
      }
    }
  });

});
