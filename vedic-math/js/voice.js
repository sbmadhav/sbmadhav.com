/* Read-aloud voice for Vedic Math. No API keys, nothing leaves the browser.
   Tier 1 (default and fallback): the browser's built-in Web Speech voice, ranked for quality and tuned for kids.
   Tier 2 (opt-in): Kokoro, a small neural voice that runs in a Web Worker. It downloads only after the
   player turns it on in Me settings; on later visits it loads the first time something is read aloud.
   Any error falls back to Tier 1. Speech only ever follows a tap. */

/* ---------- Math-aware normalization: question HTML to natural speech ---------- */
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const FRAC_WORDS = { 2: ['half', 'halves'], 3: ['third', 'thirds'], 4: ['quarter', 'quarters'] };
const ENT = {
  times: '×', divide: '÷', minus: '−', middot: '·', le: '≤', ge: '≥', lt: '<', gt: '>', pi: 'π', plusmn: '±', asymp: '≈',
  deg: '°', rarr: '→', larr: '←', lang: '⟨', rang: '⟩', radic: '√', prime: '′', int: '∫', amp: '&', quot: '"', apos: "'",
  nbsp: ' ', thinsp: ' ', hairsp: ' ', frac12: '½', frac14: '¼', frac34: '¾', frac13: '⅓', frac23: '⅔', infin: '∞', ne: '≠', hellip: '…'
};
const decodeEntities = s => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&([a-z0-9]+);/gi, (m, k) => (k in ENT ? ENT[k] : ' '));
const plain = s => /^\s*\d+\s*$/.test(s);
function fracWords(n, d) {
  n = n.trim(); d = d.trim();
  if (n === '?') return `what over ${d}`;
  if (plain(n) && plain(d)) {
    const a = +n, b = +d, w = FRAC_WORDS[b];
    if (w && a >= 1 && a < b) return `${ONES[a]} ${a === 1 ? w[0] : w[1]}`;
    return `${a} over ${b}`;
  }
  return `${n}, over ${d},`;
}
export function normalize(input) {
  let s = String(input ?? '');
  // Structure first, while the tags still say what things are
  s = s.replace(/<br\s*\/?>/gi, '. ');
  s = s.replace(/<span class="mx"><span>([\s\S]*?)<\/span><span>([\s\S]*?)<\/span><span>([\s\S]*?)<\/span><span>([\s\S]*?)<\/span><\/span>/g, ' the matrix with rows $1, $2, and $3, $4 ');
  s = s.replace(/(\d)\s*(?:&#8202;| )?\s*(<span class="fr">)/g, '$1 and $2'); // mixed numbers: 2 and 3 quarters
  s = s.replace(/<span class="fr"><span>([\s\S]*?)<\/span><span>([\s\S]*?)<\/span><\/span>/g, (_, n, d) => ' ' + fracWords(n.replace(/<[^>]+>/g, ''), d.replace(/<[^>]+>/g, '')) + ' ');
  s = s.replace(/&int;\s*<sub>([\s\S]*?)<\/sub>\s*<sup>([\s\S]*?)<\/sup>/g, ' the integral from $1 to $2 of ');
  s = s.replace(/lim\s*<sub>([\s\S]*?)(?:&rarr;|→)([\s\S]*?)<\/sub>/g, ' the limit as $1 approaches $2 of ');
  s = s.replace(/log\s*<sub>([\s\S]*?)<\/sub>/g, ' log base $1 of ');
  s = s.replace(/<sup>\s*3\s*<\/sup>\s*(?:&radic;|√)/g, ' the cube root of ');
  s = s.replace(/<sup>\s*2\s*<\/sup>/g, ' squared ').replace(/<sup>\s*3\s*<\/sup>/g, ' cubed ');
  s = s.replace(/<sup>\s*\?\s*<\/sup>/g, ' to the power of what ');
  s = s.replace(/<sup>([\s\S]*?)<\/sup>/g, (_, e) => { e = e.replace(/<[^>]+>/g, '').trim(); return ` to the power of ${e}${/^[\w.&;]+$/.test(e) ? '' : ','} `; });
  s = s.replace(/<sub>([\s\S]*?)<\/sub>/g, ' sub $1 ');
  s = s.replace(/<[^>]+>/g, ' ');
  s = decodeEntities(s);
  s = s.replace(/[   ]/g, ' ');
  // Symbols that are not plain operators
  s = s.replace(/√\s*/g, ' the square root of ');
  s = s.replace(/½/g, ' one half ').replace(/¼/g, ' one quarter ').replace(/¾/g, ' three quarters ').replace(/⅓/g, ' one third ').replace(/⅔/g, ' two thirds ');
  s = s.replace(/[□▢☐◻]/g, ' blank ');
  s = s.replace(/⟨([^⟩]*)⟩/g, ' the vector $1 ');
  s = s.replace(/\|([^|]+)\|/g, ' the absolute value of $1 ');
  s = s.replace(/\b([a-z])\s*′\s*\(/g, '$1 prime of (').replace(/′/g, ' prime ');
  s = s.replace(/\b([fgh])\s*\(([^()]*)\)/g, '$1 of $2');
  s = s.replace(/(\d)(?:,(\d{3}))+(?!\d)/g, m => m.replace(/,/g, '')); // 10,000 to 10000
  s = s.replace(/\$\s*(\d+(?:\.\d+)?)/g, (_, n) => `${n} ${n === '1' ? 'dollar' : 'dollars'}`);
  s = s.replace(/(\d)\s*%/g, '$1 percent');
  s = s.replace(/(\d)\s*°/g, '$1 degrees').replace(/°/g, ' degrees');
  s = s.replace(/\.{3}|…/g, ', and so on, ');
  // Negative numbers: a minus with nothing to subtract from
  s = s.replace(/(^|[(=+×÷·,:≤≥<>±\[]\s*|\b(?:is|of|and|to|from|when|by|at|than|between|plus|minus|times|vector|rows)\s+)[−-]\s*(?=[\d(a-z√π])/gi, '$1negative ');
  s = s.replace(/\(\s*(negative\s+)?([\d.]+)\s*\)/g, ' $1$2 ');
  s = s.replace(/\)\s*\(/g, ') times (');
  s = s.replace(/(\d)\s*\(/g, '$1 times (');
  s = s.replace(/(\d)([a-z])(?![a-z])/gi, '$1 $2'); // 5x to 5 x
  // Operators and relations
  s = s.replace(/\s*≤\s*/g, ' is less than or equal to ').replace(/\s*≥\s*/g, ' is greater than or equal to ');
  s = s.replace(/\s*≠\s*/g, ' is not equal to ').replace(/\s*≈\s*/g, ' is about ');
  s = s.replace(/\s+<\s+/g, ' is less than ').replace(/\s+>\s+/g, ' is greater than ');
  s = s.replace(/\s*×\s*/g, ' times ').replace(/\s*·\s*/g, ' times ').replace(/\s*÷\s*/g, ' divided by ');
  s = s.replace(/\s*[−–]\s*/g, ' minus ').replace(/\s+-\s+/g, ' minus ').replace(/\s*\+\s*/g, ' plus ').replace(/\s*±\s*/g, ' plus or minus ');
  s = s.replace(/\s*→\s*/g, ' to ').replace(/\s*←\s*/g, ' from ');
  s = s.replace(/(\S)\s*\/\s*(?=[\dπa-z(])/gi, '$1 over ');
  s = s.replace(/π/g, ' pi ').replace(/∞/g, ' infinity ').replace(/∫/g, ' the integral of ');
  s = s.replace(/(\d|\?|what)\s+:\s+(?=\d|\?)/g, '$1 to '); // ratios a : b, but not clock times like 3:25
  s = s.replace(/(^|[\s(=])\?(?=[\s),]|$)/g, '$1what');
  s = s.replace(/\s*=\s*/g, ' equals ');
  // Tidy
  s = s.replace(/[()]/g, ' ').replace(/\s+,/g, ',').replace(/,\s*,+/g, ',').replace(/,\s*(?=[.?!]|$)/g, '');
  s = s.replace(/\s+/g, ' ').replace(/\s+([.?!])/g, '$1').trim();
  if (/\bwhat$/.test(s)) s += '?';
  return s;
}

/* Split into short sentences for natural pauses (and to dodge Chrome cutting long utterances off) */
export function sentences(text, max = 160) {
  const out = [];
  String(text).split(/(?<=[.!?])\s+/).forEach(part => {
    part = part.trim(); if (!part) return;
    while (part.length > max) {
      let cut = part.lastIndexOf(', ', max); if (cut < 40) cut = part.lastIndexOf(' ', max); if (cut < 20) cut = max;
      out.push(part.slice(0, cut + 1).trim()); part = part.slice(cut + 1).trim();
    }
    if (part) out.push(part);
  });
  return out;
}

/* ---------- Settings (localStorage, every access guarded) ---------- */
const get = (k, d = null) => { try { const v = localStorage.getItem('vm.' + k); return v === null ? d : v; } catch (e) { return d; } };
const put = (k, v) => { try { v === null ? localStorage.removeItem('vm.' + k) : localStorage.setItem('vm.' + k, v); } catch (e) {} };
export const voiceName = () => get('voiceName', '');
export const setVoiceName = n => put('voiceName', n || null);
export const naturalOn = () => get('naturalVoice', '0') === '1';
export const setNatural = v => put('naturalVoice', v ? '1' : '0');
export const NATURAL_VOICES = [
  { id: 'af_heart', name: 'Heart', note: 'warm, American' },
  { id: 'af_bella', name: 'Bella', note: 'bright, American' },
  { id: 'af_nicole', name: 'Nicole', note: 'soft, American' },
  { id: 'bf_emma', name: 'Emma', note: 'gentle, British' }
];
export const naturalVoice = () => { const v = get('naturalVoiceId', 'af_heart'); return NATURAL_VOICES.some(x => x.id === v) ? v : 'af_heart'; };
export const setNaturalVoice = v => put('naturalVoiceId', v);
const explorer = () => typeof document !== 'undefined' && document.body && document.body.classList.contains('mode-explorer');

/* ---------- Status (download progress, errors) for the Me page and the small progress pill ---------- */
const listeners = new Set();
let status = { state: 'off', pct: 0, msg: '' };
export const onStatus = fn => { listeners.add(fn); fn(status); return () => listeners.delete(fn); };
function setStatus(next) { status = { ...status, ...next }; listeners.forEach(fn => { try { fn(status); } catch (e) {} }); pill(); }

/* ---------- Tier 1: built-in Web Speech, ranked and tuned ---------- */
const hasSynth = () => typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
const NOVELTY = /espeak|\b(fred|albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|junior|ralph|kathy|hysterical|deranged|pipe organ)\b/i;
const QUALITY = [
  [/\b(natural|neural)\b/i, 100], [/\bonline\b/i, 90], [/google us english/i, 82], [/google uk english female/i, 78], [/\bsiri\b/i, 72],
  [/\b(samantha|ava|allison|susan|karen|moira|tessa|serena|zoe|nicky|evan|joelle|veena|isha|rishi)\b/i, 60], [/google uk english/i, 55], [/\bgoogle\b/i, 45],
  [/\b(aria|jenny|libby|sonia|neerja|emma|michelle)\b/i, 40], [/\b(zira|hazel|heera)\b/i, 22]
];
export function scoreVoice(v) {
  if (!v || !/^en([-_]|$)/i.test(v.lang || '')) return -Infinity;
  const name = v.name || '';
  if (NOVELTY.test(name)) return -500;
  let s = 0;
  for (const [re, pts] of QUALITY) if (re.test(name)) { s = Math.max(s, pts); }
  if (/\b(enhanced|premium)\b/i.test(name)) s += 25;
  const lang = (v.lang || '').replace('_', '-').toLowerCase();
  s += lang === 'en-us' ? 10 : lang === 'en-gb' ? 8 : lang === 'en-in' ? 7 : lang === 'en-au' || lang === 'en-ca' || lang === 'en-ie' ? 5 : 2;
  if (v.default) s += 1;
  return s;
}
let voicesReady = null;
function loadVoices() {
  if (!hasSynth()) return Promise.resolve([]);
  const now = speechSynthesis.getVoices();
  if (now.length) return Promise.resolve(now);
  if (!voicesReady) voicesReady = new Promise(res => {
    const done = () => res(speechSynthesis.getVoices());
    try { speechSynthesis.addEventListener('voiceschanged', done, { once: true }); } catch (e) {}
    setTimeout(done, 900); // some browsers never fire voiceschanged
  }).then(v => { voicesReady = null; return v; });
  return voicesReady;
}
/* English voices, best first. Novelty voices are left out unless they are all there is. */
export function englishVoices(all = hasSynth() ? speechSynthesis.getVoices() : []) {
  const ranked = all.map(v => ({ v, s: scoreVoice(v) })).filter(x => x.s > -Infinity).sort((a, b) => b.s - a.s || a.v.name.localeCompare(b.v.name));
  const good = ranked.filter(x => x.s > -500);
  return (good.length ? good : ranked).map(x => x.v);
}
function bestVoice() {
  const list = englishVoices(), want = voiceName();
  return (want && list.find(v => v.name === want)) || list[0] || null;
}

let token = 0; // bumps on every new speech so stale work stops
function speakBuiltIn(text, my) {
  if (!hasSynth()) return;
  const parts = sentences(text); if (!parts.length) return;
  const kid = explorer();
  loadVoices().then(() => {
    if (my !== token) return;
    const v = bestVoice(), natural = v && /natural|neural|online/i.test(v.name);
    const rate = natural ? (kid ? 0.92 : 0.96) : (kid ? 0.9 : 0.94);
    const pitch = natural ? (kid ? 1.08 : 1.04) : (kid ? 1.15 : 1.07);
    let i = 0;
    const next = () => {
      if (my !== token || i >= parts.length) return;
      const u = new SpeechSynthesisUtterance(parts[i++]);
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-US';
      u.rate = rate; u.pitch = pitch; u.volume = 1;
      u.onend = () => setTimeout(next, 140); // a short breath between sentences
      u.onerror = () => setTimeout(next, 0);
      try { if (speechSynthesis.paused) speechSynthesis.resume(); speechSynthesis.speak(u); } catch (e) {}
    };
    setTimeout(next, 40); // Chrome can drop an utterance queued in the same tick as cancel()
  });
}

/* ---------- Tier 2: Kokoro neural voice in a Web Worker ---------- */
const canNatural = () => typeof WebAssembly === 'object' && typeof Worker === 'function' && typeof (window.AudioContext || window.webkitAudioContext) === 'function';
let worker = null, ready = false, loading = null, failedThisVisit = false, reqId = 0, slowWarned = false, firstGenDone = false;
const pending = new Map();
const cache = new Map(); // short phrases: praise lines, numbers, repeated prompts
const CACHE_MAX = 80;
let actx = null, playing = null;

function loadNatural() {
  if (ready) return Promise.resolve();
  if (loading) return loading;
  if (!canNatural()) { failedThisVisit = true; return Promise.reject(new Error('unsupported')); }
  setStatus({ state: 'loading', pct: 0, msg: 'Getting the natural voice ready...' });
  loading = new Promise((resolve, reject) => {
    try { worker = new Worker(new URL('./voice-worker.js', import.meta.url), { type: 'module' }); }
    catch (e) { reject(e); return; }
    const files = {};
    const timer = setTimeout(() => reject(new Error('timeout')), 10 * 60 * 1000);
    worker.onerror = e => { e.preventDefault && e.preventDefault(); reject(new Error(e.message || 'worker error')); };
    worker.onmessage = ({ data }) => {
      if (data.type === 'progress') {
        if (data.file && data.total) files[data.file] = [data.loaded || 0, data.total];
        const vals = Object.values(files), tot = vals.reduce((a, x) => a + x[1], 0), got = vals.reduce((a, x) => a + x[0], 0);
        const pct = tot ? Math.min(99, Math.round(got / tot * 100)) : 0;
        setStatus({ state: 'loading', pct, msg: tot > 20e6 ? `Downloading the natural voice: ${pct}% of ${Math.round(tot / 1e6)} MB` : 'Getting the natural voice ready...' });
      } else if (data.type === 'ready') { clearTimeout(timer); ready = true; resolve(); }
      else if (data.type === 'error') { clearTimeout(timer); reject(new Error(data.message || 'load failed')); }
      else if (data.type === 'audio' || data.type === 'genError') {
        const p = pending.get(data.id); if (!p) return; pending.delete(data.id);
        data.type === 'audio' ? p.resolve({ audio: data.audio, rate: data.rate }) : p.reject(new Error(data.message));
      }
    };
    worker.postMessage({ type: 'load' });
  }).then(() => {
    setStatus({ state: 'ready', pct: 100, msg: 'Natural voice is ready.' });
  }).catch(err => {
    failedThisVisit = true; ready = false; loading = null;
    try { worker && worker.terminate(); } catch (e) {} worker = null;
    pending.forEach(p => p.reject(err)); pending.clear();
    const msg = err.message === 'unsupported'
      ? 'This browser cannot run the natural voice. The built-in voice will keep reading.'
      : 'The natural voice could not download right now (you may be offline, or a blocker stopped it). The built-in voice will keep reading.';
    setStatus({ state: 'error', pct: 0, msg });
    throw err;
  });
  return loading;
}
function generate(text, voice, speed) {
  const key = `${voice}|${speed}|${text}`;
  if (cache.has(key)) { const v = cache.get(key); cache.delete(key); cache.set(key, v); return Promise.resolve(v); }
  const id = ++reqId;
  return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); worker.postMessage({ type: 'gen', id, text, voice, speed }); })
    .then(out => {
      if (text.length <= 80) { cache.set(key, out); if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value); }
      return out;
    });
}
function play({ audio, rate }, my) {
  return new Promise(resolve => {
    if (my !== token) return resolve();
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume().catch(() => {});
    const buf = actx.createBuffer(1, audio.length, rate); buf.copyToChannel(audio, 0);
    const src = actx.createBufferSource(), g = actx.createGain(); g.gain.value = 0.95;
    src.buffer = buf; src.connect(g).connect(actx.destination);
    src.onended = () => { if (playing === src) playing = null; resolve(); };
    playing = src; src.start();
  });
}
async function speakNatural(text, my) {
  const parts = sentences(text, 220); if (!parts.length) return;
  const voice = naturalVoice(), speed = explorer() ? 0.9 : 0.96;
  const t0 = performance.now();
  let nextGen = generate(parts[0], voice, speed);
  for (let i = 0; i < parts.length; i++) {
    const out = await nextGen;
    if (!firstGenDone) { firstGenDone = true; if (performance.now() - t0 > 4000 && parts[0].length < 60) slowNote(); }
    if (my !== token) return;
    if (i + 1 < parts.length) nextGen = generate(parts[i + 1], voice, speed); // make the next sentence while this one plays
    await play(out, my);
    if (my !== token) return;
    if (i + 1 < parts.length) await new Promise(r => setTimeout(r, 120));
  }
}

/* ---------- Public API ---------- */
export function stop() {
  token++;
  try { hasSynth() && speechSynthesis.cancel(); } catch (e) {}
  try { playing && playing.stop(); } catch (e) {} playing = null;
  try { worker && ready && worker.postMessage({ type: 'clear' }); } catch (e) {}
}
/* speak(text or HTML, { natural }) reads it aloud, cancelling anything already speaking. */
export function speak(text, opts = {}) {
  const words = normalize(text); if (!words) return;
  stop(); const my = token;
  const useNatural = (opts.natural ?? naturalOn()) && !failedThisVisit;
  if (!useNatural) return speakBuiltIn(words, my);
  if (ready) { speakNatural(words, my).catch(() => { if (my === token) speakBuiltIn(words, my); }); return; }
  // Not loaded yet: give a cached model a moment, otherwise read this one with the built-in voice
  let settled = false;
  const fallback = setTimeout(() => { if (!settled && my === token) { settled = true; speakBuiltIn(words, my); } }, 2500);
  loadNatural().then(() => { if (settled || my !== token) return; settled = true; clearTimeout(fallback); speakNatural(words, my).catch(() => { if (my === token) speakBuiltIn(words, my); }); })
    .catch(() => { clearTimeout(fallback); if (!settled && my === token) { settled = true; speakBuiltIn(words, my); } });
}
export const supported = () => hasSynth() || canNatural();

/* ---------- Small UI: download pill and the slow-device note (styles at the end of math.css) ---------- */
function pill() {
  if (typeof document === 'undefined' || !document.body) return;
  let el = document.querySelector('.vv-pill');
  if (status.state !== 'loading') { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.className = 'vv-pill'; el.setAttribute('role', 'status'); el.innerHTML = '<span class="vv-pill-txt"></span><span class="vv-bar"><i></i></span>'; document.body.append(el); }
  el.querySelector('.vv-pill-txt').textContent = status.pct ? `Natural voice ${status.pct}%` : 'Natural voice loading';
  el.querySelector('.vv-bar i').style.width = (status.pct || 3) + '%';
}
function slowNote() {
  if (slowWarned || typeof document === 'undefined') return; slowWarned = true;
  const el = document.createElement('div'); el.className = 'vv-note'; el.setAttribute('role', 'status');
  el.innerHTML = '<p>The natural voice is a little slow on this device. Want the quicker built-in voice instead?</p><div><button type="button" class="md-btn md-btn--sm" data-vv="builtin">Use built-in voice</button><button type="button" class="md-btn md-btn--sm" data-vv="keep">Keep natural voice</button></div>';
  el.onclick = e => {
    const b = e.target.closest('[data-vv]'); if (!b) return;
    if (b.dataset.vv === 'builtin') { setNatural(false); setStatus({ state: 'off', msg: 'Using the built-in voice.' }); const cb = document.getElementById('setNatural'); if (cb) cb.checked = false; }
    el.remove();
  };
  document.body.append(el);
}

/* ---------- Me page settings block ---------- */
const escAttr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
export function settingsHTML() {
  return `<div class="vv-set" id="vvSet">
    <div class="vv-row"><label for="setVoiceName">Built-in voice</label><select id="setVoiceName" class="vv-select"><option value="">Best available</option></select><button type="button" class="md-btn md-btn--sm" id="vvTest">Test voice</button></div>
    <div class="vv-row"><label class="vv-check"><input type="checkbox" id="setNatural" ${naturalOn() ? 'checked' : ''}> Natural voice (downloads about 100 MB once)</label>
      <select id="setNaturalVoice" class="vv-select" aria-label="Natural voice" ${naturalOn() ? '' : 'hidden'}>${NATURAL_VOICES.map(v => `<option value="${v.id}" ${v.id === naturalVoice() ? 'selected' : ''}>${v.name} (${v.note})</option>`).join('')}</select></div>
    <p class="mq-small vv-status" id="vvStatus" role="status" aria-live="polite"></p>
  </div>`;
}
export function wireSettings(root = document) {
  const sel = root.querySelector('#setVoiceName'), test = root.querySelector('#vvTest'), nat = root.querySelector('#setNatural'), natSel = root.querySelector('#setNaturalVoice'), out = root.querySelector('#vvStatus');
  if (!sel) return;
  const fill = () => {
    const list = englishVoices(), want = voiceName();
    sel.innerHTML = '<option value="">Best available</option>' + list.map(v => `<option value="${escAttr(v.name)}" ${v.name === want ? 'selected' : ''}>${escAttr(v.name)} (${escAttr(v.lang)})</option>`).join('');
    sel.disabled = !list.length;
  };
  fill(); loadVoices().then(fill);
  if (hasSynth()) try { speechSynthesis.addEventListener('voiceschanged', fill); } catch (e) {}
  const sample = () => speak('Hi there! 7 &times; 8 = 56. Great job!', {});
  sel.onchange = () => { setVoiceName(sel.value); speak('Hi! This is how I sound.', { natural: false }); };
  test.onclick = sample;
  natSel.onchange = () => { setNaturalVoice(natSel.value); speak('Hi! This is how I sound.', { natural: true }); };
  nat.onchange = () => {
    if (!nat.checked) { setNatural(false); natSel.hidden = true; setStatus({ state: 'off', pct: 0, msg: 'Using the built-in voice.' }); return; }
    if (!canNatural()) { nat.checked = false; setStatus({ state: 'error', msg: 'This browser cannot run the natural voice. The built-in voice will keep reading.' }); return; }
    setNatural(true); natSel.hidden = false; failedThisVisit = false;
    loadNatural().then(() => { if (nat.isConnected && nat.checked) speak('Hi! I am your new reading voice.', { natural: true }); })
      .catch(() => { setNatural(false); if (nat.isConnected) { nat.checked = false; natSel.hidden = true; } });
  };
  const off = onStatus(st => {
    if (!out.isConnected) { off(); return; }
    out.textContent = st.msg || (naturalOn() ? (ready ? 'Natural voice is ready.' : 'Natural voice is on. It loads the first time something is read aloud.') : '');
  });
}
