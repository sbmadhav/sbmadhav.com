import { test, expect, isHttps, type Page } from './fixtures';

/* Content-Security-Policy. site-build.py writes a <meta http-equiv="Content-Security-Policy"> into
   every published page, with the sha256 of each inline script. These tests use the pages the way a
   visitor does and fail on any securitypolicyviolation event.

   The policy exists only in the build, so run them against the live site or a local build:
     python3 site-build.py --out _site && node e2e/local-server.mjs 8123 _site
     BASE_URL=http://localhost:8123 npx playwright test csp
   Served from the plain checkout (no policy) they skip, except on https, where the policy must be there. */

type Violation = { directive: string; blocked: string; sample: string; source: string };

/** Records every CSP violation on the page, from the first script on (before the page's own). */
async function watchViolations(page: Page) {
  await page.addInitScript(() => {
    const w = window as any;
    w.__csp = [];
    document.addEventListener('securitypolicyviolation', (e: SecurityPolicyViolationEvent) => {
      w.__csp.push({ directive: e.effectiveDirective || e.violatedDirective, blocked: e.blockedURI, sample: e.sample, source: `${e.sourceFile}:${e.lineNumber}` });
    });
  });
  const console: string[] = [];
  // Some violations (a blocked worker or frame) are reported only in the console
  page.on('console', m => { if (/Content.Security.Policy|Refused to/i.test(m.text())) console.push(m.text()); });
  return {
    console,
    list: () => page.evaluate(() => (window as any).__csp as Violation[]),
  };
}

/** The page's policy, or skips the test when the page has none and is a plain local checkout. */
async function policy(page: Page, baseURL?: string) {
  const meta = page.locator('meta[http-equiv="Content-Security-Policy"]');
  if (!isHttps(baseURL) && await meta.count() === 0) test.skip(true, 'No CSP in the unbuilt source: serve a build (node e2e/local-server.mjs 8123 _site)');
  await expect(meta, 'the build adds a CSP <meta> to every page').toHaveCount(1);
  return (await meta.getAttribute('content'))!;
}

/** Loads the vendored count.js the way analytics.js does (analytics is off on localhost), and sends
    one request of each kind GoatCounter's beacon uses. The fixtures answer goatcounter.com locally, and
    a request without a path is never counted, so nothing reaches the real counter. */
async function exerciseAnalytics(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = '/assets/count.js';
    s.dataset.goatcounter = 'https://sbmadhav.goatcounter.com/count';
    s.dataset.goatcounterSettings = '{"no_onload": true}';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('count.js did not load'));
    document.head.appendChild(s);
  }));
  await page.evaluate(() => {
    navigator.sendBeacon('https://sbmadhav.goatcounter.com/count?e2e=csp');
    const img = new Image();
    img.src = 'https://sbmadhav.goatcounter.com/count?e2e=csp-img';
  });
}

test.describe('Content-Security-Policy', () => {
  test('home page: splash, games, Explore menu, kid mode and themes run with no violations', async ({ page, baseURL }) => {
    const v = await watchViolations(page);
    await page.goto('/', { waitUntil: 'load' });
    const csp = await policy(page, baseURL);
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toContain('gc.zgo.at');
    expect(csp).not.toContain("'unsafe-eval'");
    await expect(page.locator('meta[name="referrer"]')).toHaveAttribute('content', 'strict-origin-when-cross-origin');
    await expect(page.locator('html')).toHaveClass(/ready/); // the hashed splash script ran

    await page.locator('#themeBtn').click();
    await page.locator('#modeToggle').click();
    await expect(page.locator('body')).toHaveClass(/kidmode/);
    await page.locator('#modeToggle').click();

    // Brain Lab (builds markup with style attributes)
    await page.goto('/#lab');
    await page.locator('#chips .chip').first().click();
    await expect(page.locator('#answer')).not.toBeEmpty();

    // Bug Hunt
    await page.goto('/#bugs');
    await page.locator('#gameMusicBtn').click();
    await page.locator('#startBtn').click();
    await page.waitForTimeout(800);

    // Explore menu
    await page.locator('#exploreBtn').click();
    await expect(page.locator('dialog.xpm')).toBeVisible();
    await page.keyboard.press('Escape');

    await exerciseAnalytics(page);
    await page.waitForTimeout(2500); // idle work: service worker registration, analytics
    expect(await v.list(), 'securitypolicyviolation events').toEqual([]);
    expect(v.console, 'CSP console messages').toEqual([]);
  });

  test('404 page runs with no violations', async ({ page, baseURL }) => {
    const v = await watchViolations(page);
    await page.goto('/no-such-page-e2e/csp', { waitUntil: 'load' });
    await policy(page, baseURL);
    await expect(page.locator('#missing code')).toHaveText('/no-such-page-e2e/csp'); // the hashed 404 script ran
    await page.emulateMedia({ colorScheme: 'light' });
    await page.locator('#themeBtn').click(); // the design system's header.js, same origin
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.locator('#exploreBtn').click();
    await expect(page.locator('dialog.xpm')).toBeVisible();
    await page.waitForTimeout(1500);
    expect(await v.list(), 'securitypolicyviolation events').toEqual([]);
    expect(v.console, 'CSP console messages').toEqual([]);
  });

  test('the probe catches a violation (negative control)', async ({ page, baseURL }) => {
    const v = await watchViolations(page);
    await page.goto('/', { waitUntil: 'load' });
    await policy(page, baseURL);
    await page.evaluate(() => { const s = document.createElement('script'); s.textContent = 'window.__inline = 1'; document.body.appendChild(s); });
    await expect.poll(async () => (await v.list()).map(x => x.directive).join(' ')).toMatch(/script-src/);
    expect(await page.evaluate(() => (window as any).__inline)).toBeUndefined();
  });
});
