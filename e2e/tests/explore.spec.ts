import { test, expect, openExplore } from './fixtures';

// Every page that loads the shared /assets/explore.js, and the repo each one lives in
const PAGES = [
  { path: '/', repo: 'sbmadhav.github.io', title: /Home/ },
  { path: '/state-of-voice-agents/', repo: 'state-of-voice-agents', title: /Voice agents/ },
  { path: '/vedic-math/', repo: 'vedic-math', title: /Vedic Math/ },
  { path: '/design-system/', repo: 'design-system', title: /Design system/ },
];
const SECTIONS = ['work', 'lab', 'bugs', 'play', 'journey', 'hello'];

test.describe('Explore menu', () => {
  test('opens and closes with the button, the close button, Esc and the backdrop', async ({ page, browserName }) => {
    await page.goto('/');
    const btn = page.locator('#exploreBtn');
    await expect(btn).toHaveAttribute('aria-haspopup', 'dialog');

    let dlg = await openExplore(page);
    await expect(dlg.locator('#xpTitle .pro')).toHaveText('Explore');
    await expect(dlg.locator('#xpTitle .kid')).toBeHidden();
    await dlg.locator('.xp-x').click();
    await expect(dlg).toBeHidden();

    dlg = await openExplore(page);
    await page.keyboard.press('Escape');
    await expect(dlg).toBeHidden();

    dlg = await openExplore(page);
    // Desktop: the panel is on the right; phones: a bottom sheet. Top-left is backdrop in both.
    await page.mouse.click(8, 8);
    await expect(dlg).toBeHidden();
    // Focus returns to the button (Safari never focuses a clicked button, so there is nothing to restore)
    if (browserName !== 'webkit') await expect(btn).toBeFocused();
  });

  test('lists every page, section and outside link', async ({ page }) => {
    await page.goto('/');
    const dlg = await openExplore(page);
    await expect(dlg.locator('.xp-page')).toHaveCount(PAGES.length);
    for (const p of PAGES) await expect(dlg.locator(`.xp-page[href="${p.path}"]`)).toContainText(p.title);
    await expect(dlg.locator('.xp-sec')).toHaveCount(SECTIONS.length);
    await expect(dlg.locator('.xp-link[href="https://www.linkedin.com/in/sbmadhav/"]')).toHaveAttribute('target', '_blank');
    await expect(dlg.locator('.xp-link[href="https://github.com/sbmadhav"]')).toHaveAttribute('target', '_blank');
  });

  test('every page link resolves with 200', async ({ request }) => {
    for (const p of PAGES) {
      const r = await request.get(p.path);
      expect(r.status(), p.path).toBe(200);
      expect(await r.text(), `${p.path} loads explore.js`).toMatch(/src="\/?assets\/explore\.js/);
    }
  });

  for (const p of PAGES) {
    test(`on ${p.path}: menu opens, "You are here" marks it, and the repo mark is right`, async ({ page, issues }) => {
      await page.goto(p.path);
      const dlg = await openExplore(page);
      const here = dlg.locator('.xp-page[aria-current="page"]');
      await expect(here).toHaveCount(1);
      await expect(here).toHaveAttribute('href', p.path);
      const afterContent = await here.evaluate(el => getComputedStyle(el, '::after').content);
      expect(afterContent).toContain('You are here');

      // Repo mark: none for this repo's own pages, a GitHub link for pages from other repos
      for (const q of PAGES) {
        const row = dlg.locator('.xp-row', { has: page.locator(`.xp-page[href="${q.path}"]`) });
        const mark = row.locator('a.xp-repo');
        if (q.repo === 'sbmadhav.github.io') { await expect(mark).toHaveCount(0); continue; }
        await expect(mark).toHaveAttribute('href', `https://github.com/sbmadhav/${q.repo}`);
        await expect(mark).toHaveAttribute('target', '_blank');
      }
      expect(issues.console.filter(m => /explore/i.test(m))).toEqual([]);
    });
  }

  test('repo mark is invisible until the row is hovered', async ({ page }) => {
    await page.goto('/');
    const hoverNone = await page.evaluate(() => matchMedia('(hover: none)').matches);
    test.skip(hoverNone, 'Touch screens show the mark faintly all the time (no hover)');
    const dlg = await openExplore(page);
    const row = dlg.locator('.xp-row').nth(2);
    const mark = row.locator('.xp-repo');
    const opacity = () => mark.evaluate(el => +getComputedStyle(el).opacity);
    await expect.poll(opacity).toBe(0);
    await row.locator('.xp-page').hover();
    await expect.poll(opacity).toBeGreaterThan(0.3);
    await mark.hover();
    await expect.poll(opacity).toBe(1);
  });

  test('section links on the home page close the menu and scroll', async ({ page }) => {
    await page.goto('/');
    for (const id of ['bugs', 'journey']) {
      const dlg = await openExplore(page);
      await expect(dlg.locator(`.xp-sec[href="#${id}"]`)).toHaveCount(1);
      await dlg.locator(`.xp-sec[href="#${id}"]`).click();
      await expect(dlg).toBeHidden();
      await expect(page.locator(`#${id}`)).toBeInViewport();
      await expect(page).toHaveURL(new RegExp(`/#${id}$`));
    }
  });

  test('section links from another page go to the home page section', async ({ page }) => {
    await page.goto('/design-system/');
    const dlg = await openExplore(page);
    await dlg.locator('.xp-sec[href="/#lab"]').click();
    await expect(page).toHaveURL(/\/#lab$/);
    await expect(page.locator('#lab')).toBeInViewport();
  });

  test('page links navigate', async ({ page }) => {
    await page.goto('/');
    const dlg = await openExplore(page);
    await dlg.locator('.xp-page[href="/design-system/"]').click();
    await expect(page).toHaveURL(/\/design-system\/$/);
    const dlg2 = await openExplore(page);
    await dlg2.locator('.xp-page[href="/"]').click();
    await expect(page.locator('h1')).toContainText('Madhav');
  });

  test('kid mode wording in the menu', async ({ page }) => {
    await page.goto('/?kid');
    const dlg = await openExplore(page);
    await expect(dlg.locator('#xpTitle .kid')).toHaveText('Star map');
    await expect(dlg.locator('#xpTitle .kid')).toBeVisible();
    await expect(dlg.locator('#xpTitle .pro')).toBeHidden();
    await expect(dlg.locator('.xp-page[href="/"] .kid').first()).toBeVisible();
    await expect(dlg.locator('.xp-sec[href="#play"]')).toContainText('Robot Maze');
  });

  test('works on the 404 page too', async ({ page }) => {
    await page.goto('/no-such-page-e2e/');
    await page.locator('#openExplore').click();
    const dlg = page.locator('dialog.xpm');
    await expect(dlg).toBeVisible();
    await expect(dlg.locator('.xp-page[aria-current]')).toHaveCount(0);
    await expect(dlg.locator('.xp-sec[href="/#hello"]')).toHaveCount(1);
  });
});
