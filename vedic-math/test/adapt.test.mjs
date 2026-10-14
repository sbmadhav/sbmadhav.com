/* Adaptive difficulty: the dial moves the right way, points weight difficulty, and the question
   ladders behind the games are valid, never tie, and do not repeat within a round. */
import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.matchMedia ??= () => ({ matches: false });
globalThis.localStorage ??= { _: {}, getItem(k) { return this._[k] ?? null; }, setItem(k, v) { this._[k] = String(v); }, removeItem(k) { delete this._[k]; } };
const A = await import('../js/adapt.js');
const G = await import('../js/games.js');

test('right answers raise the dial, misses lower it, within 1 to 20', () => {
  let d = new A.Dial(9); for (let i = 0; i < 30; i++) d.hit(true); assert.equal(d.lv, 20);
  d = new A.Dial(9); for (let i = 0; i < 30; i++) d.hit(false); assert.equal(d.lv, 1);
  d = new A.Dial(10, { floor: 8 }); for (let i = 0; i < 30; i++) d.hit(false); assert.equal(d.lv, 8, 'level floor holds');
  d = new A.Dial(5); d.hit(true); assert.ok(d.lv > 5); const up = d.lv; d.hit(false); assert.ok(d.lv < up);
});

test('a steady player settles near where they get about 3 in 4 right', () => {
  // A simulated player who is right when the difficulty is at or below their true skill of 12
  const d = new A.Dial(5); for (let i = 0; i < 60; i++) d.hit(d.lv <= 12 || Math.random() < .2);
  assert.ok(d.settled() >= 10 && d.settled() <= 14, `settled at ${d.settled()}`);
});

test('points grow with difficulty, so harder rounds score more', () => {
  assert.equal(A.pointsAt(1), 10); assert.equal(A.pointsAt(20), 143);
  for (let d = 2; d <= 20; d++) assert.ok(A.pointsAt(d) > A.pointsAt(d - 1));
  const easy = new A.Dial(2, { ceil: 2 }), hard = new A.Dial(15, { floor: 15 });
  for (let i = 0; i < 10; i++) { easy.hit(true); hard.hit(true); }
  assert.ok(hard.points > easy.points * 5);
});

test('play modes start at different difficulties', () => {
  assert.ok(A.START.explorer < A.START.challenger && A.START.challenger < A.START.pro);
  assert.ok(A.rating('times-sprint', 'pro') >= 9, 'a 13-year-old in Pro mode does not start on the 2s table');
});

test('fresh() avoids repeats within a round', () => {
  const d = new A.Dial(13); const seen = new Set();
  for (let i = 0; i < 40; i++) { const q = d.fresh(() => G.timesQ(13)); const k = `${q.a}x${q.b}`; assert.ok(!seen.has(k), `repeat ${k}`); seen.add(k); }
});

test('question ladders are valid at every difficulty', () => {
  for (let lv = 1; lv <= 20; lv++) for (let i = 0; i < 200; i++) {
    const t = G.timesQ(lv)[1]; assert.ok(Number.isInteger(t.ans) && t.ans === t.a * t.b && t.ans > 0, `times ${lv}`);
    const m = G.moreQ(lv)[1]; assert.notEqual(m.va, m.vb, `more ${lv} tie ${JSON.stringify(m)}`); assert.ok(Number.isFinite(m.va) && Number.isFinite(m.vb));
    const s = G.seqQ(lv)[1]; assert.ok(Number.isFinite(s.ans) && s.shown.length >= 4, `seq ${lv}`);
    const b = G.balanceQ(lv)[1]; const strip = h => h.replace(/<[^>]+>/g, '').replace(/&minus;/g, '-').replace(/(\d)\(/g, '$1*(').replace(/(\d)x/g, '$1*x');
    const ev = e => Function('x', `return ${e}`)(b.x); assert.ok(Math.abs(ev(strip(b.L)) - ev(strip(b.R))) < 1e-9, `balance ${lv}: ${b.L} = ${b.R}, x = ${b.x}`);
  }
});

test('times sprint gets objectively harder: bigger products at the top than the bottom', () => {
  const med = lv => { const xs = Array.from({ length: 301 }, () => G.timesQ(lv)[1].ans).sort((a, b) => a - b); return xs[150]; };
  assert.ok(med(1) <= 50 && med(9) > 100 && med(20) > 10000, `${med(1)}, ${med(9)}, ${med(20)}`);
});

test('every game has a leaderboard id the rules accept', () => {
  const allowed = 'balloons|more_less|make_ten|quick_look|bonds|times_sprint|target|frac_faceoff|line_snipe|pairs|check_it|rain|sequence|balance'.split('|');
  for (const g of G.GAMES) assert.ok(allowed.includes(G.boardGame(g.id).slice(2)), g.id);
});
