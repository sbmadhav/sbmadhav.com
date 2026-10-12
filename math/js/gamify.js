/* Gamification: levels from XP, badges, belts and daily quests. Listens to store events and celebrates. */
import * as store from './store.js';
import { SKILLS } from './skills/index.js';
import { TRICKS, BELTS } from './vedic.js';
import { GAMES } from './games.js';
import { sfx, confetti, toast, mode } from './fx.js';

/* Level n needs 50 * n * (n - 1) XP: 0, 100, 300, 600, 1000 ... */
export const levelOf = xp => Math.floor((1 + Math.sqrt(1 + xp / 12.5)) / 2);
export const xpFor = lv => 50 * lv * (lv - 1);
export function levelInfo(xp = store.xp()) { const lv = levelOf(xp), lo = xpFor(lv), hi = xpFor(lv + 1); return { lv, into: xp - lo, need: hi - lo, pct: (xp - lo) / (hi - lo) }; }
const TITLES = ['Number Rookie', 'Digit Dasher', 'Sum Sprinter', 'Times Tamer', 'Fraction Fighter', 'Sutra Scout', 'Mental Ninja', 'Equation Ace', 'Pattern Sage', 'Calculus Comet', 'Vedic Legend'];
export const titleOf = lv => TITLES[Math.min(TITLES.length - 1, Math.floor((lv - 1) / 2))];

export function beltProgress() {
  return BELTS.map(b => ({ ...b, done: b.tricks.filter(t => store.mastered('v-' + t)).length, earned: b.tricks.every(t => store.mastered('v-' + t)) }));
}
export function currentBelt() { const bp = beltProgress(); const last = [...bp].reverse().find(b => b.earned); return last || null; }

/* Badges: id, name, how to earn, test */
const masteredCount = () => SKILLS.filter(s => store.mastered(s.id)).length;
export const BADGES = [
  { id: 'first', name: 'First step', how: 'Answer your first question.', test: () => store.count('answers') >= 1 },
  { id: 'right25', name: 'Quarter century', how: 'Get 25 answers right.', test: () => store.count('right') >= 25 },
  { id: 'right100', name: 'Century', how: 'Get 100 answers right.', test: () => store.count('right') >= 100 },
  { id: 'right500', name: 'Number cruncher', how: 'Get 500 answers right.', test: () => store.count('right') >= 500 },
  { id: 'streak5', name: 'On fire', how: 'Get 5 right in a row.', test: () => store.count('bestStreak') >= 5 },
  { id: 'streak15', name: 'Unstoppable', how: 'Get 15 right in a row.', test: () => store.count('bestStreak') >= 15 },
  { id: 'master1', name: 'Skill unlocked', how: 'Master any skill.', test: () => masteredCount() >= 1 },
  { id: 'master10', name: 'Ten skills', how: 'Master 10 skills.', test: () => masteredCount() >= 10 },
  { id: 'master50', name: 'Math marathon', how: 'Master 50 skills.', test: () => masteredCount() >= 50 },
  { id: 'trick1', name: 'Trick seeker', how: 'Watch a speed trick step by step.', test: () => store.count('tricksWatched') >= 1 },
  { id: 'trick10', name: 'Trick collector', how: 'Watch 10 different speed tricks.', test: () => TRICKS.filter(t => store.seen('trick:' + t.id)).length >= 10 },
  { id: 'belt-white', name: 'White belt', how: 'Master the 3 white belt tricks.', test: () => beltProgress()[0].earned },
  { id: 'belt-green', name: 'Green belt', how: 'Reach the green belt in the Dojo.', test: () => beltProgress()[3].earned },
  { id: 'belt-black', name: 'Black belt', how: 'Earn the Vedic black belt.', test: () => beltProgress()[6].earned },
  { id: 'arena1', name: 'Arena debut', how: 'Finish an Arena round.', test: () => store.count('arena') >= 1 },
  { id: 'arena200', name: 'Arena star', how: 'Score 200 or more in one Arena round.', test: () => store.count('arenaBest') >= 200 },
  { id: 'daily3', name: 'Daily habit', how: 'Finish the daily challenge on 3 days.', test: () => store.count('dailyDays') >= 3 },
  { id: 'duel', name: 'Duelist', how: 'Play a two-player duel.', test: () => store.count('duels') >= 1 },
  { id: 'games', name: 'Game explorer', how: 'Play every game once.', test: () => GAMES.every(g => store.seen('game:' + g.id)) },
  { id: 'days7', name: 'Week warrior', how: 'Practice 7 days in a row.', test: () => store.streakDays() >= 7 },
  { id: 'sutras', name: 'Sutra scholar', how: 'Read the story of the sutras.', test: () => store.seen('sutras') },
  { id: 'watch', name: 'Video learner', how: 'Open a video or link from the Watch shelf.', test: () => store.count('watched') >= 1 },
  { id: 'level5', name: 'Level 5', how: 'Reach level 5.', test: () => levelOf(store.xp()) >= 5 },
  { id: 'level10', name: 'Level 10', how: 'Reach level 10.', test: () => levelOf(store.xp()) >= 10 }
];

/* Daily quests: three a day, same for everyone in a mode, each worth bonus XP */
const QUESTS = {
  explorer: [['answers', 8, 'Answer 8 questions'], ['games', 1, 'Play a game'], ['right', 5, 'Get 5 right']],
  challenger: [['answers', 15, 'Answer 15 questions'], ['tricksWatched', 1, 'Watch a speed trick'], ['arena', 1, 'Finish an Arena round']],
  pro: [['answers', 20, 'Answer 20 questions'], ['arena', 1, 'Finish an Arena round'], ['tricksWatched', 2, 'Watch 2 speed tricks']]
};
export function quests() {
  const day = store.today(), list = QUESTS[mode()] || QUESTS.challenger;
  return list.map(([counter, goal, label], i) => { const start = store.count(`q:${day}:${counter}:start`); const now = store.count(counter) + (counter === 'games' ? store.count('gamesPlayed') : 0); const base = start || 0; const prog = Math.max(0, now - base); return { i, counter, goal, label, prog: Math.min(goal, prog), done: store.seen(`quest:${day}:${i}`) }; });
}
let starting = false;
export function startDay() {
  const day = store.today();
  if (store.seen('day:' + day)) return;
  starting = true;
  store.markSeen('day:' + day);
  const list = QUESTS[mode()] || QUESTS.challenger;
  list.forEach(([counter]) => { const now = store.count(counter) + (counter === 'games' ? store.count('gamesPlayed') : 0); store.bump(`q:${day}:${counter}:start`, now || 0.0001); });
  starting = false;
}
function checkQuests() {
  if (starting) return;
  const day = store.today();
  quests().forEach(q => { if (!q.done && q.prog >= q.goal) { store.markSeen(`quest:${day}:${q.i}`); store.addXP(25, 'quest'); toast(`<b>Quest complete</b> ${q.label} <span class="fx-xp">+25 XP</span>`, 'ok'); sfx('badge'); } });
}

let busy = false;
function checkBadges() { if (busy) return; busy = true; BADGES.forEach(b => { if (!store.badges()[b.id] && b.test()) store.award(b.id); }); busy = false; }

export function init() {
  store.on((type, d) => {
    if (type === 'xp') { const a = levelOf(d.before), b = levelOf(d.after); if (b > a) { sfx('level'); confetti(110); toast(`<b>Level ${b}!</b> You are now a ${titleOf(b)}.`, 'win'); } checkBadges(); }
    if (type === 'badge') { const b = BADGES.find(x => x.id === d); if (b) { sfx('badge'); toast(`<span class="fx-badge"></span><b>Badge earned:</b> ${b.name}`, 'win'); } }
    if (type === 'mastered') { confetti(); toast('<b>Skill mastered!</b> A new ring is full.', 'win'); }
    if (type === 'answer' || type === 'count' || type === 'seen') { checkBadges(); if (type !== 'seen') checkQuests(); }
    if (type === 'player') { startDay(); }
  });
  startDay();
}
