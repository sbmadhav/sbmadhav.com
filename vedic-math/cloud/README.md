# Online leaderboards (Firebase on Google Cloud)

Leaderboards work on each device out of the box. To make them global, connect a Firebase project (free Spark plan is enough).

1. In the Firebase console, create a project (or add Firebase to an existing Google Cloud project).
2. Build > Authentication > Sign-in method: enable **Anonymous**.
3. Build > Firestore Database: create a database in production mode (pick a US region).
4. Deploy the rules from this folder: `npx firebase-tools deploy --only firestore --project <project-id>` (run inside `vedic-math/cloud`).
5. Project settings > Your apps > add a **Web app**, copy its config object, and paste it into `vedic-math/js/cloud-config.js`:
   `export const FIREBASE = { apiKey: "...", authDomain: "...", projectId: "...", appId: "..." };`
6. Authentication > Settings > Authorized domains: add `sbmadhav.com`.
7. Recommended: App Check with reCAPTCHA Enterprise, and a budget alert in Google Cloud billing.

Privacy: players are anonymous. Entries hold only a generated nickname (from fixed word lists), an avatar color, a score and a server timestamp. Nothing typed by a player is ever stored.
