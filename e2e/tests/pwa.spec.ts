import { test, expect, isHttps } from './fixtures';
import type { Page } from '@playwright/test';

/* The root service worker (sw.js): registers from the home page, makes it work offline,
   and leaves /vedic-math/ and /state-of-voice-agents/ (other repos) to the network.
   Chromium only: Playwright reports service-worker responses and offline mode reliably there.
   Needs https (the home page registers the worker only on https). */

test.describe('Service worker and offline', () => {
  test.beforeEach(({ baseURL }, info) => {
    test.skip(info.project.name !== 'chromium', 'Service worker checks run in Chromium');
    test.skip(!isHttps(baseURL), 'The home page registers its service worker only on https');
  });

  async function controlled(page: Page) {
    await page.goto('/', { waitUntil: 'load' });
    // Registration waits for load + idle; then the worker installs (precache) and claims the page
    await expect.poll(() => page.evaluate(async () => {
      const r = await navigator.serviceWorker.getRegistration('/');
      return r?.active?.state || 'none';
    }), { timeout: 30_000 }).toBe('activated');
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 15_000 }).toBe(true);
  }

  test('registers with scope / and precaches the site', async ({ page }) => {
    await controlled(page);
    const scope = await page.evaluate(async () => (await navigator.serviceWorker.getRegistration('/'))?.scope);
    expect(scope).toMatch(/\/$/);
    expect(new URL(scope!).pathname).toBe('/');
    const caches = await page.evaluate(async () => {
      const keys = await caches.keys();
      const mine = keys.filter(k => k.startsWith('madhav-'));
      const entries = mine.length ? (await (await caches.open(mine[0])).keys()).map(r => new URL(r.url).pathname) : [];
      return { mine, entries };
    });
    expect(caches.mine).toHaveLength(1);
    expect(caches.entries).toEqual(expect.arrayContaining(['/', '/index.html', '/assets/profile.webp', '/manifest.webmanifest', '/design-system/tokens.css']));
  });

  test('the home page reloads offline', async ({ page, context }) => {
    await controlled(page);
    await page.reload({ waitUntil: 'load' }); // this navigation goes through the worker and is cached
    await context.setOffline(true);
    try {
      const res = await page.reload({ waitUntil: 'load' });
      expect(res?.fromServiceWorker()).toBe(true);
      await expect(page.locator('h1')).toContainText('Madhav');
      await expect(page.locator('#exploreBtn')).toBeVisible();
      // Kid mode still works offline
      await page.locator('#modeToggle').click();
      await expect(page.locator('body')).toHaveClass(/kidmode/);
    } finally {
      await context.setOffline(false);
    }
  });

  test('a page never visited shows the offline page when offline', async ({ page, context }) => {
    await controlled(page);
    await context.setOffline(true);
    try {
      const res = await page.goto('/never-visited-e2e/');
      expect(res?.status()).toBe(503);
      await expect(page.locator('h1')).toHaveText('You are offline');
      await expect(page.locator('a[href="/"]')).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
  });

  test('leaves /vedic-math/ and /state-of-voice-agents/ to the network', async ({ page, context }) => {
    await controlled(page);
    for (const path of ['/vedic-math/', '/state-of-voice-agents/']) {
      const res = await page.goto(path, { waitUntil: 'load' });
      expect(res?.status(), path).toBe(200);
      expect(res?.fromServiceWorker(), `${path} must not come from the root worker`).toBe(false);
    }
    // Nothing from those paths ends up in the root worker's cache
    const leaked = await page.evaluate(async () => {
      const out: string[] = [];
      for (const k of (await caches.keys()).filter(k => k.startsWith('madhav-'))) {
        for (const r of await (await caches.open(k)).keys()) {
          const p = new URL(r.url).pathname;
          if (p.startsWith('/vedic-math') || p.startsWith('/state-of-voice-agents')) out.push(p);
        }
      }
      return out;
    });
    expect(leaked).toEqual([]);
    // And offline, the root worker does not pretend to serve them
    await context.setOffline(true);
    try {
      const res = await page.goto('/state-of-voice-agents/').catch(() => null);
      expect(res === null || !res.fromServiceWorker()).toBe(true);
    } finally {
      await context.setOffline(false);
    }
  });
});
