/* Independent answer checker for generated Vedic Math questions.
   It reads the question text (the HTML the learner sees), works the answer out with exact
   arithmetic (BigInt rationals and polynomials), and compares it with the stored answer.
   It shares no code with the app's generators or with check.js. */

/* ---------- exact rationals ---------- */
const babs = n => (n < 0n ? -n : n);
const bgcd = (a, b) => { a = babs(a); b = babs(b); while (b) [a, b] = [b, a % b]; return a; };
export class Rat {
  constructor(n, d = 1n) {
    n = BigInt(n); d = BigInt(d);
    if (d === 0n) throw new Error('divide by zero');
    if (d < 0n) { n = -n; d = -d; }
    const g = bgcd(n, d) || 1n; this.n = n / g; this.d = d / g;
  }
  static of(x) { return x instanceof Rat ? x : Rat.parse(String(x)); }
  static parse(s) { // exact decimal string -> rational
    const m = /^(-?)(\d*)(?:\.(\d+))?$/.exec(s); if (!m || (!m[2] && !m[3])) throw new Error('not a number: ' + s);
    const frac = m[3] || ''; const n = BigInt((m[2] || '0') + frac) * (m[1] ? -1n : 1n);
    return new Rat(n, 10n ** BigInt(frac.length));
  }
  add(o) { return new Rat(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { return new Rat(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { return new Rat(this.n * o.n, this.d * o.d); }
  div(o) { return new Rat(this.n * o.d, this.d * o.n); }
  neg() { return new Rat(-this.n, this.d); }
  pow(k) { // integer k
    if (k.d !== 1n) throw new Error('inexact: fractional power');
    let e = k.n, base = this; if (e < 0n) { base = new Rat(this.d, this.n); e = -e; }
    if (e > 4000n) throw new Error('power too big');
    return new Rat(base.n ** e, base.d ** e);
  }
  eq(o) { return this.n === o.n && this.d === o.d; }
  isZero() { return this.n === 0n; }
  isInt() { return this.d === 1n; }
  toNumber() { return Number(this.n) / Number(this.d); }
  toString() { return this.d === 1n ? String(this.n) : `${this.n}/${this.d}`; }
}
export const R = (n, d = 1) => new Rat(BigInt(n), BigInt(d));
const ZERO = R(0), ONE = R(1);

/* exact integer k-th root, or throw */
function iroot(n, k) {
  if (n < 0n) { if (k % 2n === 0n) throw new Error('inexact: even root of negative'); return -iroot(-n, k); }
  if (n < 2n) return n;
  let lo = 0n, hi = 1n; while (hi ** k <= n) hi *= 2n;
  while (lo < hi - 1n) { const mid = (lo + hi) / 2n; if (mid ** k <= n) lo = mid; else hi = mid; }
  if (lo ** k !== n) throw new Error('inexact: not a perfect power');
  return lo;
}
export const exactRoot = (r, k) => new Rat(iroot(r.n, BigInt(k)), iroot(r.d, BigInt(k)));

/* best rational for a float answer (denominator up to 1e6), only if it matches to float precision */
export function toRat(x) {
  if (typeof x !== 'number' || !Number.isFinite(x)) throw new Error('not a finite number');
  if (Number.isInteger(x)) return R(BigInt(x));
  const sign = x < 0 ? -1 : 1; let v = Math.abs(x);
  let h0 = 0n, h1 = 1n, k0 = 1n, k1 = 0n, best = null;
  for (let i = 0; i < 40; i++) {
    const a = BigInt(Math.floor(v)); [h0, h1] = [h1, a * h1 + h0]; [k0, k1] = [k1, a * k1 + k0];
    if (k1 > 1000000n) break;
    best = new Rat(h1 * BigInt(sign), k1);
    if (Math.abs(best.toNumber() - x) <= 1e-9 * Math.max(1, Math.abs(x))) return best;
    const f = v - Math.floor(v); if (f < 1e-15) break; v = 1 / f;
  }
  throw new Error('no small rational for ' + x);
}

/* ---------- polynomials in x with rational coefficients (index = power) ---------- */
export class Poly {
  constructor(c) { this.c = c.slice(); while (this.c.length > 1 && this.c[this.c.length - 1].isZero()) this.c.pop(); if (!this.c.length) this.c = [ZERO]; }
  static k(r) { return new Poly([r]); }
  deg() { return this.c.length === 1 && this.c[0].isZero() ? -1 : this.c.length - 1; }
  isConst() { return this.c.length === 1; }
  k0() { if (!this.isConst()) throw new Error('expected a number, got a polynomial'); return this.c[0]; }
  add(o) { const n = Math.max(this.c.length, o.c.length); return new Poly(Array.from({ length: n }, (_, i) => (this.c[i] || ZERO).add(o.c[i] || ZERO))); }
  neg() { return new Poly(this.c.map(r => r.neg())); }
  sub(o) { return this.add(o.neg()); }
  mul(o) { const out = Array.from({ length: this.c.length + o.c.length - 1 }, () => ZERO); this.c.forEach((a, i) => o.c.forEach((b, j) => { out[i + j] = out[i + j].add(a.mul(b)); })); return new Poly(out); }
  div(o) { const k = o.k0(); return new Poly(this.c.map(r => r.div(k))); }
  pow(e) {
    const k = e.k0(); if (this.isConst()) return Poly.k(this.c[0].pow(k));
    if (!k.isInt() || k.n < 0n || k.n > 60n) throw new Error('unsupported polynomial power');
    let out = Poly.k(ONE); for (let i = 0n; i < k.n; i++) out = out.mul(this); return out;
  }
  at(x) { let s = ZERO; for (let i = this.c.length - 1; i >= 0; i--) s = s.mul(x).add(this.c[i]); return s; }
  deriv() { return new Poly(this.c.slice(1).map((r, i) => r.mul(R(i + 1)))); }
  integ() { return new Poly([ZERO, ...this.c.map((r, i) => r.div(R(i + 1)))]); }
  /* exact division with no remainder, else throw */
  divExact(o) {
    let rem = this.c.slice(); const dd = o.deg(), lead = o.c[dd], q = Array.from({ length: Math.max(1, rem.length - dd) }, () => ZERO);
    for (let i = rem.length - 1; i >= dd; i--) { const f = rem[i].div(lead); q[i - dd] = f; for (let j = 0; j <= dd; j++) rem[i - dd + j] = rem[i - dd + j].sub(f.mul(o.c[j])); }
    if (!new Poly(rem).isConst() || !new Poly(rem).c[0].isZero()) throw new Error('not a factor');
    return new Poly(q);
  }
}

/* ---------- question HTML -> plain math text ---------- */
export function plain(html) {
  let s = String(html);
  for (let i = 0; i < 4; i++) s = s.replace(/<span class="fr"><span>((?:(?!<\/?span)[\s\S])*)<\/span><span>((?:(?!<\/?span)[\s\S])*)<\/span><\/span>/g, '(($1)/($2))');
  s = s.replace(/<sup>3<\/sup>&radic;/g, 'cbrt').replace(/&radic;/g, 'sqrt').replace(/√/g, 'sqrt')
    .replace(/log<sub>([^<]+)<\/sub>/g, 'log_$1')
    .replace(/<sup>((?:(?!<\/?sup)[\s\S])*)<\/sup>/g, '^($1)')
    .replace(/<\/span><span>/g, ' ').replace(/<br\s*\/?>/g, ' ; ')
    .replace(/<[^>]+>/g, '')
    .replace(/&times;|&middot;|×|·/g, '*').replace(/&divide;|÷/g, '/').replace(/&minus;|−|–/g, '-')
    .replace(/&#9633;|□/g, '?').replace(/&hellip;/g, '...').replace(/&prime;/g, "'").replace(/&pi;|π/g, 'pi')
    .replace(/&lang;/g, '<').replace(/&rang;/g, '>').replace(/&rarr;/g, '->').replace(/&int;/g, 'INT').replace(/&nbsp;|&#8202;/g, ' ')
    .replace(/°/g, '');
  s = s.replace(/(\d),(?=\d{3}(?!\d))/g, '$1');
  return s.replace(/\s+/g, ' ').trim();
}

/* ---------- exact expression evaluator ---------- */
function tokens(src) {
  const t = []; let i = 0; const s = src.replace(/\s+/g, '');
  while (i < s.length) {
    const c = s[i];
    if (/[0-9.]/.test(c)) { let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++; t.push({ k: 'n', v: Rat.parse(s.slice(i, j)) }); i = j; continue; }
    let m;
    if ((m = /^log_(\d+)/.exec(s.slice(i)))) { t.push({ k: 'f', v: 'log', base: R(BigInt(m[1])) }); i += m[0].length; continue; }
    if (s.startsWith('sqrt', i)) { t.push({ k: 'f', v: 'sqrt' }); i += 4; continue; }
    if (s.startsWith('cbrt', i)) { t.push({ k: 'f', v: 'cbrt' }); i += 4; continue; }
    if (c === 'x' || c === '?' || c === 'y') { t.push({ k: 'v', v: c }); i++; continue; }
    if ('+-*/^():'.includes(c)) { t.push({ k: 'o', v: c === ':' ? '/' : c }); i++; continue; }
    throw new Error(`cannot read "${c}" in ${src}`);
  }
  const out = [];
  for (const tk of t) {
    const p = out[out.length - 1];
    if (p && (p.k === 'n' || p.k === 'v' || (p.k === 'o' && p.v === ')')) && (tk.k === 'n' || tk.k === 'v' || tk.k === 'f' || (tk.k === 'o' && tk.v === '('))) out.push({ k: 'o', v: '*' });
    out.push(tk);
  }
  return out;
}
function intLog(base, v) {
  for (let k = -64n; k <= 64n; k++) if (base.pow(new Rat(k)).eq(v)) return new Rat(k);
  throw new Error('inexact log');
}
/* Evaluates src to a Poly in x. env may give values for x, y and ? (Rat). */
export function evaluate(src, env = {}) {
  const toks = tokens(src); let p = 0;
  const eat = v => { if (toks[p] && toks[p].k === 'o' && toks[p].v === v) { p++; return true; } return false; };
  const expr = () => { let a = term(); for (;;) { if (eat('+')) a = a.add(term()); else if (eat('-')) a = a.sub(term()); else return a; } };
  const term = () => { let a = unary(); for (;;) { if (eat('*')) a = a.mul(unary()); else if (eat('/')) a = a.div(unary()); else return a; } };
  const unary = () => (eat('-') ? unary().neg() : eat('+') ? unary() : power());
  const power = () => { const a = atom(); return eat('^') ? a.pow(unary()) : a; };
  const atom = () => {
    const tk = toks[p++]; if (!tk) throw new Error('unexpected end');
    if (tk.k === 'n') return Poly.k(tk.v);
    if (tk.k === 'v') { if (env[tk.v]) return Poly.k(env[tk.v]); if (tk.v === 'x') return new Poly([ZERO, ONE]); throw new Error('unbound ' + tk.v); }
    if (tk.k === 'f') { const a = atom().k0(); return Poly.k(tk.v === 'sqrt' ? exactRoot(a, 2) : tk.v === 'cbrt' ? exactRoot(a, 3) : intLog(tk.base, a)); }
    if (tk.v === '(') { const n = expr(); if (!eat(')')) throw new Error('missing )'); return n; }
    throw new Error('unexpected ' + tk.v);
  };
  const out = expr(); if (p !== toks.length) throw new Error('trailing input in ' + src);
  return out;
}
export const value = (src, env) => evaluate(src, env).k0();

/* ---------- per-question solvers. Each returns the expected answer (Rat or string) or undefined ---------- */
const num = s => Rat.parse(s.replace(/\s+/g, ''));
const N = '(-?\\d+(?:\\.\\d+)?)';
const re = s => new RegExp('^' + s + '$');
const ORDINAL = { triangle: 3, quadrilateral: 4, pentagon: 5, hexagon: 6, heptagon: 7, octagon: 8, nonagon: 9, decagon: 10, dodecagon: 12 };
const rd = (x, d) => {
  if (x instanceof Rat) { const s = 10n ** BigInt(d), n = babs(x.n) * s, q = (2n * n + x.d) / (2n * x.d); return Number((x.n < 0n ? -q : q)) / Number(s); } // exact, half away from zero
  return Math.round(x * 10 ** d) / 10 ** d;
};
const fact = n => { let f = 1n; for (let i = 2n; i <= n; i++) f *= i; return f; };

const SOLVERS = [
  // Casting out nines (Vedic check9)
  [re(`Casting out nines \\(answer 0 to 8\\), what is the digit sum of (\\d+) \\* (\\d+)\\?`), m => R((BigInt(m[1]) * BigInt(m[2])) % 9n)],
  // first non-zero decimal digit of 1/d, or digit k of 1/d, by long division
  [re('What is the first decimal digit of 1/(\\d+) that is not 0\\?'), m => { const d = BigInt(m[1]); let r = 1n; for (let i = 0; i < 50; i++) { r *= 10n; const dg = r / d; r %= d; if (dg) return R(dg); } }],
  [re('1/(\\d+) = 0\\.{3,4} What is digit number (\\d+) after the decimal point\\?'), m => { const d = BigInt(m[1]); let r = 1n, dg = 0n; for (let i = 0; i < +m[2]; i++) { r *= 10n; dg = r / d; r %= d; } return R(dg); }],
  [re('Is (\\d+) divisible by (\\d+)\\?'), m => (BigInt(m[1]) % BigInt(m[2]) === 0n ? 'Yes' : 'No')],
  [re('What number comes right (after|before) (\\d+)\\?'), m => R(BigInt(m[2]) + (m[1] === 'after' ? 1n : -1n))],
  [re('(\\d+) and how many more make (\\d+)\\?'), m => R(BigInt(m[2]) - BigInt(m[1]))],
  [re('\\w+ has (\\d+) \\w+ and gets (\\d+) more\\. How many now\\?'), m => R(BigInt(m[1]) + BigInt(m[2]))],
  [re('\\w+ has (\\d+) \\w+ and gives away (\\d+)\\. How many are left\\?'), m => R(BigInt(m[1]) - BigInt(m[2]))],
  [re('(\\d+) rows of (\\d+)\\. How many dots in all\\?'), m => R(BigInt(m[1]) * BigInt(m[2]))],
  [re('\\w+ buys (\\d+) packs of \\w+ with (\\d+) in each pack, then gives away (\\d+)\\. How many are left\\?'), m => R(BigInt(m[1]) * BigInt(m[2]) - BigInt(m[3]))],
  [re('How many tens are in (\\d+)\\?'), m => R(BigInt(m[1]) / 10n)],
  [re('What is the value of the digit (\\d) in (\\d+)\\?'), m => { const s = m[2], i = s.indexOf(m[1]); if (s.split(m[1]).length !== 2) return { ambiguous: true, why: `the digit ${m[1]} appears more than once in ${s}` }; return R(BigInt(m[1]) * 10n ** BigInt(s.length - 1 - i)); }],
  [re('\\w+ shares (\\d+) \\w+ equally among (\\d+) friends\\. How many does each friend get\\?'), m => R(BigInt(m[1]), BigInt(m[2]))],
  [re('Write (.+) as a decimal\\.'), m => value(m[1])],
  [re('(\\d+) (\\w+) for (\\d+) items\\. How many \\2 for 1 item\\?'), m => R(BigInt(m[1]), BigInt(m[3]))],
  [re('You roll a fair six-sided die\\. What is the probability of (an even number|an odd number|a (\\d)|a number greater than (\\d)|a number less than (\\d))\\?'), m => {
    const ok = f => [1, 2, 3, 4, 5, 6].filter(f).length;
    const n = m[1] === 'an even number' ? ok(v => v % 2 === 0) : m[1] === 'an odd number' ? ok(v => v % 2) : m[2] ? ok(v => v === +m[2]) : m[3] ? ok(v => v > +m[3]) : ok(v => v < +m[4]);
    return R(n, 6); }],
  [re('Is (\\d+) even or odd\\?'), m => (BigInt(m[1]) % 2n ? 'Odd' : 'Even')],
  [re('Is (\\d+) prime or composite\\?'), m => { const n = +m[1]; if (n < 2) return undefined; for (let i = 2; i * i <= n; i++) if (n % i === 0) return 'Composite'; return 'Prime'; }],
  [re('Two similar shapes have matching sides (\\d+) and (\\d+)\\. The small one has area (\\d+)\\. What is the area of the big one\\?'), m => { const k = R(BigInt(m[2]), BigInt(m[1])); return R(BigInt(m[3])).mul(k).mul(k); }],
  [re('Find the surface area of a box (\\d+) by (\\d+) by (\\d+)\\.'), m => { const [l, w, h] = [1, 2, 3].map(i => BigInt(m[i])); return R(2n * (l * w + l * h + w * h)); }],
  [re('Round (\\d+) to the nearest (\\d+)\\.'), m => { const n = BigInt(m[1]), k = BigInt(m[2]); return R(((n * 2n + k) / (2n * k)) * k); }],
  [re('What is the (\\d+)(?:st|nd|rd|th) multiple of (\\d+)\\? \\(The 1st is \\d+\\.\\)'), m => R(BigInt(m[1]) * BigInt(m[2]))],
  [re('How many factors does (\\d+) have\\?'), m => { let c = 0; for (let i = 1; i <= +m[1]; i++) if (+m[1] % i === 0) c++; return R(c); }],
  [re('What comes next\\? ([-\\d, ]+), \\?'), m => { const a = m[1].split(',').map(x => BigInt(x.trim())), d = a[1] - a[0]; if (a.some((v, i) => i && v - a[i - 1] !== d)) return undefined; return R(a[a.length - 1] + d); }],
  [re(`What is ${N}% of ${N}\\?`), m => num(m[1]).mul(num(m[2])).div(R(100))],
  [re('What is the greatest common factor of (\\d+) and (\\d+)\\?'), m => R(bgcd(BigInt(m[1]), BigInt(m[2])))],
  [re('What is the least common multiple of (\\d+) and (\\d+)\\?'), m => { const a = BigInt(m[1]), b = BigInt(m[2]); return R(a * b / bgcd(a, b)); }],
  [re('Find the range: ([-\\d, ]+)'), m => { const a = m[1].split(',').map(x => BigInt(x.trim())); return R(a.reduce((x, y) => (y > x ? y : x)) - a.reduce((x, y) => (y < x ? y : x))); }],
  [re('Find the (mean|median|mode): ([-\\d., ]+)'), m => { const a = m[2].split(',').map(x => num(x.trim())); const s = a.slice().sort((x, y) => (x.sub(y).n < 0n ? -1 : x.eq(y) ? 0 : 1));
    if (m[1] === 'mean') return a.reduce((x, y) => x.add(y), ZERO).div(R(a.length));
    if (m[1] === 'median') return s.length % 2 ? s[(s.length - 1) / 2] : s[s.length / 2 - 1].add(s[s.length / 2]).div(R(2));
    const cnt = new Map(); a.forEach(v => cnt.set(v.toString(), (cnt.get(v.toString()) || 0) + 1)); const top = Math.max(...cnt.values()), modes = [...cnt].filter(([, c]) => c === top); return modes.length === 1 ? Rat.parse(String(Number(modes[0][0].includes('/') ? NaN : modes[0][0]))) : undefined; }],
  [re(`Find (.+) when x = ${N}\\.`), m => value(m[1], { x: num(m[2]) })],
  [re(`A triangle has base ${N} and height ${N}\\. What is its area\\?`), m => num(m[1]).mul(num(m[2])).div(R(2))],
  [re(`A (?:parallelogram|rectangle) has base ${N} and height ${N}\\. What is its area\\?`), m => num(m[1]).mul(num(m[2]))],
  [re('An angle is (\\d+)\\. What is its supplement\\?'), m => R(180n - BigInt(m[1]))],
  [re('An angle is (\\d+)\\. What is its complement\\?'), m => R(90n - BigInt(m[1]))],
  [re('Two lines cross\\. One angle is (\\d+)\\. What is the angle vertically opposite it\\?'), m => R(BigInt(m[1]))],
  [re('Two lines cross\\. One angle is (\\d+)\\. What is the angle next to it\\?'), m => R(180n - BigInt(m[1]))],
  [re('Triangles are similar\\. Matching sides: (\\d+) and (\\d+)\\. Another side of the small triangle is (\\d+)\\. What is the matching side of the big one\\?'), m => R(BigInt(m[2]) * BigInt(m[3])).div(R(BigInt(m[1])))],
  [re('What is each interior angle of a regular (\\w+)\\?'), m => ORDINAL[m[1]] && R(180 * (ORDINAL[m[1]] - 2), ORDINAL[m[1]])],
  [re('What is each exterior angle of a regular (\\w+)\\?'), m => ORDINAL[m[1]] && R(360, ORDINAL[m[1]])],
  [re('What do the interior angles of an? (\\w+) add up to\\?'), m => ORDINAL[m[1]] && R(180 * (ORDINAL[m[1]] - 2))],
  [re(`Find the slope of the line through \\(${N}, ${N}\\) and \\(${N}, ${N}\\)\\.`), m => num(m[4]).sub(num(m[2])).div(num(m[3]).sub(num(m[1])))],
  [re(`Find the distance between \\(${N}, ${N}\\) and \\(${N}, ${N}\\)\\.`), m => { const dx = num(m[3]).sub(num(m[1])), dy = num(m[4]).sub(num(m[2])); return exactRoot(dx.mul(dx).add(dy.mul(dy)), 2); }],
  [re(`Find the midpoint x-coordinate of \\(${N}, ${N}\\) and \\(${N}, ${N}\\)\\.`), m => num(m[1]).add(num(m[3])).div(R(2))],
  [re(`Find the magnitude of the vector <${N}, ${N}>\\.`), m => { const a = num(m[1]), b = num(m[2]); return exactRoot(a.mul(a).add(b.mul(b)), 2); }],
  [re(`Find the dot product <${N}, ${N}> \\* <${N}, ${N}>\\.`), m => num(m[1]).mul(num(m[3])).add(num(m[2]).mul(num(m[4])))],
  [re(`Find the determinant of ${N} ${N} ${N} ${N}`), m => num(m[1]).mul(num(m[4])).sub(num(m[2]).mul(num(m[3])))],
  [re('How many ways can you choose (\\d+) \\w+ from (\\d+)\\?'), m => { const k = BigInt(m[1]), n = BigInt(m[2]); return R(fact(n) / (fact(k) * fact(n - k))); }],
  [re('In how many ways can (\\d+) \\w+ finish 1st through (\\d+)(?:st|nd|rd|th)\\?'), m => { const n = BigInt(m[1]), k = BigInt(m[2]); return R(fact(n) / fact(n - k)); }],
  [re('In how many ways can (\\d+) \\w+ (?:line up|be arranged in a row)\\?'), m => R(fact(BigInt(m[1])))],
  [re('([-\\d]+), ([-\\d]+), ([-\\d]+), ([-\\d]+), \\.\\.\\. What is term number (\\d+)\\?'), m => { const a = [1, 2, 3, 4].map(i => R(BigInt(m[i]))), n = BigInt(m[5]) - 1n, d = a[1].sub(a[0]);
    if (a[2].sub(a[1]).eq(d) && a[3].sub(a[2]).eq(d)) return a[0].add(d.mul(R(n)));
    const r = a[1].div(a[0]); if (a[2].div(a[1]).eq(r) && a[3].div(a[2]).eq(r)) return a[0].mul(r.pow(R(n))); }],
  [re('Find the sum of the first (\\d+) terms: (.+) \\+ (.+) \\+ (.+) \\+ \\.\\.\\.'), m => { const a = [2, 3, 4].map(i => value(m[i])), n = +m[1]; let terms;
    const d = a[1].sub(a[0]), r = a[1].div(a[0]);
    if (a[2].sub(a[1]).eq(d)) terms = Array.from({ length: n }, (_, i) => a[0].add(d.mul(R(i))));
    else if (a[2].div(a[1]).eq(r)) terms = Array.from({ length: n }, (_, i) => a[0].mul(r.pow(R(i))));
    return terms && terms.reduce((x, y) => x.add(y), ZERO); }],
  [re('Find the sum: (-?\\d+) \\+ (-?\\d+) \\+ (-?\\d+) \\+ \\.\\.\\. \\+ (-?\\d+)'), m => { const [a, b, c, z] = [1, 2, 3, 4].map(i => BigInt(m[i])), d = b - a; if (c - b !== d || (z - a) % d) return undefined; let s = 0n; for (let v = a; d > 0n ? v <= z : v >= z; v += d) s += v; return R(s); }],
  [re('Find the sum: (.+) \\+ (.+) \\+ (.+) \\+ \\.\\.\\.'), m => { const a = [1, 2, 3].map(i => value(m[i])), r = a[1].div(a[0]); if (!a[2].div(a[1]).eq(r) || babs(r.n) >= r.d) return undefined; return a[0].div(ONE.sub(r)); }],
  [re('Convert (\\d*)pi(?:/(\\d+))? radians to degrees\\.'), m => R(180n * BigInt(m[1] || 1), BigInt(m[2] || 1))],
  [re('Convert (\\d+) degrees to radians\\. Give the answer as a multiple of pi\\.'), m => R(BigInt(m[1]), 180n)],
  [re(`Scores have mean ${N} and standard deviation ${N}\\. What is the z-score of ${N}\\?`), m => num(m[3]).sub(num(m[1])).div(num(m[2]))],
  [re('A bag has (\\d+) red, (\\d+) blue(?: and (\\d+) green)? marbles\\. You pick one without looking\\. What is the probability it is (red|blue|green)\\? Give a fraction\\.'), m => R(BigInt(m[{ red: 1, blue: 2, green: 3 }[m[4]]] || 0), BigInt(m[1]) + BigInt(m[2]) + BigInt(m[3] || 0))],
  [re(`A price goes from \\$${N} to \\$${N}\\. What is the percent change\\? \\(Use a negative number for a decrease\\.\\)`), m => num(m[2]).sub(num(m[1])).mul(R(100)).div(num(m[1]))],
  [re('\\$(\\d+) with an? (\\d+)% sales tax\\. What is the final price\\?'), m => ({ round: 2, x: R(BigInt(m[1])).mul(R(100n + BigInt(m[2]), 100n)) })],
  [re('\\$(\\d+) (?:with|after) an? (\\d+)% (?:discount|off)\\. What is the (?:sale|final) price\\?'), m => ({ round: 2, x: R(BigInt(m[1])).mul(R(100n - BigInt(m[2]), 100n)) })],
  [re('\\$(\\d+) (grows|loses) (\\d+)% per year\\. What is it worth after (\\d+) years\\? Round to the cent\\.'), m => { const f = R(100n + (m[2] === 'grows' ? 1n : -1n) * BigInt(m[3]), 100n); return { round: 2, x: R(BigInt(m[1])).mul(f.pow(R(BigInt(m[4])))) }; }],
  [re('A circle has (radius|diameter) (\\d+)\\. What is its (circumference|area)\\? Round to 2 decimal places\\.'), m => { const r = m[1] === 'radius' ? +m[2] : m[2] / 2; return { round: 2, x: m[3] === 'area' ? Math.PI * r ** 2 : 2 * Math.PI * r }; }],
  [re('A circle has radius (\\d+)\\. Find the (length of the arc|area of the sector) with central angle (\\d+)\\. Round to 2 decimal places\\.'), m => ({ round: 2, x: m[2].startsWith('length') ? 2 * Math.PI * m[1] * m[3] / 360 : Math.PI * m[1] ** 2 * m[3] / 360 })],
  [re('Find the volume of a (sphere|cylinder|cone) with radius (\\d+)(?: and height (\\d+))?\\. Round to 2 decimal places\\.'), m => ({ round: 2, x: m[1] === 'sphere' ? 4 / 3 * Math.PI * m[2] ** 3 : m[1] === 'cylinder' ? Math.PI * m[2] ** 2 * m[3] : Math.PI * m[2] ** 2 * m[3] / 3 })],
  [re('Find the surface area of a (sphere|cylinder) with radius (\\d+)(?: and height (\\d+))?\\. Round to 2 decimal places\\.'), m => ({ round: 2, x: m[1] === 'sphere' ? 4 * Math.PI * m[2] ** 2 : 2 * Math.PI * m[2] ** 2 + 2 * Math.PI * m[2] * m[3] })],
  [re('A right triangle has hypotenuse (\\d+) and an angle of (\\d+)\\. Find the side (opposite|adjacent to) that angle\\. Round to 2 decimal places\\.'), m => ({ round: 2, x: m[1] * (m[3] === 'opposite' ? Math.sin : Math.cos)(m[2] * Math.PI / 180) })],
  [re('sqrt(\\d+) is between which two whole numbers\\? Give the smaller one\\.'), m => { const n = BigInt(m[1]); let r = 0n; while ((r + 1n) ** 2n <= n) r++; return R(r); }],
  // f(x) = poly. Find f(k).
  [re(`f\\(x\\) = (.+)\\. Find f\\(${N}\\)\\.`), m => evaluate(m[1]).at(num(m[2]))],
  [re(`f\\(x\\) = (.+)\\. Find f'\\(${N}\\)(?:, the slope at x = ${N})?\\.`), m => evaluate(m[1]).deriv().at(num(m[2]))],
  [re(`f\\(x\\) = (.+) and g\\(x\\) = (.+)\\. Find f\\(g\\(${N}\\)\\)\\.`), m => evaluate(m[1]).at(evaluate(m[2]).at(num(m[3])))],
  [re(`f\\(x\\) = (.+) and g\\(x\\) = (.+)\\. Find g\\(f\\(${N}\\)\\)\\.`), m => evaluate(m[2]).at(evaluate(m[1]).at(num(m[3])))],
  [re(`Find the remainder when (.+) is divided by \\(x ([-+]) (\\d+)\\)\\.`), m => evaluate(m[1]).at(num((m[2] === '-' ? '' : '-') + m[3]))],
  [re(`Evaluate INT_?(-?\\d+)\\^\\((-?\\d+)\\) \\((.+)\\) dx`), m => { const F = evaluate(m[3]).integ(); return F.at(num(m[2])).sub(F.at(num(m[1]))); }],
  [re(`lim_?x->(-?\\d+) \\(\\((.+)\\)/\\((.+)\\)\\)`), m => evaluate(m[2]).divExact(evaluate(m[3])).at(num(m[1]))]
];

/* Equations and "= ?" questions: substitute the stored answer and check both sides are exactly equal */
function equation(text, answer) {
  const s = text.replace(/^(Solve|Simplify):\s*/, '');
  const parts = s.split(' = '); if (parts.length !== 2) return undefined;
  const hasQ = s.includes('?'), hasX = /x/.test(s);
  if (!hasQ && !hasX) return undefined;
  if (!/^(?:[-+*/^():?x\d.\s=]|sqrt|cbrt|log_)+$/.test(s)) return undefined;
  if (typeof answer !== 'number') return undefined;
  let r; try { r = toRat(answer); } catch (e) { return { wrong: true, why: 'answer is not a clean rational: ' + answer }; }
  const holds = v => {
    const env = hasQ ? { '?': v, ...(hasX ? { x: R(3, 2) } : {}) } : { x: v };
    try { return value(parts[0], env).eq(value(parts[1], env)); } catch (e) { if (/inexact|divide by zero/.test(e.message)) return false; throw e; }
  };
  // Left = ? : compute the left side outright when we can
  if (parts[1] === '?' && !hasX) return value(parts[0], {});
  if (holds(r)) { if (holds(r.add(ONE))) return { wrong: true, why: 'equation also holds for answer + 1 (not a unique answer)' }; return r; }
  return { wrong: true, why: `stored answer ${answer} does not satisfy ${s}` };
}

/* Verify one question { q, kind, answer, choices?, fields? } -> { status: 'ok' | 'wrong' | 'skip', expected?, why? } */
export function verifyQuestion(item) {
  const text = plain(item.q);
  let exp;
  for (const [rx, fn] of SOLVERS) { const m = rx.exec(text); if (m) { exp = fn(m); if (exp !== undefined) break; } }
  if (exp === undefined && item.kind === 'num') {
    try { exp = equation(text, item.answer); } catch (e) { exp = undefined; }
  }
  if (exp === undefined && item.kind === 'choice' && /^(.+) \? (.+)$/.test(text)) { // compare: a ? b, answer <, > or =
    const [, a, b] = /^(.+) \? (.+)$/.exec(text);
    try { const d = value(a).sub(value(b)); exp = d.isZero() ? '=' : d.n < 0n ? '<' : '>'; } catch (e) { exp = undefined; }
  }
  if (exp === undefined) return { status: 'skip', text };
  if (exp && exp.wrong) return { status: 'wrong', text, why: exp.why };
  if (exp && exp.ambiguous) return { status: 'ambiguous', text, why: exp.why };
  if (typeof exp === 'string') return String(item.answer) === exp ? { status: 'ok' } : { status: 'wrong', text, expected: exp, why: `expected ${exp}, stored ${item.answer}` };
  if (exp && exp.round !== undefined) return Math.abs(item.answer - rd(exp.x, exp.round)) < 1e-9 ? { status: 'ok' } : { status: 'wrong', text, expected: rd(exp.x, exp.round), why: `expected ${rd(exp.x, exp.round)}, stored ${item.answer}` };
  const want = exp.toNumber();
  if (typeof item.answer !== 'number' || Math.abs(item.answer - want) > 1e-9 * Math.max(1, Math.abs(want))) return { status: 'wrong', text, expected: exp.toString(), why: `expected ${exp}, stored ${item.answer}` };
  return { status: 'ok', expected: exp };
}

/* Two-field Vedic questions (Dojo katas): returns [{label, answer: Rat}] worked out independently, or undefined */
export function solveFields(item) {
  const text = plain(item.q); let m;
  if ((m = /^(\d+) \/ 9 = \? remainder \?$/.exec(text))) { const n = BigInt(m[1]); return [{ label: 'Quotient', answer: R(n / 9n) }, { label: 'Remainder', answer: R(n % 9n) }]; }
  if ((m = new RegExp(`^Solve: ; ${N}x \\+ ${N}y = ${N} ; ${N}x \\+ ${N}y = ${N}$`).exec(text))) {
    const [a, b, c, d, e, f] = m.slice(1, 7).map(num), det = a.mul(e).sub(b.mul(d));
    if (det.isZero()) return undefined;
    return [{ label: 'x', answer: c.mul(e).sub(b.mul(f)).div(det) }, { label: 'y', answer: a.mul(f).sub(c.mul(d)).div(det) }];
  }
}
