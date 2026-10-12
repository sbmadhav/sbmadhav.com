/* Visual models (the "pictorial" step): SVG strings that use design tokens through CSS classes,
   so they work in Daybreak and Deep Space. Every figure has an aria-label. */

const svg = (w, h, label, body, cls = '') => `<svg class="vz ${cls}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}" style="max-width:${w}px">${body}</svg>`;
const T = (x, y, s, cls = 'vz-t', anchor = 'middle') => `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}" dominant-baseline="middle">${s}</text>`;

/* Ten frame: a filled (coral), b filled (teal), rest empty. Two frames when total > 10. */
export function tenFrame(a, b = 0, frames = null) {
  const total = a + b, nf = frames || Math.max(1, Math.ceil(total / 10)), cs = 34, gap = 14;
  const w = 5 * cs + 8, h = nf * (2 * cs + 8) + (nf - 1) * gap;
  let body = '';
  for (let f = 0; f < nf; f++) {
    const oy = f * (2 * cs + 8 + gap);
    body += `<rect x="1" y="${oy + 1}" width="${5 * cs + 6}" height="${2 * cs + 6}" rx="8" class="vz-frame"/>`;
    for (let i = 0; i < 10; i++) {
      const k = f * 10 + i, x = 4 + (i % 5) * cs, y = oy + 4 + Math.floor(i / 5) * cs;
      body += `<rect x="${x}" y="${y}" width="${cs}" height="${cs}" class="vz-cell"/>`;
      if (k < total) body += `<circle cx="${x + cs / 2}" cy="${y + cs / 2}" r="${cs / 2 - 5}" class="${k < a ? 'vz-coral' : 'vz-teal'} vz-dot"/>`;
    }
  }
  return svg(w, h, `Ten frame showing ${a}${b ? ' and ' + b : ''}`, body);
}

/* Dot images for quick seeing (subitizing): grouped in fives, like dominoes. */
export function dots(n, style = 'dice') {
  const pts = [];
  if (style === 'dice' && n <= 6) {
    const P = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] }[n] || [];
    P.forEach(([c, r]) => pts.push([20 + c * 30, 20 + r * 30]));
    return svg(100, 100, `${n} dots`, `<rect x="2" y="2" width="96" height="96" rx="16" class="vz-frame"/>` + pts.map(([x, y]) => `<circle cx="${x + 10}" cy="${y + 10}" r="10" class="vz-coral vz-dot"/>`).join(''));
  }
  for (let i = 0; i < n; i++) { const g = Math.floor(i / 5), j = i % 5; pts.push([14 + g * 120 + (j % 3) * 34 + (j >= 3 ? 17 : 0), 18 + (j >= 3 ? 34 : 0)]); }
  const w = Math.ceil(n / 5) * 120;
  return svg(Math.max(w, 120), 72, `${n} dots`, pts.map(([x, y], i) => `<circle cx="${x + 4}" cy="${y + 4}" r="12" class="${Math.floor(i / 5) % 2 ? 'vz-teal' : 'vz-coral'} vz-dot"/>`).join(''));
}

/* Two rows of objects to compare */
export function rows(a, b, labels = ['A', 'B']) {
  const w = Math.max(a, b) * 30 + 60;
  const row = (n, y, cls) => Array.from({ length: n }, (_, i) => `<circle cx="${55 + i * 30}" cy="${y}" r="11" class="${cls} vz-dot"/>`).join('');
  return svg(w, 90, `Row ${labels[0]} has ${a}, row ${labels[1]} has ${b}`, T(18, 24, labels[0], 'vz-tb') + row(a, 24, 'vz-coral') + T(18, 66, labels[1], 'vz-tb') + row(b, 66, 'vz-sky'));
}

/* Base-ten blocks: hundreds flats, tens rods, ones cubes */
export function baseTen(n) {
  const H = Math.floor(n / 100), Te = Math.floor((n % 100) / 10), O = n % 10; let x = 4, body = '';
  for (let i = 0; i < H; i++) { body += `<rect x="${x}" y="4" width="80" height="80" class="vz-sky vz-blk"/>`; for (let k = 1; k < 10; k++) body += `<path d="M${x + k * 8} 4v80M${x} ${4 + k * 8}h80" class="vz-grid"/>`; x += 88; }
  for (let i = 0; i < Te; i++) { body += `<rect x="${x}" y="4" width="10" height="80" class="vz-teal vz-blk"/>`; for (let k = 1; k < 10; k++) body += `<path d="M${x} ${4 + k * 8}h10" class="vz-grid"/>`; x += 15; }
  if (O) x += 6;
  for (let i = 0; i < O; i++) body += `<rect x="${x + (i % 2) * 13}" y="${70 - Math.floor(i / 2) * 13}" width="10" height="10" class="vz-sun vz-blk"/>`;
  x += O ? 32 : 0;
  return svg(Math.max(x, 60), 90, `${H} hundreds, ${Te} tens and ${O} ones`, body);
}

/* Number line with optional jumps [[from, to, label]] and a marked point */
export function numberLine(min, max, { jumps = [], mark = null, step = null, labelEvery = null } = {}) {
  const W = 520, pad = 26, y = 70, span = max - min, sx = v => pad + ((v - min) / span) * (W - 2 * pad);
  step = step || (span <= 20 ? 1 : span <= 50 ? 5 : span <= 200 ? 10 : Math.pow(10, Math.floor(Math.log10(span)) - 1) * 5);
  labelEvery = labelEvery || (span <= 20 ? 1 : step) * (span / step > 20 ? 2 : 1);
  let body = `<path d="M${pad - 12} ${y}H${W - pad + 12}" class="vz-axis"/><path d="M${W - pad + 12} ${y}l-8 -5v10z" class="vz-ink"/>`;
  for (let v = min; v <= max + 1e-9; v += step) {
    const vv = Math.round(v * 1000) / 1000, big = Math.abs(vv / labelEvery - Math.round(vv / labelEvery)) < 1e-9;
    body += `<path d="M${sx(vv)} ${y - (big ? 8 : 5)}v${big ? 16 : 10}" class="vz-axis"/>`;
    if (big) body += T(sx(vv), y + 22, String(vv).replace('-', '−'), 'vz-ts');
  }
  jumps.forEach(([a, b, lab], i) => {
    const x1 = sx(a), x2 = sx(b), mid = (x1 + x2) / 2, hgt = 20 + Math.min(30, Math.abs(x2 - x1) / 4);
    body += `<path d="M${x1} ${y - 6}Q${mid} ${y - 6 - hgt * 2} ${x2} ${y - 6}" class="vz-jump ${i % 2 ? 'vz-s-teal' : 'vz-s-coral'}"/><path d="M${x2} ${y - 6}l${x2 > x1 ? -7 : 7} -6" class="vz-jump ${i % 2 ? 'vz-s-teal' : 'vz-s-coral'}"/>`;
    if (lab) body += T(mid, y - 12 - hgt, lab, 'vz-tb');
  });
  if (mark !== null) body += `<circle cx="${sx(mark)}" cy="${y}" r="7" class="vz-coral vz-dot"/>`;
  return svg(W, 100, `Number line from ${min} to ${max}`, body);
}

/* Fraction bar: n shaded parts out of d */
export function fracBar(n, d, { w = 360, cls = 'vz-coral', label = true } = {}) {
  const pw = w / d; let body = '';
  const wholes = Math.max(1, Math.ceil(n / d));
  for (let b = 0; b < wholes; b++) for (let i = 0; i < d; i++) {
    const k = b * d + i;
    body += `<rect x="${2 + i * pw}" y="${2 + b * 50}" width="${pw}" height="40" class="${k < n ? cls : 'vz-cell'} vz-blk"/>`;
  }
  return svg(w + 4, wholes * 50 - 6, `${n} out of ${d} equal parts shaded`, body);
}
export function fracCircle(n, d) {
  const r = 56, cx = 62, cy = 62; let body = '';
  if (d === 1) return svg(124, 124, `${n} whole`, `<circle cx="${cx}" cy="${cy}" r="${r}" class="${n ? 'vz-coral' : 'vz-cell'} vz-blk"/>`);
  for (let i = 0; i < d; i++) {
    const a1 = (i / d) * 2 * Math.PI - Math.PI / 2, a2 = ((i + 1) / d) * 2 * Math.PI - Math.PI / 2;
    const p = `M${cx} ${cy}L${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)}A${r} ${r} 0 ${a2 - a1 > Math.PI ? 1 : 0} 1 ${cx + r * Math.cos(a2)} ${cy + r * Math.sin(a2)}Z`;
    body += `<path d="${p}" class="${i < n ? 'vz-coral' : 'vz-cell'} vz-blk"/>`;
  }
  return svg(124, 124, `Circle with ${n} of ${d} parts shaded`, body);
}

/* Array of dots r rows by c columns */
export function array(r, c) {
  const s = 26; let body = '';
  for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) body += `<circle cx="${16 + j * s}" cy="${16 + i * s}" r="9" class="${i % 2 ? 'vz-teal' : 'vz-coral'} vz-dot"/>`;
  return svg(c * s + 6, r * s + 6, `${r} rows of ${c}`, body);
}

/* Area model: splits each factor by place value and labels partial products */
export function areaModel(a, b) {
  const parts = n => { const s = String(n), out = []; for (let i = 0; i < s.length; i++) { const v = +s[i] * 10 ** (s.length - 1 - i); if (v) out.push(v); } return out.length ? out : [0]; };
  const A = parts(a), B = parts(b), W = 380, H = 220, ox = 50, oy = 30;
  const wts = (arr, tot) => arr.map(v => Math.max(0.28, v / arr.reduce((x, y) => x + y, 0)) * tot);
  const ws = wts(B, W - ox - 6), hs = wts(A, H - oy - 6);
  const sw = ws.reduce((x, y) => x + y), sh = hs.reduce((x, y) => x + y);
  const wN = ws.map(v => v * (W - ox - 6) / sw), hN = hs.map(v => v * (H - oy - 6) / sh);
  let body = '', y = oy; const cls = ['vz-sun', 'vz-sky', 'vz-teal', 'vz-plum', 'vz-coral'];
  A.forEach((av, i) => {
    let x = ox; body += T(ox - 10, y + hN[i] / 2, av, 'vz-tb', 'end');
    B.forEach((bv, j) => {
      if (i === 0) body += T(x + wN[j] / 2, oy - 14, bv, 'vz-tb');
      body += `<rect x="${x}" y="${y}" width="${wN[j]}" height="${hN[i]}" class="${cls[(i + j) % 5]} vz-blk vz-soft"/>` + T(x + wN[j] / 2, y + hN[i] / 2, (av * bv).toLocaleString('en-US'), 'vz-tb');
      x += wN[j];
    });
    y += hN[i];
  });
  return svg(W, H, `Area model for ${a} times ${b}`, body);
}

/* Analog clock */
export function clock(h, m) {
  const cx = 70, cy = 70, r = 62; let body = `<circle cx="${cx}" cy="${cy}" r="${r}" class="vz-face"/>`;
  for (let i = 1; i <= 12; i++) { const a = (i / 12) * 2 * Math.PI - Math.PI / 2; body += T(cx + 48 * Math.cos(a), cy + 48 * Math.sin(a), i, 'vz-ts'); }
  for (let i = 0; i < 60; i++) { const a = (i / 60) * 2 * Math.PI, l = i % 5 ? 3 : 7; body += `<path d="M${cx + (r - 2) * Math.sin(a)} ${cy - (r - 2) * Math.cos(a)}L${cx + (r - 2 - l) * Math.sin(a)} ${cy - (r - 2 - l) * Math.cos(a)}" class="vz-axis vz-thin"/>`; }
  const ha = ((h % 12) + m / 60) / 12 * 2 * Math.PI, ma = m / 60 * 2 * Math.PI;
  body += `<path d="M${cx} ${cy}L${cx + 30 * Math.sin(ha)} ${cy - 30 * Math.cos(ha)}" class="vz-hand vz-s-coral"/><path d="M${cx} ${cy}L${cx + 46 * Math.sin(ma)} ${cy - 46 * Math.cos(ma)}" class="vz-hand vz-s-ink vz-thinhand"/><circle cx="${cx}" cy="${cy}" r="4" class="vz-ink"/>`;
  return svg(140, 140, `Clock showing ${h}:${String(m).padStart(2, '0')}`, body);
}

/* Coins: list of cent values */
export function coins(list) {
  const R = { 1: 13, 5: 16, 10: 12, 25: 19, 50: 22, 100: 24 }; let x = 6, body = '';
  list.forEach(v => { const r = R[v] || 16; body += `<circle cx="${x + r}" cy="28" r="${r}" class="${v === 1 ? 'vz-coral' : v === 25 || v === 50 ? 'vz-sky' : 'vz-sun'} vz-blk"/>` + T(x + r, 28, v + '¢', 'vz-ts vz-on'); x += 2 * r + 6; });
  return svg(x, 56, `Coins worth ${list.join(', ')} cents`, body);
}

/* Regular or named shapes */
export function shape(name, cls = 'vz-sky') {
  const poly = (n, r = 50, rot = -Math.PI / 2) => Array.from({ length: n }, (_, i) => `${60 + r * Math.cos(rot + i * 2 * Math.PI / n)},${60 + r * Math.sin(rot + i * 2 * Math.PI / n)}`).join(' ');
  const S = {
    circle: `<circle cx="60" cy="60" r="48" class="${cls} vz-blk"/>`,
    square: `<rect x="16" y="16" width="88" height="88" class="${cls} vz-blk"/>`,
    rectangle: `<rect x="6" y="30" width="108" height="60" class="${cls} vz-blk"/>`,
    triangle: `<polygon points="${poly(3, 54, -Math.PI / 2)}" class="${cls} vz-blk" transform="translate(0 8)"/>`,
    pentagon: `<polygon points="${poly(5)}" class="${cls} vz-blk"/>`,
    hexagon: `<polygon points="${poly(6, 50, 0)}" class="${cls} vz-blk"/>`,
    octagon: `<polygon points="${poly(8, 50, Math.PI / 8)}" class="${cls} vz-blk"/>`,
    rhombus: `<polygon points="60,8 104,60 60,112 16,60" class="${cls} vz-blk"/>`,
    trapezoid: `<polygon points="34,28 86,28 114,92 6,92" class="${cls} vz-blk"/>`,
    oval: `<ellipse cx="60" cy="60" rx="54" ry="34" class="${cls} vz-blk"/>`
  };
  return svg(120, 120, `A shape`, S[name] || S.circle);
}

/* Rectangle with side labels, optional unit grid */
export function rect(w, h, { grid = false, lw = null, lh = null } = {}) {
  const s = Math.min(26, 300 / Math.max(w, h)), W = w * s, H = h * s; let body = `<rect x="40" y="10" width="${W}" height="${H}" class="vz-sky vz-blk vz-soft"/>`;
  if (grid) { for (let i = 1; i < w; i++) body += `<path d="M${40 + i * s} 10v${H}" class="vz-grid"/>`; for (let j = 1; j < h; j++) body += `<path d="M40 ${10 + j * s}h${W}" class="vz-grid"/>`; }
  body += T(40 + W / 2, H + 26, lw ?? w, 'vz-tb') + T(30, 10 + H / 2, lh ?? h, 'vz-tb', 'end');
  return svg(W + 60, H + 42, `Rectangle ${w} by ${h}`, body);
}

/* Rectangular prism (box) with labels */
export function prism(l, w, h) {
  const s = 14, L = Math.min(l * s, 180), Wd = Math.min(w * s, 90) * 0.6, H = Math.min(h * s, 120), ox = 20, oy = 10 + Wd;
  const body = `<polygon points="${ox},${oy} ${ox + L},${oy} ${ox + L},${oy + H} ${ox},${oy + H}" class="vz-sky vz-blk vz-soft"/>
  <polygon points="${ox},${oy} ${ox + Wd},${oy - Wd} ${ox + L + Wd},${oy - Wd} ${ox + L},${oy}" class="vz-teal vz-blk vz-soft"/>
  <polygon points="${ox + L},${oy} ${ox + L + Wd},${oy - Wd} ${ox + L + Wd},${oy - Wd + H} ${ox + L},${oy + H}" class="vz-plum vz-blk vz-soft"/>`
    + T(ox + L / 2, oy + H + 16, l, 'vz-tb') + T(ox + L + Wd + 12, oy - Wd / 2 + H / 2 + 10, h, 'vz-tb', 'start') + T(ox + L + Wd / 2 + 10, oy - Wd / 2 - 6, w, 'vz-tb', 'start');
  return svg(ox + L + Wd + 40, oy + H + 30, `Box ${l} by ${w} by ${h}`, body);
}

/* Triangle with vertex angle labels or side labels */
export function triangle({ angles = null, sides = null, right = false } = {}) {
  const A = [30, 150], B = [270, 150], C = right ? [30, 30] : [190, 24];
  let body = `<polygon points="${A} ${B} ${C}" class="vz-sun vz-blk vz-soft"/>`;
  if (right) body += `<path d="M30 132h18v18" class="vz-axis vz-thin" fill="none"/>`;
  if (angles) { body += T(A[0] + 30, A[1] - 14, angles[0], 'vz-tb') + T(B[0] - 36, B[1] - 12, angles[1], 'vz-tb') + T(C[0] + (right ? 18 : 0), C[1] + 30, angles[2], 'vz-tb'); }
  if (sides) { body += T((A[0] + B[0]) / 2, 168, sides[0], 'vz-tb') + T((B[0] + C[0]) / 2 + 18, (B[1] + C[1]) / 2 - 6, sides[1], 'vz-tb', 'start') + T((A[0] + C[0]) / 2 - 10, (A[1] + C[1]) / 2, sides[2], 'vz-tb', 'end'); }
  return svg(300, 180, 'Triangle', body);
}

/* Angle split: a straight line or right angle cut into two parts */
export function anglePair(kind, a, b) {
  const cx = 150, cy = 120, R = 110; let body = '';
  const total = kind === 'straight' ? 180 : 90, aa = (a === '?' ? total - b : a), rad = d => d * Math.PI / 180;
  const ray = d => `M${cx} ${cy}L${cx + R * Math.cos(rad(180 - d))} ${cy - R * Math.sin(rad(180 - d))}`;
  body += kind === 'straight' ? `<path d="M${cx - R} ${cy}H${cx + R}" class="vz-axis"/>` : `<path d="M${cx} ${cy}H${cx + R}M${cx} ${cy}V${cy - R}" class="vz-axis"/>`;
  const start = kind === 'straight' ? 0 : 90, split = start + (total - aa);
  body += `<path d="${ray(split)}" class="vz-axis"/>`;
  const arcLab = (d1, d2, lab, cls) => { const m = (d1 + d2) / 2; return `<path d="M${cx + 36 * Math.cos(rad(180 - d1))} ${cy - 36 * Math.sin(rad(180 - d1))}A36 36 0 0 0 ${cx + 36 * Math.cos(rad(180 - d2))} ${cy - 36 * Math.sin(rad(180 - d2))}" class="vz-jump ${cls}"/>` + T(cx + 62 * Math.cos(rad(180 - m)), cy - 62 * Math.sin(rad(180 - m)), lab, 'vz-tb'); };
  body += arcLab(split, start + total, a === '?' ? '?' : a + '°', 'vz-s-coral') + arcLab(start, split, b === '?' ? '?' : b + '°', 'vz-s-teal');
  return svg(300, 140, 'Angle diagram', body);
}

/* Circle with radius label */
export function circleFig(r, label = 'r') {
  return svg(160, 160, `Circle with ${label} ${r}`, `<circle cx="80" cy="80" r="70" class="vz-sky vz-blk vz-soft"/><path d="M80 80H150" class="vz-axis"/><circle cx="80" cy="80" r="4" class="vz-ink"/>` + T(115, 68, `${label} = ${r}`, 'vz-tb'));
}

/* Coordinate plane with points and optional line through points */
export function plane({ points = [], range = 6, fns = [], segs = [] } = {}) {
  const N = range, S = 300, u = S / (2 * N), sx = x => S / 2 + x * u, sy = y => S / 2 - y * u; let body = '';
  for (let i = -N; i <= N; i++) body += `<path d="M${sx(i)} 0V${S}M0 ${sy(i)}H${S}" class="vz-grid"/>`;
  body += `<path d="M0 ${S / 2}H${S}M${S / 2} 0V${S}" class="vz-axis"/>`;
  for (let i = -N; i <= N; i += N > 8 ? 2 : 1) if (i && Math.abs(i) < N) body += T(sx(i), S / 2 + 10, String(i).replace('-', '−'), 'vz-tt') + T(S / 2 - 8, sy(i), String(i).replace('-', '−'), 'vz-tt', 'end');
  fns.forEach((f, k) => { let d = ''; for (let px = 0; px <= S; px += 2) { const x = (px - S / 2) / u, y = f(x); if (!Number.isFinite(y) || Math.abs(y) > N * 3) { d += ' '; continue; } d += (d.endsWith(' ') || !d ? 'M' : 'L') + px.toFixed(1) + ' ' + sy(y).toFixed(1); } body += `<path d="${d.replace(/ +/g, ' ').trim()}" class="vz-curve ${k % 2 ? 'vz-s-teal' : 'vz-s-coral'}"/>`; });
  segs.forEach(([a, b]) => { body += `<path d="M${sx(a[0])} ${sy(a[1])}L${sx(b[0])} ${sy(b[1])}" class="vz-curve vz-s-sky"/>`; });
  points.forEach(p => { body += `<circle cx="${sx(p.x)}" cy="${sy(p.y)}" r="5.5" class="vz-coral vz-dot"/>` + (p.label ? T(sx(p.x) + 9, sy(p.y) - 11, p.label, 'vz-tb', 'start') : ''); });
  return svg(S, S, 'Coordinate plane', `<defs><clipPath id="clipP"><rect width="${S}" height="${S}"/></clipPath></defs><g clip-path="url(#clipP)">${body}</g>`, 'vz-plane');
}

/* Bar chart of [label, value] */
export function bars(data) {
  const max = Math.max(...data.map(d => d[1])), W = data.length * 56 + 40, H = 170; let body = `<path d="M30 10V${H - 30}H${W}" class="vz-axis"/>`;
  const cls = ['vz-coral', 'vz-sky', 'vz-teal', 'vz-sun', 'vz-plum'];
  for (let v = 0; v <= max; v += Math.max(1, Math.ceil(max / 5))) body += `<path d="M30 ${H - 30 - (v / max) * 120}H${W}" class="vz-grid"/>` + T(24, H - 30 - (v / max) * 120, v, 'vz-tt', 'end');
  data.forEach(([l, v], i) => { const h = (v / max) * 120; body += `<rect x="${42 + i * 56}" y="${H - 30 - h}" width="36" height="${h}" class="${cls[i % 5]} vz-blk"/>` + T(60 + i * 56, H - 16, l, 'vz-ts'); });
  return svg(W, H, 'Bar chart', body);
}

/* Unit circle with an angle */
export function unitCircle(deg) {
  const c = 110, R = 90, a = deg * Math.PI / 180, x = c + R * Math.cos(a), y = c - R * Math.sin(a);
  return svg(220, 220, `Unit circle at ${deg} degrees`, `<circle cx="${c}" cy="${c}" r="${R}" class="vz-face"/><path d="M10 ${c}H210M${c} 10V210" class="vz-axis vz-thin"/><path d="M${c} ${c}L${x} ${y}" class="vz-axis"/><path d="M${x} ${y}V${c}" class="vz-curve vz-s-coral"/><path d="M${c} ${c}H${x}" class="vz-curve vz-s-teal"/><circle cx="${x}" cy="${y}" r="5" class="vz-coral vz-dot"/>` + T(c + 26 * Math.cos(a / 2), c - 26 * Math.sin(a / 2), `${deg}°`, 'vz-ts'));
}

/* Balance scale for equations: HTML so it can hold rich expressions */
export const balance = (l, r) => `<div class="bal" role="img" aria-label="Balance: ${l.replace(/<[^>]+>/g, '')} equals ${r.replace(/<[^>]+>/g, '')}"><div class="bal-pan">${l}</div><div class="bal-mid">=</div><div class="bal-pan">${r}</div></div>`;
