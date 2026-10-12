/* Online leaderboards on Firebase (Google Cloud): Firestore plus anonymous sign-in.
   Loaded lazily, only when a leaderboard is opened, so it never slows the first view.
   Stores only a generated nickname, an avatar color and a score: no names, emails or ages. */
import { FIREBASE } from './cloud-config.js';

const V = '10.12.2', CDN = `https://www.gstatic.com/firebasejs/${V}`;
let ready = null;
export const enabled = () => !!(FIREBASE && FIREBASE.projectId);

async function boot() {
  if (!enabled()) throw new Error('off');
  if (ready) return ready;
  ready = (async () => {
    const [{ initializeApp }, auth, fs] = await Promise.all([import(`${CDN}/firebase-app.js`), import(`${CDN}/firebase-auth.js`), import(`${CDN}/firebase-firestore.js`)]);
    const app = initializeApp(FIREBASE), a = auth.getAuth(app);
    await a.authStateReady(); /* wait for the saved session, or every visit would sign in as a new player */
    if (!a.currentUser) await auth.signInAnonymously(a);
    return { uid: a.currentUser.uid, db: fs.getFirestore(app), fs };
  })();
  ready.catch(() => { ready = null; });
  return ready;
}

/* Keeps one entry per player per board; a lower score never replaces a higher one (enforced by the rules too). */
export async function submit(board, entry) {
  const { uid, db, fs } = await boot();
  const score = Math.max(0, Math.min(2000, Math.round(Number(entry.score) || 0))); /* rules accept an integer 0 to 2000 */
  const ref = fs.doc(db, 'boards', board, 'scores', uid);
  const cur = await fs.getDoc(ref);
  if (cur.exists() && cur.data().score >= score) return false;
  await fs.setDoc(ref, { name: entry.name, avatar: entry.avatar, score, ts: fs.serverTimestamp() });
  return true;
}
export async function top(board, n = 20) {
  const { uid, db, fs } = await boot();
  const snap = await fs.getDocs(fs.query(fs.collection(db, 'boards', board, 'scores'), fs.orderBy('score', 'desc'), fs.limit(n)));
  return snap.docs.map(d => ({ ...d.data(), me: d.id === uid }));
}

/* Board ids: daily-2026-10-12-challenger and week-2026-W42-challenger */
export const dayId = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export function weekId(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)), wk = Math.ceil(((t - y0) / 864e5 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(wk).padStart(2, '0')}`;
}
