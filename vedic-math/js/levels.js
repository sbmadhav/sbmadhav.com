/* Numbered levels: 1,050 Dojo katas (50 per speed trick), 1,000 Arena challenges (40 chapters of 25).
   Every level is generated from a fixed seed, so level 37 is the same for everyone, every time. */
import { TRICKS, problemFor } from './vedic.js';
import { byId, SKILLS } from './skills/index.js';
import { shuffle } from './lib.js';

/* ---------- seeded randomness ---------- */
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
export function seeded(seed, fn) { const real = Math.random; Math.random = mulberry32(hash(seed)); try { return fn(); } finally { Math.random = real; } }
const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const P = arr => arr[Math.floor(Math.random() * arr.length)];
const nDigits = d => R(10 ** (d - 1), 10 ** d - 1);

/* ---------- Dojo katas ---------- */
export const KATAS_PER_TRICK = 50;
/* Difficulty curves: level L (1 to 50) picks the size of the numbers for each trick */
const CURVE = {
  from9: L => { let n; do { n = nDigits(2 + Math.floor((L - 1) / 8)); } while (n % 10 === 0); return [n]; },
  by11: L => [nDigits(2 + Math.floor((L - 1) / 12))],
  times5: L => { const m = [5, 25, 50, 125][(L - 1) % 4]; return [nDigits(1 + Math.floor((L - 1) / 12)) * (m === 125 ? 8 : m === 25 ? 4 : 2), m]; },
  sq5: L => [(L < 15 ? R(1, 9) : L < 35 ? R(10, 29) : R(30, 99)) * 10 + 5],
  by9s: L => { const k = 1 + Math.floor((L - 1) / 17); return [R(Math.max(2, 10 ** (k - 1)), 10 ** k - 1), 10 ** k - 1]; },
  ends10: L => { const t = L < 20 ? R(1, 9) : L < 40 ? R(10, 19) : R(20, 99), u = R(1, 9); return [t * 10 + u, t * 10 + 10 - u]; },
  'near-base': L => { const b = L < 8 ? 10 : L < 32 ? 100 : 1000, s = Math.max(2, Math.round(b * (0.03 + ((L - 1) % 8) * 0.025))); const d = () => { let v; do { v = R(-s, s); } while (!v); return v; }; return [b + d(), b + d()]; },
  'square-near': L => { const b = L < 8 ? 10 : L < 32 ? 100 : 1000, s = Math.max(1, Math.round(b * (0.02 + ((L - 1) % 8) * 0.03))); let v; do { v = R(-s, s); } while (!v); return [b + v]; },
  check9: L => [nDigits(2 + Math.floor((L - 1) / 13)), nDigits(2 + Math.floor((L - 1) / 25))],
  crosswise: L => { const d = L < 30 ? 2 : 3; return [nDigits(d), nDigits(d)]; },
  duplex: L => [R(Math.min(80, 11 + Math.floor(L * 1.2)), Math.min(99, 30 + L * 2))],
  'sub-base': L => { const k = 3 + Math.floor((L - 1) / 10), b = 10 * Math.min(8, k), s = 2 + Math.floor(((L - 1) % 10) / 3); return [b + R(-s, s), b + R(-s, s)]; },
  div9: L => [nDigits(3 + Math.floor((L - 1) / 13))],
  osculator: L => { const d = [7, 13, 19, 29][(L - 1) % 4], dig = 3 + Math.floor((L - 1) / 12); return [Math.random() < .6 ? d * R(Math.ceil(10 ** (dig - 1) / d), Math.floor((10 ** dig - 1) / d)) : nDigits(dig), d]; },
  recip: L => [[19, 29, 39, 49][(L - 1) % 4], R(2, Math.min(28, 4 + L))],
  sqroot: L => { let r; do { r = R(11, Math.min(99, 25 + L * 2)); } while (r % 10 === 0); return [r * r]; },
  cuberoot: L => [R(11, Math.min(99, 30 + L * 2)) ** 3],
  transpose: L => { const m = 3 + Math.floor(L / 4), x = R(-m, m), a = R(2, m + 2); let c; do { c = R(-m, a - 1); } while (c === a || c === 0); const b = R(-4 * m, 4 * m); return [a, b, c, (a - c) * x + b]; },
  'add-sub': L => { const m = 4 + Math.floor(L / 3); let a, b; do { a = R(2, m); b = R(1, m); } while (a === b); const x = R(-m, m), y = R(-m, m); return [a, b, a * x + b * y, b * x + a * y]; },
  'ratio-zero': L => { const m = 4 + Math.floor(L / 4), b = R(2, m), y = R(1, m); return [R(2, 3 * m), b, b * y, R(2, 5)]; },
  'zero-sum': L => { for (let g = 0; g < 200; g++) { const P0 = R(6, 12 + L * 3), f = []; for (let k = 1; k * k <= P0; k++) if (P0 % k === 0) f.push([k, P0 / k]); if (f.length < 2) continue; const [p1, p2] = shuffle(f).slice(0, 2); if (p1[0] + p1[1] !== p2[0] + p2[1]) return [p1[0], p1[1], p2[0], p2[1]]; } return [2, 12, 3, 8]; }
};
export const KATA_COUNT = TRICKS.length * KATAS_PER_TRICK;
export const kataKey = (trick, n) => `k:${trick}:${n}`;
/* Problems for kata n (1 to 50) of a trick */
export function kata(trickId, n) {
  const t = TRICKS.find(x => x.id === trickId), count = n <= 10 ? 5 : n <= 30 ? 6 : 8;
  const probs = seeded(`kata:${trickId}:${n}`, () => Array.from({ length: count }, (_, i) => {
    let vals, g = 0; do { vals = (CURVE[trickId] || (() => t.random()))(Math.min(50, n + (i > count / 2 ? 1 : 0))); } while (t.valid(vals) && ++g < 60);
    if (t.valid(vals)) do { vals = t.random(); } while (t.valid(vals));
    return problemFor(t, vals);
  }));
  const par = Math.round(count * (8 + Math.min(20, n * 0.4)) * (['crosswise', 'add-sub', 'ratio-zero', 'osculator', 'div9', 'cuberoot', 'sqroot'].includes(trickId) ? 1.6 : 1));
  return { trick: t, n, problems: probs, par };
}
/* Stars: 1 for at least 60% right, 2 for at least 85%, 3 for all right within par time without hints */
export const kataStars = (right, total, secs, par, hints) => right === total && secs <= par && !hints ? 3 : right / total >= .85 ? 2 : right / total >= .6 ? 1 : 0;

/* ---------- Arena challenge tower ---------- */
const g = id => byId[id] ? [id] : [];
const grade = gr => SKILLS.filter(s => String(s.grade) === String(gr)).map(s => s.id);
const strand = (st, maxGrade = 99) => SKILLS.filter(s => s.strand === st && (s.grade === 'K' ? 0 : +s.grade) <= maxGrade).map(s => s.id);
const tricks = ids => ids.map(i => 'v-' + i);
export const TOPICS = [
  ['Counting and number bonds', ['k-count', 'k-bonds', 'k-teens', 'k-next', 'k-add10', 'k-sub10']],
  ['Make ten and doubles', ['1-maketen', '1-doubles', '1-add20', '1-missing']],
  ['Tens and ones', ['1-tens', '1-addtens', '2-place', '2-skip']],
  ['Two-digit adding and subtracting', ['2-add100', '2-sub100', '2-add1000']],
  ['Times tables', ['3-mult', '3-div', '3-multtens', '2-arrays']],
  ['Break apart to multiply', ['3-dist', '4-mult2', '3-multtens']],
  ['Kindergarten mix', grade('K')], ['Grade 1 mix', grade(1)], ['Grade 2 mix', grade(2)], ['Grade 3 mix', grade(3)], ['Grade 4 mix', grade(4)], ['Grade 5 mix', grade(5)],
  ['White belt tricks', tricks(['from9', 'by11', 'times5'])], ['Yellow belt tricks', tricks(['sq5', 'by9s', 'ends10'])],
  ['Fractions', ['3-frac', '4-equiv', '4-fracadd', '4-fracwhole', '5-fracunlike', '5-fracmult', '6-fracdiv']],
  ['Decimals and powers of ten', ['4-decimals', '5-decops', '5-pow10']],
  ['Orange belt tricks', tricks(['near-base', 'square-near', 'check9'])], ['Green belt tricks', tricks(['crosswise', 'duplex', 'sub-base'])],
  ['Ratios and percents', ['6-ratio', '6-percent', '7-prop', '7-pctchange']],
  ['Integers', ['6-integers', '7-intops']], ['Exponents and roots', ['6-exp', '8-exprules', '8-roots', '8-sci']],
  ['Grade 6 mix', grade(6)], ['Grade 7 mix', grade(7)], ['Grade 8 mix', grade(8)],
  ['Blue belt tricks', tricks(['div9', 'osculator', 'recip'])], ['Equations', ['6-onestep', '7-twostep', '8-multistep', '6-eval']],
  ['Geometry and measurement', strand('geo', 8)], ['Data and probability', strand('data', 12)],
  ['Purple belt tricks', tricks(['sqroot', 'cuberoot', 'transpose'])], ['Algebra 1', grade(9)], ['Geometry', grade(10)],
  ['Black belt tricks', tricks(['add-sub', 'ratio-zero', 'zero-sum'])], ['Algebra 2', grade(11)], ['Precalculus and calculus', grade(12)],
  ['Squares and roots', [...tricks(['sq5', 'square-near', 'duplex', 'sqroot']), '8-roots']], ['Speed multiplication', tricks(['crosswise', 'near-base', 'by11', 'by9s', 'ends10', 'sub-base', 'times5'])],
  ['All the speed tricks', TRICKS.map(t => 'v-' + t.id)], ['Elementary grand mix', [1, 2, 3, 4, 5].flatMap(grade)], ['Middle school grand mix', [6, 7, 8].flatMap(grade)], ['Grand master mix', SKILLS.map(s => s.id)]
].map(([name, ids]) => ({ name, ids: ids.filter(id => byId[id]) }));
export const PER_CHAPTER = 25, CHALLENGE_COUNT = TOPICS.length * PER_CHAPTER;
export const FORMATS = {
  sprint: { name: 'Sprint', how: 'Score as much as you can in the time.' },
  survival: { name: 'Survival', how: 'Keep going until you miss three.' },
  accuracy: { name: 'Sharpshooter', how: 'A fixed set of questions. Get them all right.' },
  timeattack: { name: 'Time attack', how: 'Answer them all as fast as you can.' },
  boss: { name: 'Boss round', how: 'Hard mixed questions, only two lives.' }
};
const ORDER = ['sprint', 'accuracy', 'survival', 'timeattack', 'boss'];
export const challengeKey = id => `a:${id}`;
/* Challenge id is 1 to 1000. Chapter c (0 to 39) holds ids c*25+1 to c*25+25. */
export function challenge(id) {
  const c = Math.floor((id - 1) / PER_CHAPTER), k = (id - 1) % PER_CHAPTER, tier = Math.floor(k / 5), fmt = ORDER[k % 5], topic = TOPICS[c];
  const lv = Math.min(3, 1 + Math.floor(tier / 2) + (fmt === 'boss' ? 1 : 0)), scale = 1 + tier * 0.18;
  const base = {
    sprint: { secs: 60, lives: 0, total: 0, goal: 'points', targets: [60, 120, 180].map(v => Math.round(v * scale / 10) * 10) },
    survival: { secs: 0, lives: 3, total: 0, goal: 'right answers', targets: [6, 12, 20].map(v => Math.round(v * scale)) },
    accuracy: { secs: 0, lives: 0, total: 10 + tier * 2, goal: 'right answers', targets: null },
    timeattack: { secs: 0, lives: 0, total: 10, goal: 'seconds', targets: [120, 80, 50].map(v => Math.round(v / Math.sqrt(scale))) },
    boss: { secs: 0, lives: 2, total: 15 + tier * 2, goal: 'right answers', targets: null }
  }[fmt];
  if (!base.targets) base.targets = [Math.ceil(base.total * .6), Math.ceil(base.total * .85), base.total];
  return { id, chapter: c, index: k + 1, topic, format: fmt, level: lv, tier, ...base, seed: `challenge:${id}` };
}
/* Questions for a challenge: numbers, simple fractions or multiple choice, so the number pad works everywhere */
export function challengeSet(ch, n = 90) {
  return seeded(ch.seed, () => {
    const out = []; let guard = 0;
    while (out.length < n && guard++ < n * 40) {
      const s = byId[P(ch.topic.ids)]; if (!s) continue;
      let p; try { p = s.gen(ch.level); } catch (e) { continue; }
      if (p.kind === 'num' && Number.isFinite(p.answer) && (Number.isInteger(p.answer) || p.simplest || Math.round(p.answer * 100) === p.answer * 100) && Math.abs(p.answer) < 1e7) out.push({ q: p.q, viz: p.viz || '', answer: p.answer, kind: 'num', skill: s.id, steps: p.steps });
      else if (p.kind === 'choice') out.push({ q: p.q, viz: p.viz || '', answer: p.answer, kind: 'choice', choices: p.choices, skill: s.id, steps: p.steps });
    }
    return out;
  });
}
export const challengeStars = (ch, r) => {
  if (ch.goal === 'seconds' && r.right < Math.ceil(ch.total * .8)) return 0;
  const v = ch.goal === 'points' ? r.score : ch.goal === 'seconds' ? (r.finished ? r.secs : Infinity) : r.right;
  return ch.goal === 'seconds' ? ch.targets.filter(t => v <= t).length : ch.targets.filter(t => v >= t).length;
};
