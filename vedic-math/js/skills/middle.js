/* Grades 3 to 5: multiplication strategies, division, fractions, decimals, area, volume and the coordinate plane. */
import { ri, pick, shuffle, gcd, lcm, simp, fr, frRaw, mixed, factors, isPrime, round, PEOPLE, THINGS } from '../lib.js';
import * as V from '../viz.js';

/* Strategy hint for a times fact, built from facts a learner already knows */
export function factStrategy(a, b) {
  const [s, l] = a <= b ? [a, b] : [b, a];
  const S = {
    0: [`Zero groups of anything is 0.`],
    1: [`One group of ${l} is ${l}.`],
    2: [`Double ${l}: ${l} + ${l} = ${2 * l}.`],
    3: [`Double ${l} is ${2 * l}, plus one more ${l}: ${3 * l}.`],
    4: [`Double ${l} is ${2 * l}. Double again: ${4 * l}.`],
    5: [`10 &times; ${l} is ${10 * l}. Half of that is ${5 * l}.`],
    6: [`5 &times; ${l} is ${5 * l}, plus one more ${l}: ${6 * l}.`],
    7: [`5 &times; ${l} = ${5 * l} and 2 &times; ${l} = ${2 * l}. Together ${7 * l}.`],
    8: [`Double ${l} three times: ${2 * l}, ${4 * l}, ${8 * l}.`],
    9: [`10 &times; ${l} is ${10 * l}. Take away one ${l}: ${9 * l}.`],
    10: [`Ten groups: put a zero on ${l}: ${10 * l}.`],
    11: [`10 &times; ${l} is ${10 * l}, plus one more ${l}: ${11 * l}.`],
    12: [`10 &times; ${l} = ${10 * l} and 2 &times; ${l} = ${2 * l}. Together ${12 * l}.`]
  };
  return S[s] || [`${a} &times; ${b} = ${a * b}`];
}

export default [
  /* ---------- Grade 3 ---------- */
  { id: '3-mult', grade: 3, strand: 'mult', title: 'Times tables with strategies', kid: 'Times tables',
    idea: 'You only need a few facts by heart. Every other fact can be built from doubles, fives and tens.',
    method: ['× 2 is a double, × 4 doubles twice, × 8 doubles three times.', '× 5 is half of × 10. × 9 is × 10 minus one group.', '× 3, × 6 and × 7 are built from facts you know.'],
    gen(lv) {
      const a = lv === 1 ? pick([2, 5, 10, 3, 4]) : ri(2, lv === 3 ? 12 : 10), b = ri(2, lv === 3 ? 12 : 10);
      return { q: `${a} &times; ${b} = ?`, viz: a * b <= 40 && lv === 1 ? V.array(a, b) : '', kind: 'num', answer: a * b, hints: factStrategy(a, b).map(h => h.replace(/\d+\.$/, '?')), steps: factStrategy(a, b) };
    } },
  { id: '3-div', grade: 3, strand: 'mult', title: 'Division facts', kid: 'Fair sharing',
    idea: 'Division asks a multiplication question backwards: 56 ÷ 8 means 8 times what is 56?',
    method: ['Turn it around: 8 × ? = 56.', 'Use a times strategy to find the missing factor.'],
    gen(lv) {
      const b = ri(2, lv === 3 ? 12 : 10), q = ri(2, 10), who = pick(PEOPLE), th = pick(THINGS);
      const word = Math.random() < .3;
      return { q: word ? `${who} shares ${b * q} ${th} equally among ${b} friends. How many does each friend get?` : `${b * q} &divide; ${b} = ?`, kind: 'num', answer: q,
        hints: [`Think: ${b} &times; ? = ${b * q}`], steps: [`${b} &times; ${q} = ${b * q}, so ${b * q} &divide; ${b} = ${q}.`] };
    } },
  { id: '3-multtens', grade: 3, strand: 'mult', title: 'Multiply by multiples of ten', kid: 'Times tens',
    idea: '4 × 60 is 4 × 6 tens, which is 24 tens, or 240.',
    method: ['Multiply the non-zero digits.', 'Attach the zeros back on.'],
    gen(lv) {
      const a = ri(2, 9), b = ri(2, 9) * (lv === 3 ? 100 : 10);
      return { q: `${a} &times; ${b} = ?`, kind: 'num', answer: a * b,
        hints: [`${a} &times; ${b / (lv === 3 ? 100 : 10)} = ${a * b / (lv === 3 ? 100 : 10)}`], steps: [`${a} &times; ${b / (lv === 3 ? 100 : 10)} = ${a * b / (lv === 3 ? 100 : 10)}`, `Put the ${lv === 3 ? 'two zeros' : 'zero'} back: ${a * b}.`] };
    } },
  { id: '3-dist', grade: 3, strand: 'mult', title: 'Break apart to multiply', kid: 'Split and multiply',
    idea: '7 × 14 is 7 × 10 plus 7 × 4. Breaking a number apart turns a hard fact into two easy ones.',
    method: ['Split the bigger number into tens and ones.', 'Multiply each part.', 'Add the parts.'],
    gen() {
      const a = ri(3, 9), b = ri(11, 19);
      return { q: `${a} &times; ${b} = ?`, viz: V.areaModel(a, b), kind: 'num', answer: a * b,
        hints: [`${b} = 10 + ${b - 10}`], steps: [`${a} &times; 10 = ${10 * a}`, `${a} &times; ${b - 10} = ${a * (b - 10)}`, `${10 * a} + ${a * (b - 10)} = ${a * b}`] };
    } },
  { id: '3-round', grade: 3, strand: 'number', title: 'Round to tens and hundreds', kid: 'Nearest ten',
    idea: 'Rounding finds the closest friendly number. Halfway (5) rounds up.',
    method: ['Find the two tens (or hundreds) it sits between.', 'Look at the digit to the right: 5 or more rounds up.'],
    gen(lv) {
      const to = lv === 1 ? 10 : pick([10, 100]), n = to === 10 ? ri(11, 999) : ri(101, 9999), ans = Math.round(n / to) * to;
      const lo = Math.floor(n / to) * to;
      return { q: `Round ${n} to the nearest ${to}.`, viz: V.numberLine(lo, lo + to, { mark: n, step: to / 10, labelEvery: to / 2 }), kind: 'num', answer: ans,
        hints: [`${n} is between ${lo} and ${lo + to}. Which is closer?`], steps: [`Halfway is ${lo + to / 2}. ${n} ${n >= lo + to / 2 ? 'is at or past' : 'is before'} halfway, so ${ans}.`] };
    } },
  { id: '3-frac', grade: 3, strand: 'frac', title: 'Understand fractions', kid: 'Pizza parts',
    idea: 'A fraction names equal parts. The bottom number says how many parts make a whole, the top says how many you have.',
    method: ['Count all the equal parts: that is the bottom number.', 'Count the shaded parts: that is the top number.'],
    gen() {
      const d = pick([2, 3, 4, 5, 6, 8]), n = ri(1, d - 1), circle = Math.random() < .5;
      return { q: 'What fraction is shaded? Type it like 3/4.', viz: circle ? V.fracCircle(n, d) : V.fracBar(n, d), kind: 'num', answer: n / d,
        hints: [`There are ${d} equal parts in all.`], steps: [`${n} shaded out of ${d}: ${frRaw(n, d)}`] };
    } },
  { id: '3-fraccmp', grade: 3, strand: 'frac', title: 'Compare fractions', kid: 'Which is bigger?',
    idea: 'With the same bottom number, more parts is bigger. With the same top number, smaller parts (bigger bottom) means smaller.',
    method: ['Same denominator: compare the tops.', 'Same numerator: the bigger denominator is the smaller fraction.'],
    gen() {
      const same = pick(['den', 'num']); let a, b, c, d;
      if (same === 'den') { b = d = pick([4, 5, 6, 8, 10]); a = ri(1, b - 1); c = ri(1, d - 1); } else { a = c = ri(1, 3); b = ri(a + 1, 10); d = ri(a + 1, 12); }
      const ans = a / b > c / d ? '>' : a / b < c / d ? '<' : '=';
      return { q: `${frRaw(a, b)} &#9633; ${frRaw(c, d)}`, viz: V.fracBar(a, b) + V.fracBar(c, d, { cls: 'vz-teal' }), kind: 'choice', choices: ['<', '=', '>'], answer: ans,
        hints: [same === 'den' ? 'Same size parts. Who has more of them?' : 'Same number of parts. Whose parts are bigger?'], steps: [`${frRaw(a, b)} ${ans} ${frRaw(c, d)}`] };
    } },
  { id: '3-area', grade: 3, strand: 'geo', title: 'Area and perimeter', kid: 'Fill it and fence it',
    idea: 'Area counts the squares inside a shape (length × width). Perimeter is the distance around (add every side).',
    method: ['Area: rows times columns.', 'Perimeter: add all four sides, or 2 × (length + width).'],
    gen(lv) {
      const w = ri(2, lv === 1 ? 8 : 15), h = ri(2, lv === 1 ? 6 : 12), area = Math.random() < .55;
      return { q: `What is the ${area ? 'area' : 'perimeter'} of the rectangle? (${area ? 'square units' : 'units'})`, viz: V.rect(w, h, { grid: lv === 1 && w * h <= 60 }), kind: 'num', answer: area ? w * h : 2 * (w + h),
        hints: [area ? `${h} rows of ${w} squares.` : `Go around: ${w} + ${h} + ${w} + ${h}.`], steps: [area ? `${w} &times; ${h} = ${w * h}` : `2 &times; (${w} + ${h}) = ${2 * (w + h)}`] };
    } },
  { id: '3-twostep', grade: 3, strand: 'mult', title: 'Two-step word problems', kid: 'Story puzzles',
    idea: 'Find what the question asks, then solve one small step at a time.',
    method: ['Underline the question.', 'Solve the first step.', 'Use that answer for the second step.'],
    gen() {
      const who = pick(PEOPLE), th = pick(THINGS), packs = ri(3, 8), per = ri(3, 9), gave = ri(2, packs * per - 2);
      return { q: `${who} buys ${packs} packs of ${th} with ${per} in each pack, then gives away ${gave}. How many are left?`, kind: 'num', answer: packs * per - gave,
        hints: [`First find how many in all: ${packs} &times; ${per}.`], steps: [`${packs} &times; ${per} = ${packs * per}`, `${packs * per} &minus; ${gave} = ${packs * per - gave}`] };
    } },

  /* ---------- Grade 4 ---------- */
  { id: '4-mult2', grade: 4, strand: 'mult', title: 'Multi-digit multiplication', kid: 'Box method',
    idea: 'The area model splits both numbers by place value. Each small box is an easy product.',
    method: ['Split each number into tens and ones (or hundreds).', 'Multiply each pair to fill the boxes.', 'Add all the boxes.'],
    gen(lv) {
      const a = lv === 3 ? ri(101, 999) : ri(12, 99), b = ri(12, 99);
      const pa = String(a).split('').map((d, i, s) => +d * 10 ** (s.length - 1 - i)).filter(Boolean), pb = String(b).split('').map((d, i, s) => +d * 10 ** (s.length - 1 - i)).filter(Boolean);
      const parts = []; pa.forEach(x => pb.forEach(y => parts.push(x * y)));
      return { q: `${a} &times; ${b} = ?`, viz: V.areaModel(a, b), kind: 'num', answer: a * b,
        hints: [`Split: ${a} = ${pa.join(' + ')} and ${b} = ${pb.join(' + ')}`], steps: [`Boxes: ${parts.map(p => p.toLocaleString('en-US')).join(' + ')}`, `Total: ${(a * b).toLocaleString('en-US')}`] };
    } },
  { id: '4-longdiv', grade: 4, strand: 'mult', title: 'Divide with remainders', kid: 'Share and leftovers',
    idea: 'Take out big friendly chunks of the divisor (10 groups, 100 groups) until you cannot, then count what is left.',
    method: ['Take out groups of 100 or 10 of the divisor.', 'Keep going with smaller chunks.', 'Add the groups. What is left over is the remainder.'],
    gen(lv) {
      const d = ri(2, 9), q = lv === 1 ? ri(11, 40) : ri(100, 999), r = ri(0, d - 1), n = d * q + r;
      return { q: `${n} &divide; ${d} = ? remainder ?`, kind: 'fields', fields: [{ label: 'Quotient', answer: q }, { label: 'Remainder', answer: r }],
        hints: [`How many groups of ${d} in ${Math.floor(n / (d * 10)) * d * 10}?`], steps: [`${d} &times; ${q} = ${d * q}`, `${n} &minus; ${d * q} = ${r}`, `So ${q} remainder ${r}.`] };
    } },
  { id: '4-factors', grade: 4, strand: 'number', title: 'Factors, multiples and primes', kid: 'Number families',
    idea: 'Factors multiply to make a number. A prime has exactly two factors: 1 and itself.',
    method: ['Test small numbers: 2, 3, 5, 7.', 'Stop when the factor pairs start repeating.'],
    gen() {
      const type = pick(['prime', 'count', 'multiple']);
      if (type === 'prime') { const n = ri(2, 60), ans = isPrime(n) ? 'Prime' : 'Composite'; return { q: `Is ${n} prime or composite?`, kind: 'choice', choices: ['Prime', 'Composite'], answer: ans, hints: ['Try dividing by 2, 3, 5 and 7.'], steps: [ans === 'Prime' ? `${n} has only the factors 1 and ${n}.` : `${n} = ${factors(n)[1]} &times; ${n / factors(n)[1]}, so it is composite.`] }; }
      if (type === 'count') { const n = pick([12, 16, 18, 20, 24, 28, 30, 36, 40, 45, 48]), f = factors(n); return { q: `How many factors does ${n} have?`, kind: 'num', answer: f.length, hints: ['List factor pairs: 1 and ' + n + ', then 2 and ...'], steps: [`Factors: ${f.join(', ')}. That is ${f.length}.`] }; }
      const k = ri(3, 12), m = ri(2, 9); return { q: `What is the ${m}th multiple of ${k}? (The 1st is ${k}.)`, kind: 'num', answer: k * m, hints: [`${k} &times; ${m}`], steps: [`${k} &times; ${m} = ${k * m}`] };
    } },
  { id: '4-equiv', grade: 4, strand: 'frac', title: 'Equivalent fractions', kid: 'Same amount, new name',
    idea: 'Multiplying the top and bottom by the same number cuts each piece smaller without changing the amount.',
    method: ['Find what the bottom was multiplied by.', 'Multiply the top by the same number.'],
    gen() {
      const d = pick([2, 3, 4, 5, 6]), n = ri(1, d - 1), k = ri(2, 5), [a, b] = simp(n, d);
      return { q: `${frRaw(a, b)} = <span class="fr"><span>?</span><span>${b * k}</span></span>`, viz: V.fracBar(a, b) + V.fracBar(a * k, b * k, { cls: 'vz-teal' }), kind: 'num', answer: a * k,
        hints: [`${b} &times; ${k} = ${b * k}`], steps: [`Multiply top and bottom by ${k}: ${frRaw(a * k, b * k)}`] };
    } },
  { id: '4-fracadd', grade: 4, strand: 'frac', title: 'Add and subtract like fractions', kid: 'Same-size pieces',
    idea: 'When pieces are the same size, just add or subtract how many pieces. The bottom number stays.',
    method: ['Keep the denominator.', 'Add or subtract the numerators.', 'Rename as a mixed number if it is more than 1.'],
    gen() {
      const d = pick([3, 4, 5, 6, 8, 10, 12]), a = ri(1, d + 3), b = ri(1, d), sub = Math.random() < .4 && a > b;
      const n = sub ? a - b : a + b;
      return { q: `${frRaw(a, d)} ${sub ? '&minus;' : '+'} ${frRaw(b, d)} = ?`, kind: 'num', answer: n / d,
        hints: [`Keep the ${d}ths. ${a} ${sub ? '&minus;' : '+'} ${b} = ${n}.`], steps: [`${frRaw(n, d)}${gcd(n, d) > 1 || n >= d ? ' = ' + mixed(n, d) : ''}`] };
    } },
  { id: '4-fracwhole', grade: 4, strand: 'frac', title: 'Fraction times a whole number', kid: 'Groups of pieces',
    idea: '4 × 2/3 means four groups of 2/3, which is 8 thirds.',
    method: ['Multiply the whole number by the numerator.', 'Keep the denominator, then simplify.'],
    gen() {
      const w = ri(2, 9), d = pick([2, 3, 4, 5, 6, 8]), n = ri(1, d - 1);
      return { q: `${w} &times; ${frRaw(n, d)} = ?`, kind: 'num', answer: w * n / d,
        hints: [`${w} &times; ${n} = ${w * n} pieces of size ${frRaw(1, d)}`], steps: [`${frRaw(w * n, d)} = ${mixed(w * n, d)}`] };
    } },
  { id: '4-decimals', grade: 4, strand: 'frac', title: 'Tenths and hundredths', kid: 'Decimal points',
    idea: '0.7 is seven tenths. 0.25 is twenty-five hundredths. Decimals are fractions with 10 or 100 on the bottom.',
    method: ['One digit after the point: tenths.', 'Two digits after the point: hundredths.'],
    gen() {
      const hund = Math.random() < .5, n = hund ? ri(1, 99) : ri(1, 9), d = hund ? 100 : 10, toDec = Math.random() < .5;
      const dec = (n / d).toFixed(hund ? 2 : 1);
      return toDec ? { q: `Write ${frRaw(n, d)} as a decimal.`, kind: 'num', answer: n / d, hints: [hund ? 'Two places after the point for hundredths.' : 'One place after the point for tenths.'], steps: [`${frRaw(n, d)} = ${dec}`] }
        : { q: `${dec} = <span class="fr"><span>?</span><span>${d}</span></span>`, viz: V.fracBar(hund ? Math.round(n / 10) : n, 10), kind: 'num', answer: n, hints: [`Read it: ${dec} is ${n} ${hund ? 'hundredths' : 'tenths'}.`], steps: [`${dec} = ${frRaw(n, d)}`] };
    } },
  { id: '4-angles', grade: 4, strand: 'geo', title: 'Measure angles', kid: 'Angle hunter',
    idea: 'A straight line is 180°. A square corner (right angle) is 90°. Parts of an angle add up to the whole.',
    method: ['Decide whether the whole is 90° or 180°.', 'Subtract the part you know.'],
    gen() {
      const kind = pick(['straight', 'right']), tot = kind === 'straight' ? 180 : 90, b = ri(2, tot / 5 - 2) * 5;
      return { q: 'What is the missing angle?', viz: V.anglePair(kind, '?', b), kind: 'num', answer: tot - b, unit: '°',
        hints: [kind === 'straight' ? 'The two angles make a straight line: 180°.' : 'The two angles make a right angle: 90°.'], steps: [`${tot} &minus; ${b} = ${tot - b}°`] };
    } },

  /* ---------- Grade 5 ---------- */
  { id: '5-fracunlike', grade: 5, strand: 'frac', title: 'Add fractions with unlike denominators', kid: 'Make the pieces match',
    idea: 'You can only add pieces of the same size. Rename both fractions with a common denominator first.',
    method: ['Find a common denominator (the least common multiple).', 'Rename each fraction.', 'Add the numerators and simplify.'],
    gen() {
      const b = pick([2, 3, 4, 5, 6, 8]), d = pick([3, 4, 5, 6, 10, 12].filter(x => x !== b)), a = ri(1, b - 1), c = ri(1, d - 1), sub = Math.random() < .35 && a / b > c / d;
      const L = lcm(b, d), A = a * L / b, C = c * L / d, N = sub ? A - C : A + C;
      return { q: `${frRaw(a, b)} ${sub ? '&minus;' : '+'} ${frRaw(c, d)} = ?`, kind: 'num', answer: N / L, simplest: true,
        hints: [`A common denominator of ${b} and ${d} is ${L}.`, `${frRaw(a, b)} = ${frRaw(A, L)} and ${frRaw(c, d)} = ${frRaw(C, L)}`], steps: [`${frRaw(A, L)} ${sub ? '&minus;' : '+'} ${frRaw(C, L)} = ${frRaw(N, L)}`, `Simplified: ${fr(N, L)}`] };
    } },
  { id: '5-fracmult', grade: 5, strand: 'frac', title: 'Multiply fractions', kid: 'Part of a part',
    idea: '2/3 × 3/4 means two thirds of three fourths. Multiply tops, multiply bottoms.',
    method: ['Multiply the numerators.', 'Multiply the denominators.', 'Simplify (you can cancel common factors first).'],
    gen() {
      const a = ri(1, 5), b = ri(a + 1, 9), c = ri(1, 5), d = ri(c + 1, 9);
      return { q: `${frRaw(a, b)} &times; ${frRaw(c, d)} = ?`, kind: 'num', answer: a * c / (b * d), simplest: true,
        hints: [`Top: ${a} &times; ${c}. Bottom: ${b} &times; ${d}.`], steps: [`${frRaw(a * c, b * d)} = ${fr(a * c, b * d)}`] };
    } },
  { id: '5-fracdiv', grade: 5, strand: 'frac', title: 'Divide with unit fractions', kid: 'How many halves?',
    idea: '6 ÷ 1/2 asks how many halves fit in 6. Each whole holds 2 halves, so 12.',
    method: ['Whole ÷ unit fraction: multiply by the denominator.', 'Unit fraction ÷ whole: make the pieces that many times smaller.'],
    gen() {
      const w = ri(2, 9), d = ri(2, 8);
      return Math.random() < .5 ? { q: `${w} &divide; ${frRaw(1, d)} = ?`, kind: 'num', answer: w * d, hints: [`How many ${frRaw(1, d)} pieces fit in one whole? ${d}.`], steps: [`${w} &times; ${d} = ${w * d}`] }
        : { q: `${frRaw(1, d)} &divide; ${w} = ?`, kind: 'num', answer: 1 / (d * w), simplest: true, hints: [`Split each ${frRaw(1, d)} into ${w} equal parts.`], steps: [`${frRaw(1, d * w)}`] };
    } },
  { id: '5-decops', grade: 5, strand: 'frac', title: 'Add, subtract and multiply decimals', kid: 'Decimal math',
    idea: 'Line up the decimal points to add. To multiply, multiply as whole numbers then count decimal places.',
    method: ['Adding: line up the points and add place by place.', 'Multiplying: ignore the points, multiply, then put back as many decimal places as the factors had together.'],
    gen(lv) {
      const t = pick(lv === 1 ? ['add', 'sub'] : ['add', 'sub', 'mul']);
      if (t === 'mul') { const a = ri(11, 99) / 10, b = ri(2, 9) / (Math.random() < .5 ? 1 : 10); const places = (String(a).split('.')[1] || '').length + (String(b).split('.')[1] || '').length; return { q: `${a} &times; ${b} = ?`, kind: 'num', answer: round(a * b, 4), hints: [`Multiply ${Math.round(a * 10 ** ((String(a).split('.')[1] || '').length))} &times; ${Math.round(b * 10 ** ((String(b).split('.')[1] || '').length))} first.`], steps: [`Then put back ${places} decimal place${places === 1 ? '' : 's'}: ${round(a * b, 4)}`] }; }
      const a = ri(100, 9999) / 100, b = ri(100, Math.floor(a * 100)) / 100, ans = round(t === 'add' ? a + b : a - b, 2);
      return { q: `${a.toFixed(2)} ${t === 'add' ? '+' : '&minus;'} ${b.toFixed(2)} = ?`, kind: 'num', answer: ans, hints: ['Line up the decimal points.'], steps: [`${ans.toFixed(2)}`] };
    } },
  { id: '5-pow10', grade: 5, strand: 'number', title: 'Multiply and divide by powers of ten', kid: 'Slide the digits',
    idea: 'Multiplying by 10 slides every digit one place to the left. Dividing slides them right.',
    method: ['Count the zeros in 10, 100 or 1,000.', 'Slide the digits that many places (move the point).'],
    gen() {
      const p = pick([10, 100, 1000]), x = ri(12, 9999) / pick([10, 100]), mul = Math.random() < .5;
      return { q: `${x} ${mul ? '&times;' : '&divide;'} ${p.toLocaleString('en-US')} = ?`, kind: 'num', answer: round(mul ? x * p : x / p, 6),
        hints: [`Move the decimal point ${Math.log10(p)} place${p > 10 ? 's' : ''} to the ${mul ? 'right' : 'left'}.`], steps: [`${round(mul ? x * p : x / p, 6)}`] };
    } },
  { id: '5-order', grade: 5, strand: 'alg', title: 'Order of operations', kid: 'Who goes first?',
    idea: 'Parentheses first, then powers, then multiply and divide left to right, then add and subtract left to right.',
    method: ['Do what is inside parentheses.', 'Multiply and divide before adding and subtracting.'],
    gen() {
      const a = ri(2, 9), b = ri(2, 9), c = ri(2, 6), d = ri(1, 9), f = pick([0, 1, 2]);
      const forms = [[`${a} + ${b} &times; ${c}`, a + b * c, `${b} &times; ${c} = ${b * c}`], [`(${a} + ${b}) &times; ${c}`, (a + b) * c, `${a} + ${b} = ${a + b}`], [`${a * c} &divide; ${c} + ${b} &times; ${d}`, a + b * d, `${a * c} &divide; ${c} = ${a} and ${b} &times; ${d} = ${b * d}`]][f];
      return { q: `${forms[0]} = ?`, kind: 'num', answer: forms[1], hints: [`First: ${forms[2]}`], steps: [forms[2], `Answer: ${forms[1]}`] };
    } },
  { id: '5-volume', grade: 5, strand: 'geo', title: 'Volume of boxes', kid: 'Fill the box',
    idea: 'Volume counts the unit cubes that fill a box: length × width × height.',
    method: ['Find the area of the base (length × width).', 'Multiply by the height (how many layers).'],
    gen() {
      const l = ri(2, 12), w = ri(2, 8), h = ri(2, 10);
      return { q: 'What is the volume of the box in cubic units?', viz: V.prism(l, w, h), kind: 'num', answer: l * w * h,
        hints: [`Base: ${l} &times; ${w} = ${l * w}`], steps: [`${l * w} &times; ${h} = ${l * w * h}`] };
    } },
  { id: '5-coord', grade: 5, strand: 'func', title: 'Points on the coordinate plane', kid: 'Treasure map',
    idea: 'A point (x, y) means go x across, then y up. Order matters.',
    method: ['Start at the origin (0, 0).', 'Count across for x, then up for y.'],
    gen(lv) {
      const x = lv === 3 ? ri(-6, 6) : ri(0, 6), y = lv === 3 ? ri(-6, 6) : ri(0, 6);
      return { q: 'What are the coordinates of the point?', viz: V.plane({ points: [{ x, y, label: 'P' }] }), kind: 'fields', fields: [{ label: 'x', answer: x }, { label: 'y', answer: y }],
        hints: ['Across first (x), then up or down (y).'], steps: [`P is at (${x}, ${y}).`] };
    } }
];
