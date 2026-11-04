import { test, expect } from '@playwright/test';
for (const path of ['/', '/login', '/register', '/marketplace', '/platform', '/solutions', '/security-overview']) {
 test('renders '+path, async ({page}) => {const response=await page.goto(path); expect(response?.status()).toBe(200); await expect(page.locator('body')).not.toContainText('Internal Server Error');});
}
for (const path of ['/dashboard','/onboarding']) {
 test('protects '+path, async ({page}) => {await page.goto(path); await expect.poll(()=>new URL(page.url()).pathname).not.toBe(path);});
}

test('public chrome uses one charcoal header and footer without rejected homepage copy', async ({ page }) => {
  await page.goto('/');
  const header = page.locator('nav[aria-label="Main navigation"]');
  const footer = page.locator('footer.hv-site-footer');
  await expect(header).toBeVisible();
  await expect(footer).toBeVisible();
  const colors = await Promise.all([header, footer].map(locator => locator.evaluate(element => getComputedStyle(element).backgroundColor)));
  expect(colors).toEqual(['rgba(47, 47, 47, 0.92)', 'rgb(47, 47, 47)']);
  await expect(page.locator('body')).not.toContainText('Take the receiving work with you');
  await expect(page.locator('body')).not.toContainText('Before you get started');
  await expect(page.locator('body')).not.toContainText('Do not fill the gap with invented data');
});

test('registration exposes only direct hotel and vendor signup', async ({ page }) => {
  await page.goto('/register');
  const cards = page.locator('.hv-register-card');
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0)).toContainText('Hotels');
  await expect(cards.nth(1)).toContainText('Vendors');
  await expect(page.locator('main')).not.toContainText('Open carrier portal');
  await expect(page.locator('main')).not.toContainText('Open funder portal');
});

for (const path of ['/', '/marketplace', '/register', '/hovin', '/login']) {
  test(`mobile layout has no horizontal overflow on ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    await expect(page.locator('body')).not.toContainText('Internal Server Error');
    const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width + 1);
  });
}
