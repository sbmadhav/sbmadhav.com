/* Grades K to 2: counting, number bonds, make ten, place value, adding and subtracting, time and money.
   Concrete first (counters, ten frames, blocks), then pictures, then numbers. */
import { ri, pick, shuffle, PEOPLE, THINGS } from '../lib.js';
import * as V from '../viz.js';

const choicesNum = (ans, spread = 3, min = 0) => shuffle([...new Set([ans, ...shuffle([-spread, -2, -1, 1, 2, spread].map(d => ans + d).filter(v => v >= min)).slice(0, 3)])]).map(String);

export default [
  /* ---------- Kindergarten ---------- */
  { id: 'k-count', grade: 'K', strand: 'number', title: 'Count objects to 20', kid: 'How many dots?',
    idea: 'Counting means saying one number for each thing, and the last number you say tells how many.',
    method: ['Touch each dot once as you say a number.', 'Use the ten frame: a full frame is 10, so start at 10 and count on.'],
    gen(lv) {
      const n = lv === 1 ? ri(1, 10) : ri(8, 20);
      return { q: 'How many dots are there?', viz: V.tenFrame(n), kind: 'num', answer: n,
        hints: [n > 10 ? 'The top frame is full. That is 10. Count on from 10.' : 'Count the top row first. A full row is 5.'],
        steps: [n > 10 ? `10 in the full frame, then ${n - 10} more: ${n}.` : n > 5 ? `5 on top, then ${n - 5} more: ${n}.` : `There are ${n} dots.`] };
    } },
  { id: 'k-compare', grade: 'K', strand: 'number', title: 'More, fewer or the same', kid: 'Which has more?',
    idea: 'Line two groups up one to one. The group with leftovers has more.',
    method: ['Match each dot in one row with a dot in the other.', 'Extra dots mean that row has more.'],
    gen(lv) {
      const a = ri(1, lv === 1 ? 8 : 15); let b = ri(1, lv === 1 ? 8 : 15); if (lv === 1 && Math.random() < .2) b = a;
      const ans = a === b ? 'Same' : a > b ? 'Row A' : 'Row B';
      return { q: 'Which row has more dots?', viz: V.rows(a, b), kind: 'choice', choices: ['Row A', 'Row B', 'Same'], answer: ans,
        hints: ['Match the dots one to one, left to right.'], steps: [`Row A has ${a} and row B has ${b}. ${ans === 'Same' ? 'They are the same.' : ans + ' has more.'}`] };
    } },
  { id: 'k-next', grade: 'K', strand: 'number', title: 'Number before and after', kid: 'What comes next?',
    idea: 'Each number is one more than the number before it.',
    method: ['After means one more.', 'Before means one less.'],
    gen(lv) {
      const n = ri(1, lv === 1 ? 19 : lv === 2 ? 99 : 999), after = Math.random() < .6;
      return { q: `What number comes ${after ? 'right after' : 'right before'} <b>${n}</b>?`, viz: lv === 1 ? V.numberLine(Math.max(0, n - 5), Math.max(0, n - 5) + 10, { mark: n }) : '', kind: 'num', answer: after ? n + 1 : n - 1,
        hints: [after ? 'One more. Hop one step to the right on the number line.' : 'One less. Hop one step to the left.'], steps: [`${n} ${after ? '+' : '&minus;'} 1 = ${after ? n + 1 : n - 1}`] };
    } },
  { id: 'k-bonds', grade: 'K', strand: 'add', title: 'Number bonds to 5 and 10', kid: 'Partners that make 10',
    idea: 'A number bond shows a whole and its two parts. Knowing the partners of 10 by heart makes every later step faster.',
    method: ['Look at the ten frame. Count the empty boxes.', 'Partners of 10: 1 and 9, 2 and 8, 3 and 7, 4 and 6, 5 and 5.'],
    gen(lv) {
      const whole = lv === 1 ? 5 : 10, a = ri(0, whole);
      return { q: `${a} and how many more make <b>${whole}</b>?`, viz: V.tenFrame(a, 0, 1), kind: 'num', answer: whole - a,
        hints: ['Count the empty boxes in the frame.'], steps: [`${a} + ${whole - a} = ${whole}. The partner of ${a} is ${whole - a}.`] };
    } },
  { id: 'k-add10', grade: 'K', strand: 'add', title: 'Add within 10', kid: 'Put together',
    idea: 'Adding puts two groups together. Start with the bigger number and count on.',
    method: ['Start at the bigger number.', 'Count on the smaller one: say the next numbers.'],
    gen() {
      const a = ri(0, 9), b = ri(0, 10 - a), who = pick(PEOPLE), th = pick(THINGS);
      return { q: Math.random() < .4 ? `${who} has ${a} ${th} and gets ${b} more. How many now?` : `${a} + ${b} = ?`, viz: V.tenFrame(a, b, 1), kind: 'num', answer: a + b,
        hints: [`Start at ${Math.max(a, b)} and count on ${Math.min(a, b)}.`], steps: [`${Math.max(a, b)}, then count on ${Math.min(a, b)}: ${a + b}.`] };
    } },
  { id: 'k-sub10', grade: 'K', strand: 'add', title: 'Subtract within 10', kid: 'Take away',
    idea: 'Subtracting takes some away. You can also ask: what do I add to the small number to get the big one?',
    method: ['Take away and count what is left.', 'Or think addition: 7 minus 4 is the partner of 4 that makes 7.'],
    gen() {
      const a = ri(1, 10), b = ri(0, a);
      return { q: `${a} &minus; ${b} = ?`, viz: V.tenFrame(a - b, b, 1), kind: 'num', answer: a - b,
        hints: [`The teal dots are the ${b} taken away. Count the coral dots.`, `Think: ${b} + ? = ${a}`], steps: [`${b} + ${a - b} = ${a}, so ${a} &minus; ${b} = ${a - b}.`] };
    } },
  { id: 'k-teens', grade: 'K', strand: 'number', title: 'Ten and some more', kid: 'Teen numbers',
    idea: 'Every teen number is one ten and some ones. 14 is 10 and 4.',
    method: ['The full frame is the ten.', 'The extra dots are the ones.'],
    gen() {
      const n = ri(11, 19), askOnes = Math.random() < .7;
      return { q: askOnes ? `${n} = 10 + ?` : `10 + ${n - 10} = ?`, viz: V.tenFrame(10, n - 10, 2), kind: 'num', answer: askOnes ? n - 10 : n,
        hints: ['One full frame is 10. Count the dots in the second frame.'], steps: [`${n} is one ten and ${n - 10} ones.`] };
    } },
  { id: 'k-shapes', grade: 'K', strand: 'geo', title: 'Name the shape', kid: 'Shape detective',
    idea: 'Shapes are named by their sides and corners. A triangle has 3 sides, a square has 4 equal sides.',
    method: ['Count the straight sides.', 'Check if the sides are all the same length.'],
    gen(lv) {
      const all = lv === 1 ? ['circle', 'square', 'triangle', 'rectangle'] : ['circle', 'square', 'triangle', 'rectangle', 'pentagon', 'hexagon', 'rhombus', 'trapezoid', 'octagon'];
      const s = pick(all), opts = shuffle([s, ...shuffle(all.filter(x => x !== s)).slice(0, 3)]);
      const sides = { circle: 0, square: 4, triangle: 3, rectangle: 4, pentagon: 5, hexagon: 6, rhombus: 4, trapezoid: 4, octagon: 8 }[s];
      const cap = t => t[0].toUpperCase() + t.slice(1);
      return { q: 'What is this shape called?', viz: V.shape(s, pick(['vz-sky', 'vz-teal', 'vz-sun', 'vz-plum'])), kind: 'choice', choices: opts.map(cap), answer: cap(s),
        hints: [sides ? `Count the sides. It has ${sides}.` : 'It has no straight sides or corners.'], steps: [`${cap(s)}: ${sides ? sides + ' sides' : 'round, no corners'}.`] };
    } },

  /* ---------- Grade 1 ---------- */
  { id: '1-maketen', grade: 1, strand: 'add', title: 'Make ten to add', kid: 'Make a ten',
    idea: 'To add 8 + 5, move 2 from the 5 to fill the ten: 10 + 3 = 13. Tens are easy to add to.',
    method: ['Find the partner that fills the bigger number up to 10.', 'Take that much from the other number.', 'Add the leftover to 10.'],
    gen() {
      const a = ri(6, 9), b = ri(11 - a, 9), need = 10 - a;
      return { q: `${a} + ${b} = ?`, viz: V.tenFrame(a, b, 2), kind: 'num', answer: a + b,
        hints: [`${a} needs ${need} more to make 10.`, `Break ${b} into ${need} and ${b - need}.`], steps: [`${a} + ${need} = 10`, `10 + ${b - need} = ${a + b}`] };
    } },
  { id: '1-doubles', grade: 1, strand: 'add', title: 'Doubles and near doubles', kid: 'Double trouble',
    idea: 'Doubles like 6 + 6 are easy to remember. 6 + 7 is just one more than 6 + 6.',
    method: ['Spot two numbers that are the same or one apart.', 'Double the smaller one, then add the extra.'],
    gen() {
      const a = ri(2, 9), near = Math.random() < .6, b = near ? a + 1 : a;
      return { q: `${a} + ${b} = ?`, kind: 'num', answer: a + b,
        hints: [near ? `What is ${a} + ${a}? Then add 1.` : `Double ${a}.`], steps: near ? [`${a} + ${a} = ${2 * a}`, `${2 * a} + 1 = ${a + b}`] : [`Double ${a} is ${2 * a}.`] };
    } },
  { id: '1-add20', grade: 1, strand: 'add', title: 'Add and subtract within 20', kid: 'Facts to 20',
    idea: 'Use what you know: make a ten, doubles, or think addition to subtract.',
    method: ['For adding, make a ten or use doubles.', 'For subtracting, count up from the smaller number to the bigger one.'],
    gen() {
      if (Math.random() < .5) { const a = ri(3, 12), b = ri(2, 20 - a); return { q: `${a} + ${b} = ?`, kind: 'num', answer: a + b, viz: V.numberLine(0, 20, { jumps: [[a, a + b, '+' + b]] }), hints: ['Start at the bigger number and jump.'], steps: [`${a} + ${b} = ${a + b}`] }; }
      const a = ri(11, 20), b = ri(2, 9);
      return { q: `${a} &minus; ${b} = ?`, kind: 'num', answer: a - b, viz: V.numberLine(0, 20, { jumps: [[a - b, a, '']] }),
        hints: [`Count up from ${b} to ${a}. First get to 10.`], steps: [`${b} to 10 is ${10 - b}, 10 to ${a} is ${a - 10}.`, `${10 - b} + ${a - 10} = ${a - b}`] };
    } },
  { id: '1-missing', grade: 1, strand: 'add', title: 'Find the missing number', kid: 'Mystery number',
    idea: 'An equation is a balance. Whatever is missing must make both sides equal.',
    method: ['Read it as: what goes with this number to make the total?', 'Subtract the part you know from the total.'],
    gen() {
      const a = ri(1, 12), t = ri(a + 1, 20);
      return { q: `${a} + &#9633; = ${t}`, viz: V.balance(`${a} + ?`, `${t}`), kind: 'num', answer: t - a,
        hints: [`Count up from ${a} to ${t}.`], steps: [`${t} &minus; ${a} = ${t - a}`, `Check: ${a} + ${t - a} = ${t}`] };
    } },
  { id: '1-tens', grade: 1, strand: 'number', title: 'Tens and ones', kid: 'Sticks and cubes',
    idea: 'In 47 the 4 means 4 tens (40) and the 7 means 7 ones.',
    method: ['Count the rods: each is 10.', 'Count the small cubes: each is 1.'],
    gen() {
      const n = ri(11, 99), ask = pick(['n', 'tens', 'ones']);
      const q = ask === 'n' ? 'What number do the blocks show?' : ask === 'tens' ? `How many tens are in ${n}?` : `How many ones are in ${n}?`;
      return { q, viz: V.baseTen(n), kind: 'num', answer: ask === 'n' ? n : ask === 'tens' ? Math.floor(n / 10) : n % 10,
        hints: ['Each tall rod is 10. Each small cube is 1.'], steps: [`${Math.floor(n / 10)} tens and ${n % 10} ones make ${n}.`] };
    } },
  { id: '1-addtens', grade: 1, strand: 'add', title: 'Add and subtract tens', kid: 'Jump by tens',
    idea: 'Adding a ten changes only the tens digit: 34 + 20 is 54.',
    method: ['Keep the ones the same.', 'Add or subtract the tens.'],
    gen() {
      const a = ri(11, 79), t = ri(1, Math.floor((99 - a) / 10)) * 10, sub = Math.random() < .4 && a > 30;
      const b = sub ? ri(1, Math.floor(a / 10) - 1) * 10 : t;
      return { q: `${a} ${sub ? '&minus;' : '+'} ${b} = ?`, kind: 'num', answer: sub ? a - b : a + b, viz: V.baseTen(a),
        hints: [`The ones digit stays ${a % 10}.`], steps: [`${Math.floor(a / 10)} tens ${sub ? '&minus;' : '+'} ${b / 10} tens = ${Math.floor((sub ? a - b : a + b) / 10)} tens, so ${sub ? a - b : a + b}.`] };
    } },
  { id: '1-compare', grade: 1, strand: 'number', title: 'Compare two-digit numbers', kid: 'Greater or less',
    idea: 'Compare the tens first. Only if the tens match, compare the ones.',
    method: ['More tens means bigger.', 'Same tens? Look at the ones.'],
    gen(lv) {
      const max = lv === 3 ? 999 : 99, a = ri(10, max); let b = Math.random() < .3 ? a - (a % 10) + ri(0, 9) : ri(10, max); if (Math.random() < .1) b = a;
      const ans = a > b ? '>' : a < b ? '<' : '=';
      return { q: `${a} &#9633; ${b}`, kind: 'choice', choices: ['<', '=', '>'], answer: ans,
        hints: ['The open side of the sign faces the bigger number.'], steps: [`${a} ${ans === '<' ? 'is less than' : ans === '>' ? 'is greater than' : 'equals'} ${b}.`] };
    } },
  { id: '1-time', grade: 1, strand: 'geo', title: 'Tell time to the half hour', kid: 'What time is it?',
    idea: 'The short hand shows the hour. The long hand at 12 means o\'clock, at 6 means half past.',
    method: ['Read the short hand for the hour.', 'Long hand on 12 is :00, on 6 is :30.'],
    gen(lv) {
      const h = ri(1, 12), m = lv === 1 ? 0 : pick([0, 30]); const ans = `${h}:${String(m).padStart(2, '0')}`;
      const opts = shuffle([...new Set([ans, `${h % 12 + 1}:${String(m).padStart(2, '0')}`, `${h}:${m ? '00' : '30'}`, `${(h + 5) % 12 + 1}:${String(m).padStart(2, '0')}`])]);
      return { q: 'What time does the clock show?', viz: V.clock(h, m), kind: 'choice', choices: opts, answer: ans,
        hints: [m ? 'The long hand points to 6: half past. The short hand is just past the hour.' : 'The long hand points to 12.'], steps: [`It is ${ans}.`] };
    } },

  /* ---------- Grade 2 ---------- */
  { id: '2-add100', grade: 2, strand: 'add', title: 'Add two-digit numbers', kid: 'Big adding',
    idea: 'Break numbers apart into tens and ones, add each, then put them back together.',
    method: ['Add the tens: 40 + 30.', 'Add the ones: 7 + 5.', 'Combine: 70 + 12 = 82.'],
    gen() {
      const a = ri(12, 79), b = ri(11, 99 - a), T1 = Math.floor(a / 10) * 10 + Math.floor(b / 10) * 10, O = a % 10 + b % 10;
      return { q: `${a} + ${b} = ?`, kind: 'num', answer: a + b, viz: V.baseTen(a) + V.baseTen(b),
        hints: [`Tens: ${Math.floor(a / 10) * 10} + ${Math.floor(b / 10) * 10}`, `Ones: ${a % 10} + ${b % 10}`], steps: [`Tens: ${T1}`, `Ones: ${O}`, `${T1} + ${O} = ${a + b}`] };
    } },
  { id: '2-sub100', grade: 2, strand: 'add', title: 'Subtract two-digit numbers', kid: 'Big taking away',
    idea: 'Count up from the smaller number to the bigger one with friendly jumps. The jumps add up to the difference.',
    method: ['Jump to the next ten.', 'Jump by tens.', 'Jump the rest, then add the jumps.'],
    gen() {
      const a = ri(31, 99), b = ri(11, a - 5), up = Math.ceil(b / 10) * 10, j1 = up - b, j2 = Math.floor((a - up) / 10) * 10, j3 = a - up - j2;
      const jumps = [[b, up, j1 ? '+' + j1 : '']]; if (j2) jumps.push([up, up + j2, '+' + j2]); if (j3) jumps.push([up + j2, a, '+' + j3]);
      return { q: `${a} &minus; ${b} = ?`, viz: V.numberLine(Math.floor(b / 10) * 10, Math.ceil(a / 10) * 10, { jumps: jumps.filter(j => j[0] !== j[1]), step: 1, labelEvery: 10 }), kind: 'num', answer: a - b,
        hints: [`Count up from ${b}. First jump to ${up}.`], steps: [`${b} to ${up}: ${j1}`, `${up} to ${up + j2}: ${j2}`, `${up + j2} to ${a}: ${j3}`, `${j1} + ${j2} + ${j3} = ${a - b}`] };
    } },
  { id: '2-add1000', grade: 2, strand: 'add', title: 'Add and subtract within 1,000', kid: 'Hundreds',
    idea: 'Work place by place: hundreds, tens and ones. Regroup 10 ones as a ten when you need to.',
    method: ['Line up hundreds, tens and ones.', 'Add each place.', 'Trade 10 of a place for 1 of the next place.'],
    gen() {
      const sub = Math.random() < .5, a = ri(120, 899), b = sub ? ri(100, a - 10) : ri(100, 999 - a);
      const H = x => Math.floor(x / 100), Tn = x => Math.floor(x / 10) % 10, O = x => x % 10;
      return { q: `${a} ${sub ? '&minus;' : '+'} ${b} = ?`, kind: 'num', answer: sub ? a - b : a + b,
        hints: [sub ? `Count up from ${b} to ${a}, or subtract place by place.` : `Hundreds: ${H(a) * 100} + ${H(b) * 100}`],
        steps: sub ? [`${a} &minus; ${H(b) * 100} = ${a - H(b) * 100}`, `${a - H(b) * 100} &minus; ${b % 100} = ${a - b}`] : [`${H(a) * 100 + H(b) * 100} + ${(Tn(a) + Tn(b)) * 10} + ${O(a) + O(b)} = ${a + b}`] };
    } },
  { id: '2-skip', grade: 2, strand: 'number', title: 'Skip count', kid: 'Hop counting',
    idea: 'Skip counting by 2, 5, 10 or 100 is the first step to multiplying.',
    method: ['Find how much each step grows.', 'Add that step to the last number.'],
    gen() {
      const s = pick([2, 5, 10, 100, 3, 4]), start = s * ri(0, 6), seq = Array.from({ length: 4 }, (_, i) => start + i * s);
      return { q: `What comes next? ${seq.join(', ')}, &#9633;`, kind: 'num', answer: start + 4 * s,
        hints: [`Each number is ${s} more than the one before.`], steps: [`${seq[3]} + ${s} = ${start + 4 * s}`] };
    } },
  { id: '2-evenodd', grade: 2, strand: 'number', title: 'Even and odd', kid: 'Pair them up',
    idea: 'Even numbers split into pairs with none left over. Odd numbers have one left over.',
    method: ['Look at the ones digit.', '0, 2, 4, 6 or 8 means even.'],
    gen() {
      const n = ri(1, 99), ans = n % 2 ? 'Odd' : 'Even';
      return { q: `Is ${n} even or odd?`, viz: n <= 20 ? V.rows(Math.ceil(n / 2), Math.floor(n / 2), ['', '']) : '', kind: 'choice', choices: ['Even', 'Odd'], answer: ans,
        hints: [`The ones digit is ${n % 10}.`], steps: [`${n % 10} is ${ans.toLowerCase()}, so ${n} is ${ans.toLowerCase()}.`] };
    } },
  { id: '2-arrays', grade: 2, strand: 'mult', title: 'Arrays and equal groups', kid: 'Rows of dots',
    idea: 'An array is rows of the same size. 3 rows of 4 is 4 + 4 + 4 = 12.',
    method: ['Count the dots in one row.', 'Add that number once for each row.'],
    gen() {
      const r = ri(2, 5), c = ri(2, 6);
      return { q: `${r} rows of ${c}. How many dots in all?`, viz: V.array(r, c), kind: 'num', answer: r * c,
        hints: [`Add ${c} a total of ${r} times.`], steps: [Array(r).fill(c).join(' + ') + ` = ${r * c}`] };
    } },
  { id: '2-money', grade: 2, strand: 'geo', title: 'Count coins', kid: 'Coin counter',
    idea: 'Start with the coins worth the most, then count on with the smaller ones.',
    method: ['Sort coins from biggest to smallest.', 'Count on: 25, 50, 60, 65, 66.'],
    gen() {
      const list = Array.from({ length: ri(3, 6) }, () => pick([25, 10, 10, 5, 5, 1])).sort((a, b) => b - a), sum = list.reduce((a, b) => a + b, 0);
      let run = 0;
      return { q: 'How many cents are these coins worth?', viz: V.coins(list), kind: 'num', answer: sum, unit: '¢',
        hints: ['Start with the biggest coin and count on.'], steps: [list.map(v => (run += v)).join(', ') + '. Total ' + sum + '¢.'] };
    } },
  { id: '2-time5', grade: 2, strand: 'geo', title: 'Tell time to 5 minutes', kid: 'Clock reader',
    idea: 'Each number on the clock is 5 minutes for the long hand. Count by fives.',
    method: ['Read the hour from the short hand (the number it just passed).', 'Count by 5 to the long hand.'],
    gen() {
      const h = ri(1, 12), m = ri(0, 11) * 5, mm = String(m).padStart(2, '0');
      return { q: 'What time is it? Type it like 3:25.', viz: V.clock(h, m), kind: 'text', answer: `${h}:${mm}`,
        hints: [`The long hand points at ${m / 5 || 12}. Count by fives.`], steps: [`Hour ${h}, minutes ${m / 5} &times; 5 = ${m}. It is ${h}:${mm}.`] };
    } },
  { id: '2-place', grade: 2, strand: 'number', title: 'Place value to 1,000', kid: 'Digit jobs',
    idea: 'A digit\'s value depends on its place. In 352, the 5 is worth 50.',
    method: ['Find which place the digit is in.', 'Hundreds place times 100, tens place times 10.'],
    gen() {
      let n, s, i; do { n = ri(101, 999); s = String(n); i = ri(0, 2); } while (s.split(s[i]).length > 2 || s[i] === '0'); const place = ['hundreds', 'tens', 'ones'][i];
      return { q: `What is the value of the digit <b>${s[i]}</b> in ${n}?`, kind: 'num', answer: +s[i] * 10 ** (2 - i), viz: V.baseTen(n),
        hints: [`The ${s[i]} is in the ${place} place.`], steps: [`${s[i]} ${place} = ${+s[i] * 10 ** (2 - i)}`] };
    } }
];
