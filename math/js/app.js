/* Math Quest app: hash router and views (home, grade map, skill lesson and practice, mixed review, tricks, games, progress). */
import { SKILLS, byId, skillsFor, GRADES, STRANDS, gradeOf } from './skills/index.js';
import { TRICKS } from './vedic.js';
import { GAMES } from './games.js';
import { checkOne } from './check.js';
import { pick, shuffle } from './lib.js';
import * as store from './store.js';

const $ = (s, r = document) => r.querySelector(s);
const view = $('#view');
const both = (pro, kid) => (kid && kid !== pro ? `<span class="pro">${pro}</span><span class="kid">${kid}</span>` : pro);
const track = (name, title) => { try { window.siteTrack && window.siteTrack('math/' + name, title); } catch (e) {} };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const gradeLabel = g => { const x = gradeOf(g); return x ? both(x.pro, x.kid) : g; };
const gradeShort = g => (g === 'K' ? 'K' : g === 'V' ? 'Tricks' : g);
const pct = x => Math.round(x * 100);
const plain = h => String(h).replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ');
let cleanup = null;

/* Mastery ring as inline SVG */
const ring = (m, size = 44) => { const r = size / 2 - 4, c = 2 * Math.PI * r; return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-bg"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-fg" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - m)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>`; };
const status = id => (store.mastered(id) ? ['done', both('Mastered', 'Got it!')] : store.started(id) ? ['going', both('Practicing', 'Learning')] : ['new', both('New', 'New')]);
const gradeStats = g => { const list = skillsFor(g); const done = list.filter(s => store.mastered(s.id)).length; const avg = list.reduce((t, s) => t + store.mastery(s.id), 0) / (list.length || 1); return { done, total: list.length, avg }; };

const BOLT = `<svg class="bolt" viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="14" width="48" height="40" rx="14" fill="#1FA39A" stroke="#1C2541" stroke-width="3"/><circle cx="24" cy="34" r="7" fill="#fff"/><circle cx="40" cy="34" r="7" fill="#fff"/><circle cx="25" cy="35" r="3" fill="#1C2541"/><circle cx="41" cy="35" r="3" fill="#1C2541"/><path d="M32 14V9" stroke="#1C2541" stroke-width="3"/><circle cx="32" cy="7" r="5" fill="#FF6B5B" stroke="#1C2541" stroke-width="3"/></svg>`;

/* ---------- Router ---------- */
const routes = [
  [/^#?\/?$/, home],
  [/^#\/grade\/(\w+)$/, m => gradeView(m[1])],
  [/^#\/skill\/([\w-]+)$/, m => skillView(m[1])],
  [/^#\/mix\/(\w+)$/, m => mixView(m[1])],
  [/^#\/tricks$/, tricksView],
  [/^#\/games$/, gamesView],
  [/^#\/game\/([\w-]+)$/, m => gameView(m[1])],
  [/^#\/progress$/, progressView]
];
function render() {
  if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
  const h = location.hash || '#/';
  const hit = routes.find(([re]) => re.test(h));
  (hit ? hit[1](h.match(hit[0])) : home());
  document.querySelectorAll('.mq-nav a').forEach(a => a.setAttribute('aria-current', String(h === a.getAttribute('href') || (a.dataset.match && new RegExp(a.dataset.match).test(h)))));
  const head = view.querySelector('h1, h2'); if (head) { head.setAttribute('tabindex', '-1'); if (render.n++) head.focus({ preventScroll: true }); }
  if (render.n > 1) window.scrollTo({ top: 0 });
}
render.n = 0;
window.addEventListener('hashchange', render);

/* ---------- Home ---------- */
function home() {
  document.title = 'Math Quest: K to 12 math · Madhav';
  const last = store.lastSkill() && byId[store.lastSkill()];
  const totalDone = SKILLS.filter(s => store.mastered(s.id)).length;
  view.innerHTML = `
  <section class="md-section mq-hero">
    <div class="md-wrap">
      <span class="md-tag md-tag--plum">${both('Math Quest', 'Math Quest')}</span>
      <h1 class="md-heading">${both('Math from counting to <span class="hl-word">calculus</span>', 'From counting dots to <span class="hl-word">rocket math</span>')}</h1>
      <p class="md-lede">${both(`${SKILLS.length - TRICKS.length} skills from kindergarten to calculus, ${TRICKS.length} Vedic speed tricks and ${GAMES.length} strategy games. Every skill teaches with a picture first, then practice that never runs out, with hints that show the strategy rather than the answer.`, `Pick your grade, learn a trick, then practice as much as you like. Bolt gives hints when you get stuck.`)}</p>
      <div class="mq-stats">
        <div class="md-stat"><div class="md-kicker">${both('Skills mastered', 'Skills you got')}</div><div class="md-value">${totalDone}</div><p>${both(`of ${SKILLS.length}`, `out of ${SKILLS.length}`)}</p></div>
        <div class="md-stat"><div class="md-kicker">XP</div><div class="md-value">${store.xp()}</div><p>${both('10 per first-try answer', 'Points you earned')}</p></div>
        <div class="md-stat"><div class="md-kicker">${both('Day streak', 'Days in a row')}</div><div class="md-value">${store.streakDays()}</div><p>${both('Practice daily to keep it', 'Come back tomorrow!')}</p></div>
      </div>
      ${last ? `<a class="mq-continue" href="#/skill/${last.id}">${ring(store.mastery(last.id), 40)}<span><small>${both('Continue', 'Keep going')}</small><b>${both(last.title, last.kid)}</b></span><span class="mq-go" aria-hidden="true">&rarr;</span></a>` : ''}
    </div>
  </section>
  <section class="md-section md-band">
    <div class="md-wrap">
      <span class="md-tag md-tag--sky">${both('Skill map', 'Pick a level')}</span>
      <h2 class="md-heading">${both('Choose a grade', 'Where do you want to start?')}</h2>
      <p class="md-lede">${both('Each grade follows the usual US sequence (Common Core style). Start anywhere; the map shows what is mastered.', 'Start with your grade, or go back to warm up.')}</p>
      <div class="mq-grades">${GRADES.map(g => { const st = gradeStats(g.id); return `<a class="mq-grade" href="#/grade/${g.id}"><span class="mq-grade-n">${gradeShort(g.id)}</span><span class="mq-grade-t"><b>${both(g.pro, g.kid)}</b><small>${g.band}</small></span><span class="mq-bar" aria-label="${st.done} of ${st.total} mastered"><i style="width:${pct(st.done / (st.total || 1))}%"></i></span></a>`; }).join('')}</div>
    </div>
  </section>
  <section class="md-section">
    <div class="md-wrap">
      <span class="md-tag md-tag--teal">${both('How it teaches', 'How it works')}</span>
      <h2 class="md-heading">${both('Understanding first, then speed', 'See it, draw it, then do it fast')}</h2>
      <p class="md-lede">${both('The sequence many strong math programs share: build meaning with objects and pictures, teach strategies, then practice to fluency.', 'First you see it, then you understand it, then you get super fast.')}</p>
      <div class="md-grid mq-how">
        <article class="md-card"><div class="md-icon-tile" style="background:color-mix(in srgb,var(--sun) 18%,transparent);color:var(--sun-strong)">${icon('blocks')}</div><h3>${both('Concrete, pictorial, abstract', 'Blocks, pictures, numbers')}</h3><p>${both('Ten frames, base-ten blocks, number lines, area models and balances come before symbols.', 'You see the math with dots and blocks before you write it.')}</p></article>
        <article class="md-card"><div class="md-icon-tile" style="background:color-mix(in srgb,var(--coral) 18%,transparent);color:var(--coral-strong)">${icon('bond')}</div><h3>${both('Strategies over memorizing', 'Smart shortcuts')}</h3><p>${both('Make ten, break apart, doubles, count up. Hints teach the strategy, not just the answer.', 'Learn the trick behind every fact, like making ten.')}</p></article>
        <article class="md-card"><div class="md-icon-tile" style="background:color-mix(in srgb,var(--sky) 18%,transparent);color:var(--sky-strong)">${icon('loop')}</div><h3>${both('Practice that adapts', 'Never runs out')}</h3><p>${both('Problems are generated, get harder as mastery grows, and count half after a hint.', 'New questions every time. They get harder as you get better.')}</p></article>
        <article class="md-card"><div class="md-icon-tile" style="background:color-mix(in srgb,var(--plum) 18%,transparent);color:var(--plum-strong)">${icon('bolt')}</div><h3>${both('Vedic speed tricks', 'Speed tricks')}</h3><p>${both('Classic sutras, shown step by step: squares ending in 5, near-base products, crosswise.', 'Square 85 in your head in two seconds.')}</p></article>
      </div>
      <p class="mq-cta"><a class="md-btn md-btn--primary" href="#/grade/${store.savedGrade() || 3}">${both('Open the skill map', 'Start learning')}</a> <a class="md-btn" href="#/tricks">${both('Try a speed trick', 'Learn a speed trick')}</a> <a class="md-btn" href="#/games">${both('Play a game', 'Play a game')}</a></p>
    </div>
  </section>`;
}

/* ---------- Grade map ---------- */
function gradeView(g) {
  const G = gradeOf(g); if (!G) return home();
  if (g !== 'V') store.setGrade(g);
  document.title = `${G.pro}: Math Quest · Madhav`;
  const list = skillsFor(g), st = gradeStats(g), strands = Object.keys(STRANDS).filter(k => list.some(s => s.strand === k));
  const idx = GRADES.findIndex(x => String(x.id) === String(g)), prev = GRADES[idx - 1], next = GRADES[idx + 1];
  view.innerHTML = `
  <section class="md-section mq-tight">
    <div class="md-wrap">
      <nav class="mq-crumbs" aria-label="Breadcrumb"><a href="#/">${both('Math Quest', 'Home')}</a> <span aria-hidden="true">/</span> <span>${gradeLabel(g)}</span></nav>
      <span class="md-tag md-tag--sky">${G.band}</span>
      <h1 class="md-heading">${gradeLabel(g)}</h1>
      <p class="md-lede">${both(`${st.done} of ${st.total} skills mastered. A skill counts as mastered after at least 8 problems with a mastery score of 85% or more, weighted toward recent answers.`, `You have ${st.done} of ${st.total} skills. Fill every ring!`)}</p>
      <div class="mq-gradebar"><span class="mq-bar mq-bar--big"><i style="width:${pct(st.done / (st.total || 1))}%"></i></span>
        <a class="md-btn md-btn--primary md-btn--sm" href="#/mix/${g}">${both('Mixed review', 'Mix it up')}</a></div>
      <div class="mq-gradejump">${prev ? `<a class="md-chip" href="#/grade/${prev.id}">&larr; ${both(prev.pro, prev.kid)}</a>` : ''}${next ? `<a class="md-chip" href="#/grade/${next.id}">${both(next.pro, next.kid)} &rarr;</a>` : ''}</div>
      ${strands.map(sd => { const S = STRANDS[sd]; return `
        <h2 class="mq-strand"><span class="mq-dot" style="background:var(--${S.color})"></span>${both(S.pro, S.kid)}</h2>
        <div class="mq-skills">${list.filter(s => s.strand === sd).map(s => { const [cls, lab] = status(s.id); return `
          <a class="mq-skill mq-${cls}" href="#/skill/${s.id}">${ring(store.mastery(s.id))}<span class="mq-skill-t"><b>${both(s.title, s.kid)}</b><small>${lab}${s.trick ? ' · ' + esc(TRICKS.find(t => t.id === s.trick).sutra) : ''}</small></span></a>`; }).join('')}</div>`; }).join('')}
    </div>
  </section>`;
}

/* ---------- Skill: lesson plus practice ---------- */
function skillView(id) {
  const s = byId[id]; if (!s) return home();
  document.title = `${s.title}: Math Quest · Madhav`;
  const S = STRANDS[s.strand], trick = s.trick && TRICKS.find(t => t.id === s.trick);
  view.innerHTML = `
  <section class="md-section mq-tight">
    <div class="md-wrap">
      <nav class="mq-crumbs" aria-label="Breadcrumb"><a href="#/">${both('Math Quest', 'Home')}</a> <span aria-hidden="true">/</span> <a href="#/grade/${s.grade}">${gradeLabel(s.grade)}</a> <span aria-hidden="true">/</span> <span>${both(s.title, s.kid)}</span></nav>
      <div class="mq-split">
        <article class="mq-lesson md-card">
          <span class="md-tag${S.color === 'sun' ? '' : ' md-tag--' + S.color}">${both(S.pro, S.kid)}</span>
          <h1 class="mq-h1">${both(s.title, s.kid)}</h1>
          ${trick ? `<p class="mq-sutra"><b lang="sa-Latn">${trick.sutra}</b><span>${trick.meaning}</span></p>` : ''}
          <p class="mq-idea">${s.idea}</p>
          <h2 class="mq-h3">${both('How to do it', 'How it works')}</h2>
          <ol class="mq-method">${(trick ? [trick.when] : s.method).map(m => `<li>${m}</li>`).join('')}</ol>
          ${trick ? animatorHTML(trick) : `<div class="mq-example" id="example"></div>`}
        </article>
        <div class="mq-practice md-card" id="practice"></div>
      </div>
    </div>
  </section>`;
  if (trick) mountAnimator(trick); else showExample(s);
  cleanup = practice($('#practice'), () => s, { single: s });
}

function showExample(s) {
  const box = $('#example'); const p = s.gen(1);
  box.innerHTML = `<h2 class="mq-h3">${both('Worked example', 'Watch me do one')}</h2><div class="mq-q${plain(p.q).length > 60 ? ' long' : ''}">${p.q}</div>${p.viz ? `<div class="mq-viz">${p.viz}</div>` : ''}<ol class="mq-steps">${p.steps.map(x => `<li>${x}</li>`).join('')}</ol>${answerText(p) ? `<p class="mq-ans">${both('Answer', 'Answer')}: <b>${answerText(p)}</b></p>` : ''}<button class="md-btn md-btn--sm" id="another">${both('Another example', 'Show me another')}</button>`;
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
function practice(root, pickSkill, { single = null, mix = null } = {}) {
  let s, p, tries = 0, hints = 0, done = false, sessionRight = 0, sessionTotal = 0;
  const next = () => {
    s = pickSkill(); p = s.gen(store.level(s.id)); tries = 0; hints = 0; done = false;
    const keyset = p.kind === 'expr' ? KEYS.alg : p.kind === 'set' ? KEYS.set : p.kind === 'ineq' ? KEYS.ineq : p.kind === 'complex' ? KEYS.complex : p.kind === 'num' && !['K', 1, 2].includes(s.grade) ? KEYS.basic : null;
    root.innerHTML = `
      <div class="pr-head"><span class="pr-meter">${ring(store.mastery(s.id), 36)}<span><small>${mix ? `<a href="#/skill/${s.id}">${both(s.title, s.kid)}</a>` : both('Practice', 'Your turn')}</small><b id="prPct">${pct(store.mastery(s.id))}% ${both('mastery', 'there')}</b></span></span><span class="pr-score" aria-label="Session score">${sessionRight}/${sessionTotal}</span></div>
      <div class="pr-q${plain(p.q).length > 60 ? ' long' : ''}" id="prQ">${p.q}</div>
      ${p.viz ? `<div class="mq-viz">${p.viz}</div>` : ''}
      <form class="pr-form" id="prForm" autocomplete="off">${answerUI(p)}${keyset ? `<div class="pr-keys" aria-label="Symbol keys">${keyset.map(k => `<button type="button" class="pr-key" data-k="${esc(k)}">${esc(k)}</button>`).join('')}</div>` : ''}
        <div class="pr-actions"><button class="md-btn md-btn--primary" id="prCheck">${both('Check', 'Check it')}</button><button type="button" class="md-btn md-btn--sm" id="prHint">${both('Hint', 'Hint please')}</button><button type="button" class="md-btn md-btn--sm" id="prShow">${both('Show me', 'Show me how')}</button></div>
      </form>
      <div class="pr-say" id="prSay" role="status" aria-live="polite"></div>
      <div class="pr-sol" id="prSol" hidden></div>`;
    wire();
    const first = root.querySelector('input, .pr-choice'); if (first && render.n > 1) first.focus({ preventScroll: true });
  };
  const say = (html, tone = '') => { const b = $('#prSay', root); b.className = 'pr-say ' + tone; b.innerHTML = html ? `${BOLT}<div class="md-bubble">${html}</div>` : ''; };
  const reveal = () => { const sol = $('#prSol', root); sol.hidden = false; sol.innerHTML = `<h3>${both('How to solve it', 'Here is how')}</h3><ol class="mq-steps">${p.steps.map(x => `<li>${x}</li>`).join('')}</ol><p class="mq-ans">${both('Answer', 'Answer')}: <b>${answerText(p)}</b></p>`; };
  const finish = (ok) => {
    done = true; sessionTotal++; if (ok) sessionRight++;
    const r = store.record(s.id, ok, hints > 0 || tries > 1);
    if (r.justMastered) track('mastered/' + s.id, 'Mastered: ' + s.title);
    $('#prPct', root).innerHTML = `${pct(store.mastery(s.id))}% ${both('mastery', 'there')}`; root.querySelector('.pr-meter .ring').outerHTML = ring(store.mastery(s.id), 36);
    root.querySelector('.pr-score').textContent = `${sessionRight}/${sessionTotal}`;
    const btn = $('#prCheck', root); btn.innerHTML = both('Next problem', 'Next one'); btn.dataset.next = '1';
    root.querySelectorAll('#prHint, #prShow').forEach(b => (b.hidden = true));
    if (r.justMastered) say(both(`Skill mastered: ${s.title}. On to the next one?`, `You mastered ${s.kid || s.title}! Amazing!`), 'win');
    btn.focus({ preventScroll: true });
  };
  const wire = () => {
    const form = $('#prForm', root);
    form.addEventListener('submit', e => {
      e.preventDefault();
      if ($('#prCheck', root).dataset.next) return next();
      const res = grade(); if (res.empty) { say(both('Type an answer first.', 'Type your answer first!')); return; }
      tries++;
      if (res.ok) { say(pick(tries === 1 && !hints ? [both('Correct.', 'Yes! You got it!'), both('Exactly right.', 'Boom! Correct!'), both('Correct, first try.', 'Super! First try!')] : [both('Correct.', 'You got it!')]) + (tries === 1 && !hints ? ` <span class="pr-xp">+${10 + Math.min(store.skill(s.id).streak + 1, 5)} XP</span>` : ''), 'ok'); finish(true); return; }
      if (tries === 1) say((res.msg ? res.msg + ' ' : '') + both('Not yet. Try once more.', 'Not quite. Try again!') + (p.hints[0] && !hints ? ` <button type="button" class="linkbtn" data-hint>${both('Want a hint?', 'Need a hint?')}</button>` : ''), 'no');
      else if (tries === 2) { hints = Math.max(hints, 1); say((res.msg ? res.msg + ' ' : '') + `${both('Hint', 'Hint')}: ${p.hints[Math.min(1, p.hints.length - 1)] || p.hints[0]}`, 'no'); }
      else { reveal(); say(both('Here is the full method. The next one will be similar.', 'That one was tricky. See how it works, then try the next one.'), 'no'); finish(false); }
    });
    root.addEventListener('click', e => {
      const k = e.target.closest('.pr-key'); if (k) { const inp = root.querySelector('.ans-in:focus') || root.querySelector('.ans-in'); if (inp) { const v = k.dataset.k, a = inp.selectionStart ?? inp.value.length; inp.value = inp.value.slice(0, a) + v + inp.value.slice(inp.selectionEnd ?? a); inp.focus(); inp.setSelectionRange(a + v.length, a + v.length); } return; }
      if (e.target.closest('[data-hint]')) { e.preventDefault(); $('#prHint', root).click(); }
    });
    $('#prHint', root).onclick = () => { if (done) return; const h = p.hints[Math.min(hints, p.hints.length - 1)]; hints++; say(`${both('Hint', 'Hint')}: ${h}`); };
    $('#prShow', root).onclick = () => { if (done) return; tries = Math.max(tries, 3); reveal(); say(both('Read the steps, then try the next one.', 'Now you know how. Try the next one!')); finish(false); };
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

/* ---------- Mixed review ---------- */
function mixView(g) {
  const G = gradeOf(g); if (!G) return home();
  document.title = `Mixed review, ${G.pro}: Math Quest · Madhav`;
  const list = skillsFor(g);
  view.innerHTML = `<section class="md-section mq-tight"><div class="md-wrap mq-narrow">
    <nav class="mq-crumbs" aria-label="Breadcrumb"><a href="#/">${both('Math Quest', 'Home')}</a> <span aria-hidden="true">/</span> <a href="#/grade/${g}">${gradeLabel(g)}</a> <span aria-hidden="true">/</span> <span>${both('Mixed review', 'Mix it up')}</span></nav>
    <h1 class="md-heading">${both('Mixed review', 'Mix it up')}: ${gradeLabel(g)}</h1>
    <p class="md-lede">${both('Questions rotate across the grade, favoring skills in progress. Mixing topics is harder than blocked practice and makes learning stick.', 'Questions from the whole grade, all mixed up. Can you spot which trick each one needs?')}</p>
    <div class="mq-practice md-card" id="practice"></div></div></section>`;
  let lastId = null;
  cleanup = practice($('#practice'), () => {
    const going = list.filter(s => store.started(s.id) && !store.mastered(s.id)), pool = (going.length >= 2 && Math.random() < .7 ? going : list).filter(s => s.id !== lastId);
    const s = pick(pool.length ? pool : list); lastId = s.id; return s;
  }, { mix: true });
}

/* ---------- Tricks ---------- */
function tricksView() {
  document.title = 'Vedic speed tricks: Math Quest · Madhav';
  view.innerHTML = `<section class="md-section mq-tight"><div class="md-wrap">
    <span class="md-tag md-tag--plum">${both('Vedic mathematics', 'Speed tricks')}</span>
    <h1 class="md-heading">${both('Mental math with the Vedic sutras', 'Do big math in your head')}</h1>
    <p class="md-lede">${both('Vedic mathematics packs arithmetic and algebra patterns into short Sanskrit sutras. Each trick below has a step-by-step animator for any numbers you type and its own practice track.', 'Each trick turns a hard problem into a few easy steps. Type your own numbers and watch it work.')}</p>
    <div class="mq-tricks">${TRICKS.map(t => { const id = 'v-' + t.id, [cls, lab] = status(id); return `<a class="mq-trick md-card" href="#/skill/${id}"><span class="mq-trick-s" lang="sa-Latn">${t.sutra}</span><b>${both(t.title, t.kid)}</b><small>${t.meaning}</small><span class="mq-trick-f">${ring(store.mastery(id), 30)}<span class="mq-${cls}">${lab}</span><span>${both('From grade', 'Grade')} ${t.grade}</span></span></a>`; }).join('')}</div>
  </div></section>`;
}
function animatorHTML(t) {
  return `<div class="anim" id="anim"><h2 class="mq-h3">${both('Watch it work', 'Watch it work')}</h2>
    <form class="anim-in" id="animForm">${t.inputs.map((f, i) => `<label>${f.label}<input type="number" inputmode="numeric" min="${f.min}" max="${f.max}" data-i="${i}"></label>`).join('')}
      <div class="anim-btns"><button class="md-btn md-btn--sm md-btn--primary">${both('Show steps', 'Go!')}</button><button type="button" class="md-btn md-btn--sm" id="animRand">${both('New numbers', 'Surprise me')}</button></div></form>
    <p class="anim-err" id="animErr" role="alert"></p>
    <div class="anim-board" id="animBoard" aria-live="polite"></div>
    <div class="anim-nav" id="animNav" hidden><button type="button" class="md-btn md-btn--sm" id="animPrev">${both('Back', 'Back')}</button><span id="animPos"></span><button type="button" class="md-btn md-btn--sm md-btn--primary" id="animNext">${both('Next step', 'Next')}</button><button type="button" class="md-btn md-btn--sm" id="animAll">${both('Show all', 'Show all')}</button></div></div>`;
}
function mountAnimator(t) {
  const form = $('#animForm'), ins = [...form.querySelectorAll('input')], board = $('#animBoard'), nav = $('#animNav'), err = $('#animErr'); let steps = [], i = 0;
  const fill = vals => ins.forEach((x, k) => (x.value = vals[k]));
  const show = (all = false) => { board.innerHTML = steps.slice(0, all ? steps.length : i + 1).map((s, k) => `<div class="anim-step${k === (all ? steps.length - 1 : i) ? ' cur' : ''}"><div class="anim-show">${s.show}</div><p>${s.say}</p></div>`).join(''); $('#animPos').textContent = `${all ? steps.length : i + 1} / ${steps.length}`; $('#animPrev').disabled = i === 0 && !all; $('#animNext').disabled = all || i === steps.length - 1; };
  const run = () => { const vals = ins.map(x => Number(x.value)); if (vals.some(v => !Number.isFinite(v) || String(v) === '')) { err.textContent = 'Fill in every number.'; return; } const bad = t.valid(vals); err.textContent = bad || ''; if (bad) { board.innerHTML = ''; nav.hidden = true; return; } steps = t.steps(vals); i = 0; nav.hidden = false; show(); track('trick/' + t.id, 'Trick: ' + t.title); };
  form.onsubmit = e => { e.preventDefault(); run(); };
  $('#animRand').onclick = () => { fill(t.random()); run(); };
  $('#animPrev').onclick = () => { i = Math.max(0, i - 1); show(); };
  $('#animNext').onclick = () => { i = Math.min(steps.length - 1, i + 1); show(); };
  $('#animAll').onclick = () => { i = steps.length - 1; show(true); };
  fill(t.random()); run();
}

/* ---------- Games ---------- */
function gamesView() {
  document.title = 'Math games: Math Quest · Madhav';
  view.innerHTML = `<section class="md-section mq-tight"><div class="md-wrap">
    <span class="md-tag md-tag--plum">${both('Strategy games', 'Games')}</span>
    <h1 class="md-heading">${both('Games that build number sense', 'Math games')}</h1>
    <p class="md-lede">${both('Short rounds for fluency: partners of ten, quick dot images, number bonds, facts, puzzles, fractions and estimation. Best scores are saved in this browser.', 'Quick games to make your brain faster. Can you beat your best score?')}</p>
    <div class="md-grid">${GAMES.map(g => `<a class="md-card mq-game" href="#/game/${g.id}"><div class="md-icon-tile" style="background:color-mix(in srgb,var(--${g.color}) 18%,transparent);color:var(--${g.color}-strong)">${icon('game')}</div><h3>${both(g.title, g.kid)}</h3><p>${g.desc.split('. ')[0]}.</p><small class="mq-game-f">${both('Grades', 'Grades')} ${g.grades} · ${both('Best', 'Best')} ${store.best(g.id)}</small></a>`).join('')}</div>
  </div></section>`;
}
function gameView(id) {
  const g = GAMES.find(x => x.id === id); if (!g) return gamesView();
  document.title = `${g.title}: Math Quest · Madhav`;
  let option = g.options ? g.options[0].value : null, stop = null;
  view.innerHTML = `<section class="md-section mq-tight"><div class="md-wrap mq-narrow">
    <nav class="mq-crumbs" aria-label="Breadcrumb"><a href="#/">${both('Math Quest', 'Home')}</a> <span aria-hidden="true">/</span> <a href="#/games">${both('Games', 'Games')}</a> <span aria-hidden="true">/</span> <span>${both(g.title, g.kid)}</span></nav>
    <h1 class="md-heading">${both(g.title, g.kid)}</h1><p class="md-lede">${g.desc}</p>
    <div class="md-card g-shell" id="gShell"></div></div></section>`;
  const shell = $('#gShell');
  const lobby = (msg = '') => {
    shell.innerHTML = `${msg}${g.options ? `<div class="g-optrow" role="group" aria-label="Level">${g.options.map(o => `<button class="md-chip" aria-pressed="${o.value === option}" data-o="${o.value}">${o.label}</button>`).join('')}</div>` : ''}<p class="g-best">${both('Best score', 'Your best')}: <b>${store.best(g.id + (option ?? ''))}</b></p><button class="md-btn md-btn--primary" id="gStart">${both('Start', 'Play!')}</button>`;
    shell.querySelectorAll('[data-o]').forEach(b => b.onclick = () => { option = isNaN(+b.dataset.o) ? b.dataset.o : +b.dataset.o; lobby(msg); });
    $('#gStart', shell).onclick = start; $('#gStart', shell).focus({ preventScroll: true });
  };
  const start = () => {
    track('game/' + g.id, 'Game: ' + g.title);
    shell.innerHTML = `<div class="g-head"><span class="g-sayline" id="gSay" role="status" aria-live="polite"></span><button class="md-btn md-btn--sm" id="gQuit">${both('Stop', 'Stop')}</button></div><div class="g-area" id="gArea"></div>`;
    const sayEl = $('#gSay', shell);
    stop = g.run($('#gArea', shell), { option, say: m => (sayEl.innerHTML = m), end: score => { if (stop) stop(); stop = null; const isBest = store.setBest(g.id + (option ?? ''), score); lobby(`<div class="g-result"><div class="md-stat"><div class="md-kicker">${both('Score', 'You scored')}</div><div class="md-value">${score}</div><p>${isBest ? both('New best score.', 'New best! Woohoo!') : both('Play again to beat your best.', 'Try again to beat it!')}</p></div></div>`); } });
    $('#gQuit', shell).onclick = () => { if (stop) stop(); stop = null; lobby(); };
    const f = shell.querySelector('#gArea button, #gArea input'); if (f) f.focus({ preventScroll: true });
  };
  lobby();
  cleanup = () => { if (stop) stop(); };
}

/* ---------- Progress ---------- */
function progressView() {
  document.title = 'Progress: Math Quest · Madhav';
  const done = SKILLS.filter(s => store.mastered(s.id));
  view.innerHTML = `<section class="md-section mq-tight"><div class="md-wrap">
    <span class="md-tag md-tag--teal">${both('Progress', 'My progress')}</span>
    <h1 class="md-heading">${both('Progress across K to 12', 'Look how far you have come')}</h1>
    <p class="md-lede">${both('Saved only in this browser. Nothing is sent anywhere. Export a backup to move it to another device.', 'Your progress stays on this device.')}</p>
    <div class="mq-stats"><div class="md-stat"><div class="md-kicker">${both('Mastered', 'Got it')}</div><div class="md-value">${done.length}</div><p>${both('skills', 'skills')}</p></div><div class="md-stat"><div class="md-kicker">XP</div><div class="md-value">${store.xp()}</div><p>${both('total', 'points')}</p></div><div class="md-stat"><div class="md-kicker">${both('Day streak', 'Days in a row')}</div><div class="md-value">${store.streakDays()}</div><p>${both('days', 'days')}</p></div></div>
    <div class="mq-prog">${GRADES.map(g => { const st = gradeStats(g.id); return `<a class="mq-prog-row" href="#/grade/${g.id}"><span class="mq-prog-g">${both(g.pro, g.kid)}</span><span class="mq-bar"><i style="width:${pct(st.avg)}%"></i></span><span class="mq-prog-n">${st.done}/${st.total}</span></a>`; }).join('')}</div>
    <h2 class="mq-strand">${both('Backup', 'Save your progress')}</h2>
    <p class="mq-data"><button class="md-btn md-btn--sm" id="pExport">${both('Copy backup code', 'Copy save code')}</button> <button class="md-btn md-btn--sm" id="pImport">${both('Restore from code', 'Load save code')}</button> <button class="md-btn md-btn--sm" id="pReset">${both('Reset progress', 'Start over')}</button></p>
    <p class="pr-say" id="pMsg" role="status" aria-live="polite"></p>
  </div></section>`;
  const msg = t => ($('#pMsg').textContent = t);
  $('#pExport').onclick = async () => { const code = btoa(unescape(encodeURIComponent(store.exportData()))); try { await navigator.clipboard.writeText(code); msg('Backup code copied. Paste it somewhere safe.'); } catch (e) { prompt('Copy this backup code:', code); } };
  $('#pImport').onclick = () => { const code = prompt('Paste your backup code:'); if (!code) return; try { store.importData(decodeURIComponent(escape(atob(code.trim())))); msg('Progress restored.'); progressView(); } catch (e) { msg('That code did not work. Check that it was copied in full.'); } };
  $('#pReset').onclick = () => { if (confirm('Reset all Math Quest progress in this browser?')) { store.reset(); progressView(); msg('Progress reset.'); } };
}

/* ---------- Icons (24px line icons, currentColor) ---------- */
function icon(n) {
  const P = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const I = {
    blocks: `<rect x="3" y="3" width="4" height="18" rx="1" ${P}/><rect x="9" y="3" width="4" height="18" rx="1" ${P}/><rect x="15" y="15" width="6" height="6" rx="1" ${P}/>`,
    bond: `<circle cx="12" cy="5" r="3" ${P}/><circle cx="5" cy="18" r="3" ${P}/><circle cx="19" cy="18" r="3" ${P}/><path d="M10.5 7.5L6.5 15.5M13.5 7.5l4 8" ${P}/>`,
    loop: `<path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5" ${P}/>`,
    bolt: `<path d="M13 2L4 14h7l-1 8 9-12h-7z" ${P}/>`,
    game: `<rect x="2.5" y="7" width="19" height="11" rx="5" ${P}/><path d="M7 10.5v4M5 12.5h4" ${P}/><circle cx="15.5" cy="11.5" r="1.2" fill="currentColor"/><circle cx="18" cy="14" r="1.2" fill="currentColor"/>`
  };
  return `<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">${I[n]}</svg>`;
}

render();
