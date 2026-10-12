/* The 16 sutras and 13 sub-sutras of Vedic mathematics, as listed in Bharati Krishna Tirtha's book (1965).
   Names are traditional (IAST transliteration); meanings, plain explanations and examples are written fresh.
   tricks: ids in vedic.js that teach this sutra hands-on. Collecting a card = mastering one of its tricks. */

export const SUTRAS = [
  { n: 1, name: 'Ekādhikena Pūrveṇa', meaning: 'By one more than the one before', plain: 'Use the number that is one more than the digit before. It powers instant squares of numbers ending in 5 and long decimals like 1/19.', example: '65² → 6 × 7 = 42, then 25 → 4225', tricks: ['sq5', 'recip', 'osculator'] },
  { n: 2, name: 'Nikhilaṃ Navataścaramaṃ Daśataḥ', meaning: 'All from 9 and the last from 10', plain: 'Subtract each digit from 9 and the last one from 10. This turns subtracting from 100, 1000 or 10000 into a no-borrow job, and it is the engine of near-base multiplication.', example: '1000 − 368 → 6, 3, 2 → 632', tricks: ['from9', 'near-base', 'div9'] },
  { n: 3, name: 'Ūrdhva-Tiryagbhyām', meaning: 'Vertically and crosswise', plain: 'Multiply straight down, then crosswise, then straight down again, one column at a time. It works for any numbers and even for algebra.', example: '21 × 13 → 2|7|3 → 273', tricks: ['crosswise', 'by11', 'duplex'] },
  { n: 4, name: 'Parāvartya Yojayet', meaning: 'Transpose and apply', plain: 'Flip the sign as you move a term across, then apply it. It solves equations in one line and divides by numbers just above a base like 12 or 112.', example: '3x + 4 = x + 10 → 2x = 6 → x = 3', tricks: ['transpose'] },
  { n: 5, name: 'Śūnyaṃ Sāmyasamuccaye', meaning: 'When the totals are the same, that total is zero', plain: 'Spot the same expression on both sides of an equation and set it to zero. Many tricky-looking equations collapse instantly.', example: '(x + 3)(x + 8) = (x + 4)(x + 6) → x = 0', tricks: ['zero-sum'] },
  { n: 6, name: '(Ānurūpye) Śūnyamanyat', meaning: 'If one is in ratio, the other is zero', plain: 'In two equations, if the x numbers are in the same ratio as the answers, then y must be zero. Look before you calculate.', example: '6x + 7y = 8 and 19x + 14y = 16 → 7:14 = 8:16, so x = 0', tricks: ['ratio-zero'] },
  { n: 7, name: 'Saṅkalana-Vyavakalanābhyām', meaning: 'By adding and by subtracting', plain: 'When two equations have swapped numbers, add them and subtract them. Both answers fall out at once.', example: '5x + 3y = 13 and 3x + 5y = 11 → x + y = 3, x − y = 1', tricks: ['add-sub'] },
  { n: 8, name: 'Pūraṇāpūraṇābhyām', meaning: 'By completing or not completing', plain: 'Fill in the missing piece to make a perfect square or cube, then work with the complete shape. This is completing the square.', example: 'x² + 6x = 7 → (x + 3)² = 16', tricks: [] },
  { n: 9, name: 'Calana-Kalanābhyām', meaning: 'By sequential motion (differences and similarities)', plain: 'Look at how things change step by step. It links to rates of change, the heart of calculus.', example: 'Change of x² as x grows is about 2x', tricks: [] },
  { n: 10, name: 'Yāvadūnam', meaning: 'Whatever the amount of its deficiency', plain: 'See how far a number is from the base, go that far again, then add the square of the gap. Squares near 100 become easy.', example: '96² → 96 − 4 = 92, 4² = 16 → 9216', tricks: ['square-near'] },
  { n: 11, name: 'Vyaṣṭisamaṣṭiḥ', meaning: 'Part and whole', plain: 'Use the average or the whole group to understand each part. Handy for factoring and for symmetric problems.', example: 'Two numbers add to 20 and multiply to 96 → around 10: 10 ± 2', tricks: [] },
  { n: 12, name: 'Śeṣāṇyaṅkena Carameṇa', meaning: 'The remainders by the last digit', plain: 'Write the remainders of long division, then use the last digit to turn them into decimal digits. Great for 1/7 and friends.', example: '1/7 remainders 3, 2, 6, 4, 5, 1 → 0.142857...', tricks: [] },
  { n: 13, name: 'Sopāntyadvayamantyam', meaning: 'The last and twice the second last', plain: 'A pattern for special equations where the last term and twice the one before it add up to zero.', example: 'Used for equations with four consecutive factors', tricks: [] },
  { n: 14, name: 'Ekanyūnena Pūrveṇa', meaning: 'By one less than the one before', plain: 'Multiplying by 9, 99 or 999? Take one less than the number, then the rest is all from 9.', example: '67 × 99 → 66 | 33 → 6633', tricks: ['by9s'] },
  { n: 15, name: 'Guṇitasamuccayaḥ', meaning: 'The product of the sums is the sum of the product', plain: 'Digit sums (or coefficient sums) multiply the same way the numbers do. A two-second way to check an answer.', example: '12 × 13 = 156 → 3 × 4 = 12 → 3, and 1 + 5 + 6 = 12 → 3', tricks: ['check9'] },
  { n: 16, name: 'Guṇakasamuccayaḥ', meaning: 'The factors of the sum are the sum of the factors', plain: 'Check a factoring by adding the coefficients of each factor. If the factors are right, the totals match.', example: 'x² + 5x + 6 = (x + 2)(x + 3) → 12 = 3 × 4', tricks: [] }
];

export const SUBSUTRAS = [
  { n: 1, name: 'Ānurūpyeṇa', meaning: 'Proportionately', plain: 'Scale a hard base into an easy one. Working base 50 is 100 ÷ 2; multiplying by 25 is × 100 ÷ 4.', tricks: ['sub-base', 'times5'] },
  { n: 2, name: 'Śiṣyate Śeṣasaṃjñaḥ', meaning: 'The remainder remains constant', plain: 'Some remainders repeat in a fixed pattern, which makes long divisions predictable.', tricks: [] },
  { n: 3, name: 'Ādyamādyenāntyamantyena', meaning: 'The first by the first and the last by the last', plain: 'When factoring, the first terms multiply to the first term and the last terms to the last term.', tricks: [] },
  { n: 4, name: 'Kevalaiḥ Saptakaṃ Guṇyāt', meaning: 'For 7, the multiplier is 143', plain: '7 × 143 = 1001, which explains the repeating pattern of 1/7 = 0.142857...', tricks: [] },
  { n: 5, name: 'Veṣṭanam', meaning: 'By osculation', plain: 'A quick divisibility test: chop off the last digit, multiply it by a magic number and add it to the rest.', tricks: ['osculator'] },
  { n: 6, name: 'Yāvadūnaṃ Tāvadūnam', meaning: 'Lessen by the deficiency', plain: 'If a number is short of the base by some amount, take that same amount away again.', tricks: ['square-near'] },
  { n: 7, name: 'Yāvadūnaṃ Tāvadūnīkṛtya Vargaṃ ca Yojayet', meaning: 'Lessen by the deficiency and add its square', plain: 'The full recipe for squares near a base: go short again, then attach the square of the gap.', tricks: ['square-near'] },
  { n: 8, name: 'Antyayordaśake\'pi', meaning: 'When the last digits add to ten', plain: 'Same first part and last digits adding to 10? Multiply the first part by one more, then multiply the last digits.', tricks: ['ends10'] },
  { n: 9, name: 'Antyayoreva', meaning: 'Only the last terms', plain: 'In some equations, comparing only the last terms is enough to find the answer.', tricks: [] },
  { n: 10, name: 'Samuccayaguṇitaḥ', meaning: 'The sum of the products', plain: 'Add coefficients to check products of expressions quickly.', tricks: [] },
  { n: 11, name: 'Lopanasthāpanābhyām', meaning: 'By alternate elimination and retention', plain: 'Remove one letter at a time to factor big expressions piece by piece.', tricks: [] },
  { n: 12, name: 'Vilokanam', meaning: 'By mere observation', plain: 'Look closely and the answer appears. Square roots and cube roots of perfect powers come from patterns in the digits.', tricks: ['sqroot', 'cuberoot'] },
  { n: 13, name: 'Guṇitasamuccayaḥ Samuccayaguṇitaḥ', meaning: 'The product of the sums is the sum of the products', plain: 'The companion check for multiplying expressions: sums of coefficients multiply consistently.', tricks: ['check9'] }
];

export const HISTORY = [
  'Vedic mathematics was popularized by Bharati Krishna Tirtha, a scholar and monk who wrote the book "Vedic Mathematics", published in 1965 after his death.',
  'The book presents 16 short sutras (word formulas) and 13 sub-sutras that turn many calculations into one-line mental steps.',
  'Historians and mathematicians have pointed out that these sutras do not appear in the Vedas themselves. The author said he reconstructed them from appendices, and the methods are best seen as a 20th century system inspired by Indian tradition.',
  'Either way, the methods are real mathematics: each trick can be proved with ordinary algebra, which is a great way to see why it works.'
];
