/* Adaptive difficulty for the games.
   Every game has one difficulty dial from 1 (a first counting game) to 20 (hard enough for strong adults).
   A right answer turns it up, a miss turns it down, so each player settles where they get about 3 in 4 right.
   Points are weighted by difficulty, so scores compare fairly across players working at different levels.
   The dial each player reaches is saved per game as their rating and becomes their next starting point. */
import * as store from './store.js';

export const DMIN = 1, DMAX = 20;
/* Where a first-time player starts, by play mode */
export const START = { explorer: 1, challenger: 5, pro: 9 };
/* Points for one right answer at difficulty d: 10 at d1, 143 at d20 */
export const pointsAt = d => 10 + 7 * (Math.max(DMIN, Math.min(DMAX, Math.round(d))) - 1);
/* Level n (1 to 72) starts at this difficulty */
export const levelStart = (n, perGame = 72) => Math.min(DMAX, 1 + Math.round(((n - 1) * (DMAX - 1)) / (perGame - 1)));
export const levelForDifficulty = (d, perGame = 72) => 1 + Math.round(((Math.max(DMIN, Math.min(DMAX, d)) - 1) * (perGame - 1)) / (DMAX - 1));

export const rating = (gameId, mode) => store.rating('game:' + gameId) || START[mode] || START.challenger;

export class Dial {
  constructor(start, { floor = DMIN, ceil = DMAX } = {}) {
    this.floor = Math.max(DMIN, floor); this.ceil = Math.min(DMAX, ceil);
    this.d = this.clamp(start); this.peak = this.d; this.n = 0; this.right = 0; this.streak = 0; this.points = 0;
    this.seen = new Set(); this.history = [];
  }
  clamp(v) { return Math.max(this.floor, Math.min(this.ceil, v)); }
  /* Current whole-number level for generators */
  get lv() { return Math.round(this.d); }
  /* Record an answer. Returns the points earned (0 for a miss). */
  hit(ok) {
    const before = this.lv, pts = ok ? pointsAt(before) : 0;
    this.n++; this.history.push(before);
    if (ok) {
      this.right++; this.streak++; this.points += pts;
      // Climb fast while finding the right level (first five answers), then by streak
      this.d = this.clamp(this.d + (this.n <= 5 ? 1.5 : this.streak >= 3 ? 1 : 0.6));
    } else {
      this.streak = 0;
      this.d = this.clamp(this.d - (this.n <= 5 ? 2 : 1.4));
    }
    this.peak = Math.max(this.peak, this.d);
    return pts;
  }
  /* Draw a question that has not appeared yet this round: gen() returns [key, question]. */
  fresh(gen, tries = 40) {
    let last;
    for (let i = 0; i < tries; i++) { last = gen(); if (!this.seen.has(last[0])) { this.seen.add(last[0]); return last[1]; } }
    return last[1];
  }
  /* Trend arrow for the UI */
  get trend() { const h = this.history; return h.length < 2 ? 0 : Math.sign(this.lv - h[h.length - 1]); }
  /* The level the player held over the round, weighted toward the end */
  settled() {
    if (!this.history.length) return this.d;
    let w = 0, s = 0; this.history.concat(this.lv).forEach((v, i) => { const k = 1 + i; w += k; s += v * k; });
    return Math.round((s / w) * 10) / 10;
  }
}

/* Save the round's settled level as the player's new rating for that game (a moving average, so one bad round does not erase progress) */
export function saveRating(gameId, dial) {
  if (dial.n < 4) return store.rating('game:' + gameId);
  const prev = store.rating('game:' + gameId), now = dial.settled();
  const next = prev ? Math.round((prev * 0.4 + now * 0.6) * 10) / 10 : now;
  store.setRating('game:' + gameId, next);
  return next;
}
