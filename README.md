# Tasky 📋

Tasky is a minimalist, high-velocity GitHub-integrated Task & Kanban Board application designed for deployment on GitHub Pages. It features client-side authentication, an admin-governed GitHub Gist Pass-List, bi-directional sync with GitHub Projects V2 and Issues, customizable columns with `@dnd-kit`, P0–P4 priority grading, multi-project switching, branch/repo direct navigation, multi-theme customization, and an executive landing resume dashboard.

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
  - Pull issues from GitHub repositories into Kanban tasks.
  - Map issue labels (`P0`, `P1`, `priority:p0`) and statuses directly to board columns.
  - Push tasks to GitHub as repository issues.
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
