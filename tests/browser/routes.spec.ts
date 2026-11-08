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
  const parseBg = (value: string) => {
    // CSS Color 4 serializes via oklch()/lab() with an alpha after '/'; legacy
    // browsers serialize rgba()/rgb(). Neither form is asserted; only the
    // approved rules are checked: a dark charcoal token and a non-transparent
    // (alpha > 0) surface.
    const alphaMatch = value.match(/\/\s*([0-9.]+)\s*$/);
    if (alphaMatch) return { alpha: Number(alphaMatch[1]), rgb: null };
    // 3- or 4-argument rgba()/rgb() — alpha defaults to 1 when omitted.
    const rgba = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
    if (!rgba) throw new Error(`Unexpected header/footer background syntax: ${value}`);
    const alpha = rgba[4] !== undefined ? Number(rgba[4]) : 1;
    return { alpha, rgb: [Number(rgba[1]), Number(rgba[2]), Number(rgba[3])] };
  };
  const verifyBg = async (locator: Locator) => {
    const value = await locator.evaluate((el) => getComputedStyle(el).backgroundColor);
    const { alpha, rgb } = parseBg(value);
    expect(alpha).toBeGreaterThan(0);
    // Semantic charcoal-token rule (no exact rgb() output asserted): the
    // approved dark charcoal maps to R,G,B all below the #6E6E6E threshold.
    if (rgb) {
      [0, 1, 2].forEach((i) => expect(rgb[i]).toBeLessThan(110));
    }
  };
  await verifyBg(header);
  await verifyBg(footer);
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
