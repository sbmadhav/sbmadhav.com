/* Strategy games, all adaptive.
   Every game reads one difficulty dial (adapt.js, 1 to 20) before each question: a right answer turns it up,
   a miss turns it down, and points are weighted by difficulty. No question repeats within a round.
   Each game runs inside the shell in app.js and calls ctx.end(points) when a round is over. Play never starts on its own. */
import { ri, pick, shuffle } from './lib.js';
import { evalNum } from './check.js';
import { factStrategy } from './skills/middle.js';
import * as V from './viz.js';
import { sfx as tapSfx, speak as speakIt } from './fx.js';
import { SUTRAS } from './sutras.js';
import { pointsAt, levelStart } from './adapt.js';

const el = (tag, attrs = {}, html = '') => { const e = document.createElement(tag); Object.entries(attrs).forEach(([k, v]) => (k === 'class' ? (e.className = v) : e.setAttribute(k, v))); if (html) e.innerHTML = html; return e; };
function timer(root, secs, onEnd) {
  const bar = el('div', { class: 'g-timer', role: 'timer', 'aria-label': `${secs} seconds` }, '<span></span>'), fill = bar.firstChild; root.prepend(bar);
  const t0 = performance.now(); let raf = 0, stopped = false;
  const tick = () => { if (stopped) return; const left = Math.max(0, secs - (performance.now() - t0) / 1000); fill.style.width = (left / secs) * 100 + '%'; if (left <= 0) { stopped = true; onEnd(); return; } raf = requestAnimationFrame(tick); };
  raf = requestAnimationFrame(tick);
  return () => { stopped = true; cancelAnimationFrame(raf); };
}
const flash = (node, ok) => { tapSfx(ok ? 'ok' : 'no'); if (!node) return; node.classList.remove('g-ok', 'g-no'); void node.offsetWidth; node.classList.add(ok ? 'g-ok' : 'g-no'); };
const fmt = n => (Number.isInteger(n) ? n.toLocaleString('en-US') : String(n)).replace('-', '&minus;');
const frac = (n, d) => `<span class="fr"><span>${n}</span><span>${d}</span></span>`;
const nd = d => ri(10 ** (d - 1), 10 ** d - 1);
/* Four choices: the answer plus three nearby wrong ones */
const near = (ans, spread, n = 4, ok = () => true) => { const s = new Set([ans]); let g = 0; while (s.size < n && g++ < 120) { const v = ans + pick([-1, 1]) * ri(1, spread); if (v !== ans && ok(v)) s.add(v); } return shuffle([...s]); };

/* Shared plumbing: score an answer, update the HUD, count rounds */
function kit(ctx) {
  const { dial } = ctx;
  return {
    mark(ok, node) { const pts = dial.hit(ok); flash(node, ok); ctx.hud && ctx.hud(dial, pts, ok); return pts; },
    over: rounds => !ctx.endless && dial.n >= rounds,
    finish: () => ctx.end(dial.points),
    timed: (area, secs) => (ctx.endless ? null : timer(area, secs, () => ctx.end(dial.points)))
  };
}

/* ---------- Times sprint: the multiplication ladder, from the 2s table to 4-digit products ---------- */
export function timesQ(lv) {
  const T = [
    () => [pick([2, 5, 10]), ri(1, 10)], () => [pick([3, 4]), ri(2, 10)], () => [ri(6, 9), ri(2, 10)], () => [ri(2, 12), ri(2, 12)],
    () => [ri(11, 12), ri(3, 12)], () => [ri(13, 19), ri(2, 9)], () => [ri(20, 49), ri(2, 9)], () => [ri(50, 99), ri(2, 9)],
    () => pick([[ri(12, 99), 11], (n => [n, n])(ri(13, 25))]), () => [ri(11, 19), ri(11, 19)], () => [ri(88, 99), ri(88, 99)],
    () => pick([(n => [n, n])(ri(1, 9) * 10 + 5), [ri(21, 40), ri(21, 40)]]), () => [ri(21, 99), ri(21, 99)], () => [ri(101, 999), ri(2, 9)],
    () => [ri(100, 199), ri(11, 19)], () => pick([[ri(985, 999), ri(985, 999)], (n => [n, n])(ri(26, 99))]), () => [ri(100, 999), ri(11, 99)],
    () => [ri(101, 115), ri(101, 115)], () => [ri(101, 300), ri(101, 300)], () => [ri(1001, 9999), ri(11, 99)]
  ];
  const [a, b] = T[Math.max(0, Math.min(19, lv - 1))]();
  return [`${Math.min(a, b)}x${Math.max(a, b)}`, { a, b, ans: a * b }];
}
function timesTip(a, b) {
  if (a <= 12 && b <= 12) return factStrategy(a, b)[0];
  const [s, l] = a <= b ? [a, b] : [b, a];
  if (l === s && l % 10 === 5) return `Square ending in 5: ${(l - 5) / 10} &times; ${(l + 5) / 10} = ${((l - 5) / 10) * ((l + 5) / 10)}, then 25.`;
  for (const base of [100, 1000]) if (Math.abs(a - base) <= base * 0.15 && Math.abs(b - base) <= base * 0.15) return `Near ${base}: ${a} ${b - base < 0 ? '&minus;' : '+'} ${Math.abs(b - base)} = ${a + b - base}, then ${(a - base) * (b - base)}.`;
  if (s === 11) return 'Times 11: keep the outside digits and put the sums of neighbours in between.';
  if (s < 10) return `Break it apart: ${s} &times; ${Math.floor(l / 10) * 10} = ${s * Math.floor(l / 10) * 10}, plus ${s} &times; ${l % 10} = ${s * (l % 10)}.`;
  return 'Vertically and crosswise: build it one column at a time from the right.';
}

/* ---------- Which is more: dots, numbers, fractions, decimals, powers and roots ---------- */
export function moreQ(lv) {
  if (lv <= 4) { const m = 3 + lv * 2; let a = ri(1, m), b = ri(1, m); while (a === b) b = ri(1, m); return [`d${a}-${b}`, { a, b, va: a, vb: b, kind: 'dots' }]; }
  if (lv <= 8) { const m = [20, 50, 100, 1000][lv - 5], a = ri(2, m); let b = a + pick([-1, 1]) * ri(1, Math.max(2, Math.round(m / (lv * 2)))); if (b < 1 || b === a) b = a + 1; return [`n${a}-${b}`, { a: fmt(a), b: fmt(b), va: a, vb: b }]; }
  if (lv <= 12) { let x, y, d1, d2, g = 0; do { d1 = ri(2, 4 + lv); d2 = ri(2, 4 + lv); x = ri(1, d1 - 1); y = ri(1, d2 - 1); } while ((x * d2 === y * d1 || Math.abs(x / d1 - y / d2) > 0.6 - lv * 0.03) && ++g < 400); return [`f${x}/${d1}-${y}/${d2}`, { a: frac(x, d1), b: frac(y, d2), va: x / d1, vb: y / d2 }]; }
  if (lv <= 16) {
    if (lv >= 14 && Math.random() < .5) { const [fn, fd] = pick([[1, 3], [2, 3], [3, 8], [5, 8], [7, 8], [5, 6], [1, 6], [4, 7], [5, 9], [7, 12]]), dv = Math.round((fn / fd) * 100 + pick([-3, -2, -1, 1, 2, 3])) / 100; return [`fd${fn}/${fd}-${dv}`, { a: frac(fn, fd), b: String(dv), va: fn / fd, vb: dv }]; }
    const p = ri(11, 99) / 100; let q = Math.round((p + pick([-1, 1]) * ri(1, 9) / (lv >= 15 ? 1000 : 100)) * 1000) / 1000; if (q <= 0 || q === p) q = p + 0.01; return [`dec${p}-${q}`, { a: String(p), b: String(q), va: p, vb: q }];
  }
  const forms = [
    () => { const a = ri(2, 9), b = ri(2, 4), c = ri(2, 9), e = ri(2, 4); return [`${a}<sup>${b}</sup>`, a ** b, `${c}<sup>${e}</sup>`, c ** e]; },
    () => { const a = ri(6, 19), b = ri(6, 19), c = a * b + pick([-1, 1]) * ri(1, 9); return [`${a} &times; ${b}`, a * b, fmt(c), c]; },
    () => { const a = -ri(1, 50), b = -ri(1, 50); return [fmt(a), a, fmt(b), b]; },
    () => { const n = ri(2, 15) ** 2 + pick([-3, -2, -1, 1, 2, 3]), r = Math.round(Math.sqrt(n)) + pick([0, 1, -1]); return [`&radic;${n}`, Math.sqrt(n), String(r), r]; }
  ];
  let o, g = 0; do { o = pick(forms)(); } while (o[1] === o[3] && ++g < 50);
  return [`x${o[0]}-${o[2]}`, { a: o[0], b: o[2], va: o[1], vb: o[3] }];
}

/* ---------- Pattern ladder ---------- */
export function seqQ(lv) {
  const G = [
    () => { const a = ri(1, 10), d = ri(1, 3); return [Array.from({ length: 5 }, (_, i) => a + i * d), `add ${d} each time`]; },
    () => { const a = ri(1, 20), d = ri(2, 9); return [Array.from({ length: 5 }, (_, i) => a + i * d), `add ${d} each time`]; },
    () => { const a = ri(50, 120), d = ri(3, 12); return [Array.from({ length: 5 }, (_, i) => a - i * d), `subtract ${d} each time`]; },
    () => { const a = ri(1, 5), r = pick([2, 3]); return [Array.from({ length: 5 }, (_, i) => a * r ** i), `multiply by ${r} each time`]; },
    () => { const a = ri(1, 9); return [Array.from({ length: 5 }, (_, i) => (a + i) ** 2), 'square numbers']; },
    () => { const a = ri(1, 6); return [Array.from({ length: 5 }, (_, i) => ((a + i) * (a + i + 1)) / 2), 'triangle numbers']; },
    () => { const x = ri(1, 4), y = ri(x, x + 4), s = [x, y]; while (s.length < 6) s.push(s[s.length - 1] + s[s.length - 2]); return [s, 'add the two before (Virahāṅka-Fibonacci)']; },
    () => { const a = ri(1, 10), d = ri(1, 4); let v = a; const s = [v]; for (let i = 1; i < 5; i++) { v += d * i; s.push(v); } return [s, `the jumps grow by ${d}`]; },
    () => { const a = ri(1, 5); return [Array.from({ length: 5 }, (_, i) => (a + i) ** 3), 'cube numbers']; },
    () => { const a = ri(1, 6), m = pick([2, 3]), c = ri(1, 3), s = [a]; for (let i = 1; i < 5; i++) s.push(s[i - 1] * m + c); return [s, `times ${m}, then add ${c}`]; },
    () => { const a = ri(1, 9), b = ri(20, 40), d = ri(2, 5), e = ri(2, 5), s = []; for (let i = 0; i < 6; i++) s.push(i % 2 ? b - e * ((i - 1) / 2) : a + d * (i / 2)); return [s, 'two patterns take turns']; },
    () => { const P = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61], k = ri(0, 12); return [P.slice(k, k + 5), 'prime numbers']; },
    () => { const a = ri(1, 8); return [Array.from({ length: 5 }, (_, i) => (a + i) * (a + i + 1)), 'n times (n + 1)']; }
  ];
  const idx = Math.max(0, Math.min(G.length - 1, Math.floor(((lv - 1) * G.length) / 20) - (Math.random() < .3 ? 1 : 0)));
  const [s, rule] = G[idx]();
  return [s.join(','), { shown: s.slice(0, -1), ans: s[s.length - 1], rule }];
}

/* ---------- Balance: from x + 3 = 9 to 3(x - 2) = 2x + 5 ---------- */
export function balanceQ(lv) {
  const x = lv <= 4 ? ri(1, 9) : lv <= 8 ? ri(1, 15) : ri(-12, 15);
  if (lv <= 4) { const b = ri(1, 5 + lv * 3); return [`a${x}+${b}`, { L: `<i>x</i> + ${b}`, R: String(x + b), x, how: `take ${b} from both sides` }]; }
  if (lv <= 8) { const a = ri(2, lv), b = ri(0, 20); return [`b${a}${x}${b}`, { L: `${a}<i>x</i>${b ? ` + ${b}` : ''}`, R: fmt(a * x + b), x, how: `${b ? `take ${b} away, then ` : ''}divide by ${a}` }]; }
  if (lv <= 12) { const a = ri(2, 9), b = ri(-20, 20) || 3; return [`c${a}${x}${b}`, { L: `${a}<i>x</i> ${b < 0 ? '&minus;' : '+'} ${Math.abs(b)}`, R: fmt(a * x + b), x, how: `move ${fmt(b)} across, then divide by ${a}` }]; }
  if (lv <= 16) { const a = ri(3, 9), c = ri(1, a - 1), b = ri(-15, 15), r = (a - c) * x + b; return [`d${a}${c}${x}${b}`, { L: `${a}<i>x</i> ${b < 0 ? '&minus;' : '+'} ${Math.abs(b)}`, R: `${c === 1 ? '' : c}<i>x</i> ${r < 0 ? '&minus;' : '+'} ${Math.abs(r)}`, x, how: `move ${c}x across: ${a - c}x = ${fmt((a - c) * x)}` }]; }
  let a, c; do { a = ri(2, 6); c = ri(1, 9); } while (a === c);
  const b = ri(-6, 6) || 2, r = a * (x + b) - c * x;
  return [`e${a}${b}${c}${x}`, { L: `${a}(<i>x</i> ${b < 0 ? '&minus;' : '+'} ${Math.abs(b)})`, R: `${c === 1 ? '' : c}<i>x</i> ${r < 0 ? '&minus;' : '+'} ${Math.abs(r)}`, x, how: `expand to ${a}x ${a * b < 0 ? '&minus;' : '+'} ${Math.abs(a * b)}, then collect the x terms` }];
}

export const GAMES = [
  { id: 'balloons', modes: ['explorer'], title: 'Balloon pop', kid: 'Balloon pop', color: 'coral', rounds: 8, perQ: 8,
    desc: 'Pop exactly the number of balloons Bolt asks for, then press Done. It starts with small counts and grows into "two more than", "double" and "take away".',
    run(area, ctx) {
      const k = kit(ctx), { dial } = ctx; let want = 0, popped = 0;
      const ask = el('p', { class: 'g-q g-q-sm', 'aria-live': 'polite' }), sky = el('div', { class: 'g-sky', role: 'group', 'aria-label': 'Balloons' }), done = el('button', { class: 'md-btn md-btn--primary' }, 'Done'), tools = el('div', { class: 'g-tools' }); tools.append(done); area.append(ask, sky, tools);
      const cols = ['coral', 'teal', 'sun', 'sky', 'plum'];
      const next = () => {
        if (k.over(8)) return k.finish();
        const lv = dial.lv; popped = 0;
        const q = dial.fresh(() => { const n = ri(1, Math.min(20, 3 + lv));
          if (lv >= 12 && Math.random() < .6) { const t = pick(['more', 'less', 'double']); if (t === 'double' && n <= 10) return [`d${n}`, [n * 2, `double ${n}`]]; if (t === 'more') { const a = ri(1, 4); return [`m${n}+${a}`, [n + a, `${a} more than ${n}`]]; } const a = ri(1, 4); return [`l${n + a}-${a}`, [n, `${n + a} take away ${a}`]]; }
          return [`n${n}`, [n, String(n)]]; });
        want = q[0]; const total = Math.min(24, want + ri(2, 5));
        ask.innerHTML = `Pop <b>${q[1]}</b> balloon${want > 1 ? 's' : ''}!`; speakIt(`Pop ${q[1]} balloon${want > 1 ? 's' : ''}`);
        sky.innerHTML = ''; for (let i = 0; i < total; i++) { const b = el('button', { class: 'g-balloon', 'aria-label': 'Balloon', style: `--c: var(--${cols[i % 5]}); --d:${(i % 5) * 0.2}s` }, '<span></span>'); b.onclick = () => { if (b.disabled) return; b.disabled = true; b.classList.add('popped'); popped++; tapSfx('pop'); ctx.say(String(popped)); speakIt(String(popped)); }; sky.append(b); }
      };
      done.onclick = () => { const ok = popped === want; k.mark(ok, sky); ctx.say(ok ? `Yes! ${want}!` : `You popped ${popped}. We needed ${want}.`); setTimeout(next, 900); };
      next();
    } },
  { id: 'more-less', modes: ['explorer', 'challenger', 'pro'], title: 'Which is more?', kid: 'More or less', color: 'sun', rounds: 12, perQ: 12,
    desc: 'Tap the bigger one. It starts with dots, then numbers, fractions, decimals, powers and square roots as you get them right.',
    run(area, ctx) {
      const k = kit(ctx), { dial } = ctx; const row = el('div', { class: 'g-duel', role: 'group', 'aria-label': 'Pick the bigger one' }); area.append(row);
      const next = () => {
        if (k.over(12)) return k.finish();
        const q = dial.fresh(() => moreQ(dial.lv)), big = Math.max(q.va, q.vb);
        row.innerHTML = '';
        [[q.a, q.va], [q.b, q.vb]].forEach(([html, v]) => { const btn = el('button', { class: 'g-frac g-more' }, q.kind === 'dots' ? V.dots(v, v <= 6 ? 'dice' : 'line') : `<span class="g-big g-big-auto">${html}</span>`); btn.onclick = () => { const ok = v === big; k.mark(ok, row); ctx.say(ok ? 'Yes, that one is bigger!' : 'The other one was bigger.'); setTimeout(next, 650); }; row.append(btn); });
        if (dial.lv <= 4) speakIt('Which has more?');
      };
      next();
    } },
  { id: 'make-ten', modes: ['explorer', 'challenger', 'pro'], title: 'Make the target', kid: 'Make ten!', color: 'coral', secs: 60, perQ: 14,
    desc: 'Tap two numbers that add up to the target. The target grows from 10 to 20, 100, 1,000 and then decimals that make 1.',
    run(area, ctx) {
      const k = kit(ctx), { dial } = ctx; let sel = null, key = '', T = 0, vals = [];
      const targetFor = lv => lv <= 3 ? [10, 1] : lv <= 6 ? [20, 1] : lv <= 9 ? [100, 5] : lv <= 12 ? [100, 1] : lv <= 15 ? [1000, 10] : lv <= 18 ? [1, 0.1] : [1, 0.01];
      const say = el('p', { class: 'g-say' }), board = el('div', { class: 'g-board g-tiles', role: 'group' }); area.append(say, board);
      const pair = () => { const [t, step] = targetFor(dial.lv), n = Math.round(t / step), a = Math.round(ri(1, n - 1) * step * 100) / 100; return [a, Math.round((t - a) * 100) / 100]; };
      const setup = () => { const [t, step] = targetFor(dial.lv); T = t; key = `${t}/${step}`; vals = shuffle([...pair(), ...pair(), ...pair(), ...pair(), ...pair(), ...pair()]); say.innerHTML = `Find pairs that make <b>${T}</b>.`; board.setAttribute('aria-label', `Pick two that make ${T}`); draw(); };
      const draw = () => { board.innerHTML = ''; vals.forEach((v, i) => { const b = el('button', { class: 'g-tile', 'aria-pressed': String(sel === i) }, String(v)); b.onclick = () => choose(i); board.append(b); }); };
      const choose = i => {
        if (sel === null) { sel = i; draw(); return; } if (sel === i) { sel = null; draw(); return; }
        const a = sel; sel = null; const ok = Math.abs(vals[a] + vals[i] - T) < 1e-9;
        k.mark(ok, board); ctx.say(ok ? `${vals[a]} + ${vals[i]} = ${T}` : `${vals[a]} + ${vals[i]} = ${Math.round((vals[a] + vals[i]) * 100) / 100}. Not ${T}.`);
        const [t2, s2] = targetFor(dial.lv); if (`${t2}/${s2}` !== key) return setup();
        if (ok) { const [p, q] = pair(); vals[a] = p; vals[i] = q; } draw();
      };
      setup();
      return k.timed(area, ctx.secs || 60);
    } },
  { id: 'quick-look', modes: ['explorer', 'challenger'], title: 'Quick look', kid: 'Flash dots', color: 'sun', rounds: 12, perQ: 12,
    desc: 'Dots flash for a moment. Say how many without counting one by one. More dots and shorter flashes as you improve.',
    run(area, ctx) {
      const k = kit(ctx), { dial } = ctx; let hideT = 0; const stage = el('div', { class: 'g-stage' }), opts = el('div', { class: 'g-opts', role: 'group', 'aria-label': 'How many dots?' }); area.append(stage, opts);
      const next = () => {
        if (k.over(12)) return k.finish();
        const lv = dial.lv, n = dial.fresh(() => { const hi = lv <= 8 ? 3 + lv : lv <= 14 ? 20 : 30, lo = lv <= 8 ? 1 : lv <= 14 ? 9 : 15, v = ri(lo, hi); return [`n${v}`, v]; });
        stage.innerHTML = n <= 6 && lv <= 6 ? V.dots(n) : V.tenFrame(n, 0, Math.ceil(n / 10)); stage.classList.remove('g-hidden');
        clearTimeout(hideT); hideT = setTimeout(() => stage.classList.add('g-hidden'), Math.max(350, 1600 - lv * 60));
        opts.innerHTML = ''; near(n, lv > 10 ? 3 : 2, 4, v => v > 0).sort((a, b) => a - b).forEach(v => { const b = el('button', { class: 'md-chip' }, String(v)); b.onclick = () => { const ok = v === n; k.mark(ok, stage); ctx.say(ok ? `Yes, ${n}!` : `It was ${n}.`); stage.classList.remove('g-hidden'); opts.querySelectorAll('button').forEach(x => (x.disabled = true)); setTimeout(next, 800); }; opts.append(b); });
      };
      next();
      return () => clearTimeout(hideT);
    } },
  { id: 'bonds', modes: ['explorer', 'challenger', 'pro'], title: 'Number bonds', kid: 'Bond builder', color: 'teal', secs: 60, perQ: 16,
    desc: 'The whole is on top and one part is shown. Find the missing part fast. Wholes grow from 10 to 20, 100, 1,000 and then decimals.',
    run(area, ctx) {
      const k = kit(ctx), { dial } = ctx; const fig = el('div', { class: 'bond' }), opts = el('div', { class: 'g-opts', role: 'group', 'aria-label': 'Missing part' }); area.append(fig, opts);
      const next = () => {
        const lv = dial.lv;
        const [W, a, step] = dial.fresh(() => {
          let W, a, step = 1;
          if (lv <= 3) { W = ri(4, 10); a = ri(1, W - 1); } else if (lv <= 6) { W = ri(11, 20); a = ri(1, W - 1); }
          else if (lv <= 9) { W = ri(2, 10) * 10; a = ri(1, W / 10 - 1) * 10; step = 10; } else if (lv <= 12) { W = ri(30, 100); a = ri(1, W - 1); }
          else if (lv <= 15) { W = ri(2, 10) * 100; a = ri(11, W - 11); if (lv === 13) { a = Math.round(a / 10) * 10; step = 10; } }
          else if (lv <= 18) { W = pick([1, 10]); step = 0.1; a = Math.round(ri(1, W * 10 - 1)) / 10; }
          else { W = pick([1, 10, 100]); step = 0.01; a = Math.round(ri(1, W * 100 - 1)) / 100; }
          return [`${W}-${a}`, [W, a, step]]; });
        const b = Math.round((W - a) * 100) / 100;
        fig.innerHTML = `<span class="bond-w">${fmt(W)}</span><span class="bond-l"></span><span class="bond-r"></span><span class="bond-a">${fmt(a)}</span><span class="bond-b">?</span>`;
        const choices = new Set([b]); let g = 0; while (choices.size < 4 && g++ < 80) { const v = Math.round((b + pick([-1, 1]) * step * ri(1, 3)) * 100) / 100; if (v > 0 && v !== b) choices.add(v); }
        opts.innerHTML = ''; shuffle([...choices]).forEach(v => { const btn = el('button', { class: 'md-chip' }, fmt(v)); btn.onclick = () => { const ok = v === b; k.mark(ok, fig); ctx.say(ok ? `${fmt(a)} + ${fmt(b)} = ${fmt(W)}` : `${fmt(a)} + ${fmt(b)} = ${fmt(W)}, so the part is ${fmt(b)}.`); next(); }; opts.append(btn); });
      };
      next();
      return k.timed(area, ctx.secs || 60);
    } },
  { id: 'times-sprint', modes: ['challenger', 'pro'], title: 'Times sprint', kid: 'Times rocket', color: 'sky', secs: 60, perQ: 12,
    desc: 'Multiplication against the clock. It climbs from the 2s table to teens, 2-digit, near-100, 3-digit and 4-digit products as you get them right. Miss one and you see a speed trick for it.',
    run(area, ctx) {
      const k = kit(ctx), { dial } = ctx; let cur;
      const q = el('div', { class: 'g-q', 'aria-live': 'polite' }), form = el('form', { class: 'g-form' }, '<input inputmode="numeric" autocomplete="off" aria-label="Answer" class="ans-in"><button class="md-btn md-btn--primary md-btn--sm">Go</button>'), tip = el('p', { class: 'g-tip', 'aria-live': 'polite' });
      area.append(q, form, tip); const inp = form.querySelector('input');
      const next = () => { cur = dial.fresh(() => timesQ(dial.lv)); q.innerHTML = `${fmt(cur.a)} &times; ${fmt(cur.b)}`; inp.value = ''; inp.focus(); };
      form.onsubmit = e => { e.preventDefault(); const v = inp.value.replace(/[,\s]/g, ''); if (!v) return; const ok = +v === cur.ans; k.mark(ok, q); tip.innerHTML = ok ? '' : `${fmt(cur.a)} &times; ${fmt(cur.b)} = ${fmt(cur.ans)}. ${timesTip(cur.a, cur.b)}`; next(); };
      next();
      return k.timed(area, ctx.secs || 60);
    } },
  { id: 'target', modes: ['challenger', 'pro'], title: 'Hit the target', kid: 'Number detective', color: 'plum', rounds: 5, perQ: 4,
    desc: 'Use all the numbers once each with + − × ÷ and brackets to make the target. Puzzles get bigger and harder as you solve them. Every puzzle has an answer.',
    run(area, ctx) {
      const k = kit(ctx), { dial } = ctx; let puzzle;
      const solve = (nums, target) => {
        const go = items => { if (items.length === 1) return Math.abs(items[0].v - target) < 1e-9 ? items[0].s : null;
          for (let i = 0; i < items.length; i++) for (let j = 0; j < items.length; j++) { if (i === j) continue; const a = items[i], b = items[j], rest = items.filter((_, x) => x !== i && x !== j);
            const cands = [{ v: a.v - b.v, s: `(${a.s} - ${b.s})` }]; if (b.v) cands.push({ v: a.v / b.v, s: `(${a.s} ÷ ${b.s})` });
            if (i < j) cands.push({ v: a.v + b.v, s: `(${a.s} + ${b.s})` }, { v: a.v * b.v, s: `(${a.s} × ${b.s})` });
            for (const c of cands) { const r = go([...rest, c]); if (r) return r; } }
          return null; };
        return go(nums.map(n => ({ v: n, s: String(n) })));
      };
      const shape = lv => lv <= 3 ? { count: 3, max: 6, target: [5, 15] } : lv <= 7 ? { count: 4, max: 9, target: [10, 30] } : lv <= 11 ? { count: 4, max: 9, target: [24, 24] } : lv <= 15 ? { count: 4, max: 13, target: [24, 60] } : lv <= 18 ? { count: 4, max: 13, target: [50, 120] } : { count: 5, max: 13, target: [100, 300] };
      const box = el('div', { class: 'g-target' }), form = el('form', { class: 'g-form' }, '<input autocomplete="off" aria-label="Your expression" class="ans-in" placeholder="(8 - 4) × 3 × 2"><button class="md-btn md-btn--primary md-btn--sm">Check</button>');
      const tools = el('div', { class: 'g-tools' }), msg = el('p', { class: 'g-tip', 'aria-live': 'polite' }); area.append(box, form, msg, tools);
      const skip = el('button', { class: 'md-btn md-btn--sm', type: 'button' }, 'Show an answer (counts as a miss)'); tools.append(skip);
      const inp = form.querySelector('input');
      const fresh = () => {
        if (k.over(5)) return k.finish();
        const S = shape(dial.lv);
        puzzle = dial.fresh(() => { let nums, target, sol, g = 0; do { nums = Array.from({ length: S.count }, () => ri(1, S.max)); target = ri(S.target[0], S.target[1]); sol = solve(nums, target); } while (!sol && ++g < 400); return [nums.slice().sort((a, b) => a - b).join(',') + '>' + target, { nums, target, sol }]; });
        box.innerHTML = `<div class="g-target-t">${puzzle.target}</div><div class="g-target-n">${puzzle.nums.map(n => `<span>${n}</span>`).join('')}</div>`; inp.value = ''; msg.textContent = '';
      };
      form.onsubmit = e => { e.preventDefault(); const s = inp.value.replace(/x/gi, '*').replace(/×/g, '*').replace(/÷/g, '/');
        const used = (s.match(/\d+/g) || []).map(Number).sort((a, b) => a - b), want = puzzle.nums.slice().sort((a, b) => a - b);
        if (used.join() !== want.join()) { msg.textContent = `Use each of ${puzzle.nums.join(', ')} exactly once.`; flash(box, false); return; }
        const v = evalNum(s); if (Number.isNaN(v)) { msg.textContent = 'I could not read that. Use + - * / and brackets.'; return; }
        if (Math.abs(v - puzzle.target) < 1e-9) { k.mark(true, box); ctx.say('Solved!'); setTimeout(fresh, 700); } else { msg.textContent = `That makes ${Math.round(v * 1000) / 1000}, not ${puzzle.target}. Keep trying.`; flash(box, false); } };
      skip.onclick = () => { k.mark(false, box); msg.textContent = `One answer: ${puzzle.sol.replace(/^\((.*)\)$/, '$1')}`; setTimeout(fresh, 2200); };
      fresh();
    } },
  { id: 'frac-faceoff', modes: ['challenger', 'pro'], title: 'Fraction face-off', kid: 'Bigger slice', color: 'plum', secs: 60, perQ: 14,
    desc: 'Tap the bigger fraction. Pairs get closer together and the denominators grow as you get them right, then decimals join in.',
    run(area, ctx) {
      const k = kit(ctx), { dial } = ctx; const row = el('div', { class: 'g-duel', role: 'group', 'aria-label': 'Pick the bigger one' }), fig = el('div', { class: 'g-fig' }); area.append(row, fig);
      const next = () => {
        const lv = dial.lv;
        const q = dial.fresh(() => {
          const D = Math.min(24, 4 + lv), gap = Math.max(0.01, 0.45 - lv * 0.022); let a, b, c, d, g = 0;
          do { b = ri(2, D); a = ri(1, b - 1); d = ri(2, D); c = ri(1, d - 1); if (lv <= 3 && Math.random() < .5) d = b; } while ((a * d === b * c || Math.abs(a / b - c / d) > gap + 0.2 || Math.abs(a / b - c / d) < gap / 3) && ++g < 400);
          if (a * d === b * c) { a = 1; b = 2; c = 1; d = 3; }
          if (lv >= 13 && Math.random() < .4) { const dec = Math.round((c / d + pick([-1, 1]) * ri(1, 4) / 100) * 100) / 100; if (dec > 0 && dec < 1 && dec !== a / b) return [`fd${a}/${b}-${dec}`, [[frac(a, b), a / b, a, b], [String(dec), dec]]]; }
          return [`${a}/${b}-${c}/${d}`, [[frac(a, b), a / b, a, b], [frac(c, d), c / d, c, d]]]; });
        row.innerHTML = '';
        q.forEach(([html, v]) => { const btn = el('button', { class: 'g-frac' }, html); btn.onclick = () => { const ok = v >= Math.max(q[0][1], q[1][1]); k.mark(ok, row); fig.innerHTML = q[0][2] && q[1][2] ? V.fracBar(q[0][2], q[0][3], { w: 240 }) + V.fracBar(q[1][2], q[1][3], { w: 240, cls: 'vz-teal' }) : ''; ctx.say(ok ? 'Right!' : 'The other one was bigger.'); next(); }; row.append(btn); });
      };
      next();
      return k.timed(area, ctx.secs || 60);
    } },
  { id: 'line-snipe', modes: ['explorer', 'challenger', 'pro'], title: 'Number line sniper', kid: 'Number line', color: 'sky', rounds: 10, perQ: 10,
    desc: 'Place the number on the line and land inside the target zone. Lines grow from 0 to 10 up to a million, then fractions, decimals and negatives, and the zone shrinks.',
    run(area, ctx) {
      const k = kit(ctx), { dial } = ctx; let cur;
      const prompt = el('div', { class: 'g-q', 'aria-live': 'polite' }), wrap = el('div', { class: 'g-line' }), form = el('form', { class: 'g-form' }, '<button class="md-btn md-btn--primary md-btn--sm">Place it</button>'); area.append(prompt, wrap, form);
      const kindFor = lv => lv <= 3 ? [0, 10, 'int'] : lv <= 6 ? [0, 100, 'int'] : lv <= 9 ? [0, 1000, 'int'] : lv <= 12 ? [0, 1, 'frac'] : lv <= 15 ? [0, 1, 'dec'] : lv <= 18 ? [-100, 100, 'int'] : [0, 1000000, 'int'];
      const next = () => {
        if (k.over(10)) return k.finish();
        const [lo, hi, type] = kindFor(dial.lv), tol = Math.max(0.015, 0.08 - dial.lv * 0.0035);
        cur = dial.fresh(() => { if (type === 'frac') { const d = pick([2, 3, 4, 5, 6, 8, 10, 12]), n = ri(1, d - 1); return [`${n}/${d}`, { v: n / d, html: frac(n, d) }]; } if (type === 'dec') { const v = ri(1, 99) / 100; return [`d${v}`, { v, html: String(v) }]; } const step = hi >= 1000000 ? 1000 : 1, v = ri(Math.ceil(lo / step) + 1, Math.floor(hi / step) - 1) * step; return [`i${v}`, { v, html: fmt(v) }]; });
        cur = { ...cur, lo, hi, tol };
        wrap.innerHTML = `<div class="g-line-track"><span class="g-line-zone" hidden></span><span class="g-line-true" hidden></span></div><input type="range" min="0" max="1000" value="500" aria-label="Position on the number line"><div class="g-line-labels"><span>${fmt(lo)}</span><span>${fmt(hi)}</span></div>`;
        prompt.innerHTML = `Where is ${cur.html}?`;
      };
      form.onsubmit = e => { e.preventDefault(); const r = wrap.querySelector('input'), guess = cur.lo + (r.value / 1000) * (cur.hi - cur.lo), err = Math.abs(guess - cur.v) / (cur.hi - cur.lo), ok = err <= cur.tol;
        const at = p => ((p - cur.lo) / (cur.hi - cur.lo)) * 100, mark = wrap.querySelector('.g-line-true'), zone = wrap.querySelector('.g-line-zone');
        mark.style.left = at(cur.v) + '%'; mark.hidden = false; zone.style.left = Math.max(0, at(cur.v) - cur.tol * 100) + '%'; zone.style.width = cur.tol * 200 + '%'; zone.hidden = false;
        k.mark(ok, wrap); ctx.say(ok ? `On target! ${Math.round(err * 1000) / 10}% away.` : `${Math.round(err * 1000) / 10}% away. The zone was ${Math.round(cur.tol * 1000) / 10}% each side.`); setTimeout(next, 1200); };
      next();
    } },
  { id: 'pairs', modes: ['explorer', 'challenger', 'pro'], title: 'Memory match', kid: 'Match the pairs', color: 'teal', rounds: 2, perQ: 10,
    desc: 'Flip two cards at a time and match partners: dots and numbers, products, squares and cubes, fractions with decimals and percents, then sutras and their meanings. Bigger boards as you improve.',
    run(area, ctx) {
      const k = kit(ctx), { dial } = ctx; let boards = 0;
      const SETS = [
        [1, () => { const n = ri(1, 10); return [String(n), `<span class="g-dotsm">${'&#9679;'.repeat(n)}</span>`]; }],
        [4, () => { const a = ri(2, 10), b = ri(2, 10); return [`${a} &times; ${b}`, String(a * b)]; }],
        [8, () => { const n = ri(4, 25); return [`${n}<sup>2</sup>`, String(n * n)]; }],
        [11, () => { const n = ri(2, 12); return [`${n}<sup>3</sup>`, fmt(n ** 3)]; }],
        [13, () => { const [n, d] = pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 8], [3, 8], [5, 8], [7, 8], [1, 20], [1, 25], [3, 20], [7, 20], [9, 25]]); return [frac(n, d), String(n / d)]; }],
        [15, () => { const [n, d] = pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 8], [1, 8], [7, 10], [3, 20], [1, 3], [2, 3]]); return [frac(n, d), `${Math.round((n / d) * 1000) / 10}%`]; }],
        [17, () => { const c = pick(SUTRAS); return [`<i lang="sa-Latn">${c.name}</i>`, c.meaning]; }]
      ];
      const grid = el('div', { class: 'g-pairs', role: 'group', 'aria-label': 'Memory cards' }); area.append(el('p', { class: 'g-say' }, 'Flip two cards. Find the partners.'), grid);
      const deal = () => {
        if (!ctx.endless && boards >= 2) return k.finish(); boards++;
        const lv = dial.lv, mk = SETS.filter(([m]) => m <= lv).map(([, f]) => f).slice(-2), n = Math.min(10, 3 + Math.floor(lv / 3));
        const pairs = [], used = new Set(); let g = 0; while (pairs.length < n && g++ < 600) { const [a, b] = pick(mk)(); if (used.has(a) || used.has(b) || (dial.seen.has(a) && g < 300)) continue; used.add(a); used.add(b); dial.seen.add(a); pairs.push([a, b]); }
        const cards = shuffle(pairs.flatMap((pr, i) => [{ h: pr[0], k: i }, { h: pr[1], k: i }])); let open = [], matched = 0, misses = 0, lock = false;
        grid.innerHTML = ''; grid.style.setProperty('--cols', String(Math.min(6, Math.ceil(Math.sqrt(cards.length * 1.4)))));
        const flip = i => {
          const c = cards[i]; if (lock || c.done || open.includes(c)) return; c.el.classList.add('up'); c.el.setAttribute('aria-label', c.el.textContent); tapSfx('tap'); open.push(c);
          if (open.length < 2) return; lock = true; const [x, y] = open;
          if (x.k === y.k) { x.done = y.done = true; x.el.classList.add('got'); y.el.classList.add('got'); matched++; k.mark(misses <= 1, null); misses = 0; open = []; lock = false; ctx.say(`Match! ${matched} of ${pairs.length}.`); if (matched === pairs.length) setTimeout(deal, 700); }
          else { misses++; setTimeout(() => { x.el.classList.remove('up'); y.el.classList.remove('up'); x.el.setAttribute('aria-label', 'Hidden card'); y.el.setAttribute('aria-label', 'Hidden card'); open = []; lock = false; }, 900); }
        };
        cards.forEach((c, i) => { const b = el('button', { class: 'g-card', 'aria-label': 'Hidden card' }, `<span class="g-card-in">${c.h}</span>`); c.el = b; b.onclick = () => flip(i); grid.append(b); });
      };
      deal();
    } },
  { id: 'check-it', modes: ['challenger', 'pro'], title: 'Answer checker', kid: 'Spot the mistake', color: 'coral', secs: 60, perQ: 14,
    desc: 'Is the answer right or wrong? Use the digit sum check (casting out nines) to decide in seconds. The products get bigger as you get them right.',
    run(area, ctx) {
      const k = kit(ctx), { dial } = ctx; let cur; const q = el('div', { class: 'g-q' }), row = el('div', { class: 'g-duel', role: 'group', 'aria-label': 'Right or wrong' }), tip = el('p', { class: 'g-tip', 'aria-live': 'polite' }); area.append(q, row, tip);
      const ds = n => Math.abs(n) % 9;
      const next = () => {
        const lv = dial.lv, [da, db] = lv <= 3 ? [2, 1] : lv <= 7 ? [2, 2] : lv <= 11 ? [3, 2] : lv <= 15 ? [3, 3] : lv <= 18 ? [4, 3] : [4, 4];
        cur = dial.fresh(() => { const a = nd(da), b = nd(db), right = Math.random() < .5; let c = a * b; if (!right) { let off; do { off = pick(lv >= 12 ? [1, 2, 3, 10, 20, 100, 1000] : [1, 2, 10, 100]) * pick([1, -1]) * (lv >= 15 ? ri(1, 3) : 1); } while (off % 9 === 0); c += off; } return [`${a}x${b}=${c}`, { right, a, b, c }]; });
        q.innerHTML = `${fmt(cur.a)} &times; ${fmt(cur.b)} = ${fmt(cur.c)}`;
      };
      ['Right', 'Wrong'].forEach(lab => { const btn = el('button', { class: 'md-btn' + (lab === 'Right' ? ' md-btn--primary' : '') }, lab); btn.onclick = () => { const ok = (lab === 'Right') === cur.right; k.mark(ok, q); tip.innerHTML = `Digit sums: ${ds(cur.a)} &times; ${ds(cur.b)} gives ${ds(ds(cur.a) * ds(cur.b))}; the answer gives ${ds(cur.c)}. ${cur.right ? 'It was right.' : 'It was wrong.'}`; next(); }; row.append(btn); });
      next();
      return k.timed(area, ctx.secs || 60);
    } },
  { id: 'rain', modes: ['explorer', 'challenger', 'pro'], title: 'Multiple rain', kid: 'Number rain', color: 'sky', secs: 45, perQ: 14,
    desc: 'Numbers drift down. Tap only the multiples of the magic number. The magic number changes as you level up, from 2 to tricky ones like 13, 17 and 25, and the rain speeds up.',
    run(area, ctx) {
      const k = kit(ctx), { dial } = ctx; const K = [2, 5, 10, 3, 4, 6, 9, 8, 7, 11, 12, 15, 13, 25, 14, 17, 18, 19, 23, 27];
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; let raf = 0, last = performance.now(), spawnT = 0, stopped = false, kv = K[dial.lv - 1];
      const head = el('p', { class: 'g-say' }), sky = el('div', { class: 'g-rain', role: 'group' }); area.append(head, sky);
      const setK = () => { kv = K[dial.lv - 1]; head.innerHTML = `Tap the multiples of <b>${kv}</b>.`; sky.setAttribute('aria-label', `Falling numbers. Tap multiples of ${kv}.`); };
      const check = () => { if (K[dial.lv - 1] !== kv) setK(); };
      setK(); const drops = [];
      const spawn = () => { const top = kv * (8 + dial.lv), mult = Math.random() < .5; let n; if (mult) n = kv * ri(1, Math.max(2, Math.floor(top / kv))); else { do { n = ri(2, top); } while (n % kv === 0); }
        const b = el('button', { class: 'g-drop' }, String(n)); b.style.left = ri(4, 84) + '%'; sky.append(b); const d = { b, y: -10, n, k: kv }; drops.push(d);
        b.onclick = () => { if (d.gone) return; d.gone = true; const ok = n % d.k === 0; k.mark(ok, null); tapSfx(ok ? 'pop' : 'no'); ctx.say(ok ? `${n} = ${d.k} &times; ${n / d.k}` : `${n} is not a multiple of ${d.k}.`); b.classList.add(ok ? 'hit' : 'miss'); setTimeout(() => b.remove(), 250); check(); }; };
      const step = now => { if (stopped) return; const dt = Math.min(.05, (now - last) / 1000); last = now; const speed = (0.8 + dial.lv * 0.07) * (reduced ? .6 : 1); spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = 1.35 / speed; }
        const H = sky.clientHeight || 360; drops.forEach(d => { if (d.gone) return; d.y += dt * 60 * speed; d.b.style.transform = `translateY(${(d.y * H) / 100}px)`; if (d.y > 92) { d.gone = true; d.b.remove(); if (d.n % d.k === 0) { k.mark(false, null); ctx.say(`Missed ${d.n}, a multiple of ${d.k}.`); check(); } } }); raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
      const stopT = ctx.endless ? null : timer(area, ctx.secs || 45, () => { stopped = true; cancelAnimationFrame(raf); k.finish(); });
      return () => { stopped = true; cancelAnimationFrame(raf); if (stopT) stopT(); };
    } },
  { id: 'sequence', modes: ['challenger', 'pro'], title: 'Pattern spotter', kid: 'What comes next?', color: 'sun', rounds: 12, perQ: 12,
    desc: 'Find the next number. Patterns climb from counting steps to squares, triangles, the Virahāṅka-Fibonacci numbers (described in India over 1,300 years ago), primes and interleaved patterns.',
    run(area, ctx) {
      const k = kit(ctx), { dial } = ctx; const q = el('div', { class: 'g-q g-q-sm' }), opts = el('div', { class: 'g-opts', role: 'group', 'aria-label': 'Next number' }), tip = el('p', { class: 'g-tip', 'aria-live': 'polite' }); area.append(q, opts, tip);
      const next = () => {
        if (k.over(12)) return k.finish();
        const s = dial.fresh(() => seqQ(dial.lv)), last = s.shown[s.shown.length - 1], prev = s.shown[s.shown.length - 2];
        q.innerHTML = `${s.shown.map(fmt).join(', ')}, <b>?</b>`; opts.innerHTML = '';
        const wrong = [...new Set([s.ans + 1, s.ans - 1, last + (last - prev), s.ans + (last - prev), s.ans * 2 - last, s.ans + 2])].filter(v => v !== s.ans && v !== last);
        shuffle([s.ans, ...shuffle(wrong).slice(0, 3)]).forEach(v => { const b = el('button', { class: 'md-chip' }, fmt(v)); b.onclick = () => { const ok = v === s.ans; k.mark(ok, q); tip.textContent = `${s.ans}: ${s.rule}.`; setTimeout(next, 650); }; opts.append(b); });
      };
      next();
    } },
  { id: 'balance', modes: ['challenger', 'pro'], title: 'Balance the scale', kid: 'Balance it', color: 'plum', secs: 60, perQ: 10,
    desc: 'Find the mystery number that keeps the scale level. It climbs from x + 3 = 9 to equations with x on both sides and brackets: Parāvartya Yojayet in action.',
    run(area, ctx) {
      const k = kit(ctx), { dial } = ctx; const fig = el('div', { class: 'g-balance' }), opts = el('div', { class: 'g-opts', role: 'group', 'aria-label': 'Mystery number' }), tip = el('p', { class: 'g-tip', 'aria-live': 'polite' }); area.append(fig, opts, tip);
      const next = () => {
        const q = dial.fresh(() => balanceQ(dial.lv));
        fig.innerHTML = V.balance(q.L, q.R); opts.innerHTML = '';
        near(q.x, 3, 4, v => dial.lv > 8 || v > 0).forEach(v => { const b = el('button', { class: 'md-chip' }, fmt(v)); b.onclick = () => { const ok = v === q.x; k.mark(ok, fig); tip.innerHTML = `x = ${fmt(q.x)}: ${q.how}.`; next(); }; opts.append(b); });
      };
      next();
      return k.timed(area, ctx.secs || 60);
    } }
];

/* ---------- Levels: 72 per game (1,008 in all). Each level starts the dial higher, never lets it fall more
   than 3 steps below its start, and sets star goals in difficulty-weighted points. ---------- */
export const LEVELS_PER_GAME = 72;
const round10 = v => Math.max(10, Math.round(v / 10) * 10);
export const LEVELS = Object.fromEntries(GAMES.map(g => [g.id, L => {
  const start = levelStart(L, LEVELS_PER_GAME), p = pointsAt(start), n = g.perQ;
  const goal = [round10(n * p * 0.45), round10(n * p * 0.75), round10(n * p * 1.0)];
  if (goal[1] <= goal[0]) goal[1] = goal[0] + 10; if (goal[2] <= goal[1]) goal[2] = goal[1] + 10;
  return { cfg: { start, floor: Math.max(1, start - 3) }, goal };
}]));
export const levelStars = (goal, score) => goal.filter(t => score >= t).length;
/* Board id prefix for a game's leaderboards: game ids use _ in board names (the rules list them) */
export const boardGame = id => 'g_' + id.replace(/-/g, '_');
