import { test, expect, openExplore } from './fixtures';
import type { Page } from '@playwright/test';

/* "Install app" in the Explore menu. It must always do something sensible:
   - the browser's own install prompt when the page received beforeinstallprompt (even an early one);
   - otherwise short steps for this browser;
   - hidden when the site already runs as an installed app. */

const PAGES = ['/', '/vedic-math/', '/design-system/', '/state-of-voice-agents/', '/no-such-page-e2e/'];

const UA = {
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  macSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  firefox: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.0; rv:131.0) Gecko/20100101 Firefox/131.0',
  firefoxAndroid: 'Mozilla/5.0 (Android 14; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0',
  chrome: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
};

/** A stand-in for the browser's beforeinstallprompt event that records prompt() calls. */
async function firePrompt(page: Page, outcome: 'accepted' | 'dismissed') {
  await page.evaluate(outcome => {
    const e = new Event('beforeinstallprompt', { cancelable: true }) as any;
    (window as any).__prompts = 0;
    e.prompt = () => { (window as any).__prompts++; return Promise.resolve(); };
    e.userChoice = Promise.resolve({ outcome, platform: 'web' });
    dispatchEvent(e);
    (window as any).__defaultPrevented = e.defaultPrevented;
  }, outcome);
}

const help = (page: Page) => page.locator('#xpInstallHelp');
const installBtn = (page: Page) => page.locator('#xpInstall');

test.describe('Install app', () => {
  for (const path of PAGES) {
    test(`on ${path}: the button is visible and clicking it always does something`, async ({ page }) => {
      await page.goto(path);
      await openExplore(page);
      await expect(installBtn(page)).toBeVisible();
      await expect(installBtn(page)).toHaveAttribute('aria-expanded', 'false');
      await installBtn(page).click();
      // No prompt event in a fresh automated browser: the steps for this browser appear
      await expect(help(page)).toBeVisible();
      await expect(help(page)).toHaveText(/Add to Home Screen|Add to Dock|Install|Firefox/i);
      await expect(installBtn(page)).toHaveAttribute('aria-expanded', 'true');
      // A second click hides them again
      await installBtn(page).click();
      await expect(help(page)).toBeHidden();
    });
  }

  test('native prompt: shown on click, and the button hides once installed', async ({ page }) => {
    await page.goto('/');
    await firePrompt(page, 'accepted');
    expect(await page.evaluate(() => (window as any).__defaultPrevented)).toBe(true);
    await openExplore(page);
    await installBtn(page).click();
    expect(await page.evaluate(() => (window as any).__prompts)).toBe(1);
    await expect(installBtn(page)).toBeHidden();
    await expect(help(page)).toBeHidden();
  });

  test('native prompt dismissed: the button stays and the next click shows the steps', async ({ page }) => {
    await page.goto('/vedic-math/');
    await firePrompt(page, 'dismissed');
    await openExplore(page);
    await installBtn(page).click();
    expect(await page.evaluate(() => (window as any).__prompts)).toBe(1);
    await expect(installBtn(page)).toBeVisible();
    await installBtn(page).click();
    expect(await page.evaluate(() => (window as any).__prompts)).toBe(1); // a used prompt is never reused
    await expect(help(page)).toBeVisible();
  });

  test('an early beforeinstallprompt (before load) is not missed', async ({ page }) => {
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const e = new Event('beforeinstallprompt', { cancelable: true }) as any;
        (window as any).__prompts = 0;
        e.prompt = () => { (window as any).__prompts++; return Promise.resolve(); };
        e.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });
        dispatchEvent(e);
      });
    });
    await page.goto('/');
    await openExplore(page);
    await installBtn(page).click();
    expect(await page.evaluate(() => (window as any).__prompts)).toBe(1);
  });

  test('appinstalled hides the button', async ({ page }) => {
    await page.goto('/');
    await openExplore(page);
    await expect(installBtn(page)).toBeVisible();
    await page.evaluate(() => dispatchEvent(new Event('appinstalled')));
    await expect(installBtn(page)).toBeHidden();
  });

  test('hidden when already running as an installed app', async ({ page }) => {
    await page.addInitScript(() => {
      const mm = window.matchMedia.bind(window);
      window.matchMedia = (q: string) => /display-mode:\s*standalone/.test(q)
        ? ({ matches: true, media: q, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false } as MediaQueryList)
        : mm(q);
    });
    await page.goto('/');
    await openExplore(page);
    await expect(installBtn(page)).toBeHidden();
  });

  test.describe('steps for each browser', () => {
    const cases: [keyof typeof UA, RegExp][] = [
      ['iphone', /Share.*Add to Home Screen/],
      ['macSafari', /File.*Add to Dock/],
      ['firefox', /Firefox on computers cannot install/],
      ['firefoxAndroid', /Firefox menu.*Add to Home screen/],
      ['chrome', /browser menu.*Install/],
    ];
    for (const [ua, expected] of cases) {
      test.describe(ua, () => {
        test.use({ userAgent: UA[ua] });
        test(`shows the ${ua} steps`, async ({ page }, info) => {
          test.skip(info.project.name !== 'chromium', 'User-agent detection only; one engine is enough');
          await page.goto('/');
          await openExplore(page);
          await installBtn(page).click();
          await expect(help(page)).toHaveText(expected);
        });
      });
    }
  });

  test('the real engine gets its own steps', async ({ page, browserName }, info) => {
    test.skip(info.project.name === 'mobile', 'Covered by the user-agent cases');
    await page.goto('/');
    await openExplore(page);
    await installBtn(page).click();
    await expect(help(page)).toHaveText(browserName === 'webkit' ? /Add to Dock/ : /browser menu/);
  });

  test('kid mode wording', async ({ page }) => {
    await page.goto('/?kid');
    await openExplore(page);
    await expect(installBtn(page).locator('.kid')).toHaveText('Add to my screen');
    await installBtn(page).click();
    await expect(help(page).locator('.kid')).toBeVisible();
    await expect(help(page).locator('.pro')).toBeHidden();
  });

  test('readable in both color schemes', async ({ page }) => {
    for (const scheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto('/');
      await openExplore(page);
      await installBtn(page).click();
      const [fg, bg] = await help(page).evaluate(el => [getComputedStyle(el).color, getComputedStyle(el).backgroundColor]);
      expect(fg, scheme).not.toBe(bg);
      const dark = await page.evaluate(() => matchMedia('(prefers-color-scheme: dark)').matches);
      expect(dark).toBe(scheme === 'dark');
    }
  });
});
