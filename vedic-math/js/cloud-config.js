/* Online leaderboards (optional). Paste the Firebase web app config here to turn them on.
   The web config is public by design; security comes from firestore.rules (create-only, validated, anonymous auth).
   Leave as null to keep leaderboards on this device only. Setup steps: /vedic-math/cloud/README.md */
export const FIREBASE = null;

/* Firebase App Check (optional, recommended): proves writes come from this site, not a script.
   Paste the reCAPTCHA site key registered for this web app in Firebase console > App Check.
   Empty means App Check stays off and nothing changes. Steps: /vedic-math/cloud/README.md (App Check). */
export const appCheckSiteKey = '';
/* 'enterprise' for a reCAPTCHA Enterprise key (recommended), 'v3' for a classic reCAPTCHA v3 key. */
export const appCheckProvider = 'enterprise';
