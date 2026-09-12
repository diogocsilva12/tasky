# AGENTS.md

## Project
Tasky is a modern, minimalist GitHub-integrated Task & Kanban Board application deployed to GitHub Pages. It features GitHub-based authentication with a secure admin-approved pass-list, bi-directional sync with GitHub Projects V2 and Issues, customizable columns, P0–P4 priority levels, multi-project switching, branch/repo direct links, multi-theme support, and an executive landing page resume with productivity analytics.

## Architecture
- **Frontend**: React 19 / Vite + TypeScript
- **Styling & UI**: Tailwind CSS, shadcn/ui primitives (Radix UI), Lucide React
- **Drag & Drop**: @dnd-kit (core, sortable, utilities)
- **Data & Charts**: Recharts, Lucide, local-first storage with GitHub API / Gist synchronization
- **Authentication & Security**: GitHub Personal Access Token (PAT) with encrypted client-side storage, admin-controlled pass-list persisted in dedicated GitHub Gist, access request gatekeeping
- **Deployment**: Static build output configured for GitHub Pages (`base: './'`)

## Rules
- Do not rewrite working modules unnecessarily.
- Prefer small, isolated, vertical tracer-bullet changes.
- Tests must pass before completion.
- Do not introduce unnecessary dependencies without justification.
- Do not modify or leak environment secrets (.env, tokens).
- Maintain clean, modular TypeScript interfaces and domain models.
- Work using Git worktrees for parallel subagent features and merge back cleanly into `main`.

## Workflow
1. Context: Understand existing code and domain boundaries.
2. Grill: Clarify requirements and design tree (Completed).
3. Spec: Formal specification with agreed test seams.
4. Tickets: Decompose into tracer-bullet vertical slices.
5. Worktree: Isolate feature branches in dedicated git worktrees.
6. Implement / TDD: Implement features and write tests.
7. Review & Merge: Verify, diagnose, review diffs, and merge to `main`.
