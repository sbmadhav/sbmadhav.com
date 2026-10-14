/* Online leaderboards on Firebase (Google Cloud): Firestore plus anonymous sign-in, and App Check when configured.
   Loaded lazily, only when a leaderboard is opened, so it never slows the first view.
   Stores only a generated nickname, an avatar color, a score and two timestamps: no names, emails or ages. */
import { FIREBASE, appCheckSiteKey, appCheckProvider } from './cloud-config.js';

const V = '10.12.2', CDN = `https://www.gstatic.com/firebasejs/${V}`;
/* Per-league score caps and the entry lifetime, mirrored from cloud/firestore.rules (the rules are the authority). */
export const MAX_SCORE = { explorer: 2000, challenger: 1600, pro: 1200 };
export const KEEP_DAYS = 30;
let ready = null;
export const enabled = () => !!(FIREBASE && FIREBASE.projectId);
export const appCheckOn = () => enabled() && !!appCheckSiteKey;

async function boot() {
  if (!enabled()) throw new Error('off');
  if (ready) return ready;
  ready = (async () => {
    const [{ initializeApp }, auth, fs, ac] = await Promise.all([import(`${CDN}/firebase-app.js`), import(`${CDN}/firebase-auth.js`), import(`${CDN}/firebase-firestore.js`),
      appCheckOn() ? import(`${CDN}/firebase-app-check.js`) : null]);
    const app = initializeApp(FIREBASE);
    if (ac) {
      /* On localhost App Check prints a debug token in the console; add it under App Check > Manage debug tokens. */
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      const Provider = appCheckProvider === 'v3' ? ac.ReCaptchaV3Provider : ac.ReCaptchaEnterpriseProvider;
      ac.initializeAppCheck(app, { provider: new Provider(appCheckSiteKey), isTokenAutoRefreshEnabled: true });
    }
    const a = auth.getAuth(app);
    await a.authStateReady(); /* wait for the saved session, or every visit would sign in as a new player */
    if (!a.currentUser) await auth.signInAnonymously(a);
    return { uid: a.currentUser.uid, db: fs.getFirestore(app), fs };
  })();
  ready.catch(() => { ready = null; });
  return ready;
}

/* Keeps one entry per player per board; a lower score never replaces a higher one (enforced by the rules too).
   Board ids end in the league; scores are even (every right answer earns an even amount) and capped per league. */
export async function submit(board, entry) {
  const cap = MAX_SCORE[board.split('-').pop()] || 0;
  let score = Math.min(cap, Math.round(Number(entry.score) || 0)); score -= score % 2;
  if (score < 10) return false; /* rules accept an even integer from 10 to the league cap */
  const { uid, db, fs } = await boot();
  const ref = fs.doc(db, 'boards', board, 'scores', uid);
  const cur = await fs.getDoc(ref);
  if (cur.exists() && cur.data().score >= score) return false;
  const exp = fs.Timestamp.fromMillis(Date.now() + KEEP_DAYS * 864e5); /* deleted by the Firestore TTL policy on `exp` */
  await fs.setDoc(ref, { name: entry.name, avatar: entry.avatar, score, ts: fs.serverTimestamp(), exp });
  return true;
}
export async function top(board, n = 20) {
  const { uid, db, fs } = await boot();
  const snap = await fs.getDocs(fs.query(fs.collection(db, 'boards', board, 'scores'), fs.orderBy('score', 'desc'), fs.limit(Math.min(n, 20))));
  return snap.docs.map(d => ({ name: d.data().name, avatar: d.data().avatar, score: d.data().score, me: d.id === uid }));
}

/* Board ids: daily-2026-10-12-challenger and week-2026-W42-challenger */
export const dayId = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export function weekId(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)), wk = Math.ceil(((t - y0) / 864e5 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(wk).padStart(2, '0')}`;
}
