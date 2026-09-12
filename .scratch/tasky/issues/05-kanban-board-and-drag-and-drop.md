# 05: Minimalist Kanban Board with Customizable Columns & @dnd-kit

**What to build:**
A high-velocity, minimalist Kanban board featuring drag-and-drop powered by `@dnd-kit`. Users can add, edit, reorder, and delete columns, as well as create, update, reorder, and move tasks between columns. Tasks support P0–P4 priority badges, assignee avatars, branch associations, GitHub issue links, and task editing modal.

**Blocked by:** 01: Core Scaffolding, Design System & Theming Foundation, 04: Project Management & GitHub Repository / Branch Integration

**Status:** ready-for-agent

- [ ] Implement `@dnd-kit` multi-container Sortable Kanban architecture (columns and cards)
- [ ] Implement Column operations: Add custom column, rename column, change column color, delete column with task re-allocation, reorder columns
- [ ] Implement Task card component with minimalist styling, P0–P4 priority badges (P0 Critical, P1 High, P2 Medium, P3 Low, P4 Trivial), assignee avatar tags, and issue badges
- [ ] Implement Create / Edit Task dialog with title, description markdown preview, priority selector, assignee search, and branch tag
- [ ] Fluid drag feedback with collision detection algorithms (`closestCorners` or `pointerWithin`)
- [ ] Quick search and filter bar on the board (filter by priority P0–P4, assignee, or keyword)
