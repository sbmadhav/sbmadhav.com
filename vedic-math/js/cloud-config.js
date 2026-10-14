/* Online leaderboards (optional). Paste the Firebase web app config here to turn them on.
   The web config is public by design; security comes from firestore.rules (create-only, validated, anonymous auth).
   Leave as null to keep leaderboards on this device only. Setup steps: /vedic-math/cloud/README.md */
export const FIREBASE = {
  apiKey: "AIzaSyAXNXSv_LoGcBKDJbTAK5x1fMui_WhJbGo",
  authDomain: "sbmadhav-vedic-math.firebaseapp.com",
  projectId: "sbmadhav-vedic-math",
  storageBucket: "sbmadhav-vedic-math.firebasestorage.app",
  messagingSenderId: "602709759985",
  appId: "1:602709759985:web:e2d3c7baa843d8c7ff1650"
};

/* Firebase App Check (optional, recommended): proves writes come from this site, not a script.
   Paste the reCAPTCHA site key registered for this web app in Firebase console > App Check.
   Empty means App Check stays off and nothing changes. Steps: /vedic-math/cloud/README.md (App Check). */
export const appCheckSiteKey = '6Lewa-8tAAAAAAT6OzsigaH7HdazVTEc5TZKS2sH';
/* 'enterprise' for a reCAPTCHA Enterprise key (recommended), 'v3' for a classic reCAPTCHA v3 key. */
export const appCheckProvider = 'enterprise';
