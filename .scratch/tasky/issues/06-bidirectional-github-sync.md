# 06: Bi-directional GitHub Projects V2 & Issues Synchronization

**What to build:**
A robust synchronization engine that connects Tasky with GitHub Projects V2 and repository Issues. Supports importing issues as tasks, mapping issue states and labels to Kanban columns and P0–P4 priority ratings, pushing updates (status change, priority, title, assignees) back to GitHub, and showing a clear sync status badge and timestamp.

**Blocked by:** 04: Project Management & GitHub Repository / Branch Integration, 05: Minimalist Kanban Board with Customizable Columns & @dnd-kit

**Status:** ready-for-agent

- [ ] Implement GitHub Projects V2 GraphQL client (`projectsV2`, `items`, custom fields)
- [ ] Implement GitHub Issues REST client (fetch issues, create issue, update issue labels/assignees/state)
- [ ] Implement automated priority mapping (e.g. `priority:p0` or `p0` label mapped to P0, etc.)
- [ ] Implement column status mapping to GitHub Projects V2 status options or issue open/closed state
- [ ] Implement Sync button in header with spinning animation, last-synced time, and offline/error recovery
- [ ] Provide one-click "Sync with GitHub" with conflict-safe merge and change summary toast
