# GitHub Device Flow on Vercel

The browser previously sent Device Flow requests through an obsolete external Cloudflare proxy. Network failures were described as GitHub CORS errors, and terminal polling errors could be retried forever.

The frontend now calls `/api/device-auth`. The Vercel function uses a fixed GitHub client ID, fixed scopes and two allowlisted GitHub endpoints. It rejects unrelated origins and malformed input and never caches authorization responses. The UI no longer asks users to configure an OAuth client or a CORS proxy. AbortController cancels code requests and polling when the dialog closes or a new attempt starts; GitHub polling intervals, slow_down and expiration are respected.

A direct live request confirmed the existing OAuth application issues device codes, with a five-second polling interval and approximately fifteen-minute expiry. The full local suite passed 139 tests and the production build passed. Regression tests cover the same-origin path, polling timing, slowdown, cancellation, expiration, permanent errors, fixed upstream targets, validation, origin checks and upstream failures.

Reference: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#device-flow .

The production browser check on https://tasky-silk-two.vercel.app displayed a real GitHub verification code, used only the same-origin API, and received authorization_pending from GitHub. It did not approve a login or obtain a user token.
