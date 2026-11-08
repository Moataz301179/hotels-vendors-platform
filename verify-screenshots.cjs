const { chromium } = require('playwright');
const fs = require('fs');

const baseURL = 'http://127.0.0.1:3100';
const desktop = '/Users/Moatazi/Desktop/hv-visual-review-hermes-v1';
const repo = '/Users/Moatazi/hotels-vendors-new';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await context.newPage();

  const roles = [
    { file: 'hotel.json', label: 'hotel-workspace' },
    { file: 'supplier.json', label: 'supplier-workspace' },
    { file: 'carrier.json', label: 'shipping-workspace' },
    { file: 'funder.json', label: 'factoring-workspace' },
    { file: 'admin.json', label: 'admin-workspace' },
  ];

  for (const { file, label } of roles) {
    const credPath = `${repo}/.auth/${file}`;
    const creds = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
    const cookies = creds.cookies || [];
    for (const c of cookies) {
      if (c.name.startsWith('__cf_bm')) continue;
      await context.addCookies([{
        name: c.name, value: c.value,
        domain: c.domain || '127.0.0.1',
        path: c.path || '/', expires: c.expires || Date.now() + 3600
      }]);
    }
    await page.goto(`${baseURL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2500);
    const title = await page.title();
    const url = page.url();
    const content = await page.content();
    console.log(`${label}: title='${title}', url='${url}', contentLength=${content.length}`);
  }

  await browser.close();
})();
