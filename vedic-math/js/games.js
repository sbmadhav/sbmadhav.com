/* Strategy games: quick, replayable practice for the ideas that make mental math fast.
   Each game runs inside the shell in app.js and calls end(score) when a round is over. Play never starts on its own. */
import { ri, pick, shuffle, gcd } from './lib.js';
import { evalNum } from './check.js';
import { factStrategy } from './skills/middle.js';
import * as V from './viz.js';
import { sfx as tapSfx, speak as speakIt } from './fx.js';
import { SUTRAS } from './sutras.js';

const el = (tag, attrs = {}, html = '') => { const e = document.createElement(tag); Object.entries(attrs).forEach(([k, v]) => (k === 'class' ? (e.className = v) : e.setAttribute(k, v))); if (html) e.innerHTML = html; return e; };

function timer(root, secs, onEnd) {
  const bar = el('div', { class: 'g-timer', role: 'timer', 'aria-label': `${secs} seconds` }, '<span></span>'), fill = bar.firstChild; root.prepend(bar);
  const t0 = performance.now(); let raf = 0, stopped = false;
  const tick = () => { if (stopped) return; const left = Math.max(0, secs - (performance.now() - t0) / 1000); fill.style.width = (left / secs) * 100 + '%'; bar.dataset.left = Math.ceil(left) + 's'; if (left <= 0) { stopped = true; onEnd(); return; } raf = requestAnimationFrame(tick); };
  raf = requestAnimationFrame(tick);
  return () => { stopped = true; cancelAnimationFrame(raf); };
}
const flash = (node, ok) => { tapSfx(ok ? 'ok' : 'no'); node.classList.remove('g-ok', 'g-no'); void node.offsetWidth; node.classList.add(ok ? 'g-ok' : 'g-no'); };

export const GAMES = [
  { id: 'balloons', title: 'Balloon pop', kid: 'Balloon pop', color: 'coral', grades: 'Explorer', modes: ['explorer'],
    desc: 'Pop exactly the number of balloons Bolt asks for, then press Done. Counting one by one, out loud, is the skill.',
    run(area, { end, say, endless, progress = () => {}, cfg = {} }) {
      let round = 0, score = 0, popped = 0, want = 0; const ask = el('p', { class: 'g-q g-q-sm', 'aria-live': 'polite' }), sky = el('div', { class: 'g-sky', role: 'group', 'aria-label': 'Balloons' }), done = el('button', { class: 'md-btn md-btn--primary' }, 'Done'); area.append(ask, sky, el('div', { class: 'g-tools' }));
      area.lastChild.append(done);
      const cols = ['coral', 'teal', 'sun', 'sky', 'plum'];
      const next = () => { if (!endless && round === (cfg.rounds || 8)) return end(score); round++; popped = 0; const mx = cfg.max || 10; want = ri(1, round < 4 ? Math.min(5, mx) : mx); const total = Math.min(16, want + ri(2, 5));
        ask.innerHTML = `Pop <b>${want}</b> balloon${want > 1 ? 's' : ''}!`; speakIt(`Pop ${want} balloon${want > 1 ? 's' : ''}`);
        sky.innerHTML = ''; for (let i = 0; i < total; i++) { const b = el('button', { class: 'g-balloon', 'aria-label': 'Balloon', style: `--c: var(--${cols[i % 5]}); --d:${(i % 5) * 0.2}s` }, '<span></span>'); b.onclick = () => { if (b.disabled) return; b.disabled = true; b.classList.add('popped'); popped++; tapSfx('pop'); say(String(popped)); speakIt(String(popped)); }; sky.append(b); } };
      done.onclick = () => { const ok = popped === want; if (ok) score++; progress(score); say(ok ? `Yes! ${want}!` : `You popped ${popped}. We needed ${want}.`); flash(sky, ok); setTimeout(next, 900); };
      next();
    } },
  { id: 'more-less', title: 'Which has more?', kid: 'More or less', color: 'sun', grades: 'Explorer', modes: ['explorer'],
    desc: 'Tap the side with more dots. Then try it with numbers. Comparing amounts is the start of number sense.',
    run(area, { end, say, endless, progress = () => {}, cfg = {} }) {
      let round = 0, score = 0; const row = el('div', { class: 'g-duel', role: 'group', 'aria-label': 'Pick the side with more' }); area.append(row);
      const next = () => { if (!endless && round === (cfg.rounds || 10)) return end(score); round++; const mx = cfg.max || 10; let a = ri(1, mx), b = ri(1, mx); while (a === b) b = ri(1, mx); const nums = mx > 10 || round > (cfg.dots ?? 5);
        row.innerHTML = ''; [a, b].forEach(v => { const btn = el('button', { class: 'g-frac g-more' }, nums ? `<span class="g-big">${v}</span>` : V.dots(v, v <= 6 ? 'dice' : 'line')); btn.onclick = () => { const ok = v === Math.max(a, b); if (ok) score++; progress(score); say(ok ? `Yes, ${v} is more!` : `${Math.max(a, b)} is more than ${Math.min(a, b)}.`); flash(row, ok); setTimeout(next, 700); }; row.append(btn); });
        speakIt('Which has more?'); };
      next();
    } },
  { id: 'make-ten', modes: ['explorer', 'challenger'], title: 'Make the target', kid: 'Make ten!', color: 'coral', grades: 'K to 3',
    desc: 'Tap two numbers that add up to the target. Partners of 10 are the base of almost every mental math strategy.',
    options: [{ label: 'Make 10', value: 10 }, { label: 'Make 20', value: 20 }, { label: 'Make 100', value: 100 }],
    run(area, { end, option, say, endless, progress = () => {}, cfg = {} }) {
      const T = option || 10, small = T === 100 ? 5 : 1, pair = () => { const a = T === 100 ? ri(1, 19) * 5 : ri(small, T - small); return [a, T - a]; };
      let score = 0, sel = null; const board = el('div', { class: 'g-board g-tiles', role: 'group', 'aria-label': `Numbers. Pick two that make ${T}.` }); area.append(el('p', { class: 'g-say' }, `Find pairs that make <b>${T}</b>.`), board);
      let vals = shuffle([...pair(), ...pair(), ...pair(), ...pair(), ...pair(), ...pair()]);
      const draw = () => { board.innerHTML = ''; vals.forEach((v, i) => { const b = el('button', { class: 'g-tile', 'aria-pressed': 'false' }, String(v)); b.onclick = () => choose(i, b); board.append(b); }); };
      const choose = (i, b) => {
        if (sel === null) { sel = i; b.setAttribute('aria-pressed', 'true'); return; }
        if (sel === i) { sel = null; b.setAttribute('aria-pressed', 'false'); return; }
        const a = sel; sel = null;
        if (vals[a] + vals[i] === T) { score++; progress(score); say(`${vals[a]} + ${vals[i]} = ${T}`); const [p, q] = pair(); vals[a] = p; vals[i] = q; draw(); flash(board, true); }
        else { say(`${vals[a]} + ${vals[i]} = ${vals[a] + vals[i]}. Not ${T}.`); draw(); flash(board, false); }
      };
      draw();
      return endless ? undefined : timer(area, cfg.secs || 60, () => end(score));
    } },
  { id: 'quick-look', modes: ['explorer'], title: 'Quick look', kid: 'Flash dots', color: 'sun', grades: 'K to 2',
    desc: 'Dots flash for a moment. Say how many without counting one by one. Seeing groups (five and some more) is the skill.',
    run(area, { end, say, endless, progress = () => {}, cfg = {} }) {
      let round = 0, score = 0; const stage = el('div', { class: 'g-stage' }), opts = el('div', { class: 'g-opts', role: 'group', 'aria-label': 'How many dots?' }); area.append(stage, opts);
      let hideT = 0;
      const next = () => {
        if (!endless && round === (cfg.rounds || 10)) return end(score);
        round++; const mx = cfg.max || 10; const n = ri(round < 4 ? 2 : Math.min(4, mx - 2), round < 4 ? Math.min(6, mx) : mx), useFrame = n > 6 || Math.random() < .4;
        stage.innerHTML = useFrame ? V.tenFrame(n, 0, 1) : V.dots(n); stage.classList.remove('g-hidden');
        clearTimeout(hideT); hideT = setTimeout(() => { stage.classList.add('g-hidden'); }, Math.max(cfg.flash || 700, 1600 - round * 80));
        opts.innerHTML = '';
        shuffle([...new Set([n, n + 1, n - 1, n + 2].filter(x => x > 0))]).slice(0, 4).sort((a, b) => a - b).forEach(v => { const b = el('button', { class: 'md-chip' }, String(v)); b.onclick = () => { const ok = v === n; if (ok) score++; progress(score); say(ok ? `Yes, ${n}!` : `It was ${n}.`); flash(stage, ok); stage.classList.remove('g-hidden'); opts.querySelectorAll('button').forEach(x => (x.disabled = true)); setTimeout(next, 800); }; opts.append(b); });
      };
      next();
      return () => clearTimeout(hideT);
    } },
  { id: 'bonds', modes: ['explorer', 'challenger'], title: 'Number bonds', kid: 'Bond builder', color: 'teal', grades: '1 to 3',
    desc: 'The whole is on top and one part is shown. Find the missing part fast. This is subtraction as "think addition".',
    options: [{ label: 'Wholes to 10', value: 10 }, { label: 'Wholes to 20', value: 20 }, { label: 'Wholes to 100', value: 100 }],
    run(area, { end, option, say, endless, progress = () => {}, cfg = {} }) {
      const M = option || 10; let score = 0; const fig = el('div', { class: 'bond' }), opts = el('div', { class: 'g-opts', role: 'group', 'aria-label': 'Missing part' }); area.append(fig, opts);
      const next = () => {
        const W = M === 100 ? ri(2, 10) * 10 : ri(4, M), a = M === 100 ? ri(1, W / 10 - 1) * 10 : ri(1, W - 1), b = W - a;
        fig.innerHTML = `<span class="bond-w">${W}</span><span class="bond-l"></span><span class="bond-r"></span><span class="bond-a">${a}</span><span class="bond-b">?</span>`;
        opts.innerHTML = '';
        const step = M === 100 ? 10 : 1;
        shuffle([...new Set([b, b + step, Math.max(step, b - step), b + 2 * step])]).forEach(v => { const btn = el('button', { class: 'md-chip' }, String(v)); btn.onclick = () => { const ok = v === b; if (ok) score++; progress(score); say(ok ? `${a} + ${b} = ${W}` : `${a} + ${b} = ${W}, so the part is ${b}.`); flash(fig, ok); next(); }; opts.append(btn); });
      };
      next();
      return endless ? undefined : timer(area, cfg.secs || 60, () => end(score));
    } },
  { id: 'times-sprint', modes: ['challenger', 'pro'], title: 'Times sprint', kid: 'Times rocket', color: 'sky', grades: '3 to 5',
    desc: 'Sixty seconds of multiplication facts. Miss one and you see the strategy that builds it from facts you know.',
    options: [{ label: 'Easy (2, 5, 10)', value: 'easy' }, { label: 'All to 10', value: 10 }, { label: 'All to 12', value: 12 }],
    run(area, { end, option, say, endless, progress = () => {}, cfg = {} }) {
      let score = 0, cur; const q = el('div', { class: 'g-q', 'aria-live': 'polite' }), form = el('form', { class: 'g-form' }, '<input inputmode="numeric" autocomplete="off" aria-label="Answer" class="ans-in"><button class="md-btn md-btn--primary md-btn--sm">Go</button>');
      const tip = el('p', { class: 'g-tip', 'aria-live': 'polite' }); area.append(q, form, tip); const inp = form.querySelector('input');
      const next = () => { const a = cfg.tables ? pick(cfg.tables) : option === 'easy' ? pick([2, 5, 10]) : ri(2, option || 10), b = ri(2, cfg.upto || (option === 'easy' ? 10 : option || 10)); cur = [a, b]; q.innerHTML = `${a} &times; ${b}`; inp.value = ''; inp.focus(); };
      form.onsubmit = e => { e.preventDefault(); if (!inp.value.trim()) return; const ok = +inp.value === cur[0] * cur[1]; if (ok) { score++; progress(score); tip.textContent = ''; say(score % 5 ? 'Nice.' : `${score} in a row of right answers. Rocket speed!`); } else tip.innerHTML = `${cur[0]} &times; ${cur[1]} = ${cur[0] * cur[1]}. ${factStrategy(cur[0], cur[1])[0]}`; flash(q, ok); next(); };
      next();
      return endless ? undefined : timer(area, cfg.secs || 60, () => end(score));
    } },
  { id: 'target', modes: ['challenger', 'pro'], title: 'Hit the target', kid: 'Number detective', color: 'plum', grades: '4 to 8',
    desc: 'Use all four numbers once each with + − × ÷ and brackets to make the target. Every puzzle has at least one answer.',
    run(area, { end, say, endless, progress = () => {}, cfg = {} }) {
      let solved = 0, rounds = 0, puzzle;
      const solve = (nums, target) => {
        const go = items => { if (items.length === 1) return Math.abs(items[0].v - target) < 1e-9 ? items[0].s : null;
          for (let i = 0; i < items.length; i++) for (let j = 0; j < items.length; j++) { if (i === j) continue; const a = items[i], b = items[j], rest = items.filter((_, k) => k !== i && k !== j);
            const cands = [{ v: a.v - b.v, s: `(${a.s} - ${b.s})` }]; if (b.v) cands.push({ v: a.v / b.v, s: `(${a.s} ÷ ${b.s})` });
            if (i < j) cands.push({ v: a.v + b.v, s: `(${a.s} + ${b.s})` }, { v: a.v * b.v, s: `(${a.s} × ${b.s})` });
            for (const c of cands) { const r = go([...rest, c]); if (r) return r; } }
          return null; };
        return go(nums.map(n => ({ v: n, s: String(n) })));
      };
      const box = el('div', { class: 'g-target' }), form = el('form', { class: 'g-form' }, '<input autocomplete="off" aria-label="Your expression" class="ans-in" placeholder="(8 - 4) × 3 × 2"><button class="md-btn md-btn--primary md-btn--sm">Check</button>');
      const tools = el('div', { class: 'g-tools' }), msg = el('p', { class: 'g-tip', 'aria-live': 'polite' }); area.append(box, form, msg, tools);
      const skip = el('button', { class: 'md-btn md-btn--sm' }, 'Show an answer'), nextB = el('button', { class: 'md-btn md-btn--sm' }, 'New puzzle'), fin = el('button', { class: 'md-btn md-btn--sm' }, 'Finish'); tools.append(skip, nextB, fin);
      const inp = form.querySelector('input');
      const fresh = () => { if (!endless && cfg.rounds && rounds >= cfg.rounds) return end(solved); let nums, target, sol; do { nums = Array.from({ length: 4 }, () => ri(1, cfg.maxNum || 9)); target = cfg.target ? (Array.isArray(cfg.target) ? ri(cfg.target[0], cfg.target[1]) : cfg.target) : Math.random() < .5 ? 24 : ri(10, 40); sol = solve(nums, target); } while (!sol); puzzle = { nums, target, sol }; rounds++; box.innerHTML = `<div class="g-target-t">${target}</div><div class="g-target-n">${nums.map(n => `<span>${n}</span>`).join('')}</div>`; inp.value = ''; msg.textContent = ''; };
      form.onsubmit = e => { e.preventDefault(); const s = inp.value.replace(/x/gi, '*').replace(/×/g, '*').replace(/÷/g, '/');
        const used = (s.match(/\d+/g) || []).map(Number).sort(), want = puzzle.nums.slice().sort();
        if (used.join() !== want.join()) { msg.textContent = `Use each of ${puzzle.nums.join(', ')} exactly once.`; flash(box, false); return; }
        const v = evalNum(s); if (Number.isNaN(v)) { msg.textContent = 'I could not read that. Use + - * / and brackets.'; return; }
        if (Math.abs(v - puzzle.target) < 1e-9) { solved++; progress(solved); say(`Solved! ${solved} so far.`); flash(box, true); setTimeout(fresh, 700); } else { msg.textContent = `That makes ${Math.round(v * 1000) / 1000}, not ${puzzle.target}.`; flash(box, false); } };
      skip.onclick = () => { msg.textContent = `One answer: ${puzzle.sol.replace(/^\((.*)\)$/, '$1')}`; };
      nextB.onclick = fresh; fin.onclick = () => end(solved);
      fresh();
    } },
  { id: 'frac-faceoff', modes: ['challenger', 'pro'], title: 'Fraction face-off', kid: 'Bigger slice', color: 'plum', grades: '3 to 6',
    desc: 'Tap the bigger fraction. Use benchmarks: is each one more or less than a half? How far is each from a whole?',
    run(area, { end, say, endless, progress = () => {}, cfg = {} }) {
      let score = 0; const row = el('div', { class: 'g-duel', role: 'group', 'aria-label': 'Pick the bigger fraction' }), fig = el('div', { class: 'g-fig' }); area.append(row, fig);
      const next = () => { let a, b, c, d; const D = cfg.maxDen || 12; do { b = ri(2, D); a = ri(1, b - 1); d = ri(2, D); c = ri(1, d - 1); } while (a * d === b * c);
        row.innerHTML = ''; [[a, b], [c, d]].forEach(([n, m]) => { const btn = el('button', { class: 'g-frac' }, `<span class="fr"><span>${n}</span><span>${m}</span></span>`); btn.onclick = () => { const ok = n / m >= Math.max(a / b, c / d); if (ok) score++; progress(score); fig.innerHTML = V.fracBar(a, b, { w: 240 }) + V.fracBar(c, d, { w: 240, cls: 'vz-teal' }); say(ok ? 'Right!' : `${a}/${b} vs ${c}/${d}: look at the bars.`); flash(row, ok); next(); }; row.append(btn); }); };
      next();
      return endless ? undefined : timer(area, cfg.secs || 60, () => end(score));
    } },
  { id: 'line-snipe', modes: ['explorer', 'challenger', 'pro'], title: 'Number line sniper', kid: 'Number line', color: 'sky', grades: '1 to 7',
    desc: 'Place the number on the line as accurately as you can. Ten rounds, up to 10 points each. Builds a feel for size.',
    options: [{ label: '0 to 100', value: 100 }, { label: '0 to 1,000', value: 1000 }, { label: '0 to 1 (fractions)', value: 1 }],
    run(area, { end, option, say, endless, progress = () => {}, cfg = {} }) {
      const M = option || 100; let round = 0, score = 0, target;
      const prompt = el('div', { class: 'g-q', 'aria-live': 'polite' }), wrap = el('div', { class: 'g-line' }), form = el('form', { class: 'g-form' });
      wrap.innerHTML = `<div class="g-line-track"><span class="g-line-true" hidden></span></div><input type="range" min="0" max="1000" value="500" aria-label="Position on the number line"><div class="g-line-labels"><span>0</span><span>${M === 1 ? '1' : M.toLocaleString('en-US')}</span></div>`;
      form.innerHTML = '<button class="md-btn md-btn--primary md-btn--sm">Place it</button>'; area.append(prompt, wrap, form);
      const range = wrap.querySelector('input'), mark = wrap.querySelector('.g-line-true');
      const next = () => { if (!endless && round === (cfg.rounds || 10)) return end(score); round++; mark.hidden = true;
        if (M === 1) { const d = pick([2, 3, 4, 5, 8, 10]), n = ri(1, d - 1); target = n / d; prompt.innerHTML = `Where is <span class="fr"><span>${n}</span><span>${d}</span></span>?`; }
        else { target = ri(1, M - 1); prompt.textContent = `Where is ${target.toLocaleString('en-US')}?`; }
        range.value = 500; };
      form.onsubmit = e => { e.preventDefault(); const guess = (range.value / 1000) * M, err = Math.abs(guess - target) / M, pts = Math.max(0, Math.round(10 - err * 100 * (cfg.strict || 1))); score += pts; progress(score);
        mark.style.left = (target / M) * 100 + '%'; mark.hidden = false; say(`${pts} point${pts === 1 ? '' : 's'}. You were ${Math.round(err * 1000) / 10}% away.`); setTimeout(next, 1100); };
      next();
    } },
  { id: 'pairs', modes: ['explorer', 'challenger', 'pro'], title: 'Memory match', kid: 'Match the pairs', color: 'teal', grades: 'All',
    desc: 'Flip two cards at a time and match each one with its partner: numbers and squares, fractions and decimals, sutras and their meanings.',
    run(area, { end, say, endless, progress = () => {}, cfg = {} }) {
      const SETS = {
        count: () => { const n = ri(1, 10); return [String(n), `<span class="g-dotsm">${'&#9679;'.repeat(n)}</span>`]; },
        squares: () => { const n = ri(2, cfg.max || 15); return [`${n}<sup>2</sup>`, String(n * n)]; },
        times: () => { const a = ri(2, 12), b = ri(2, 12); return [`${a} &times; ${b}`, String(a * b)]; },
        fracdec: () => { const [n, d] = pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 8], [3, 8], [5, 8], [7, 8], [1, 10], [3, 10], [7, 10], [9, 10], [1, 20], [1, 25]]); return [`<span class="fr"><span>${n}</span><span>${d}</span></span>`, String(n / d)]; },
        sutras: () => { const c = pick(SUTRAS); return [`<i lang="sa-Latn">${c.name}</i>`, c.meaning]; }
      };
      const kinds = cfg.set ? [cfg.set] : ['times'], n = cfg.pairs || 6;
      let pairs = [], used = new Set(), guard = 0;
      while (pairs.length < n && guard++ < 400) { const [a, b] = SETS[pick(kinds)](); if (used.has(a) || used.has(b)) continue; used.add(a); used.add(b); pairs.push([a, b]); }
      let cards = shuffle(pairs.flatMap((pr, i) => [{ h: pr[0], k: i }, { h: pr[1], k: i }])), open = [], matched = 0, moves = 0, lock = false;
      const grid = el('div', { class: 'g-pairs', role: 'group', 'aria-label': 'Memory cards' }); area.append(el('p', { class: 'g-say' }, 'Flip two cards. Find the partners.'), grid);
      grid.style.setProperty('--cols', String(Math.min(6, Math.ceil(Math.sqrt(cards.length * 1.4)))));
      cards.forEach((c, i) => { const b = el('button', { class: 'g-card', 'aria-label': 'Hidden card' }, `<span class="g-card-in">${c.h}</span>`); c.el = b; b.onclick = () => flip(i); grid.append(b); });
      const flip = i => {
        const c = cards[i]; if (lock || c.done || open.includes(c)) return; c.el.classList.add('up'); c.el.setAttribute('aria-label', c.el.textContent); tapSfx('tap'); open.push(c);
        if (open.length < 2) return; moves++; lock = true;
        const [x, y] = open; if (x.k === y.k) { x.done = y.done = true; x.el.classList.add('got'); y.el.classList.add('got'); matched++; tapSfx('ok'); open = []; lock = false; const sc = Math.max(0, 100 - (moves - matched) * Math.round(60 / n)); progress(sc); say(`Match! ${matched} of ${n}.`); if (matched === n) setTimeout(() => endless ? (say('All matched! New board.'), area.innerHTML = '', this.run(area, { end, say, endless, progress, cfg })) : end(sc), 700); }
        else setTimeout(() => { x.el.classList.remove('up'); y.el.classList.remove('up'); x.el.setAttribute('aria-label', 'Hidden card'); y.el.setAttribute('aria-label', 'Hidden card'); open = []; lock = false; }, 900);
      };
    } },
  { id: 'check-it', modes: ['challenger', 'pro'], title: 'Answer checker', kid: 'Spot the mistake', color: 'coral', grades: '4 to adult',
    desc: 'Is the answer right or wrong? Use the digit sum check (casting out nines) to decide in seconds without multiplying.',
    run(area, { end, say, endless, progress = () => {}, cfg = {} }) {
      let score = 0, cur; const q = el('div', { class: 'g-q' }), row = el('div', { class: 'g-duel', role: 'group', 'aria-label': 'Right or wrong' }), tip = el('p', { class: 'g-tip', 'aria-live': 'polite' }); area.append(q, row, tip);
      const ds = n => { n = Math.abs(n) % 9; return n; };
      const next = () => { const d = cfg.digits || 2, a = ri(10 ** (d - 1) + 1, 10 ** d - 1), b = ri(11, 10 ** Math.min(d, 3) - 1), right = Math.random() < .5; let c = a * b;
        if (!right) { let off; do { off = pick([1, 2, 3, 4, 5, 6, 7, 8, 10, 20, 100]) * pick([1, -1]); } while (off % 9 === 0); c += off; }
        cur = { right, a, b, c }; q.innerHTML = `${a.toLocaleString('en-US')} &times; ${b} = ${c.toLocaleString('en-US')}`; };
      ['Right', 'Wrong'].forEach(lab => { const btn = el('button', { class: 'md-btn' + (lab === 'Right' ? ' md-btn--primary' : '') }, lab); btn.onclick = () => { const ok = (lab === 'Right') === cur.right; if (ok) { score++; progress(score); } tip.innerHTML = `Digit sums: ${ds(cur.a)} &times; ${ds(cur.b)} gives ${ds(ds(cur.a) * ds(cur.b))}, the answer gives ${ds(cur.c)}. ${cur.right ? 'It was right.' : 'It was wrong.'}`; flash(q, ok); next(); }; row.append(btn); });
      next();
      return endless ? undefined : timer(area, cfg.secs || 60, () => end(score));
    } },
  { id: 'rain', modes: ['explorer', 'challenger'], title: 'Multiple rain', kid: 'Number rain', color: 'sky', grades: '2 to 6',
    desc: 'Numbers drift down. Tap only the multiples of the magic number before they reach the ground. Wrong taps cost a point.',
    run(area, { end, say, endless, progress = () => {}, cfg = {} }) {
      const k = cfg.k || 2, speed = (cfg.speed || 1) * (matchMedia('(prefers-reduced-motion: reduce)').matches ? .6 : 1); let score = 0, raf = 0, last = performance.now(), spawnT = 0, stopped = false;
      area.append(el('p', { class: 'g-say' }, `Tap the multiples of <b>${k}</b>.`)); const sky = el('div', { class: 'g-rain', role: 'group', 'aria-label': `Falling numbers. Tap multiples of ${k}.` }); area.append(sky);
      const drops = [];
      const spawn = () => { const mult = Math.random() < .5, n = mult ? k * ri(1, 12) : (() => { let v; do { v = ri(2, k * 12); } while (v % k === 0); return v; })();
        const b = el('button', { class: 'g-drop' }, String(n)); b.style.left = ri(4, 84) + '%'; sky.append(b); const d = { b, y: -10, n }; drops.push(d);
        b.onclick = () => { if (d.gone) return; d.gone = true; const ok = n % k === 0; score += ok ? 1 : -1; score = Math.max(0, score); progress(score); tapSfx(ok ? 'pop' : 'no'); say(ok ? `${n} = ${k} &times; ${n / k}` : `${n} is not a multiple of ${k}.`); b.classList.add(ok ? 'hit' : 'miss'); setTimeout(() => b.remove(), 250); }; };
      const step = now => { if (stopped) return; const dt = Math.min(.05, (now - last) / 1000); last = now; spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = 1.3 / speed; }
        const H = sky.clientHeight || 360; drops.forEach(d => { if (d.gone) return; d.y += dt * 60 * speed; d.b.style.transform = `translateY(${d.y * H / 100}px)`; if (d.y > 92) { d.gone = true; d.b.remove(); } }); raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
      const stopT = endless ? null : timer(area, cfg.secs || 45, () => { stopped = true; cancelAnimationFrame(raf); end(score); });
      return () => { stopped = true; cancelAnimationFrame(raf); if (stopT) stopT(); };
    } },
  { id: 'sequence', modes: ['challenger', 'pro'], title: 'Pattern spotter', kid: 'What comes next?', color: 'sun', grades: '2 to adult',
    desc: 'Find the next number. Patterns grow from counting steps to squares, triangles, doubling and the Fibonacci numbers (Virahāṅka described them in India over 1,300 years ago).',
    run(area, { end, say, endless, progress = () => {}, cfg = {} }) {
      let score = 0, round = 0; const q = el('div', { class: 'g-q g-q-sm' }), opts = el('div', { class: 'g-opts', role: 'group', 'aria-label': 'Next number' }), tip = el('p', { class: 'g-tip', 'aria-live': 'polite' }); area.append(q, opts, tip);
      const GEN = {
        add: () => { const a = ri(1, 20), d = ri(2, 9); return [Array.from({ length: 5 }, (_, i) => a + i * d), `add ${d} each time`]; },
        sub: () => { const a = ri(60, 120), d = ri(3, 12); return [Array.from({ length: 5 }, (_, i) => a - i * d), `subtract ${d} each time`]; },
        mul: () => { const a = ri(1, 5), r = pick([2, 3]); return [Array.from({ length: 5 }, (_, i) => a * r ** i), `multiply by ${r} each time`]; },
        sq: () => { const a = ri(1, 8); return [Array.from({ length: 5 }, (_, i) => (a + i) ** 2), 'square numbers']; },
        tri: () => { const a = ri(1, 5); return [Array.from({ length: 5 }, (_, i) => ((a + i) * (a + i + 1)) / 2), 'triangle numbers: add one more each time']; },
        fib: () => { let x = ri(1, 3), y = ri(x, x + 3); const s = [x, y]; while (s.length < 5) s.push(s[s.length - 1] + s[s.length - 2]); return [s, 'add the two before (Virahāṅka-Fibonacci)']; },
        grow: () => { const a = ri(1, 10), d = ri(1, 4); let v = a; const s = [v]; for (let i = 1; i < 5; i++) { v += d * i; s.push(v); } return [s, `the jumps grow by ${d}`]; },
        cube: () => { const a = ri(1, 4); return [Array.from({ length: 5 }, (_, i) => (a + i) ** 3), 'cube numbers']; }
      };
      const types = cfg.types || ['add'];
      const next = () => { if (!endless && round === (cfg.rounds || 10)) return end(score); round++;
        const [seq, rule] = GEN[pick(types)](), ans = seq.pop(); q.innerHTML = `${seq.join(', ')}, <b>?</b>`;
        opts.innerHTML = ''; shuffle([...new Set([ans, ans + 1, ans - 1, ans + seq[seq.length - 1] - seq[seq.length - 2] + 1, ans * 2 - seq[seq.length - 1]].filter(v => v !== seq[seq.length - 1]))]).slice(0, 4).forEach(v => { const b = el('button', { class: 'md-chip' }, String(v)); b.onclick = () => { const ok = v === ans; if (ok) { score++; progress(score); } tip.textContent = `${ans}: ${rule}.`; flash(q, ok); setTimeout(next, 600); }; opts.append(b); }); };
      next();
    } },
  { id: 'balance', modes: ['challenger', 'pro'], title: 'Balance the scale', kid: 'Balance it', color: 'plum', grades: '5 to adult',
    desc: 'Find the mystery number that keeps the scale level. This is Parāvartya Yojayet in action: move it across, flip the sign.',
    run(area, { end, say, endless, progress = () => {}, cfg = {} }) {
      let score = 0; const fig = el('div', { class: 'g-balance' }), opts = el('div', { class: 'g-opts', role: 'group', 'aria-label': 'Mystery number' }), tip = el('p', { class: 'g-tip', 'aria-live': 'polite' }); area.append(fig, opts, tip);
      const lvl = cfg.level || 1;
      const next = () => { const x = ri(lvl > 2 ? -9 : 1, lvl > 1 ? 15 : 10); let L, Rr, how;
        if (lvl === 1) { const b = ri(1, 20); L = `<i>x</i> + ${b}`; Rr = String(x + b); how = `take ${b} from both sides`; }
        else if (lvl === 2) { const a = ri(2, 9), b = ri(1, 20); L = `${a}<i>x</i> + ${b}`; Rr = String(a * x + b); how = `take ${b} away, then divide by ${a}`; }
        else { const a = ri(3, 9), c = ri(1, a - 1), b = ri(-15, 15); L = `${a}<i>x</i> ${b < 0 ? '&minus;' : '+'} ${Math.abs(b)}`; Rr = `${c}<i>x</i> ${(a - c) * x + b < 0 ? '&minus;' : '+'} ${Math.abs((a - c) * x + b)}`; how = `move ${c}x across: ${a - c}x = ${(a - c) * x}`; }
        fig.innerHTML = V.balance(L, Rr); opts.innerHTML = '';
        shuffle([...new Set([x, x + 1, x - 1, x + 2, -x].filter((v, i, arr) => arr.indexOf(v) === i))]).slice(0, 4).forEach(v => { const b = el('button', { class: 'md-chip' }, String(v).replace('-', '&minus;')); b.onclick = () => { const ok = v === x; if (ok) { score++; progress(score); } tip.innerHTML = `x = ${String(x).replace('-', '&minus;')}: ${how}.`; flash(fig, ok); next(); }; opts.append(b); }); };
      next();
      return endless ? undefined : timer(area, cfg.secs || 60, () => end(score));
    } }
];

/* ---------- Levels: 72 per game, 14 games, 1,008 in all ---------- */
export const LEVELS_PER_GAME = 72;
const ratio = (n, a = .6, b = .85) => [Math.max(1, Math.ceil(n * a)), Math.max(2, Math.ceil(n * b)), n];
const TT = [[2], [5], [10], [2, 5, 10], [3], [4], [3, 4], [6], [7], [8], [9], [6, 7, 8, 9]];
export const LEVELS = {
  balloons: L => { const r = 6 + Math.floor(L / 18); return { cfg: { rounds: r, max: Math.min(15, 5 + Math.floor(L / 6)) }, goal: ratio(r) }; },
  'more-less': L => { const r = 8 + Math.floor(L / 24); return { cfg: { rounds: r, max: L < 12 ? 10 : 10 + Math.floor((L - 6) / 6) * 10, dots: L < 12 ? 10 : 2 }, goal: ratio(r) }; },
  'make-ten': L => { const secs = [60, 50, 40][(L - 1) % 3], opt = L <= 24 ? 10 : L <= 48 ? 20 : 100, base = (opt === 100 ? 5 : 7) + Math.floor(((L - 1) % 24) / 6); return { option: opt, cfg: { secs }, goal: [base, base + 4, base + 8].map(v => Math.round(v * secs / 60)) }; },
  'quick-look': L => { const r = 8 + Math.floor(L / 24); return { cfg: { rounds: r, max: Math.min(10, 5 + Math.floor(L / 10)), flash: Math.max(380, 1100 - L * 10) }, goal: ratio(r) }; },
  bonds: L => { const opt = L <= 24 ? 10 : L <= 48 ? 20 : 100, secs = [60, 50, 40][(L - 1) % 3], base = 8 + Math.floor(((L - 1) % 24) / 4); return { option: opt, cfg: { secs }, goal: [base, base + 5, base + 10].map(v => Math.round(v * secs / 60)) }; },
  'times-sprint': L => { const i = (L - 1) % 12, band = Math.floor((L - 1) / 12), secs = Math.max(30, 60 - band * 6), cfg = band < 2 ? { tables: TT[i], upto: band ? 12 : 10, secs } : { upto: 12, secs, tables: band < 4 ? [...TT[i], ...TT[(i + 5) % 12]] : null }; const base = 10 + band * 2; return { cfg, goal: [base, base + 6, base + 12].map(v => Math.round(v * secs / 60)) }; },
  target: L => { const r = 3 + Math.floor((L - 1) / 12), tg = [24, [10, 20], [20, 40], 24, [30, 60], [10, 99]][Math.floor((L - 1) / 12)]; return { cfg: { rounds: r, target: tg, maxNum: L > 48 ? 12 : 9 }, goal: ratio(r, .34, .67) }; },
  'frac-faceoff': L => { const D = Math.min(16, 4 + Math.floor(L / 6)), secs = [60, 50, 45][(L - 1) % 3], base = 8 + Math.floor(L / 12); return { cfg: { maxDen: D, secs }, goal: [base, base + 4, base + 8].map(v => Math.round(v * secs / 60)) }; },
  'line-snipe': L => { const opt = L <= 24 ? 100 : L <= 48 ? 1000 : 1, r = 8 + ((L - 1) % 3), strict = 1 + ((L - 1) % 24) * 0.06; return { option: opt, cfg: { rounds: r, strict }, goal: [r * 5, r * 7, Math.round(r * 8.5)] }; },
  pairs: L => { const sets = ['count', 'times', 'squares', 'fracdec', 'sutras'], set = sets[(L - 1) % 5], n = Math.min(10, 3 + Math.floor(L / 9)); return { cfg: { pairs: n, set, max: 10 + Math.floor(L / 6) }, goal: [40, 65, 85] }; },
  'check-it': L => { const secs = [60, 50, 45][(L - 1) % 3], digits = 2 + Math.floor((L - 1) / 24), base = 8 + Math.floor(((L - 1) % 24) / 4); return { cfg: { secs, digits }, goal: [base, base + 5, base + 9].map(v => Math.round(v * secs / 60)) }; },
  rain: L => { const ks = [2, 5, 10, 3, 4, 6, 7, 8, 9, 11, 12, 15], k = ks[(L - 1) % 12], speed = 1 + Math.floor((L - 1) / 12) * 0.18; return { cfg: { k, speed, secs: 45 }, goal: [6, 11, 16].map(v => Math.round(v * (0.8 + speed * 0.3))) }; },
  sequence: L => { const T = [['add'], ['add', 'sub'], ['add', 'sub', 'mul'], ['sq', 'tri'], ['fib', 'grow'], ['add', 'sub', 'mul', 'sq', 'tri', 'fib', 'grow', 'cube']][Math.floor((L - 1) / 12)], r = 8 + ((L - 1) % 12 > 5 ? 2 : 0); return { cfg: { types: T, rounds: r }, goal: ratio(r) }; },
  balance: L => { const level = 1 + Math.floor((L - 1) / 24), secs = [60, 50, 45][(L - 1) % 3], base = 6 + Math.floor(((L - 1) % 24) / 4) - level; return { cfg: { level, secs }, goal: [base, base + 4, base + 8].map(v => Math.max(2, Math.round(v * secs / 60))) }; }
};
export const levelStars = (goal, score) => goal.filter(t => score >= t).length;
