/* Grades 9 to 12: Algebra 1, Geometry, Algebra 2, Precalculus and Calculus. */
import { ri, rnz, pick, gcd, simp, fr, frRaw, neg, paren, round, poly, polyText, term, sup, sq, simpRoot, rootHtml, rootText } from '../lib.js';
import * as V from '../viz.js';

const fact = n => (n <= 1 ? 1 : n * fact(n - 1));
const nCr = (n, r) => fact(n) / (fact(r) * fact(n - r));
const binom = (p, q) => `(<i>x</i> ${p < 0 ? '&minus;' : '+'} ${Math.abs(p)})(<i>x</i> ${q < 0 ? '&minus;' : '+'} ${Math.abs(q)})`;

export default [
  /* ---------- Grade 9: Algebra 1 ---------- */
  { id: '9-expand', grade: 9, strand: 'alg', title: 'Multiply binomials', kid: 'Box multiply',
    idea: 'Every term in the first bracket multiplies every term in the second. A 2 by 2 box keeps track of all four products.',
    method: ['First × first, outer, inner, last.', 'Combine the two middle (x) terms.'],
    gen() {
      const p = rnz(-9, 9), q = rnz(-9, 9);
      return { q: `Expand: ${binom(p, q)}`, kind: 'expr', answer: polyText([1, p + q, p * q]),
        hints: [`x &middot; x = x<sup>2</sup>, outer + inner = ${neg(p + q)}x, last = ${neg(p * q)}`], steps: [`<i>x</i>${sup(2)}${term(q, 'x', 1)}${term(p, 'x', 1)}${term(p * q, 'x', 0)}`, `= ${poly([1, p + q, p * q])}`] };
    } },
  { id: '9-factor', grade: 9, strand: 'alg', title: 'Factor quadratics', kid: 'Undo the box',
    idea: 'To factor x² + bx + c, find two numbers that multiply to c and add to b.',
    method: ['List factor pairs of c (watch the signs).', 'Pick the pair that adds to b.', 'Write (x + p)(x + q).'],
    gen(lv) {
      const p = rnz(-9, 9), q = rnz(-9, 9), a = lv === 3 ? pick([2, 3]) : 1;
      if (a > 1) return { q: `Factor: ${poly([a, a * q + p, p * q])}`, kind: 'expr', form: 'factored', answer: `(${a}x+${p})(x+${q})`, hints: [`AC method: find two numbers that multiply to ${a} &times; ${neg(p * q)} = ${neg(a * p * q)} and add to ${neg(a * q + p)}.`], steps: [`(${a}<i>x</i> ${p < 0 ? '&minus;' : '+'} ${Math.abs(p)})(<i>x</i> ${q < 0 ? '&minus;' : '+'} ${Math.abs(q)})`] };
      return { q: `Factor: ${poly([1, p + q, p * q])}`, kind: 'expr', form: 'factored', answer: `(x+${p})(x+${q})`,
        hints: [`Two numbers that multiply to ${neg(p * q)} and add to ${neg(p + q)}.`], steps: [`${neg(p)} &times; ${paren(q)} = ${neg(p * q)} and ${neg(p)} + ${paren(q)} = ${neg(p + q)}`, binom(p, q)] };
    } },
  { id: '9-quadsolve', grade: 9, strand: 'alg', title: 'Solve quadratics by factoring', kid: 'Zero product',
    idea: 'If two factors multiply to zero, one of them must be zero. Factor, then set each factor to zero.',
    method: ['Get zero on one side.', 'Factor.', 'Set each factor to zero and solve. List answers with a comma.'],
    gen() {
      const r1 = ri(-9, 9), r2 = ri(-9, 9);
      return { q: `Solve: ${poly([1, -(r1 + r2), r1 * r2])} = 0`, viz: V.plane({ fns: [x => (x - r1) * (x - r2)], range: 10 }), kind: 'set', answer: [r1, r2],
        hints: [`Factor: two numbers that multiply to ${neg(r1 * r2)} and add to ${neg(-(r1 + r2))}.`], steps: [`${binom(-r1, -r2)} = 0`, `<i>x</i> = ${r1 === r2 ? neg(r1) : neg(r1) + ' or ' + neg(r2)}`] };
    } },
  { id: '9-quadform', grade: 9, strand: 'alg', title: 'The quadratic formula', kid: 'The magic formula',
    idea: 'For ax² + bx + c = 0, x = (−b ± √(b² − 4ac)) ÷ 2a. The discriminant b² − 4ac tells how many real solutions there are.',
    method: ['Identify a, b and c.', 'Compute the discriminant.', 'Plug in. Round to 2 decimal places when roots are not whole.'],
    gen() {
      let a, b, c, D; do { a = pick([1, 1, 2, 3]); b = ri(-9, 9); c = ri(-9, 9); D = b * b - 4 * a * c; } while (D <= 0);
      const r1 = (-b + Math.sqrt(D)) / (2 * a), r2 = (-b - Math.sqrt(D)) / (2 * a);
      return { q: `Solve: ${poly([a, b, c])} = 0. Round to 2 decimal places.`, kind: 'set', answer: [round(r1, 2), round(r2, 2)], tol: 0.011,
        hints: [`a = ${a}, b = ${neg(b)}, c = ${neg(c)}. Discriminant = ${D}.`], steps: [`<i>x</i> = (${neg(-b)} &plusmn; ${sq(D)}) &divide; ${2 * a}`, `<i>x</i> &asymp; ${round(r1, 2)} or ${round(r2, 2)}`] };
    } },
  { id: '9-funceval', grade: 9, strand: 'func', title: 'Function notation', kid: 'Number machines',
    idea: 'f(x) is a machine: put in x, get out f(x). f(3) means put 3 in.',
    method: ['Replace every x with the input.', 'Follow the order of operations.'],
    gen() {
      const a = rnz(-4, 4), b = ri(-9, 9), c = ri(-9, 9), x = ri(-5, 5);
      return { q: `<i>f</i>(<i>x</i>) = ${poly([a, b, c])}. Find <i>f</i>(${neg(x)}).`, kind: 'num', answer: a * x * x + b * x + c, hints: [`${neg(a)}&middot;${paren(x)}<sup>2</sup> + ${neg(b)}&middot;${paren(x)} + ${paren(c)}`], steps: [`${neg(a * x * x)} + ${paren(b * x)} + ${paren(c)} = ${neg(a * x * x + b * x + c)}`] };
    } },
  { id: '9-radicals', grade: 9, strand: 'alg', title: 'Simplify square roots', kid: 'Root shrinker',
    idea: 'Pull out perfect-square factors: √72 = √(36 × 2) = 6√2.',
    method: ['Find the largest perfect square that divides the number.', 'Its root goes outside; the rest stays inside.', 'Type answers like 6sqrt(2) or 6√2.'],
    gen() {
      const k = ri(2, 9), m = pick([2, 3, 5, 6, 7, 10, 11]), n = k * k * m;
      return { q: `Simplify: ${sq(n)}`, kind: 'expr', vars: [], answer: rootText(k, m), hints: [`${n} = ${k * k} &times; ${m}`], steps: [`${sq(n)} = ${sq(k * k)} &times; ${sq(m)} = ${rootHtml(k, m)}`] };
    } },
  { id: '9-seq', grade: 9, strand: 'func', title: 'Arithmetic and geometric sequences', kid: 'Number patterns',
    idea: 'Arithmetic sequences add the same amount each step. Geometric sequences multiply by the same amount.',
    method: ['Arithmetic: aₙ = a₁ + (n − 1)d.', 'Geometric: aₙ = a₁ · rⁿ⁻¹.'],
    gen() {
      const geo = Math.random() < .4, a1 = ri(1, 9), d = geo ? pick([2, 3, -2]) : rnz(-7, 9), n = geo ? ri(5, 8) : ri(8, 30);
      const t = k => geo ? a1 * d ** (k - 1) : a1 + (k - 1) * d;
      return { q: `${[1, 2, 3, 4].map(t).map(neg).join(', ')}, ... What is term number ${n}?`, kind: 'num', answer: t(n),
        hints: [geo ? `Each term is multiplied by ${neg(d)}.` : `Each term adds ${neg(d)}.`], steps: [geo ? `${a1} &middot; ${paren(d)}${sup(n - 1)} = ${neg(t(n))}` : `${a1} + ${n - 1}&middot;${paren(d)} = ${neg(t(n))}`] };
    } },
  { id: '9-abs', grade: 9, strand: 'alg', title: 'Absolute value equations', kid: 'Distance from zero',
    idea: '|x − a| = b means x is b units away from a, so there are two answers: a + b and a − b.',
    method: ['Get the absolute value alone.', 'Split into two equations: inside = b and inside = −b.'],
    gen() {
      const a = ri(-9, 9), b = ri(1, 12);
      return { q: `Solve: |<i>x</i> ${a < 0 ? '+' : '&minus;'} ${Math.abs(a)}| = ${b}`, kind: 'set', answer: [a + b, a - b], hints: [`<i>x</i> is ${b} away from ${neg(a)}.`], steps: [`<i>x</i> = ${neg(a)} + ${b} = ${neg(a + b)} or <i>x</i> = ${neg(a)} &minus; ${b} = ${neg(a - b)}`] };
    } },
  { id: '9-exp', grade: 9, strand: 'func', title: 'Exponential growth and decay', kid: 'Doubling power',
    idea: 'Growing by a percent each step multiplies by the same factor: A = P(1 + r)ᵗ.',
    method: ['Growth: factor is 1 + r. Decay: 1 − r.', 'Raise to the number of periods.', 'Round to 2 decimal places.'],
    gen() {
      const P = ri(1, 50) * 100, r = pick([2, 3, 4, 5, 8, 10]), t = ri(2, 10), dec = Math.random() < .3, f = dec ? 1 - r / 100 : 1 + r / 100;
      return { q: `$${P} ${dec ? 'loses' : 'grows'} ${r}% per year. What is it worth after ${t} years? Round to the cent.`, kind: 'num', answer: round(P * f ** t, 2), tol: 0.011, unit: '$',
        hints: [`Multiply by ${f} each year: ${P} &times; ${f}${sup(t)}`], steps: [`${P} &times; ${f}${sup(t)} = ${round(P * f ** t, 2).toFixed(2)}`] };
    } },

  /* ---------- Grade 10: Geometry ---------- */
  { id: '10-triangle', grade: 10, strand: 'geo', title: 'Angles in triangles', kid: 'Triangle 180',
    idea: 'The three angles of any triangle add to 180°. An exterior angle equals the two far interior angles added.',
    method: ['Add the angles you know.', 'Subtract from 180°.'],
    gen() {
      const a = ri(20, 100), b = ri(20, 160 - a - 10), c = 180 - a - b;
      return { q: 'Find the missing angle.', viz: V.triangle({ angles: [a + '°', b + '°', '?'] }), kind: 'num', answer: c, unit: '°', hints: [`${a} + ${b} = ${a + b}`], steps: [`180 &minus; ${a + b} = ${c}°`] };
    } },
  { id: '10-similar', grade: 10, strand: 'geo', title: 'Similar figures', kid: 'Same shape, new size',
    idea: 'Similar shapes have equal angles and proportional sides. Find the scale factor and use it everywhere.',
    method: ['Divide matching sides to get the scale factor.', 'Multiply the side you need by it.', 'Areas scale by the factor squared.'],
    gen() {
      const s = pick([2, 3, 4, 1.5, 2.5]), a = s % 1 ? 2 * ri(1, 6) : ri(2, 12), b = ri(2, 15), area = Math.random() < .3;
      if (area) return { q: `Two similar shapes have matching sides ${a} and ${a * s}. The small one has area ${b}. What is the area of the big one?`, kind: 'num', answer: round(b * s * s, 4), hints: [`Scale factor ${s}, so areas scale by ${s}<sup>2</sup> = ${s * s}.`], steps: [`${b} &times; ${s * s} = ${round(b * s * s, 4)}`] };
      return { q: `Triangles are similar. Matching sides: ${a} and ${a * s}. Another side of the small triangle is ${b}. What is the matching side of the big one?`, kind: 'num', answer: round(b * s, 4), hints: [`Scale factor: ${a * s} &divide; ${a} = ${s}`], steps: [`${b} &times; ${s} = ${round(b * s, 4)}`] };
    } },
  { id: '10-distance', grade: 10, strand: 'geo', title: 'Distance and midpoint', kid: 'How far apart?',
    idea: 'Distance is the Pythagorean theorem on the grid. The midpoint averages the coordinates.',
    method: ['Distance: √((x₂ − x₁)² + (y₂ − y₁)²).', 'Midpoint: ((x₁ + x₂)/2, (y₁ + y₂)/2).'],
    gen() {
      const [p, q] = pick([[3, 4], [6, 8], [5, 12], [8, 6], [4, 3]]), x1 = ri(-6, 2), y1 = ri(-6, 2), x2 = x1 + p * pick([1, -1]), y2 = y1 + q * pick([1, -1]);
      if (Math.random() < .5) return { q: `Find the distance between (${neg(x1)}, ${neg(y1)}) and (${neg(x2)}, ${neg(y2)}).`, viz: V.plane({ points: [{ x: x1, y: y1 }, { x: x2, y: y2 }], segs: [[[x1, y1], [x2, y2]]], range: 14 }), kind: 'num', answer: Math.hypot(p, q), hints: [`Across ${p}, up or down ${q}.`], steps: [`&radic;(${p}<sup>2</sup> + ${q}<sup>2</sup>) = ${Math.hypot(p, q)}`] };
      return { q: `Find the midpoint of (${neg(x1)}, ${neg(y1)}) and (${neg(x2)}, ${neg(y2)}).`, kind: 'fields', fields: [{ label: 'x', answer: (x1 + x2) / 2 }, { label: 'y', answer: (y1 + y2) / 2 }], hints: ['Average the x values, then the y values.'], steps: [`(${round((x1 + x2) / 2, 2)}, ${round((y1 + y2) / 2, 2)})`] };
    } },
  { id: '10-polygon', grade: 10, strand: 'geo', title: 'Polygon angles', kid: 'Many-sided shapes',
    idea: 'An n-sided polygon splits into n − 2 triangles, so its angles add to (n − 2) × 180°.',
    method: ['Interior sum: (n − 2) × 180.', 'One angle of a regular polygon: the sum ÷ n.', 'Exterior angles always add to 360°.'],
    gen() {
      const n = pick([5, 6, 8, 9, 10, 12]), t = pick(['sum', 'each', 'ext']), name = { 5: 'pentagon', 6: 'hexagon', 8: 'octagon', 9: 'nonagon', 10: 'decagon', 12: 'dodecagon' }[n];
      const ans = t === 'sum' ? (n - 2) * 180 : t === 'each' ? (n - 2) * 180 / n : 360 / n;
      return { q: t === 'sum' ? `What do the interior angles of a ${name} add up to?` : t === 'each' ? `What is each interior angle of a regular ${name}?` : `What is each exterior angle of a regular ${name}?`, kind: 'num', answer: ans, unit: '°',
        hints: [t === 'ext' ? 'Exterior angles add to 360°.' : `${n} sides make ${n - 2} triangles.`], steps: [t === 'sum' ? `(${n} &minus; 2) &times; 180 = ${ans}°` : t === 'each' ? `${(n - 2) * 180} &divide; ${n} = ${ans}°` : `360 &divide; ${n} = ${ans}°`] };
    } },
  { id: '10-arc', grade: 10, strand: 'geo', title: 'Arcs and sectors', kid: 'Pizza slices',
    idea: 'A sector is a fraction of the circle: angle ÷ 360. Use that fraction of the circumference or area.',
    method: ['Fraction = angle ÷ 360.', 'Arc length = fraction × 2πr.', 'Sector area = fraction × πr².'],
    gen() {
      const r = ri(2, 12), a = pick([30, 45, 60, 90, 120, 135, 150, 180, 210, 240, 270]), area = Math.random() < .5, ans = area ? a / 360 * Math.PI * r * r : a / 360 * 2 * Math.PI * r;
      return { q: `A circle has radius ${r}. Find the ${area ? 'area of the sector' : 'length of the arc'} with central angle ${a}°. Round to 2 decimal places.`, kind: 'num', answer: round(ans, 2), tol: 0.02,
        hints: [`Fraction of the circle: ${a} &divide; 360 = ${fr(a, 360)}`], steps: [`${fr(a, 360)} &times; ${area ? `&pi;&middot;${r}<sup>2</sup>` : `2&pi;&middot;${r}`} = ${round(ans, 2)}`] };
    } },
  { id: '10-trig', grade: 10, strand: 'trig', title: 'Right-triangle trigonometry', kid: 'SOH CAH TOA',
    idea: 'In a right triangle, sin = opposite ÷ hypotenuse, cos = adjacent ÷ hypotenuse, tan = opposite ÷ adjacent.',
    method: ['Label the sides from the angle\'s point of view.', 'Pick the ratio that uses the side you know and the side you want.', 'Solve and round to 2 decimal places.'],
    gen() {
      const ang = pick([20, 25, 30, 35, 40, 50, 55, 60, 65, 70]), h = ri(5, 20), t = pick(['opp', 'adj']), rad = ang * Math.PI / 180;
      const ans = t === 'opp' ? h * Math.sin(rad) : h * Math.cos(rad);
      return { q: `A right triangle has hypotenuse ${h} and an angle of ${ang}°. Find the side ${t === 'opp' ? 'opposite' : 'adjacent to'} that angle. Round to 2 decimal places.`, kind: 'num', answer: round(ans, 2), tol: 0.011,
        hints: [t === 'opp' ? 'sin = opposite &divide; hypotenuse' : 'cos = adjacent &divide; hypotenuse'], steps: [`${h} &times; ${t === 'opp' ? 'sin' : 'cos'}(${ang}°) = ${round(ans, 2)}`] };
    } },
  { id: '10-special', grade: 10, strand: 'trig', title: 'Special right triangles', kid: 'Shortcut triangles',
    idea: '45-45-90 sides are in ratio 1 : 1 : √2. 30-60-90 sides are 1 : √3 : 2.',
    method: ['45-45-90: hypotenuse = leg × √2.', '30-60-90: long leg = short leg × √3, hypotenuse = 2 × short leg.', 'Type roots like 5sqrt(2).'],
    gen() {
      const s = ri(2, 12), t = pick(['45h', '30long', '30hyp']);
      const map = { '45h': [`A 45-45-90 triangle has legs of ${s}. Find the hypotenuse.`, rootText(s, 2), rootHtml(s, 2)], '30long': [`A 30-60-90 triangle has short leg ${s}. Find the long leg.`, rootText(s, 3), rootHtml(s, 3)], '30hyp': [`A 30-60-90 triangle has short leg ${s}. Find the hypotenuse.`, String(2 * s), String(2 * s)] }[t];
      return { q: map[0], kind: 'expr', vars: [], answer: map[1], hints: [t === '45h' ? 'Multiply the leg by &radic;2.' : t === '30long' ? 'Multiply the short leg by &radic;3.' : 'Double the short leg.'], steps: [map[2]] };
    } },
  { id: '10-sphere', grade: 10, strand: 'geo', title: 'Surface area', kid: 'Wrapping paper',
    idea: 'Surface area adds up the area of every face. A sphere\'s is 4πr². A cylinder\'s is 2πr² + 2πrh.',
    method: ['Box: 2(lw + lh + wh).', 'Cylinder: two circles plus the label.', 'Sphere: 4πr². Round to 2 decimal places.'],
    gen() {
      const t = pick(['box', 'cyl', 'sph']), l = ri(2, 10), w = ri(2, 10), h = ri(2, 10);
      const ans = t === 'box' ? 2 * (l * w + l * h + w * h) : t === 'cyl' ? 2 * Math.PI * l * l + 2 * Math.PI * l * h : 4 * Math.PI * l * l;
      return { q: t === 'box' ? `Find the surface area of a box ${l} by ${w} by ${h}.` : t === 'cyl' ? `Find the surface area of a cylinder with radius ${l} and height ${h}. Round to 2 decimal places.` : `Find the surface area of a sphere with radius ${l}. Round to 2 decimal places.`, viz: t === 'box' ? V.prism(l, w, h) : '', kind: 'num', answer: round(ans, 2), tol: 0.02,
        hints: [t === 'box' ? `Faces: ${l * w}, ${l * h} and ${w * h}, each twice.` : t === 'cyl' ? '2&pi;r<sup>2</sup> + 2&pi;rh' : '4&pi;r<sup>2</sup>'], steps: [`${round(ans, 2)}`] };
    } },

  /* ---------- Grade 11: Algebra 2 ---------- */
  { id: '11-complex', grade: 11, strand: 'alg', title: 'Complex numbers', kid: 'Imaginary friends',
    idea: 'i is the number with i² = −1. Complex numbers a + bi add like terms and multiply like binomials.',
    method: ['Add or subtract real parts and imaginary parts separately.', 'Multiply out, then replace i² with −1.', 'Type answers like 3 + 2i.'],
    gen() {
      const a = ri(-6, 6), b = rnz(-6, 6), c = ri(-6, 6), d = rnz(-6, 6), mul = Math.random() < .55;
      const re = mul ? a * c - b * d : a + c, im = mul ? a * d + b * c : b + d, cx = (x, y) => `(${neg(x)} ${y < 0 ? '&minus;' : '+'} ${Math.abs(y)}<i>i</i>)`;
      return { q: `${cx(a, b)} ${mul ? '&middot;' : '+'} ${cx(c, d)} = ?`, kind: 'complex', answer: [re, im],
        hints: [mul ? `Multiply out: you get ${neg(b * d)}<i>i</i><sup>2</sup>, and <i>i</i><sup>2</sup> = &minus;1.` : 'Add real parts, then imaginary parts.'], steps: [`${neg(re)} ${im < 0 ? '&minus;' : '+'} ${Math.abs(im)}<i>i</i>`] };
    } },
  { id: '11-logs', grade: 11, strand: 'func', title: 'Logarithms', kid: 'Undo powers',
    idea: 'log_b(x) asks: what power of b gives x? log₂(8) = 3 because 2³ = 8.',
    method: ['Rewrite as a power: b^? = x.', 'Use log rules: log(ab) = log a + log b, log(aⁿ) = n log a.'],
    gen() {
      const b = pick([2, 3, 5, 10]), e = b === 10 ? ri(-2, 5) : ri(-2, b === 2 ? 8 : 4), x = b ** e;
      return { q: `log<sub>${b}</sub>(${e < 0 ? frRaw(1, b ** -e) : x}) = ?`, kind: 'num', answer: e, hints: [`${b} to what power is ${e < 0 ? '1/' + b ** -e : x}?`], steps: [`${b}${sup(e)} = ${e < 0 ? '1/' + b ** -e : x}`] };
    } },
  { id: '11-expeq', grade: 11, strand: 'func', title: 'Exponential equations', kid: 'Match the bases',
    idea: 'If both sides are powers of the same base, set the exponents equal.',
    method: ['Rewrite both sides with the same base.', 'Set the exponents equal and solve.'],
    gen() {
      const b = pick([2, 3, 5]), k = ri(-3, 3), x = ri(-3, 5), e = x + k;
      const rhs = e >= 0 ? b ** e : `1/${b ** -e}`;
      return { q: `Solve: ${b}<sup><i>x</i> ${k < 0 ? '&minus;' : '+'} ${Math.abs(k)}</sup> = ${rhs}`, kind: 'num', answer: x, hints: [`${rhs} = ${b}${sup(e)}`], steps: [`<i>x</i> ${k < 0 ? '&minus;' : '+'} ${Math.abs(k)} = ${e}`, `<i>x</i> = ${neg(x)}`] };
    } },
  { id: '11-vertex', grade: 11, strand: 'func', title: 'Vertex of a parabola', kid: 'Top of the hill',
    idea: 'For y = ax² + bx + c, the vertex is at x = −b ÷ 2a. Plug that in to find y.',
    method: ['x = −b / (2a).', 'Substitute to get y.'],
    gen() {
      const a = rnz(-3, 3), h = ri(-5, 5), k = ri(-8, 8), b = -2 * a * h, c = a * h * h + k;
      return { q: `Find the vertex of <i>y</i> = ${poly([a, b, c])}.`, viz: V.plane({ fns: [x => a * x * x + b * x + c], points: [{ x: h, y: k }], range: 10 }), kind: 'fields', fields: [{ label: 'x', answer: h }, { label: 'y', answer: k }],
        hints: [`<i>x</i> = &minus;(${neg(b)}) &divide; (2&middot;${paren(a)}) = ${neg(h)}`], steps: [`Vertex (${neg(h)}, ${neg(k)})`] };
    } },
  { id: '11-remainder', grade: 11, strand: 'alg', title: 'Remainder theorem', kid: 'Shortcut division',
    idea: 'When p(x) is divided by (x − a), the remainder is p(a). No long division needed.',
    method: ['Find a from (x − a).', 'Evaluate p(a).'],
    gen() {
      const co = [rnz(-3, 3), ri(-5, 5), ri(-5, 5), ri(-9, 9)], a = ri(-3, 3), val = co.reduce((s, c) => s * a + c, 0);
      return { q: `Find the remainder when ${poly(co)} is divided by (<i>x</i> ${a <= 0 ? '+' : '&minus;'} ${Math.abs(a)}).`, kind: 'num', answer: val, hints: [`Evaluate p(${neg(a)}).`], steps: [`p(${neg(a)}) = ${neg(val)}`] };
    } },
  { id: '11-series', grade: 11, strand: 'func', title: 'Series sums', kid: 'Adding patterns',
    idea: 'Arithmetic series: n × (first + last) ÷ 2. Geometric series: a₁(1 − rⁿ) ÷ (1 − r).',
    method: ['Decide arithmetic or geometric.', 'Use the matching sum formula.'],
    gen() {
      if (Math.random() < .5) { const a = ri(1, 10), d = ri(1, 6), n = ri(6, 20), last = a + (n - 1) * d; return { q: `Find the sum: ${a} + ${a + d} + ${a + 2 * d} + ... + ${last}`, kind: 'num', answer: n * (a + last) / 2, hints: [`There are ${n} terms.`], steps: [`${n} &times; (${a} + ${last}) &divide; 2 = ${n * (a + last) / 2}`] }; }
      const a = ri(1, 5), r = pick([2, 3]), n = ri(4, 7), s = a * (r ** n - 1) / (r - 1);
      return { q: `Find the sum of the first ${n} terms: ${a} + ${a * r} + ${a * r * r} + ...`, kind: 'num', answer: s, hints: [`Ratio ${r}. Use a(r<sup>n</sup> &minus; 1) &divide; (r &minus; 1).`], steps: [`${a}(${r}${sup(n)} &minus; 1) &divide; ${r - 1} = ${s}`] };
    } },
  { id: '11-inverse', grade: 11, strand: 'func', title: 'Inverse and composite functions', kid: 'Reverse machines',
    idea: 'An inverse undoes a function. A composite f(g(x)) feeds one machine\'s output into another.',
    method: ['Inverse: swap x and y, then solve for y.', 'Composite: work from the inside out.'],
    gen() {
      const a = rnz(-5, 5), b = ri(-9, 9);
      if (Math.random() < .5) return { q: `<i>f</i>(<i>x</i>) = ${poly([a, b])}. Find <i>f</i><sup>&minus;1</sup>(<i>x</i>).`, kind: 'expr', answer: `(x-(${b}))/(${a})`, hints: [`Swap: <i>x</i> = ${neg(a)}<i>y</i> ${b < 0 ? '&minus;' : '+'} ${Math.abs(b)}. Solve for y.`], steps: [`<i>f</i><sup>&minus;1</sup>(<i>x</i>) = (<i>x</i> ${b < 0 ? '+' : '&minus;'} ${Math.abs(b)}) &divide; ${paren(a)}`] };
      const c = rnz(-3, 3), d = ri(-5, 5), x = ri(-4, 4), g = c * x + d;
      return { q: `<i>f</i>(<i>x</i>) = ${poly([a, b])} and <i>g</i>(<i>x</i>) = ${poly([c, d])}. Find <i>f</i>(<i>g</i>(${neg(x)})).`, kind: 'num', answer: a * g + b, hints: [`First <i>g</i>(${neg(x)}) = ${neg(g)}.`], steps: [`<i>g</i>(${neg(x)}) = ${neg(g)}`, `<i>f</i>(${neg(g)}) = ${neg(a * g + b)}`] };
    } },
  { id: '11-counting', grade: 11, strand: 'data', title: 'Permutations and combinations', kid: 'Counting choices',
    idea: 'When order matters, count permutations nPr. When it does not, count combinations nCr = n! ÷ (r!(n − r)!).',
    method: ['Ask: does order matter?', 'Permutation: n × (n − 1) × ... (r factors).', 'Combination: permutations ÷ r!.'],
    gen() {
      const n = ri(5, 10), r = ri(2, Math.min(4, n - 1)), perm = Math.random() < .5;
      const ans = perm ? fact(n) / fact(n - r) : nCr(n, r);
      return { q: perm ? `In how many ways can ${n} runners finish 1st through ${['', '', '2nd', '3rd', '4th'][r]}?` : `How many ways can you choose ${r} books from ${n}?`, kind: 'num', answer: ans,
        hints: [perm ? 'Order matters: permutation.' : 'Order does not matter: combination.'], steps: [perm ? `${Array.from({ length: r }, (_, i) => n - i).join(' &times; ')} = ${ans}` : `${n}C${r} = ${ans}`] };
    } },
  { id: '11-matrix', grade: 11, strand: 'alg', title: 'Matrices: determinants', kid: 'Number grids',
    idea: 'The determinant of a 2 by 2 matrix [[a, b], [c, d]] is ad − bc. If it is 0, the matrix has no inverse.',
    method: ['Multiply down the main diagonal: a × d.', 'Subtract the other diagonal: b × c.'],
    gen() {
      const [a, b, c, d] = [ri(-9, 9), ri(-9, 9), ri(-9, 9), ri(-9, 9)];
      return { q: `Find the determinant of <span class="mx"><span>${neg(a)}</span><span>${neg(b)}</span><span>${neg(c)}</span><span>${neg(d)}</span></span>`, kind: 'num', answer: a * d - b * c, hints: [`${neg(a)}&middot;${paren(d)} &minus; ${paren(b)}&middot;${paren(c)}`], steps: [`${neg(a * d)} &minus; ${paren(b * c)} = ${neg(a * d - b * c)}`] };
    } },

  /* ---------- Grade 12: Precalculus and Calculus ---------- */
  { id: '12-unit', grade: 12, strand: 'trig', title: 'The unit circle', kid: 'Circle of angles',
    idea: 'On the unit circle, the point at angle θ is (cos θ, sin θ). The special angles give exact values with √2 and √3.',
    method: ['Find the reference angle (30°, 45°, 60°).', 'Use the right sign for the quadrant.', 'Type exact values like sqrt(3)/2.'],
    gen() {
      const ang = pick([0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330]), f = pick(['sin', 'cos']);
      const exact = { 0: '0', 30: '1/2', 45: 'sqrt(2)/2', 60: 'sqrt(3)/2', 90: '1' }, rad = ang * Math.PI / 180, v = f === 'sin' ? Math.sin(rad) : Math.cos(rad);
      const ref = [0, 30, 45, 60, 90].reduce((b, r) => Math.abs(Math.abs(round(Math.sin(r * Math.PI / 180), 6)) - Math.abs(round(v, 6))) < 1e-6 ? r : b, 0);
      const txt = (v < -1e-9 ? '-' : '') + exact[ref];
      return { q: `Find the exact value of ${f}(${ang}°).`, viz: V.unitCircle(ang), kind: 'expr', vars: [], answer: Math.abs(v) < 1e-9 ? '0' : txt,
        hints: [`${f === 'sin' ? 'Sine is the height (y)' : 'Cosine is the across (x)'} of the point.`], steps: [`${f}(${ang}°) = ${txt.replace('sqrt(2)', '&radic;2').replace('sqrt(3)', '&radic;3').replace('-', '&minus;')}`] };
    } },
  { id: '12-radians', grade: 12, strand: 'trig', title: 'Degrees and radians', kid: 'Angle units',
    idea: '180° equals π radians. Multiply degrees by π/180 to get radians.',
    method: ['Degrees to radians: × π/180.', 'Radians to degrees: × 180/π.', 'Type answers like 2pi/3.'],
    gen() {
      const d = pick([30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360]), toRad = Math.random() < .5, [n, den] = simp(d, 180);
      const radTxt = `${n === 1 ? '' : n}pi${den === 1 ? '' : '/' + den}`, radHtml = `${n === 1 ? '' : n}&pi;${den === 1 ? '' : '/' + den}`;
      return toRad ? { q: `Convert ${d}° to radians.`, kind: 'expr', vars: [], answer: radTxt, hints: [`${d} &times; &pi;/180`], steps: [`${radHtml}`] }
        : { q: `Convert ${radHtml} radians to degrees.`, kind: 'num', answer: d, unit: '°', hints: ['Replace &pi; with 180°.'], steps: [`${d}°`] };
    } },
  { id: '12-limits', grade: 12, strand: 'calc', title: 'Limits', kid: 'Getting closer',
    idea: 'A limit is the value a function approaches. If plugging in gives 0/0, factor and cancel first.',
    method: ['Try plugging in.', 'If you get 0/0, factor the top and cancel the common factor.', 'Plug in again.'],
    gen() {
      const a = ri(-6, 6), b = ri(-6, 6);
      return { q: `lim<sub><i>x</i>&rarr;${neg(a)}</sub> <span class="fr"><span>${poly([1, -(a + b), a * b])}</span><span><i>x</i> ${a <= 0 ? '+' : '&minus;'} ${Math.abs(a)}</span></span>`, kind: 'num', answer: a - b,
        hints: ['Plugging in gives 0/0. Factor the top.'], steps: [`${binom(-a, -b)} &divide; (<i>x</i> ${a <= 0 ? '+' : '&minus;'} ${Math.abs(a)}) = <i>x</i> ${b <= 0 ? '+' : '&minus;'} ${Math.abs(b)}`, `At <i>x</i> = ${neg(a)}: ${neg(a - b)}`] };
    } },
  { id: '12-deriv', grade: 12, strand: 'calc', title: 'Derivatives with the power rule', kid: 'Speed of change',
    idea: 'The derivative measures instant rate of change. Power rule: the derivative of xⁿ is n·xⁿ⁻¹.',
    method: ['Bring the exponent down as a multiplier.', 'Lower the exponent by 1.', 'Constants disappear.'],
    gen(lv) {
      const deg = lv === 1 ? 2 : 3, co = Array.from({ length: deg + 1 }, (_, i) => (i === 0 ? rnz(-5, 5) : ri(-9, 9)));
      const d = co.slice(0, -1).map((c, i) => c * (deg - i));
      if (Math.random() < .4) { const x = ri(-3, 3), v = d.reduce((s, c) => s * x + c, 0); return { q: `<i>f</i>(<i>x</i>) = ${poly(co)}. Find <i>f</i>&prime;(${neg(x)}), the slope at <i>x</i> = ${neg(x)}.`, viz: V.plane({ fns: [t => co.reduce((s, c) => s * t + c, 0)], range: 10 }), kind: 'num', answer: v, hints: [`<i>f</i>&prime;(<i>x</i>) = ${poly(d)}`], steps: [`<i>f</i>&prime;(<i>x</i>) = ${poly(d)}`, `<i>f</i>&prime;(${neg(x)}) = ${neg(v)}`] }; }
      return { q: `Find the derivative of <i>f</i>(<i>x</i>) = ${poly(co)}.`, kind: 'expr', answer: polyText(d), hints: ['Exponent comes down, then subtract 1 from the exponent.'], steps: [`<i>f</i>&prime;(<i>x</i>) = ${poly(d)}`] };
    } },
  { id: '12-chain', grade: 12, strand: 'calc', title: 'Product and chain rules', kid: 'Nested change',
    idea: 'Chain rule: the derivative of f(g(x)) is f′(g(x)) · g′(x). Product rule: (uv)′ = u′v + uv′.',
    method: ['Chain: derivative of the outside, keep the inside, times the derivative of the inside.', 'Product: first-prime times second, plus first times second-prime.'],
    gen() {
      const a = rnz(-4, 4), b = ri(-5, 5), n = ri(2, 5), x = ri(-2, 2), inner = a * x + b;
      return { q: `<i>f</i>(<i>x</i>) = (${poly([a, b])})${sup(n)}. Find <i>f</i>&prime;(${neg(x)}).`, kind: 'num', answer: n * inner ** (n - 1) * a,
        hints: [`<i>f</i>&prime;(<i>x</i>) = ${n}(${poly([a, b])})${sup(n - 1)} &middot; ${neg(a)}`], steps: [`Inside at <i>x</i> = ${neg(x)}: ${neg(inner)}`, `${n} &middot; ${paren(inner)}${sup(n - 1)} &middot; ${paren(a)} = ${neg(n * inner ** (n - 1) * a)}`] };
    } },
  { id: '12-integral', grade: 12, strand: 'calc', title: 'Definite integrals', kid: 'Area under a curve',
    idea: 'A definite integral adds up area under a curve. Find an antiderivative F and compute F(b) − F(a).',
    method: ['Antiderivative of xⁿ is xⁿ⁺¹ ÷ (n + 1).', 'Evaluate at the top limit, subtract the value at the bottom.', 'Fractions are fine, like 26/3.'],
    gen() {
      const co = [ri(-3, 3), ri(-4, 4), rnz(-5, 5)], lo = ri(-2, 1), hi = lo + ri(1, 3);
      const F = x => co[0] * x ** 3 / 3 + co[1] * x ** 2 / 2 + co[2] * x, ans = Math.round((F(hi) - F(lo)) * 1e9) / 1e9;
      return { q: `Evaluate &int;<sub>${neg(lo)}</sub><sup>${neg(hi)}</sup> (${poly(co)}) d<i>x</i>`, viz: V.plane({ fns: [x => co[0] * x * x + co[1] * x + co[2]], range: 8 }), kind: 'num', answer: ans, tol: 1e-4,
        hints: [`F(<i>x</i>) = ${[co[0] ? `${fr(co[0], 3)}<i>x</i><sup>3</sup>` : '', co[1] ? `${fr(co[1], 2)}<i>x</i><sup>2</sup>` : '', `${neg(co[2])}<i>x</i>`].filter(Boolean).join(' + ')}`], steps: [`F(${neg(hi)}) &minus; F(${neg(lo)}) = ${round(ans, 4)}`] };
    } },
  { id: '12-vectors', grade: 12, strand: 'trig', title: 'Vectors', kid: 'Arrows with size',
    idea: 'A vector has size and direction. Its magnitude is √(x² + y²). The dot product a·b = a₁b₁ + a₂b₂ is 0 for perpendicular vectors.',
    method: ['Magnitude: Pythagorean theorem on the components.', 'Dot product: multiply matching parts and add.'],
    gen() {
      if (Math.random() < .5) { const [p, q] = pick([[3, 4], [5, 12], [6, 8], [8, 15], [7, 24]]), s = pick([1, -1]); return { q: `Find the magnitude of the vector &lang;${neg(s * p)}, ${q}&rang;.`, kind: 'num', answer: Math.hypot(p, q), hints: ['&radic;(x<sup>2</sup> + y<sup>2</sup>)'], steps: [`&radic;(${p * p} + ${q * q}) = ${Math.hypot(p, q)}`] }; }
      const [a, b, c, d] = [ri(-6, 6), ri(-6, 6), ri(-6, 6), ri(-6, 6)];
      return { q: `Find the dot product &lang;${neg(a)}, ${neg(b)}&rang; &middot; &lang;${neg(c)}, ${neg(d)}&rang;.`, kind: 'num', answer: a * c + b * d, hints: [`${neg(a)}&middot;${paren(c)} + ${neg(b)}&middot;${paren(d)}`], steps: [`${neg(a * c)} + ${paren(b * d)} = ${neg(a * c + b * d)}`] };
    } },
  { id: '12-zscore', grade: 12, strand: 'data', title: 'Normal distributions and z-scores', kid: 'How unusual?',
    idea: 'A z-score says how many standard deviations a value is from the mean: z = (x − μ) ÷ σ. About 68% of data lies within 1 standard deviation.',
    method: ['Subtract the mean.', 'Divide by the standard deviation.'],
    gen() {
      const mu = ri(40, 100), s = ri(2, 15), z = pick([-2.5, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 2.5, 3]), x = mu + z * s;
      return { q: `Scores have mean ${mu} and standard deviation ${s}. What is the z-score of ${x}?`, kind: 'num', answer: z, hints: [`${x} &minus; ${mu} = ${x - mu}`], steps: [`${x - mu} &divide; ${s} = ${z}`] };
    } },
  { id: '12-geoinf', grade: 12, strand: 'calc', title: 'Infinite geometric series', kid: 'Forever sums',
    idea: 'If |r| < 1, the terms shrink so fast that the infinite sum is finite: S = a ÷ (1 − r).',
    method: ['Find the first term a and the ratio r.', 'Check |r| < 1.', 'S = a / (1 − r).'],
    gen() {
      const a = ri(1, 12), [rn, rd] = pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [-1, 2], [-1, 3]]);
      const t2 = a * rn / rd, t3 = a * rn * rn / (rd * rd);
      return { q: `Find the sum: ${a} + ${fr(a * rn, rd)} + ${fr(a * rn * rn, rd * rd)} + ...`, kind: 'num', answer: a / (1 - rn / rd), simplest: true,
        hints: [`Ratio r = ${fr(rn, rd)}.`], steps: [`${a} &divide; (1 &minus; ${paren(rn / rd) === String(rn / rd) ? fr(rn, rd) : '(' + fr(rn, rd) + ')'}) = ${fr(a * rd, rd - rn)}`] };
    } }
];
