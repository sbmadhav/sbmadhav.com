/* Calm atmosphere for Vedic Math: a slow Vedic-themed background (drifting Devanagari numerals and sutra names,
   a slowly turning yantra, soft stars in Deep Space) and gentle generated music (singing bowls, tanpura drone,
   Himalayan dawn pad, temple chimes). Music never starts on its own and pauses when the tab is hidden.
   Everything is drawn and synthesized in the browser: no audio files, no extra downloads. */

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const pref = (k, d) => { try { const v = localStorage.getItem('vm.' + k); return v === null ? d : v; } catch (e) { return d; } };
const setPref = (k, v) => { try { localStorage.setItem('vm.' + k, v); } catch (e) {} };

/* ---------------- Background: early Indian mathematics, drawn live ----------------
   Every element is a real piece of the history, drawn as strokes (no fonts needed):
   - Śulba Sūtra constructions (Baudhāyana, c. 800 to 500 BCE): rope-and-peg geometry used to build Vedic fire altars,
     drawn slowly as if stretched with a cord: doubling a square by its diagonal, the 3-4-5 knotted rope,
     circling a square, and the falcon-shaped altar (śyenaciti) laid out in bricks.
   - Piṅgala's Meru-prastāra (Chandaḥśāstra, c. 3rd to 2nd century BCE): the triangle of numbers for counting
     poetic meters, built row by row.
   - The 27 nakshatras of the Vedāṅga Jyotiṣa: the lunar mansions as a slow star wheel.
   - Drifting: Brahmi-style numerals, the Bakhshali dot for zero (śūnya), Piṅgala's short and long syllables
     (laghu and guru, the first binary code), and the Taittirīya Saṃhitā's names for powers of ten, up to parārdha (10^12). */
export const BG_NOTES = [
  ['Śulba Sūtras', 'Rope geometry for building Vedic fire altars, written down by Baudhāyana around 800 to 500 BCE. It states the diagonal rule now called Pythagoras and gives √2 as 1 + 1/3 + 1/12 − 1/408.'],
  ['Falcon altar', 'The śyenaciti, a fire altar shaped like a falcon, built from about a thousand bricks laid by exact rules.'],
  ['Meru-prastāra', 'Piṅgala\'s triangle for counting poetic meters (about 200 BCE), the pattern later called Pascal\'s triangle.'],
  ['Laghu and guru', 'Short and long syllables in Sanskrit meter. Piṅgala listed them in a way that works like binary numbers.'],
  ['Powers of ten', 'The Taittirīya Saṃhitā names every power of ten from eka (1) to parārdha (one trillion).'],
  ['Śūnya', 'The Bakhshali manuscript marks zero with a dot, one of the oldest written zeros.'],
  ['Nakshatras', 'The 27 lunar mansions of the Vedāṅga Jyotiṣa, the Vedic star calendar.'],
  ['Brahmi numerals', 'Early Indian digits, ancestors of the 0 to 9 used worldwide today. The shapes here are stylized.']
];
const POWERS = [['eka', 0], ['daśa', 1], ['śata', 2], ['sahasra', 3], ['ayuta', 4], ['niyuta', 5], ['prayuta', 6], ['arbuda', 7], ['nyarbuda', 8], ['samudra', 9], ['madhya', 10], ['anta', 11], ['parārdha', 12]];
/* Stylized Brahmi-style numerals 1 to 9 as stroke paths in a 20 by 24 box (centered on 0,0) */
const BRAHMI = [
  'M-8 0H8',
  'M-8 -4H8M-6 4H6',
  'M-8 -7H8M-6 0H6M-8 7H8',
  'M0 -10V10M-8 -2H8M-8 -2C-8 -8 -2 -10 0 -10',
  'M-6 -10V4C-6 10 6 10 6 4V-2',
  'M-6 -8C2 -12 8 -4 0 0C-8 4 -4 10 4 10',
  'M-6 -10V10M-6 0C2 -4 8 2 6 10',
  'M6 -10C-4 -10 -8 0 0 2C8 4 4 12 -6 10',
  'M-8 -6C-2 -12 8 -8 4 -2C0 4 -8 4 -4 10C-2 12 4 12 6 8'
];
let bg = null;
export const bgOn = () => pref('bg', '1') === '1';
export function setBg(on) { setPref('bg', on ? '1' : '0'); if (on) startBg(); else stopBg(); }

function startBg() {
  if (bg || !bgOn()) return;
  const c = document.createElement('canvas'); c.className = 'vm-bg'; c.setAttribute('aria-hidden', 'true'); document.body.prepend(c);
  const g = c.getContext('2d'); let W = 0, H = 0, dpr = Math.min(2, devicePixelRatio || 1), raf = 0, last = 0, t = 0;
  const size = () => { W = innerWidth; H = innerHeight; c.width = W * dpr; c.height = H * dpr; c.style.width = W + 'px'; c.style.height = H + 'px'; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size(); addEventListener('resize', size);
  const css = getComputedStyle(document.body);
  const col = (name, a) => { const v = css.getPropertyValue(name).trim() || '#A88EEA'; const m = v.match(/^#(..)(..)(..)$/); return m ? `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})` : v; };
  const dark = () => { const th = document.documentElement.dataset.theme; return th === 'dark' || (th !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches); };
  const ink = a => (dark() ? `rgba(225,220,255,${a})` : col('--ink', a));
  const caption = (txt, x, y, a, align = 'left') => { g.font = 'italic 600 12px Fredoka, "Nunito Sans", sans-serif'; g.textAlign = align; g.fillStyle = ink(a); g.fillText(txt, x, y); };

  /* ---- Drifters: Brahmi numerals, the zero dot, laghu-guru meters, power-of-ten names ---- */
  const KINDS = ['brahmi', 'brahmi', 'brahmi', 'zero', 'meter', 'power'];
  const n = Math.round(Math.min(24, Math.max(10, (innerWidth * innerHeight) / 65000)));
  const mk = i => { const kind = KINDS[i % KINDS.length], p = POWERS[Math.floor(Math.random() * POWERS.length)];
    return { kind, d: Math.floor(Math.random() * 9), meter: Array.from({ length: 4 + Math.floor(Math.random() * 3) }, () => Math.random() < .5), p, x: Math.random() * innerWidth, y: Math.random() * innerHeight, v: 4 + Math.random() * 8, sway: Math.random() * 6.28, s: .9 + Math.random() * 1.1, a: .07 + Math.random() * .07, rot: (Math.random() - .5) * .25, hue: ['--plum', '--coral', '--teal', '--sky', '--sun-strong'][i % 5] }; };
  const items = Array.from({ length: n }, (_, i) => mk(i));
  function drifter(it, x) {
    const a = it.a * (dark() ? 1.7 : 1.15), stroke = col(it.hue, a);
    g.save(); g.translate(x, it.y); g.rotate(it.rot); g.scale(it.s, it.s); g.lineCap = 'round'; g.lineJoin = 'round';
    if (it.kind === 'brahmi') { g.strokeStyle = stroke; g.lineWidth = 2.6; g.stroke(new Path2D(BRAHMI[it.d])); }
    else if (it.kind === 'zero') { g.fillStyle = stroke; g.beginPath(); g.arc(0, 0, 4.5, 0, 6.283); g.fill(); g.strokeStyle = col(it.hue, a * .5); g.lineWidth = 1; g.beginPath(); g.arc(0, 0, 11, 0, 6.283); g.stroke(); }
    else if (it.kind === 'meter') { g.strokeStyle = stroke; g.lineWidth = 2.4; let px = -it.meter.length * 9; it.meter.forEach(long => { g.beginPath(); if (long) { g.moveTo(px, 0); g.lineTo(px + 14, 0); } else { g.arc(px + 5, -5, 5, Math.PI * .15, Math.PI * .85); } g.stroke(); px += 20; }); }
    else { g.fillStyle = col(it.hue, a * 1.2); g.font = 'italic 600 15px Fredoka, "Nunito Sans", sans-serif'; g.textAlign = 'center'; g.fillText(`${it.p[0]} · 10`, -6, 0); g.font = '600 10px Fredoka, sans-serif'; g.fillText(String(it.p[1]), 24 + (it.p[0].length > 6 ? 8 : 0), -8); }
    g.restore();
  }

  /* ---- Nakshatra wheel: 27 lunar mansions, very slow ---- */
  const naks = Array.from({ length: 27 }, (_, i) => ({ a: (i / 27) * 6.283, r: 2 + (i * 7 % 5) * .5, tw: i * 1.7 }));
  function wheel(cx, cy, R) {
    const a0 = t * .012, d = dark();
    g.lineWidth = 1; g.strokeStyle = ink(d ? .12 : .08); g.beginPath(); g.arc(cx, cy, R, 0, 6.283); g.stroke(); g.beginPath(); g.arc(cx, cy, R * .82, 0, 6.283); g.stroke();
    naks.forEach((s, i) => { const a = s.a + a0, x = cx + R * .91 * Math.cos(a), y = cy + R * .91 * Math.sin(a); g.strokeStyle = ink(d ? .08 : .05); g.beginPath(); g.moveTo(cx + R * .82 * Math.cos(a), cy + R * .82 * Math.sin(a)); g.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a)); g.stroke();
      const tw = .5 + .5 * Math.sin(t * .7 + s.tw); g.fillStyle = col(i % 3 ? '--sun-strong' : '--plum', (d ? .35 : .18) * (.6 + .4 * tw)); g.beginPath(); g.arc(x, y, s.r, 0, 6.283); g.fill(); });
    g.fillStyle = col('--sun-strong', d ? .25 : .14); g.beginPath(); g.arc(cx + R * .45 * Math.cos(t * .05), cy + R * .45 * Math.sin(t * .05), 6, 0, 6.283); g.fill(); // the moon crossing the mansions
    caption('27 nakshatras · Vedāṅga Jyotiṣa', cx, cy + R + 18, d ? .3 : .22, 'center');
  }

  /* ---- Śulba constructions: drawn like a cord stretched between pegs ---- */
  // Each construction: list of shapes in unit coordinates; ['l', x1,y1,x2,y2] line, ['c', cx,cy,r] circle, ['r', x,y,w,h] brick, ['k', x,y] knot
  const S2 = Math.SQRT2;
  const SQ = h => [['l', -h, -h, h, -h], ['l', h, -h, h, h], ['l', h, h, -h, h], ['l', -h, h, -h, -h]];
  const brickAltar = () => { const out = [], u = .1;
    for (let i = -2; i < 2; i++) for (let j = -2; j < 2; j++) out.push(['r', i * u, j * u, u, u]); // body
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { out.push(['r', -.2 - (i + 1) * u, -.15 + j * u - i * .02, u, u]); out.push(['r', .2 + i * u, -.15 + j * u - i * .02, u, u]); } // wings
    for (let i = -1; i < 1; i++) for (let j = 0; j < 2; j++) out.push(['r', i * u * 1.2 - .02, .2 + j * u, u * 1.2, u]); // tail
    out.push(['r', -.05, -.3, u, u]); // head
    return out; };
  const CONS = [
    { cap: 'Baudhāyana: the square on the diagonal is twice the square', shapes: [...SQ(.22).map(l => l.map((v, i) => (i ? v + .14 : v))), ['l', -.08, .36, .36, -.08], ['l', .36, -.08, -.08, -.52], ['l', -.08, -.52, -.52, -.08], ['l', -.52, -.08, -.08, .36]] },
    { cap: 'A knotted rope of 3 + 4 + 5 makes a right angle', shapes: [['l', -.3, .2, .3, .2], ['l', .3, .2, .3, -.25], ['l', .3, -.25, -.3, .2], ...Array.from({ length: 13 }, (_, i) => { const L = i <= 4 ? [-.3 + i * .15, .2] : i <= 7 ? [.3, .2 - (i - 4) * .15] : [.3 - (i - 7) * .12, -.25 + (i - 7) * .09]; return ['k', ...L]; })] },
    { cap: 'Circling the square: Śulba rule for an equal-area circle', shapes: [...SQ(.22), ['l', 0, 0, .22, -.22], ['l', 0, 0, 0, -.22], ['c', 0, 0, .22 + (.22 * S2 - .22) / 3]] },
    { cap: 'The falcon fire altar (śyenaciti), laid in bricks', shapes: brickAltar() },
    { cap: '√2 ≈ 1 + 1/3 + 1/(3·4) − 1/(3·4·34) = 1.41421…', shapes: [...SQ(.2), ['l', -.2, .2, .2, -.2], ['a', -.2, .2, .4 * S2, -Math.PI / 4, 0], ['l', .2, .2, .2 * (2 * S2 - 1), .2], ['k', -.2, .2], ['k', .2 * (2 * S2 - 1), .2]] }
  ];
  let ci = Math.floor(Math.random() * CONS.length), cStart = 0;
  function sulba(cx, cy, R) {
    const k = CONS[ci], T = t - cStart, DRAW = 18, HOLD = 12, FADE = 4, total = k.shapes.length;
    if (T > DRAW + HOLD + FADE) { ci = (ci + 1) % CONS.length; cStart = t; return; }
    const shown = Math.min(total, (T / DRAW) * total), fade = T > DRAW + HOLD ? 1 - (T - DRAW - HOLD) / FADE : 1, d = dark();
    const stroke = col(d ? '--sun' : '--coral-strong', (d ? .28 : .18) * fade);
    g.lineWidth = 1.4; g.strokeStyle = stroke; g.lineCap = 'round';
    for (let i = 0; i < Math.ceil(shown); i++) {
      const s = k.shapes[i], f = Math.min(1, shown - i), X = v => cx + v * R, Y = v => cy + v * R;
      g.beginPath();
      if (s[0] === 'l') { g.moveTo(X(s[1]), Y(s[2])); g.lineTo(X(s[1] + (s[3] - s[1]) * f), Y(s[2] + (s[4] - s[2]) * f)); g.stroke(); }
      else if (s[0] === 'c') { g.arc(X(s[1]), Y(s[2]), s[3] * R, -Math.PI / 2, -Math.PI / 2 + 6.283 * f); g.stroke(); }
      else if (s[0] === 'r') { g.globalAlpha = f; g.strokeRect(X(s[1]), Y(s[2]), s[3] * R, s[4] * R); g.globalAlpha = 1; }
      else if (s[0] === 'a') { g.arc(X(s[1]), Y(s[2]), s[3] * R, s[4], s[4] + (s[5] - s[4]) * f); g.stroke(); }
      else if (s[0] === 'k') { g.fillStyle = stroke; g.arc(X(s[1]), Y(s[2]), 2.6 * f, 0, 6.283); g.fill(); }
    }
    // pegs at the start, like the śaṅku used to fix the cord
    g.fillStyle = col(d ? '--sun' : '--coral-strong', (d ? .3 : .2) * fade); [[-.42, .42], [.42, .42]].forEach(([a, b]) => { g.fillRect(cx + a * R - 1.5, cy + b * R - 8, 3, 10); });
    caption(k.cap, cx, cy + .55 * R, (d ? .32 : .24) * fade, 'center'); caption('Śulba Sūtras · c. 800 BCE', cx, cy + .55 * R + 16, (d ? .22 : .16) * fade, 'center');
  }

  /* ---- Piṅgala's Meru-prastāra, built row by row ---- */
  let mStart = 0;
  function meru(cx, cy, step) {
    const rows = 8, T = t - mStart, per = 2.4, hold = 10, fade = 4;
    if (T > rows * per + hold + fade) { mStart = t; return; }
    const f = T > rows * per + hold ? 1 - (T - rows * per - hold) / fade : 1, d = dark();
    let row = [1];
    for (let r = 0; r < rows; r++) {
      const vis = Math.min(1, Math.max(0, (T - r * per) / per)); if (vis <= 0) break;
      row.forEach((v, i) => { const x = cx + (i - r / 2) * step * 1.15, y = cy + r * step; g.strokeStyle = ink((d ? .14 : .09) * vis * f); g.lineWidth = 1; g.beginPath(); g.arc(x, y, step * .42, 0, 6.283); g.stroke();
        g.fillStyle = col(r % 2 ? '--teal' : '--plum', (d ? .4 : .26) * vis * f); g.font = `600 ${Math.round(step * .42)}px Fredoka, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(v), x, y + 1); g.textBaseline = 'alphabetic'; });
      row = [1, ...row.slice(1).map((v, i) => v + row[i]), 1];
    }
    caption('Meru-prastāra · Piṅgala, c. 200 BCE', cx, cy + rows * step + 6, (d ? .3 : .22) * f, 'center');
  }

  const stars = Array.from({ length: 46 }, () => ({ x: Math.random(), y: Math.random(), p: Math.random() * 6.28, r: Math.random() * 1.2 + .3 }));
  function draw(dt) {
    const d = dark(); g.clearRect(0, 0, W, H);
    if (d) stars.forEach(s => { const a = .2 + .3 * Math.sin(t * .8 + s.p); g.fillStyle = `rgba(230,225,255,${a})`; g.beginPath(); g.arc(s.x * W, s.y * H, s.r, 0, 6.283); g.fill(); });
    const wide = W > 900;
    wheel(W - Math.min(190, W * .22), Math.min(230, H * .3), Math.min(150, W * .2));
    sulba(wide ? Math.min(230, W * .18) : W * .5, H * .6, Math.min(240, W * .3));
    if (wide) meru(W - Math.min(200, W * .17), Math.min(H - 300, H * .55), 22);
    items.forEach((it, i) => { it.y -= it.v * dt; it.sway += dt * .4; if (it.y < -40) Object.assign(it, mk(i), { y: H + 30 }); drifter(it, it.x + Math.sin(it.sway) * 14); });
  }
  function frame(now) { raf = requestAnimationFrame(frame); if (now - last < 33) return; const dt = Math.min(.1, (now - last) / 1000); last = now; t += dt; draw(dt); }
  const vis = () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf && !reduced()) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  document.addEventListener('visibilitychange', vis);
  if (reduced()) { t = 40; cStart = 0; mStart = 0; draw(0); } else raf = requestAnimationFrame(frame);
  const mo = new MutationObserver(() => { if (reduced()) draw(0); }); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  bg = () => { cancelAnimationFrame(raf); removeEventListener('resize', size); document.removeEventListener('visibilitychange', vis); mo.disconnect(); c.remove(); bg = null; };
}
function stopBg() { if (bg) bg(); }

/* ---------------- Music ---------------- */
export const TRACKS = [
  { id: 'bowls', name: 'Singing bowls', note: 'Tibetan bowls struck slowly, ringing out' },
  { id: 'tanpura', name: 'Tanpura drone', note: 'The steady Sa and Pa drone behind Indian classical music' },
  { id: 'dawn', name: 'Himalayan dawn', note: 'A soft warm pad with distant bowls' },
  { id: 'chimes', name: 'Temple chimes', note: 'Sparse bells on a gentle hum' }
];
let ac = null, master = null, verb = null, playing = null, timers = [], live = [];
export const isPlaying = () => !!playing;
export const current = () => playing || pref('track', 'bowls');
export const volume = () => +pref('vol', '0.5');
export function setVolume(v) { setPref('vol', String(v)); if (master) master.gain.setTargetAtTime(v * .5, ac.currentTime, .2); }

function ctx() {
  if (ac) return ac;
  ac = new (window.AudioContext || window.webkitAudioContext)();
  master = ac.createGain(); master.gain.value = volume() * .5;
  // Small synthetic hall reverb
  verb = ac.createConvolver(); const len = ac.sampleRate * 3.5, buf = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
  verb.buffer = buf; const wet = ac.createGain(); wet.gain.value = .45; verb.connect(wet).connect(master);
  master.connect(ac.destination);
  return ac;
}
const out = node => { node.connect(master); node.connect(verb); };
const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); };

/* Singing bowl: inharmonic partials with slow beating and a long decay */
function bowl(f, vol = .16, at = 0) {
  const t0 = ac.currentTime + at, dur = 9 + Math.random() * 4;
  [[1, 1], [2.71, .45], [5.12, .2], [8.3, .07]].forEach(([r, a]) => {
    [0, 1].forEach(k => { const o = ac.createOscillator(), gn = ac.createGain(); o.type = 'sine'; o.frequency.value = f * r + (k ? .6 + r * .35 : 0);
      gn.gain.setValueAtTime(0, t0); gn.gain.linearRampToValueAtTime(vol * a * .5, t0 + .02); gn.gain.exponentialRampToValueAtTime(.0001, t0 + dur / Math.sqrt(r));
      o.connect(gn); out(gn); o.start(t0); o.stop(t0 + dur + .5); });
  });
}
/* Bell for chimes */
function bell(f, vol = .07) { const t0 = ac.currentTime; [[1, 1], [2.4, .4], [5.95, .15]].forEach(([r, a]) => { const o = ac.createOscillator(), gn = ac.createGain(); o.frequency.value = f * r; gn.gain.setValueAtTime(vol * a, t0); gn.gain.exponentialRampToValueAtTime(.0001, t0 + 4 / r); o.connect(gn); out(gn); o.start(t0); o.stop(t0 + 4.5); }); }
/* Held tone (drone or pad voice) that lives until stop() */
function hold(f, type, vol, lp = 1200) {
  const o = ac.createOscillator(), gn = ac.createGain(), fl = ac.createBiquadFilter(), lfo = ac.createOscillator(), lg = ac.createGain();
  o.type = type; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = lp; lfo.frequency.value = .05 + Math.random() * .08; lg.gain.value = vol * .35;
  lfo.connect(lg).connect(gn.gain); gn.gain.setValueAtTime(0, ac.currentTime); gn.gain.linearRampToValueAtTime(vol, ac.currentTime + 4);
  o.connect(fl).connect(gn); out(gn); o.start(); lfo.start(); live.push({ o, lfo, gn });
}
/* Tanpura pluck: bright attack, slow buzzy decay */
function pluck(f, vol = .09) { const t0 = ac.currentTime, o = ac.createOscillator(), gn = ac.createGain(), fl = ac.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.setValueAtTime(2600, t0); fl.frequency.exponentialRampToValueAtTime(500, t0 + 3); gn.gain.setValueAtTime(0, t0); gn.gain.linearRampToValueAtTime(vol, t0 + .01); gn.gain.exponentialRampToValueAtTime(.0001, t0 + 4.2); o.connect(fl).connect(gn); out(gn); o.start(t0); o.stop(t0 + 4.4); }

const SA = 130.81; // C3 as Sa
const PENTA = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2];
const PLAY = {
  bowls() { const loop = () => { bowl(SA * PENTA[Math.floor(Math.random() * PENTA.length)] * (Math.random() < .3 ? 2 : 1)); later(loop, 5500 + Math.random() * 6000); }; hold(SA / 2, 'sine', .035, 400); loop(); },
  tanpura() { hold(SA / 2, 'sine', .04, 300); const seq = [SA * 3 / 4, SA, SA, SA / 2]; let i = 0; const loop = () => { pluck(seq[i % 4]); i++; later(loop, i % 4 === 0 ? 1900 : 1150); }; loop(); },
  dawn() { [SA, SA * 3 / 2, SA * 2, SA * 5 / 2].forEach((f, i) => { hold(f, 'triangle', .022 - i * .003, 900); hold(f * 1.003, 'sine', .015, 900); }); const loop = () => { bowl(SA * 2 * PENTA[Math.floor(Math.random() * 4)], .07); later(loop, 11000 + Math.random() * 9000); }; later(loop, 4000); },
  chimes() { hold(SA, 'sine', .025, 500); hold(SA * 1.5, 'sine', .012, 500); const loop = () => { bell(SA * 4 * PENTA[Math.floor(Math.random() * PENTA.length)]); if (Math.random() < .4) later(() => bell(SA * 4 * PENTA[Math.floor(Math.random() * PENTA.length)], .05), 300 + Math.random() * 500); later(loop, 2500 + Math.random() * 5000); }; loop(); }
};

export function play(id = current()) {
  stop(); ctx(); if (ac.state === 'suspended') ac.resume();
  master.gain.cancelScheduledValues(ac.currentTime); master.gain.setValueAtTime(0, ac.currentTime); master.gain.linearRampToValueAtTime(volume() * .5, ac.currentTime + 2);
  playing = id; setPref('track', id); (PLAY[id] || PLAY.bowls)(); emit();
  try { window.siteTrack && window.siteTrack('vedic-math/music/' + id, 'Music: ' + id); } catch (e) {}
}
export function stop() {
  timers.forEach(clearTimeout); timers = [];
  if (ac) { const t = ac.currentTime; master.gain.cancelScheduledValues(t); master.gain.setTargetAtTime(0, t, .6); live.forEach(({ o, lfo, gn }) => { gn.gain.cancelScheduledValues(t); gn.gain.setTargetAtTime(0, t, .4); o.stop(t + 2); lfo.stop(t + 2); }); }
  live = []; const was = playing; playing = null; if (was) emit();
}
document.addEventListener('visibilitychange', () => { if (!ac) return; if (document.hidden) ac.suspend(); else if (playing) ac.resume(); });

const subs = new Set(); export const onChange = fn => (subs.add(fn), () => subs.delete(fn)); const emit = () => subs.forEach(f => f());

/* Music button and panel in the nav */
export function mountMusic(slot) {
  if (!slot) return;
  const note = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 18V5l11-2v13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6.5" cy="18" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="16" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
  slot.innerHTML = `<button class="vm-mbtn" id="vmMBtn" aria-expanded="false" aria-controls="vmMPanel" aria-label="Calm music">${note}<span class="vm-eq" aria-hidden="true"><i></i><i></i><i></i></span></button>
    <div class="vm-mpanel md-card" id="vmMPanel" hidden><b class="vm-mt">Calm music</b><p class="mq-small">Gentle sounds made live in your browser. They never start by themselves.</p>
    <div class="vm-tracks" role="group" aria-label="Choose music">${TRACKS.map(t => `<button class="vm-track" data-t="${t.id}" aria-pressed="false"><b>${t.name}</b><small>${t.note}</small></button>`).join('')}</div>
    <div class="vm-mrow"><button class="md-btn md-btn--sm" id="vmStop">Stop</button><label class="vm-vol">Volume <input type="range" min="0" max="1" step="0.05" value="${volume()}" id="vmVol"></label></div>
    <label class="vm-bgt"><input type="checkbox" id="vmBg" ${bgOn() ? 'checked' : ''}> Moving background</label>
    <details class="vm-about"><summary>What is in the background?</summary><ul>${BG_NOTES.map(([h, b]) => `<li><b>${h}</b> ${b}</li>`).join('')}</ul></details></div>`;
  const btn = slot.querySelector('#vmMBtn'), panel = slot.querySelector('#vmMPanel');
  const sync = () => { btn.classList.toggle('on', isPlaying()); slot.querySelectorAll('[data-t]').forEach(b => b.setAttribute('aria-pressed', String(playing === b.dataset.t))); };
  btn.onclick = e => { e.stopPropagation(); const open = panel.hidden; panel.hidden = !open; btn.setAttribute('aria-expanded', String(open)); };
  document.addEventListener('click', e => { if (!panel.hidden && !slot.contains(e.target)) { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.focus(); } });
  slot.querySelectorAll('[data-t]').forEach(b => b.onclick = () => (playing === b.dataset.t ? stop() : play(b.dataset.t)));
  slot.querySelector('#vmStop').onclick = stop;
  slot.querySelector('#vmVol').oninput = e => setVolume(+e.target.value);
  slot.querySelector('#vmBg').onchange = e => setBg(e.target.checked);
  onChange(sync); sync();
}

export function initAmbient() {
  mountMusic(document.getElementById('mqMusic'));
  // Background starts after the page is ready and the browser is idle
  const go = () => startBg();
  if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 1500 }); else setTimeout(go, 600);
}
