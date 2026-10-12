/* Deep dives for all 16 sutras and 13 sub-sutras: a longer explanation, the algebra behind it,
   worked examples, where it is used, an animated diagram and further reading.
   Every worked example here was checked numerically. Text is original. */
import { R, T, L, P, C, DOT, BOX } from './scenes.js';

const W = 'https://en.wikipedia.org/wiki/';
const VM = ['Vedic Mathematics (Wikipedia)', W + 'Vedic_Mathematics'];
const hl = (s, c = 'coral') => `<b class="hl hl-${c}">${s}</b>`;
const frac = (a, b) => `<span class="fr"><span>${a}</span><span>${b}</span></span>`;

export const DETAILS = {
  /* ================= The 16 sutras ================= */
  'Ekādhikena Pūrveṇa': {
    more: 'Ekādhika means "one more". The sutra tells you to take the digit (or number) before, add one, and use it as a multiplier. Its most famous use is squaring numbers that end in 5, but the same "one more" also generates the endless decimals of 1/19, 1/29 and 1/49 digit by digit, and gives the magic multipliers for divisibility tests.',
    why: `A number ending in 5 is 10a + 5. Squaring it: (10a + 5)² = 100a² + 100a + 25 = 100 × a(a + 1) + 25. So the answer is always a × (a + 1) followed by 25. The picture shows the same thing with areas: the two thin strips of 5 slide together into one strip of 10.`,
    examples: [['65²', `6 × 7 = 42, then 25 → ${hl('4225')}`], ['115²', `11 × 12 = 132, then 25 → ${hl('13225')}`], ['1/19', 'One more than 1 is 2. Write 1 at the right, keep doubling leftwards with carries: …789473684210526315 → 0.052631578947368421…']],
    uses: ['Squares ending in 5', 'Recurring decimals', 'Divisibility tests'],
    read: [['Square numbers ending in 5 (video)', 'https://www.youtube.com/watch?v=oV7Kxm3Zr_c'], VM],
    scene: { w: 460, h: 340, steps: [
      { add: `${R(40, 30, 280, 280, 'sc-none')}${T(180, 20, '60', 'vz-tb')}${T(340, 20, '5', 'vz-tb')}${T(25, 170, '60', 'vz-tb')}${T(25, 290, '5', 'vz-tb')}`, say: 'Picture 65 × 65 as a square, cut into 60 and 5 along each side.' },
      { add: R(40, 30, 220, 220, 'vz-sky', '60 × 60 = 3600'), say: 'The big piece is 60 × 60 = 3600.' },
      { add: R(260, 30, 60, 220, 'vz-teal', '300'), say: 'A strip 5 wide down the side: 60 × 5 = 300.' },
      { add: R(40, 250, 220, 60, 'vz-teal', '60 × 5 = 300'), say: 'And the same strip along the bottom: another 300.' },
      { add: R(260, 250, 60, 60, 'vz-sun', '25'), say: 'The little corner is 5 × 5 = 25. It is always 25.' },
      { add: `${R(40, 310, 220, 26, 'vz-teal', 'moved strip')}${P('M290 140 C 330 250, 300 330, 250 322', 'sc-line sc-arrow')}`, hide: [2], say: 'Slide the side strip under the bottom one. Now 60 by 70 is a full rectangle.' },
      { add: `${T(400, 170, '60 × 70', 'vz-tb')}${T(400, 192, '= 4200', 'vz-tb')}${T(400, 280, '+ 25', 'vz-tb')}`, say: '60 × 70 is 6 × 7 hundreds = 4200. Add the 25: 65² = 4225. That is "6 times one more than 6, then 25".' }
    ] }
  },
  'Nikhilaṃ Navataścaramaṃ Daśataḥ': {
    more: 'Nikhilam means "all". Take every digit from 9 and the last digit from 10. The result is the complement: how far a number is from the next power of ten. That turns subtracting from 100, 1000 or 10000 into one pass with no borrowing, and it is the engine behind multiplying numbers near a base (each number is replaced by its small distance from the base).',
    why: '10000 − 368 equals 9999 − 368 + 1. Subtracting from 9999 never needs borrowing because every digit is 9, so each digit simply becomes 9 minus itself. The final +1 is the same as taking the last digit from 10 instead of 9.',
    examples: [['1000 − 368', `9 − 3 = 6, 9 − 6 = 3, 10 − 8 = 2 → ${hl('632')}`], ['97 × 94 (near 100)', `Distances −3 and −6. Cross: 97 − 6 = 91. Multiply: 3 × 6 = 18 → ${hl('9118')}`], ['$100 − $47.35 change', `Digits from 9, last from 10: ${hl('$52.65')}`]],
    uses: ['Change at the shop', 'Near-base multiplication', 'Division by 9, 8, 89'],
    read: [['Nikhilam multiplication for beginners (video)', 'https://www.youtube.com/watch?v=f0W32SwhAwM'], VM],
    scene: { w: 420, h: 250, steps: [
      { add: `${T(30, 40, '1000', 'sc-big', 'start')}${T(30, 110, '−', 'sc-big', 'start')}${BOX(150, 85, '3')}${BOX(210, 85, '6')}${BOX(270, 85, '8', 'sc-digit sc-last')}`, say: 'Subtract 368 from 1000.' },
      { add: `${BOX(150, 170, '6', 'sc-digit sc-new')}${T(172, 160, '9 − 3', 'vz-ts')}`, say: 'First digit from 9: 9 − 3 = 6.' },
      { add: `${BOX(210, 170, '3', 'sc-digit sc-new')}${T(232, 160, '9 − 6', 'vz-ts')}`, say: 'Next digit from 9: 9 − 6 = 3.' },
      { add: `${BOX(270, 170, '2', 'sc-digit sc-new')}${T(292, 160, '10 − 8', 'vz-ts')}`, say: 'The last digit from 10: 10 − 8 = 2.' },
      { add: T(380, 195, '= 632', 'sc-big'), say: 'Done, with no borrowing at all: 1000 − 368 = 632.' }
    ] }
  },
  'Ūrdhva-Tiryagbhyām': {
    more: 'Ūrdhva means vertical and tiryak means crosswise. You build the answer one column at a time, from right to left: multiply straight down, then add the cross products, then straight down again. It works for any numbers of any length, and the same pattern multiplies algebra expressions.',
    why: '(10a + b)(10c + d) = 100ac + 10(ad + bc) + bd. The units come from b × d (vertical), the tens from ad + bc (the cross), and the hundreds from a × c (vertical). Carries move left exactly as in ordinary place value.',
    examples: [['23 × 41', `3 × 1 = 3; 2×1 + 3×4 = 14 (write 4, carry 1); 2 × 4 + 1 = 9 → ${hl('943')}`], ['(2x + 3)(x + 4)', `2x·x = 2x²; 2x·4 + 3·x = 11x; 3·4 = 12 → ${hl('2x² + 11x + 12')}`]],
    uses: ['Any multiplication', 'Algebra products', 'Squares (duplex)'],
    read: [['tecmath: fast multiplication with Vedic math (video)', 'https://www.youtube.com/watch?v=kvLjpQ0XGao'], ['Multiplication algorithm (Wikipedia)', W + 'Multiplication_algorithm']],
    scene: { w: 420, h: 280, steps: [
      { add: `${BOX(150, 30, '2')}${BOX(220, 30, '3')}${BOX(150, 120, '4')}${BOX(220, 120, '1')}${T(110, 145, '×', 'sc-big')}`, say: '23 × 41. Line the digits up.' },
      { add: `${L(242, 82, 242, 118, 'sc-line sc-c1')}${BOX(290, 210, '3', 'sc-digit sc-new')}`, say: 'Vertical on the right: 3 × 1 = 3. That is the units digit.' },
      { add: `${L(172, 82, 242, 118, 'sc-line sc-c2')}${L(242, 82, 172, 118, 'sc-line sc-c2')}${BOX(220, 210, '4', 'sc-digit sc-new')}${T(220, 196, 'carry 1', 'vz-ts', 'end')}`, say: 'Crosswise: 2 × 1 + 3 × 4 = 14. Write 4, carry 1.' },
      { add: `${L(172, 82, 172, 118, 'sc-line sc-c3')}${BOX(150, 210, '9', 'sc-digit sc-new')}`, say: 'Vertical on the left: 2 × 4 = 8, plus the carried 1 = 9.' },
      { add: T(380, 235, '943', 'sc-big'), say: '23 × 41 = 943, written in one line.' }
    ] }
  },
  'Parāvartya Yojayet': {
    more: 'Parāvartya means "having transposed". Move a term to the other side and flip its sign, or flip the operation, then apply it. In equations it is the one-line version of the balance method. In division, it lets you divide by numbers just above a base, like 12 or 112, by using the "flipped" digits −2 or −1, −2 as helpers.',
    why: 'An equation is a balance: subtracting the same thing from both sides keeps it level. Writing x on one side and −x on the other in one move is exactly that, just faster. For ax + b = cx + d, the result is always x = (d − b) ÷ (a − c).',
    examples: [['3x + 4 = x + 10', `Transpose: 3x − x = 10 − 4 → 2x = 6 → ${hl('x = 3')}`], ['7x − 5 = 2x + 20', `x = (20 + 5) ÷ (7 − 2) = ${hl('5')}`]],
    uses: ['Linear equations', 'Division by 11 to 19, 112 …', 'Rearranging formulas'],
    read: [VM],
    scene: { kind: 'eq', steps: [
      { add: `3x + 4 = x + 10`, say: 'Start with the equation.' },
      { add: `3x ${hl('− x')} + 4 = 10`, say: 'Transpose x: it crosses the equals sign and becomes −x.' },
      { add: `3x − x = 10 ${hl('− 4', 'teal')}`, say: 'Transpose 4: it becomes −4 on the other side.' },
      { add: `2x = 6`, say: 'Tidy both sides.' },
      { add: `x = ${hl('3', 'sun')}`, say: 'Divide by 2. Check: 3·3 + 4 = 13 and 3 + 10 = 13.' }
    ] }
  },
  'Śūnyaṃ Sāmyasamuccaye': {
    more: 'Samuccaya means "total" or "combination", and śūnya means zero. When the same total appears on both sides of an equation, that total must be zero. The book lists several kinds of total: a common factor (like x in 12x + 3x = 4x + 5x), the sum of numerators equal to the sum of denominators, and equal constant products.',
    why: 'If an expression E appears as E × (something) on both sides with different multipliers, then E × (p − q) = 0, and since p ≠ q, E = 0. For fractions N₁/D₁ = N₂/D₂, when N₁ + N₂ is a multiple of D₁ + D₂ (or equal to it), cross-multiplying leaves exactly that total times a constant.',
    examples: [[`${frac('3x + 4', '6x + 7')} = ${frac('x + 1', '2x + 3')}`, `Numerators add to 4x + 5, denominators to 8x + 10 = 2(4x + 5). So 4x + 5 = 0 → ${hl('x = −5/4')}`], ['(x + 3)(x + 8) = (x + 4)(x + 6)', `3 × 8 = 24 = 4 × 6, so ${hl('x = 0')}`], ['12x + 3x = 4x + 5x', `Common factor x, different totals (15 and 9) → ${hl('x = 0')}`]],
    uses: ['Spot-the-zero equations', 'Fractions with linked parts'],
    read: [VM],
    scene: { kind: 'eq', steps: [
      { add: `${frac('3x + 4', '6x + 7')} = ${frac('x + 1', '2x + 3')}`, say: 'A fraction equation that looks like hard work.' },
      { add: `N₁ + N₂ = (3x + 4) + (x + 1) = ${hl('4x + 5')}`, say: 'Add the two numerators.' },
      { add: `D₁ + D₂ = (6x + 7) + (2x + 3) = 2(${hl('4x + 5')})`, say: 'Add the denominators: the same total appears, doubled.' },
      { add: `${hl('4x + 5', 'teal')} = 0`, say: 'The sutra says that common total is zero.' },
      { add: `x = ${hl('−5/4', 'sun')}`, say: 'Check by cross-multiplying: both sides give the same value. No quadratic needed.' }
    ] }
  },
  '(Ānurūpye) Śūnyamanyat': {
    more: 'Ānurūpya means "in proportion". In a pair of equations, if the coefficients of one letter are in the same ratio as the numbers on the right, then the other letter must be zero. You can see it before doing any elimination.',
    why: 'Suppose by = c and ky = kc fit both equations when x = 0. If the y coefficients are b and kb and the constants are c and kc, then x = 0, y = c/b satisfies both, and for independent equations that solution is the only one.',
    examples: [['6x + 7y = 8, 19x + 14y = 16', `7 : 14 = 8 : 16, so ${hl('x = 0')} and y = 8/7`], ['3x + 5y = 10, 7x + 15y = 30', `5 : 15 = 10 : 30, so x = 0 and ${hl('y = 2')}`]],
    uses: ['Simultaneous equations', 'Checking before eliminating'],
    read: [VM],
    scene: { kind: 'eq', steps: [
      { add: `6x + 7y = 8<br>19x + 14y = 16`, say: 'Two equations.' },
      { add: `y numbers: ${hl('7')} and ${hl('14')}`, say: 'Look at the y coefficients.' },
      { add: `right-hand sides: ${hl('8', 'teal')} and ${hl('16', 'teal')}`, say: 'And the numbers on the right.' },
      { add: `7 : 14 = 8 : 16 = 1 : 2`, say: 'Same ratio.' },
      { add: `${hl('x = 0', 'sun')}, then 7y = 8 → y = 8/7`, say: 'So x is zero, and y follows in one step.' }
    ] }
  },
  'Saṅkalana-Vyavakalanābhyām': {
    more: 'Saṅkalana is addition and vyavakalana is subtraction. When two equations have the x and y coefficients swapped, adding them and subtracting them gives x + y and x − y directly. Then one more add and subtract finishes the job.',
    why: 'ax + by = c and bx + ay = d. Adding: (a + b)(x + y) = c + d. Subtracting: (a − b)(x − y) = c − d. Two tiny equations instead of one big elimination.',
    examples: [['45x − 23y = 113, 23x − 45y = 91', `Add: 68(x − y) = 204 → x − y = 3. Subtract: 22(x + y) = 22 → x + y = 1. So ${hl('x = 2, y = −1')}`], ['5x + 3y = 13, 3x + 5y = 11', `x + y = 3, x − y = 1 → ${hl('x = 2, y = 1')}`]],
    uses: ['Symmetric simultaneous equations'],
    read: [VM],
    scene: { kind: 'eq', steps: [
      { add: `45x − 23y = 113<br>23x − 45y = 91`, say: 'The coefficients 45 and 23 swap places.' },
      { add: `Add: 68x − 68y = 204 → ${hl('x − y = 3')}`, say: 'Add the equations, then divide by 68.' },
      { add: `Subtract: 22x + 22y = 22 → ${hl('x + y = 1', 'teal')}`, say: 'Subtract them, then divide by 22.' },
      { add: `x = (3 + 1) ÷ 2 = ${hl('2', 'sun')}, y = (1 − 3) ÷ 2 = ${hl('−1', 'sun')}`, say: 'Add and halve, subtract and halve. Check: 90 + 23 = 113.' }
    ] }
  },
  'Pūraṇāpūraṇābhyām': {
    more: 'Pūraṇa means completion. Add the missing piece to make a perfect square (or cube), solve the complete shape, then take the piece away again. This is completing the square, and the picture shows why it is called that: there is literally a missing corner.',
    why: 'x² + bx is a square of side x with two strips of b/2. The missing corner has area (b/2)². Adding it makes (x + b/2)². So x² + bx = k becomes (x + b/2)² = k + (b/2)².',
    examples: [['x² + 6x = 7', `Add 9: (x + 3)² = 16 → x + 3 = ±4 → ${hl('x = 1 or −7')}`], ['x³ + 6x² + 12x = 19', `Add 8: (x + 2)³ = 27 → x + 2 = 3 → ${hl('x = 1')}`]],
    uses: ['Quadratic equations', 'Vertex of a parabola', 'Cubes'],
    read: [['Completing the square (Wikipedia)', W + 'Completing_the_square']],
    scene: { w: 440, h: 320, steps: [
      { add: R(40, 30, 190, 190, 'vz-sky', 'x²'), say: 'x² is a square with side x.' },
      { add: `${R(230, 30, 60, 190, 'vz-teal', '3x')}${R(40, 220, 190, 60, 'vz-teal', '3x')}`, say: '6x splits into two strips of 3x, one on each side.' },
      { add: `<rect x="230" y="220" width="60" height="60" rx="3" class="sc-dash"/>${T(260, 250, '?', 'vz-tb')}`, say: 'x² + 6x = 7 is a square with a corner missing.' },
      { add: R(230, 220, 60, 60, 'vz-sun', '9'), say: 'Complete it: the corner is 3 × 3 = 9. Add 9 to both sides: 7 + 9 = 16.' },
      { add: `${T(360, 120, '(x + 3)²', 'vz-tb')}${T(360, 145, '= 16', 'vz-tb')}${T(360, 190, 'x + 3 = ±4', 'vz-tb')}${T(360, 215, 'x = 1 or −7', 'vz-tb')}`, say: 'The whole square is (x + 3)² = 16, so x + 3 = ±4.' }
    ] }
  },
  'Calana-Kalanābhyām': {
    more: 'Calana-kalana means "by sequential motion": how things change step by step. The book uses it for differences and rates of change, the idea at the heart of calculus. One striking use: for a quadratic ax² + bx + c = 0, its first derivative 2ax + b equals ± the square root of the discriminant.',
    why: 'From the quadratic formula, x = (−b ± √(b² − 4ac)) / 2a, so 2ax + b = ±√(b² − 4ac). The left side is the slope of the parabola (its derivative), so the roots sit where the slope equals ± the root of the discriminant.',
    examples: [['x² − 5x + 6 = 0', `Derivative 2x − 5. Discriminant 25 − 24 = 1. So 2x − 5 = ±1 → ${hl('x = 3 or 2')}`], ['How fast x² grows', 'Going from x to x + 1 adds 2x + 1, so near x the change is about 2x per step.']],
    uses: ['Quadratics', 'Rates of change', 'Calculus intuition'],
    read: [['Derivative (Wikipedia)', W + 'Derivative']],
    scene: { w: 440, h: 300, steps: [
      { add: `${L(20, 240, 420, 240, 'vz-axis')}${P('M-8.0 38.4 L4.0 60.6 L16.0 81.6 L28.0 101.4 L40.0 120.0 L52.0 137.4 L64.0 153.6 L76.0 168.6 L88.0 182.4 L100.0 195.0 L112.0 206.4 L124.0 216.6 L136.0 225.6 L148.0 233.4 L160.0 240.0 L172.0 245.4 L184.0 249.6 L196.0 252.6 L208.0 254.4 L220.0 255.0 L232.0 254.4 L244.0 252.6 L256.0 249.6 L268.0 245.4 L280.0 240.0 L292.0 233.4 L304.0 225.6 L316.0 216.6 L328.0 206.4 L340.0 195.0 L352.0 182.4 L364.0 168.6 L376.0 153.6 L388.0 137.4 L400.0 120.0 L412.0 101.4 L424.0 81.6 L436.0 60.6 L448.0 38.4', 'sc-line sc-c1')}`, say: 'The curve y = x² − 5x + 6, a parabola.' },
      { add: `${DOT(160, 240)}${DOT(280, 240)}${T(160, 262, 'x = 2', 'vz-ts')}${T(280, 262, 'x = 3', 'vz-ts')}`, say: 'It crosses zero at two places: the roots we want.' },
      { add: `${L(40, 135, 170, 265, 'sc-line sc-c2')}${DOT(100, 195, 5, 'vz-teal')}${T(110, 120, 'slope = 2x − 5', 'vz-tb', 'start')}`, say: 'The slope at any point is the derivative 2x − 5.' },
      { add: `${T(360, 60, 'b² − 4ac = 1', 'vz-tb')}${T(360, 90, '2x − 5 = ±1', 'vz-tb')}${T(360, 120, 'x = 3 or 2', 'vz-tb')}`, say: 'At the roots, the slope equals ± √(b² − 4ac) = ±1. Solve: x = 3 or x = 2.' }
    ] }
  },
  'Yāvadūnam': {
    more: 'Yāvadūnam means "whatever the deficiency". Find how far a number is from its base, go that far again, then attach the square of the gap. It squares numbers near 10, 100 or 1000 in seconds, and it extends to cubes.',
    why: '(100 − d)² = 10000 − 200d + d² = 100(100 − 2d) + d². The left part 100 − 2d is the number minus d again; the right part is d², written in two digits.',
    examples: [['96²', `4 short. 96 − 4 = 92, 4² = 16 → ${hl('9216')}`], ['993²', `7 short. 993 − 7 = 986, 7² = 049 → ${hl('986049')}`]],
    uses: ['Squares near a base'],
    read: [VM],
    scene: { w: 440, h: 320, steps: [
      { add: `${R(40, 30, 240, 240, 'vz-sky sc-faint', '')}${T(160, 20, '100', 'vz-tb')}`, say: 'Start with a 100 by 100 square: 10000.' },
      { add: `${R(260, 30, 20, 240, 'vz-coral', '')}${T(300, 150, '−400', 'vz-ts', 'start')}`, say: '96 is 4 short, so cut a 4-wide strip off the side: −400.' },
      { add: `${R(40, 250, 240, 20, 'vz-coral', '')}${T(160, 290, '−400', 'vz-ts')}`, say: 'Cut 4 off the bottom too: another −400.' },
      { add: `${R(260, 250, 20, 20, 'vz-sun', '')}${T(300, 262, '+16', 'vz-ts', 'start')}`, say: 'The corner was cut twice, so add it back once: 4 × 4 = 16.' },
      { add: `${T(370, 90, '10000 − 800', 'vz-tb')}${T(370, 115, '= 9200', 'vz-tb')}${T(370, 150, '+ 16', 'vz-tb')}${T(370, 185, '96² = 9216', 'vz-tb')}`, say: '10000 − 800 is 92 hundreds: the "96 − 4 = 92" part. Then 16. Answer 9216.' }
    ] }
  },
  'Vyaṣṭisamaṣṭiḥ': {
    more: 'Vyaṣṭi is the individual and samaṣṭi the whole. Look at a pair of numbers through their average (the whole) and their distance from it (the parts). Two numbers that are equally far from a round number multiply as "average squared minus distance squared".',
    why: '(m − d)(m + d) = m² − d². The rectangle is the square of the average with a small d × d square missing.',
    examples: [['48 × 52', `Average 50, distance 2: 2500 − 4 = ${hl('2496')}`], ['97 × 103', `10000 − 9 = ${hl('9991')}`], ['Two numbers add to 20, multiply to 96', `Around 10: 10 ± 2 because 100 − 4 = 96 → ${hl('8 and 12')}`]],
    uses: ['Products around a midpoint', 'Factoring', 'Sum and product puzzles'],
    read: [['Difference of two squares (Wikipedia)', W + 'Difference_of_two_squares']],
    scene: { w: 440, h: 320, steps: [
      { add: `${L(40, 40, 400, 40, 'vz-axis')}${[46, 48, 50, 52, 54].map(v => `${L(40 + (v - 46) * 45, 34, 40 + (v - 46) * 45, 46, 'vz-axis')}${T(40 + (v - 46) * 45, 62, v, 'vz-ts')}`).join('')}`, say: '48 and 52 sit 2 either side of 50.' },
      { add: `${DOT(130, 40)}${DOT(310, 40)}${DOT(220, 40, 6, 'vz-sun')}`, say: 'Their average is 50, the "whole" view of the pair.' },
      { add: R(110, 90, 200, 200, 'vz-sky sc-faint', '50 × 50 = 2500'), say: 'Think of the square of the average: 50 × 50 = 2500.' },
      { add: `${R(290, 90, 20, 20, 'vz-coral', '')}${T(320, 100, '2 × 2', 'vz-ts', 'start')}`, say: 'The 48 × 52 rectangle is that square with a 2 × 2 piece missing.' },
      { add: T(220, 310, '48 × 52 = 2500 − 4 = 2496', 'vz-tb'), say: 'So 48 × 52 = 2496.' }
    ] }
  },
  'Śeṣāṇyaṅkena Carameṇa': {
    more: 'Śeṣa means remainder and carama the last. Write the remainders of a long division, then multiply each by the last digit of the divisor and keep the last digit of each product. Those are the decimal digits. It makes fractions like 1/7 appear in a neat cycle.',
    why: 'Each division step says 7 × (digit) = 10 × (old remainder) − (new remainder). Looking only at last digits, 7 × digit ends like −(new remainder). Multiply by 7 once more: 49 × digit ends like the digit itself (49 ends in 9, which acts like −1), and −7 × (−new remainder) is 7 × new remainder. So each digit is the last digit of 7 × its remainder.',
    examples: [['1/7', `Remainders 3, 2, 6, 4, 5, 1. Times 7: 21, 14, 42, 28, 35, 7. Last digits → ${hl('0.142857…')}`], ['1/7 again', 'The cycle has 6 digits, the most a divisor of 7 can have.']],
    uses: ['Recurring decimals', 'Cyclic numbers'],
    read: [['Repeating decimal (Wikipedia)', W + 'Repeating_decimal']],
    scene: { w: 440, h: 330, steps: [
      { add: `${C(220, 165, 120, 'sc-line sc-faintline')}${T(220, 165, '1 ÷ 7', 'sc-big')}`, say: 'Divide 1 by 7 and watch the remainders.' },
      ...[[3, 1], [2, 4], [6, 2], [4, 8], [5, 5], [1, 7]].map(([r, d], i) => { const a = -Math.PI / 2 + i * Math.PI / 3, x = 220 + 120 * Math.cos(a), y = 165 + 120 * Math.sin(a); return { add: `${DOT(x, y, 22, 'vz-sky')}${T(x, y, r, 'vz-tb')}${T(220 + 165 * Math.cos(a), 165 + 165 * Math.sin(a), d, 'sc-dt2')}`, say: `Remainder ${r}. ${r} × 7 = ${r * 7}, last digit ${d}.` }; }),
      { add: T(220, 205, '0.142857…', 'vz-tb'), say: 'Read the last digits around the circle: 1/7 = 0.142857 142857…' }
    ] }
  },
  'Sopāntyadvayamantyam': {
    more: 'Sopāntya-dvayam-antyam means "the last and twice the second last". It solves a special family of equations built from four factors in steady steps, like (x + 2), (x + 3), (x + 4), (x + 5). For the pattern 1/(AB) + 1/(AC) = 1/(AD) + 1/(BC), the answer comes from setting D + 2C = 0.',
    why: 'Clearing denominators and simplifying this pattern, with A, B, C, D in arithmetic progression, leaves a single linear factor equal to D + 2C, the last term plus twice the penultimate. The worked example below checks out numerically.',
    examples: [[`${frac(1, '(x+2)(x+3)')} + ${frac(1, '(x+2)(x+4)')} = ${frac(1, '(x+2)(x+5)')} + ${frac(1, '(x+3)(x+4)')}`, `D + 2C = (x + 5) + 2(x + 4) = 3x + 13 = 0 → ${hl('x = −13/3')}`]],
    uses: ['Special rational equations'],
    read: [VM],
    scene: { kind: 'eq', steps: [
      { add: `${frac(1, 'AB')} + ${frac(1, 'AC')} = ${frac(1, 'AD')} + ${frac(1, 'BC')}`, say: 'The pattern: four factors A, B, C, D in equal steps.' },
      { add: `A = x + 2, B = x + 3, ${hl('C = x + 4')}, ${hl('D = x + 5', 'teal')}`, say: 'Here the steps are 1 apart.' },
      { add: `last + twice the second last: ${hl('(x + 5)', 'teal')} + 2${hl('(x + 4)')} = 0`, say: 'The sutra: the last plus twice the penultimate is zero.' },
      { add: `3x + 13 = 0 → x = ${hl('−13/3', 'sun')}`, say: 'Solve. Putting x = −13/3 into both sides gives the same value.' }
    ] }
  },
  'Ekanyūnena Pūrveṇa': {
    more: 'Ekanyūna means "one less". When you multiply by a number made of nines (9, 99, 999 …) with at least as many digits as the other number, the left part of the answer is one less than that number, and the right part is the nines minus the left part.',
    why: 'n × 99 = n × 100 − n = (n − 1) × 100 + (100 − n). The left part n − 1 is "one less"; the right part 100 − n equals 99 − (n − 1), which is the "all from 9" complement.',
    examples: [['67 × 99', `66 | 99 − 66 = 33 → ${hl('6633')}`], ['357 × 999', `356 | 643 → ${hl('356643')}`], ['8 × 9', `7 | 2 → ${hl('72')} (the nines finger trick)`]],
    uses: ['Times 9, 99, 999', 'The 9s times table'],
    read: [['9 times table finger trick (video)', 'https://www.youtube.com/watch?v=c8hyYXepGvI'], VM],
    scene: { kind: 'eq', steps: [
      { add: `67 × 99`, say: 'Multiply by 99.' },
      { add: `left: one less than 67 = ${hl('66')}`, say: 'One less than the number.' },
      { add: `right: 99 − 66 = ${hl('33', 'teal')}`, say: 'Take that from the nines.' },
      { add: `67 × 99 = ${hl('66', 'coral')}${hl('33', 'teal')}`, say: 'Join them. Check: 6700 − 67 = 6633.' }
    ] }
  },
  'Guṇitasamuccayaḥ': {
    more: 'The product of the sums is the sum of the product. Reduce each number to its digit sum (casting out nines), multiply those, and compare with the digit sum of the answer. If they differ, the answer is wrong. With algebra, the same idea uses the sums of coefficients.',
    why: 'A number and its digit sum leave the same remainder when divided by 9, because 10, 100, 1000 … all leave remainder 1. Remainders multiply consistently, so (digit sum of a) × (digit sum of b) must match the digit sum of a × b.',
    examples: [['47 × 23 = 1081?', `4 + 7 → 2, 2 + 3 → 5, 2 × 5 = 10 → 1. And 1 + 0 + 8 + 1 = 10 → 1. ${hl('Passes')}`], ['47 × 23 = 1071?', `1 + 0 + 7 + 1 = 9 → 0, not 1. ${hl('Caught the mistake')}`]],
    uses: ['Checking multiplication', 'Checking algebra products'],
    read: [['Casting out nines (Wikipedia)', W + 'Casting_out_nines']],
    scene: { kind: 'eq', steps: [
      { add: `47 × 23 = 1081 ?`, say: 'Is this answer right?' },
      { add: `47 → 4 + 7 = 11 → ${hl('2')} · 23 → 2 + 3 = ${hl('5')}`, say: 'Shrink each number to one digit by adding digits.' },
      { add: `2 × 5 = 10 → ${hl('1', 'teal')}`, say: 'Multiply the shrunk digits, and shrink again.' },
      { add: `1081 → 1 + 0 + 8 + 1 = 10 → ${hl('1', 'teal')}`, say: 'Shrink the answer.' },
      { add: `${hl('1 = 1', 'sun')}: the check passes`, say: 'They match. A wrong answer like 1071 would give 0 and be caught.' }
    ] }
  },
  'Guṇakasamuccayaḥ': {
    more: 'The factors of the sum are the sum of the factors. When you factor an expression, the sum of its coefficients must equal the product of the coefficient sums of the factors. It is a two-second check on any factorization.',
    why: 'The sum of coefficients of a polynomial is its value at x = 1. If p(x) = f(x) g(x), then p(1) = f(1) × g(1). So the totals must agree.',
    examples: [['x² + 5x + 6 = (x + 2)(x + 3)?', `1 + 5 + 6 = 12 and 3 × 4 = 12 → ${hl('correct')}`], ['x² + 5x + 6 = (x + 1)(x + 6)?', `2 × 7 = 14 ≠ 12 → ${hl('wrong')}`]],
    uses: ['Checking factorization'],
    read: [VM],
    scene: { kind: 'eq', steps: [
      { add: `x² + 5x + 6 = (x + 2)(x + 3) ?`, say: 'Is the factoring right?' },
      { add: `coefficients: 1 + 5 + 6 = ${hl('12')}`, say: 'Add the coefficients of the expression.' },
      { add: `factors: (1 + 2) × (1 + 3) = 3 × 4 = ${hl('12')}`, say: 'Add inside each factor, then multiply.' },
      { add: `${hl('12 = 12', 'sun')}: correct`, say: 'They agree, so the factoring passes the check.' }
    ] }
  },

  /* ================= The 13 sub-sutras ================= */
  'Ānurūpyeṇa': {
    more: 'Proportionately. If a base is awkward, scale it. 50 is 100 ÷ 2, 25 is 100 ÷ 4, 20 is 2 × 10. Do the easy work with the friendly base, then scale the result.',
    why: 'Multiplying near 50: (50 + a)(50 + b) = 50(50 + a + b) + ab. Since 50 = 5 × 10, the left part is (number + other distance) × 5, in tens.',
    examples: [['46 × 43 (working base 50)', `Cross: 46 − 7 = 39. Scale: 39 × 5 = 195 tens. Right: (−4)(−7) = 28 → 1950 + 28 = ${hl('1978')}`], ['36 × 25', `× 100 ÷ 4: 3600 ÷ 4 = ${hl('900')}`]],
    uses: ['Working bases', 'Times 5, 25, 125'],
    read: [VM],
    scene: { kind: 'eq', steps: [
      { add: `46 × 43, working base ${hl('50 = 5 × 10')}`, say: 'Both numbers sit near 50.' },
      { add: `46 is −4, 43 is −7 from 50`, say: 'Write the distances.' },
      { add: `cross: 46 − 7 = 39 → scale × 5 = ${hl('195', 'teal')}`, say: 'Cross-subtract as usual, then scale by 5.' },
      { add: `right: (−4)(−7) = ${hl('28', 'sun')}`, say: 'Multiply the distances.' },
      { add: `195 tens + 28 = ${hl('1978', 'sun')}`, say: 'Check: 46 × 43 = 1978.' }
    ] }
  },
  'Śiṣyate Śeṣasaṃjñaḥ': {
    more: 'The remainder remains constant. Remainders in a long division fall into a fixed, repeating pattern, so once you spot the pattern you know every future remainder without dividing again.',
    why: 'Each step multiplies the remainder by 10 and divides by the same number, so there are only finitely many remainders. As soon as one repeats, the whole sequence repeats.',
    examples: [['Powers of 10 divided by 7', `Remainders 1, 3, 2, 6, 4, 5, then 1 again: ${hl('a cycle of 6')}`], ['10ⁿ divided by 9', `Always remainder ${hl('1')}, which is why digit sums work`]],
    uses: ['Recurring decimals', 'Divisibility'],
    read: [['Repeating decimal (Wikipedia)', W + 'Repeating_decimal']],
    scene: { w: 440, h: 320, steps: [
      { add: `${C(220, 160, 110, 'sc-line sc-faintline')}${T(220, 160, '10ⁿ ÷ 7', 'sc-big')}`, say: 'Divide 1, 10, 100, 1000 … by 7 and keep only the remainders.' },
      ...[1, 3, 2, 6, 4, 5].map((r, i) => { const a = -Math.PI / 2 + i * Math.PI / 3; return { add: `${DOT(220 + 110 * Math.cos(a), 160 + 110 * Math.sin(a), 20, i % 2 ? 'vz-teal' : 'vz-sky')}${T(220 + 110 * Math.cos(a), 160 + 110 * Math.sin(a), r, 'vz-tb')}`, say: `Remainder ${r}.` }; }),
      { add: P('M330 160 A 110 110 0 0 1 220 270', 'sc-line sc-arrow'), say: 'Then it comes back to 1, and the same six remainders repeat forever.' }
    ] }
  },
  'Ādyamādyenāntyamantyena': {
    more: 'The first by the first and the last by the last. When you factor a quadratic, the first terms of the factors multiply to give the first term, and the last terms multiply to give the last term. Only the middle term needs a cross check.',
    why: '(px + q)(rx + s) = pr·x² + (ps + qr)x + qs. The first coefficient is p × r and the last is q × s, exactly "first by first, last by last".',
    examples: [['2x² + 7x + 6', `First 2x² = 2x · x, last 6 = 3 · 2, middle 2x·2 + 3·x = 7x → ${hl('(2x + 3)(x + 2)')}`], ['3x² + 10x + 8', `${hl('(3x + 4)(x + 2)')}: 6x + 4x = 10x`]],
    uses: ['Factoring quadratics'],
    read: [['Factorization (Wikipedia)', W + 'Factorization']],
    scene: { w: 440, h: 300, steps: [
      { add: `${T(110, 20, '2x', 'vz-tb')}${T(235, 20, '+3', 'vz-tb')}${T(22, 105, 'x', 'vz-tb')}${T(22, 225, '+2', 'vz-tb')}`, say: 'Factor 2x² + 7x + 6 as a rectangle: (2x + 3) by (x + 2).' },
      { add: R(40, 40, 140, 130, 'vz-sky', '2x²'), say: 'First by first: 2x · x = 2x².' },
      { add: R(180, 170, 110, 110, 'vz-sun', '6'), say: 'Last by last: 3 · 2 = 6.' },
      { add: `${R(180, 40, 110, 130, 'vz-teal', '3x')}${R(40, 170, 140, 110, 'vz-teal', '4x')}`, say: 'The two cross pieces, 3x and 4x, make the middle term 7x.' },
      { add: T(370, 160, '(2x+3)(x+2)', 'vz-tb'), say: 'So 2x² + 7x + 6 = (2x + 3)(x + 2).' }
    ] }
  },
  'Kevalaiḥ Saptakaṃ Guṇyāt': {
    more: 'For 7, the multiplier is 143. Because 7 × 143 = 1001, the fraction 1/7 can be rewritten with a denominator made of nines, which makes its repeating decimal appear at once.',
    why: '1/7 = 143/1001 = 143 × 999 / 999999. And 143 × 999 = 142857 (using "one less" and "all from 9"). A fraction over 999999 repeats its six digits: 1/7 = 0.142857 142857 …',
    examples: [['7 × 143', hl('1001')], ['143 × 999', `142 | 857 → ${hl('142857')}`], ['2/7, 3/7 …', `The same six digits rotate: 2/7 = 0.${hl('285714')}…`]],
    uses: ['Decimals of sevenths', 'Cyclic numbers'],
    read: [['Cyclic number (Wikipedia)', W + 'Cyclic_number']],
    scene: { kind: 'eq', steps: [
      { add: `7 × ${hl('143')} = 1001`, say: 'The key fact.' },
      { add: `${frac(1, 7)} = ${frac(143, 1001)} = ${frac('143 × 999', '999999')}`, say: 'Multiply top and bottom so the bottom becomes all nines.' },
      { add: `143 × 999 = 142 | 857 = ${hl('142857', 'teal')}`, say: 'One less, then all from 9.' },
      { add: `${frac(1, 7)} = 0.${hl('142857', 'sun')} ${hl('142857', 'sun')}…`, say: 'Over 999999, the six digits simply repeat.' }
    ] }
  },
  'Veṣṭanam': {
    more: 'By osculation. To test divisibility by 7, 13, 19 or 29 (and others), chop off the last digit, multiply it by a fixed "osculator", and add it to what is left. Repeat until the number is small. The osculator comes from Ekādhika: for 7, use 7 × 7 = 49 and one more than 4 is 5.',
    why: 'Multiply 10a + b by 5: you get 50a + 5b = 49a + (a + 5b). 49a is a multiple of 7, and 5 shares no factor with 7, so 10a + b is divisible by 7 exactly when a + 5b is. The same reasoning gives 4 for 13 (40 = 39 + 1), 2 for 19 and 3 for 29.',
    examples: [['Is 3192 divisible by 7?', `319 + 2×5 = 329 → 32 + 9×5 = 77 = 7 × 11 → ${hl('yes')} (3192 = 7 × 456)`], ['Osculators', '7 → 5, 13 → 4, 19 → 2, 29 → 3']],
    uses: ['Divisibility tests'],
    read: [['Divisibility rule (Wikipedia)', W + 'Divisibility_rule']],
    scene: { kind: 'eq', steps: [
      { add: `Is 3192 divisible by 7? Osculator ${hl('5')}`, say: 'For 7 the magic multiplier is 5.' },
      { add: `319${hl('2', 'teal')} → 319 + ${hl('2', 'teal')} × 5 = 329`, say: 'Chop off the 2, multiply by 5, add to 319.' },
      { add: `32${hl('9', 'teal')} → 32 + ${hl('9', 'teal')} × 5 = 77`, say: 'Again with 329.' },
      { add: `77 = 7 × 11 → ${hl('yes', 'sun')}`, say: '77 is a multiple of 7, so 3192 is too.' }
    ] }
  },
  'Yāvadūnaṃ Tāvadūnam': {
    more: 'Lessen by the deficiency. If a number is short of the base by some amount, take that same amount away from it again. This is the first half of the squaring trick near a base.',
    why: 'For a number n = B − d, the left part of n² over a base B is n − d = B − 2d, because (B − d)² = B(B − 2d) + d².',
    examples: [['97²', `3 short: 97 − 3 = 94, 3² = 09 → ${hl('9409')}`], ['8² (base 10)', `2 short: 8 − 2 = 6, 2² = 4 → ${hl('64')}`]],
    uses: ['Squares below a base'],
    read: [VM],
    scene: { kind: 'eq', steps: [
      { add: `97², base 100`, say: 'Square 97.' },
      { add: `97 is ${hl('3')} short of 100`, say: 'Find the deficiency.' },
      { add: `lessen by it again: 97 − 3 = ${hl('94', 'teal')}`, say: 'Take the same amount away again.' },
      { add: `square of the deficiency: 3² = ${hl('09', 'sun')}`, say: 'Two digits, because the base 100 has two zeros.' },
      { add: `97² = ${hl('94', 'teal')}${hl('09', 'sun')}`, say: '9409.' }
    ] }
  },
  'Yāvadūnaṃ Tāvadūnīkṛtya Vargaṃ ca Yojayet': {
    more: 'Lessen by the deficiency and set up the square of the deficiency. The complete recipe for squares near a base, and it works above the base too, where the deficiency is a surplus and you add instead.',
    why: '(B + s)² = B(B + 2s) + s². Above the base you move up by the surplus again, then attach s².',
    examples: [['104²', `4 over: 104 + 4 = 108, 4² = 16 → ${hl('10816')}`], ['1012²', `12 over: 1024 | 144 → ${hl('1024144')}`]],
    uses: ['Squares above and below a base'],
    read: [VM],
    scene: { w: 440, h: 320, steps: [
      { add: `${R(40, 40, 220, 220, 'vz-sky', '100 × 100')}`, say: '104 is 4 over 100. Start with 100 × 100 = 10000.' },
      { add: R(260, 40, 30, 220, 'vz-teal', ''), say: 'Add a 4 wide strip on the side: +400.' },
      { add: R(40, 260, 220, 30, 'vz-teal', ''), say: 'And one along the bottom: +400. That is 104 + 4 = 108 hundreds.' },
      { add: R(260, 260, 30, 30, 'vz-sun', ''), say: 'Plus the corner 4 × 4 = 16.' },
      { add: `${T(370, 120, '108 | 16', 'vz-tb')}${T(370, 150, '= 10816', 'vz-tb')}`, say: '104² = 10816.' }
    ] }
  },
  'Antyayordaśake\'pi': {
    more: 'When the last digits add to ten. If two numbers share the same front part and their last digits add to 10, multiply the front by one more than itself, then attach the product of the last digits as two digits.',
    why: '(10a + b)(10a + c) with b + c = 10: = 100a² + 10a(b + c) + bc = 100a(a + 1) + bc. The rectangle picture shows the 3 × 40 strip sliding over to complete a 40 by 50 block.',
    examples: [['43 × 47', `4 × 5 = 20, 3 × 7 = 21 → ${hl('2021')}`], ['62 × 68', `6 × 7 = 42, 2 × 8 = 16 → ${hl('4216')}`], ['104 × 106', `10 × 11 = 110, 4 × 6 = 24 → ${hl('11024')}`]],
    uses: ['Products with last digits summing to 10'],
    read: [VM],
    scene: { w: 460, h: 320, steps: [
      { add: `${T(140, 20, '40', 'vz-tb')}${T(255, 20, '7', 'vz-tb')}${T(22, 130, '40', 'vz-tb')}${T(22, 255, '3', 'vz-tb')}`, say: '43 × 47 as a rectangle: 40 + 3 by 40 + 7.' },
      { add: R(40, 40, 200, 200, 'vz-sky', '40 × 40'), say: 'The big block: 40 × 40.' },
      { add: R(240, 40, 35, 200, 'vz-teal', '280'), say: '40 × 7 = 280 on the side.' },
      { add: R(40, 240, 200, 15, 'vz-teal', ''), say: '3 × 40 = 120 along the bottom.' },
      { add: R(240, 240, 35, 15, 'vz-sun', ''), say: 'And 3 × 7 = 21 in the corner.' },
      { add: `${R(275, 40, 15, 200, 'vz-teal', '')}${P('M140 262 C 300 320, 330 240, 285 200', 'sc-line sc-arrow')}`, hide: [3], say: 'Slide the 3 × 40 strip up the side: now the block is 40 by 50.' },
      { add: `${T(380, 120, '40 × 50 = 2000', 'vz-tb')}${T(380, 150, '+ 21', 'vz-tb')}${T(380, 185, '= 2021', 'vz-tb')}`, say: '4 × 5 hundreds = 2000, plus 21: 43 × 47 = 2021.' }
    ] }
  },
  'Antyayoreva': {
    more: 'Only the last terms. In some fraction equations, the main parts of the numerator and denominator are already in the same ratio as the other side. Then only the last terms matter, and you can solve by comparing them alone.',
    why: 'Write the left side as (x(x + 1) + 1) / (x(x + 3) + 3). The big parts x(x + 1) and x(x + 3) are in the ratio (x + 1) : (x + 3), the same as the right side. For the whole fractions to match, the leftover last terms must be in that ratio too.',
    examples: [[`${frac('x² + x + 1', 'x² + 3x + 3')} = ${frac('x + 1', 'x + 3')}`, `Last terms 1 and 3: ${frac('x + 1', 'x + 3')} = ${frac(1, 3)} → ${hl('x = 0')}`]],
    uses: ['Special fraction equations'],
    read: [VM],
    scene: { kind: 'eq', steps: [
      { add: `${frac('x² + x + 1', 'x² + 3x + 3')} = ${frac('x + 1', 'x + 3')}`, say: 'A fraction equation.' },
      { add: `${frac(`x(x + 1) + ${hl('1')}`, `x(x + 3) + ${hl('3')}`)}`, say: 'Split each part into a big piece and a last term.' },
      { add: `big pieces: x(x + 1) : x(x + 3) = (x + 1) : (x + 3)`, say: 'The big pieces already match the right side.' },
      { add: `${frac('x + 1', 'x + 3')} = ${frac(hl('1', 'teal'), hl('3', 'teal'))} → 3x + 3 = x + 3 → ${hl('x = 0', 'sun')}`, say: 'So compare only the last terms. Check: at x = 0 both sides equal 1/3.' }
    ] }
  },
  'Samuccayaguṇitaḥ': {
    more: 'The sum of the products. When you multiply expressions, the sum of the coefficients of the product equals the product of the coefficient sums. A quick check for expanding brackets.',
    why: 'Again, the coefficient sum is the value at x = 1, and values multiply: (f·g)(1) = f(1) · g(1).',
    examples: [['(x + 4)(x + 5) = x² + 9x + 20', `(1 + 4)(1 + 5) = 30 and 1 + 9 + 20 = 30 → ${hl('checks out')}`]],
    uses: ['Checking expansions'],
    read: [VM],
    scene: { kind: 'eq', steps: [
      { add: `(x + 4)(x + 5) = x² + 9x + 20 ?`, say: 'Check an expansion.' },
      { add: `(1 + 4) × (1 + 5) = ${hl('30')}`, say: 'Product of the sums of the factors.' },
      { add: `1 + 9 + 20 = ${hl('30')}`, say: 'Sum of the coefficients of the product.' },
      { add: `${hl('30 = 30', 'sun')}`, say: 'They match.' }
    ] }
  },
  'Lopanasthāpanābhyām': {
    more: 'By alternate elimination and retention. To factor a big expression in x, y and z, remove one letter at a time (set it to zero), factor the small pieces, then put the pieces back together.',
    why: 'If the expression factors as (ax + by + cz)(dx + ey + fz), then setting z = 0 leaves (ax + by)(dx + ey), and setting y = 0 leaves (ax + cz)(dx + fz). Each smaller factoring reveals part of the answer.',
    examples: [['2x² + 6y² + 3z² + 7xy + 11yz + 7zx', `z = 0: (x + 2y)(2x + 3y). y = 0: (x + 3z)(2x + z). Combine → ${hl('(x + 2y + 3z)(2x + 3y + z)')}`]],
    uses: ['Factoring in several variables'],
    read: [VM],
    scene: { kind: 'eq', steps: [
      { add: `2x² + 6y² + 3z² + 7xy + 11yz + 7zx`, say: 'Factor this big expression.' },
      { add: `drop z: 2x² + 7xy + 6y² = (x + ${hl('2y')})(2x + ${hl('3y')})`, say: 'Eliminate z, keep x and y, and factor.' },
      { add: `drop y: 2x² + 7xz + 3z² = (x + ${hl('3z', 'teal')})(2x + ${hl('z', 'teal')})`, say: 'Eliminate y, keep x and z, and factor.' },
      { add: `combine: (x + 2y + 3z)(2x + 3y + z)`, say: 'Put the retained pieces together. Expanding confirms it.' }
    ] }
  },
  'Vilokanam': {
    more: 'By mere observation. Some answers can simply be seen once you know what to look for: square and cube roots of perfect powers from their last digits, or equations like x + 1/x = 10/3 that are already shaped like the answer.',
    why: 'Squares end only in 0, 1, 4, 5, 6 or 9, and each ending comes from at most two possible last digits. Cubes are even better: each last digit of a cube comes from exactly one last digit of the root.',
    examples: [['√1849', `Ends in 9 → root ends in 3 or 7. 18 is between 16 and 25 → 4_. 45² = 2025 > 1849 → ${hl('43')}`], ['∛50653', `Ends in 3 → root ends in 7. 50 is between 27 and 64 → 3_. ${hl('37')}`], ['x + 1/x = 10/3', `10/3 = 3 + 1/3 → ${hl('x = 3 or 1/3')}`]],
    uses: ['Square and cube roots', 'Equations by inspection'],
    read: [['Square root (Wikipedia)', W + 'Square_root']],
    scene: { kind: 'eq', steps: [
      { add: `√1849 = ?`, say: 'Find the square root by looking.' },
      { add: `ends in ${hl('9')} → root ends in 3 or 7`, say: '3² = 9 and 7² = 49 both end in 9.' },
      { add: `front ${hl('18', 'teal')}: 4² = 16 ≤ 18 < 25 → tens digit 4`, say: 'The front digits give the tens digit.' },
      { add: `45² = 2025 > 1849 → pick the smaller: ${hl('43', 'sun')}`, say: 'Compare with 45² to choose. 43 × 43 = 1849.' }
    ] }
  },
  'Guṇitasamuccayaḥ Samuccayaguṇitaḥ': {
    more: 'The product of the sum of the coefficients in the factors equals the sum of the coefficients in the product. It extends the checking idea to any number of factors, including cubes.',
    why: 'Evaluate at x = 1: every product of factors becomes a product of their coefficient sums.',
    examples: [['(2x + 1)(x + 3) = 2x² + 7x + 3', `3 × 4 = 12 = 2 + 7 + 3 → ${hl('correct')}`], ['(x + 1)(x + 2)(x + 3) = x³ + 6x² + 11x + 6', `2 × 3 × 4 = 24 = 1 + 6 + 11 + 6 → ${hl('correct')}`]],
    uses: ['Checking products of several factors'],
    read: [VM],
    scene: { kind: 'eq', steps: [
      { add: `(x + 1)(x + 2)(x + 3) = x³ + 6x² + 11x + 6 ?`, say: 'Check a product of three factors.' },
      { add: `factors: 2 × 3 × 4 = ${hl('24')}`, say: 'Sum each factor, then multiply.' },
      { add: `product: 1 + 6 + 11 + 6 = ${hl('24')}`, say: 'Sum the coefficients of the product.' },
      { add: `${hl('24 = 24', 'sun')}`, say: 'Equal, so the expansion is right.' }
    ] }
  }
};
