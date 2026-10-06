# Tasky 📋

Tasky is a GitHub-integrated Task & Kanban Board application deployed on Vercel. It provides shared projects and tasks, server-enforced project permissions, GitHub authentication, an administrator-approved pass-list, customizable workflows, multiple light and dark themes, and project retrospectives.

Live app: https://tasky-silk-two.vercel.app

---

## ✨ Features

- 🔐 **GitHub Access Gate & Admin Pass-List**:
  - Secure authentication via GitHub Personal Access Tokens (PAT).
  - Persistent Pass-List stored in a private GitHub Gist (`tasky-passlist.json`).
  - Automatic super-admin detection for `@diogocsilva12`.
  - Access Request lock screen for pending applicants.
  - Dedicated Admin Dashboard to approve, reject, or manually add users.
  - One-click **Demo Mode** for instant preview (Admin & Member views).

- 📊 **Executive Landing Resume & Analytics**:
  - Aggregated **High-Priority Task Resume** highlighting active **P0** (Critical) and **P1** (High) tasks across all projects.
  - Productivity KPI cards: Total Tasks, In Progress, Completion Rate (%), and Open P0 Blockers.
  - Interactive distribution charts powered by Recharts (Priority breakdown P0–P4 and Column status).
  - Active project cards with progress bars and direct links to GitHub repositories and branches.

- 🗂️ **Minimalist Kanban Board**:
  - Powered by `@dnd-kit` with smooth multi-container drag-and-drop.
  - Reorder columns horizontally and move cards between columns seamlessly.
  - Customizable columns: Add custom columns, rename, customize accent colors, and delete with task reallocation.
  - P0–P4 priority badges (P0 Critical, P1 High, P2 Medium, P3 Low, P4 Trivial).
  - Overlapping assignee avatars with initials fallback.
  - Direct branch badges and GitHub issue link badges on each card.
  - Multi-criteria board search & filter bar (search keyword, priority filter pills, assignee dropdown).

- 🔄 **Bi-directional GitHub Sync**:
  - Pull all open and closed issues (including pagination, excluding pull requests) from linked repositories.
  - Map issue labels (`P0`, `P1`, `priority:p0`) and statuses directly to board columns.
  - Send edits to already-linked issues back to GitHub; local-only tasks remain local.
  - Header sync button with live animated spinning indicator, relative last-synced timestamp, and toast notifications.

- 🎨 **Multi-Theme Engine**:
  - 7 curated themes:
    - **Dark Modern** (Default)
    - **Minimalist Light**
    - **Deep Slate**
    - **Midnight Navy**
    - **Zinc Monochrome**
    - **Cyberpunk Violet**
    - **Monokai Code**
  - Instant theme switching persisted in LocalStorage.

- 🚀 **GitHub Pages Ready**:
  - Static Vite build with relative asset routing (`base: './'`).
  - GitHub Actions deployment workflow (`.github/workflows/deploy.yml`).
  - SPA 404 fallback routing (`public/404.html`).

---

## 🛠️ Architecture & Tech Stack

- **Framework**: React 19 + TypeScript + Vite 6
- **Styling**: Tailwind CSS v4 + Radix UI Primitives (shadcn/ui design system)
- **Drag & Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Testing**: Vitest

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Run Tests
```bash
npm test
```

### 4. Build for Production
```bash
npm run build
```

---

## 🔒 Authentication & Pass-List Setup

1. **Sign In**: Enter your GitHub Personal Access Token (PAT) with `repo`, `project`, and `gist` scopes.
2. **Demo Mode**: Alternatively, click **"Explore Demo as Admin"** or **"Explore Demo as Member"** for zero-configuration exploration.
3. **Admin Control**: When logged in as `@diogocsilva12`, access the **Admin Gate** in the top navigation to review pending access requests, approve users, or manually add GitHub handles to the Pass-List.
4. **Shared access storage**: All accounts read the existing administrator-owned Gist identified by `PASSLIST_GIST_ID` in `src/services/gistPasslist.ts`. Forks must replace this ID with their own access Gist and update the owner in this service and `githubAuth.ts`. Keep `tasky-passlist.json` and `tasky-requests.json` as JSON arrays. A secret Gist is readable by anyone who knows its ID; do not store credentials or confidential notes there.
5. **Requests and approvals**: Unapproved users click **Request Access**. Requests are stored as authenticated Gist comments; identity comes from GitHub's comment author. The Gist owner approves or rejects requests through Admin Gate. Only the Gist owner can save access decisions, even if another user has an app admin role. Requests and approvals refresh every minute and when the window regains focus; pending users can also click **Check approval status**. Failed writes display an error and do not count as successful requests or approvals.


---

## 📄 License
MIT © Diogo Silva

## Shared workspace on Vercel

`/api/board` authenticates each GitHub token and checks the shared pass-list before reading or changing projects. Storage is the private `diogocsilva12/tasky-data` repository; `TASKY_STORAGE_TOKEN` is a server-only Vercel secret. `TASKY_STORAGE_REPO` can override the repository. Public projects are visible to approved users, and private projects are filtered on the server. Edits autosave after two seconds; other sessions refresh every minute or through Sync. Concurrent edits to the same item produce a conflict instead of silent overwrites.

The GitHub Pages version stores projects in the original browser. To migrate existing work, export its JSON Full Backup and import it using the Vercel app's Import backup action. Fresh real accounts do not receive demo projects. Local backups and demo sessions are isolated by account.

GitHub Device Flow uses `/api/device-auth`, with fixed GitHub endpoints and no external CORS proxy. The native verification link opens GitHub independently of clipboard access.

## Appearance, remembered sessions and project learning

- The palette menu offers four light themes and six dark themes. Form surfaces, inputs and date controls follow the selected theme.
- Check **Remember me on this device** when signing in to keep a 30-day session. `TASKY_SESSION_SECRET` must be a random 32-byte base64url server secret. The token is encrypted in a Secure, HttpOnly, SameSite=Strict cookie, restored into the current session when needed and removed from the remembered session on sign-out. Demo tokens cannot be remembered.
- Task assignees can be selected from a searchable list of approved users with project access. Names are inserted with commas and deduplicated.
- **Executive Dashboard & Resume → Learn from our organization** lets project owners and administrators record a success rating, notes and a snapshot of organization/completion metrics. A small statistical model compares practices across reviewed projects, with smoothing and minimum sample counts. It learns from explicit outcomes; it does not claim causality or invent successful project histories.

Deployment uses `npx vercel --prod`. The Vercel project is currently deployed through the CLI; automatic Git deployment is not connected. Run `npm test` and `npm run build` before deployment. The build includes a separate NodeNext TypeScript check for API functions.

### Organization history and personal inbox

- **Project → History** records workflow column additions/removals/reordering/renaming, WIP limits, project ownership, access and dates with before/after values and the acting user. It also displays existing task assignment, reviewer and deadline activity. New project history starts when changes are recorded; historical gaps are not backfilled. History travels with the shared project and JSON backups. Deleting a project/task removes its in-app history along with it.
- **Inbox** shows your assignments, exact `@username` mentions in descriptions/comments, overdue work and deadlines within seven calendar days, and tasks awaiting your review across accessible projects. Explicit **Reviewers** can be selected in the task editor. Review requests appear in Review, QA, Approval or Revisão columns; without explicit reviewers, the assignee receives the review item.
- Opening an inbox item opens its task and marks that item read. Read status persists per account on this device; assignments, comments, reviewers and history use the shared board sync. Read status does not sync across devices. The retrospective learning model still uses the recorded final review snapshots; the timeline supplies project context without claiming causal learning from changes.

## GitHub issue synchronization

For a project with a repository link, Sync, the initial load, the visible-session one-minute refresh and debounced edits now synchronize GitHub issues as well as the shared board. The signed-in GitHub token needs access to that repository (Issues read/write for fine-grained tokens, or `repo` for classic private-repository tokens). Demo mode stays local.

Open issues enter the project's To Do column and closed issues enter Done; existing open tasks retain intermediate columns such as In Progress. Issue IDs are scoped to the project. Priority labels map to P0–P4, and updates preserve other GitHub labels. Local comments, subtasks and other board-only fields remain on the task.

The first import reads GitHub's fields and records a shared baseline. Later edits to title, description, priority, assignees or completion status synchronize both ways. Independent field changes merge; conflicting edits to the same field stop with a visible error and preserve local edits. Deleting a board card does not delete or close its GitHub issue: use Done to close it. Local-only cards are not automatically published; link an existing issue using its number to synchronize it. New issues created on GitHub are imported automatically.

Sync is successful only after the issues have been synchronized and saved to shared storage. Access, network and conflict failures appear in the persistent sync banner. GitHub Projects V2 fields and issue comments are outside this issue-sync flow.
