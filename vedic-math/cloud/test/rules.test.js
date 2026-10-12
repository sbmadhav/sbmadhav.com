// Firestore rules tests for the Vedic Math leaderboards.
// Run with `npm test` (starts the Firestore emulator via firebase-tools; needs Java 11+).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, orderBy, limit, getDocs,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';

const RULES = readFileSync(fileURLToPath(new URL('../firestore.rules', import.meta.url)), 'utf8');
const BOARD = 'daily-2026-10-12-challenger';
const WEEK = 'week-2026-W42-pro';
const ALICE = 'alice-uid', BOB = 'bob-uid';

let env;
const ok = (over = {}) => ({ name: 'Brave Tiger 42', avatar: 'coral', score: 120, ts: serverTimestamp(), ...over });
const db = uid => (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).firestore();
const ref = (uid, who = uid, board = BOARD) => doc(db(uid), 'boards', board, 'scores', who);

// Seed a document bypassing the rules.
async function seed(board, uid, data) {
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'boards', board, 'scores', uid), data);
  });
}

before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-vedic-math', firestore: { rules: RULES } });
});
after(async () => { await env?.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); });

test('anonymous user can create own entry (daily and weekly boards)', async () => {
  await assertSucceeds(setDoc(ref(ALICE), ok()));
  await assertSucceeds(setDoc(ref(ALICE, ALICE, WEEK), ok({ avatar: 'plum', score: 0 })));
  await assertSucceeds(setDoc(ref(ALICE, ALICE, 'daily-2026-10-12-explorer'), ok({ score: 2000 })));
});

test('signed-out user cannot write', async () => {
  await assertFails(setDoc(doc(db(null), 'boards', BOARD, 'scores', ALICE), ok()));
});

test("cannot write another uid's doc", async () => {
  await assertFails(setDoc(ref(ALICE, BOB), ok()));
});

test('invalid board ids rejected', async () => {
  for (const b of ['daily-2026-10-12-legend', 'daily-26-10-12-pro', 'week-2026-42-pro', 'monthly-2026-10-pro',
    'daily-2026-10-12-pro-x', 'xdaily-2026-10-12-pro', 'DAILY-2026-10-12-pro']) {
    await assertFails(setDoc(ref(ALICE, ALICE, b), ok()), b);
  }
});

test('bad nicknames rejected', async () => {
  for (const name of ['brave Tiger 42', 'Brave Tiger 4', 'Brave Tiger 423', 'Brave  Tiger 42', 'Brave Tiger', 'BraveTiger 42',
    'Brave Tiger 42 ', 'B Tiger 42', 'Brave Tiger 42\nx', 'Ana Smith 01<script>', 'B' + 'a'.repeat(40) + ' Tiger 42', 42, null]) {
    await assertFails(setDoc(ref(ALICE), ok({ name })), String(name));
  }
});

test('bad avatars rejected', async () => {
  for (const avatar of ['red', 'Coral', '', 1, null]) await assertFails(setDoc(ref(ALICE), ok({ avatar })));
  for (const avatar of ['coral', 'teal', 'sun', 'sky', 'plum']) {
    await env.clearFirestore();
    await assertSucceeds(setDoc(ref(ALICE), ok({ avatar })));
  }
});

test('non-int, negative or >2000 scores rejected', async () => {
  for (const score of [12.5, '100', 2001, -1, 1e9, null, true]) {
    await assertFails(setDoc(ref(ALICE), ok({ score })), String(score));
  }
});

test('extra or missing fields rejected', async () => {
  await assertFails(setDoc(ref(ALICE), ok({ email: 'a@b.c' })));
  await assertFails(setDoc(ref(ALICE), ok({ age: 9 })));
  const { ts, ...noTs } = ok();
  await assertFails(setDoc(ref(ALICE), noTs));
  const { name, ...noName } = ok();
  await assertFails(setDoc(ref(ALICE), noName));
});

test('client-set ts rejected (must be serverTimestamp)', async () => {
  await assertFails(setDoc(ref(ALICE), ok({ ts: Timestamp.now() })));
  await assertFails(setDoc(ref(ALICE), ok({ ts: Timestamp.fromMillis(Date.now() + 864e5) })));
  await assertFails(setDoc(ref(ALICE), ok({ ts: 'now' })));
});

test('update only allowed with a strictly higher score', async () => {
  await assertSucceeds(setDoc(ref(ALICE), ok({ score: 100 })));
  await assertFails(setDoc(ref(ALICE), ok({ score: 100 })));
  await assertFails(setDoc(ref(ALICE), ok({ score: 50 })));
  await assertSucceeds(setDoc(ref(ALICE), ok({ score: 101, avatar: 'sky' })));
  // Partial updates that leave fields stale are also rejected (ts must be refreshed, score must rise).
  await assertFails(updateDoc(ref(ALICE), { score: 500 }));
  await assertSucceeds(updateDoc(ref(ALICE), { score: 500, ts: serverTimestamp() }));
  await assertFails(updateDoc(ref(ALICE), { score: 600, ts: serverTimestamp(), extra: 1 }));
});

test("cannot update another player's entry even with a higher score", async () => {
  await seed(BOARD, BOB, { name: 'Calm Otter 07', avatar: 'teal', score: 10, ts: Timestamp.now() });
  await assertFails(setDoc(ref(ALICE, BOB), ok({ score: 999 })));
});

test('deletes rejected', async () => {
  await assertSucceeds(setDoc(ref(ALICE), ok()));
  await assertFails(deleteDoc(ref(ALICE)));
  await assertFails(deleteDoc(ref(BOB, ALICE)));
});

test('public read of a valid board, including a missing doc (getDoc before first submit)', async () => {
  await seed(BOARD, BOB, { name: 'Calm Otter 07', avatar: 'teal', score: 10, ts: Timestamp.now() });
  await assertSucceeds(getDoc(doc(db(null), 'boards', BOARD, 'scores', BOB)));
  await assertSucceeds(getDoc(ref(ALICE)));
  const snap = await assertSucceeds(getDoc(ref(ALICE)));
  assert.equal(snap.exists(), false);
  await assertSucceeds(getDocs(collection(db(null), 'boards', WEEK, 'scores')));
});

test('reads of other paths rejected', async () => {
  await assertFails(getDoc(doc(db(ALICE), 'boards', 'daily-2026-10-12-legend', 'scores', ALICE)));
  await assertFails(getDoc(doc(db(ALICE), 'boards', BOARD)));
  await assertFails(getDoc(doc(db(ALICE), 'users', ALICE)));
  await assertFails(getDocs(collection(db(null), 'boards')));
  await assertFails(setDoc(doc(db(ALICE), 'users', ALICE), { a: 1 }));
  await assertFails(setDoc(doc(db(ALICE), 'boards', BOARD), { a: 1 }));
  await assertFails(setDoc(doc(db(ALICE), 'boards', BOARD, 'scores', ALICE, 'more', 'x'), { a: 1 }));
});

test('top-20 query ordered by score desc works with no composite index', async () => {
  // Single-field indexes are automatic in Firestore, so orderBy(score) + limit needs no entry in firestore.indexes.json.
  const indexes = JSON.parse(readFileSync(fileURLToPath(new URL('../firestore.indexes.json', import.meta.url)), 'utf8'));
  assert.deepEqual(indexes.indexes, []);
  for (let i = 0; i < 25; i++) {
    await seed(BOARD, `u${i}`, { name: 'Calm Otter 07', avatar: 'teal', score: (i * 37) % 101, ts: Timestamp.now() });
  }
  const snap = await assertSucceeds(getDocs(query(collection(db(null), 'boards', BOARD, 'scores'), orderBy('score', 'desc'), limit(20))));
  const scores = snap.docs.map(d => d.data().score);
  assert.equal(scores.length, 20);
  assert.deepEqual(scores, [...scores].sort((a, b) => b - a));
});
