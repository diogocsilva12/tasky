# Tasky - Project Specification

## Problem Statement
Development teams and solo technical leads managing tasks across multiple projects often find existing project management tools either too bloated and disconnected from Git workflows, or lacking security controls when hosted statically on GitHub Pages. Public or semi-public GitHub Pages deployments lack native authentication gates to protect project boards from unauthorized viewers. Furthermore, developers need a minimalist, high-velocity Kanban board that directly syncs with GitHub Projects V2 and Issues, tracks priority from P0 to P4, provides instant navigation to repositories and branches, and highlights critical items in an executive landing resume without excessive context switching.

## Solution
**Tasky** is a high-performance, minimalist, client-side Kanban and Task Board engineered for zero-maintenance hosting on GitHub Pages. It introduces a client-side Gatekeeper secured by GitHub Personal Access Tokens and an admin-controlled Pass-List persisted in a GitHub Gist. Only users approved by the admin (@diogocsilva12) can access the project boards. Tasky features bi-directional synchronization with GitHub Projects V2 and repository Issues, full drag-and-drop customization of columns, P0–P4 priority classification, multi-project navigation with deep branch links, multi-theme customization, and an executive landing resume dashboard delivering at-a-glance visibility into critical tasks and project analytics.

## User Stories

1. As an unauthenticated visitor, I want to be redirected to a secure login page, so that I cannot view internal project tasks without authorization.
2. As a visitor, I want to sign in with my GitHub Personal Access Token (PAT), so that the application can verify my GitHub identity against GitHub's official API.
3. As an unauthorized GitHub user, I want to see a clear "Access Request Pending" screen with a one-click button to request approval, so that the admin knows I want access.
4. As the admin (@diogocsilva12), I want to be recognized automatically as the administrator upon signing in, so that I gain instant access to the Admin Dashboard.
5. As the admin, I want to view all pending access requests with the applicant's GitHub avatar, username, and timestamp, so that I can decide who to approve.
6. As the admin, I want to approve access requests or manually add any GitHub username to the Pass-List with one click, so that authorized team members can enter immediately.
7. As the admin, I want the Pass-List to be securely persisted in my private GitHub Gist, so that permissions are preserved across all devices and sessions without requiring an external database.
8. As the admin, I want to remove users from the Pass-List at any time, so that revoked users lose immediate access to the boards.
9. As an authorized user, I want to view an executive Landing Page Resume, so that I immediately see all high-priority (P0 and P1) tasks requiring urgent attention across all projects.
10. As an authorized user, I want to see high-level productivity stats (total tasks, completion percentage, in-progress velocity, priority breakdown chart), so that I can gauge project health.
11. As an authorized user, I want to create a new manual project board or import existing projects from my GitHub repositories / GitHub Projects V2, so that I can track work from any source.
12. As an authorized user, I want each project to display direct clickable links to its GitHub repository and active Git branch, so that I can jump straight to the source code.
13. As an authorized user, I want to view a responsive, minimalist Kanban board with default columns (Backlog, To Do, In Progress, Review, Done), so that work status is transparent.
14. As an authorized user, I want to reorder columns, add new custom columns, rename columns, or delete columns, so that the board adapts to our custom workflow.
15. As an authorized user, I want to drag and drop task cards smoothly between columns or within the same column using @dnd-kit, so that updating status is effortless.
16. As an authorized user, I want to assign tasks a priority rating from P0 (Critical/Urgent) to P4 (Trivial/Nice-to-Have), so that effort is prioritized effectively.
17. As an authorized user, I want to assign tasks to any GitHub user or team member with avatar display, so that ownership is evident.
18. As an authorized user, I want bi-directional synchronization with GitHub Projects V2 and Issues, so that status or priority changes made in Tasky reflect on GitHub and vice versa.
19. As an authorized user, I want to trigger a manual sync or view the last-synced timestamp and sync status indicator, so that I know my data is fresh and conflicts are prevented.
20. As a user, I want to choose between multiple minimalist themes (Modern Dark, Minimalist Light, Slate, Midnight Navy, Zinc Monochrome, Cyberpunk Violet, Monokai), so that the UI matches my visual preference.
21. As a developer, I want Tasky to compile to a clean static distribution suitable for GitHub Pages deployment via GitHub Actions, so that hosting costs are zero and deployment is automated.

## Implementation Decisions

### Architectural Seams
1. **Access Gatekeeper Seam (`services/auth.ts`, `services/passlist.ts`)**:
   - Manages token storage, GitHub API user validation (`GET https://api.github.com/user`), and Gist-backed pass-list synchronization (`tasky-passlist.json`).
   - Dispatches auth state: `Unauthenticated`, `PendingApproval`, `AuthorizedMember`, `Admin`.
2. **GitHub API & Synchronization Engine (`services/github.ts`, `services/sync.ts`)**:
   - Encapsulates Octokit/REST and GraphQL calls for GitHub Projects V2 (`query { node(id: $projectId) { ... } }`) and repository Issues.
   - Maps GitHub issue labels / custom fields to P0–P4 priorities and Kanban column statuses.
3. **Board Store & State Engine (`store/boardStore.ts`)**:
   - Local-first Zustand / React state store tracking projects, columns, tasks, active filters, and audit metadata.
   - Handles optimistic updates for drag-and-drop operations with rollback on sync failure.
4. **Design System & Theme Engine (`components/theme-provider.tsx`, `components/ui/*`)**:
   - Tailwind CSS with CSS variable tokens supporting 7 themes.
   - Accessible shadcn/ui components (Dialog, DropdownMenu, Tabs, Badge, Card, Avatar, Tooltip, Sonner).

### Core Data Models
```typescript
export type Priority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  columnId: string;
  priority: Priority;
  assignees: {
    username: string;
    avatarUrl?: string;
  }[];
  githubIssueNumber?: number;
  githubItemId?: string;
  githubUrl?: string;
  branchName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  title: string;
  color?: string;
  order: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  repoOwner?: string;
  repoName?: string;
  defaultBranch?: string;
  githubProjectId?: string;
  columns: Column[];
  createdAt: string;
  updatedAt: string;
}

export interface PassListEntry {
  username: string;
  approvedAt: string;
  approvedBy: string;
}

export interface AccessRequest {
  username: string;
  requestedAt: string;
  avatarUrl?: string;
}
```

## Testing Decisions
- **Unit & Reducer Tests**: Test priority scoring, column reordering, task filtering, and optimistic state mutations in isolation.
- **Service & Contract Tests**: Mock GitHub REST/GraphQL API responses to verify authorization gate, pass-list parsing, and sync mapping.
- **Component Tests**: Verify login gate rendering, drag-and-drop state updates, and theme switching.
- **Build & Static Export Test**: Ensure `vite build` generates standalone static assets without dynamic server dependencies.

## Out of Scope
- Self-hosted relational databases (PostgreSQL/MySQL) – architecture is purely static + GitHub API.
- Email/password authentication – all authentication is delegated to GitHub identity.
- Full real-time WebSocket mesh without user action – synchronization is polling, webhook-ready, and on-demand.

## Further Notes
- Supports a Demo / Mock Mode with preloaded projects and tasks so visitors or reviewers can test the entire UI immediately without entering their personal GitHub credentials.
