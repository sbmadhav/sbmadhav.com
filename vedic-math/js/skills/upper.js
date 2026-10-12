/* Grades 6 to 8: ratios, percents, integers, expressions, equations, geometry and linear relationships. */
import { ri, rnz, pick, shuffle, gcd, lcm, simp, fr, frRaw, neg, paren, round, poly, polyText, term, sup, PEOPLE, THINGS } from '../lib.js';
import * as V from '../viz.js';

export default [
  /* ---------- Grade 6 ---------- */
  { id: '6-ratio', grade: 6, strand: 'ratio', title: 'Ratios and unit rates', kid: 'Recipe scaling',
    idea: 'A ratio compares two amounts. A unit rate tells how much for one: $12 for 4 means $3 each.',
    method: ['Unit rate: divide to get "per 1".', 'Equivalent ratio: multiply both parts by the same number.'],
    gen() {
      if (Math.random() < .5) { const per = ri(2, 15), n = ri(2, 12), what = pick(['dollars', 'miles', 'pages', 'cups']); return { q: `${per * n} ${what} for ${n} items. How many ${what} for 1 item?`, kind: 'num', answer: per, hints: [`Divide: ${per * n} &divide; ${n}`], steps: [`${per * n} &divide; ${n} = ${per}`] }; }
      const a = ri(1, 9), b = ri(2, 9), k = ri(2, 8);
      return { q: `${a} : ${b} = ? : ${b * k}`, kind: 'num', answer: a * k, hints: [`${b} was multiplied by ${k}.`], steps: [`${a} &times; ${k} = ${a * k}`] };
    } },
  { id: '6-percent', grade: 6, strand: 'ratio', title: 'Percent of a number', kid: 'Percent power',
    idea: 'Percent means out of 100. 10% is a tenth, 1% is a hundredth, and you can build any percent from those.',
    method: ['Find 10% by dividing by 10.', 'Build up: 30% is 3 × 10%, 5% is half of 10%.'],
    gen(lv) {
      const p = lv === 1 ? pick([10, 20, 25, 50, 75]) : pick([5, 15, 30, 35, 40, 60, 12, 80]), n = ri(2, 40) * (p % 5 ? 25 : 10);
      return { q: `What is ${p}% of ${n}?`, kind: 'num', answer: round(p * n / 100, 4),
        hints: [`10% of ${n} is ${n / 10}.`], steps: [`${p}% = ${p}/100`, `${n} &times; ${p} &divide; 100 = ${round(p * n / 100, 4)}`] };
    } },
  { id: '6-fracdiv', grade: 6, strand: 'frac', title: 'Divide fractions', kid: 'Flip and multiply',
    idea: 'Dividing by a fraction is the same as multiplying by its reciprocal, because division asks how many groups fit.',
    method: ['Keep the first fraction.', 'Change ÷ to ×.', 'Flip the second fraction, then multiply.'],
    gen() {
      const a = ri(1, 7), b = ri(2, 9), c = ri(1, 7), d = ri(2, 9);
      return { q: `${frRaw(a, b)} &divide; ${frRaw(c, d)} = ?`, kind: 'num', answer: (a * d) / (b * c), simplest: true,
        hints: [`${frRaw(a, b)} &times; ${frRaw(d, c)}`], steps: [`${frRaw(a, b)} &times; ${frRaw(d, c)} = ${frRaw(a * d, b * c)} = ${fr(a * d, b * c)}`] };
    } },
  { id: '6-gcf', grade: 6, strand: 'number', title: 'GCF and LCM', kid: 'Shared factors',
    idea: 'The greatest common factor is the biggest number that divides both. The least common multiple is the smallest number both divide into.',
    method: ['GCF: list factors, pick the biggest shared one.', 'LCM: list multiples of the bigger number until the smaller one divides it.'],
    gen() {
      const g = ri(2, 9), a = g * ri(1, 8), b = g * ri(2, 9), isG = Math.random() < .5;
      return { q: `What is the ${isG ? 'greatest common factor' : 'least common multiple'} of ${a} and ${b}?`, kind: 'num', answer: isG ? gcd(a, b) : lcm(a, b),
        hints: [isG ? `Which numbers divide both ${a} and ${b}?` : `Multiples of ${Math.max(a, b)}: ${[1, 2, 3, 4].map(k => k * Math.max(a, b)).join(', ')}, ...`], steps: [isG ? `GCF = ${gcd(a, b)}` : `LCM = ${lcm(a, b)}`] };
    } },
  { id: '6-integers', grade: 6, strand: 'number', title: 'Add and subtract integers', kid: 'Below zero',
    idea: 'On a number line, adding a positive moves right and adding a negative moves left. Subtracting a negative is adding.',
    method: ['Turn subtraction into adding the opposite: 3 − (−5) = 3 + 5.', 'Same signs: add and keep the sign. Different signs: subtract and keep the sign of the bigger one.'],
    gen() {
      const a = rnz(-12, 12), b = rnz(-12, 12), sub = Math.random() < .5, ans = sub ? a - b : a + b;
      return { q: `${neg(a)} ${sub ? '&minus;' : '+'} ${paren(b)} = ?`, viz: V.numberLine(-20, 20, { jumps: [[a, ans, '']], step: 1, labelEvery: 5 }), kind: 'num', answer: ans,
        hints: [sub ? `Add the opposite: ${neg(a)} + ${paren(-b)}` : `Start at ${neg(a)} and move ${Math.abs(b)} to the ${b > 0 ? 'right' : 'left'}.`], steps: [`${neg(ans)}`] };
    } },
  { id: '6-exp', grade: 6, strand: 'alg', title: 'Exponents', kid: 'Power up',
    idea: 'An exponent says how many times to multiply a number by itself: 2⁵ = 2 × 2 × 2 × 2 × 2.',
    method: ['Write out the repeated multiplication.', 'Multiply step by step.'],
    gen() {
      const b = ri(2, 9), e = b <= 3 ? ri(2, 6) : ri(2, 3);
      return { q: `${b}${sup(e)} = ?`, kind: 'num', answer: b ** e, hints: [Array(e).fill(b).join(' &times; ')], steps: [`${Array(e).fill(b).join(' &times; ')} = ${b ** e}`] };
    } },
  { id: '6-eval', grade: 6, strand: 'alg', title: 'Evaluate expressions', kid: 'Plug it in',
    idea: 'A variable is a box for a number. Put the number in the box, then follow the order of operations.',
    method: ['Replace the letter with its value.', 'Multiply before you add.'],
    gen() {
      const a = ri(2, 9), b = ri(-9, 9), x = ri(-5, 9), sq = Math.random() < .3;
      const html = sq ? poly([1, a, b]) : poly([a, b]), val = sq ? x * x + a * x + b : a * x + b;
      return { q: `Find ${html} when <i>x</i> = ${neg(x)}.`, kind: 'num', answer: val, hints: [`Replace x with ${paren(x)}.`], steps: [sq ? `${paren(x)}${sup(2)} + ${a}&middot;${paren(x)} + ${paren(b)} = ${x * x} + ${a * x} + ${paren(b)} = ${val}` : `${a}&middot;${paren(x)} + ${paren(b)} = ${a * x} + ${paren(b)} = ${val}`] };
    } },
  { id: '6-onestep', grade: 6, strand: 'alg', title: 'One-step equations', kid: 'Balance puzzles',
    idea: 'An equation is a balance. Do the same thing to both sides to get the variable alone.',
    method: ['Find what is being done to x.', 'Undo it on both sides.'],
    gen() {
      const x = ri(-9, 15), a = ri(2, 12), t = pick(['add', 'mul', 'sub']);
      if (t === 'mul') return { q: `${a}<i>x</i> = ${neg(a * x)}`, viz: V.balance(`${a}<i>x</i>`, neg(a * x)), kind: 'num', answer: x, hints: [`Divide both sides by ${a}.`], steps: [`<i>x</i> = ${neg(a * x)} &divide; ${a} = ${neg(x)}`] };
      const b = ri(1, 20); const s = t === 'add' ? x + b : x - b;
      return { q: `<i>x</i> ${t === 'add' ? '+' : '&minus;'} ${b} = ${neg(s)}`, viz: V.balance(`<i>x</i> ${t === 'add' ? '+' : '&minus;'} ${b}`, neg(s)), kind: 'num', answer: x, hints: [`${t === 'add' ? 'Subtract' : 'Add'} ${b} on both sides.`], steps: [`<i>x</i> = ${neg(s)} ${t === 'add' ? '&minus;' : '+'} ${b} = ${neg(x)}`] };
    } },
  { id: '6-areatri', grade: 6, strand: 'geo', title: 'Area of triangles and parallelograms', kid: 'Shape areas',
    idea: 'A parallelogram rearranges into a rectangle: base × height. A triangle is half of a parallelogram.',
    method: ['Parallelogram: base × height.', 'Triangle: base × height ÷ 2.'],
    gen() {
      const b = ri(3, 20), h = ri(2, 15), tri = Math.random() < .6;
      return { q: `A ${tri ? 'triangle' : 'parallelogram'} has base ${b} and height ${h}. What is its area?`, viz: tri ? V.triangle({ sides: [`b = ${b}`, '', ''], right: true }) : '', kind: 'num', answer: tri ? b * h / 2 : b * h,
        hints: [tri ? 'Half of base times height.' : 'Base times height.'], steps: [tri ? `${b} &times; ${h} &divide; 2 = ${b * h / 2}` : `${b} &times; ${h} = ${b * h}`] };
    } },
  { id: '6-stats', grade: 6, strand: 'data', title: 'Mean, median, mode and range', kid: 'Middle of the data',
    idea: 'The mean shares the total equally. The median is the middle value when sorted. The range is the spread.',
    method: ['Mean: add all values, divide by how many.', 'Median: sort, take the middle (or average the two middles).', 'Range: biggest minus smallest.'],
    gen() {
      const n = pick([5, 5, 6, 7]); let data = Array.from({ length: n }, () => ri(1, 20));
      const t = pick(['mean', 'median', 'range']); const sorted = data.slice().sort((a, b) => a - b);
      if (t === 'mean') { const s = data.reduce((a, b) => a + b); const fix = (n - (s % n)) % n; data[0] += fix; }
      const s2 = data.reduce((a, b) => a + b), srt = data.slice().sort((a, b) => a - b);
      const ans = t === 'mean' ? s2 / n : t === 'range' ? srt[n - 1] - srt[0] : n % 2 ? srt[(n - 1) / 2] : (srt[n / 2 - 1] + srt[n / 2]) / 2;
      return { q: `Find the <b>${t}</b>: ${data.join(', ')}`, kind: 'num', answer: ans, hints: [t === 'mean' ? `The total is ${s2}.` : `Sorted: ${srt.join(', ')}`], steps: [t === 'mean' ? `${s2} &divide; ${n} = ${ans}` : t === 'range' ? `${srt[n - 1]} &minus; ${srt[0]} = ${ans}` : `Middle of ${srt.join(', ')} is ${ans}`] };
    } },

  /* ---------- Grade 7 ---------- */
  { id: '7-intops', grade: 7, strand: 'number', title: 'Multiply and divide integers', kid: 'Sign rules',
    idea: 'Same signs give a positive answer. Different signs give a negative answer.',
    method: ['Multiply or divide the sizes.', 'Count negatives: an even number gives +, odd gives −.'],
    gen() {
      const a = rnz(-12, 12), b = rnz(-12, 12), div = Math.random() < .4;
      return div ? { q: `${neg(a * b)} &divide; ${paren(b)} = ?`, kind: 'num', answer: a, hints: [(a * b < 0) !== (b < 0) ? 'Different signs: negative.' : 'Same signs: positive.'], steps: [`${neg(a)}`] }
        : { q: `${neg(a)} &times; ${paren(b)} = ?`, kind: 'num', answer: a * b, hints: [(a < 0) !== (b < 0) ? 'Different signs: negative.' : 'Same signs: positive.'], steps: [`${neg(a * b)}`] };
    } },
  { id: '7-twostep', grade: 7, strand: 'alg', title: 'Two-step equations', kid: 'Undo puzzles',
    idea: 'Undo operations in reverse order: first undo adding or subtracting, then undo multiplying.',
    method: ['Add or subtract to get the x term alone.', 'Divide by the coefficient.'],
    gen() {
      const a = rnz(-9, 9), x = ri(-10, 10), b = rnz(-20, 20), c = a * x + b;
      return { q: `${poly([a, b])} = ${neg(c)}`, viz: V.balance(poly([a, b]), neg(c)), kind: 'num', answer: x,
        hints: [`${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)} on both sides.`, `Then divide by ${neg(a)}.`], steps: [`${term(a, 'x', 1, true)} = ${neg(c - b)}`, `<i>x</i> = ${neg(c - b)} &divide; ${paren(a)} = ${neg(x)}`] };
    } },
  { id: '7-prop', grade: 7, strand: 'ratio', title: 'Solve proportions', kid: 'Fair scaling',
    idea: 'Two equal ratios form a proportion. Find the scale factor, or cross-multiply.',
    method: ['Look for the scale factor between matching parts.', 'Or cross-multiply and divide.'],
    gen() {
      const k = pick([2, 3, 4, 5, 1.5, 2.5]), a = k % 1 ? 2 * ri(1, 6) : ri(2, 12), b = ri(2, 12), c = a * k;
      return { q: `${frRaw(a, b)} = <span class="fr"><span>${c}</span><span><i>x</i></span></span>`, kind: 'num', answer: round(b * k, 4),
        hints: [`${a} &times; ${k} = ${c}, so multiply ${b} by ${k} too.`], steps: [`<i>x</i> = ${b} &times; ${c} &divide; ${a} = ${round(b * k, 4)}`] };
    } },
  { id: '7-pctchange', grade: 7, strand: 'ratio', title: 'Discounts, tax and percent change', kid: 'Sale shopper',
    idea: 'A 20% discount means you pay 80%. A 6% tax means you pay 106%.',
    method: ['Turn the change into a multiplier: −20% is × 0.8, +6% is × 1.06.', 'Percent change = change ÷ original × 100.'],
    gen() {
      const t = pick(['disc', 'tax', 'change']);
      if (t === 'change') { const o = ri(4, 40) * 5, p = pick([10, 20, 25, 40, 50, -10, -20, -25]), n = o * (1 + p / 100); return { q: `A price goes from $${o} to $${round(n, 2)}. What is the percent change? (Use a negative number for a decrease.)`, kind: 'num', answer: p, unit: '%', hints: [`Change: ${round(n - o, 2)}`], steps: [`${round(n - o, 2)} &divide; ${o} &times; 100 = ${p}%`] }; }
      const price = ri(8, 120), p = t === 'disc' ? pick([10, 15, 20, 25, 30, 40]) : pick([5, 6, 7, 8, 10]), m = t === 'disc' ? 1 - p / 100 : 1 + p / 100;
      return { q: `$${price} with a ${p}% ${t === 'disc' ? 'discount' : 'sales tax'}. What is the final price?`, kind: 'num', answer: round(price * m, 2), tol: 0.011, unit: '$',
        hints: [`Multiply by ${round(m, 2)}.`], steps: [`${price} &times; ${round(m, 2)} = ${round(price * m, 2).toFixed(2)}`] };
    } },
  { id: '7-circle', grade: 7, strand: 'geo', title: 'Circumference and area of circles', kid: 'Round things',
    idea: 'Circumference = 2πr (the distance around). Area = πr². π is about 3.14.',
    method: ['Find the radius (half the diameter).', 'Use 2πr for circumference, πr² for area.', 'Round to two decimal places.'],
    gen() {
      const r = ri(1, 15), area = Math.random() < .5, dia = Math.random() < .3;
      const ans = area ? Math.PI * r * r : 2 * Math.PI * r;
      return { q: `A circle has ${dia ? 'diameter ' + 2 * r : 'radius ' + r}. What is its ${area ? 'area' : 'circumference'}? Round to 2 decimal places.`, viz: V.circleFig(dia ? 2 * r : r, dia ? 'd' : 'r'), kind: 'num', answer: round(ans, 2), tol: 0.02,
        hints: [dia ? `Radius = ${2 * r} &divide; 2 = ${r}` : (area ? 'Area = &pi;r<sup>2</sup>' : 'Circumference = 2&pi;r')], steps: [area ? `&pi; &times; ${r}<sup>2</sup> = ${round(ans, 2)}` : `2 &times; &pi; &times; ${r} = ${round(ans, 2)}`] };
    } },
  { id: '7-prob', grade: 7, strand: 'data', title: 'Simple probability', kid: 'Chance it',
    idea: 'Probability = favorable outcomes ÷ all outcomes. It is always between 0 and 1.',
    method: ['Count the outcomes you want.', 'Count all possible outcomes.', 'Divide and simplify.'],
    gen() {
      const r = ri(1, 8), b = ri(1, 8), g = ri(0, 6), col = pick(['red', 'blue', 'green'].filter(c => c !== 'green' || g)), want = { red: r, blue: b, green: g }[col], tot = r + b + g;
      if (Math.random() < .3) { const f = pick([[2, 'an even number', 3], [1, 'a 6', 1], [3, 'a number greater than 4', 2], [4, 'a number less than 3', 2]]); return { q: `You roll a fair six-sided die. What is the probability of ${f[1]}?`, kind: 'num', answer: f[2] / 6, simplest: true, hints: ['There are 6 equally likely outcomes.'], steps: [`${f[2]} out of 6 = ${fr(f[2], 6)}`] }; }
      return { q: `A bag has ${r} red, ${b} blue${g ? ' and ' + g + ' green' : ''} marbles. You pick one without looking. What is the probability it is ${col}? Give a fraction.`, kind: 'num', answer: want / tot, simplest: true,
        hints: [`There are ${tot} marbles in all.`], steps: [`${want} out of ${tot} = ${fr(want, tot)}`] };
    } },
  { id: '7-like', grade: 7, strand: 'alg', title: 'Combine like terms', kid: 'Group the x\'s',
    idea: 'Like terms have the same variable part. 3x and 5x combine to 8x, but 3x and 5 do not.',
    method: ['Group the x terms and add their coefficients.', 'Group the numbers and add them.', 'Distribute first if there are parentheses.'],
    gen() {
      const a = rnz(-9, 9), b = rnz(-9, 9), c = rnz(-9, 9), d = rnz(-9, 9), dist = Math.random() < .4;
      if (dist) { const k = rnz(-6, 6); return { q: `Simplify: ${neg(k)}(${poly([a, b])}) + ${term(c, 'x', 1, true)}`, kind: 'expr', answer: polyText([k * a + c, k * b]), hints: [`Distribute: ${neg(k)} &times; each term inside.`], steps: [`${poly([k * a, k * b])} ${term(c, 'x', 1)}`, `= ${poly([k * a + c, k * b])}`] }; }
      return { q: `Simplify: ${poly([a, b])}${term(c, 'x', 1)}${term(d, 'x', 0)}`, kind: 'expr', answer: polyText([a + c, b + d]),
        hints: [`x terms: ${neg(a)} and ${neg(c)}. Numbers: ${neg(b)} and ${neg(d)}.`], steps: [`${poly([a + c, b + d])}`] };
    } },
  { id: '7-ineq', grade: 7, strand: 'alg', title: 'Solve inequalities', kid: 'Which numbers work?',
    idea: 'Solve like an equation, with one twist: multiplying or dividing by a negative flips the sign.',
    method: ['Get the x term alone.', 'Divide by the coefficient. Negative? Flip the inequality.', 'Type answers like x < 4 or x >= -2.'],
    gen() {
      const a = rnz(-6, 6), x = ri(-8, 8), b = rnz(-15, 15), op = pick(['<', '>', '<=', '>=']), c = a * x + b;
      const flip = { '<': '>', '>': '<', '<=': '>=', '>=': '<=' }, ansOp = a < 0 ? flip[op] : op, sym = o => ({ '<': '&lt;', '>': '&gt;', '<=': '&le;', '>=': '&ge;' })[o];
      return { q: `Solve: ${poly([a, b])} ${sym(op)} ${neg(c)}`, kind: 'ineq', answer: { op: ansOp, val: x },
        hints: [`${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)}, then divide by ${neg(a)}.${a < 0 ? ' Dividing by a negative flips the sign.' : ''}`], steps: [`${term(a, 'x', 1, true)} ${sym(op)} ${neg(c - b)}`, `<i>x</i> ${sym(ansOp)} ${neg(x)}`] };
    } },
  { id: '7-anglepairs', grade: 7, strand: 'geo', title: 'Complementary and supplementary angles', kid: 'Angle partners',
    idea: 'Complementary angles add to 90°. Supplementary angles add to 180°. Vertical angles are equal.',
    method: ['Name the relationship.', 'Subtract from 90° or 180°, or copy the vertical angle.'],
    gen() {
      const t = pick(['comp', 'supp', 'vert']), a = t === 'comp' ? ri(5, 85) : ri(10, 170);
      return { q: t === 'vert' ? `Two lines cross. One angle is ${a}°. What is the angle vertically opposite it?` : `An angle is ${a}°. What is its ${t === 'comp' ? 'complement' : 'supplement'}?`, kind: 'num', answer: t === 'comp' ? 90 - a : t === 'supp' ? 180 - a : a, unit: '°',
        hints: [t === 'comp' ? 'Complements add to 90°.' : t === 'supp' ? 'Supplements add to 180°.' : 'Vertical angles are equal.'], steps: [t === 'comp' ? `90 &minus; ${a} = ${90 - a}°` : t === 'supp' ? `180 &minus; ${a} = ${180 - a}°` : `${a}°`] };
    } },

  /* ---------- Grade 8 ---------- */
  { id: '8-sci', grade: 8, strand: 'number', title: 'Scientific notation', kid: 'Giant and tiny numbers',
    idea: 'Write a number as a × 10ⁿ with 1 ≤ a < 10. The exponent counts how far the decimal point moved.',
    method: ['Move the point until one non-zero digit is left of it.', 'Count the moves: left means positive n, right means negative n.'],
    gen() {
      const a = ri(11, 99) / 10, n = pick([ri(3, 9), -ri(2, 6)]), val = a * 10 ** n, str = n > 0 ? Math.round(val).toLocaleString('en-US') : val.toFixed(-n + 1);
      return { q: `${str} = ${a} &times; 10<sup>?</sup>`, kind: 'num', answer: n, hints: [`Count how many places the point moves to reach ${a}.`], steps: [`The point moved ${Math.abs(n)} places ${n > 0 ? 'left' : 'right'}, so n = ${n}.`] };
    } },
  { id: '8-exprules', grade: 8, strand: 'alg', title: 'Exponent rules', kid: 'Power rules',
    idea: 'Multiplying same bases adds exponents. Dividing subtracts them. A power of a power multiplies them.',
    method: ['xᵃ · xᵇ = xᵃ⁺ᵇ', 'xᵃ ÷ xᵇ = xᵃ⁻ᵇ', '(xᵃ)ᵇ = xᵃᵇ and x⁰ = 1.'],
    gen() {
      const a = ri(2, 9), b = ri(2, 7), t = pick(['mul', 'div', 'pow']);
      const ans = t === 'mul' ? a + b : t === 'div' ? a - b : a * b;
      const q = t === 'mul' ? `<i>x</i>${sup(a)} &middot; <i>x</i>${sup(b)}` : t === 'div' ? `<i>x</i>${sup(a)} &divide; <i>x</i>${sup(b)}` : `(<i>x</i>${sup(a)})${sup(b)}`;
      return { q: `Simplify: ${q} = <i>x</i><sup>?</sup>`, kind: 'num', answer: ans, hints: [t === 'mul' ? 'Add the exponents.' : t === 'div' ? 'Subtract the exponents.' : 'Multiply the exponents.'], steps: [`<i>x</i>${sup(ans)}`] };
    } },
  { id: '8-roots', grade: 8, strand: 'number', title: 'Square roots and cube roots', kid: 'Undo squaring',
    idea: 'The square root of 49 is 7 because 7 × 7 = 49. Non-perfect squares sit between two whole numbers.',
    method: ['Know the squares from 1 to 15 and cubes from 1 to 6.', 'To estimate, find the perfect squares on each side.'],
    gen() {
      const t = pick(['sq', 'cube', 'est']);
      if (t === 'sq') { const n = ri(2, 15); return { q: `&radic;${n * n} = ?`, kind: 'num', answer: n, hints: [`What number times itself is ${n * n}?`], steps: [`${n} &times; ${n} = ${n * n}`] }; }
      if (t === 'cube') { const n = ri(2, 6); return { q: `<sup>3</sup>&radic;${n ** 3} = ?`, kind: 'num', answer: n, hints: [`What number times itself three times is ${n ** 3}?`], steps: [`${n} &times; ${n} &times; ${n} = ${n ** 3}`] }; }
      const k = ri(2, 11), n = ri(k * k + 1, (k + 1) ** 2 - 1);
      return { q: `&radic;${n} is between which two whole numbers? Give the smaller one.`, kind: 'num', answer: k, hints: [`${k}<sup>2</sup> = ${k * k} and ${k + 1}<sup>2</sup> = ${(k + 1) ** 2}`], steps: [`${k * k} &lt; ${n} &lt; ${(k + 1) ** 2}, so &radic;${n} is between ${k} and ${k + 1}.`] };
    } },
  { id: '8-pyth', grade: 8, strand: 'geo', title: 'Pythagorean theorem', kid: 'Right triangle secret',
    idea: 'In a right triangle, a² + b² = c², where c is the long side across from the right angle.',
    method: ['Square the two sides you know.', 'Hypotenuse: add them. Leg: subtract.', 'Take the square root.'],
    gen() {
      const [p, q, h] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10], [9, 12, 15], [20, 21, 29], [9, 40, 41]]), k = pick([1, 1, 2]);
      const a = p * k, b = q * k, c = h * k, findC = Math.random() < .6;
      return findC ? { q: 'Find the hypotenuse <i>c</i>.', viz: V.triangle({ right: true, sides: [String(b), 'c', String(a)] }), kind: 'num', answer: c, hints: [`${a}<sup>2</sup> + ${b}<sup>2</sup> = ${a * a + b * b}`], steps: [`c = &radic;${a * a + b * b} = ${c}`] }
        : { q: 'Find the missing leg <i>a</i>.', viz: V.triangle({ right: true, sides: [String(b), String(c), 'a'] }), kind: 'num', answer: a, hints: [`${c}<sup>2</sup> &minus; ${b}<sup>2</sup> = ${c * c - b * b}`], steps: [`a = &radic;${c * c - b * b} = ${a}`] };
    } },
  { id: '8-slope', grade: 8, strand: 'func', title: 'Slope', kid: 'Steepness',
    idea: 'Slope is rise over run: how much y changes for each step in x.',
    method: ['Subtract the y values (rise).', 'Subtract the x values in the same order (run).', 'Divide and simplify.'],
    gen() {
      const x1 = ri(-5, 4), y1 = ri(-5, 5), dx = rnz(-4, 5), dy = ri(-6, 6), x2 = x1 + dx, y2 = y1 + dy;
      return { q: `Find the slope of the line through (${neg(x1)}, ${neg(y1)}) and (${neg(x2)}, ${neg(y2)}).`, viz: V.plane({ points: [{ x: x1, y: y1 }, { x: x2, y: y2 }], segs: [[[x1, y1], [x2, y2]]], range: 8 }), kind: 'num', answer: dy / dx, simplest: true,
        hints: [`Rise: ${neg(y2)} &minus; ${paren(y1)} = ${neg(dy)}. Run: ${neg(x2)} &minus; ${paren(x1)} = ${neg(dx)}.`], steps: [`m = ${frRaw(neg(dy), neg(dx))} = ${fr(dy, dx)}`] };
    } },
  { id: '8-lineq', grade: 8, strand: 'func', title: 'Equation of a line', kid: 'Line rules',
    idea: 'y = mx + b: m is the slope, b is where the line crosses the y-axis.',
    method: ['Find the slope m.', 'Put one point into y = mx + b and solve for b.', 'Write y = mx + b, then type the right side.'],
    gen() {
      const m = rnz(-4, 4), b = ri(-6, 6), x1 = ri(-3, 3), x2 = x1 + ri(1, 3);
      return { q: `Write the equation of the line through (${neg(x1)}, ${neg(m * x1 + b)}) and (${neg(x2)}, ${neg(m * x2 + b)}). Type the right side of <i>y</i> = ...`, viz: V.plane({ fns: [x => m * x + b], points: [{ x: x1, y: m * x1 + b }, { x: x2, y: m * x2 + b }], range: 10 }), kind: 'expr', answer: polyText([m, b]),
        hints: [`Slope m = ${neg(m)}.`, `Use (${neg(x1)}, ${neg(m * x1 + b)}): ${neg(m * x1 + b)} = ${neg(m)}&middot;${paren(x1)} + b`], steps: [`m = ${neg(m)}, b = ${neg(b)}`, `<i>y</i> = ${poly([m, b])}`] };
    } },
  { id: '8-multistep', grade: 8, strand: 'alg', title: 'Variables on both sides', kid: 'Two-sided balance',
    idea: 'Collect the x terms on one side and the numbers on the other, then divide.',
    method: ['Distribute if there are parentheses.', 'Move x terms to one side, numbers to the other.', 'Divide by the coefficient.'],
    gen() {
      const x = ri(-8, 8), a = rnz(-8, 8); let c = rnz(-8, 8); if (c === a) c = a + 1;
      const b = ri(-15, 15), d = (a - c) * x + b;
      return { q: `${poly([a, b])} = ${poly([c, d])}`, viz: V.balance(poly([a, b]), poly([c, d])), kind: 'num', answer: x,
        hints: [`Subtract ${term(c, 'x', 1, true)} from both sides.`], steps: [`${term(a - c, 'x', 1, true)} = ${neg(d - b)}`, `<i>x</i> = ${neg(x)}`] };
    } },
  { id: '8-systems', grade: 8, strand: 'func', title: 'Systems of equations', kid: 'Where lines meet',
    idea: 'The solution of a system is the point where the lines cross: it makes both equations true.',
    method: ['Elimination: add or subtract the equations so one variable cancels.', 'Solve for the other, then substitute back.'],
    gen() {
      const x = ri(-5, 5), y = ri(-5, 5); let a, b, c, d;
      do { a = rnz(-4, 4); b = rnz(-4, 4); c = rnz(-4, 4); d = rnz(-4, 4); } while (a * d === b * c);
      const e1 = a * x + b * y, e2 = c * x + d * y, lhs = (p, q) => `${term(p, 'x', 1, true)}${term(q, 'y', 1)}`;
      return { q: `Solve:<br>${lhs(a, b)} = ${neg(e1)}<br>${lhs(c, d)} = ${neg(e2)}`, viz: b && d ? V.plane({ fns: [t => (e1 - a * t) / b, t => (e2 - c * t) / d], points: [{ x, y }], range: 8 }) : '', kind: 'fields', fields: [{ label: 'x', answer: x }, { label: 'y', answer: y }],
        hints: ['Multiply one equation so a variable has opposite coefficients, then add.'], steps: [`The lines meet at (${neg(x)}, ${neg(y)}).`, `Check: ${a}&middot;${paren(x)} + ${b}&middot;${paren(y)} = ${neg(e1)}`] };
    } },
  { id: '8-transform', grade: 8, strand: 'geo', title: 'Transformations', kid: 'Slide, flip, turn',
    idea: 'Translations slide, reflections flip over a line, rotations turn around a point.',
    method: ['Translate: add to x and y.', 'Reflect over the x-axis: (x, y) → (x, −y). Over the y-axis: (−x, y).', 'Rotate 90° counterclockwise: (x, y) → (−y, x). 180°: (−x, −y).'],
    gen() {
      const x = rnz(-5, 5), y = rnz(-5, 5), t = pick(['tr', 'rx', 'ry', 'r90', 'r180']), dx = rnz(-4, 4), dy = rnz(-4, 4);
      const map = { tr: [x + dx, y + dy, `translate ${dx > 0 ? dx + ' right' : -dx + ' left'} and ${dy > 0 ? dy + ' up' : -dy + ' down'}`], rx: [x, -y, 'reflect over the x-axis'], ry: [-x, y, 'reflect over the y-axis'], r90: [-y, x, 'rotate 90° counterclockwise about the origin'], r180: [-x, -y, 'rotate 180° about the origin'] }[t];
      return { q: `Point (${neg(x)}, ${neg(y)}). Where does it go after you ${map[2]}?`, viz: V.plane({ points: [{ x, y, label: 'P' }], range: 8 }), kind: 'fields', fields: [{ label: 'x', answer: map[0] }, { label: 'y', answer: map[1] }],
        hints: [{ tr: `Add ${dx} to x and ${dy} to y.`, rx: 'Keep x, change the sign of y.', ry: 'Change the sign of x, keep y.', r90: '(x, y) becomes (&minus;y, x).', r180: 'Change both signs.' }[t]], steps: [`(${neg(map[0])}, ${neg(map[1])})`] };
    } },
  { id: '8-volume', grade: 8, strand: 'geo', title: 'Volume of cylinders, cones and spheres', kid: 'Cans and balls',
    idea: 'Cylinder: πr²h. A cone is one third of that cylinder. A sphere: (4/3)πr³.',
    method: ['Find the radius.', 'Use the right formula.', 'Round to 2 decimal places.'],
    gen() {
      const r = ri(1, 9), h = ri(2, 15), t = pick(['cyl', 'cone', 'sph']), v = t === 'cyl' ? Math.PI * r * r * h : t === 'cone' ? Math.PI * r * r * h / 3 : 4 / 3 * Math.PI * r ** 3;
      return { q: `Find the volume of a ${t === 'cyl' ? 'cylinder' : t === 'cone' ? 'cone' : 'sphere'} with radius ${r}${t === 'sph' ? '' : ' and height ' + h}. Round to 2 decimal places.`, kind: 'num', answer: round(v, 2), tol: 0.02,
        hints: [t === 'cyl' ? '&pi;r<sup>2</sup>h' : t === 'cone' ? '&frac13;&pi;r<sup>2</sup>h' : '&frac43;&pi;r<sup>3</sup>'], steps: [`${round(v, 2)}`] };
    } }
];
