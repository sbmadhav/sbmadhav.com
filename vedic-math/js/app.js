/* Vedic Math for Everyone: router and views.
   Modes: Explorer (about 4 to 7), Challenger (about 8 to 12), Pro (13 to adult). Everything is gamified:
   XP and levels, badges, Dojo belts, daily quests, the Arena with leaderboards, duels and games. */
import { SKILLS, byId, skillsFor, GRADES, STRANDS, gradeOf } from './skills/index.js';
import { TRICKS, BELTS } from './vedic.js';
import { GAMES } from './games.js';
import { SUTRAS, SUBSUTRAS, HISTORY } from './sutras.js';
import { RESOURCES } from './resources.js';
import { checkOne } from './check.js';
import { pick, shuffle } from './lib.js';
import * as store from './store.js';
import * as fx from './fx.js';
import * as gm from './gamify.js';
import * as cloud from './cloud.js';
import { runArena, runDuel } from './arena.js';
import { initAmbient, TRACKS, play as playMusic, stop as stopMusic, bgOn, setBg } from './ambient.js';

const $ = (s, r = document) => r.querySelector(s);
const view = $('#view');
const both = (pro, kid) => (kid && kid !== pro ? `<span class="pro">${pro}</span><span class="kid">${kid}</span>` : pro);
const track = (name, title) => { try { window.siteTrack && window.siteTrack('math/' + name, title); } catch (e) {} };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const gradeLabel = g => { const x = gradeOf(g); return x ? both(x.pro, x.kid) : g; };
const gradeShort = g => (g === 'K' ? 'K' : g === 'V' ? 'Tricks' : g);
const pct = x => Math.round(x * 100);
const plain = h => String(h).replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ');
const BRAND = 'Vedic Math';
let cleanup = null;

const ring = (m, size = 44) => { const r = size / 2 - 4, c = 2 * Math.PI * r; return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-bg"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-fg" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - m)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>`; };
const status = id => (store.mastered(id) ? ['done', both('Mastered', 'Got it!')] : store.started(id) ? ['going', both('Practicing', 'Learning')] : ['new', 'New']);
const gradeStats = g => { const list = skillsFor(g); const done = list.filter(s => store.mastered(s.id)).length; const avg = list.reduce((t, s) => t + store.mastery(s.id), 0) / (list.length || 1); return { done, total: list.length, avg }; };
const avatar = (p, size = 36) => `<span class="av av-${p.avatar}" style="width:${size}px;height:${size}px;font-size:${size * 0.42}px" aria-hidden="true">${p.name.split(' ').slice(0, 2).map(w => w[0]).join('')}</span>`;
const BOLT = `<svg class="bolt" viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="14" width="48" height="40" rx="14" fill="#1FA39A" stroke="#1C2541" stroke-width="3"/><circle cx="24" cy="34" r="7" fill="#fff"/><circle cx="40" cy="34" r="7" fill="#fff"/><circle cx="25" cy="35" r="3" fill="#1C2541"/><circle cx="41" cy="35" r="3" fill="#1C2541"/><path d="M32 14V9" stroke="#1C2541" stroke-width="3"/><circle cx="32" cy="7" r="5" fill="#FF6B5B" stroke="#1C2541" stroke-width="3"/></svg>`;
const crumbs = (...parts) => `<nav class="mq-crumbs" aria-label="Breadcrumb"><a href="#/">${BRAND}</a>${parts.map(([h, l]) => ` <span aria-hidden="true">/</span> ${h ? `<a href="${h}">${l}</a>` : `<span>${l}</span>`}`).join('')}</nav>`;

/* ---------- Router ---------- */
const routes = [
  [/^#?\/?$/, home],
  [/^#\/learn$/, learnView],
  [/^#\/grade\/(\w+)$/, m => gradeView(m[1])],
  [/^#\/skill\/([\w-]+)$/, m => skillView(m[1])],
  [/^#\/mix\/(\w+)$/, m => mixView(m[1])],
  [/^#\/run\/(\w+)$/, m => mixView(m[1], true)],
  [/^#\/(dojo|tricks)$/, dojoView],
  [/^#\/sutras$/, sutrasView],
  [/^#\/arena$/, arenaView],
  [/^#\/duel$/, duelView],
  [/^#\/games$/, gamesView],
  [/^#\/game\/([\w-]+)$/, m => gameView(m[1])],
  [/^#\/watch$/, watchView],
  [/^#\/(me|progress)$/, meView]
];
function render() {
  if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
  try { speechSynthesis.cancel(); } catch (e) {}
  const h = location.hash || '#/';
  const hit = routes.find(([re]) => re.test(h));
  if (!fx.mode() && !/^#\/(watch|sutras)$/.test(h)) modePicker(); else (hit ? hit[1](h.match(hit[0])) : home());
  document.querySelectorAll('.mq-nav a[href]').forEach(a => a.setAttribute('aria-current', String(h === a.getAttribute('href') || (!!a.dataset.match && new RegExp(a.dataset.match).test(h)))));
  chip();
  const head = view.querySelector('h1, h2'); if (head) { head.setAttribute('tabindex', '-1'); if (render.n++) head.focus({ preventScroll: true }); }
  if (render.n > 1) window.scrollTo({ top: 0 });
}
render.n = 0;
window.addEventListener('hashchange', render);

/* Player chip in the nav: avatar, level, XP bar */
function chip() {
  const el = $('#mqChip'); if (!el) return; const p = store.player(), L = gm.levelInfo();
  el.innerHTML = `<a href="#/me" class="mq-chip" aria-label="${esc(p.name)}, level ${L.lv}">${avatar(p, 30)}<span class="mq-chip-t"><b>Lv ${L.lv}</b><span class="mq-xpbar"><i style="width:${pct(L.pct)}%"></i></span></span></a>`;
}
store.on(type => { if (type === 'xp' || type === 'player') chip(); });

/* ---------- Mode picker (first visit, and from Me) ---------- */
function modePicker() {
  document.title = `${BRAND} for Everyone · Madhav`;
  const p = store.player();
  view.innerHTML = `<section class="md-section mq-hero"><div class="md-wrap">
    <span class="md-tag md-tag--plum">Vedic Math for Everyone</span>
    <h1 class="md-heading">Fast, fun math for <span class="hl-word">every</span> brain</h1>
    <p class="md-lede">Speed tricks from the Vedic sutras, a full skill map from counting to calculus, games, daily quests and an Arena with leaderboards. Pick how you want to play. You can change it any time.</p>
    <div class="mode-pick">${Object.entries(fx.MODES).map(([id, m]) => `<button class="mode-card mode-card--${m.color}" data-mode="${id}"><span class="mode-ic" aria-hidden="true">${modeIcon(id)}</span><b>${m.name}</b><small>${m.ages}</small><span>${m.blurb}</span></button>`).join('')}</div>
    <p class="mq-note">Playing as <b>${esc(p.name)}</b>. Nicknames are made up for you, so no real names are ever needed.</p>
  </div></section>`;
  view.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { fx.sfx('level'); fx.setMode(b.dataset.mode); gm.startDay(); fx.confetti(60); location.hash = '#/'; render(); });
}
function modeIcon(id) {
  const P = 'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';
  return `<svg viewBox="0 0 32 32" width="40" height="40">${{ explorer: `<circle cx="16" cy="18" r="9" ${P}/><path d="M16 9V4M12 5l4-1 4 1M12.5 17h.01M19.5 17h.01M13 21c2 1.5 4 1.5 6 0" ${P}/>`, challenger: `<path d="M17 3L7 18h8l-1 11 11-16h-8z" ${P}/>`, pro: `<path d="M5 26L13 8l5 10 3-5 6 13z" ${P}/><circle cx="24" cy="7" r="2.5" ${P}/>` }[id]}</svg>`;
}

/* ---------- Home: one per mode ---------- */
function questsHTML() {
  const qs = gm.quests();
  return `<div class="md-card quest-card"><h2 class="mq-h3">Daily quests</h2><ul class="quests">${qs.map(q => `<li class="${q.done ? 'done' : ''}"><span class="q-check" aria-hidden="true">${q.done ? '&#10003;' : ''}</span><span class="q-t">${q.label}<span class="mq-bar"><i style="width:${pct(q.prog / q.goal)}%"></i></span></span><span class="q-n">${q.prog}/${q.goal}</span></li>`).join('')}</ul><p class="mq-small">Each quest is worth 25 bonus XP. New quests every day.</p></div>`;
}
function heroStats() {
  const p = store.player(), L = gm.levelInfo();
  return `<div class="me-strip">${avatar(p, 54)}<div class="me-strip-t"><small>${fx.t({ explorer: 'Hello,', challenger: 'Welcome back,', pro: 'Welcome back,' })}</small><b>${esc(p.name)}</b><span>Level ${L.lv} · ${gm.titleOf(L.lv)}</span><span class="mq-xpbar mq-xpbar--big" aria-label="${L.into} of ${L.need} XP to the next level"><i style="width:${pct(L.pct)}%"></i></span></div>
    <div class="me-nums"><div><b>${store.xp()}</b><small>XP</small></div><div><b>${store.streakDays()}</b><small>day streak</small></div><div><b>${Object.keys(store.badges()).length}</b><small>badges</small></div></div></div>`;
}
const tile = (href, title, sub, color, ic) => `<a class="play-tile play-tile--${color}" href="${href}"><span class="play-ic" aria-hidden="true">${icon(ic)}</span><b>${title}</b><small>${sub}</small></a>`;

function home() {
  const m = fx.mode(); document.title = `${BRAND} for Everyone · Madhav`;
  const last = store.lastSkill() && byId[store.lastSkill()];
  const cont = last ? `<a class="mq-continue" href="#/skill/${last.id}">${ring(store.mastery(last.id), 40)}<span><small>Keep going</small><b>${both(last.title, last.kid)}</b></span><span class="mq-go" aria-hidden="true">&rarr;</span></a>` : '';
  let body = '';
  if (m === 'explorer') {
    body = `<div class="play-grid play-grid--big">
      ${tile('#/game/balloons', 'Balloon pop', 'Count and pop', 'coral', 'balloon')}
      ${tile('#/skill/k-count', 'How many dots?', 'Count with ten frames', 'sun', 'dots')}
      ${tile('#/game/more-less', 'Which has more?', 'Big or small', 'teal', 'scale')}
      ${tile('#/game/make-ten', 'Make ten', 'Find the partners', 'sky', 'ten')}
      ${tile('#/skill/k-add10', 'Adding', 'Put together', 'plum', 'plus')}
      ${tile('#/game/quick-look', 'Quick look', 'Flash dots', 'sun', 'eye')}
      ${tile('#/skill/k-shapes', 'Shape detective', 'Name that shape', 'teal', 'shape')}
      ${tile('#/arena', 'Race the clock', 'Tap fast!', 'coral', 'bolt')}
    </div>
    <p class="mq-cta"><button class="md-btn" id="voiceBtn" aria-pressed="${fx.voiceOn()}">${icon('speaker')} Read questions aloud: ${fx.voiceOn() ? 'on' : 'off'}</button> <a class="md-btn" href="#/watch">${icon('play')} Watch and sing</a></p>`;
  } else if (m === 'challenger') {
    const belt = gm.currentBelt(), bp = gm.beltProgress(), next = bp.find(b => !b.earned), nextTrick = next && TRICKS.find(t => t.id === next.tricks.find(x => !store.mastered('v-' + x)));
    body = `<div class="home-2"><div class="md-card dojo-card"><span class="md-tag md-tag--plum">Dojo</span><h2 class="mq-h3">${belt ? `You hold the ${belt.name}` : 'Earn your white belt'}</h2>
      <div class="belts-mini">${bp.map(b => `<span class="belt-mini${b.earned ? ' on' : ''}" style="--belt:${b.color}" title="${b.name}"></span>`).join('')}</div>
      ${nextTrick ? `<p>Next trick: <b>${nextTrick.title}</b></p><a class="md-btn md-btn--primary" href="#/skill/v-${nextTrick.id}">Train this trick</a>` : '<p>All belts earned. Legend!</p>'} <a class="md-btn" href="#/dojo">Open the Dojo</a></div>
      ${questsHTML()}</div>
      <div class="play-grid">
        ${tile('#/arena', 'Daily Arena', '60 seconds, same questions for everyone', 'coral', 'trophy')}
        ${tile('#/duel', 'Duel a friend', 'Two players, one screen', 'sky', 'duel')}
        ${tile('#/games', 'Games', 'Times sprint, target, fractions', 'teal', 'game')}
        ${tile('#/learn', 'Skill map', 'Grades 3 to 8 and beyond', 'sun', 'map')}
        ${tile('#/sutras', 'Sutra cards', 'Collect all 29', 'plum', 'cards')}
        ${tile('#/watch', 'Watch and learn', 'Best trick videos', 'coral', 'play')}
      </div>`;
  } else {
    const collected = [...SUTRAS, ...SUBSUTRAS].filter(collectedCard).length;
    body = `<div class="home-2"><div class="md-card"><span class="md-tag md-tag--coral">Arena</span><h2 class="mq-h3">Today's leaderboard</h2><div id="homeBoard" class="lb-wrap"><p class="mq-small">Loading…</p></div><a class="md-btn md-btn--primary" href="#/arena">Play today's round</a></div>${questsHTML()}</div>
      <div class="play-grid">
        ${tile('#/dojo', 'Vedic Dojo', `${gm.beltProgress().filter(b => b.earned).length} of ${BELTS.length} belts`, 'plum', 'belt')}
        ${tile('#/sutras', 'Sutra deep dive', `${collected} of ${SUTRAS.length + SUBSUTRAS.length} cards collected`, 'sun', 'cards')}
        ${tile('#/learn', 'Skill map', 'Algebra, geometry, calculus', 'sky', 'map')}
        ${tile('#/duel', 'Duel', 'Head to head', 'coral', 'duel')}
        ${tile('#/games', 'Puzzles and games', 'Hit the target and more', 'teal', 'game')}
        ${tile('#/watch', 'Watch shelf', '3Blue1Brown, Numberphile, more', 'sky', 'play')}
      </div>`;
  }
  view.innerHTML = `<section class="md-section mq-tight"><div class="md-wrap">
    ${heroStats()}
    <h1 class="md-heading home-h">${fx.t({ explorer: 'What do you want to play?', challenger: 'Ready to get faster?', pro: 'Train your mental math' })}</h1>
    <p class="mode-line">Mode: <b>${fx.MODES[m].name}</b> <a href="#/me">Change</a></p>
    ${cont}${body}
  </div></section>`;
  const vb = $('#voiceBtn'); if (vb) vb.onclick = () => { fx.setVoice(!fx.voiceOn()); fx.speak('Hi! I will read the questions to you.', true); home(); };
  if (m === 'pro') loadBoard($('#homeBoard'), `daily-${cloud.dayId()}-pro`, 5);
}

/* ---------- Learn ---------- */
function learnView() {
  document.title = `Skill map: ${BRAND} · Madhav`;
  const m = fx.MODES[fx.mode()], mine = GRADES.filter(g => m.grades.map(String).includes(String(g.id))), rest = GRADES.filter(g => !mine.includes(g) && g.id !== 'V');
  const card = g => { const st = gradeStats(g.id); return `<a class="mq-grade" href="#/grade/${g.id}"><span class="mq-grade-n">${gradeShort(g.id)}</span><span class="mq-grade-t"><b>${both(g.pro, g.kid)}</b><small>${g.band}</small></span><span class="mq-bar" aria-label="${st.done} of ${st.total} mastered"><i style="width:${pct(st.done / (st.total || 1))}%"></i></span></a>`; };
  view.innerHTML = `<section class="md-section mq-tight"><div class="md-wrap">
    ${crumbs([null, 'Skill map'])}
    <span class="md-tag md-tag--sky">Skill map</span>
    <h1 class="md-heading">Pick a level</h1>
    <p class="md-lede">${SKILLS.length - TRICKS.length} skills from counting to calculus. Each has a picture-first lesson, endless practice and hints that teach the strategy. Fill every ring to level up.</p>
    <h2 class="mq-strand">Suggested for ${m.name}</h2><div class="mq-grades">${mine.map(card).join('')}</div>
    <h2 class="mq-strand">Speed tricks</h2><div class="mq-grades">${card(gradeOf('V'))}</div>
    <details class="mq-more"><summary>All other levels</summary><div class="mq-grades">${rest.map(card).join('')}</div></details>
  </div></section>`;
}

function gradeView(g) {
  const G = gradeOf(g); if (!G) return home();
  if (g !== 'V') store.setGrade(g);
  document.title = `${G.pro}: ${BRAND} · Madhav`;
  const list = skillsFor(g), st = gradeStats(g), strands = Object.keys(STRANDS).filter(k => list.some(s => s.strand === k));
  const idx = GRADES.findIndex(x => String(x.id) === String(g)), prev = GRADES[idx - 1], next = GRADES[idx + 1];
  view.innerHTML = `<section class="md-section mq-tight"><div class="md-wrap">
    ${crumbs(['#/learn', 'Skill map'], [null, gradeLabel(g)])}
    <span class="md-tag md-tag--sky">${G.band}</span>
    <h1 class="md-heading">${gradeLabel(g)}</h1>
    <p class="md-lede">${both(`${st.done} of ${st.total} skills mastered. A skill is mastered after at least 8 problems with a score of 85% or more, weighted toward recent answers.`, `You have ${st.done} of ${st.total} skills. Fill every ring!`)}</p>
    <div class="mq-gradebar"><span class="mq-bar mq-bar--big"><i style="width:${pct(st.done / (st.total || 1))}%"></i></span><a class="md-btn md-btn--primary md-btn--sm" href="#/run/${g}">${icon('bolt')} Endless run</a><a class="md-btn md-btn--sm" href="#/mix/${g}">Endless practice</a></div>
    <p class="mq-small">Every skill here makes new questions forever. Endless practice mixes them with hints; Endless run gives you 3 lives and counts how far you get.</p>
    <div class="mq-gradejump">${prev ? `<a class="md-chip" href="#/grade/${prev.id}">&larr; ${both(prev.pro, prev.kid)}</a>` : ''}${next ? `<a class="md-chip" href="#/grade/${next.id}">${both(next.pro, next.kid)} &rarr;</a>` : ''}</div>
    ${strands.map(sd => { const S = STRANDS[sd]; return `<h2 class="mq-strand"><span class="mq-dot" style="background:var(--${S.color})"></span>${both(S.pro, S.kid)}</h2>
      <div class="mq-skills">${list.filter(s => s.strand === sd).map(s => { const [cls, lab] = status(s.id); return `<a class="mq-skill mq-${cls}" href="#/skill/${s.id}">${ring(store.mastery(s.id))}<span class="mq-skill-t"><b>${both(s.title, s.kid)}</b><small>${lab}${s.trick ? ' · ' + esc(TRICKS.find(t => t.id === s.trick).sutra) : ''}</small></span></a>`; }).join('')}</div>`; }).join('')}
  </div></section>`;
}

/* ---------- Skill: lesson plus practice ---------- */
function skillView(id) {
  const s = byId[id]; if (!s) return home();
  document.title = `${s.title}: ${BRAND} · Madhav`;
  const S = STRANDS[s.strand], trick = s.trick && TRICKS.find(t => t.id === s.trick);
  const back = trick ? ['#/dojo', 'Dojo'] : ['#/grade/' + s.grade, gradeLabel(s.grade)];
  view.innerHTML = `<section class="md-section mq-tight"><div class="md-wrap">
    ${crumbs(back, [null, both(s.title, s.kid)])}
    <div class="mq-split">
      <article class="mq-lesson md-card">
        <span class="md-tag${S.color === 'sun' ? '' : ' md-tag--' + S.color}">${both(S.pro, S.kid)}</span>
        <h1 class="mq-h1">${both(s.title, s.kid)}</h1>
        ${trick ? `<p class="mq-sutra"><b lang="sa-Latn">${trick.sutra}</b><span>${trick.meaning}</span></p>` : ''}
        <p class="mq-idea">${s.idea}</p>
        <h2 class="mq-h3">How it works</h2>
        <ol class="mq-method">${(trick ? [trick.when] : s.method).map(m => `<li>${m}</li>`).join('')}</ol>
        ${trick ? animatorHTML(trick) : `<div class="mq-example" id="example"></div>`}
        ${videosFor(s, trick)}
      </article>
      <div class="mq-practice md-card" id="practice"></div>
    </div>
  </div></section>`;
  if (trick) mountAnimator(trick); else showExample(s);
  cleanup = practice($('#practice'), () => s, {});
}
/* Related videos: match trick or skill words against the Watch shelf tags */
function videosFor(s, trick) {
  const words = (trick ? `${trick.title} ${trick.sutra} vedic` : `${s.title} ${s.strand}`).toLowerCase();
  const keys = ['square', 'nikhilam', 'crosswise', 'multipl', 'times', '11', 'count', 'fraction', 'algebra', 'calculus', 'geometry', 'vedic', 'subtract', 'add'];
  const hits = RESOURCES.filter(r => r.type !== 'channel' && keys.some(k => words.includes(k) && (r.tags.join(' ') + ' ' + r.title).toLowerCase().includes(k))).slice(0, 3);
  if (!hits.length) return '';
  return `<h2 class="mq-h3">Watch it explained</h2><div class="rel-links">${hits.map(r => `<a href="${r.url}" target="_blank" rel="noopener noreferrer" data-watch>${icon(r.type === 'website' || r.type === 'game' ? 'link' : 'play')}<span>${esc(r.title)}</span></a>`).join('')}</div>`;
}

function showExample(s) {
  const box = $('#example'); const p = s.gen(1);
  box.innerHTML = `<h2 class="mq-h3">Watch me do one</h2><div class="mq-q${plain(p.q).length > 60 ? ' long' : ''}">${p.q}</div>${p.viz ? `<div class="mq-viz">${p.viz}</div>` : ''}<ol class="mq-steps">${p.steps.map(x => `<li>${x}</li>`).join('')}</ol>${answerText(p) ? `<p class="mq-ans">Answer: <b>${answerText(p)}</b></p>` : ''}<button class="md-btn md-btn--sm" id="another">Another example</button>`;
  $('#another', box).onclick = () => showExample(s);
}
function answerText(p) {
  if (p.kind === 'fields') return p.fields.map(f => `${f.label} = ${f.answer}`).join(', ');
  if (p.kind === 'set') return [...new Set(p.answer)].join(', ');
  if (p.kind === 'ineq') return `x ${{ '<': '&lt;', '>': '&gt;', '<=': '&le;', '>=': '&ge;' }[p.answer.op]} ${p.answer.val}`;
  if (p.kind === 'complex') return `${p.answer[0]} ${p.answer[1] < 0 ? '&minus;' : '+'} ${Math.abs(p.answer[1])}i`;
  if (p.kind === 'num') { const a = p.answer; if (Number.isInteger(a) || !p.simplest) return String(Math.round(a * 1e6) / 1e6).replace('-', '&minus;'); for (let d = 2; d < 5000; d++) { const n = Math.round(a * d); if (Math.abs(n / d - a) < 1e-9) return `${n}/${d}`.replace('-', '&minus;'); } }
  if (p.kind === 'expr') return esc(p.answer).replace(/sqrt\(([^)]+)\)/g, '&radic;$1').replace(/\*/g, '');
  return esc(p.answer);
}

/* ---------- Practice engine ---------- */
const KEYS = { basic: ['/', '-', '.'], alg: ['x', '^', '(', ')', '/', '-', '√', 'π'], set: [',', '-', '/', '√'], ineq: ['x', '<', '>', '<=', '>=', '-'], complex: ['i', '+', '-'] };
function practice(root, pickSkill, { mix = null, lives = 0, onOver = null } = {}) {
  let s, p, tries = 0, hints = 0, done = false, right = 0, total = 0, run = 0, life = lives;
  const explorer = fx.mode() === 'explorer';
  const next = () => {
    s = pickSkill(); p = s.gen(store.level(s.id)); tries = 0; hints = 0; done = false;
    // Explorer mode: no typing; small whole-number answers become big buttons
    if (explorer && p.kind === 'num' && Number.isInteger(p.answer) && p.answer >= 0 && p.answer <= 200) { const near = [...new Set([p.answer + 1, p.answer - 1, p.answer + 2, p.answer + 10, p.answer - 2].filter(v => v >= 0))]; p = { ...p, kind: 'choice', choices: [p.answer, ...shuffle(near).slice(0, 3)].sort((a, b) => a - b).map(String), answer: String(p.answer) }; }
    const keyset = p.kind === 'expr' ? KEYS.alg : p.kind === 'set' ? KEYS.set : p.kind === 'ineq' ? KEYS.ineq : p.kind === 'complex' ? KEYS.complex : p.kind === 'num' && !['K', 1, 2].includes(s.grade) ? KEYS.basic : null;
    root.innerHTML = `
      <div class="pr-head"><span class="pr-meter">${ring(store.mastery(s.id), 36)}<span><small>${mix ? `<a href="#/skill/${s.id}">${both(s.title, s.kid)}</a>` : 'Your turn'}</small><b id="prPct">${pct(store.mastery(s.id))}% mastery</b></span></span><span class="pr-run" id="prRun" aria-label="Streak">${run >= 2 ? `<b>${run}</b> in a row` : ''}</span>${lives ? `<span class="pr-lives" aria-label="${life} lives left">${'<i class="on"></i>'.repeat(life)}${'<i></i>'.repeat(lives - life)}</span>` : ''}<span class="pr-score" aria-label="Session score">${right}/${total}</span></div>
      <div class="pr-q${plain(p.q).length > 60 ? ' long' : ''}" id="prQ">${p.q}</div>
      ${p.viz ? `<div class="mq-viz">${p.viz}</div>` : ''}
      <form class="pr-form" id="prForm" autocomplete="off">${answerUI(p)}${keyset ? `<div class="pr-keys" aria-label="Symbol keys">${keyset.map(k => `<button type="button" class="pr-key" data-k="${esc(k)}">${esc(k)}</button>`).join('')}</div>` : ''}
        <div class="pr-actions"><button class="md-btn md-btn--primary" id="prCheck">Check</button><button type="button" class="md-btn md-btn--sm" id="prHint">Hint</button><button type="button" class="md-btn md-btn--sm" id="prShow">Show me</button>${'speechSynthesis' in window ? `<button type="button" class="md-btn md-btn--sm" id="prHear">${icon('speaker')} Hear it</button>` : ''}</div>
      </form>
      <div class="pr-say" id="prSay" role="status" aria-live="polite"></div>
      <div class="pr-sol" id="prSol" hidden></div>`;
    wire(); fx.speak(p.q);
    const first = root.querySelector('input, .pr-choice'); if (first && render.n > 1 && matchMedia('(pointer: fine)').matches) first.focus({ preventScroll: true });
  };
  const say = (html, tone = '') => { const b = $('#prSay', root); b.className = 'pr-say ' + tone; b.innerHTML = html ? `${BOLT}<div class="md-bubble">${html}</div>` : ''; };
  const reveal = () => { const sol = $('#prSol', root); sol.hidden = false; sol.innerHTML = `<h3>Here is how</h3><ol class="mq-steps">${p.steps.map(x => `<li>${x}</li>`).join('')}</ol><p class="mq-ans">Answer: <b>${answerText(p)}</b></p>`; };
  const finish = ok => {
    done = true; total++; if (ok) right++; run = ok && tries === 1 && !hints ? run + 1 : 0;
    const r = store.record(s.id, ok, hints > 0 || tries > 1);
    if (r.justMastered) track('mastered/' + s.id, 'Mastered: ' + s.title);
    if (run === 3 || run === 7 || (run && run % 10 === 0)) fx.confetti(40);
    $('#prPct', root).textContent = `${pct(store.mastery(s.id))}% mastery`; root.querySelector('.pr-meter .ring').outerHTML = ring(store.mastery(s.id), 36);
    root.querySelector('.pr-score').textContent = `${right}/${total}`; $('#prRun', root).innerHTML = run >= 2 ? `<b>${run}</b> in a row` : '';
    const btn = $('#prCheck', root); btn.textContent = 'Next'; btn.dataset.next = '1';
    root.querySelectorAll('#prHint, #prShow').forEach(b => (b.hidden = true));
    btn.focus({ preventScroll: true });
  };
  const PRAISE = { explorer: ['Yay! You got it!', 'Super star!', 'Woohoo! Correct!', 'You are so smart!'], challenger: ['Correct!', 'Nailed it!', 'Boom! First try.', 'Lightning fast!'], pro: ['Correct.', 'Exactly right.', 'Clean.', 'Correct, first try.'] };
  const wire = () => {
    $('#prForm', root).addEventListener('submit', e => {
      e.preventDefault();
      if ($('#prCheck', root).dataset.next) { fx.sfx('tap'); return next(); }
      const res = grade(); if (res.empty) { say('Type an answer first.'); return; }
      tries++;
      if (res.ok) { fx.sfx('ok'); const first = tries === 1 && !hints; const msg = first ? pick(PRAISE[fx.mode()] || PRAISE.challenger) : 'You got it!'; say(msg + (first ? ` <span class="pr-xp">+${10 + Math.min(store.skill(s.id).streak + 1, 5)} XP</span>` : ''), 'ok'); if (explorer) fx.speak(msg, true); finish(true); return; }
      fx.sfx('no');
      if (lives) { life--; reveal(); say(life ? `Oops! ${life} ${life === 1 ? 'life' : 'lives'} left. See how it works, then keep going.` : 'Out of lives!', 'no'); finish(false); root.querySelector('.pr-lives').innerHTML = '<i class="on"></i>'.repeat(life) + '<i></i>'.repeat(lives - life); if (!life && onOver) { const b = $('#prCheck', root); b.textContent = 'See my score'; b.onclick = e => { e.preventDefault(); onOver(right); }; } return; }
      if (tries === 1) { say((res.msg ? res.msg + ' ' : '') + 'Not quite. Try once more.' + (p.hints[0] && !hints ? ' <button type="button" class="linkbtn" data-hint>Want a hint?</button>' : ''), 'no'); if (explorer) fx.speak('Not quite. Try again!', true); }
      else if (tries === 2) { hints = Math.max(hints, 1); say((res.msg ? res.msg + ' ' : '') + `Hint: ${p.hints[Math.min(1, p.hints.length - 1)] || p.hints[0]}`, 'no'); if (explorer) fx.speak(p.hints[0], true); }
      else { reveal(); say('That one was tricky. See how it works, then try the next one.', 'no'); finish(false); }
    });
    root.addEventListener('click', e => {
      const k = e.target.closest('.pr-key'); if (k) { fx.sfx('tap'); const inp = root.querySelector('.ans-in:focus') || root.querySelector('.ans-in'); if (inp) { const v = k.dataset.k, a = inp.selectionStart ?? inp.value.length; inp.value = inp.value.slice(0, a) + v + inp.value.slice(inp.selectionEnd ?? a); inp.focus(); inp.setSelectionRange(a + v.length, a + v.length); } return; }
      if (e.target.closest('[data-hint]')) { e.preventDefault(); $('#prHint', root).click(); }
    });
    $('#prHint', root).onclick = () => { if (done) return; const h = p.hints[Math.min(hints, p.hints.length - 1)]; hints++; say(`Hint: ${h}`); if (explorer) fx.speak(h, true); };
    $('#prShow', root).onclick = () => { if (done) return; tries = Math.max(tries, 3); reveal(); say('Read the steps, then try the next one.'); finish(false); };
    const hear = $('#prHear', root); if (hear) hear.onclick = () => fx.speak(p.q, true);
    root.querySelectorAll('.pr-choice').forEach(b => b.onclick = () => { if (done) return; root.querySelectorAll('.pr-choice').forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); $('#prForm', root).requestSubmit(); });
  };
  const grade = () => {
    if (p.kind === 'choice') { const c = root.querySelector('.pr-choice[aria-pressed="true"]'); if (!c) return { empty: true }; return { ok: c.dataset.v === p.answer }; }
    if (p.kind === 'fields') { const ins = [...root.querySelectorAll('.ans-in')]; if (ins.some(i => !i.value.trim())) return { empty: true }; const rs = ins.map((i, k) => checkOne({ kind: 'num', answer: p.fields[k].answer, tol: p.tol }, i.value)); return { ok: rs.every(r => r.ok), msg: rs.find(r => r.msg)?.msg }; }
    return checkOne(p, root.querySelector('.ans-in').value);
  };
  next();
  return () => {};
}
function answerUI(p) {
  if (p.kind === 'choice') return `<div class="pr-choices" role="group" aria-label="Choices">${p.choices.map(c => `<button type="button" class="md-chip pr-choice" aria-pressed="false" data-v="${esc(c)}">${c}</button>`).join('')}</div>`;
  if (p.kind === 'fields') return `<div class="pr-fields">${p.fields.map(f => `<label>${f.label}<input class="ans-in" inputmode="text" spellcheck="false"></label>`).join('')}</div>`;
  const ph = { num: 'Your answer', expr: 'e.g. 3x^2 - 2x + 1', set: 'e.g. 2, -5', ineq: 'e.g. x < 4', complex: 'e.g. 3 + 2i', text: 'Your answer' }[p.kind] || 'Your answer';
  return `<div class="pr-in"><input class="ans-in" aria-label="Your answer" placeholder="${ph}" spellcheck="false" autocapitalize="off" inputmode="${p.kind === 'num' && Number.isInteger(p.answer) && p.answer >= 0 && !p.simplest ? 'numeric' : 'text'}">${p.unit ? `<span class="pr-unit">${p.unit}</span>` : ''}</div>`;
}

function mixView(g, isRun = false) {
  const G = gradeOf(g); if (!G) return home();
  document.title = `${isRun ? 'Endless run' : 'Endless practice'}, ${G.pro}: ${BRAND} · Madhav`;
  const list = skillsFor(g);
  view.innerHTML = `<section class="md-section mq-tight"><div class="md-wrap mq-narrow">
    ${crumbs(['#/grade/' + g, gradeLabel(g)], [null, isRun ? 'Endless run' : 'Endless practice'])}
    <h1 class="md-heading">${isRun ? 'Endless run' : 'Endless practice'}: ${gradeLabel(g)}</h1>
    <p class="md-lede">${isRun ? `Questions from every skill in this level, forever. You have 3 lives: how far can you go? Your best: <b>${store.best('run-' + g)}</b>.` : 'Questions from the whole level, all mixed up and never-ending, favoring skills in progress. Mixing topics is harder, and that is exactly why it makes learning stick.'}</p>
    <div class="mq-practice md-card" id="practice"></div></div></section>`;
  let lastId = null;
  cleanup = practice($('#practice'), () => {
    const going = list.filter(s => store.started(s.id) && !store.mastered(s.id)), pool = (going.length >= 2 && Math.random() < .7 ? going : list).filter(s => s.id !== lastId);
    const s = pick(pool.length ? pool : list); lastId = s.id; return s;
  }, { mix: true, lives: isRun ? 3 : 0, onOver: right => {
    store.bump('runs'); const isBest = store.setBest('run-' + g, right), xp = 10 + right * 3; store.addXP(xp, 'run'); if (isBest && right) fx.confetti(90);
    $('#practice').innerHTML = `<div class="ar-result"><div class="md-stat"><div class="md-kicker">You reached</div><div class="md-value">${right}</div><p>${isBest && right ? 'New best run!' : `Best: ${store.best('run-' + g)}`} <span class="fx-xp">+${xp} XP</span></p></div></div><p><button class="md-btn md-btn--primary" id="again">${icon('bolt')} Run again</button> <a class="md-btn" href="#/grade/${g}">Back to ${gradeLabel(g)}</a></p>`;
    $('#again').onclick = () => mixView(g, true);
  } });
}

/* ---------- Dojo: belts of speed tricks ---------- */
function dojoView() {
  document.title = `Vedic Dojo: ${BRAND} · Madhav`;
  const bp = gm.beltProgress(), earned = bp.filter(b => b.earned).length;
  view.innerHTML = `<section class="md-section mq-tight"><div class="md-wrap">
    ${crumbs([null, 'Dojo'])}
    <span class="md-tag md-tag--plum">Vedic Dojo</span>
    <h1 class="md-heading">From white belt to <span class="hl-word">black belt</span></h1>
    <p class="md-lede">${TRICKS.length} speed tricks from the Vedic sutras, in seven belts. Master all three tricks in a belt to earn it. Each trick has a step-by-step animator for any numbers you type, and its own practice track.</p>
    <div class="belt-row">${bp.map(b => `<span class="belt-chip${b.earned ? ' on' : ''}" style="--belt:${b.color}"><span class="belt-knot" aria-hidden="true"></span>${b.name}</span>`).join('')}</div>
    <p class="mq-small">${earned} of ${BELTS.length} belts earned.</p>
    <div class="dojo-path">${bp.map((b, i) => `<section class="dojo-belt${b.earned ? ' earned' : ''}">
      <h2 class="dojo-h"><span class="belt-swatch" style="--belt:${b.color}" aria-hidden="true"></span>${b.name}<small>${b.done}/3</small></h2>
      <div class="dojo-nodes">${b.tricks.map(id => { const t = TRICKS.find(x => x.id === id), sid = 'v-' + id, [cls, lab] = status(sid); return `<a class="dojo-node mq-${cls}" href="#/skill/${sid}">${ring(store.mastery(sid), 52)}<span><b>${t.title}</b><small lang="sa-Latn">${t.sutra}</small><em>${lab}</em></span></a>`; }).join('')}</div></section>`).join('')}</div>
    <p class="mq-cta"><a class="md-btn" href="#/sutras">Read about all 29 sutras</a> <a class="md-btn" href="#/arena">Test your speed in the Arena</a></p>
  </div></section>`;
}

/* ---------- Sutras: deep dive and card collection ---------- */
function collectedCard(c) { return c.tricks.some(t => store.mastered('v-' + t)) || store.seen('sutra:' + c.name); }
function sutrasView() {
  document.title = `The Vedic sutras: ${BRAND} · Madhav`;
  store.markSeen('sutras');
  const all = [...SUTRAS, ...SUBSUTRAS], got = all.filter(collectedCard).length;
  const card = (c, sub) => { const have = collectedCard(c); return `<button class="sutra-card${have ? ' got' : ''}" data-name="${esc(c.name)}" aria-expanded="false">
    <span class="sutra-face"><span class="sutra-n">${sub ? 'Sub-sutra' : 'Sutra'} ${c.n}</span><b lang="sa-Latn">${c.name}</b><i>${c.meaning}</i>${have ? '<span class="sutra-got">Collected</span>' : '<span class="sutra-tap">Tap to flip</span>'}</span>
    <span class="sutra-back"><span>${c.plain}</span>${c.example ? `<code>${c.example}</code>` : ''}${c.tricks.length ? `<span class="sutra-try">${c.tricks.map(t => { const tr = TRICKS.find(x => x.id === t); return tr ? `<a href="#/skill/v-${t}">Try: ${tr.title}</a>` : ''; }).join('')}</span>` : ''}</span></button>`; };
  view.innerHTML = `<section class="md-section mq-tight"><div class="md-wrap">
    ${crumbs([null, 'Sutras'])}
    <span class="md-tag md-tag--plum">Deep dive</span>
    <h1 class="md-heading">The 16 sutras and 13 sub-sutras</h1>
    <p class="md-lede">Each sutra is a short word formula that packs a whole method into a phrase. Flip a card to read it, master a linked trick to keep it for good. You have collected <b>${got} of ${all.length}</b>.</p>
    <div class="mq-bar mq-bar--big sutra-bar"><i style="width:${pct(got / all.length)}%"></i></div>
    <div class="md-card history"><h2 class="mq-h3">Where Vedic math comes from</h2>${HISTORY.map(h => `<p>${h}</p>`).join('')}
      <p class="mq-small">Read more: ${RESOURCES.filter(r => r.vedic && r.tags.includes('history')).map(r => `<a href="${r.url}" target="_blank" rel="noopener noreferrer" data-watch>${esc(r.title)}</a>`).join(' · ')}</p></div>
    <h2 class="mq-strand">The 16 sutras</h2><div class="sutra-grid">${SUTRAS.map(c => card(c, false)).join('')}</div>
    <h2 class="mq-strand">The 13 sub-sutras</h2><div class="sutra-grid">${SUBSUTRAS.map(c => card(c, true)).join('')}</div>
  </div></section>`;
  view.querySelectorAll('.sutra-card').forEach(b => b.onclick = e => { if (e.target.closest('a')) return; const open = b.classList.toggle('flipped'); b.setAttribute('aria-expanded', String(open)); fx.sfx('tap'); if (open && store.markSeen('sutra:' + b.dataset.name)) { store.addXP(5, 'sutra'); b.classList.add('got'); } });
}

/* ---------- Arena ---------- */
async function loadBoard(el, board, n = 10) {
  if (!el) return;
  const local = store.boardTop(board, n), me = store.player();
  const rows = (list, meTest) => list.length ? `<ol class="lb">${list.map((e, i) => `<li class="${meTest(e) ? 'me' : ''}"><span class="lb-rank r${i + 1}">${i + 1}</span>${avatar(e, 26)}<span class="lb-name">${esc(e.name)}</span><b>${e.score}</b></li>`).join('')}</ol>` : '<p class="mq-small">No scores yet. Be the first!</p>';
  el.innerHTML = `<div class="lb-tabs" role="tablist"><button role="tab" aria-selected="true" data-src="device">This device</button><button role="tab" aria-selected="false" data-src="world">World</button></div><div class="lb-body">${rows(local, e => e.pid === me.id)}</div>`;
  const body = $('.lb-body', el);
  el.querySelectorAll('[data-src]').forEach(b => b.onclick = async () => {
    el.querySelectorAll('[data-src]').forEach(x => x.setAttribute('aria-selected', String(x === b)));
    if (b.dataset.src === 'device') { body.innerHTML = rows(store.boardTop(board, n), e => e.pid === me.id); return; }
    if (!cloud.enabled()) { body.innerHTML = '<p class="mq-small">World leaderboards are coming soon. Until then, scores compete with everyone who plays on this device.</p>'; return; }
    body.innerHTML = '<p class="mq-small">Loading world scores…</p>';
    try { body.innerHTML = rows(await cloud.top(board, n), e => e.me); } catch (err) { body.innerHTML = '<p class="mq-small">World scores are not reachable right now.</p>'; }
  });
}
function arenaView() {
  document.title = `Arena: ${BRAND} · Madhav`;
  const league = fx.MODES[fx.mode()].league, day = cloud.dayId(), wk = cloud.weekId();
  let type = 'daily', stop = null;
  view.innerHTML = `<section class="md-section mq-tight"><div class="md-wrap mq-narrow">
    ${crumbs([null, 'Arena'])}
    <span class="md-tag md-tag--coral">Arena</span>
    <h1 class="md-heading">60 seconds. Same questions for everyone.</h1>
    <p class="md-lede">Answer as many as you can. Each right answer is worth 10, and every answer in a row adds a combo bonus. The daily round uses the same questions for every ${fx.MODES[fx.mode()].name}, so it is a fair race.</p>
    <div class="md-card ar-shell" id="arShell"></div></div></section>`;
  const shell = $('#arShell');
  const lobby = (result = '') => {
    shell.innerHTML = `${result}<div class="g-optrow" role="group" aria-label="Round type"><button class="md-chip" aria-pressed="${type === 'daily'}" data-t="daily">Daily challenge</button><button class="md-chip" aria-pressed="${type === 'practice'}" data-t="practice">Practice round</button></div>
      <p class="g-best">League: <b>${fx.MODES[fx.mode()].name}</b> · Your best today: <b>${store.best('arena-' + day)}</b></p>
      <button class="md-btn md-btn--primary ar-go" id="arGo">${icon('bolt')} Start</button>
      <div class="lb-cols"><div><h2 class="mq-h3">Today</h2><div id="lbDay" class="lb-wrap"></div></div><div><h2 class="mq-h3">This week</h2><div id="lbWeek" class="lb-wrap"></div></div></div>`;
    shell.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { type = b.dataset.t; lobby(result); });
    $('#arGo', shell).onclick = countdown;
    loadBoard($('#lbDay', shell), `daily-${day}-${league}`); loadBoard($('#lbWeek', shell), `week-${wk}-${league}`);
  };
  const countdown = () => {
    let n = 3; shell.innerHTML = `<div class="ar-count" aria-live="assertive">${n}</div>`; fx.sfx('tick');
    const iv = setInterval(() => { n--; if (n === 0) { clearInterval(iv); fx.sfx('ok'); start(); } else { shell.firstChild.textContent = n; fx.sfx('tick'); } }, 700);
    stop = () => clearInterval(iv);
  };
  const start = () => {
    track('arena/' + league + '/' + type, 'Arena round');
    stop = runArena(shell, { league, seed: type === 'daily' ? `daily-${day}-${league}` : null, onEnd: async r => {
      stop = null; store.bump('arena'); store.touchDay();
      if (r.score > store.count('arenaBest')) store.bump('arenaBest', r.score - store.count('arenaBest'));
      const xp = Math.round(r.score / 5); if (xp) store.addXP(xp, 'arena');
      let msg = '';
      if (type === 'daily') {
        const isBest = store.setBest('arena-' + day, r.score);
        store.boardAdd(`daily-${day}-${league}`, r.score); store.boardAdd(`week-${wk}-${league}`, r.score);
        if (store.markSeen('daily:' + day)) store.bump('dailyDays');
        if (isBest) { fx.confetti(100); msg = 'New personal best for today!'; }
        if (cloud.enabled()) { const p = store.player(); Promise.all([cloud.submit(`daily-${day}-${league}`, { ...p, score: r.score }), cloud.submit(`week-${wk}-${league}`, { ...p, score: r.score })]).catch(() => {}); }
      }
      lobby(`<div class="ar-result"><div class="md-stat"><div class="md-kicker">Score</div><div class="md-value">${r.score}</div><p>${r.right} right · ${r.wrong} missed · best combo ${r.bestCombo}x</p></div><p class="ar-msg">${msg || (type === 'practice' ? 'Practice rounds do not count for the leaderboard.' : 'Play again to beat your best.')} <span class="fx-xp">+${xp} XP</span></p></div>`);
    } });
  };
  lobby();
  cleanup = () => { if (stop) stop(); };
}
function duelView() {
  document.title = `Duel: ${BRAND} · Madhav`;
  const league = fx.MODES[fx.mode()].league; let stop = null, lg = league;
  view.innerHTML = `<section class="md-section mq-tight"><div class="md-wrap">
    ${crumbs([null, 'Duel'])}
    <span class="md-tag md-tag--sky">Duel</span>
    <h1 class="md-heading">Two players, one screen</h1>
    <p class="md-lede">Sit side by side (or face to face with a tablet flat on the table). First to 10 right answers wins. A wrong answer freezes you for a second, so speed and care both count.</p>
    <div class="md-card g-shell" id="dShell"></div></div></section>`;
  const shell = $('#dShell');
  const lobby = (res = '') => {
    shell.innerHTML = `${res}<div class="g-optrow" role="group" aria-label="Level">${Object.entries(fx.MODES).map(([id, m]) => `<button class="md-chip" aria-pressed="${id === lg}" data-l="${id}">${m.name}</button>`).join('')}</div><label class="duel-flip"><input type="checkbox" id="dFlip"> Face to face (flip the top player)</label><p><button class="md-btn md-btn--primary" id="dGo">${icon('duel')} Start the duel</button></p>`;
    shell.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { lg = b.dataset.l; lobby(res); });
    $('#dGo', shell).onclick = () => { const flip = $('#dFlip', shell).checked; store.bump('duels'); track('duel/' + lg, 'Duel'); shell.classList.toggle('duel-flipped', flip); stop = runDuel(shell, { league: lg, names: ['Player 1', 'Player 2'], onEnd: w => { stop = null; store.addXP(20, 'duel'); setTimeout(() => lobby(`<div class="ar-result"><div class="md-stat"><div class="md-kicker">Winner</div><div class="md-value">Player ${w + 1}</div><p>Great duel! Rematch?</p></div></div>`), 600); } }); };
  };
  lobby();
  cleanup = () => { if (stop) stop(); };
}

/* ---------- Games ---------- */
function gamesView() {
  document.title = `Games: ${BRAND} · Madhav`;
  const m = fx.mode(), mine = GAMES.filter(g => g.modes.includes(m)), rest = GAMES.filter(g => !g.modes.includes(m));
  const card = g => `<a class="md-card mq-game" href="#/game/${g.id}"><div class="md-icon-tile" style="background:color-mix(in srgb,var(--${g.color}) 18%,transparent);color:var(--${g.color}-strong)">${icon('game')}</div><h3>${both(g.title, g.kid)}</h3><p>${g.desc.split('. ')[0]}.</p><small class="mq-game-f">${store.seen('game:' + g.id) ? 'Played' : 'New'} · Best ${Math.max(0, ...Object.entries(store.load().best).filter(([k]) => k.startsWith(g.id)).map(([, v]) => v))}</small></a>`;
  view.innerHTML = `<section class="md-section mq-tight"><div class="md-wrap">
    ${crumbs([null, 'Games'])}
    <span class="md-tag md-tag--plum">Games</span>
    <h1 class="md-heading">Games that build number sense</h1>
    <p class="md-lede">Short rounds, big fun. Every game earns XP, and playing all of them unlocks a badge. Want a real race? Try the <a href="#/arena">Arena</a> or a <a href="#/duel">Duel</a>.</p>
    <h2 class="mq-strand">Picked for ${fx.MODES[m].name}</h2><div class="md-grid">${mine.map(card).join('')}</div>
    ${rest.length ? `<h2 class="mq-strand">More games</h2><div class="md-grid">${rest.map(card).join('')}</div>` : ''}
  </div></section>`;
}
function gameView(id) {
  const g = GAMES.find(x => x.id === id); if (!g) return gamesView();
  document.title = `${g.title}: ${BRAND} · Madhav`;
  let option = g.options ? g.options[0].value : null, stop = null, endless = false, live = 0;
  view.innerHTML = `<section class="md-section mq-tight"><div class="md-wrap mq-narrow">
    ${crumbs(['#/games', 'Games'], [null, both(g.title, g.kid)])}
    <h1 class="md-heading">${both(g.title, g.kid)}</h1><p class="md-lede">${g.desc}</p>
    <div class="md-card g-shell" id="gShell"></div></div></section>`;
  const shell = $('#gShell');
  const lobby = (msg = '') => {
    shell.innerHTML = `${msg}${g.options ? `<div class="g-optrow" role="group" aria-label="Level">${g.options.map(o => `<button class="md-chip" aria-pressed="${o.value === option}" data-o="${o.value}">${o.label}</button>`).join('')}</div>` : ''}<div class="g-optrow" role="group" aria-label="Length"><button class="md-chip" aria-pressed="${!endless}" data-e="0">Normal round</button><button class="md-chip" aria-pressed="${endless}" data-e="1">Endless: play as long as you like</button></div><p class="g-best">Your best: <b>${store.best(g.id + (option ?? '') + (endless ? '-endless' : ''))}</b></p><button class="md-btn md-btn--primary ar-go" id="gStart">${icon('play')} Play</button>`;
    shell.querySelectorAll('[data-e]').forEach(b => b.onclick = () => { endless = b.dataset.e === '1'; lobby(msg); });
    shell.querySelectorAll('[data-o]').forEach(b => b.onclick = () => { option = isNaN(+b.dataset.o) ? b.dataset.o : +b.dataset.o; lobby(msg); });
    $('#gStart', shell).onclick = start;
  };
  const start = () => {
    track('game/' + g.id, 'Game: ' + g.title); fx.sfx('tap');
    shell.innerHTML = `<div class="g-head"><span class="g-sayline" id="gSay" role="status" aria-live="polite"></span><button class="md-btn md-btn--sm" id="gQuit">Stop</button></div><div class="g-area" id="gArea"></div>`;
    const sayEl = $('#gSay', shell);
    live = 0;
    const finish = score => {
      if (stop) stop(); stop = null;
      store.markSeen('game:' + g.id); store.bump('gamesPlayed'); store.touchDay();
      const isBest = store.setBest(g.id + (option ?? '') + (endless ? '-endless' : ''), score), xp = 10 + Math.min(score, 100) * 2; store.addXP(xp, 'game');
      if (isBest && score) fx.confetti(80);
      lobby(`<div class="g-result"><div class="md-stat"><div class="md-kicker">Score</div><div class="md-value">${score}</div><p>${isBest && score ? 'New best score!' : 'Play again to beat your best.'} <span class="fx-xp">+${xp} XP</span></p></div></div>`);
    };
    stop = g.run($('#gArea', shell), { option, endless, progress: v => (live = v), say: m => (sayEl.innerHTML = m), end: finish });
    $('#gQuit', shell).innerHTML = endless ? 'Finish' : 'Stop';
    $('#gQuit', shell).onclick = () => { if (endless) return finish(live); if (stop) stop(); stop = null; lobby(); };
  };
  lobby();
  cleanup = () => { if (stop) stop(); };
}

/* ---------- Watch shelf ---------- */
function watchView() {
  document.title = `Watch and learn: ${BRAND} · Madhav`;
  const m = fx.mode() || 'challenger'; let filter = 'mine';
  const FILTERS = [['mine', `For ${fx.MODES[m].name}`], ['vedic', 'Vedic math'], ['short', 'Shorts'], ['video', 'Videos'], ['channel', 'Channels'], ['site', 'Sites and games'], ['all', 'Everything']];
  const match = r => filter === 'all' ? true : filter === 'mine' ? (r.mode === m || r.mode === 'all') : filter === 'vedic' ? r.vedic : filter === 'site' ? (r.type === 'website' || r.type === 'game') : filter === 'video' ? (r.type === 'video' || r.type === 'playlist') : r.type === filter;
  const draw = () => {
    const list = RESOURCES.filter(match);
    view.innerHTML = `<section class="md-section mq-tight"><div class="md-wrap">
      ${crumbs([null, 'Watch'])}
      <span class="md-tag md-tag--teal">Watch and learn</span>
      <h1 class="md-heading">The best math trick videos and sites</h1>
      <p class="md-lede">${RESOURCES.length} free picks from around the web, every link checked: songs for early counters, trick channels, Vedic math lessons, and deep visual math for teens and adults.</p>
      <div class="g-optrow" role="group" aria-label="Filter">${FILTERS.map(([id, l]) => `<button class="md-chip" aria-pressed="${id === filter}" data-f="${id}">${l}</button>`).join('')}</div>
      <p class="mq-note">Links open YouTube and other sites in a new tab. Grown-ups: YouTube suggests more videos after each one, so younger learners do best with you nearby.</p>
      <div class="watch-grid">${list.map(r => `<a class="watch-card" href="${r.url}" target="_blank" rel="noopener noreferrer" data-watch>
        <span class="watch-th${r.yt ? '' : ' watch-th--' + r.type}">${r.yt ? `<img src="https://i.ytimg.com/vi/${r.yt}/mqdefault.jpg" alt="" loading="lazy" width="320" height="180">` : icon(r.type === 'website' || r.type === 'game' ? 'link' : 'play')}<span class="watch-type">${{ channel: 'Channel', playlist: 'Playlist', video: 'Video', short: 'Short', website: 'Site', game: 'Game' }[r.type]}</span></span>
        <b>${esc(r.title)}</b><small>${esc(r.desc)}</small><span class="watch-tags">${r.vedic ? '<span class="tagv">Vedic</span>' : ''}${r.tags.slice(0, 2).map(t => `<span>${esc(t)}</span>`).join('')}</span></a>`).join('')}</div>
    </div></section>`;
    view.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { filter = b.dataset.f; fx.sfx('tap'); draw(); });
  };
  draw();
}
document.addEventListener('click', e => { const a = e.target.closest('a[data-watch]'); if (a) { store.bump('watched'); track('watch/' + a.hostname, 'Watch: ' + a.textContent.trim().slice(0, 60)); } });

/* ---------- Me: profile, badges, players, settings ---------- */
function meView() {
  document.title = `Me: ${BRAND} · Madhav`;
  const p = store.player(), L = gm.levelInfo(), got = store.badges(), done = SKILLS.filter(s => store.mastered(s.id)).length;
  view.innerHTML = `<section class="md-section mq-tight"><div class="md-wrap">
    ${crumbs([null, 'Me'])}
    <div class="me-head md-card">${avatar(p, 84)}<div><h1 class="mq-h1">${esc(p.name)}</h1><p>Level ${L.lv} · ${gm.titleOf(L.lv)} · ${store.xp()} XP</p><span class="mq-xpbar mq-xpbar--big"><i style="width:${pct(L.pct)}%"></i></span><p class="mq-small">${L.need - L.into} XP to level ${L.lv + 1}</p>
      <div class="me-acts"><button class="md-btn md-btn--sm" id="meName">New nickname</button>${store.AVATARS.map(c => `<button class="av-pick av av-${c}" data-c="${c}" aria-label="Color ${c}" aria-pressed="${c === p.avatar}"></button>`).join('')}</div></div></div>
    <div class="mq-stats me-stats"><div class="md-stat"><div class="md-kicker">Skills mastered</div><div class="md-value">${done}</div><p>of ${SKILLS.length}</p></div><div class="md-stat"><div class="md-kicker">Day streak</div><div class="md-value">${store.streakDays()}</div><p>days</p></div><div class="md-stat"><div class="md-kicker">Belts</div><div class="md-value">${gm.beltProgress().filter(b => b.earned).length}</div><p>of ${BELTS.length}</p></div></div>
    <h2 class="mq-strand">Badges <small class="mq-small">${Object.keys(got).length} of ${gm.BADGES.length}</small></h2>
    <div class="badge-grid">${gm.BADGES.map(b => `<div class="badge${got[b.id] ? ' got' : ''}"><span class="badge-medal" aria-hidden="true">${icon(got[b.id] ? 'star' : 'lock')}</span><b>${b.name}</b><small>${b.how}</small></div>`).join('')}</div>
    <h2 class="mq-strand">Play mode</h2>
    <div class="mode-pick mode-pick--sm">${Object.entries(fx.MODES).map(([id, m]) => `<button class="mode-card mode-card--${m.color}" data-mode="${id}" aria-pressed="${id === fx.mode()}"><span class="mode-ic" aria-hidden="true">${modeIcon(id)}</span><b>${m.name}</b><small>${m.ages}</small></button>`).join('')}</div>
    <h2 class="mq-strand">Players on this device</h2>
    <div class="players">${store.allPlayers().map(q => `<div class="player${q.id === p.id ? ' on' : ''}">${avatar(q, 40)}<span><b>${esc(q.name)}</b><small>${q.mode ? fx.MODES[q.mode].name : 'No mode yet'}</small></span>${q.id === p.id ? '<em>Playing</em>' : `<button class="md-btn md-btn--sm" data-switch="${q.id}">Switch</button><button class="md-btn md-btn--sm" data-del="${q.id}" aria-label="Remove ${esc(q.name)}">Remove</button>`}</div>`).join('')}
      <button class="md-btn md-btn--sm" id="meAdd">${icon('plus')} Add a player</button></div>
    <h2 class="mq-strand">Settings</h2>
    <div class="me-set"><label><input type="checkbox" id="setSound" ${fx.soundOn() ? 'checked' : ''}> Sound effects</label><label><input type="checkbox" id="setVoice" ${fx.voiceOn() ? 'checked' : ''}> Read questions aloud</label><label><input type="checkbox" id="setBg" ${bgOn() ? 'checked' : ''}> Moving background</label></div>
    <p class="mq-small">Calm music: use the note button at the top right of the menu bar (singing bowls, tanpura drone, Himalayan dawn, temple chimes).</p>
    <h2 class="mq-strand">Progress by level</h2>
    <div class="mq-prog">${GRADES.map(g => { const st = gradeStats(g.id); return `<a class="mq-prog-row" href="#/grade/${g.id}"><span class="mq-prog-g">${both(g.pro, g.kid)}</span><span class="mq-bar"><i style="width:${pct(st.avg)}%"></i></span><span class="mq-prog-n">${st.done}/${st.total}</span></a>`; }).join('')}</div>
    <h2 class="mq-strand">Backup</h2>
    <p class="mq-data"><button class="md-btn md-btn--sm" id="pExport">Copy backup code</button> <button class="md-btn md-btn--sm" id="pImport">Restore from code</button> <button class="md-btn md-btn--sm" id="pReset">Reset this player</button></p>
    <p class="pr-say" id="pMsg" role="status" aria-live="polite"></p>
    <p class="mq-note">Progress stays in this browser. Leaderboards only ever see your made-up nickname, color and score.</p>
  </div></section>`;
  const msg = t => ($('#pMsg').textContent = t);
  $('#meName').onclick = () => { store.updatePlayer({ name: store.makeName() }); fx.sfx('pop'); meView(); };
  view.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { store.updatePlayer({ avatar: b.dataset.c }); meView(); });
  view.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { fx.setMode(b.dataset.mode); gm.startDay(); fx.sfx('level'); meView(); });
  view.querySelectorAll('[data-switch]').forEach(b => b.onclick = () => { store.switchPlayer(b.dataset.switch); fx.applyMode(); fx.sfx('pop'); meView(); });
  view.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { if (confirm('Remove this player and their progress from this device?')) { store.removePlayer(b.dataset.del); meView(); } });
  $('#meAdd').onclick = () => { store.addPlayer(); fx.applyMode(); location.hash = '#/'; render(); };
  $('#setSound').onchange = e => { fx.setSound(e.target.checked); fx.sfx('ok'); };
  $('#setBg').onchange = e => { setBg(e.target.checked); const t = document.getElementById('vmBg'); if (t) t.checked = e.target.checked; };
  $('#setVoice').onchange = e => { fx.setVoice(e.target.checked); fx.speak('Read aloud is on.', e.target.checked); };
  $('#pExport').onclick = async () => { const code = btoa(unescape(encodeURIComponent(store.exportData()))); try { await navigator.clipboard.writeText(code); msg('Backup code copied. Paste it somewhere safe.'); } catch (e) { prompt('Copy this backup code:', code); } };
  $('#pImport').onclick = () => { const code = prompt('Paste your backup code:'); if (!code) return; try { store.importData(decodeURIComponent(escape(atob(code.trim())))); msg('Progress restored.'); meView(); } catch (e) { msg('That code did not work. Check that it was copied in full.'); } };
  $('#pReset').onclick = () => { if (confirm('Reset all progress for this player?')) { store.reset(); meView(); msg('Progress reset.'); } };
}

/* ---------- Trick animator ---------- */
function animatorHTML(t) {
  return `<div class="anim" id="anim"><h2 class="mq-h3">Watch it work</h2>
    <form class="anim-in" id="animForm">${t.inputs.map((f, i) => `<label>${f.label}<input type="number" inputmode="numeric" min="${f.min}" max="${f.max}" data-i="${i}"></label>`).join('')}
      <div class="anim-btns"><button class="md-btn md-btn--sm md-btn--primary">Show steps</button><button type="button" class="md-btn md-btn--sm" id="animRand">New numbers</button></div></form>
    <p class="anim-err" id="animErr" role="alert"></p>
    <div class="anim-board" id="animBoard" aria-live="polite"></div>
    <div class="anim-nav" id="animNav" hidden><button type="button" class="md-btn md-btn--sm" id="animPrev">Back</button><span id="animPos"></span><button type="button" class="md-btn md-btn--sm md-btn--primary" id="animNext">Next step</button><button type="button" class="md-btn md-btn--sm" id="animAll">Show all</button></div></div>`;
}
function mountAnimator(t) {
  const form = $('#animForm'), ins = [...form.querySelectorAll('input')], board = $('#animBoard'), nav = $('#animNav'), err = $('#animErr'); let steps = [], i = 0, counted = false;
  const fill = vals => ins.forEach((x, k) => (x.value = vals[k]));
  const show = (all = false) => { board.innerHTML = steps.slice(0, all ? steps.length : i + 1).map((s, k) => `<div class="anim-step${k === (all ? steps.length - 1 : i) ? ' cur' : ''}"><div class="anim-show">${s.show}</div><p>${s.say}</p></div>`).join(''); $('#animPos').textContent = `${all ? steps.length : i + 1} / ${steps.length}`; $('#animPrev').disabled = i === 0 && !all; $('#animNext').disabled = all || i === steps.length - 1;
    if ((all || i === steps.length - 1) && !counted) { counted = true; store.bump('tricksWatched'); if (store.markSeen('trick:' + t.id)) store.addXP(5, 'trick'); } };
  const run = (user = true) => { const vals = ins.map(x => Number(x.value)); if (ins.some(x => x.value === '') || vals.some(v => !Number.isFinite(v))) { err.textContent = 'Fill in every number.'; return; } const bad = t.valid(vals); err.textContent = bad || ''; if (bad) { board.innerHTML = ''; nav.hidden = true; return; } steps = t.steps(vals); i = 0; counted = !user; nav.hidden = false; show(); if (user) track('trick/' + t.id, 'Trick: ' + t.title); };
  form.onsubmit = e => { e.preventDefault(); fx.sfx('tap'); run(); };
  $('#animRand').onclick = () => { let v; do { v = t.random(); } while (t.valid(v)); fill(v); fx.sfx('pop'); run(); };
  $('#animPrev').onclick = () => { i = Math.max(0, i - 1); show(); };
  $('#animNext').onclick = () => { i = Math.min(steps.length - 1, i + 1); fx.sfx('tap'); show(); };
  $('#animAll').onclick = () => { i = steps.length - 1; show(true); };
  let v; do { v = t.random(); } while (t.valid(v)); fill(v); run(false);
}

/* ---------- Icons (24px line icons, currentColor) ---------- */
function icon(n) {
  const P = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const I = {
    blocks: `<rect x="3" y="3" width="4" height="18" rx="1" ${P}/><rect x="9" y="3" width="4" height="18" rx="1" ${P}/><rect x="15" y="15" width="6" height="6" rx="1" ${P}/>`,
    bolt: `<path d="M13 2L4 14h7l-1 8 9-12h-7z" ${P}/>`,
    game: `<rect x="2.5" y="7" width="19" height="11" rx="5" ${P}/><path d="M7 10.5v4M5 12.5h4" ${P}/><circle cx="15.5" cy="11.5" r="1.2" fill="currentColor"/><circle cx="18" cy="14" r="1.2" fill="currentColor"/>`,
    balloon: `<ellipse cx="12" cy="9" rx="6" ry="7" ${P}/><path d="M12 16l-1 2h2l-1-2M12 18c0 2-2 2-2 4" ${P}/>`,
    dots: `<circle cx="6" cy="6" r="2" fill="currentColor"/><circle cx="12" cy="6" r="2" fill="currentColor"/><circle cx="18" cy="6" r="2" fill="currentColor"/><circle cx="6" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><rect x="3" y="3" width="18" height="12" rx="2" ${P}/>`,
    scale: `<path d="M12 4v16M5 20h14M4 8h16M7 8l-3 6h6zM17 8l-3 6h6z" ${P}/>`,
    ten: `<rect x="3" y="7" width="18" height="10" rx="2" ${P}/><path d="M6.6 7v10M10.2 7v10M13.8 7v10M17.4 7v10M3 12h18" ${P}/>`,
    plus: `<path d="M12 5v14M5 12h14" ${P}/>`,
    eye: `<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" ${P}/><circle cx="12" cy="12" r="3" ${P}/>`,
    shape: `<circle cx="7" cy="8" r="4" ${P}/><rect x="13" y="4" width="8" height="8" rx="1" ${P}/><path d="M12 14l5 7H7z" ${P}/>`,
    trophy: `<path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8M9 18h6" ${P}/>`,
    duel: `<path d="M4 20l7-7M9 20H4v-5M20 20l-7-7M15 20h5v-5M8 4l4 4 4-4" ${P}/>`,
    map: `<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14" ${P}/>`,
    cards: `<rect x="3" y="6" width="12" height="15" rx="2" ${P}/><path d="M7 3h10a2 2 0 0 1 2 2v13" ${P}/>`,
    play: `<circle cx="12" cy="12" r="9" ${P}/><path d="M10 8.5l5 3.5-5 3.5z" ${P}/>`,
    link: `<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" ${P}/>`,
    belt: `<path d="M3 10h18v4H3z" ${P}/><path d="M10 9h4v6h-4zM11 15l-2 5M13 15l2 5" ${P}/>`,
    speaker: `<path d="M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" ${P}/>`,
    star: `<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" ${P}/>`,
    lock: `<rect x="5" y="11" width="14" height="10" rx="2" ${P}/><path d="M8 11V8a4 4 0 0 1 8 0v3" ${P}/>`
  };
  return `<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">${I[n] || ''}</svg>`;
}

/* ---------- Boot ---------- */
const rm = $('#resetMode'); if (rm) rm.onclick = () => { store.updatePlayer({ mode: null }); fx.applyMode(); location.hash = '#/'; render(); window.scrollTo({ top: 0 }); };
fx.applyMode();
gm.init();
render();
initAmbient();
