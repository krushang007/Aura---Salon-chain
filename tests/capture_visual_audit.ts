import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function captureAudit() {
  const screenshotsDir = path.join(__dirname, '../visual_audit_screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const pages = [
    { name: '01_home_marketplace', url: 'http://localhost:3000/' },
    { name: '02_book_althan_store', url: 'http://localhost:3000/book/10f19971-98d2-4fd0-8f4f-a1f1abbad1b7' },
    { name: '03_login_page', url: 'http://localhost:3000/login' },
    { name: '04_register_page', url: 'http://localhost:3000/register' },
    { name: '05_partner_register', url: 'http://localhost:3000/partner-register' },
    { name: '06_help_center', url: 'http://localhost:3000/help' },
    { name: '07_privacy_policy', url: 'http://localhost:3000/privacy' },
    { name: '08_terms_service', url: 'http://localhost:3000/terms' },
    { name: '09_forgot_password', url: 'http://localhost:3000/forgot-password' },
  ];

  console.log('📸 Starting Visual Audit & Screen Inspections...');

  for (const p of pages) {
    console.log(`Navigating to ${p.url}...`);
    await page.goto(p.url, { waitUntil: 'networkidle' });
    
    // For book page, click service and wait for slots to verify interactive layout
    if (p.name.includes('book')) {
      await page.waitForTimeout(1000);
      const serviceButton = page.locator('button:has-text("Signature Precision Haircut")').first();
      if (await serviceButton.isVisible()) {
        await serviceButton.click();
        await page.waitForTimeout(1000);
      }
    }

    const screenshotPath = path.join(screenshotsDir, `${p.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Saved screenshot: ${screenshotPath}`);
  }

  await browser.close();
  console.log('✅ All visual audit screenshots captured successfully!');
}

captureAudit().catch((err) => {
  console.error('Visual audit failed:', err);
  process.exit(1);
});
