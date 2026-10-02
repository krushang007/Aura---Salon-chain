import { chromium, devices } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function captureResponsiveAudit() {
  const screenshotsDir = path.join(__dirname, '../visual_audit_screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: 'desktop', width: 1440, height: 900, isMobile: false },
    { name: 'mobile', width: 375, height: 812, isMobile: true },
  ];

  const pagesToAudit = [
    { name: 'home', url: 'http://localhost:3000/' },
    { name: 'book_store', url: 'http://localhost:3000/book/10f19971-98d2-4fd0-8f4f-a1f1abbad1b7' },
    { name: 'login', url: 'http://localhost:3000/login' },
    { name: 'forgot_password', url: 'http://localhost:3000/forgot-password' },
    { name: 'partner_register', url: 'http://localhost:3000/partner-register' },
    { name: 'help', url: 'http://localhost:3000/help' },
    { name: 'terms', url: 'http://localhost:3000/terms' },
    { name: 'privacy', url: 'http://localhost:3000/privacy' },
  ];

  console.log('📱 Starting Multi-Device Visual & Mobile Audit...');

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
    });
    const page = await context.newPage();

    for (const p of pagesToAudit) {
      await page.goto(p.url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);

      const shotPath = path.join(screenshotsDir, `${p.name}_${vp.name}.png`);
      await page.screenshot({ path: shotPath, fullPage: true });
      console.log(`Saved: ${shotPath}`);
    }

    await context.close();
  }

  // Audit Admin Dashboard with auth
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const adminPage = await adminContext.newPage();
  await adminPage.goto('http://localhost:3000/login');
  await adminPage.fill('input[type="email"]', 'admin@salonbonanza.com');
  await adminPage.fill('input[type="password"]', 'Password@123');
  await adminPage.click('button[type="submit"]');
  await adminPage.waitForURL('**/admin');
  await adminPage.waitForTimeout(1000);
  const adminShot = path.join(screenshotsDir, 'admin_dashboard_desktop.png');
  await adminPage.screenshot({ path: adminShot, fullPage: true });
  console.log(`Saved: ${adminShot}`);
  await adminContext.close();

  await browser.close();
  console.log('✅ Multi-device screenshots completed successfully!');
}

captureResponsiveAudit().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
