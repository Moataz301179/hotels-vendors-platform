import { test, expect } from '@playwright/test';
for (const path of ['/', '/login', '/register', '/marketplace', '/platform', '/solutions', '/security-overview']) {
 test('renders '+path, async ({page}) => {const response=await page.goto(path); expect(response?.status()).toBe(200); await expect(page.locator('body')).not.toContainText('Internal Server Error');});
}
for (const path of ['/dashboard','/onboarding']) {
 test('protects '+path, async ({page}) => {await page.goto(path); await expect.poll(()=>new URL(page.url()).pathname).not.toBe(path);});
}
