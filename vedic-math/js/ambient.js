/* Calm atmosphere for Vedic Math: a slow Vedic-themed background (drifting Devanagari numerals and sutra names,
   a slowly turning yantra, soft stars in Deep Space) and gentle generated music (singing bowls, tanpura drone,
   Himalayan dawn pad, temple chimes). Music never starts on its own and pauses when the tab is hidden.
   Everything is drawn and synthesized in the browser: no audio files, no extra downloads. */

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const pref = (k, d) => { try { const v = localStorage.getItem('vm.' + k); return v === null ? d : v; } catch (e) { return d; } };
const setPref = (k, v) => { try { localStorage.setItem('vm.' + k, v); } catch (e) {} };

/* ---------------- Background ---------------- */
const DIGITS = '०१२३४५६७८९'.split('');
const WORDS = ['Ekādhikena', 'Nikhilam', 'Ūrdhva Tiryak', 'Parāvartya', 'Śūnyam', 'Yāvadūnam', 'Ānurūpyeṇa', 'Vilokanam', 'Saṅkalana', 'Guṇita', 'Calana', 'Vyaṣṭi'];
let bg = null;
export const bgOn = () => pref('bg', '1') === '1';
export function setBg(on) { setPref('bg', on ? '1' : '0'); if (on) startBg(); else stopBg(); }

function startBg() {
  if (bg || !bgOn()) return;
  const c = document.createElement('canvas'); c.className = 'vm-bg'; c.setAttribute('aria-hidden', 'true'); document.body.prepend(c);
  const g = c.getContext('2d'); let W = 0, H = 0, dpr = Math.min(2, devicePixelRatio || 1), raf = 0, last = 0, t = 0;
  const size = () => { W = innerWidth; H = innerHeight; c.width = W * dpr; c.height = H * dpr; c.style.width = W + 'px'; c.style.height = H + 'px'; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size(); addEventListener('resize', size);
  const n = Math.round(Math.min(26, Math.max(12, (innerWidth * innerHeight) / 60000)));
  const items = Array.from({ length: n }, (_, i) => mk(i % 4 === 0));
  function mk(word) { return { word, s: word ? WORDS[Math.floor(Math.random() * WORDS.length)] : DIGITS[Math.floor(Math.random() * 10)], x: Math.random() * innerWidth, y: Math.random() * innerHeight, v: 4 + Math.random() * 8, sway: Math.random() * 6.28, size: word ? 15 + Math.random() * 8 : 22 + Math.random() * 30, a: .05 + Math.random() * .07, rot: (Math.random() - .5) * .3 }; }
  const stars = Array.from({ length: 50 }, () => ({ x: Math.random(), y: Math.random(), p: Math.random() * 6.28, r: Math.random() * 1.3 + .3 }));
  const dark = () => { const th = document.documentElement.dataset.theme; return th === 'dark' || (th !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches); };
  const col = (name, a) => { const v = getComputedStyle(document.body).getPropertyValue(name).trim() || '#A88EEA'; const m = v.match(/^#(..)(..)(..)$/); return m ? `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})` : v; };

  /* A simple Sri Yantra-like figure: circles, lotus petals and interlocking triangles */
  function yantra(cx, cy, R, rot, stroke) {
    g.save(); g.translate(cx, cy); g.rotate(rot); g.strokeStyle = stroke; g.lineWidth = 1.2;
    [1, .86, .78].forEach(k => { g.beginPath(); g.arc(0, 0, R * k, 0, 6.283); g.stroke(); });
    for (let ring = 0; ring < 2; ring++) { const petals = ring ? 16 : 8, r1 = R * (ring ? .78 : .62), r2 = R * (ring ? .86 : .78);
      for (let i = 0; i < petals; i++) { const a = (i / petals) * 6.283, b = a + 6.283 / petals; g.beginPath(); g.moveTo(r1 * Math.cos(a), r1 * Math.sin(a)); g.quadraticCurveTo(r2 * 1.05 * Math.cos((a + b) / 2), r2 * 1.05 * Math.sin((a + b) / 2), r1 * Math.cos(b), r1 * Math.sin(b)); g.stroke(); } }
    for (let k = 0; k < 4; k++) { const s = R * (.58 - k * .1), up = k % 2 === 0; g.beginPath(); for (let j = 0; j < 3; j++) { const a = (up ? -Math.PI / 2 : Math.PI / 2) + j * 2.094; g[j ? 'lineTo' : 'moveTo'](s * Math.cos(a), s * Math.sin(a) + (up ? -k * 3 : k * 3)); } g.closePath(); g.stroke(); }
    g.beginPath(); g.arc(0, 0, 2.5, 0, 6.283); g.fillStyle = stroke; g.fill(); g.restore();
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (now - last < 33) return; const dt = Math.min(.1, (now - last) / 1000); last = now; t += dt;
    draw(dt);
  }
  function draw(dt) {
    const d = dark(); g.clearRect(0, 0, W, H);
    if (d) stars.forEach(s => { const a = .25 + .35 * Math.sin(t * .8 + s.p); g.fillStyle = `rgba(230,225,255,${a})`; g.beginPath(); g.arc(s.x * W, s.y * H, s.r, 0, 6.283); g.fill(); });
    yantra(W - Math.min(180, W * .2), Math.min(200, H * .28), Math.min(170, W * .22), t * .025, col(d ? '--plum' : '--sun-strong', d ? .16 : .1));
    yantra(Math.min(120, W * .12), H - 120, Math.min(110, W * .14), -t * .02, col(d ? '--teal' : '--coral', d ? .1 : .07));
    items.forEach((it, i) => {
      it.y -= it.v * dt; it.sway += dt * .4; const x = it.x + Math.sin(it.sway) * 14;
      if (it.y < -40) Object.assign(it, mk(it.word), { y: H + 30 });
      g.save(); g.translate(x, it.y); g.rotate(it.rot); g.font = `${it.word ? 'italic 600' : '600'} ${it.size}px ${it.word ? 'Fredoka, "Nunito Sans", sans-serif' : '"Noto Sans Devanagari", "Nirmala UI", "Kohinoor Devanagari", sans-serif'}`;
      g.fillStyle = col(['--plum', '--coral', '--teal', '--sky', '--sun-strong'][i % 5], it.a * (d ? 1.6 : 1)); g.textAlign = 'center'; g.fillText(it.s, 0, 0); g.restore();
    });
  }
  const vis = () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf && !reduced()) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  document.addEventListener('visibilitychange', vis);
  if (reduced()) draw(0); else raf = requestAnimationFrame(frame);
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
    <label class="vm-bgt"><input type="checkbox" id="vmBg" ${bgOn() ? 'checked' : ''}> Moving background</label></div>`;
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
