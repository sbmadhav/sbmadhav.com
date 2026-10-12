/* Strategy games: quick, replayable practice for the ideas that make mental math fast.
   Each game runs inside the shell in app.js and calls end(score) when a round is over. Play never starts on its own. */
import { ri, pick, shuffle, gcd } from './lib.js';
import { evalNum } from './check.js';
import { factStrategy } from './skills/middle.js';
import * as V from './viz.js';
import { sfx as tapSfx, speak as speakIt } from './fx.js';

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
    run(area, { end, say, endless, progress = () => {} }) {
      let round = 0, score = 0, popped = 0, want = 0; const ask = el('p', { class: 'g-q g-q-sm', 'aria-live': 'polite' }), sky = el('div', { class: 'g-sky', role: 'group', 'aria-label': 'Balloons' }), done = el('button', { class: 'md-btn md-btn--primary' }, 'Done'); area.append(ask, sky, el('div', { class: 'g-tools' }));
      area.lastChild.append(done);
      const cols = ['coral', 'teal', 'sun', 'sky', 'plum'];
      const next = () => { if (!endless && round === 8) return end(score); round++; popped = 0; want = ri(1, round < 4 ? 5 : 10); const total = Math.min(14, want + ri(2, 5));
        ask.innerHTML = `Pop <b>${want}</b> balloon${want > 1 ? 's' : ''}!`; speakIt(`Pop ${want} balloon${want > 1 ? 's' : ''}`);
        sky.innerHTML = ''; for (let i = 0; i < total; i++) { const b = el('button', { class: 'g-balloon', 'aria-label': 'Balloon', style: `--c: var(--${cols[i % 5]}); --d:${(i % 5) * 0.2}s` }, '<span></span>'); b.onclick = () => { if (b.disabled) return; b.disabled = true; b.classList.add('popped'); popped++; tapSfx('pop'); say(String(popped)); speakIt(String(popped)); }; sky.append(b); } };
      done.onclick = () => { const ok = popped === want; if (ok) score++; progress(score); say(ok ? `Yes! ${want}!` : `You popped ${popped}. We needed ${want}.`); flash(sky, ok); setTimeout(next, 900); };
      next();
    } },
  { id: 'more-less', title: 'Which has more?', kid: 'More or less', color: 'sun', grades: 'Explorer', modes: ['explorer'],
    desc: 'Tap the side with more dots. Then try it with numbers. Comparing amounts is the start of number sense.',
    run(area, { end, say, endless, progress = () => {} }) {
      let round = 0, score = 0; const row = el('div', { class: 'g-duel', role: 'group', 'aria-label': 'Pick the side with more' }); area.append(row);
      const next = () => { if (!endless && round === 10) return end(score); round++; let a = ri(1, 10), b = ri(1, 10); while (a === b) b = ri(1, 10); const nums = round > 5;
        row.innerHTML = ''; [a, b].forEach(v => { const btn = el('button', { class: 'g-frac g-more' }, nums ? `<span class="g-big">${v}</span>` : V.dots(v, v <= 6 ? 'dice' : 'line')); btn.onclick = () => { const ok = v === Math.max(a, b); if (ok) score++; progress(score); say(ok ? `Yes, ${v} is more!` : `${Math.max(a, b)} is more than ${Math.min(a, b)}.`); flash(row, ok); setTimeout(next, 700); }; row.append(btn); });
        speakIt('Which has more?'); };
      next();
    } },
  { id: 'make-ten', modes: ['explorer', 'challenger'], title: 'Make the target', kid: 'Make ten!', color: 'coral', grades: 'K to 3',
    desc: 'Tap two numbers that add up to the target. Partners of 10 are the base of almost every mental math strategy.',
    options: [{ label: 'Make 10', value: 10 }, { label: 'Make 20', value: 20 }, { label: 'Make 100', value: 100 }],
    run(area, { end, option, say, endless, progress = () => {} }) {
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
      return endless ? undefined : timer(area, 60, () => end(score));
    } },
  { id: 'quick-look', modes: ['explorer'], title: 'Quick look', kid: 'Flash dots', color: 'sun', grades: 'K to 2',
    desc: 'Dots flash for a moment. Say how many without counting one by one. Seeing groups (five and some more) is the skill.',
    run(area, { end, say, endless, progress = () => {} }) {
      let round = 0, score = 0; const stage = el('div', { class: 'g-stage' }), opts = el('div', { class: 'g-opts', role: 'group', 'aria-label': 'How many dots?' }); area.append(stage, opts);
      let hideT = 0;
      const next = () => {
        if (!endless && round === 10) return end(score);
        round++; const n = ri(round < 4 ? 2 : 4, round < 4 ? 6 : 10), useFrame = n > 6 || Math.random() < .4;
        stage.innerHTML = useFrame ? V.tenFrame(n, 0, 1) : V.dots(n); stage.classList.remove('g-hidden');
        clearTimeout(hideT); hideT = setTimeout(() => { stage.classList.add('g-hidden'); }, Math.max(700, 1600 - round * 80));
        opts.innerHTML = '';
        shuffle([...new Set([n, n + 1, n - 1, n + 2].filter(x => x > 0))]).slice(0, 4).sort((a, b) => a - b).forEach(v => { const b = el('button', { class: 'md-chip' }, String(v)); b.onclick = () => { const ok = v === n; if (ok) score++; progress(score); say(ok ? `Yes, ${n}!` : `It was ${n}.`); flash(stage, ok); stage.classList.remove('g-hidden'); opts.querySelectorAll('button').forEach(x => (x.disabled = true)); setTimeout(next, 800); }; opts.append(b); });
      };
      next();
      return () => clearTimeout(hideT);
    } },
  { id: 'bonds', modes: ['explorer', 'challenger'], title: 'Number bonds', kid: 'Bond builder', color: 'teal', grades: '1 to 3',
    desc: 'The whole is on top and one part is shown. Find the missing part fast. This is subtraction as "think addition".',
    options: [{ label: 'Wholes to 10', value: 10 }, { label: 'Wholes to 20', value: 20 }, { label: 'Wholes to 100', value: 100 }],
    run(area, { end, option, say, endless, progress = () => {} }) {
      const M = option || 10; let score = 0; const fig = el('div', { class: 'bond' }), opts = el('div', { class: 'g-opts', role: 'group', 'aria-label': 'Missing part' }); area.append(fig, opts);
      const next = () => {
        const W = M === 100 ? ri(2, 10) * 10 : ri(4, M), a = M === 100 ? ri(1, W / 10 - 1) * 10 : ri(1, W - 1), b = W - a;
        fig.innerHTML = `<span class="bond-w">${W}</span><span class="bond-l"></span><span class="bond-r"></span><span class="bond-a">${a}</span><span class="bond-b">?</span>`;
        opts.innerHTML = '';
        const step = M === 100 ? 10 : 1;
        shuffle([...new Set([b, b + step, Math.max(step, b - step), b + 2 * step])]).forEach(v => { const btn = el('button', { class: 'md-chip' }, String(v)); btn.onclick = () => { const ok = v === b; if (ok) score++; progress(score); say(ok ? `${a} + ${b} = ${W}` : `${a} + ${b} = ${W}, so the part is ${b}.`); flash(fig, ok); next(); }; opts.append(btn); });
      };
      next();
      return endless ? undefined : timer(area, 60, () => end(score));
    } },
  { id: 'times-sprint', modes: ['challenger', 'pro'], title: 'Times sprint', kid: 'Times rocket', color: 'sky', grades: '3 to 5',
    desc: 'Sixty seconds of multiplication facts. Miss one and you see the strategy that builds it from facts you know.',
    options: [{ label: 'Easy (2, 5, 10)', value: 'easy' }, { label: 'All to 10', value: 10 }, { label: 'All to 12', value: 12 }],
    run(area, { end, option, say, endless, progress = () => {} }) {
      let score = 0, cur; const q = el('div', { class: 'g-q', 'aria-live': 'polite' }), form = el('form', { class: 'g-form' }, '<input inputmode="numeric" autocomplete="off" aria-label="Answer" class="ans-in"><button class="md-btn md-btn--primary md-btn--sm">Go</button>');
      const tip = el('p', { class: 'g-tip', 'aria-live': 'polite' }); area.append(q, form, tip); const inp = form.querySelector('input');
      const next = () => { const a = option === 'easy' ? pick([2, 5, 10]) : ri(2, option || 10), b = ri(2, option === 'easy' ? 10 : option || 10); cur = [a, b]; q.innerHTML = `${a} &times; ${b}`; inp.value = ''; inp.focus(); };
      form.onsubmit = e => { e.preventDefault(); if (!inp.value.trim()) return; const ok = +inp.value === cur[0] * cur[1]; if (ok) { score++; progress(score); tip.textContent = ''; say(score % 5 ? 'Nice.' : `${score} in a row of right answers. Rocket speed!`); } else tip.innerHTML = `${cur[0]} &times; ${cur[1]} = ${cur[0] * cur[1]}. ${factStrategy(cur[0], cur[1])[0]}`; flash(q, ok); next(); };
      next();
      return endless ? undefined : timer(area, 60, () => end(score));
    } },
  { id: 'target', modes: ['challenger', 'pro'], title: 'Hit the target', kid: 'Number detective', color: 'plum', grades: '4 to 8',
    desc: 'Use all four numbers once each with + − × ÷ and brackets to make the target. Every puzzle has at least one answer.',
    run(area, { end, say, endless, progress = () => {} }) {
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
      const fresh = () => { let nums, target, sol; do { nums = Array.from({ length: 4 }, () => ri(1, 9)); target = Math.random() < .5 ? 24 : ri(10, 40); sol = solve(nums, target); } while (!sol); puzzle = { nums, target, sol }; rounds++; box.innerHTML = `<div class="g-target-t">${target}</div><div class="g-target-n">${nums.map(n => `<span>${n}</span>`).join('')}</div>`; inp.value = ''; msg.textContent = ''; };
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
    run(area, { end, say, endless, progress = () => {} }) {
      let score = 0; const row = el('div', { class: 'g-duel', role: 'group', 'aria-label': 'Pick the bigger fraction' }), fig = el('div', { class: 'g-fig' }); area.append(row, fig);
      const next = () => { let a, b, c, d; do { b = ri(2, 12); a = ri(1, b - 1); d = ri(2, 12); c = ri(1, d - 1); } while (a * d === b * c);
        row.innerHTML = ''; [[a, b], [c, d]].forEach(([n, m]) => { const btn = el('button', { class: 'g-frac' }, `<span class="fr"><span>${n}</span><span>${m}</span></span>`); btn.onclick = () => { const ok = n / m >= Math.max(a / b, c / d); if (ok) score++; progress(score); fig.innerHTML = V.fracBar(a, b, { w: 240 }) + V.fracBar(c, d, { w: 240, cls: 'vz-teal' }); say(ok ? 'Right!' : `${a}/${b} vs ${c}/${d}: look at the bars.`); flash(row, ok); next(); }; row.append(btn); }); };
      next();
      return endless ? undefined : timer(area, 60, () => end(score));
    } },
  { id: 'line-snipe', modes: ['explorer', 'challenger', 'pro'], title: 'Number line sniper', kid: 'Number line', color: 'sky', grades: '1 to 7',
    desc: 'Place the number on the line as accurately as you can. Ten rounds, up to 10 points each. Builds a feel for size.',
    options: [{ label: '0 to 100', value: 100 }, { label: '0 to 1,000', value: 1000 }, { label: '0 to 1 (fractions)', value: 1 }],
    run(area, { end, option, say, endless, progress = () => {} }) {
      const M = option || 100; let round = 0, score = 0, target;
      const prompt = el('div', { class: 'g-q', 'aria-live': 'polite' }), wrap = el('div', { class: 'g-line' }), form = el('form', { class: 'g-form' });
      wrap.innerHTML = `<div class="g-line-track"><span class="g-line-true" hidden></span></div><input type="range" min="0" max="1000" value="500" aria-label="Position on the number line"><div class="g-line-labels"><span>0</span><span>${M === 1 ? '1' : M.toLocaleString('en-US')}</span></div>`;
      form.innerHTML = '<button class="md-btn md-btn--primary md-btn--sm">Place it</button>'; area.append(prompt, wrap, form);
      const range = wrap.querySelector('input'), mark = wrap.querySelector('.g-line-true');
      const next = () => { if (!endless && round === 10) return end(score); round++; mark.hidden = true;
        if (M === 1) { const d = pick([2, 3, 4, 5, 8, 10]), n = ri(1, d - 1); target = n / d; prompt.innerHTML = `Where is <span class="fr"><span>${n}</span><span>${d}</span></span>?`; }
        else { target = ri(1, M - 1); prompt.textContent = `Where is ${target.toLocaleString('en-US')}?`; }
        range.value = 500; };
      form.onsubmit = e => { e.preventDefault(); const guess = (range.value / 1000) * M, err = Math.abs(guess - target) / M, pts = Math.max(0, Math.round(10 - err * 100)); score += pts; progress(score);
        mark.style.left = (target / M) * 100 + '%'; mark.hidden = false; say(`${pts} point${pts === 1 ? '' : 's'}. You were ${Math.round(err * 1000) / 10}% away.`); setTimeout(next, 1100); };
      next();
    } }
];
