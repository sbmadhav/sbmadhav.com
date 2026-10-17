import { test, expect } from './fixtures';

/* The shared site header from the design system (pinned release DS below). Pages compose it at build time from
   /design-system/v/<DS>/header.html with compose.py and keep only their slots (brand, nav, music, end). */
const DS = '2.1.0';
const PAGES = [
  { name: 'home page', path: '/', nav: 5, music: true, end: '#modeToggle' },
  { name: '404 page', path: '/no-such-page-e2e/', nav: 0, music: false, end: '#kidBtn' },
];

/** The md-header block of a page's source with every slot emptied, so only the shared part is compared */
const shared = (html: string) => {
  const m = html.match(/<header class="md-header[\s\S]*?<\/header>/);
  return (m ? m[0] : '').replace(/<!-- slot:([\w-]+) -->[\s\S]*?<!-- \/slot:\1 -->/g, '<!-- slot:$1 -->').trim();
};

for (const p of PAGES) {
  test.describe(`Shared header: ${p.name}`, () => {
    test(`is the pinned design system ${DS} header, with this page's slots`, async ({ page, request }) => {
      const partial = await (await request.get(`/design-system/v/${DS}/header.html`)).text();
      const source = await (await request.get(p.path)).text();
      expect(shared(source), 'everything outside the slots matches header.html').toBe(shared(partial));

      await page.goto(p.path);
      const header = page.locator('header.md-header');
      await expect(header).toHaveCount(1);
      await expect(header.locator('a.md-brand')).toHaveAttribute('href', '/');
      await expect(header.getByRole('link', { name: 'Madhav, home' })).toBeVisible();
      await expect(header.locator('#exploreBtn.xp-btn')).toBeVisible();
      await expect(header.locator('#themeBtn.md-theme')).toBeVisible();
      await expect(header.locator('.md-nav a')).toHaveCount(p.nav);
      await expect(header.locator('.md-music')).toHaveCount(p.music ? 1 : 0);
      await expect(header.locator(`.md-header-end ${p.end}.md-switch[role="switch"]`)).toBeVisible();
      await expect(page.locator('.md-modes'), 'the old System / Daybreak / Deep Space picker is gone').toHaveCount(0);
    });

    test(`links the pinned ${DS} tokens, components and header.js, never the unversioned latest`, async ({ page }) => {
      await page.goto(p.path);
      const refs = await page.evaluate(() => [...document.querySelectorAll('link[rel="stylesheet"], script[src]')]
        .map(e => new URL((e as HTMLLinkElement).href || (e as HTMLScriptElement).src).pathname.replace(/\?.*$/, ''))
        .filter(u => u.startsWith('/design-system/')));
      expect(refs).toEqual([`/design-system/v/${DS}/tokens.css`, `/design-system/v/${DS}/components.css`, `/design-system/v/${DS}/header.js`]);
      // Subresource Integrity: each pinned file carries the sha384 of the published file (a wrong hash would block it)
      const sri = await page.evaluate(() => [...document.querySelectorAll('link[href*="/design-system/v/"], script[src*="/design-system/v/"]')]
        .map(e => ({ crossorigin: e.getAttribute('crossorigin'), integrity: /^sha384-[A-Za-z0-9+/]{64}$/.test(e.getAttribute('integrity') || '') })));
      expect(sri).toEqual(Array(3).fill({ crossorigin: 'anonymous', integrity: true }));
      expect(await page.evaluate(() => typeof (window as any).siteTheme?.get), 'header.js ran').toBe('function');
      // The type comes from the tokens: body text is the body style (17px)
      expect(await page.evaluate(() => getComputedStyle(document.body).fontSize)).toBe('17px');
    });

    for (const system of ['light', 'dark'] as const) {
      test(`the sun/moon button switches from the ${system} system scheme and is remembered`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: system });
        await page.goto(p.path);
        const other = system === 'light' ? 'dark' : 'light';
        const btn = page.locator('#themeBtn');
        await expect(btn).toHaveAttribute('aria-label', other === 'dark' ? 'Switch to Deep Space (dark) scheme' : 'Switch to Daybreak (light) scheme');
        await btn.click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', other);
        await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', other === 'dark' ? '#0F1218' : '#F6F7F9');
        expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe(other);
        await page.reload();
        await expect(page.locator('html')).toHaveAttribute('data-theme', other);
        await page.locator('#themeBtn').click();
        await expect(page.locator('html')).not.toHaveAttribute('data-theme', /./);
      });
    }

    test('fits from 320 to 1440px: no sideways scroll, no clipped section links', async ({ page }, info) => {
      test.skip(info.project.name === 'mobile', 'Sets its own viewport sizes');
      for (const width of [320, 375, 600, 1024, 1180, 1181, 1280, 1440]) {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(p.path);
        const r = await page.evaluate(() => {
          const inner = document.querySelector('.md-header-in')!;
          const edge = inner.getBoundingClientRect().right - parseFloat(getComputedStyle(inner).paddingRight);
          const nav = inner.querySelector<HTMLElement>('.md-nav');
          return {
            sideways: document.documentElement.scrollWidth - innerWidth,
            pastEdge: [...inner.querySelectorAll<HTMLElement>('a, button')].filter(e => e.offsetParent && e.getBoundingClientRect().right > edge + 0.5).length,
            navClipped: nav && nav.offsetParent ? nav.scrollWidth - nav.clientWidth : 0,
          };
        });
        expect(r, `${width}px`).toEqual({ sideways: 0, pastEdge: 0, navClipped: 0 });
      }
    });
  });
}
