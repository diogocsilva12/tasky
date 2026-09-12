# 04: Project Management & GitHub Repository / Branch Integration

**What to build:**
A comprehensive Project Management system allowing users to create manual projects or import projects from authenticated GitHub repositories and GitHub Projects V2. Provides multi-project switching, project metadata (description, repository owner/name, active/default branch), and direct clickable links to the GitHub repository and specific branch.

**Blocked by:** 02: GitHub Authentication, PAT Management & Access Gate

**Status:** ready-for-agent

- [ ] Implement Project data model, store actions, and local persistence
- [ ] Implement Project Switcher dropdown in the top header with current project indicators
- [ ] Implement "Create New Project" modal with name, description, and optional GitHub repo binding
- [ ] Implement "Import from GitHub" wizard fetching user/org repositories via GitHub REST API
- [ ] Support branch selection (defaulting to main/master or active working branch)
- [ ] Prominent UI header card with direct clickable links to GitHub repo URL and branch URL
- [ ] Multi-project navigation and project deletion/editing capabilities
