# 02: GitHub Authentication, PAT Management & Access Gate

**What to build:**
A secure client-side authentication gatekeeper that validates GitHub Personal Access Tokens against the official GitHub API (`https://api.github.com/user`), checks the user against the admin-controlled Pass-List (and recognizes `@diogocsilva12` as super-admin), provides a clean "Request Access" pending state for unapproved users, and includes a one-click "Demo / Preview Mode" for reviewers.

**Blocked by:** 01: Core Scaffolding, Design System & Theming Foundation

**Status:** ready-for-agent

- [ ] Implement `AuthContext` and `githubAuthService` with secure in-memory and encrypted session storage
- [ ] Implement Login page with PAT instructions, scope guidance (`repo`, `project`, `gist`), and input verification
- [ ] Implement GitHub API user profile resolution (avatar, username, name, scopes)
- [ ] Implement Gatekeeper access-check logic: Admin vs Approved vs Pending vs Unauthenticated
- [ ] Implement "Access Denied / Pending Approval" screen with instant "Submit Access Request" button
- [ ] Implement Demo Mode toggle for instant evaluation without entering a PAT
- [ ] Unit tests for authentication state transitions and scope verification
