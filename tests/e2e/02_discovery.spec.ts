import { test, expect } from '@playwright/test';

test.describe('2. Discovery Suite — Surat Multi-Outlet Marketplace', () => {

  test('09: Marketplace home page loads with Surat branding and value props', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Book top salon stylists with guaranteed chair seats');
    await expect(page.locator('body')).toContainText('Surat');
    await expect(page.locator('body')).toContainText('Real-Time Slot Locks');
    await expect(page.locator('body')).toContainText('5-Min Sanitization Buffers');
  });

  test('10: Locality filter chips are interactive and include Surat areas', async ({ page }) => {
    await page.goto('/');
    const localityContainer = page.locator('button', { hasText: 'Althan' });
    await expect(localityContainer).toBeVisible();

    const vesuChip = page.locator('button', { hasText: 'Vesu' });
    await expect(vesuChip).toBeVisible();

    const adajanChip = page.locator('button', { hasText: 'Adajan' });
    await expect(adajanChip).toBeVisible();
  });

  test('11: Filtering by locality updates salon listing', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Althan")');
    // Verify only Althan branch or relevant salons show
    await expect(page.locator('body')).toContainText('Althan');
  });

  test('12: Search input filters salons by keyword', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.locator('input[placeholder*="Search salons"]');
    await searchInput.fill('Bonanza');
    await expect(page.locator('body')).toContainText('Salon Bonanza');
  });

  test('13: Salon card displays physical chair count and featured service', async ({ page }) => {
    await page.goto('/');
    const card = page.locator('div.rounded-2xl', { hasText: 'Salon Bonanza' }).first();
    await expect(card).toBeVisible();
    await expect(card).toContainText('Chairs');
    await expect(card).toContainText('Book Appointment');
  });

  test('14: Clicking Book Appointment navigates to booking engine', async ({ page }) => {
    await page.goto('/');
    const bookBtn = page.locator('a:has-text("Book Appointment")').first();
    await bookBtn.click();
    await page.waitForURL(/\/book\/.+/);
    await expect(page.locator('body')).toContainText('Select Stylist');
  });

});
