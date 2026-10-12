/* Speed tricks from the Vedic mathematics sutras. Each trick has a step-by-step animator
   (steps for any numbers the learner types) and a practice generator that plugs into the skill engine.
   Explanations are written fresh; the sutra names and meanings are traditional. */
import { ri, pick } from './lib.js';

const H = (s, c = 'coral') => `<b class="hl hl-${c}">${s}</b>`;
const pad = (n, w) => String(n).padStart(w, '0');
const digits = n => String(n).split('').map(Number);

export const TRICKS = [
  { id: 'sq5', sutra: 'Ekādhikena Pūrvena', meaning: 'By one more than the one before', title: 'Square numbers ending in 5', kid: 'Fives squared in one breath', grade: 4,
    when: 'Any number that ends in 5: 35², 85², 115².',
    idea: 'Take the part before the 5, multiply it by one more than itself, then write 25 after it.',
    inputs: [{ label: 'Number ending in 5', min: 15, max: 995 }], random: () => [ri(1, 19) * 10 + 5],
    valid: ([n]) => n % 10 !== 5 ? 'Pick a number that ends in 5.' : null,
    steps([n]) { const a = (n - 5) / 10;
      return [
        { say: `The part before the 5 is ${a}.`, show: `${H(a)}5<sup>2</sup>` },
        { say: `One more than ${a} is ${a + 1}. Multiply: ${a} × ${a + 1} = ${a * (a + 1)}.`, show: `${H(a)} × ${H(a + 1, 'teal')} = ${H(a * (a + 1), 'sky')}` },
        { say: `Write 25 on the right. ${n}² = ${n * n}.`, show: `${H(a * (a + 1), 'sky')} | ${H('25', 'sun')} = <b>${n * n}</b>` }
      ]; },
    answer: ([n]) => n * n },

  { id: 'near-base', sutra: 'Nikhilam Navataścaramam Daśataḥ', meaning: 'All from 9 and the last from 10', title: 'Multiply numbers near 10, 100 or 1000', kid: 'Near-100 magic', grade: 5,
    when: 'Both numbers are close to the same power of ten: 97 × 94, 103 × 108, 996 × 989.',
    idea: 'Write how far each number is from the base. Cross-subtract (or add) one distance from the other number for the left part. Multiply the distances for the right part.',
    inputs: [{ label: 'First number', min: 6, max: 1999 }, { label: 'Second number', min: 6, max: 1999 }], random: () => { const b = pick([10, 100, 100, 1000]); const s = Math.max(2, Math.round(b * 0.12)); return [b + ri(-s, s), b + ri(-s, s)]; },
    valid: ([a, b]) => { const B = 10 ** String(Math.round((a + b) / 2)).length / 10; const base = [10, 100, 1000].find(x => Math.abs(a - x) <= x * 0.3 && Math.abs(b - x) <= x * 0.3); return base ? null : 'Both numbers need to be near the same 10, 100 or 1,000.'; },
    steps([a, b]) {
      const base = [10, 100, 1000].find(x => Math.abs(a - x) <= x * 0.3 && Math.abs(b - x) <= x * 0.3), w = String(base).length - 1;
      const da = a - base, db = b - base, left = a + db, right = da * db, sg = d => (d < 0 ? '&minus;' + -d : '+' + d);
      let L = left, R = right, carryNote = '';
      if (R < 0) { const borrow = Math.ceil(-R / base); L -= borrow; R += borrow * base; carryNote = `The right part is negative, so borrow ${borrow} from the left: ${left} &minus; ${borrow} = ${L}, and ${right} + ${borrow * base} = ${R}.`; }
      else if (R >= base) { const c = Math.floor(R / base); L += c; R -= c * base; carryNote = `The right part has too many digits, so carry ${c} to the left: ${L}, leaving ${pad(R, w)}.`; }
      const st = [
        { say: `Base ${base}. ${a} is ${sg(da)} from it and ${b} is ${sg(db)}.`, show: `${a} ${H(sg(da))}<br>${b} ${H(sg(db), 'teal')}` },
        { say: `Left part: cross ${a} with ${sg(db)}: ${a} ${db < 0 ? '&minus;' : '+'} ${Math.abs(db)} = ${left}. (${b} ${da < 0 ? '&minus;' : '+'} ${Math.abs(da)} gives the same.)`, show: `${H(left, 'sky')} | ` },
        { say: `Right part: multiply the distances: ${sg(da)} × ${sg(db)} = ${right}. It gets ${w} digit${w > 1 ? 's' : ''} because the base has ${w} zero${w > 1 ? 's' : ''}.`, show: `${H(left, 'sky')} | ${H(right < 0 ? right : pad(right, w), 'sun')}` }
      ];
      if (carryNote) st.push({ say: carryNote, show: `${H(L, 'sky')} | ${H(pad(R, w), 'sun')}` });
      st.push({ say: `So ${a} × ${b} = ${a * b}.`, show: `<b>${a * b}</b>` });
      return st;
    },
    answer: ([a, b]) => a * b },

  { id: 'crosswise', sutra: 'Ūrdhva Tiryagbhyām', meaning: 'Vertically and crosswise', title: 'Multiply any two numbers in one line', kid: 'Criss-cross multiply', grade: 5,
    when: 'Any multiplication. Fastest for 2-digit and 3-digit numbers.',
    idea: 'Work right to left one column at a time. Multiply straight down, then crosswise, then straight down again, carrying as you go.',
    inputs: [{ label: 'First number', min: 10, max: 999 }, { label: 'Second number', min: 10, max: 999 }], random: () => [ri(12, 99), ri(12, 99)],
    valid: ([a, b]) => (String(a).length !== String(b).length ? 'Use two numbers with the same number of digits.' : null),
    steps([a, b]) {
      const A = digits(a).reverse(), B = digits(b).reverse(), n = A.length, cols = [], out = [];
      for (let k = 0; k < 2 * n - 1; k++) { const pairs = []; for (let i = 0; i <= k; i++) if (i < n && k - i < n) pairs.push([A[i], B[k - i]]); cols.push(pairs); }
      let carry = 0; const res = [];
      cols.forEach((pairs, k) => {
        const s = pairs.reduce((t, [x, y]) => t + x * y, 0) + carry, dgt = s % 10, prevCarry = carry; carry = Math.floor(s / 10); res.unshift(dgt);
        const kind = pairs.length === 1 ? 'straight down' : 'crosswise';
        out.push({ say: `Column ${k + 1} (${kind}): ${pairs.map(([x, y]) => `${x}×${y}`).join(' + ')}${prevCarry ? ' + carry ' + prevCarry : ''} = ${s}. Write ${dgt}${carry ? ', carry ' + carry : ''}.`, show: `${carry ? H(carry, 'teal') : ''}${res.map((d, i) => i === 0 ? H(d, 'sun') : d).join('')}` });
      });
      if (carry) { res.unshift(carry); out.push({ say: `Bring down the last carry, ${carry}.`, show: res.join('') }); }
      out.push({ say: `So ${a} × ${b} = ${a * b}.`, show: `<b>${a * b}</b>` });
      return out;
    },
    answer: ([a, b]) => a * b },

  { id: 'from9', sutra: 'Nikhilam Navataścaramam Daśataḥ', meaning: 'All from 9 and the last from 10', title: 'Subtract from 100, 1000, 10000', kid: 'Zero-proof subtracting', grade: 3,
    when: 'Subtracting from a power of ten, like 1000 − 387 or 10000 − 2456 (change at the store).',
    idea: 'Subtract every digit from 9, except the last one, which you subtract from 10. No borrowing at all.',
    inputs: [{ label: 'Number to subtract', min: 11, max: 9999 }], random: () => { let n; do { n = ri(101, 9999); } while (n % 10 === 0); return [n]; },
    valid: ([n]) => (n % 10 === 0 ? 'Pick a number that does not end in 0.' : null),
    steps([n]) { const d = digits(n), base = 10 ** d.length, outD = d.map((x, i) => (i === d.length - 1 ? 10 - x : 9 - x));
      return [
        { say: `${base.toLocaleString('en-US')} − ${n}: write the digits of ${n}.`, show: d.map((x, i) => H(x, i === d.length - 1 ? 'teal' : 'coral')).join(' ') },
        { say: `Each digit from 9: ${d.slice(0, -1).map(x => `9−${x}=${9 - x}`).join(', ')}. The last from 10: 10−${d[d.length - 1]}=${10 - d[d.length - 1]}.`, show: outD.map((x, i) => H(x, i === d.length - 1 ? 'teal' : 'sky')).join(' ') },
        { say: `So ${base.toLocaleString('en-US')} − ${n} = ${base - n}.`, show: `<b>${base - n}</b>` }
      ]; },
    answer: ([n]) => 10 ** String(n).length - n },

  { id: 'by9s', sutra: 'Ekanyūnena Pūrvena', meaning: 'By one less than the one before', title: 'Multiply by 9, 99 or 999', kid: 'Nines made easy', grade: 4,
    when: 'Multiplying by a string of nines that has at least as many digits as the other number: 42 × 99, 357 × 999.',
    idea: 'Left part: one less than the number. Right part: subtract that left part from the nines (all from 9).',
    inputs: [{ label: 'Number', min: 2, max: 999 }, { label: 'Nines (9, 99, 999)', min: 9, max: 999 }], random: () => { const k = pick([2, 3]); return [ri(10 ** (k - 1), 10 ** k - 1), 10 ** k - 1]; },
    valid: ([n, m]) => (!/^9+$/.test(String(m)) ? 'The second number must be all nines.' : String(n).length > String(m).length ? 'Use at least as many nines as the number has digits.' : null),
    steps([n, m]) { const w = String(m).length, left = n - 1, right = m - left;
      return [
        { say: `One less than ${n} is ${left}. That is the left part.`, show: `${H(left, 'sky')} | ` },
        { say: `Right part: ${m} − ${left} = ${pad(right, w)} (all from 9).`, show: `${H(left, 'sky')} | ${H(pad(right, w), 'sun')}` },
        { say: `So ${n} × ${m} = ${n * m}.`, show: `<b>${n * m}</b>` }
      ]; },
    answer: ([n, m]) => n * m },

  { id: 'ends10', sutra: 'Antyayordaśake\'pi', meaning: 'When the last digits add to ten', title: 'Same start, last digits add to 10', kid: 'Ten-buddies multiply', grade: 5,
    when: 'Both numbers start the same and their last digits add to 10: 43 × 47, 62 × 68, 104 × 106.',
    idea: 'Multiply the shared start by one more than itself. Then multiply the last digits and write that as two digits.',
    inputs: [{ label: 'First number', min: 11, max: 999 }, { label: 'Second number', min: 11, max: 999 }], random: () => { const t = ri(1, 15), u = ri(1, 9); return [t * 10 + u, t * 10 + 10 - u]; },
    valid: ([a, b]) => (Math.floor(a / 10) !== Math.floor(b / 10) || (a % 10) + (b % 10) !== 10 ? 'The numbers must start the same and their last digits must add to 10.' : null),
    steps([a, b]) { const t = Math.floor(a / 10), u = a % 10, v = b % 10;
      return [
        { say: `Shared start: ${t}. Last digits ${u} + ${v} = 10, so the trick works.`, show: `${H(t)}${u} × ${H(t)}${v}` },
        { say: `${t} × ${t + 1} = ${t * (t + 1)}.`, show: `${H(t * (t + 1), 'sky')} | ` },
        { say: `${u} × ${v} = ${u * v}, written as two digits: ${pad(u * v, 2)}.`, show: `${H(t * (t + 1), 'sky')} | ${H(pad(u * v, 2), 'sun')}` },
        { say: `So ${a} × ${b} = ${a * b}.`, show: `<b>${a * b}</b>` }
      ]; },
    answer: ([a, b]) => a * b },

  { id: 'square-near', sutra: 'Yāvadūnam', meaning: 'Whatever the extent of its deficiency', title: 'Square numbers near a base', kid: 'Near-100 squares', grade: 6,
    when: 'Squaring numbers near 10, 100 or 1000: 97², 104², 1012².',
    idea: 'Find how far the number is from the base. Move that far again (left part), then square the distance (right part).',
    inputs: [{ label: 'Number near a base', min: 7, max: 1300 }], random: () => { const b = pick([100, 100, 1000, 10]); return [b + ri(-Math.round(b * 0.1), Math.round(b * 0.1)) || b + 3]; },
    valid: ([n]) => ([10, 100, 1000].some(x => Math.abs(n - x) <= x * 0.3) ? null : 'Pick a number near 10, 100 or 1,000.'),
    steps([n]) { const base = [10, 100, 1000].find(x => Math.abs(n - x) <= x * 0.3), w = String(base).length - 1, d = n - base; let L = n + d, R = d * d, note = '';
      if (R >= base) { const c = Math.floor(R / base); L += c; R -= c * base; note = `Too many digits on the right: carry ${c}.`; }
      const st = [
        { say: `${n} is ${d < 0 ? 'short of' : 'over'} ${base} by ${Math.abs(d)}.`, show: `${n} ${H((d < 0 ? '&minus;' : '+') + Math.abs(d))}` },
        { say: `${d < 0 ? 'Go down' : 'Go up'} by ${Math.abs(d)} again: ${n} ${d < 0 ? '&minus;' : '+'} ${Math.abs(d)} = ${n + d}.`, show: `${H(n + d, 'sky')} | ` },
        { say: `Square the distance: ${Math.abs(d)}² = ${d * d}, written with ${w} digit${w > 1 ? 's' : ''}.`, show: `${H(n + d, 'sky')} | ${H(pad(d * d, w), 'sun')}` }
      ];
      if (note) st.push({ say: note, show: `${H(L, 'sky')} | ${H(pad(R, w), 'sun')}` });
      st.push({ say: `So ${n}² = ${n * n}.`, show: `<b>${n * n}</b>` });
      return st; },
    answer: ([n]) => n * n },

  { id: 'by11', sutra: 'Ūrdhva Tiryagbhyām (special case)', meaning: 'Vertically and crosswise, with a multiplier of 11', title: 'Multiply by 11', kid: 'The 11 sandwich', grade: 3,
    when: 'Any number times 11.',
    idea: 'Keep the outside digits and fill the middle with the sums of neighbouring digits, carrying when a sum is 10 or more.',
    inputs: [{ label: 'Number', min: 10, max: 99999 }], random: () => [ri(12, 999)],
    valid: () => null,
    steps([n]) { const d = digits(n), sums = []; for (let i = 0; i < d.length - 1; i++) sums.push(d[i] + d[i + 1]);
      return [
        { say: `Write the first digit (${d[0]}) and the last digit (${d[d.length - 1]}) apart.`, show: `${H(d[0])} _ ${H(d[d.length - 1])}` },
        { say: `Neighbour sums go in between: ${sums.map((s, i) => `${d[i]}+${d[i + 1]}=${s}`).join(', ')}.`, show: `${H(d[0])} ${sums.map(s => H(s, 'teal')).join(' ')} ${H(d[d.length - 1])}` },
        { say: sums.some(s => s > 9) ? 'Any sum of 10 or more carries 1 to the left.' : 'No sums of 10 or more, so nothing to carry.', show: `<b>${n * 11}</b>` }
      ]; },
    answer: ([n]) => n * 11 },

  { id: 'div9', sutra: 'Nikhilam (division by 9)', meaning: 'All from 9: dividing by 9 with running sums', title: 'Divide by 9 with running sums', kid: 'Nine sharing', grade: 4,
    when: 'Dividing any number by 9.',
    idea: 'The quotient digits are running totals of the digits. The remainder is the total of all the digits. Fix up if the remainder is 9 or more.',
    inputs: [{ label: 'Number', min: 10, max: 99999 }], random: () => [ri(100, 9999)],
    valid: () => null,
    steps([n]) { const d = digits(n), run = []; let s = 0; d.slice(0, -1).forEach(x => { s += x; run.push(s); }); const rem0 = s + d[d.length - 1];
      return [
        { say: `Digits: ${d.join(', ')}. Running totals, leaving out the last digit: ${run.join(', ')}.`, show: run.map(x => H(x, 'sky')).join(' ') },
        { say: `Remainder start: total of all digits = ${rem0}.`, show: `${run.map(x => H(x, 'sky')).join(' ')} r ${H(rem0, 'sun')}` },
        { say: `Carry the tens of each running total to the left and take out any 9s from the remainder. Final: ${Math.floor(n / 9)} remainder ${n % 9}.`, show: `<b>${Math.floor(n / 9)} r ${n % 9}</b>` }
      ]; },
    answer: ([n]) => Math.floor(n / 9) },

  { id: 'check9', sutra: 'Guṇita Samuccayaḥ', meaning: 'The product of the sums is the sum of the product', title: 'Check answers with digit sums', kid: 'The nine checker', grade: 4,
    when: 'Checking any multiplication (or addition) answer in seconds.',
    idea: 'Add the digits of each number until one digit is left (9 counts as 0). The digit sums must multiply to the digit sum of the answer.',
    inputs: [{ label: 'First number', min: 2, max: 99999 }, { label: 'Second number', min: 2, max: 99999 }], random: () => [ri(23, 999), ri(12, 99)],
    valid: () => null,
    steps([a, b]) { const ds = n => (n % 9), p = a * b;
      return [
        { say: `Digit sum of ${a} is ${ds(a)} and of ${b} is ${ds(b)} (casting out nines).`, show: `${H(ds(a))} × ${H(ds(b), 'teal')}` },
        { say: `${ds(a)} × ${ds(b)} = ${ds(a) * ds(b)}, which reduces to ${ds(ds(a) * ds(b))}.`, show: `${H(ds(ds(a) * ds(b)), 'sky')}` },
        { say: `Digit sum of ${p} is ${ds(p)}. They match, so the product passes the check.`, show: `${H(ds(p), 'sun')} = ${H(ds(ds(a) * ds(b)), 'sky')} ✓` }
      ]; },
    answer: ([a, b]) => (a * b) % 9 },

  { id: 'recip', sutra: 'Ekādhikena Pūrvena', meaning: 'By one more than the one before', title: 'Decimals of 1/19, 1/29, 1/49', kid: 'Endless decimals', grade: 7,
    when: 'Fractions with a denominator ending in 9: 1/19, 1/29, 1/39, 1/49.',
    idea: 'The "one more" of 19 is 2 (one more than 1). Start with 1 at the right and keep multiplying by 2 leftwards, carrying, until the digits repeat.',
    inputs: [{ label: 'Denominator (19, 29, 39 or 49)', min: 19, max: 49 }], random: () => [pick([19, 29, 39, 49])],
    valid: ([d]) => ([19, 29, 39, 49].includes(d) ? null : 'Use 19, 29, 39 or 49.'),
    steps([d]) { const m = (d + 1) / 10, len = (() => { let r = 1, k = 0; do { r = (r * 10) % d; k++; } while (r !== 1); return k; })();
      let out = [1], carry = 0; const shown = [];
      while (out.length < len) { const v = out[0] * m + carry; out.unshift(v % 10); carry = Math.floor(v / 10); if (out.length <= 6) shown.push(`${out[1]} × ${m}${carry || v >= 10 ? ' + carry' : ''} → write ${v % 10}`); }
      const dec = out.join('');
      return [
        { say: `One more than ${(d - 9) / 10} is ${m}. That is the multiplier.`, show: `1/${d}: multiply by ${H(m)}` },
        { say: `Start at the right with 1. Multiply by ${m} each step, moving left: ${shown.slice(0, 4).join('; ')}...`, show: H(dec.slice(-8), 'sky') },
        { say: `After ${len} digits the pattern repeats. 1/${d} = 0.${dec}...`, show: `0.<span class="hl hl-sun" style="overflow-wrap:anywhere">${dec}</span>...` }
      ]; },
    answer: ([d]) => 1 / d },

  { id: 'transpose', sutra: 'Parāvartya Yojayet', meaning: 'Transpose and apply', title: 'Solve linear equations by transposing', kid: 'Flip and solve', grade: 7,
    when: 'Equations like ax + b = cx + d.',
    idea: 'Move terms across the equals sign and their sign flips: x = (d − b) ÷ (a − c). It is the balance method in one move.',
    inputs: [{ label: 'a', min: -20, max: 20 }, { label: 'b', min: -50, max: 50 }, { label: 'c', min: -20, max: 20 }, { label: 'd', min: -50, max: 50 }], random: () => { const x = ri(-6, 6), a = ri(2, 9), c = ri(-5, a - 1) || 1, b = ri(-12, 12); return [a, b, c, (a - c) * x + b]; },
    valid: ([a, b, c]) => (a === c ? 'a and c must be different.' : null),
    steps([a, b, c, d]) { const x = (d - b) / (a - c);
      return [
        { say: `Equation: ${a}x + ${b} = ${c}x + ${d}.`, show: `${H(a + 'x')} ${b < 0 ? '&minus;' : '+'} ${H(Math.abs(b), 'teal')} = ${H(c + 'x')} ${d < 0 ? '&minus;' : '+'} ${H(Math.abs(d), 'teal')}` },
        { say: `Transpose: x terms to the left, numbers to the right, flipping signs: (${a} − ${c})x = ${d} − ${b}.`, show: `${H(a - c)}x = ${H(d - b, 'teal')}` },
        { say: `x = ${d - b} ÷ ${a - c} = ${Math.round(x * 1000) / 1000}.`, show: `<b>x = ${Math.round(x * 1000) / 1000}</b>` }
      ]; },
    answer: ([a, b, c, d]) => (d - b) / (a - c) },

  { id: 'zero-sum', sutra: 'Śūnyam Sāmyasamuccaye', meaning: 'When the samuccaya is the same, it is zero', title: 'Spot equations whose answer is zero', kid: 'Zero spotter', grade: 9,
    when: 'Equations like (x + a)(x + b) = (x + c)(x + d) where a × b = c × d.',
    idea: 'If the constant products on both sides are equal, the x² terms and the constants cancel, leaving only an x term. So x must be 0. Spot it, skip the algebra.',
    inputs: [{ label: 'a', min: 1, max: 30 }, { label: 'b', min: 1, max: 30 }, { label: 'c', min: 1, max: 30 }, { label: 'd', min: 1, max: 60 }], random: () => pick([[2, 12, 3, 8], [3, 8, 4, 6], [2, 9, 3, 6], [4, 9, 6, 6], [2, 15, 5, 6], [3, 10, 5, 6], [1, 12, 3, 4]]),
    valid: ([a, b, c, d]) => (a * b !== c * d ? 'For this trick a × b must equal c × d.' : a + b === c + d ? 'The sums a + b and c + d must differ.' : null),
    steps([a, b, c, d]) { return [
      { say: `(x + ${a})(x + ${b}) = (x + ${c})(x + ${d}). Check the constants: ${a} × ${b} = ${a * b} and ${c} × ${d} = ${c * d}. Equal.`, show: `${H(a * b)} = ${H(c * d)}` },
      { say: `Expanding both sides, x² and ${a * b} cancel, leaving ${a + b}x = ${c + d}x.`, show: `${H((a + b) + 'x', 'teal')} = ${H((c + d) + 'x', 'teal')}` },
      { say: `Since ${a + b} ≠ ${c + d}, the only answer is x = 0.`, show: '<b>x = 0</b>' }
    ]; },
    answer: () => 0 }
];


/* Deeper sutras: proportional bases, observation (roots), osculation, duplex squaring and simultaneous equations */
TRICKS.push(
  { id: 'times5', sutra: 'Ānurūpyeṇa', meaning: 'Proportionately', title: 'Multiply by 5, 25, 50 and 125', kid: 'Halve the tens', grade: 3,
    when: 'Multiplying by 5, 25, 50 or 125.',
    idea: '5 is 10 ÷ 2, 25 is 100 ÷ 4, 50 is 100 ÷ 2 and 125 is 1000 ÷ 8. Multiply by the easy power of ten, then divide.',
    inputs: [{ label: 'Number', min: 2, max: 9999 }, { label: 'Times (5, 25, 50 or 125)', min: 5, max: 125 }], random: () => { const m = pick([5, 25, 50, 125]); return [m === 125 ? 8 * ri(2, 40) : m === 25 ? 4 * ri(3, 60) : 2 * ri(6, 99), m]; },
    valid: ([, m]) => ([5, 25, 50, 125].includes(m) ? null : 'Use 5, 25, 50 or 125.'),
    steps([n, m]) { const p = { 5: [10, 2], 25: [100, 4], 50: [100, 2], 125: [1000, 8] }[m];
      return [
        { say: `${m} is ${p[0]} ÷ ${p[1]}.`, show: `${H(m)} = ${H(p[0], 'teal')} ÷ ${H(p[1], 'sky')}` },
        { say: `${n} × ${p[0]} = ${n * p[0]}.`, show: `${H(n * p[0], 'teal')}` },
        { say: `${n * p[0]} ÷ ${p[1]} = ${n * m}.`, show: `<b>${n * m}</b>` }
      ]; },
    answer: ([n, m]) => n * m, q: v => `${v[0]} &times; ${v[1]} = ?` },

  { id: 'sub-base', sutra: 'Ānurūpyeṇa', meaning: 'Proportionately', title: 'Multiply with a working base like 50', kid: 'Secret base', grade: 6,
    when: 'Both numbers sit near 20, 30, 40, 50 ... like 46 × 43 or 52 × 48.',
    idea: 'Use a working base such as 50 = 5 × 10. Do the near-base trick from 10, then multiply the left part by 5.',
    inputs: [{ label: 'First number', min: 11, max: 99 }, { label: 'Second number', min: 11, max: 99 }], random: () => { const k = ri(3, 8), b = 10 * k; return [b + ri(-5, 5), b + ri(-5, 5)]; },
    valid: ([a, b]) => { const k = Math.round((a + b) / 20); return k >= 2 && k <= 9 && Math.abs(a - 10 * k) <= 9 && Math.abs(b - 10 * k) <= 9 ? null : 'Pick two numbers near the same 20, 30, 40, ... 90.'; },
    steps([a, b]) { const k = Math.round((a + b) / 20), W = 10 * k, da = a - W, db = b - W, cross = a + db, left = cross * k, right = da * db, sg = d => (d < 0 ? '&minus;' + -d : '+' + d);
      return [
        { say: `Working base ${W} = ${k} × 10. ${a} is ${sg(da)} and ${b} is ${sg(db)} from it.`, show: `${a} ${H(sg(da))}<br>${b} ${H(sg(db), 'teal')}` },
        { say: `Cross: ${a} ${db < 0 ? '−' : '+'} ${Math.abs(db)} = ${cross}. Scale by ${k}: ${cross} × ${k} = ${left}.`, show: `${H(left, 'sky')} | ` },
        { say: `Right part: ${sg(da)} × ${sg(db)} = ${right}. Combine: ${left} × 10 ${right < 0 ? '−' : '+'} ${Math.abs(right)} = ${a * b}.`, show: `${H(left, 'sky')} | ${H(right, 'sun')} → <b>${a * b}</b>` }
      ]; },
    answer: ([a, b]) => a * b, q: v => `${v[0]} &times; ${v[1]} = ?` },

  { id: 'duplex', sutra: 'Ūrdhva Tiryagbhyām (duplex)', meaning: 'Vertically and crosswise, used for squares', title: 'Square any two-digit number', kid: 'Square in one line', grade: 6,
    when: 'Squaring any two-digit number, like 47² or 83².',
    idea: 'For ab²: write a², then 2 × a × b in the middle, then b², and carry from right to left.',
    inputs: [{ label: 'Two-digit number', min: 10, max: 99 }], random: () => [ri(13, 99)],
    valid: ([n]) => (n < 10 || n > 99 ? 'Pick a two-digit number.' : null),
    steps([n]) { const a = Math.floor(n / 10), b = n % 10;
      return [
        { say: `Digits ${a} and ${b}. Left: ${a}² = ${a * a}. Middle: 2 × ${a} × ${b} = ${2 * a * b}. Right: ${b}² = ${b * b}.`, show: `${H(a * a)} | ${H(2 * a * b, 'teal')} | ${H(b * b, 'sky')}` },
        { say: 'Keep one digit in each of the middle and right spots and carry the rest leftwards.', show: `${H(a * a)} | ${H(2 * a * b, 'teal')} | ${H(b * b, 'sky')}` },
        { say: `So ${n}² = ${n * n}.`, show: `<b>${n * n}</b>` }
      ]; },
    answer: ([n]) => n * n, q: v => `${v[0]}<sup>2</sup> = ?` },

  { id: 'sqroot', sutra: 'Vilokanam', meaning: 'By mere observation', title: 'Square roots by looking', kid: 'Root detective', grade: 7,
    when: 'Square roots of perfect squares up to 9801.',
    idea: 'The last digit narrows the answer to two choices. The front digits give the tens. One comparison with a square ending in 5 picks the winner.',
    inputs: [{ label: 'Perfect square', min: 121, max: 9801 }], random: () => { let r; do { r = ri(11, 99); } while (r % 10 === 0); return [r * r]; },
    valid: ([n]) => { const r = Math.round(Math.sqrt(n)); return r * r !== n || r < 11 || r > 99 || r % 10 === 0 ? 'Pick a perfect square of 11 to 99 (not ending in 0).' : null; },
    steps([n]) { const r = Math.round(Math.sqrt(n)), last = n % 10, map = { 1: [1, 9], 4: [2, 8], 9: [3, 7], 6: [4, 6], 5: [5, 5] }[last], front = Math.floor(n / 100), t = Math.floor(Math.sqrt(front)), mid = (10 * t + 5) ** 2;
      return [
        { say: `It ends in ${last}, so the root ends in ${map[0]}${map[1] !== map[0] ? ' or ' + map[1] : ''}.`, show: `…${H(last)} → ${H(map[0], 'teal')}${map[1] !== map[0] ? ' / ' + H(map[1], 'teal') : ''}` },
        { say: `Front part ${front}: the biggest square below it is ${t}² = ${t * t}, so the tens digit is ${t}.`, show: `${H(front, 'sky')} → ${H(t, 'sky')}_` },
        { say: `${t}5² = ${mid}. ${n} is ${n > mid ? 'bigger' : 'smaller'}, so pick the ${n > mid ? 'bigger' : 'smaller'} choice: ${r}.`, show: `<b>√${n} = ${r}</b>` }
      ]; },
    answer: ([n]) => Math.round(Math.sqrt(n)), q: v => `&radic;${v[0]} = ?` },

  { id: 'cuberoot', sutra: 'Vilokanam', meaning: 'By mere observation', title: 'Cube roots in two seconds', kid: 'Cube root magic', grade: 8,
    when: 'Cube roots of perfect cubes up to 970299 (roots up to 99).',
    idea: 'Each last digit of a cube comes from exactly one last digit of the root. The thousands part tells the tens digit.',
    inputs: [{ label: 'Perfect cube', min: 1000, max: 970299 }], random: () => [ri(11, 99) ** 3],
    valid: ([n]) => { const r = Math.round(Math.cbrt(n)); return r ** 3 !== n || r < 10 || r > 99 ? 'Pick a perfect cube of a number from 10 to 99.' : null; },
    steps([n]) { const r = Math.round(Math.cbrt(n)), last = n % 10, map = { 0: 0, 1: 1, 2: 8, 3: 7, 4: 4, 5: 5, 6: 6, 7: 3, 8: 2, 9: 9 }, front = Math.floor(n / 1000), t = Math.floor(Math.cbrt(front + 0.5));
      return [
        { say: `Last digit ${last} → root ends in ${map[last]} (2 and 8 swap, 3 and 7 swap, the rest stay).`, show: `…${H(last)} → ${H(map[last], 'teal')}` },
        { say: `Drop the last three digits: ${front}. Biggest cube not above it: ${t}³ = ${t ** 3}. Tens digit ${t}.`, show: `${H(front, 'sky')} → ${H(t, 'sky')}` },
        { say: `So the cube root of ${n.toLocaleString('en-US')} is ${r}.`, show: `<b>∛${n.toLocaleString('en-US')} = ${r}</b>` }
      ]; },
    answer: ([n]) => Math.round(Math.cbrt(n)), q: v => `<sup>3</sup>&radic;${v[0].toLocaleString('en-US')} = ?` },

  { id: 'osculator', sutra: 'Veṣṭanam (with Ekādhika)', meaning: 'By osculation', title: 'Divisibility by 7, 13, 19 and 29', kid: 'Divisible or not?', grade: 7,
    when: 'Testing if a big number divides by 7, 13, 19 or 29.',
    idea: 'Each divisor has a magic multiplier (7 → 5, 13 → 4, 19 → 2, 29 → 3). Chop off the last digit, multiply it by the magic number and add it to the rest. Repeat until small.',
    inputs: [{ label: 'Number', min: 20, max: 999999 }, { label: 'Divisor (7, 13, 19, 29)', min: 7, max: 29 }], random: () => { const d = pick([7, 13, 19, 29]); return [Math.random() < .6 ? d * ri(20, 9000) : ri(200, 99999), d]; },
    valid: ([, d]) => ([7, 13, 19, 29].includes(d) ? null : 'Use 7, 13, 19 or 29.'),
    steps([n, d]) { const k = { 7: 5, 13: 4, 19: 2, 29: 3 }[d], st = [{ say: `The magic multiplier for ${d} is ${k}${d === 7 ? ' (because 7 × 7 = 49 and one more than 4 is 5)' : ''}.`, show: `${d} → ${H(k)}` }]; let x = n, guard = 0;
      while (x > 4 * d && guard++ < 8) { const last = x % 10, rest = Math.floor(x / 10), nx = rest + last * k; st.push({ say: `${x}: ${rest} + ${last} × ${k} = ${nx}.`, show: `${H(rest, 'sky')} + ${H(last, 'teal')} × ${k} = ${H(nx, 'sun')}` }); x = nx; }
      st.push({ say: `${x} ${x % d === 0 ? 'is' : 'is not'} a multiple of ${d}, so ${n} ${n % d === 0 ? 'is' : 'is not'} divisible by ${d}.`, show: `<b>${n % d === 0 ? 'Yes' : 'No'}</b>` });
      return st; },
    answer: ([n, d]) => (n % d === 0 ? 'Yes' : 'No'), q: v => `Is ${v[0]} divisible by ${v[1]}?`, choice: ['Yes', 'No'] },

  { id: 'add-sub', sutra: 'Saṅkalana-Vyavakalanābhyām', meaning: 'By adding and by subtracting', title: 'Solve swapped equations instantly', kid: 'Mirror equations', grade: 9,
    when: 'Two equations with swapped coefficients, like 5x + 3y = 13 and 3x + 5y = 11.',
    idea: 'Add them to get x + y, subtract them to get x − y. Then add and halve.',
    inputs: [{ label: 'a', min: 1, max: 20 }, { label: 'b', min: 1, max: 20 }, { label: 'c', min: -200, max: 200 }, { label: 'd', min: -200, max: 200 }], random: () => { let a, b; do { a = ri(2, 9); b = ri(1, 9); } while (a === b); const x = ri(-6, 9), y = ri(-6, 9); return [a, b, a * x + b * y, b * x + a * y]; },
    valid: ([a, b, c, d]) => (a === b ? 'a and b must differ.' : (c + d) % (a + b) || (c - d) % (a - b) || ((c + d) / (a + b) + (c - d) / (a - b)) % 2 ? 'Those numbers do not give whole-number answers. Try New numbers.' : null),
    steps([a, b, c, d]) { const s = (c + d) / (a + b), t = (c - d) / (a - b), x = (s + t) / 2, y = (s - t) / 2;
      return [
        { say: `${a}x + ${b}y = ${c} and ${b}x + ${a}y = ${d}. The numbers are swapped.`, show: `${H(a)}x + ${H(b, 'teal')}y = ${c}<br>${H(b, 'teal')}x + ${H(a)}y = ${d}` },
        { say: `Add: ${a + b}(x + y) = ${c + d}, so x + y = ${s}. Subtract: ${a - b}(x − y) = ${c - d}, so x − y = ${t}.`, show: `x + y = ${H(s, 'sky')}<br>x − y = ${H(t, 'sun')}` },
        { say: `x = (${s} + ${t}) ÷ 2 = ${x}, y = (${s} − ${t}) ÷ 2 = ${y}.`, show: `<b>x = ${x}, y = ${y}</b>` }
      ]; },
    answer: ([a, b, c, d]) => ((c + d) / (a + b) + (c - d) / (a - b)) / 2,
    q: v => `Solve:<br>${v[0]}<i>x</i> + ${v[1]}<i>y</i> = ${v[2]}<br>${v[1]}<i>x</i> + ${v[0]}<i>y</i> = ${v[3]}`,
    fields: v => { const s = (v[2] + v[3]) / (v[0] + v[1]), t = (v[2] - v[3]) / (v[0] - v[1]); return [{ label: 'x', answer: (s + t) / 2 }, { label: 'y', answer: (s - t) / 2 }]; } },

  { id: 'ratio-zero', sutra: '(Ānurūpye) Śūnyamanyat', meaning: 'If one is in ratio, the other is zero', title: 'Spot the zero in two equations', kid: 'Zero spy', grade: 9,
    when: 'Two equations where one letter\'s numbers are in the same ratio as the answers.',
    idea: 'If the y numbers are in the same ratio as the right-hand sides, x must be zero (and the other way round). Then y is one division away.',
    inputs: [{ label: 'a (x in eq 1)', min: 1, max: 30 }, { label: 'b (y in eq 1)', min: 1, max: 30 }, { label: 'c (answer 1)', min: 1, max: 200 }, { label: 'k (scale for eq 2)', min: 2, max: 9 }], random: () => { const b = ri(2, 9), y = ri(1, 9); return [ri(2, 20), b, b * y, ri(2, 5)]; },
    valid: ([, b, c]) => (c % b ? 'Pick c as a multiple of b so y is a whole number.' : null),
    steps([a, b, c, k]) { const a2 = a * k + 1;
      return [
        { say: `${a}x + ${b}y = ${c} and ${a2}x + ${b * k}y = ${c * k}.`, show: `${a}x + ${H(b)}y = ${H(c, 'teal')}<br>${a2}x + ${H(b * k)}y = ${H(c * k, 'teal')}` },
        { say: `y numbers ${b} : ${b * k} are in the same ratio as ${c} : ${c * k}. So x = 0.`, show: `${H('x = 0', 'sky')}` },
        { say: `Then ${b}y = ${c}, so y = ${c / b}.`, show: `<b>x = 0, y = ${c / b}</b>` }
      ]; },
    answer: ([, b, c]) => c / b,
    q: v => `Solve:<br>${v[0]}<i>x</i> + ${v[1]}<i>y</i> = ${v[2]}<br>${v[0] * v[3] + 1}<i>x</i> + ${v[1] * v[3]}<i>y</i> = ${v[2] * v[3]}`,
    fields: v => [{ label: 'x', answer: 0 }, { label: 'y', answer: v[2] / v[1] }] }
);

/* Dojo belts: the order tricks are learned in, from first steps to black belt */
export const BELTS = [
  { id: 'white', name: 'White belt', color: 'var(--belt-white)', tricks: ['from9', 'by11', 'times5'] },
  { id: 'yellow', name: 'Yellow belt', color: 'var(--sun)', tricks: ['sq5', 'by9s', 'ends10'] },
  { id: 'orange', name: 'Orange belt', color: 'var(--coral)', tricks: ['near-base', 'square-near', 'check9'] },
  { id: 'green', name: 'Green belt', color: 'var(--teal)', tricks: ['crosswise', 'duplex', 'sub-base'] },
  { id: 'blue', name: 'Blue belt', color: 'var(--sky)', tricks: ['div9', 'osculator', 'recip'] },
  { id: 'purple', name: 'Purple belt', color: 'var(--plum)', tricks: ['sqroot', 'cuberoot', 'transpose'] },
  { id: 'black', name: 'Black belt', color: 'var(--belt-black)', tricks: ['add-sub', 'ratio-zero', 'zero-sum'] }
];

/* Practice problems for each trick, so tricks run through the same mastery engine as skills */
/* Turn a trick and its numbers into a practice problem (shared by practice, Dojo katas and the Arena) */
export function problemFor(t, vals) {
  const steps = t.steps(vals).map(s => s.say);
  const q = t.q ? t.q(vals) : {
    sq5: `${vals[0]}<sup>2</sup> = ?`, 'near-base': `${vals[0]} &times; ${vals[1]} = ?`, crosswise: `${vals[0]} &times; ${vals[1]} = ?`, from9: `${(10 ** String(vals[0]).length).toLocaleString('en-US')} &minus; ${vals[0]} = ?`,
    by9s: `${vals[0]} &times; ${vals[1]} = ?`, ends10: `${vals[0]} &times; ${vals[1]} = ?`, 'square-near': `${vals[0]}<sup>2</sup> = ?`, by11: `${vals[0]} &times; 11 = ?`,
    div9: `${vals[0]} &divide; 9 = ? remainder ?`, check9: `Casting out nines (answer 0 to 8), what is the digit sum of ${vals[0]} &times; ${vals[1]}?`, recip: `What is the first decimal digit of 1/${vals[0]} that is not 0?`,
    transpose: `Solve: ${vals[0]}<i>x</i> ${vals[1] < 0 ? '&minus;' : '+'} ${Math.abs(vals[1])} = ${vals[2]}<i>x</i> ${vals[3] < 0 ? '&minus;' : '+'} ${Math.abs(vals[3])}`, 'zero-sum': `Solve: (<i>x</i> + ${vals[0]})(<i>x</i> + ${vals[1]}) = (<i>x</i> + ${vals[2]})(<i>x</i> + ${vals[3]})`
  }[t.id];
  if (t.fields) return { q, kind: 'fields', fields: t.fields(vals), hints: [steps[0]], steps };
  if (t.choice) return { q, kind: 'choice', choices: t.choice, answer: t.answer(vals), hints: [steps[0]], steps };
  if (t.id === 'div9') return { q, kind: 'fields', fields: [{ label: 'Quotient', answer: Math.floor(vals[0] / 9) }, { label: 'Remainder', answer: vals[0] % 9 }], hints: [steps[0]], steps };
  if (t.id === 'recip') {
    if (vals[1]) { let r = 1, dg = 0; for (let i = 0; i < vals[1]; i++) { r *= 10; dg = Math.floor(r / vals[0]); r %= vals[0]; } return { q: `1/${vals[0]} = 0.&hellip; What is digit number ${vals[1]} after the decimal point?`, kind: 'num', answer: dg, hints: [steps[0], steps[1]], steps }; }
    const first = String(1 / vals[0]).replace(/^0\.0*/, '')[0]; return { q, kind: 'num', answer: +first, hints: [steps[0]], steps };
  }
  return { q, kind: 'num', answer: t.answer(vals), hints: [steps[0], steps[1]], steps };
}

export const TRICK_SKILLS = TRICKS.map(t => ({
  id: 'v-' + t.id, grade: 'V', strand: 'tricks', title: t.title, kid: t.kid, idea: t.idea, method: [t.when, ...t.steps(t.random()).map(s => s.say).slice(0, 2)], trick: t.id,
  gen() { let vals; do { vals = t.random(); } while (t.valid(vals)); return problemFor(t, vals); }
}));
