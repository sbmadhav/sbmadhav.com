import { test, expect } from './fixtures';

test.describe('Brain Lab', () => {
  test('a sample question routes to an agent and writes an answer', async ({ page }) => {
    await page.goto('/#lab');
    const chips = page.locator('#chips .chip');
    await expect(chips).toHaveCount(4);
    await chips.first().click();
    await expect(chips.first()).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#thought')).toContainText('route: "billing"');
    await expect(page.locator('.lane.pick')).toHaveText('Billing agent');
    await expect(page.locator('#answer')).toContainText('refund');
  });

  test('a typed question is routed by keyword', async ({ page }) => {
    await page.goto('/#lab');
    await page.locator('#askInput').fill('I am really upset about this');
    await page.locator('#askForm button[type="submit"]').click();
    await expect(page.locator('.lane.pick')).toHaveText('Care agent');
    await expect(page.locator('#answer')).toContainText('opened a case');
    await expect(page.locator('#askInput')).toHaveValue('');
  });

  test('kid mode has kid questions and does the math', async ({ page }) => {
    await page.goto('/?kid#lab');
    await expect(page.locator('#chips .chip').first()).toHaveText('Tell me a joke!');
    await page.locator('#askInput').fill('what is 7 + 6');
    await page.locator('#askForm button[type="submit"]').click();
    await expect(page.locator('.lane.pick')).toHaveText('Math helper');
    await expect(page.locator('#answer')).toContainText('7 + 6 = 13');
  });
});

test.describe('Bug Hunt', () => {
  test('start, squash a bug, and the round ends with a saved best score', async ({ page }) => {
    await page.clock.install();
    await page.goto('/#bugs');
    await page.locator('#gameMusicBtn').click(); // game music off: no audio needed for the test
    await expect(page.locator('#gameMusicState')).toHaveText('Off');
    await page.locator('#startBtn').click();
    await expect(page.locator('#overlay')).toBeHidden();
    await page.clock.runFor(1000);
    const bug = page.locator('#arena .bug:not(.squash)').first();
    await expect(bug).toBeAttached();
    await bug.dispatchEvent('pointerdown');
    await expect(page.locator('#score')).toHaveText('1');
    await page.clock.runFor(21_000);
    await expect(page.locator('#overlay')).toBeVisible();
    await expect(page.locator('#ovTitle')).toContainText(/bugs? fixed/);
    await expect(page.locator('#startBtn')).toHaveText('Play again');
    expect(Number(await page.evaluate(() => localStorage.getItem('bugBest')))).toBeGreaterThanOrEqual(1);
    await expect(page.locator('#best')).not.toHaveText('0');
  });
});

test.describe('Design Lab (grown-up mode)', () => {
  test('pick blocks within budget, launch, and read the post-mortem', async ({ page }) => {
    await page.goto('/#play');
    await expect(page.locator('#sdTabs .chip')).toHaveCount(3);
    await expect(page.locator('#sdTitle')).toHaveText('The Ticket Drop');
    await expect(page.locator('#sdLaunch')).toBeDisabled();
    for (const id of ['queue', 'locks', 'bots', 'cdn']) await page.locator(`.sdc[data-id="${id}"]`).click();
    await expect(page.locator('#sdSpent')).toHaveText('8');
    // The 4-credit option no longer fits the 10-credit budget
    await expect(page.locator('.sdc[data-id="bigdb"]')).toBeDisabled();
    await page.locator('#sdLaunch').click();
    await expect(page.locator('#sdResult .sd-score')).toBeVisible();
    await expect(page.locator('#sdResult h3')).toHaveText(/launch|Incident/i);
    await expect(page.locator('#sdResult .pm li').first()).toBeVisible();
  });

  test('switching scenario and reset clear the picks', async ({ page }) => {
    await page.goto('/#play');
    await page.locator('.sdc').first().click();
    await page.locator('#sdTabs .chip', { hasText: 'The Bank Voice Agent' }).click();
    await expect(page.locator('#sdTitle')).toHaveText('The Bank Voice Agent');
    await expect(page.locator('#sdSpent')).toHaveText('0');
    await page.locator('.sdc').first().click();
    await page.locator('#sdReset').click();
    await expect(page.locator('#sdSpent')).toHaveText('0');
    await expect(page.locator('#sdLaunch')).toBeDisabled();
  });
});

test.describe('Robot Maze (kid mode)', () => {
  test('level 1: four Forward blocks reach the star and unlock level 2', async ({ page }) => {
    await page.goto('/?kid#play');
    await expect(page.locator('#mazeLevel')).toHaveText('Level 1 of 5');
    const fwd = page.locator('.palette button[data-k="F"]');
    for (let i = 0; i < 4; i++) await fwd.click();
    await expect(page.locator('#blockCount')).toHaveText('4/16');
    await page.locator('#runBtn').click();
    await expect(page.locator('#mazeMsg')).toContainText('You did it in 4 blocks', { timeout: 15_000 });
    await expect(page.locator('#nextLevelBtn')).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('mazeUnlocked'))).toBe('1');
    await page.locator('#nextLevelBtn').click();
    await expect(page.locator('#mazeLevel')).toHaveText('Level 2 of 5');
  });

  test('a short program stops before the star; undo and clear edit the program', async ({ page }) => {
    await page.goto('/?kid#play');
    await page.locator('.palette button[data-k="F"]').click();
    await page.locator('.palette button[data-k="L"]').click();
    await expect(page.locator('#program .pblock')).toHaveCount(2);
    await page.locator('#undoBtn').click();
    await expect(page.locator('#program .pblock')).toHaveCount(1);
    await page.locator('#runBtn').click();
    await expect(page.locator('#mazeMsg')).toContainText('So close', { timeout: 10_000 });
    await page.locator('#clearBtn').click();
    await expect(page.locator('#program .pblock')).toHaveCount(0);
    await expect(page.locator('#runBtn')).toBeDisabled();
  });

  test('walking off the board is caught', async ({ page }) => {
    await page.goto('/?kid#play');
    await page.locator('.palette button[data-k="L"]').click();
    for (let i = 0; i < 3; i++) await page.locator('.palette button[data-k="F"]').click();
    await page.locator('#runBtn').click();
    await expect(page.locator('#mazeMsg')).toContainText('off the board', { timeout: 10_000 });
  });
});

test.describe('Journey', () => {
  test('levels are tabs that show their details, in both modes', async ({ page }) => {
    await page.goto('/#journey');
    const levels = page.locator('#levels .level');
    await expect(levels).toHaveCount(6);
    await expect(levels.nth(4)).toHaveAttribute('aria-selected', 'true'); // current level by default
    await levels.nth(0).click();
    await expect(levels.nth(0)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#detail h3')).toHaveText('Consulting');
    await expect(page.locator('#detail li')).toHaveCount(3);
    await page.locator('#modeToggle').click();
    await expect(page.locator('#detail h3')).toHaveText('Problem Solvers');
    await expect(levels.nth(2).locator('.nm')).toHaveText('Sneaker World');
  });
});

test.describe('Say hi', () => {
  test('LinkedIn and GitHub links open in a new tab and point at the right profiles', async ({ page, request }) => {
    await page.goto('/#hello');
    const li = page.locator('#hello a', { hasText: 'LinkedIn' });
    const gh = page.locator('#hello a', { hasText: 'GitHub' });
    await expect(li).toHaveAttribute('href', 'https://www.linkedin.com/in/sbmadhav/');
    await expect(gh).toHaveAttribute('href', 'https://github.com/sbmadhav');
    for (const a of [li, gh]) {
      await expect(a).toHaveAttribute('target', '_blank');
      await expect(a).toHaveAttribute('rel', /noopener/);
    }
    // GitHub answers bots; LinkedIn blocks them (999), so only GitHub is fetched
    expect((await request.get('https://github.com/sbmadhav')).status()).toBe(200);
  });
});
