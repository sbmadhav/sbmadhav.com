# Online leaderboards (Firebase on Google Cloud)

Leaderboards work on each device out of the box. To make them global, connect a Firebase project (the free Spark plan is enough).

Data model: `boards/{board}/scores/{uid}` with `{ name, avatar, score, ts }`. Board ids look like `daily-2026-10-12-challenger` and `week-2026-W42-pro`. Each anonymous player has one entry per board, and it only changes when the new score is higher. The browser client is `vedic-math/js/cloud.js`; the config lives in `vedic-math/js/cloud-config.js`.

## One command (recommended)

On a machine with the Google Cloud CLI (`gcloud`) and Node.js, from the repo root:

```
bash vedic-math/cloud/setup.sh
```

It asks for a project id (default `sbmadhav-vedic-math`; or pass it: `bash vedic-math/cloud/setup.sh my-id`) and is safe to re-run. It:

1. Signs you in to `gcloud` and Firebase if needed (a browser window opens for each).
2. Creates the Google Cloud project if missing, enables the APIs and adds Firebase to it.
3. Creates the Firestore database in native mode (location `nam5`; override with `REGION=us-east1`).
4. Turns on Anonymous sign-in and adds `localhost`, `sbmadhav.com` and `www.sbmadhav.com` to the authorized domains (Identity Toolkit admin API).
5. Deploys `firestore.rules` and `firestore.indexes.json` from this folder.
6. Creates a Firebase web app if none exists and writes its config into `vedic-math/js/cloud-config.js`.
7. Prints the next steps (commit and push) and optional hardening commands.

If step 4 says Authentication is not initialized, open the Authentication page in the Firebase console, click **Get started** once, and run the script again.

## Manual path (Firebase console)

1. In the Firebase console, create a project (or add Firebase to an existing Google Cloud project).
2. Build > Authentication > Get started > Sign-in method: enable **Anonymous**.
3. Build > Firestore Database: create a database in production mode (pick a US location such as `nam5`).
4. Deploy the rules and indexes from this folder: `npx firebase-tools deploy --only firestore --project <project-id>` (run inside `vedic-math/cloud`).
5. Project settings > Your apps > add a **Web app**, copy its config object, and paste it into `vedic-math/js/cloud-config.js` (keep the comment at the top):
   `export const FIREBASE = { apiKey: "...", authDomain: "...", projectId: "...", appId: "..." };`
6. Authentication > Settings > Authorized domains: add `sbmadhav.com` (and `www.sbmadhav.com`; `localhost` is there by default).
7. Commit and push `cloud-config.js`.
8. Recommended: App Check with reCAPTCHA Enterprise, and a budget alert in Google Cloud billing (the script prints both).

The web config is public by design. Security comes from the rules: anonymous sign-in is required to write, each player can write only their own entry, fields are validated, and nobody can delete.

## Rules tests

`test/` runs `firestore.rules` against the local Firestore emulator with `@firebase/rules-unit-testing`. Needs Node.js 20+ and Java 11+ (the emulator is a Java program). No Google account or project is used.

```
cd vedic-math/cloud/test
npm install
npm test
```

They cover: creating your own entry, writing another player's entry, invalid board ids, nicknames, avatars, scores (non-integer, negative, over 2000), extra or missing fields, a client-set timestamp, updates that do not raise the score, deletes, public reads (including a not-yet-existing entry), reads and writes elsewhere, and a top-20 `orderBy('score', 'desc')` query with no composite index. Run them after any change to `firestore.rules`.

## Privacy

- Players are anonymous: Firebase Anonymous Auth gives each browser a random id. No email, name, age or account.
- An entry holds only a generated nickname (from fixed word lists, never typed), one of five avatar colors, an integer score and a server timestamp. The rules reject anything else.
- Nothing is sent unless online leaderboards are turned on in `cloud-config.js`, and the Firebase SDK loads only when a leaderboard is opened or an Arena score is sent.
- Entries cannot be deleted from the browser. To remove data, delete documents or old boards in the Firebase console.
