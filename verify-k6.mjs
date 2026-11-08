import { chromium } from 'playwright';

const stateFile = process.argv[2] || '.auth-test/hotel.json';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: stateFile });
const page = await context.newPage();
const resp = await page.request.get('http://127.0.0.1:3000/api/v2/me');
console.log(`HTTP status: ${resp.status()}`);
console.log('Body:', (await resp.text()).substring(0, 200));
await browser.close();
