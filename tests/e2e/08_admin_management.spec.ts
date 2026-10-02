import { test, expect } from '@playwright/test';

test.describe('8. Admin Operations Suite — Staff Provisioning & Service Cloning', () => {

  test.beforeEach(async ({ page }) => {
    // Authenticate as Salon Admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@salonbonanza.com');
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });

  test('42: Admin dashboard loads staff management directory', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Admin Management');
    await expect(page.locator('body')).toContainText('Multi-branch operations');
    await expect(page.locator('table, div.divide-y').first()).toBeVisible();
  });

  test('43: Staff directory displays assigned physical chairs and roles', async ({ page }) => {
    await expect(page.locator('body')).toContainText('Rahul Mehta');
    await expect(page.locator('body')).toContainText('Chair 03');
    await expect(page.locator('body')).toContainText('Priya Patel');
    await expect(page.locator('body')).toContainText('Chair 01');
  });

  test('44: Add Staff Member modal allows direct provisioning with assigned chair', async ({ page }) => {
    const addStaffBtn = page.locator('button:has-text("Add Staff Member")').first();
    await expect(addStaffBtn).toBeVisible();
    await addStaffBtn.click();

    // Verify modal is open
    await expect(page.locator('h3:has-text("Add New Staff Member")')).toBeVisible();
    await expect(page.locator('input[placeholder*="Rahul Sharma"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="abc@gmail.com"]')).toBeVisible();
  });

  test('45: Direct provisioning completes and updates staff directory', async ({ page }) => {
    await page.locator('button:has-text("Add Staff Member")').first().click();

    const uniqueStaffEmail = `staff_${Date.now()}@salonbonanza.com`;
    await page.fill('input[placeholder*="Rahul Sharma"]', 'Kavita Dave');
    await page.fill('input[placeholder*="abc@gmail.com"]', uniqueStaffEmail);

    // Submit provisioning
    await page.locator('form button[type="submit"]:has-text("Add Staff Member")').click();

    // Feedback or directory update
    await expect(page.locator('body')).toContainText('Kavita Dave', { timeout: 10000 });
  });

  test('46: Clone Service Catalog modal supports cross-branch synchronization', async ({ page }) => {
    const cloneBtn = page.locator('button:has-text("Clone Catalog Across Outlets")');
    await expect(cloneBtn).toBeVisible();
    await cloneBtn.click();

    // Verify clone modal
    await expect(page.locator('h3:has-text("Clone Service Catalog")')).toBeVisible();
    await expect(page.locator('body')).toContainText('Source Outlet');
    await expect(page.locator('body')).toContainText('Destination Outlet');
  });

});
