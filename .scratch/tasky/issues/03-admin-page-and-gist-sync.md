# 03: Admin Management Page & Pass-List Gist Engine

**What to build:**
A dedicated Admin Page accessible only to the admin (@diogocsilva12) to manage the user Pass-List, approve pending access requests, manually add or revoke GitHub usernames, and synchronize permissions to a private GitHub Gist (`tasky-passlist.json`).

**Blocked by:** 02: GitHub Authentication, PAT Management & Access Gate

**Status:** ready-for-agent

- [ ] Implement `GistPasslistService` for reading and updating `tasky-passlist.json` on GitHub Gist
- [ ] Implement Admin Dashboard page with protected route guard (non-admins redirected or blocked)
- [ ] Implement "Pending Requests" table displaying requester GitHub avatar, username, requested date, and "Approve" button
- [ ] Implement "Approved Users Pass-List" with user search, add-user form, and "Revoke Access" action
- [ ] Implement Gist configuration settings (specify custom Gist ID or auto-create private Gist)
- [ ] Toast notifications for approval, addition, and revocation operations
- [ ] Unit and mock integration tests for Gist sync and pass-list state transitions
