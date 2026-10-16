# Security policy

Thank you for helping keep sbmadhav.com and its visitors safe.

## Report a problem privately

Please do not open a public issue, pull request or discussion for a security problem.

Report it through GitHub private vulnerability reporting instead:

1. Open the [Security tab](https://github.com/sbmadhav/sbmadhav.github.io/security) of this repo.
2. Choose **Report a vulnerability** (or go straight to [the form](https://github.com/sbmadhav/sbmadhav.github.io/security/advisories/new)).
3. Describe what is affected (a URL or a file), how to reproduce it, and what an attacker could do with it.

Only the owner sees the report. This is a personal project kept by one person, so a reply can take a few days. Once a fix is live, you are welcome to be credited in the advisory.

## What is in scope

The pages at https://sbmadhav.com that this repo serves, its service worker (`sw.js`), and the shared scripts other repos load from it (`/assets/explore.js`, `/assets/analytics.js` and the vendored GoatCounter `/assets/count.js`). Pages under /vedic-math/, /design-system/ and /state-of-voice-agents/ come from their own repos; report those there.

Only the live site, built from the default branch, is supported. Older commits are not patched.

## Please do not

- Test against other people's data or accounts, or try to deny service to the site.
- Use automated scanners that send large amounts of traffic.
