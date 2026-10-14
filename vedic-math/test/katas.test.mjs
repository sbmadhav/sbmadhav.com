/* Dojo katas: 1,050 seeded levels (50 per speed trick). Every stored answer is worked out
   again here from the question text with exact arithmetic. Run: node --test vedic-math/test/ */
import test from 'node:test';
import assert from 'node:assert/strict';
import { TRICKS, BELTS } from '../js/vedic.js';
import { KATA_COUNT, KATAS_PER_TRICK, kata, kataKey, kataStars } from '../js/levels.js';
import { checkOne } from '../js/check.js';
import { verifyQuestion, solveFields, toRat } from './support/verify.mjs';

const ALL = TRICKS.flatMap(t => Array.from({ length: KATAS_PER_TRICK }, (_, i) => kata(t.id, i + 1)));
const fmt = (k, i) => `${kataKey(k.trick.id, k.n)} problem ${i + 1}`;

test('there are 1,050 katas: 21 tricks x 50', () => {
  assert.equal(TRICKS.length, 21);
  assert.equal(KATAS_PER_TRICK, 50);
  assert.equal(KATA_COUNT, 1050);
  assert.equal(ALL.length, 1050);
});

test('trick ids and kata keys are unique, and every trick has a belt', () => {
  assert.equal(new Set(TRICKS.map(t => t.id)).size, TRICKS.length);
  assert.equal(new Set(ALL.map(k => kataKey(k.trick.id, k.n))).size, 1050);
  const belted = BELTS.flatMap(b => b.tricks);
  assert.equal(new Set(belted).size, belted.length, 'a trick is in two belts');
  assert.deepEqual([...belted].sort(), TRICKS.map(t => t.id).sort());
});

test('katas are deterministic and have the advertised size', () => {
  for (const k of ALL) {
    assert.equal(k.problems.length, k.n <= 10 ? 5 : k.n <= 30 ? 6 : 8, kataKey(k.trick.id, k.n));
    assert.ok(Number.isFinite(k.par) && k.par > 0);
  }
  for (const t of TRICKS) for (const n of [1, 25, 50]) assert.deepEqual(JSON.stringify(kata(t.id, n)), JSON.stringify(kata(t.id, n)));
});

test('every kata answer is mathematically correct', () => {
  const wrong = [], unverified = [];
  let checked = 0;
  ALL.forEach(k => k.problems.forEach((p, i) => {
    if (p.kind === 'fields') {
      const want = solveFields(p);
      if (!want) { unverified.push(`${fmt(k, i)}: ${p.q}`); return; }
      want.forEach((w, j) => {
        const got = p.fields[j];
        if (!got || got.label !== w.label || Math.abs(got.answer - w.answer.toNumber()) > 1e-9) wrong.push(`${fmt(k, i)}: ${w.label} should be ${w.answer}, stored ${got && got.answer}`);
      });
      checked++; return;
    }
    const r = verifyQuestion(p);
    if (r.status === 'wrong') wrong.push(`${fmt(k, i)}: ${r.text} -> ${r.why}`);
    else if (r.status !== 'ok') unverified.push(`${fmt(k, i)}: ${r.text}`);
    else checked++;
  }));
  assert.deepEqual(wrong, [], `wrong answers:\n${wrong.join('\n')}`);
  assert.deepEqual(unverified, [], `could not verify:\n${unverified.slice(0, 20).join('\n')}`);
  assert.ok(checked > 6000, `only ${checked} problems checked`);
});

test('answer checking accepts each kata answer and rejects near misses', () => {
  for (const k of ALL) k.problems.forEach((p, i) => {
    const id = fmt(k, i);
    if (p.kind === 'fields') {
      p.fields.forEach(f => {
        assert.ok(checkOne({ kind: 'num', answer: f.answer }, String(f.answer)).ok, `${id} ${f.label}`);
        assert.ok(!checkOne({ kind: 'num', answer: f.answer }, String(f.answer + 1)).ok, `${id} ${f.label} +1`);
      });
      return;
    }
    if (p.kind === 'choice') {
      assert.ok(p.choices.includes(p.answer), `${id}: answer not among the choices`);
      assert.ok(checkOne(p, p.answer).ok, id);
      p.choices.filter(c => c !== p.answer).forEach(c => assert.ok(!checkOne(p, c).ok, `${id}: accepted ${c}`));
      return;
    }
    assert.equal(p.kind, 'num', id);
    assert.ok(checkOne(p, String(p.answer)).ok, `${id}: rejected ${p.answer}`);
    assert.ok(checkOne(p, toRat(p.answer).toString()).ok, `${id}: rejected ${toRat(p.answer)}`);
    for (const miss of [p.answer + 1, p.answer - 1, p.answer * 10]) if (miss !== p.answer) assert.ok(!checkOne(p, String(miss)).ok, `${id}: accepted ${miss} for ${p.answer}`);
  });
});

test('kata stars', () => {
  assert.equal(kataStars(5, 5, 10, 40, 0), 3);
  assert.equal(kataStars(5, 5, 50, 40, 0), 2);
  assert.equal(kataStars(5, 5, 10, 40, 1), 2);
  assert.equal(kataStars(3, 5, 10, 40, 0), 1);
  assert.equal(kataStars(2, 5, 10, 40, 0), 0);
});
