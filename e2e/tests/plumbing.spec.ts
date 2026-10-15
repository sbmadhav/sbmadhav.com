import { test, expect, isHttps } from './fixtures';

/** Width and height from a PNG header */
const pngSize = (b: Buffer) => ({ w: b.readUInt32BE(16), h: b.readUInt32BE(20) });

test.describe('Plumbing', () => {
  test('unknown paths get the 404 page, with the asked-for address and working controls', async ({ page }) => {
    const res = await page.goto('/no-such-page-e2e/really');
    expect(res?.status()).toBe(404);
    await expect(page).toHaveTitle(/Page not found/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    await expect(page.locator('#missing code')).toHaveText('/no-such-page-e2e/really');
    await expect(page.locator('.bolt')).toBeVisible();
    expect(await page.locator('.bolt').evaluate((i: HTMLImageElement) => i.naturalWidth > 0)).toBe(true);

    // Color mode buttons: System, Daybreak, Deep Space (saved, shared with the home page)
    await page.locator('.md-modes [data-mode="dark"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('.md-modes [data-mode="dark"]')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('.md-modes [data-mode="light"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.locator('.md-modes [data-mode="system"]').click();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', /./);

    // Kid mode on the 404 page uses the same saved setting as the home page
    await page.locator('#kidBtn').click();
    await expect(page.locator('body')).toHaveClass(/kidmode/);
    await expect(page.locator('h1 .kid')).toBeVisible();
    await page.goto('/');
    await expect(page.locator('body')).toHaveClass(/kidmode/);

    await page.goto('/no-such-page-e2e/');
    await page.locator('.actions a[href="/"]').click();
    await expect(page.locator('h1')).toContainText('Madhav');
  });

  test('404 page loads cleanly (only the 404 itself fails)', async ({ page, issues }) => {
    await page.goto('/no-such-page-e2e/', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    expect(issues.console.filter(m => !/404/.test(m))).toEqual([]);
    expect(issues.failed.filter(f => !f.includes('/no-such-page-e2e/'))).toEqual([]);
  });

  test('/math/ redirects to /vedic-math/, keeping the query', async ({ page }) => {
    await page.goto('/math/?from=e2e#learn');
    await expect(page).toHaveURL(/\/vedic-math\/\?from=e2e/);
    await page.goto('/math');
    await expect(page).toHaveURL(/\/vedic-math\//);
  });

  test('robots.txt allows crawling and names the sitemap', async ({ request }) => {
    const r = await request.get('/robots.txt');
    expect(r.status()).toBe(200);
    const body = await r.text();
    expect(body).toContain('User-agent: *');
    expect(body).toMatch(/Sitemap: https:\/\/sbmadhav\.com\/sitemap\.xml/);
  });

  test('every sitemap URL answers 200', async ({ request }) => {
    const r = await request.get('/sitemap.xml');
    expect(r.status()).toBe(200);
    const locs = [...(await r.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
    expect(locs.length).toBeGreaterThanOrEqual(4);
    for (const loc of locs) {
      const path = new URL(loc).pathname;
      const res = await request.get(path);
      expect(res.status(), loc).toBe(200);
    }
  });

  test('web app manifest is valid and its icons exist at the stated sizes', async ({ request }) => {
    const r = await request.get('/manifest.webmanifest');
    expect(r.status()).toBe(200);
    const m = await r.json();
    expect(m.name).toBeTruthy();
    expect(m.short_name).toBeTruthy();
    expect(m.start_url).toMatch(/^\//);
    expect(m.scope).toBe('/');
    expect(m.display).toBe('standalone');
    expect(m.background_color).toMatch(/^#/);
    expect(m.theme_color).toMatch(/^#/);
    const sizes = m.icons.map((i: any) => i.sizes);
    expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']));
    expect(m.icons.some((i: any) => /maskable/.test(i.purpose || ''))).toBe(true);
    for (const icon of m.icons) {
      const res = await request.get(new URL(icon.src, 'https://x/manifest.webmanifest').pathname);
      expect(res.status(), icon.src).toBe(200);
      expect(res.headers()['content-type']).toContain('image/png');
      const { w, h } = pngSize(await res.body());
      expect(`${w}x${h}`, icon.src).toBe(icon.sizes);
    }
    const apple = await request.get('/assets/icons/apple-touch-icon.png');
    expect(apple.status()).toBe(200);
  });

  test('shared files other repos load by absolute URL are served', async ({ request }) => {
    for (const p of ['/assets/explore.js', '/assets/analytics.js', '/design-system/tokens.css', '/design-system/components.css', '/manifest.webmanifest']) {
      const r = await request.get(p);
      expect(r.status(), p).toBe(200);
    }
  });

  test('repo-only files are not published', async ({ request, baseURL }) => {
    test.skip(!isHttps(baseURL), 'Publishing rules apply to the deployed site');
    for (const p of ['/CLAUDE.md', '/README.md', '/site-build.py', '/scripts/check-tokens.py', '/e2e/package.json', '/e2e/playwright.config.ts']) {
      expect((await request.get(p)).status(), p).toBe(404);
    }
  });

  test('www and http redirect to https://sbmadhav.com', async ({ request, baseURL }) => {
    test.skip(baseURL !== 'https://sbmadhav.com', 'Live domain only');
    const www = await request.get('https://www.sbmadhav.com/', { maxRedirects: 0 });
    expect([301, 302, 308]).toContain(www.status());
    expect(www.headers()['location']).toMatch(/^https?:\/\/sbmadhav\.com\//);
    const http = await request.get('http://sbmadhav.com/', { maxRedirects: 0 });
    expect([301, 302, 308]).toContain(http.status());
    expect(http.headers()['location']).toMatch(/^https:\/\/sbmadhav\.com\//);
  });
});
