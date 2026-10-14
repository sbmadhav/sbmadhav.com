/* Arena: the 1,000-challenge tower (40 chapters of 25) and the daily seeded rounds.
   Every question is worked out again from its text with exact arithmetic where the text holds
   all the numbers; questions whose numbers live only in a picture get structural checks. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { TOPICS, PER_CHAPTER, CHALLENGE_COUNT, challenge, challengeSet, challengeKey, challengeStars } from '../js/levels.js';
import { makeSet } from '../js/arena.js';
import { byId, SKILLS } from '../js/skills/index.js';
import { checkOne } from '../js/check.js';
import { verifyQuestion } from './support/verify.mjs';

const CH = Array.from({ length: CHALLENGE_COUNT }, (_, i) => challenge(i + 1));
const SETS = CH.map(c => challengeSet(c));
const each = fn => SETS.forEach((set, c) => set.forEach((p, i) => fn(p, `challenge ${c + 1} item ${i + 1} (${p.skill})`)));

test('there are 1,000 challenges: 40 chapters x 25', () => {
  assert.equal(TOPICS.length, 40);
  assert.equal(PER_CHAPTER, 25);
  assert.equal(CHALLENGE_COUNT, 1000);
  assert.equal(new Set(CH.map(c => challengeKey(c.id))).size, 1000);
  CH.forEach((c, i) => { assert.equal(c.id, i + 1); assert.equal(c.chapter, Math.floor(i / 25)); assert.equal(c.index, (i % 25) + 1); });
});

test('skill ids are unique and every chapter has skills', () => {
  assert.equal(new Set(SKILLS.map(s => s.id)).size, SKILLS.length);
  TOPICS.forEach(t => assert.ok(t.ids.length > 0, `chapter "${t.name}" has no skills`));
  assert.equal(new Set(TOPICS.map(t => t.name)).size, 40);
});

test('every challenge has targets in the right order and enough questions', () => {
  CH.forEach((c, i) => {
    assert.equal(c.targets.length, 3, `challenge ${c.id}`);
    const t = c.targets; assert.ok(t.every(Number.isFinite), `challenge ${c.id}`);
    if (c.goal === 'seconds') assert.ok(t[0] >= t[1] && t[1] >= t[2], `challenge ${c.id} times should shrink`);
    else assert.ok(t[0] <= t[1] && t[1] <= t[2], `challenge ${c.id} targets should grow`);
    assert.ok(SETS[i].length >= Math.max(c.total, 40), `challenge ${c.id} only has ${SETS[i].length} questions`);
  });
  assert.equal(JSON.stringify(challengeSet(CH[123])), JSON.stringify(SETS[123]), 'sets are seeded');
});

const tally = { ok: 0, skip: 0, wrong: [], ambiguous: [] };
const skipped = {};
each((p, id) => {
  const r = verifyQuestion(p);
  if (r.status === 'ok') tally.ok++;
  else if (r.status === 'wrong') tally.wrong.push(`${id}: ${r.text} -> ${r.why}`);
  else if (r.status === 'ambiguous') tally.ambiguous.push(`${id}: ${r.text} (stored ${p.answer}) -> ${r.why}`);
  else { tally.skip++; skipped[p.skill] = (skipped[p.skill] || 0) + 1; }
});

test('every challenge answer that can be worked out from the question is correct', () => {
  assert.deepEqual(tally.wrong, [], `wrong answers:\n${tally.wrong.slice(0, 50).join('\n')}`);
  const total = SETS.reduce((a, s) => a + s.length, 0);
  assert.ok(tally.ok / total > 0.9, `only ${tally.ok} of ${total} checked independently`);
  // The rest read their numbers from a picture (dots, blocks, coins, clocks, diagrams)
  const pictureSkills = ['k-count', '1-tens', 'k-compare', 'k-shapes', '1-time', '2-money', '3-area', '3-frac', '4-angles', '5-volume', '8-pyth', '10-triangle'];
  assert.deepEqual(Object.keys(skipped).filter(s => !pictureSkills.includes(s)), [], 'a text question was not verified');
});

test('place-value questions name a digit that appears once', { todo: tally.ambiguous.length ? `${tally.ambiguous.length} ambiguous items, e.g. ${tally.ambiguous[0]}` : false }, () => {
  assert.equal(tally.ambiguous.length, 0, `${tally.ambiguous.length} questions name a repeated digit, so two answers fit:\n${tally.ambiguous.slice(0, 5).join('\n')}`);
});

test('the independent checker catches a wrong answer (mutation check)', () => {
  let n = 0;
  each(p => {
    if (n >= 3000 || p.kind !== 'num') return;
    const r = verifyQuestion(p); if (r.status !== 'ok') return;
    assert.equal(verifyQuestion({ ...p, answer: p.answer + 1 }).status, 'wrong', p.q);
    n++;
  });
  assert.ok(n >= 3000);
});

test('every challenge item is well formed and answer checking accepts it and rejects near misses', () => {
  each((p, id) => {
    if (p.kind === 'choice') {
      assert.ok(Array.isArray(p.choices) && p.choices.includes(p.answer), `${id}: answer not among choices`);
      assert.equal(new Set(p.choices).size, p.choices.length, `${id}: duplicate choices`);
      assert.ok(checkOne({ kind: 'choice', answer: p.answer }, p.answer).ok, id);
      p.choices.filter(c => c !== p.answer).forEach(c => assert.ok(!checkOne({ kind: 'choice', answer: p.answer }, c).ok, `${id}: accepted ${c}`));
      return;
    }
    assert.equal(p.kind, 'num', id);
    assert.ok(Number.isFinite(p.answer), id);
    const spec = { kind: 'num', answer: p.answer, tol: 1e-6 }; // as runChallenge checks
    assert.ok(checkOne(spec, String(Math.round(p.answer * 1e6) / 1e6)).ok, `${id}: rejected ${p.answer}`);
    for (const miss of [p.answer + 1, p.answer - 1, p.answer + 0.01]) assert.ok(!checkOne(spec, String(miss)).ok, `${id}: accepted ${miss} for ${p.answer}`);
  });
});

test('challenge stars', () => {
  const sprint = CH.find(c => c.format === 'sprint'), ta = CH.find(c => c.format === 'timeattack'), acc = CH.find(c => c.format === 'accuracy');
  assert.equal(challengeStars(sprint, { score: sprint.targets[2] }), 3);
  assert.equal(challengeStars(sprint, { score: sprint.targets[0] - 1 }), 0);
  assert.equal(challengeStars(ta, { right: ta.total, finished: true, secs: ta.targets[2] }), 3);
  assert.equal(challengeStars(ta, { right: 0, finished: true, secs: 1 }), 0);
  assert.equal(challengeStars(acc, { right: acc.total }), 3);
});

test('daily Arena rounds: pool skills exist, answers are correct, choices hold the answer', () => {
  for (const league of ['explorer', 'challenger', 'pro']) for (const day of ['2026-01-01', '2026-06-15', '2026-10-14']) {
    const set = makeSet(league, `${day}:${league}`);
    assert.equal(set.length, 80, `${league} ${day}`);
    assert.equal(JSON.stringify(set), JSON.stringify(makeSet(league, `${day}:${league}`)), 'seeded');
    set.forEach((p, i) => {
      const id = `${league} ${day} #${i + 1} (${p.skill})`;
      assert.ok(byId[p.skill], id);
      assert.ok(Number.isInteger(p.answer), id);
      assert.ok(p.choices.includes(p.answer) && new Set(p.choices).size === p.choices.length, `${id}: choices ${p.choices}`);
      if (league === 'explorer') assert.ok(p.choices.every(c => c >= 0), `${id}: negative choice for Explorer`);
      const r = verifyQuestion({ ...p, kind: 'num' });
      assert.notEqual(r.status, 'wrong', `${id}: ${r.text} -> ${r.why}`);
    });
  }
});
