import AxeBuilder from '@axe-core/playwright';
import { test, expect, openExplore } from './fixtures';
import type { Page } from '@playwright/test';

/* Basic accessibility pass with axe-core: fails on serious or critical violations.
   Known issues on the live site are recorded in KNOWN with test.fixme and a note, not hidden. */

async function serious(page: Page, include?: string) {
  let axe = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);
  if (include) axe = axe.include(include);
  const { violations } = await axe.analyze();
  return violations
    .filter(v => v.impact === 'serious' || v.impact === 'critical')
    .map(v => `${v.impact} ${v.id}: ${v.help} -> ${v.nodes.slice(0, 5).map(n => n.target.join(' ')).join(' | ')}`);
}

const SCENARIOS: { name: string; path: string; scheme: 'light' | 'dark'; kid?: boolean; menu?: boolean }[] = [
  { name: 'home, Daybreak', path: '/', scheme: 'light' },
  { name: 'home, Deep Space', path: '/', scheme: 'dark' },
  { name: 'home, kid mode', path: '/?kid', scheme: 'light', kid: true },
  { name: 'Explore menu open', path: '/', scheme: 'light', menu: true },
  { name: 'Explore menu open, Deep Space', path: '/', scheme: 'dark', menu: true },
  { name: '404 page', path: '/no-such-page-e2e/', scheme: 'light' },
  { name: '404 page, Deep Space', path: '/no-such-page-e2e/', scheme: 'dark' },
];

// Violations seen on the live site when this suite was written. Each entry is a real bug to fix;
// remove it from this list once fixed so the test guards it again.
const KNOWN: Record<string, string> = {
  'home, kid mode': 'Known issue (live, 2026-10-14): serious aria-prohibited-attr on #mazeBoard. The Robot Maze board is a <div aria-label="Maze board"> with no role, so the label is not allowed. Fix: give it role="img" or role="group" (or drop the aria-label).',
};

test.describe('Accessibility (axe, serious and critical)', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'chromium', 'axe runs once, in Chromium'));

  for (const s of SCENARIOS) {
    test(s.name, async ({ page }) => {
      test.fixme(!!KNOWN[s.name], KNOWN[s.name]);
      await page.emulateMedia({ colorScheme: s.scheme, reducedMotion: 'reduce' });
      await page.goto(s.path, { waitUntil: 'load' });
      await page.waitForTimeout(800);
      if (s.menu) {
        await openExplore(page);
        await page.locator('#xpInstall').click();
        expect(await serious(page, 'dialog.xpm')).toEqual([]);
      } else {
        // Reveal-on-scroll content: scroll through so every section is in its final state
        await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 30)); } scrollTo(0, 0); });
        expect(await serious(page)).toEqual([]);
      }
    });
  }
});
