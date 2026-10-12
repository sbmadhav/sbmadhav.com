/* Progress lives in this browser (localStorage), one record per player so a family can share a device.
   Mastery is a running score from 0 to 1: first tries count fully, a try after a hint counts half.
   Nothing here leaves the device unless the player joins an online leaderboard (cloud.js). */
const LEGACY = 'mathquest.v1', PKEY = 'vm.players', BOARD = 'vm.board';
let S = null, P = null;
const blank = () => ({ v: 2, skills: {}, xp: 0, days: {}, best: {}, last: null, grade: null, badges: {}, counts: {}, seen: {}, stars: {} });
const get = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const listeners = new Set();
export const on = fn => (listeners.add(fn), () => listeners.delete(fn));
const emit = (type, data) => listeners.forEach(fn => { try { fn(type, data); } catch (e) {} });

/* ---------- Players ---------- */
const ADJ = ['Swift', 'Clever', 'Mighty', 'Cosmic', 'Brave', 'Lucky', 'Sunny', 'Zippy', 'Witty', 'Bold', 'Jolly', 'Turbo', 'Nimble', 'Sparky', 'Quiet', 'Rapid'];
const NOUN = ['Tiger', 'Falcon', 'Otter', 'Panda', 'Comet', 'Rocket', 'Koala', 'Dolphin', 'Phoenix', 'Lynx', 'Gecko', 'Orca', 'Yak', 'Robin', 'Badger', 'Narwhal'];
export const AVATARS = ['coral', 'teal', 'sun', 'sky', 'plum'];
/* Nicknames are generated from fixed word lists, never typed, so no personal information is ever collected. */
export const makeName = () => `${ADJ[Math.floor(Math.random() * ADJ.length)]} ${NOUN[Math.floor(Math.random() * NOUN.length)]} ${String(Math.floor(Math.random() * 90) + 10)}`;
export const NAME_RE = /^[A-Z][a-z]+ [A-Z][a-z]+ \d{2}$/;

function players() {
  if (P) return P;
  P = get(PKEY);
  if (!P || !Array.isArray(P.list) || !P.list.length) {
    P = { active: 'p1', list: [{ id: 'p1', name: makeName(), avatar: 'teal', mode: null, created: Date.now() }] };
    const legacy = get(LEGACY); if (legacy && legacy.skills) put(LEGACY + '.p1', legacy);
    put(PKEY, P);
  }
  return P;
}
export const allPlayers = () => players().list;
export const player = () => players().list.find(p => p.id === P.active) || P.list[0];
export function updatePlayer(patch) { Object.assign(player(), patch); put(PKEY, P); emit('player', player()); }
export function addPlayer() { const p = { id: 'p' + Date.now().toString(36), name: makeName(), avatar: AVATARS[P.list.length % AVATARS.length], mode: null, created: Date.now() }; players().list.push(p); switchPlayer(p.id); return p; }
export function switchPlayer(id) { players(); if (!P.list.some(p => p.id === id)) return; P.active = id; put(PKEY, P); S = null; emit('player', player()); }
export function removePlayer(id) { players(); if (P.list.length < 2) return; P.list = P.list.filter(p => p.id !== id); try { localStorage.removeItem(LEGACY + '.' + id); } catch (e) {} if (P.active === id) P.active = P.list[0].id; put(PKEY, P); S = null; emit('player', player()); }

/* ---------- Progress for the active player ---------- */
const key = () => LEGACY + '.' + player().id;
export function load() { if (S) return S; S = { ...blank(), ...(get(key()) || {}) }; return S; }
export function save() { put(key(), S); }
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export function skill(id) { load(); return S.skills[id] || { n: 0, c: 0, m: 0, streak: 0, last: 0 }; }
export const mastery = id => skill(id).m;
export const mastered = id => { const s = skill(id); return s.m >= 0.85 && s.n >= 8; };
export const started = id => skill(id).n > 0;
export function level(id) { const s = skill(id); return s.m < 0.4 || s.n < 3 ? 1 : s.m < 0.75 ? 2 : 3; }

export function addXP(n, why = '') { load(); const before = S.xp; S.xp += n; save(); emit('xp', { before, after: S.xp, n, why }); }
export function bump(counter, n = 1) { load(); S.counts[counter] = (S.counts[counter] || 0) + n; save(); emit('count', { counter, value: S.counts[counter] }); return S.counts[counter]; }
export const count = c => (load(), S.counts[c] || 0);
export function markSeen(k) { load(); if (S.seen[k]) return false; S.seen[k] = Date.now(); save(); emit('seen', k); return true; }
export const seen = k => (load(), !!S.seen[k]);
export function award(badge) { load(); if (S.badges[badge]) return false; S.badges[badge] = Date.now(); save(); emit('badge', badge); return true; }
export const badges = () => (load(), S.badges);
/* Stars for numbered levels (Dojo katas, Arena challenges, game levels): keeps the best 0 to 3 */
export const stars = k => (load(), (S.stars || {})[k] || 0);
export function setStars(k, n) { load(); S.stars = S.stars || {}; const was = S.stars[k] || 0; if (n > was) { S.stars[k] = n; save(); emit('stars', { k, n, was }); } return n > was; }
export const starsWhere = prefix => { load(); return Object.entries(S.stars || {}).filter(([k]) => k.startsWith(prefix)).reduce((t, [, v]) => t + v, 0); };
export const doneWhere = prefix => { load(); return Object.entries(S.stars || {}).filter(([k, v]) => k.startsWith(prefix) && v > 0).length; };

export function record(id, correct, hintsUsed) {
  load();
  const s = S.skills[id] = { ...skill(id) }, was = mastered(id);
  const score = correct ? (hintsUsed ? 0.5 : 1) : 0, rate = s.n < 5 ? 0.35 : 0.22;
  s.n++; s.c += correct ? 1 : 0; s.m = Math.round((s.m + rate * (score - s.m)) * 1000) / 1000; s.streak = correct ? s.streak + 1 : 0; s.last = Date.now();
  S.days[today()] = (S.days[today()] || 0) + 1; S.last = id; S.counts.answers = (S.counts.answers || 0) + 1; if (correct) S.counts.right = (S.counts.right || 0) + 1;
  S.counts.bestStreak = Math.max(S.counts.bestStreak || 0, s.streak);
  save();
  const gain = correct ? (hintsUsed ? 5 : 10 + Math.min(s.streak, 5)) : 0;
  if (gain) addXP(gain, 'answer');
  const justMastered = !was && mastered(id);
  emit('answer', { id, correct, streak: s.streak, justMastered });
  if (justMastered) emit('mastered', id);
  return { justMastered, streak: s.streak, gain };
}

export function streakDays() {
  load(); let n = 0; const d = new Date();
  const k = x => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  if (!S.days[k(d)]) d.setDate(d.getDate() - 1);
  for (;;) { if (!S.days[k(d)]) return n; n++; d.setDate(d.getDate() - 1); }
}
export function touchDay() { load(); S.days[today()] = (S.days[today()] || 0) + 1; save(); }
export function setBest(game, score) { load(); const isBest = score > (S.best[game] || 0); if (isBest) { S.best[game] = score; save(); } return isBest; }
export const best = game => (load(), S.best[game] || 0);
export const xp = () => (load(), S.xp);
export const lastSkill = () => (load(), S.last);
export const setGrade = g => { load(); S.grade = String(g); save(); };
export const savedGrade = () => (load(), S.grade);
export function reset() { S = blank(); save(); emit('player', player()); }
export function exportData() { load(); return JSON.stringify({ player: player(), data: S }); }
export function importData(txt) { const d = JSON.parse(txt); const data = d.data || d; if (!data || typeof data.skills !== 'object') throw new Error('bad'); S = { ...blank(), ...data }; save(); }

/* ---------- Device leaderboard: every player on this device ---------- */
export function boardAdd(board, score) {
  const all = get(BOARD) || [], p = player();
  const i = all.findIndex(e => e.board === board && e.pid === p.id);
  if (i >= 0) { if (score <= all[i].score) return false; all[i] = { ...all[i], score, name: p.name, avatar: p.avatar, ts: Date.now() }; }
  else all.push({ board, pid: p.id, name: p.name, avatar: p.avatar, score, ts: Date.now() });
  put(BOARD, all.filter(e => Date.now() - e.ts < 90 * 864e5).slice(-500)); return true;
}
export const boardTop = (board, n = 10) => (get(BOARD) || []).filter(e => e.board === board).sort((a, b) => b.score - a.score).slice(0, n);
