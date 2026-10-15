import { test, expect, openExplore } from './fixtures';
import type { Page } from '@playwright/test';

/* WCAG 2.1 AA checks that axe cannot make on its own: Pause motion (2.2.2), reflow at 320px (1.4.10),
   text spacing (1.4.12), the skip link (2.4.1), names that survive narrow layouts (4.1.2) and
   the contrast of a text field border (1.4.11). */

const SPACING = '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}';

/** Running CSS animations that loop or last longer than 5 s (the ones 2.2.2 is about). */
const loopingAnimations = (page: Page) => page.evaluate(() => document.getAnimations()
  .filter(a => a.playState === 'running')
  .filter(a => { const t = a.effect!.getTiming(); return t.iterations === Infinity || (Number(t.duration) * Number(t.iterations)) > 5000; })
  .length);

/** True when the space backdrop canvas changes over half a second. */
const starsMoving = (page: Page) => page.evaluate(async () => {
  const c = document.getElementById('stars') as HTMLCanvasElement;
  const a = c.toDataURL();
  await new Promise(r => setTimeout(r, 500));
  return a !== c.toDataURL();
});

/** Width of the page beyond the viewport, in CSS pixels (0 when nothing scrolls sideways). */
const sideways = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.describe('Pause motion (Explore menu)', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('stops the home page loops and the starfield, persists, and resumes', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await expect.poll(() => loopingAnimations(page)).toBeGreaterThan(0);
    await expect.poll(() => starsMoving(page), { timeout: 15_000 }).toBe(true);

    const dlg = await openExplore(page);
    const pause = dlg.getByRole('button', { name: 'Pause motion' });
    await expect(pause).toHaveAttribute('aria-pressed', 'false');
    await pause.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveClass(/motion-paused/);
    await page.keyboard.press('Escape');
    expect(await loopingAnimations(page)).toBe(0);
    await expect.poll(() => starsMoving(page)).toBe(false);
    expect(await page.evaluate(() => localStorage.getItem('motion'))).toBe('paused');

    // Remembered: the class is on <html> before the page paints, and nothing loops after a reload
    await page.reload({ waitUntil: 'load' });
    await expect(page.locator('html')).toHaveClass(/motion-paused/);
    await expect(page.locator('#splash')).toBeHidden();
    await page.waitForTimeout(1500);
    expect(await loopingAnimations(page)).toBe(0);
    expect(await starsMoving(page)).toBe(false);

    // Resume
    const dlg2 = await openExplore(page);
    await expect(dlg2.getByRole('button', { name: 'Pause motion' })).toHaveAttribute('aria-pressed', 'true');
    await dlg2.getByRole('button', { name: 'Pause motion' }).click();
    await page.keyboard.press('Escape');
    await expect(page.locator('html')).not.toHaveClass(/motion-paused/);
    await expect.poll(() => starsMoving(page)).toBe(true);
    expect(await page.evaluate(() => localStorage.getItem('motion'))).toBeNull();
  });

  test('stops Bolt on the 404 page', async ({ page }) => {
    await page.goto('/no-such-page-e2e/', { waitUntil: 'load' });
    await expect.poll(() => loopingAnimations(page)).toBeGreaterThan(0);
    const dlg = await openExplore(page);
    await dlg.getByRole('button', { name: 'Pause motion' }).click();
    await page.keyboard.press('Escape');
    expect(await loopingAnimations(page)).toBe(0);
  });

  test('kid mode wording', async ({ page }) => {
    await page.goto('/?kid');
    const dlg = await openExplore(page);
    await expect(dlg.getByRole('button', { name: 'Stop the wiggles' })).toBeVisible();
  });
});

test.describe('Skip link', () => {
  test('is the first stop on the home page and moves focus to the main content', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Safari does not move focus to links with Tab by default');
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page.locator('main#main')).toBeFocused();
  });
});

test.describe('Narrow screens (320px) and text spacing', () => {
  for (const path of ['/', '/no-such-page-e2e/']) {
    test(`${path} has no horizontal scroll at 320px, with or without the text spacing override`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 720 });
      await page.goto(path, { waitUntil: 'load' });
      const kid = page.locator('#modeToggle, #kidBtn');
      expect(await sideways(page)).toBe(0);
      let box = await kid.boundingBox();
      expect(box!.x + box!.width).toBeLessThanOrEqual(320);
      await page.addStyleTag({ content: SPACING });
      expect(await sideways(page)).toBe(0);
      box = await kid.boundingBox();
      expect(box!.x + box!.width).toBeLessThanOrEqual(320);
      // Nothing in the Brain Lab is pushed past the edge (overflow would be clipped, not scrollable)
      if (path === '/') {
        const over = await page.locator('main').evaluate(m => [...m.querySelectorAll('*')].filter(e => e.getBoundingClientRect().right > 322 && !e.closest('[aria-hidden="true"]')).length);
        expect(over).toBe(0);
      }
    });
  }

  test('the 404 kid mode switch keeps its name when its label is hidden on phones', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 720 });
    await page.goto('/no-such-page-e2e/');
    await expect(page.getByRole('switch', { name: 'Kid mode' })).toBeVisible();
  });
});

test.describe('Controls', () => {
  test('the Brain Lab text field border uses the edge token (3:1), not the faint line', async ({ page }) => {
    await page.goto('/');
    const [border, edge] = await page.locator('#askInput').evaluate(el => {
      const probe = document.createElement('i'); probe.style.color = 'var(--edge)'; document.body.append(probe);
      const want = getComputedStyle(probe).color; probe.remove();
      return [getComputedStyle(el).borderTopColor, want];
    });
    expect(border).toBe(edge);
  });

  test('the Design Lab scenario buttons are a labelled group', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('group', { name: 'Scenarios' })).toHaveCount(1);
  });
});
