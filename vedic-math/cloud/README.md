# Online leaderboards (Firebase on Google Cloud)

Leaderboards work on each device out of the box. To make them global, connect a Firebase project (the free Spark plan is enough).

Data model: `boards/{board}/scores/{uid}` with `{ name, avatar, score, ts, exp }`. Board ids look like `daily-2026-10-12-challenger` and `week-2026-W42-pro`. Only the Arena daily round writes, to today's and this week's board for the player's league. Each anonymous player has one entry per board, and it only changes when the new score is higher. The browser client is `vedic-math/js/cloud.js`; the config lives in `vedic-math/js/cloud-config.js`.

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
7. Turns on the Firestore TTL policy on `exp`, so entries delete themselves about 30 days after the last score.
8. Prints the next steps (commit and push), the App Check steps and a budget alert command.

If step 4 says Authentication is not initialized, open the Authentication page in the Firebase console, click **Get started** once, and run the script again.

## Manual path (Firebase console)

1. In the Firebase console, create a project (or add Firebase to an existing Google Cloud project).
2. Build > Authentication > Get started > Sign-in method: enable **Anonymous**.
3. Build > Firestore Database: create a database in production mode (pick a US location such as `nam5`).
4. Deploy the rules and indexes from this folder: `npx firebase-tools deploy --only firestore --project <project-id>` (run inside `vedic-math/cloud`).
5. Project settings > Your apps > add a **Web app**, copy its config object, and paste it into `vedic-math/js/cloud-config.js` (keep the comment at the top):
   `export const FIREBASE = { apiKey: "...", authDomain: "...", projectId: "...", appId: "..." };`
6. Authentication > Settings > Authorized domains: add `sbmadhav.com` (and `www.sbmadhav.com`; `localhost` is there by default).
7. Turn on automatic deletion: Firestore Database > Time-to-live > Create policy, collection group `scores`, timestamp field `exp`. Or: `gcloud firestore fields ttls update exp --collection-group=scores --enable-ttl --project <project-id>`. The parent note on the site says entries are deleted about 30 days after the last score, so do not skip this.
8. Commit and push `cloud-config.js`.
9. Recommended: App Check (next section) and a budget alert in Google Cloud billing (the script prints the command).

The web config is public by design. Security comes from the rules and App Check (see below).

## What the rules enforce

- Anonymous sign-in is required to write, and a player can write only `scores/{their uid}`. Nobody can delete from the browser.
- Fields: exactly `name`, `avatar`, `score`, `ts`, `exp`. The nickname must be `Adjective Noun NN` using the word lists in `js/store.js` (update the rules if those lists change). `ts` must be the server time. `exp` must be 1 to 60 days ahead (the client sends 30).
- Scores: even integers from 10 to a per-league cap (every right answer earns 10 to 30 points, always even). The game has no hard maximum, so the caps assume a fast human pace for 60 seconds: Explorer 2000 (70 right in a row), Challenger 1600 (57), Pro 1200 (44). `MAX_SCORE` in `js/cloud.js` mirrors them.
- Board window: a board accepts writes only while its date (or ISO week) is current somewhere on Earth, plus an hour of slack. Old and future boards are frozen.
- Rate limit: an entry changes only when the score rises and at least 50 seconds after its last write (a round plus countdown is 62 seconds).
- Reads: a player can read only their own entry, and lists must be signed-in queries with `limit(20)` or less.

These limits make forging harder and cheaper to absorb; they do not prove a score was earned. App Check closes the main gap: scripts writing directly to Firestore from outside the site.

## App Check (recommended)

App Check makes Firestore accept requests only from this site, using reCAPTCHA. The client wiring is already in `js/cloud.js` and stays off until `appCheckSiteKey` in `js/cloud-config.js` is set.

1. Enable the APIs: `gcloud services enable recaptchaenterprise.googleapis.com firebaseappcheck.googleapis.com --project <project-id>`.
2. Firebase console > App Check > Apps: pick the web app and register it with **reCAPTCHA Enterprise**. Create a key for the domains `sbmadhav.com`, `www.sbmadhav.com` and `localhost` (the console can create it for you), and save.
   A classic reCAPTCHA v3 key also works: register with **reCAPTCHA** instead and set `appCheckProvider = 'v3'`.
3. Paste the site key into `appCheckSiteKey` in `js/cloud-config.js`, commit and push. Run `python3 site-build.py` if the service worker caches the page.
4. For local testing, open the site on `localhost`: the console prints an App Check debug token. Add it under App Check > Apps > Manage debug tokens.
5. Leave enforcement off for a few days and watch App Check > APIs > Cloud Firestore. When nearly all requests show as verified, click **Enforce** for Cloud Firestore. Also enforce for Authentication if the console offers it (blocks scripted creation of anonymous accounts).
6. If the page sets a Content Security Policy later, allow `https://www.google.com/recaptcha/`, `https://www.gstatic.com/recaptcha/` and `https://content-firebaseappcheck.googleapis.com`.

When App Check is on, the parent note on the site also mentions that Google reCAPTCHA checks scores come from the site.

## Rules tests

`test/` runs `firestore.rules` against the local Firestore emulator with `@firebase/rules-unit-testing`. Needs Node.js 20+ and Java 11+ (the emulator is a Java program). No Google account or project is used.

```
cd vedic-math/cloud/test
npm install
npm test
```

Board ids in the tests are built from today's date, because past and future boards are frozen. They cover: creating your own entry in every league, writing another player's entry, invalid board ids, past and future boards, nicknames (shape and word lists), avatars, scores (odd, non-integer, below 10, over each league cap), extra or missing fields, a client-set `ts`, `exp` bounds, updates that do not raise the score, partial updates, the 50 second rate limit, deletes, reads of your own entry only, list queries (signed in, `limit` 20 or less), reads and writes elsewhere, and a top-20 `orderBy('score', 'desc')` query with no composite index. Run them after any change to `firestore.rules`.

## Privacy

- Players are anonymous: Firebase Anonymous Auth gives each browser a random id. No email, name, age or account.
- An entry holds only a generated nickname (from fixed word lists, never typed), one of five avatar colors, an integer score, a server timestamp and an expiry time. The rules reject anything else. The document id is the Firebase anonymous user id; Firebase Authentication keeps that id with its created and last sign-in dates.
- Nothing is sent unless online leaderboards are turned on in `cloud-config.js`, and the Firebase SDK loads only when a leaderboard is opened or an Arena score is sent.
- Entries are deleted by the TTL policy about 30 days after the last score (TTL usually runs within a day of the expiry). They cannot be deleted from the browser. To honor a removal request, find the entry by nickname and color in the Firebase console and delete it.
- The site shows a note for parents next to the nickname (Me page) and the leaderboards (Arena, home). It is `parentNote()` in `js/app.js`; keep it in sync with this section.


## Boards

- **Arena daily race:** `daily-YYYY-MM-DD-<league>` and `week-YYYY-Www-<league>`.
- **Ranked game boards:** `g_<game>-daily-...` and `g_<game>-week-...` for each of the 14 games (game ids use `_`, for example `g_times_sprint`). Scores are difficulty-weighted points, capped at 12000.
- **Weekly XP:** `xp-week-YYYY-Www-<league>`, XP earned this week across everything, capped at 60000.

After changing `firestore.rules`, deploy it with:

```
cd vedic-math/cloud && npx firebase-tools deploy --only firestore:rules --project sbmadhav-vedic-math
```
