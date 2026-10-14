/* Answer checking (check.js): what learners can type, and near misses it must refuse. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { checkOne, evalNum } from '../js/check.js';

const ok = (spec, s) => assert.ok(checkOne(spec, s).ok, `should accept ${JSON.stringify(s)} for ${JSON.stringify(spec)}`);
const no = (spec, s) => assert.ok(!checkOne(spec, s).ok, `should reject ${JSON.stringify(s)} for ${JSON.stringify(spec)}`);

test('numbers in many spellings', () => {
  const n = { kind: 'num', answer: 1225 };
  ['1225', ' 1225 ', '1,225', '1225.0', '35^2', '35²', '1200+25'].forEach(s => ok(n, s));
  ['1224', '1226', '12250', '122.5', '', 'abc', '1225x'].forEach(s => no(n, s));
  ok({ kind: 'num', answer: -7 }, '−7'); ok({ kind: 'num', answer: -7 }, '-7'); no({ kind: 'num', answer: -7 }, '7');
  ok({ kind: 'num', answer: 0.75 }, '3/4'); ok({ kind: 'num', answer: 0.75 }, '.75'); no({ kind: 'num', answer: 0.75 }, '0.76');
  ok({ kind: 'num', answer: 1e6 }, '1,000,000'); no({ kind: 'num', answer: 1e6 }, '1,000,001');
  assert.equal(checkOne(n, '').empty, true);
});

test('big products keep exact precision', () => {
  ok({ kind: 'num', answer: 998001 }, '998001'); no({ kind: 'num', answer: 998001 }, '998002');
  ok({ kind: 'num', answer: 99980001 }, '99980001'); no({ kind: 'num', answer: 99980001 }, '99980002');
});

test('fractions in simplest form', () => {
  const f = { kind: 'num', answer: 7 / 6, simplest: true };
  ok(f, '7/6'); no(f, '14/12'); no(f, '1.1666'); no(f, '8/6');
  assert.match(checkOne(f, '14/12').msg, /simplify/);
  ok({ kind: 'num', answer: 2, simplest: true }, '2'); ok({ kind: 'num', answer: 2, simplest: true }, '2/1');
});

test('tolerance for rounded answers', () => {
  const r = { kind: 'num', answer: 25.13, tol: 0.02 };
  ok(r, '25.13'); ok(r, '25.14'); no(r, '25.2'); no(r, '24.13');
});

test('expressions compare by value, factored form when asked', () => {
  const e = { kind: 'expr', answer: 'x^2 - x - 6' };
  ok(e, '(x-3)(x+2)'); ok(e, 'x² − x − 6'); no(e, 'x^2 - x + 6'); no(e, 'x^2 - 6');
  const fct = { kind: 'expr', answer: '(x-3)(x+2)', form: 'factored' };
  ok(fct, '(x+2)(x-3)'); no(fct, 'x^2 - x - 6');
  ok({ kind: 'expr', answer: '2x+3y', vars: ['x', 'y'] }, '3y+2x');
});

test('sets, inequalities and complex numbers', () => {
  const s = { kind: 'set', answer: [2, -5] };
  ok(s, '2, -5'); ok(s, 'x = -5 or x = 2'); no(s, '2'); no(s, '2, 5'); no(s, '2, -5, 3');
  const q = { kind: 'ineq', answer: { op: '<', val: 4 } };
  ok(q, 'x < 4'); ok(q, '4 > x'); no(q, 'x > 4'); no(q, 'x <= 4'); no(q, 'x < 5');
  assert.match(checkOne(q, 'x > 4').msg, /direction/);
  const c = { kind: 'complex', answer: [3, 2] };
  ok(c, '3+2i'); ok(c, '2i + 3'); no(c, '3-2i'); no(c, '2+3i');
});

test('multiple choice ignores case and spacing only', () => {
  const c = { kind: 'choice', answer: 'Yes' };
  ok(c, 'yes'); ok(c, ' YES '); no(c, 'No'); no(c, 'Y');
  ok({ kind: 'choice', answer: '<' }, '<'); no({ kind: 'choice', answer: '<' }, '>');
});

test('the parser is safe and strict', () => {
  assert.ok(Number.isNaN(evalNum('alert(1)')));
  assert.ok(Number.isNaN(evalNum('2+')));
  assert.ok(Number.isNaN(evalNum('(2')));
  assert.equal(evalNum('2(3+4)'), 14);
  assert.equal(evalNum('-2^2'), -4);
  assert.equal(evalNum('2^3^2'), 512);
  assert.equal(evalNum('1/0'), NaN);
});
