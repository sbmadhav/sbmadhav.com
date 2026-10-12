/* Progress lives in this browser only (localStorage): mastery per skill, XP, practice days and game bests.
   Mastery is a running score from 0 to 1: first tries count fully, a try after a hint counts half. */
const KEY = 'mathquest.v1';
let S = null;
const blank = () => ({ v: 1, skills: {}, xp: 0, days: {}, best: {}, last: null, grade: null });

export function load() {
  if (S) return S;
  try { S = JSON.parse(localStorage.getItem(KEY)) || blank(); } catch (e) { S = blank(); }
  if (!S.skills) S = blank();
  return S;
}
export function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
const today = () => new Date().toISOString().slice(0, 10);

export function skill(id) { load(); return S.skills[id] || { n: 0, c: 0, m: 0, streak: 0, last: 0 }; }
export const mastery = id => skill(id).m;
export const mastered = id => { const s = skill(id); return s.m >= 0.85 && s.n >= 8; };
export const started = id => skill(id).n > 0;

/* Level 1 to 3 picks how hard the next problem is */
export function level(id) { const s = skill(id); return s.m < 0.4 || s.n < 3 ? 1 : s.m < 0.75 ? 2 : 3; }

export function record(id, correct, hintsUsed) {
  load();
  const s = S.skills[id] = { ...skill(id) }, was = mastered(id);
  const score = correct ? (hintsUsed ? 0.5 : 1) : 0, rate = s.n < 5 ? 0.35 : 0.22;
  s.n++; s.c += correct ? 1 : 0; s.m = Math.round((s.m + rate * (score - s.m)) * 1000) / 1000; s.streak = correct ? s.streak + 1 : 0; s.last = Date.now();
  if (correct) S.xp += hintsUsed ? 5 : 10 + Math.min(s.streak, 5);
  S.days[today()] = (S.days[today()] || 0) + 1; S.last = id;
  save();
  return { justMastered: !was && mastered(id), streak: s.streak };
}

export function streakDays() {
  load(); let n = 0; const d = new Date();
  if (!S.days[today()]) d.setDate(d.getDate() - 1);
  for (;;) { const k = d.toISOString().slice(0, 10); if (!S.days[k]) return n; n++; d.setDate(d.getDate() - 1); }
}
export function setBest(game, score) { load(); const isBest = score > (S.best[game] || 0); if (isBest) { S.best[game] = score; save(); } return isBest; }
export const best = game => (load(), S.best[game] || 0);
export const xp = () => (load(), S.xp);
export const lastSkill = () => (load(), S.last);
export const setGrade = g => { load(); S.grade = String(g); save(); };
export const savedGrade = () => (load(), S.grade);
export function reset() { S = blank(); save(); }
export function exportData() { load(); return JSON.stringify(S); }
export function importData(txt) { const d = JSON.parse(txt); if (!d || typeof d.skills !== 'object') throw new Error('bad'); S = { ...blank(), ...d }; save(); }
