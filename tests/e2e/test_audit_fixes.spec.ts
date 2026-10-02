import { test, expect } from '@playwright/test';

test.describe('Visual & Route Audit Verification', () => {
  test('1. Static & Information routes return 200 OK without 404', async ({ request }) => {
    const routes = ['/privacy', '/terms', '/partner-register', '/forgot-password', '/help'];
    for (const route of routes) {
      const res = await request.get(route);
      expect(res.status(), `Route ${route} should return 200`).toBe(200);
    }
  });

  test('2. Booking page renders 2-column layout with Step 4 inside left col and sticky summary on right', async ({ page }) => {
    await page.goto('/book/10f19971-98d2-4fd0-8f4f-a1f1abbad1b7');
    await page.waitForLoadState('networkidle');

    // Verify left column exists and contains Step 1, 2, 3, 4
    const leftCol = page.locator('.lg\\:col-span-7');
    await expect(leftCol).toBeVisible();
    await expect(leftCol.locator('text=1. SELECT STYLIST & CHAIR STATION')).toBeVisible();
    await expect(leftCol.locator('text=2. SELECT SERVICE')).toBeVisible();
    await expect(leftCol.locator('text=3. CHOOSE DATE & AVAILABLE SLOT')).toBeVisible();
    await expect(leftCol.locator('text=4. NOTE FOR STYLIST (OPTIONAL)')).toBeVisible();

    // Verify right column exists and contains summary card
    const rightCol = page.locator('.lg\\:col-span-5');
    await expect(rightCol).toBeVisible();
    await expect(rightCol.locator('text=BOOKING SUMMARY')).toBeVisible();
    await expect(rightCol.locator('button:has-text("Confirm Guaranteed Booking")')).toBeVisible();
  });

  test('3. Login page preserves redirect parameter for return flows', async ({ page }) => {
    await page.goto('/login?redirect=/book/10f19971-98d2-4fd0-8f4f-a1f1abbad1b7');
    await page.waitForLoadState('networkidle');

    // Check that Google sign in button and form are rendered
    const googleBtn = page.locator('#google-signin-btn');
    await expect(googleBtn).toBeVisible();

    // Sign in with customer credentials
    await page.fill('input[type="email"]', 'customer@example.com');
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]:has-text("Sign In to Aura")');

    // Should redirect back to the requested booking page!
    await page.waitForURL('**/book/10f19971-98d2-4fd0-8f4f-a1f1abbad1b7');
    expect(page.url()).toContain('/book/10f19971-98d2-4fd0-8f4f-a1f1abbad1b7');
  });

  test('4. Partner registration creates salon and logs into Admin portal', async ({ page, request }) => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const testEmail = `testpartner${randomSuffix}@auratest.in`;

    const res = await request.post('/api/partner/register', {
      data: {
        salonName: `Aura Atelier ${randomSuffix}`,
        ownerName: 'Vikas Shah',
        email: testEmail,
        password: 'Password@123',
        locality: 'Adajan',
        address: 'Prime Hub, LP Savani Rd',
        phone: '+91 261 489 9999',
        totalStylingChairs: 6,
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.redirectUrl).toBe('/admin');
  });
});
