import { test, expect } from './fixtures';

test.describe('Home page', () => {
  test('loads with no console errors and no failed requests', async ({ page, issues }) => {
    await page.goto('/', { waitUntil: 'load' });
    await expect(page.locator('h1')).toContainText('Madhav');
    // Let idle work (Explore menu build, service worker, analytics) run before judging
    await page.waitForTimeout(2500);
    expect(issues.console, 'console errors').toEqual([]);
    expect(issues.failed, 'failed requests').toEqual([]);
  });

  test('title, meta, Open Graph and JSON-LD are present', async ({ page, request }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Madhav Srinivasan/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{40,}/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://sbmadhav.com/');
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
    for (const p of ['og:title', 'og:description', 'og:image', 'og:url']) {
      await expect(page.locator(`meta[property="${p}"]`)).toHaveAttribute('content', /.+/);
    }
    const og = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect((await request.get(new URL(og!).pathname)).status()).toBe(200);

    const ld = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent() || '{}');
    expect(ld['@type']).toBe('Person');
    expect(ld.name).toBe('Madhav Srinivasan');
    expect(ld.sameAs).toEqual(expect.arrayContaining(['https://github.com/sbmadhav']));
  });

  test('header nav anchors scroll to their sections', async ({ page }, info) => {
    test.skip(info.project.name === 'mobile', 'The header section nav is hidden below 1180px; the Explore menu covers phones');
    await page.goto('/');
    for (const id of ['work', 'lab', 'bugs', 'play', 'journey', 'hello']) {
      await page.locator(`header nav a[href="#${id}"]`).click();
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      await expect(page.locator(`#${id}`)).toBeInViewport();
    }
  });

  test('hero call-to-action buttons jump to the games', async ({ page }) => {
    await page.goto('/');
    await page.locator('.hero .cta a[href="#bugs"]').click();
    await expect(page.locator('#bugs')).toBeInViewport();
  });

  test('kid mode swaps .pro and .kid copy and persists across reload', async ({ page }) => {
    await page.goto('/');
    const toggle = page.locator('#modeToggle');
    const proLede = page.locator('.lede .pro'), kidLede = page.locator('.lede .kid');
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await expect(proLede).toBeVisible();
    await expect(kidLede).toBeHidden();

    await toggle.click();
    await expect(page.locator('body')).toHaveClass(/kidmode/);
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await expect(kidLede).toBeVisible();
    await expect(proLede).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem('kidmode'))).toBe('1');

    await page.reload();
    await expect(page.locator('body')).toHaveClass(/kidmode/);
    await expect(page.locator('.lede .kid')).toBeVisible();

    await page.locator('#modeToggle').click();
    await expect(page.locator('body')).not.toHaveClass(/kidmode/);
    await page.reload();
    await expect(page.locator('body')).not.toHaveClass(/kidmode/);
  });

  test('?kid in the URL starts in kid mode', async ({ page }) => {
    await page.goto('/?kid');
    await expect(page.locator('body')).toHaveClass(/kidmode/);
    await expect(page.locator('#play .kid .maze')).toBeVisible();
  });

  for (const system of ['light', 'dark'] as const) {
    test(`color scheme: follows the ${system} system setting, switches, persists, and returns to System`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: system });
      await page.goto('/');
      const root = page.locator('html');
      const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      const meta = page.locator('meta[name="theme-color"]');
      const other = system === 'light' ? 'dark' : 'light';

      await expect(root).not.toHaveAttribute('data-theme', /./);
      await expect(meta).toHaveAttribute('content', system === 'dark' ? '#0A0B18' : '#FFF8EE');
      const systemBg = await bg();

      // Switch away from the system scheme: an explicit, saved override
      await page.locator('#themeBtn').click();
      await expect(root).toHaveAttribute('data-theme', other);
      await expect(meta).toHaveAttribute('content', other === 'dark' ? '#0A0B18' : '#FFF8EE');
      expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe(other);
      await expect.poll(bg).not.toBe(systemBg);

      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('data-theme', other);

      // Switching back to the system's scheme clears the override (follow the system again)
      await page.locator('#themeBtn').click();
      await expect(page.locator('html')).not.toHaveAttribute('data-theme', /./);
      expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('');
      await page.reload();
      await expect(page.locator('html')).not.toHaveAttribute('data-theme', /./);
      await expect.poll(bg).toBe(systemBg);
    });
  }

  test('Bolt talks when clicked, in both modes', async ({ page }) => {
    await page.goto('/');
    await page.locator('#bot').click();
    await expect(page.locator('#bubble')).toHaveText(/Bolt|route|token|guardrail|Brain Lab|kid/);
    await page.locator('#modeToggle').click();
    await page.locator('#bot').click();
    await expect(page.locator('#bubble')).toHaveClass(/show/);
  });

  test('"How to say it" shows the pronunciation', async ({ page }) => {
    await page.goto('/');
    await page.locator('#sayName').click();
    await expect(page.locator('#bubble')).toHaveText("It's MAA-dhuv.");
  });

  test('logo clicked five times unlocks the easter egg', async ({ page }) => {
    await page.goto('/');
    const logo = page.locator('#logo');
    for (let i = 0; i < 5; i++) await logo.click();
    await expect(page.locator('#bubble')).toHaveText(/Easter egg|secret party/);
  });

  test('music player starts, changes track and stops (generated audio, no files)', async ({ page }) => {
    await page.goto('/');
    const play = page.locator('#musicBtn');
    await play.click();
    await expect(play).toHaveAttribute('aria-pressed', 'true');
    const first = await page.locator('#trackName').textContent();
    await page.locator('#nextTrack').click();
    await expect(page.locator('#trackName')).not.toHaveText(first || '');
    await play.click();
    await expect(play).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#trackName')).toHaveText('Music');
  });

  test('footer shows the current year', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#yr')).toHaveText(String(new Date().getFullYear()));
  });

  test('profile images and fonts load', async ({ page, request }) => {
    await page.goto('/');
    const img = page.locator('.portrait img');
    await expect(img).toBeVisible();
    expect(await img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
    for (const f of ['fredoka-latin-600-normal', 'fredoka-latin-700-normal', 'nunito-sans-latin-wght-normal', 'space-grotesk-latin-wght-normal', 'jetbrains-mono-latin-500-normal']) {
      const r = await request.get(`/assets/fonts/${f}.woff2`);
      expect(r.status(), f).toBe(200);
    }
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.fonts.check('600 16px Fredoka'))).toBe(true);
  });
});
