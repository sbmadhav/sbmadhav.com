/* Animated diagram scenes for the sutra deep dives.
   A scene is a list of steps. Each step adds SVG (or equation lines) and a sentence; earlier steps stay,
   unless a later step hides them. New pieces enter with a short draw-in or fade animation. */

/* ---------- tiny SVG helpers (theme-aware via vz- classes) ---------- */
export const R = (x, y, w, h, cls = 'vz-sky', label = '', lcls = 'vz-tb') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" class="${cls} vz-blk sc-soft"/>${label ? T(x + w / 2, y + h / 2, label, lcls) : ''}`;
export const T = (x, y, s, cls = 'vz-tb', anchor = 'middle') => `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}" dominant-baseline="middle">${s}</text>`;
export const L = (x1, y1, x2, y2, cls = 'sc-line') => `<path d="M${x1} ${y1}L${x2} ${y2}" class="${cls}" pathLength="1"/>`;
export const P = (d, cls = 'sc-line') => `<path d="${d}" class="${cls}" pathLength="1"/>`;
export const C = (cx, cy, r, cls = 'sc-line') => `<circle cx="${cx}" cy="${cy}" r="${r}" class="${cls}" pathLength="1"/>`;
export const DOT = (cx, cy, r = 5, cls = 'vz-coral') => `<circle cx="${cx}" cy="${cy}" r="${r}" class="${cls} vz-dot"/>`;
export const BOX = (x, y, s, cls = 'sc-digit', w = 44, h = 50) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" class="${cls}"/>${T(x + w / 2, y + h / 2 + 1, s, 'sc-dt')}`;
/* equation line for 'eq' scenes; mark parts with <b class="hl hl-coral"> */
export const EQ = html => html;

/* ---------- renderer ---------- */
export function mountScene(host, scene) {
  let k = 0, timer = 0;
  host.innerHTML = `<div class="sc">
    <div class="sc-stage" aria-hidden="true"></div>
    <p class="sc-say" aria-live="polite"></p>
    <div class="sc-ctrl"><button type="button" class="md-btn md-btn--sm" data-a="back" aria-label="Previous step">Back</button><span class="sc-pos"></span><button type="button" class="md-btn md-btn--sm md-btn--primary" data-a="next">Next step</button><button type="button" class="md-btn md-btn--sm" data-a="play">Play all</button></div></div>`;
  const stage = host.querySelector('.sc-stage'), say = host.querySelector('.sc-say'), pos = host.querySelector('.sc-pos');
  const steps = scene.steps;
  const draw = () => {
    const hidden = new Set(); steps.slice(0, k + 1).forEach(s => (s.hide || []).forEach(h => hidden.add(h)));
    if (scene.kind === 'eq') {
      stage.innerHTML = `<div class="sc-eq">${steps.slice(0, k + 1).map((s, i) => hidden.has(i) ? '' : `<div class="sc-eqline${i === k ? ' enter' : ''}">${s.add}</div>`).join('')}</div>`;
    } else {
      stage.innerHTML = `<svg class="vz sc-svg" viewBox="0 0 ${scene.w} ${scene.h}" style="max-width:${scene.w}px">${steps.slice(0, k + 1).map((s, i) => hidden.has(i) ? '' : `<g class="${i === k ? 'enter' : ''}">${s.add}</g>`).join('')}</svg>`;
    }
    say.innerHTML = steps[k].say; pos.textContent = `${k + 1} / ${steps.length}`;
    host.querySelector('[data-a="back"]').disabled = k === 0; host.querySelector('[data-a="next"]').disabled = k === steps.length - 1;
  };
  const stop = () => { clearInterval(timer); timer = 0; host.querySelector('[data-a="play"]').textContent = 'Play all'; };
  host.querySelector('.sc-ctrl').addEventListener('click', e => {
    const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
    if (a === 'back') { stop(); k = Math.max(0, k - 1); draw(); }
    if (a === 'next') { stop(); k = Math.min(steps.length - 1, k + 1); draw(); }
    if (a === 'play') { if (timer) return stop(); if (k === steps.length - 1) k = 0; draw(); e.target.textContent = 'Pause'; timer = setInterval(() => { if (k >= steps.length - 1) return stop(); k++; draw(); }, 2800); }
  });
  draw();
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && steps.length > 1) host.querySelector('[data-a="play"]').click();
  return stop;
}
