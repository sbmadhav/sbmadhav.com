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

// Boards are only writable while their date or ISO week is current somewhere on Earth, so ids are built from today (UTC).
const DAY = 864e5;
const dayId = ms => new Date(ms).toISOString().slice(0, 10);
function weekId(ms) {
  const t = new Date(ms); t.setUTCHours(0, 0, 0, 0); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
  const wk = Math.ceil(((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / DAY + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(wk).padStart(2, '0')}`;
}
const NOW = Date.now();
const BOARD = `daily-${dayId(NOW)}-challenger`;
const WEEK = `week-${weekId(NOW)}-pro`;
const ALICE = 'alice-uid', BOB = 'bob-uid';

let env;
const exp = (ms = 30 * DAY) => Timestamp.fromMillis(Date.now() + ms);
const ok = (over = {}) => ({ name: 'Brave Tiger 42', avatar: 'coral', score: 120, ts: serverTimestamp(), exp: exp(), ...over });
const old = (over = {}) => ({ name: 'Calm Otter 07', avatar: 'teal', score: 10, ts: Timestamp.fromMillis(Date.now() - 120e3), exp: exp(), ...over });
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

test('anonymous user can create own entry (daily and weekly boards, every league)', async () => {
  await assertSucceeds(setDoc(ref(ALICE), ok()));
  await assertSucceeds(setDoc(ref(ALICE, ALICE, WEEK), ok({ avatar: 'plum', score: 10 })));
  await assertSucceeds(setDoc(ref(ALICE, ALICE, `daily-${dayId(NOW)}-explorer`), ok({ score: 2000 })));
  await assertSucceeds(setDoc(ref(ALICE, ALICE, `week-${weekId(NOW)}-challenger`), ok({ score: 1600 })));
  await assertSucceeds(setDoc(ref(ALICE, ALICE, `daily-${dayId(NOW)}-pro`), ok({ score: 1200 })));
});

test('signed-out user cannot write', async () => {
  await assertFails(setDoc(doc(db(null), 'boards', BOARD, 'scores', ALICE), ok()));
});

test("cannot write another uid's doc", async () => {
  await assertFails(setDoc(ref(ALICE, BOB), ok()));
});

test('invalid board ids rejected', async () => {
  for (const b of [`daily-${dayId(NOW)}-legend`, 'daily-26-10-12-pro', 'week-2026-42-pro', 'monthly-2026-10-pro',
    `daily-${dayId(NOW)}-pro-x`, `xdaily-${dayId(NOW)}-pro`, `DAILY-${dayId(NOW)}-pro`, 'daily-2026-13-01-pro', 'daily-2026-00-10-pro', 'daily-2026-10-32-pro', `week-${new Date().getUTCFullYear() + 1}-W00-pro`, 'week-2026-W54-pro']) {
    await assertFails(setDoc(ref(ALICE, ALICE, b), ok()), b);
  }
});

test('boards for past or future days and weeks are frozen', async () => {
  for (const b of [`daily-${dayId(NOW - 3 * DAY)}-challenger`, `daily-${dayId(NOW + 2 * DAY)}-challenger`, 'daily-2020-01-01-challenger',
    `week-${weekId(NOW - 14 * DAY)}-pro`, `week-${weekId(NOW + 14 * DAY)}-pro`, 'week-2020-W10-pro']) {
    await assertFails(setDoc(ref(ALICE, ALICE, b), ok()), b);
  }
  // An existing entry on a closed board cannot be raised either.
  const closed = `daily-${dayId(NOW - 3 * DAY)}-challenger`;
  await seed(closed, ALICE, old({ name: 'Brave Tiger 42' }));
  await assertFails(setDoc(ref(ALICE, ALICE, closed), ok({ score: 500 })));
});

test('bad nicknames rejected', async () => {
  for (const name of ['brave Tiger 42', 'Brave Tiger 4', 'Brave Tiger 423', 'Brave  Tiger 42', 'Brave Tiger', 'BraveTiger 42',
    'Brave Tiger 42 ', 'B Tiger 42', 'Brave Tiger 42\nx', 'Ana Smith 01<script>', 'B' + 'a'.repeat(40) + ' Tiger 42', 42, null,
    'Angry Tiger 42', 'Brave Hippo 42', 'Ana Smith 42', 'Tiger Brave 42', 'Brave Tiger 05']) {
    await assertFails(setDoc(ref(ALICE), ok({ name })), String(name));
  }
});

test('every generated nickname shape is accepted', async () => {
  for (const name of ['Swift Narwhal 10', 'Rapid Yak 99', 'Sparky Phoenix 57', 'Quiet Lynx 23']) {
    await env.clearFirestore();
    await assertSucceeds(setDoc(ref(ALICE), ok({ name })), name);
  }
});

test('bad avatars rejected', async () => {
  for (const avatar of ['red', 'Coral', '', 1, null]) await assertFails(setDoc(ref(ALICE), ok({ avatar })));
  for (const avatar of ['coral', 'teal', 'sun', 'sky', 'plum']) {
    await env.clearFirestore();
    await assertSucceeds(setDoc(ref(ALICE), ok({ avatar })));
  }
});

test('scores must be even integers from 10 to the league cap', async () => {
  for (const score of [12.5, '100', 121, 0, 8, -2, 1e9, null, true, 1602, 2000]) {
    await assertFails(setDoc(ref(ALICE), ok({ score })), `challenger ${score}`);
  }
  await assertFails(setDoc(ref(ALICE, ALICE, `daily-${dayId(NOW)}-explorer`), ok({ score: 2002 })));
  await assertFails(setDoc(ref(ALICE, ALICE, `daily-${dayId(NOW)}-pro`), ok({ score: 1202 })));
  await assertFails(setDoc(ref(ALICE, ALICE, WEEK), ok({ score: 1600 })));
  await assertSucceeds(setDoc(ref(ALICE), ok({ score: 1600 })));
});

test('extra or missing fields rejected', async () => {
  await assertFails(setDoc(ref(ALICE), ok({ email: 'a@b.c' })));
  await assertFails(setDoc(ref(ALICE), ok({ age: 9 })));
  for (const key of ['name', 'avatar', 'score', 'ts', 'exp']) {
    const { [key]: _, ...rest } = ok();
    await assertFails(setDoc(ref(ALICE), rest), `missing ${key}`);
  }
});

test('client-set ts rejected (must be serverTimestamp)', async () => {
  await assertFails(setDoc(ref(ALICE), ok({ ts: Timestamp.now() })));
  await assertFails(setDoc(ref(ALICE), ok({ ts: Timestamp.fromMillis(Date.now() + DAY) })));
  await assertFails(setDoc(ref(ALICE), ok({ ts: 'now' })));
});

test('exp must be a timestamp 1 to 60 days ahead', async () => {
  for (const e of [exp(3600e3), exp(-DAY), exp(90 * DAY), serverTimestamp(), Date.now() + 30 * DAY, 'soon', null]) {
    await assertFails(setDoc(ref(ALICE), ok({ exp: e })), String(e));
  }
  await assertSucceeds(setDoc(ref(ALICE), ok({ exp: exp(2 * DAY) })));
});

test('update only allowed with a strictly higher score', async () => {
  await seed(BOARD, ALICE, old({ name: 'Brave Tiger 42', score: 100 }));
  await assertFails(setDoc(ref(ALICE), ok({ score: 100 })));
  await assertFails(setDoc(ref(ALICE), ok({ score: 50 })));
  await assertSucceeds(setDoc(ref(ALICE), ok({ score: 102, avatar: 'sky', name: 'Lucky Orca 31' })));
});

test('partial updates must refresh ts and keep every field valid', async () => {
  await seed(BOARD, ALICE, old({ name: 'Brave Tiger 42', score: 100 }));
  await assertFails(updateDoc(ref(ALICE), { score: 500 }));
  await assertFails(updateDoc(ref(ALICE), { score: 600, ts: serverTimestamp(), extra: 1 }));
  await assertFails(updateDoc(ref(ALICE), { score: 1700, ts: serverTimestamp() }));
  await assertSucceeds(updateDoc(ref(ALICE), { score: 500, ts: serverTimestamp() }));
});

test('rate limit: an entry changes at most once per 50 seconds', async () => {
  await assertSucceeds(setDoc(ref(ALICE), ok({ score: 100 })));
  await assertFails(setDoc(ref(ALICE), ok({ score: 200 }))); // seconds later
  await seed(BOARD, ALICE, old({ name: 'Brave Tiger 42', score: 100, ts: Timestamp.fromMillis(Date.now() - 40e3) }));
  await assertFails(setDoc(ref(ALICE), ok({ score: 200 })));
  await seed(BOARD, ALICE, old({ name: 'Brave Tiger 42', score: 100, ts: Timestamp.fromMillis(Date.now() - 65e3) }));
  await assertSucceeds(setDoc(ref(ALICE), ok({ score: 200 })));
});

test("cannot update another player's entry even with a higher score", async () => {
  await seed(BOARD, BOB, old());
  await assertFails(setDoc(ref(ALICE, BOB), ok({ score: 1000 })));
});

test('deletes rejected', async () => {
  await assertSucceeds(setDoc(ref(ALICE), ok()));
  await assertFails(deleteDoc(ref(ALICE)));
  await assertFails(deleteDoc(ref(BOB, ALICE)));
});

test('get: only your own entry, including a missing one (checked before the first submit)', async () => {
  await seed(BOARD, BOB, old());
  const snap = await assertSucceeds(getDoc(ref(ALICE)));
  assert.equal(snap.exists(), false);
  await assertSucceeds(getDoc(ref(BOB)));
  await assertFails(getDoc(ref(ALICE, BOB)));
  await assertFails(getDoc(doc(db(null), 'boards', BOARD, 'scores', BOB)));
});

test('list: signed-in top-20 queries only', async () => {
  const scores = uid => collection(db(uid), 'boards', WEEK, 'scores');
  await assertSucceeds(getDocs(query(scores(ALICE), orderBy('score', 'desc'), limit(20))));
  await assertSucceeds(getDocs(query(scores(ALICE), orderBy('score', 'desc'), limit(5))));
  await assertFails(getDocs(query(scores(ALICE), orderBy('score', 'desc'), limit(21))));
  await assertFails(getDocs(scores(ALICE)));
  await assertFails(getDocs(query(scores(null), orderBy('score', 'desc'), limit(20))));
  await assertFails(getDocs(query(collection(db(ALICE), 'boards', 'daily-2026-10-12-legend', 'scores'), limit(20))));
});

test('reads and writes of other paths rejected', async () => {
  await assertFails(getDoc(doc(db(ALICE), 'boards', `daily-${dayId(NOW)}-legend`, 'scores', ALICE)));
  await assertFails(getDoc(doc(db(ALICE), 'boards', BOARD)));
  await assertFails(getDoc(doc(db(ALICE), 'users', ALICE)));
  await assertFails(getDocs(query(collection(db(ALICE), 'boards'), limit(5))));
  await assertFails(setDoc(doc(db(ALICE), 'users', ALICE), { a: 1 }));
  await assertFails(setDoc(doc(db(ALICE), 'boards', BOARD), { a: 1 }));
  await assertFails(setDoc(doc(db(ALICE), 'boards', BOARD, 'scores', ALICE, 'more', 'x'), { a: 1 }));
});

test('old boards stay readable (the board window applies to writes only)', async () => {
  const past = 'daily-2020-01-01-pro';
  await seed(past, BOB, old());
  await assertSucceeds(getDocs(query(collection(db(ALICE), 'boards', past, 'scores'), orderBy('score', 'desc'), limit(20))));
});

test('top-20 query ordered by score desc works with no composite index', async () => {
  // Single-field indexes are automatic in Firestore, so orderBy(score) + limit needs no entry in firestore.indexes.json.
  const indexes = JSON.parse(readFileSync(fileURLToPath(new URL('../firestore.indexes.json', import.meta.url)), 'utf8'));
  assert.deepEqual(indexes.indexes, []);
  for (let i = 0; i < 25; i++) {
    await seed(BOARD, `u${i}`, old({ score: 10 + 2 * ((i * 37) % 101) }));
  }
  const snap = await assertSucceeds(getDocs(query(collection(db(ALICE), 'boards', BOARD, 'scores'), orderBy('score', 'desc'), limit(20))));
  const scores = snap.docs.map(d => d.data().score);
  assert.equal(scores.length, 20);
  assert.deepEqual(scores, [...scores].sort((a, b) => b - a));
});

/* ---------- Ranked game boards and the weekly XP board ---------- */
const GAME_IDS = ['balloons', 'more_less', 'make_ten', 'quick_look', 'bonds', 'times_sprint', 'target', 'frac_faceoff', 'line_snipe', 'pairs', 'check_it', 'rain', 'sequence', 'balance'];

test('every game has writable daily and weekly boards in every league', async () => {
  for (const g of GAME_IDS) for (const L of ['explorer', 'challenger', 'pro']) {
    await assertSucceeds(setDoc(ref(ALICE, ALICE, `g_${g}-daily-${dayId(NOW)}-${L}`), ok({ score: 437 })), `${g} daily ${L}`);
  }
  await assertSucceeds(setDoc(ref(ALICE, ALICE, `g_times_sprint-week-${weekId(NOW)}-pro`), ok({ score: 4321 })));
});

test('game boards: odd scores allowed, cap 12000, unknown games and bad shapes rejected', async () => {
  const b = `g_rain-daily-${dayId(NOW)}-challenger`;
  for (const score of [9, 12001, 12.5, -10]) await assertFails(setDoc(ref(ALICE, ALICE, b), ok({ score })), `rain ${score}`);
  await assertSucceeds(setDoc(ref(ALICE, ALICE, b), ok({ score: 12000 })));
  for (const bad of [`g_chess-daily-${dayId(NOW)}-pro`, `g_make-ten-daily-${dayId(NOW)}-pro`, `g_-daily-${dayId(NOW)}-pro`, `g_rain-${dayId(NOW)}-pro`, `g_rain-monthly-2026-10-pro`, `x_rain-daily-${dayId(NOW)}-pro`]) {
    await assertFails(setDoc(ref(ALICE, ALICE, bad), ok()), bad);
  }
});

test('game and xp boards for other days and weeks are frozen', async () => {
  for (const b of [`g_rain-daily-${dayId(NOW - 3 * DAY)}-pro`, `g_rain-daily-${dayId(NOW + 2 * DAY)}-pro`, `g_rain-week-${weekId(NOW - 14 * DAY)}-pro`, `xp-week-${weekId(NOW - 14 * DAY)}-pro`, `xp-week-${weekId(NOW + 14 * DAY)}-pro`]) {
    await assertFails(setDoc(ref(ALICE, ALICE, b), ok()), b);
  }
});

test('weekly XP board: week only, cap 60000', async () => {
  const b = `xp-week-${weekId(NOW)}-explorer`;
  await assertSucceeds(setDoc(ref(ALICE, ALICE, b), ok({ score: 1235 })));
  await assertFails(setDoc(ref(BOB, BOB, b), ok({ score: 60001 })));
  await assertSucceeds(setDoc(ref(BOB, BOB, b), ok({ score: 60000 })));
  await assertFails(setDoc(ref(ALICE, ALICE, `xp-daily-${dayId(NOW)}-pro`), ok()));
});

test('game boards keep every other protection: own entry, higher score, rate limit, no deletes', async () => {
  const b = `g_balance-daily-${dayId(NOW)}-pro`;
  await assertFails(setDoc(ref(ALICE, BOB, b), ok()));
  await seed(b, ALICE, old({ name: 'Brave Tiger 42', score: 500 }));
  await assertFails(setDoc(ref(ALICE, ALICE, b), ok({ score: 400 })));
  await assertSucceeds(setDoc(ref(ALICE, ALICE, b), ok({ score: 501 })));
  await assertFails(setDoc(ref(ALICE, ALICE, b), ok({ score: 900 })), 'second update within 50 s');
  await assertFails(deleteDoc(ref(ALICE, ALICE, b)));
  await assertSucceeds(getDocs(query(collection(db(BOB), 'boards', b, 'scores'), orderBy('score', 'desc'), limit(20))));
});
