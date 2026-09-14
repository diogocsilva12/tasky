# Access storage regression verification

The original service discovered or created a separate Gist for each token. The pending page treated an unapproved account as evidence of a submitted request, making its form unreachable. PATCH failures were ignored.

Read-only live checks on 2026-09-14 located the existing owner Gist, then fetched it without authentication (HTTP 200). Its owner matched the configured administrator, both JSON files parsed as arrays, the pass-list contained two existing entries, requests contained zero entries, and no files were truncated. Anonymous access to the comments endpoint also returned HTTP 200 with zero comments. No production writes were performed.

The fix pins the existing Gist ID to preserve approvals and submits requests through comments. GitHub's API documents authenticated creation of Gist comments: https://docs.github.com/en/rest/gists/comments#create-a-gist-comment . Comment author metadata supplies requester identity; comment bodies cannot supply roles or approval decisions. Owner-controlled decisions override comments.

Regression tests cover shared reads across owner/member credentials, authenticated comment submission, forged identity fields, persisted decisions, case-insensitive matching, pagination, malformed comments, read/write failures, wrong-owner data, demo isolation, and pending-page form visibility. The complete suite passed 99 tests; TypeScript and the production build passed. Production request submission using a second user's token was not exercised. Existing Node localStorage and Vite chunk-size warnings remain.
