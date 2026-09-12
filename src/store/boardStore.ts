import { useSyncExternalStore } from 'react';
import type { Project, Column, Task, BoardFilter, Sprint } from '@/types';
import { getCleanRepoDetails } from '@/lib/githubUrl';
import { isInProgressColumn, isDoneColumn } from '@/lib/sprintMetrics';

const STORAGE_KEYS = {
  PROJECTS: 'tasky_projects_v1',
  TASKS: 'tasky_tasks_v1',
  SPRINTS: 'tasky_sprints_v1',
  ACTIVE_PROJECT_ID: 'tasky_active_project_id_v1',
};

export const INITIAL_COLUMNS: Column[] = [
  { id: 'col-backlog', title: 'Backlog', color: '#64748b', order: 0 },
  { id: 'col-todo', title: 'To Do', color: '#3b82f6', order: 1 },
  { id: 'col-in-progress', title: 'In Progress', color: '#f59e0b', order: 2 },
  { id: 'col-review', title: 'Review', color: '#8b5cf6', order: 3 },
  { id: 'col-done', title: 'Done', color: '#10b981', order: 4 },
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-core-engine',
    name: 'Tasky Core Engine',
    description: 'Local-first Kanban engine, GitHub Projects V2 bi-directional sync, and encrypted security gatekeeper.',
    deadline: '2026-10-31',
    visibility: 'public',
    owner: 'diogocsilva12',
    allowedUsers: [],
    repoOwner: 'diogocsilva12',
    repoName: 'tasky',
    defaultBranch: 'main',
    activeBranch: 'feature/kanban-board',
    githubUrl: 'https://github.com/diogocsilva12/tasky',
    columns: [
      { id: 'col-1', title: 'Backlog', color: '#64748b', order: 0 },
      { id: 'col-2', title: 'To Do', color: '#3b82f6', order: 1 },
      { id: 'col-3', title: 'In Progress', color: '#f59e0b', order: 2 },
      { id: 'col-4', title: 'Review', color: '#8b5cf6', order: 3 },
      { id: 'col-5', title: 'Done', color: '#10b981', order: 4 },
    ],
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-12T12:00:00.000Z',
  },
  {
    id: 'proj-frontend-redesign',
    name: 'Frontend Redesign',
    description: 'Minimalist shadcn/ui primitives, responsive layout, and dark mode palette overhaul.',
    deadline: '2026-11-15',
    visibility: 'public',
    owner: 'diogocsilva12',
    allowedUsers: [],
    repoOwner: 'diogocsilva12',
    repoName: 'tasky-design-system',
    defaultBranch: 'main',
    activeBranch: 'redesign-v2',
    githubUrl: 'https://github.com/diogocsilva12/tasky-design-system',
    columns: [
      { id: 'col-fe-1', title: 'Backlog', color: '#64748b', order: 0 },
      { id: 'col-fe-2', title: 'Design System', color: '#ec4899', order: 1 },
      { id: 'col-fe-3', title: 'In Development', color: '#6366f1', order: 2 },
      { id: 'col-fe-4', title: 'QA & Review', color: '#f59e0b', order: 3 },
      { id: 'col-fe-5', title: 'Shipped', color: '#10b981', order: 4 },
    ],
    createdAt: '2026-09-05T14:30:00.000Z',
    updatedAt: '2026-09-12T14:00:00.000Z',
  },
];

export const INITIAL_SPRINTS: Sprint[] = [
  {
    id: 'sprint-core-1',
    projectId: 'proj-core-engine',
    name: 'Sprint 14: Core Engine Launch',
    goal: 'Deliver bi-directional sync, PR auto-movement, and passlist gatekeeper.',
    startDate: '2026-09-01T09:00:00.000Z',
    endDate: '2026-09-18T18:00:00.000Z',
    status: 'active',
    velocityTarget: 25,
    createdAt: '2026-09-01T09:00:00.000Z',
    updatedAt: '2026-09-12T12:00:00.000Z',
  },
  {
    id: 'sprint-core-2',
    projectId: 'proj-core-engine',
    name: 'Sprint 15: Automation & Webhooks',
    goal: 'Ship real-time notifications, Webhook handlers, and AI task assistant.',
    startDate: '2026-09-19T09:00:00.000Z',
    endDate: '2026-10-03T18:00:00.000Z',
    status: 'planned',
    velocityTarget: 30,
    createdAt: '2026-09-01T09:00:00.000Z',
    updatedAt: '2026-09-12T12:00:00.000Z',
  },
];

export const INITIAL_TASKS: Task[] = [
  // Tasky Core Engine Tasks
  {
    id: 'task-core-1',
    projectId: 'proj-core-engine',
    title: 'Implement client-side encrypted PAT authentication and Gist pass-list validation',
    description: 'Secure the app with GitHub Personal Access Token authentication and encrypted Gist-backed pass-list for zero-cost static hosting.',
    priority: 'P0',
    columnId: 'col-3',
    sprintId: 'sprint-core-1',
    startedAt: '2026-09-08T10:00:00.000Z',
    assignees: [
      { username: 'diogocsilva12', name: 'Diogo Silva', avatarUrl: 'https://github.com/diogocsilva12.png' },
    ],
    githubIssueNumber: 2,
    githubPrNumber: 12,
    prStatus: 'merged',
    milestone: 'v1.0-mvp',
    branchName: 'feature/auth-admin',
    githubUrl: 'https://github.com/diogocsilva12/tasky/issues/2',
    tags: ['security', 'auth', 'core'],
    dueDate: '2026-09-18',
    storyPoints: 5,
    subtasks: [
      { id: 'st-1', title: 'Validate Personal Access Token scopes', completed: true },
      { id: 'st-2', title: 'Implement AES-GCM encryption', completed: true },
      { id: 'st-3', title: 'Sync pass-list with GitHub Gist', completed: true },
    ],
    comments: [
      {
        id: 'c-1',
        author: 'diogocsilva12',
        avatarUrl: 'https://github.com/diogocsilva12.png',
        content: 'AES-GCM encryption verified and passes all security audits.',
        createdAt: '2026-09-12T10:30:00.000Z',
      },
    ],
    createdAt: '2026-09-08T09:00:00.000Z',
    updatedAt: '2026-09-12T11:20:00.000Z',
  },
  {
    id: 'task-core-2',
    projectId: 'proj-core-engine',
    title: 'Build multi-container @dnd-kit Kanban board with real-time column reordering',
    description: 'Fluid drag-and-drop across customizable columns with collision detection, keyboard accessibility, and state persistence.',
    priority: 'P1',
    columnId: 'col-3',
    sprintId: 'sprint-core-1',
    startedAt: '2026-09-09T14:00:00.000Z',
    assignees: [
      { username: 'diogocsilva12', name: 'Diogo Silva', avatarUrl: 'https://github.com/diogocsilva12.png' },
    ],
    githubIssueNumber: 5,
    githubPrNumber: 15,
    prStatus: 'open',
    milestone: 'v1.1-features',
    branchName: 'feature/kanban-board',
    githubUrl: 'https://github.com/diogocsilva12/tasky/issues/5',
    tags: ['dnd', 'ui', 'performance'],
    dueDate: '2026-09-22',
    storyPoints: 8,
    subtasks: [
      { id: 'st-4', title: 'Configure DndContext with closestCorners', completed: true },
      { id: 'st-5', title: 'Support vertical card reordering', completed: true },
      { id: 'st-6', title: 'Implement horizontal column reordering', completed: false },
    ],
    comments: [
      {
        id: 'c-2',
        author: 'octocat',
        avatarUrl: 'https://github.com/octocat.png',
        content: 'Added collision detection for horizontal columns. Smooth 60fps animations verified!',
        createdAt: '2026-09-12T11:45:00.000Z',
      },
    ],
    createdAt: '2026-09-08T11:00:00.000Z',
    updatedAt: '2026-09-12T12:00:00.000Z',
  },
  {
    id: 'task-core-3',
    projectId: 'proj-core-engine',
    title: 'Bi-directional GitHub Projects V2 GraphQL synchronization engine',
    description: 'Sync board column mutations and card statuses directly with GitHub Projects V2 GraphQL schema.',
    priority: 'P1',
    columnId: 'col-2',
    assignees: [
      { username: 'diogocsilva12', name: 'Diogo Silva', avatarUrl: 'https://github.com/diogocsilva12.png' },
    ],
    githubIssueNumber: 6,
    branchName: 'feature/analytics-sync',
    githubUrl: 'https://github.com/diogocsilva12/tasky/issues/6',
    createdAt: '2026-09-09T10:00:00.000Z',
    updatedAt: '2026-09-12T10:00:00.000Z',
  },
  {
    id: 'task-core-4',
    projectId: 'proj-core-engine',
    title: 'Executive Landing Resume dashboard with velocity charts',
    description: 'Deliver an at-a-glance executive view with P0/P1 highlights, cumulative flow diagram, and priority breakdown.',
    priority: 'P2',
    columnId: 'col-1',
    assignees: [
      { username: 'sarah-chen', name: 'Sarah Chen', avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4' },
    ],
    githubIssueNumber: 7,
    branchName: 'feature/analytics-sync',
    githubUrl: 'https://github.com/diogocsilva12/tasky/issues/7',
    createdAt: '2026-09-09T14:00:00.000Z',
    updatedAt: '2026-09-11T16:00:00.000Z',
  },
  {
    id: 'task-core-5',
    projectId: 'proj-core-engine',
    title: 'Zero-trust token derivation and AES-GCM local storage encryption',
    description: 'Ensure user PATs are never stored in plaintext within browser storage.',
    priority: 'P0',
    columnId: 'col-2',
    assignees: [
      { username: 'diogocsilva12', name: 'Diogo Silva', avatarUrl: 'https://github.com/diogocsilva12.png' },
    ],
    githubIssueNumber: 3,
    branchName: 'feature/auth-admin',
    githubUrl: 'https://github.com/diogocsilva12/tasky/issues/3',
    createdAt: '2026-09-10T08:30:00.000Z',
    updatedAt: '2026-09-12T09:00:00.000Z',
  },
  {
    id: 'task-core-6',
    projectId: 'proj-core-engine',
    title: 'Refactor CSS variables for high-contrast Monokai and Cyberpunk themes',
    description: 'Harmonize border contrast and popover elevations across custom theme presets.',
    priority: 'P3',
    columnId: 'col-5',
    sprintId: 'sprint-core-1',
    storyPoints: 3,
    startedAt: '2026-09-07T14:00:00.000Z',
    completedAt: '2026-09-10T15:30:00.000Z',
    assignees: [
      { username: 'alex-rivera', name: 'Alex Rivera', avatarUrl: 'https://avatars.githubusercontent.com/u/1024025?v=4' },
    ],
    githubIssueNumber: 1,
    branchName: 'main',
    githubUrl: 'https://github.com/diogocsilva12/tasky/issues/1',
    createdAt: '2026-09-06T13:00:00.000Z',
    updatedAt: '2026-09-10T15:30:00.000Z',
  },
  {
    id: 'task-core-7',
    projectId: 'proj-core-engine',
    title: 'Configure GitHub Pages deploy workflow with SPA fallback routing',
    description: 'Automated GitHub Actions static release with base path relative routing.',
    priority: 'P4',
    columnId: 'col-5',
    sprintId: 'sprint-core-1',
    storyPoints: 2,
    startedAt: '2026-09-08T09:00:00.000Z',
    completedAt: '2026-09-09T18:00:00.000Z',
    assignees: [
      { username: 'diogocsilva12', name: 'Diogo Silva', avatarUrl: 'https://github.com/diogocsilva12.png' },
    ],
    githubIssueNumber: 8,
    branchName: 'main',
    githubUrl: 'https://github.com/diogocsilva12/tasky/issues/8',
    createdAt: '2026-09-07T11:00:00.000Z',
    updatedAt: '2026-09-09T18:00:00.000Z',
  },
  {
    id: 'task-core-8',
    projectId: 'proj-core-engine',
    title: 'Optimize drag-and-drop collision detection with closestCorners sensors',
    description: 'Prevent jumping between adjacent columns when dragging wide cards.',
    priority: 'P2',
    columnId: 'col-4',
    assignees: [
      { username: 'diogocsilva12', name: 'Diogo Silva', avatarUrl: 'https://github.com/diogocsilva12.png' },
    ],
    githubIssueNumber: 12,
    branchName: 'feature/kanban-board',
    githubUrl: 'https://github.com/diogocsilva12/tasky/issues/12',
    createdAt: '2026-09-11T09:00:00.000Z',
    updatedAt: '2026-09-12T14:30:00.000Z',
  },

  // Frontend Redesign Tasks
  {
    id: 'task-fe-1',
    projectId: 'proj-frontend-redesign',
    title: 'Fix responsive layout shifts on mobile viewports for Kanban columns',
    description: 'Resolve horizontal scroll jumpiness and sticky column header alignment on mobile screens.',
    priority: 'P0',
    columnId: 'col-fe-3',
    assignees: [
      { username: 'sarah-chen', name: 'Sarah Chen', avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4' },
    ],
    githubIssueNumber: 15,
    branchName: 'fix/mobile-shift',
    githubUrl: 'https://github.com/diogocsilva12/tasky-design-system/issues/15',
    createdAt: '2026-09-07T10:00:00.000Z',
    updatedAt: '2026-09-12T13:00:00.000Z',
  },
  {
    id: 'task-fe-2',
    projectId: 'proj-frontend-redesign',
    title: 'Design tokenized color badges for P0-P4 priority levels',
    description: 'Craft distinct translucent badges with border glow for each priority tier.',
    priority: 'P1',
    columnId: 'col-fe-5',
    assignees: [
      { username: 'alex-rivera', name: 'Alex Rivera', avatarUrl: 'https://avatars.githubusercontent.com/u/1024025?v=4' },
    ],
    githubIssueNumber: 14,
    branchName: 'main',
    githubUrl: 'https://github.com/diogocsilva12/tasky-design-system/issues/14',
    createdAt: '2026-09-06T15:00:00.000Z',
    updatedAt: '2026-09-10T18:00:00.000Z',
  },
  {
    id: 'task-fe-3',
    projectId: 'proj-frontend-redesign',
    title: 'Create micro-interactions for card dragging and drop placeholder transitions',
    description: 'Add smooth spring animations and drop target highlights during drag operations.',
    priority: 'P2',
    columnId: 'col-fe-2',
    assignees: [
      { username: 'alex-rivera', name: 'Alex Rivera', avatarUrl: 'https://avatars.githubusercontent.com/u/1024025?v=4' },
    ],
    githubIssueNumber: 18,
    branchName: 'design/micro-interactions',
    githubUrl: 'https://github.com/diogocsilva12/tasky-design-system/issues/18',
    createdAt: '2026-09-08T14:00:00.000Z',
    updatedAt: '2026-09-11T11:00:00.000Z',
  },
  {
    id: 'task-fe-4',
    projectId: 'proj-frontend-redesign',
    title: 'Add custom keyboard navigation shortcuts for task modal and column jumping',
    description: 'Support Esc, Enter, Cmd+K, and arrow keys for keyboard accessibility.',
    priority: 'P3',
    columnId: 'col-fe-1',
    assignees: [
      { username: 'sarah-chen', name: 'Sarah Chen', avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4' },
    ],
    githubIssueNumber: 22,
    branchName: 'feat/a11y-shortcuts',
    githubUrl: 'https://github.com/diogocsilva12/tasky-design-system/issues/22',
    createdAt: '2026-09-09T16:00:00.000Z',
    updatedAt: '2026-09-11T15:00:00.000Z',
  },
  {
    id: 'task-fe-5',
    projectId: 'proj-frontend-redesign',
    title: 'Align favicon and meta OpenGraph assets for social previews',
    description: 'Update manifest.json, SVG icons, and OG preview image.',
    priority: 'P4',
    columnId: 'col-fe-5',
    assignees: [
      { username: 'diogocsilva12', name: 'Diogo Silva', avatarUrl: 'https://github.com/diogocsilva12.png' },
    ],
    githubIssueNumber: 25,
    branchName: 'main',
    githubUrl: 'https://github.com/diogocsilva12/tasky-design-system/issues/25',
    createdAt: '2026-09-08T12:00:00.000Z',
    updatedAt: '2026-09-09T19:00:00.000Z',
  },
  {
    id: 'task-fe-6',
    projectId: 'proj-frontend-redesign',
    title: 'Audit color contrast ratios across all 7 theme variants',
    description: 'WCAG AAA compliance check across dark, light, slate, midnight, zinc, cyberpunk, and monokai.',
    priority: 'P1',
    columnId: 'col-fe-4',
    assignees: [
      { username: 'alex-rivera', name: 'Alex Rivera', avatarUrl: 'https://avatars.githubusercontent.com/u/1024025?v=4' },
    ],
    githubIssueNumber: 28,
    branchName: 'feat/contrast-audit',
    githubUrl: 'https://github.com/diogocsilva12/tasky-design-system/issues/28',
    createdAt: '2026-09-10T10:00:00.000Z',
    updatedAt: '2026-09-12T12:00:00.000Z',
  },
];

export const INITIAL_FILTER: BoardFilter = {
  searchQuery: '',
  priority: 'ALL',
  assignee: 'ALL',
  onlyBlocked: false,
};

export interface BoardState {
  projects: Project[];
  activeProjectId: string;
  tasks: Task[];
  sprints: Sprint[];
  filter: BoardFilter;
}

function loadInitialState(): BoardState {
  try {
    const savedProjects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    const savedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    const savedSprints = localStorage.getItem(STORAGE_KEYS.SPRINTS);
    const savedActiveId = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROJECT_ID);

    const rawProjects: Project[] = savedProjects ? JSON.parse(savedProjects) : INITIAL_PROJECTS;
    const projects: Project[] = rawProjects.map((p) => {
      const details = getCleanRepoDetails(p);
      return {
        ...p,
        repoOwner: details.owner || p.repoOwner,
        repoName: details.name || p.repoName,
        githubUrl: details.repoUrl || p.githubUrl,
      };
    });
    const tasks: Task[] = savedTasks ? JSON.parse(savedTasks) : INITIAL_TASKS;
    const sprints: Sprint[] = savedSprints ? JSON.parse(savedSprints) : INITIAL_SPRINTS;
    const activeProjectId: string =
      savedActiveId && projects.some((p) => p.id === savedActiveId)
        ? savedActiveId
        : projects[0]?.id || INITIAL_PROJECTS[0].id;

    return {
      projects,
      activeProjectId,
      tasks,
      sprints,
      filter: { ...INITIAL_FILTER },
    };
  } catch {
    return {
      projects: INITIAL_PROJECTS,
      activeProjectId: INITIAL_PROJECTS[0].id,
      tasks: INITIAL_TASKS,
      sprints: INITIAL_SPRINTS,
      filter: { ...INITIAL_FILTER },
    };
  }
}

function saveState(state: BoardState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(state.projects));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(state.tasks));
    localStorage.setItem(STORAGE_KEYS.SPRINTS, JSON.stringify(state.sprints));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROJECT_ID, state.activeProjectId);
  } catch (error) {
    console.error('Failed to save board state to localStorage:', error);
  }
}

let currentState: BoardState = loadInitialState();
const listeners = new Set<() => void>();

function emitChange(): void {
  saveState(currentState);
  listeners.forEach((listener) => listener());
}

export const boardStore = {
  getState(): BoardState {
    return currentState;
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  // ---------------- Projects ----------------
  addProject(
    projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'columns'> & {
      columns?: Column[];
    }
  ): Project {
    const id = `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const columns = projectData.columns && projectData.columns.length > 0
      ? projectData.columns
      : INITIAL_COLUMNS.map((col, idx) => ({ ...col, id: `col-${id}-${idx}` }));

    const details = getCleanRepoDetails(projectData);
    const repoOwner = details.owner || undefined;
    const repoName = details.name || undefined;
    const githubUrl = details.repoUrl || undefined;

    const newProject: Project = {
      ...projectData,
      id,
      visibility: projectData.visibility || 'public',
      owner: projectData.owner || repoOwner || 'diogocsilva12',
      allowedUsers: projectData.allowedUsers || [],
      repoOwner,
      repoName,
      defaultBranch: projectData.defaultBranch || 'main',
      activeBranch: projectData.activeBranch || projectData.defaultBranch || 'main',
      githubUrl,
      columns,
      createdAt: now,
      updatedAt: now,
    };

    currentState = {
      ...currentState,
      projects: [...currentState.projects, newProject],
      activeProjectId: id,
    };
    emitChange();
    return newProject;
  },

  updateProject(id: string, updates: Partial<Project>): void {
    const now = new Date().toISOString();
    currentState = {
      ...currentState,
      projects: currentState.projects.map((p) => {
        if (p.id !== id) return p;
        const combined = { ...p, ...updates };
        const details = getCleanRepoDetails(combined);
        const repoOwner = details.owner || undefined;
        const repoName = details.name || undefined;
        const githubUrl = details.repoUrl || undefined;

        return {
          ...p,
          ...updates,
          repoOwner,
          repoName,
          githubUrl,
          updatedAt: now,
        };
      }),
    };
    emitChange();
  },

  deleteProject(id: string): void {
    const remainingProjects = currentState.projects.filter((p) => p.id !== id);
    const newActiveId =
      currentState.activeProjectId === id
        ? remainingProjects[0]?.id || ''
        : currentState.activeProjectId;

    currentState = {
      ...currentState,
      projects: remainingProjects,
      activeProjectId: newActiveId,
      tasks: currentState.tasks.filter((t) => t.projectId !== id),
    };
    emitChange();
  },

  setActiveProject(id: string): void {
    if (currentState.activeProjectId === id) return;
    if (currentState.projects.some((p) => p.id === id)) {
      currentState = {
        ...currentState,
        activeProjectId: id,
      };
      emitChange();
    }
  },

  updateProjectDeadline(id: string, deadline?: string): void {
    const project = currentState.projects.find((p) => p.id === id);
    if (!project) return;
    boardStore.updateProject(id, { deadline: deadline || undefined });
  },

  // ---------------- Sprints ----------------
  addSprint(
    sprintData: Omit<Sprint, 'id' | 'createdAt' | 'updatedAt'>
  ): Sprint {
    const id = `sprint-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    const newSprint: Sprint = {
      ...sprintData,
      id,
      status: sprintData.status || 'planned',
      createdAt: now,
      updatedAt: now,
    };

    let updatedSprints = currentState.sprints;
    if (newSprint.status === 'active') {
      updatedSprints = updatedSprints.map((s) =>
        s.projectId === sprintData.projectId && s.status === 'active'
          ? { ...s, status: 'planned' as const, updatedAt: now }
          : s
      );
    }

    currentState = {
      ...currentState,
      sprints: [...updatedSprints, newSprint],
    };
    emitChange();
    return newSprint;
  },

  updateSprint(id: string, updates: Partial<Sprint>): void {
    const now = new Date().toISOString();
    currentState = {
      ...currentState,
      sprints: currentState.sprints.map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: now } : s
      ),
    };
    emitChange();
  },

  startSprint(id: string): void {
    const target = currentState.sprints.find((s) => s.id === id);
    if (!target) return;
    const now = new Date().toISOString();

    currentState = {
      ...currentState,
      sprints: currentState.sprints.map((s) => {
        if (s.id === id) {
          return { ...s, status: 'active' as const, updatedAt: now };
        }
        if (s.projectId === target.projectId && s.status === 'active') {
          return { ...s, status: 'completed' as const, completedAt: now, updatedAt: now };
        }
        return s;
      }),
    };
    emitChange();
  },

  completeSprint(
    id: string,
    rolloverAction: 'backlog' | 'nextSprint' = 'backlog'
  ): void {
    const target = currentState.sprints.find((s) => s.id === id);
    if (!target) return;
    const now = new Date().toISOString();

    let nextSprint = currentState.sprints.find(
      (s) => s.projectId === target.projectId && s.status === 'planned' && s.id !== id
    );

    let extraSprints = currentState.sprints;
    if (rolloverAction === 'nextSprint' && !nextSprint) {
      const nextEndDate = new Date();
      nextEndDate.setDate(nextEndDate.getDate() + 14);
      const newNextSprint: Sprint = {
        id: `sprint-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        projectId: target.projectId,
        name: `Sprint ${(parseInt(target.name.match(/\d+/)?.[0] || '1', 10) + 1)}: Next Iteration`,
        goal: 'Rollover & Next Iteration',
        startDate: now,
        endDate: nextEndDate.toISOString(),
        status: 'active',
        velocityTarget: target.velocityTarget || 25,
        createdAt: now,
        updatedAt: now,
      };
      extraSprints = [...extraSprints, newNextSprint];
      nextSprint = newNextSprint;
    }

    const updatedTasks = currentState.tasks.map((t) => {
      if (t.sprintId !== id) return t;
      const isDone = isDoneColumn(t.columnId);
      if (isDone) return t;

      return {
        ...t,
        sprintId: rolloverAction === 'nextSprint' && nextSprint ? nextSprint.id : undefined,
        updatedAt: now,
      };
    });

    currentState = {
      ...currentState,
      sprints: extraSprints.map((s) =>
        s.id === id
          ? { ...s, status: 'completed' as const, completedAt: now, updatedAt: now }
          : s
      ),
      tasks: updatedTasks,
    };
    emitChange();
  },

  deleteSprint(id: string): void {
    currentState = {
      ...currentState,
      sprints: currentState.sprints.filter((s) => s.id !== id),
      tasks: currentState.tasks.map((t) =>
        t.sprintId === id ? { ...t, sprintId: undefined } : t
      ),
    };
    emitChange();
  },

  // ---------------- Columns ----------------
  addColumn(projectId: string, columnData: Omit<Column, 'id' | 'order'>): Column {
    const project = currentState.projects.find((p) => p.id === projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    const newColumnId = `col-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newColumn: Column = {
      ...columnData,
      id: newColumnId,
      order: project.columns.length,
    };

    const now = new Date().toISOString();
    currentState = {
      ...currentState,
      projects: currentState.projects.map((p) =>
        p.id === projectId
          ? { ...p, columns: [...p.columns, newColumn], updatedAt: now }
          : p
      ),
    };
    emitChange();
    return newColumn;
  },

  updateColumn(projectId: string, columnId: string, updates: Partial<Column>): void {
    const now = new Date().toISOString();
    currentState = {
      ...currentState,
      projects: currentState.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          columns: p.columns.map((col) =>
            col.id === columnId ? { ...col, ...updates } : col
          ),
          updatedAt: now,
        };
      }),
    };
    emitChange();
  },

  deleteColumn(projectId: string, columnId: string, targetColumnId?: string): void {
    const project = currentState.projects.find((p) => p.id === projectId);
    if (!project) return;

    const remainingColumns = project.columns.filter((c) => c.id !== columnId);
    const fallbackColumnId =
      targetColumnId && remainingColumns.some((c) => c.id === targetColumnId)
        ? targetColumnId
        : remainingColumns[0]?.id;

    const renumberedColumns = remainingColumns.map((c, idx) => ({
      ...c,
      order: idx,
    }));

    const now = new Date().toISOString();

    // Reallocate tasks or remove them if no column left
    const updatedTasks = currentState.tasks.map((t) => {
      if (t.projectId === projectId && t.columnId === columnId) {
        if (fallbackColumnId) {
          return { ...t, columnId: fallbackColumnId, updatedAt: now };
        }
      }
      return t;
    }).filter((t) => !(t.projectId === projectId && t.columnId === columnId && !fallbackColumnId));

    currentState = {
      ...currentState,
      projects: currentState.projects.map((p) =>
        p.id === projectId
          ? { ...p, columns: renumberedColumns, updatedAt: now }
          : p
      ),
      tasks: updatedTasks,
    };
    emitChange();
  },

  reorderColumns(projectId: string, columnIds: string[]): void {
    const now = new Date().toISOString();
    currentState = {
      ...currentState,
      projects: currentState.projects.map((p) => {
        if (p.id !== projectId) return p;
        const columnMap = new Map(p.columns.map((c) => [c.id, c]));
        const reordered = columnIds
          .map((id, index) => {
            const col = columnMap.get(id);
            return col ? { ...col, order: index } : null;
          })
          .filter((c): c is Column => c !== null);

        // Include any remaining columns not in columnIds
        p.columns.forEach((col) => {
          if (!columnIds.includes(col.id)) {
            reordered.push({ ...col, order: reordered.length });
          }
        });

        return {
          ...p,
          columns: reordered,
          updatedAt: now,
        };
      }),
    };
    emitChange();
  },

  // ---------------- Tasks ----------------
  addTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    const project = currentState.projects.find((p) => p.id === taskData.projectId);
    const githubUrl =
      taskData.githubUrl ||
      (project?.repoOwner && project?.repoName && taskData.githubIssueNumber
        ? `https://github.com/${project.repoOwner}/${project.repoName}/issues/${taskData.githubIssueNumber}`
        : undefined);

    const newTask: Task = {
      ...taskData,
      id,
      githubUrl,
      createdAt: now,
      updatedAt: now,
    };

    currentState = {
      ...currentState,
      tasks: [...currentState.tasks, newTask],
    };
    emitChange();
    return newTask;
  },

  updateTask(id: string, updates: Partial<Task>): void {
    const now = new Date().toISOString();
    currentState = {
      ...currentState,
      tasks: currentState.tasks.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, ...updates, updatedAt: now };
        const project = currentState.projects.find((p) => p.id === updated.projectId);
        if (
          project?.repoOwner &&
          project?.repoName &&
          updated.githubIssueNumber &&
          !updates.githubUrl
        ) {
          updated.githubUrl = `https://github.com/${project.repoOwner}/${project.repoName}/issues/${updated.githubIssueNumber}`;
        }

        // Auto-move to Done or Shipped if PR is merged
        if (updates.prStatus === 'merged' && t.prStatus !== 'merged') {
          const doneColumn = project?.columns.find(
            (c) =>
              c.title.toLowerCase().includes('done') ||
              c.title.toLowerCase().includes('ship') ||
              c.id === 'done' ||
              c.id.includes('done') ||
              c.id.includes('ship')
          );
          if (doneColumn) {
            updated.columnId = doneColumn.id;
          }
        }

        return updated;
      }),
    };
    emitChange();
  },

  deleteTask(id: string): void {
    currentState = {
      ...currentState,
      tasks: currentState.tasks.filter((t) => t.id !== id),
    };
    emitChange();
  },

  toggleSubtask(taskId: string, subtaskId: string): void {
    const now = new Date().toISOString();
    currentState = {
      ...currentState,
      tasks: currentState.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const subtasks = (t.subtasks || []).map((st) =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        return { ...t, subtasks, updatedAt: now };
      }),
    };
    emitChange();
  },

  addSubtask(taskId: string, title: string): void {
    const trimmed = title.trim();
    if (!trimmed) return;
    const now = new Date().toISOString();
    const newSubtask = {
      id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: trimmed,
      completed: false,
    };
    currentState = {
      ...currentState,
      tasks: currentState.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const subtasks = [...(t.subtasks || []), newSubtask];
        return { ...t, subtasks, updatedAt: now };
      }),
    };
    emitChange();
  },

  removeSubtask(taskId: string, subtaskId: string): void {
    const now = new Date().toISOString();
    currentState = {
      ...currentState,
      tasks: currentState.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const subtasks = (t.subtasks || []).filter((st) => st.id !== subtaskId);
        return { ...t, subtasks, updatedAt: now };
      }),
    };
    emitChange();
  },

  addComment(taskId: string, content: string, author: string = 'diogocsilva12', avatarUrl?: string): void {
    const trimmed = content.trim();
    if (!trimmed) return;
    const now = new Date().toISOString();
    const newComment = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      author,
      avatarUrl: avatarUrl || `https://github.com/${author}.png`,
      content: trimmed,
      createdAt: now,
    };
    currentState = {
      ...currentState,
      tasks: currentState.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const comments = [...(t.comments || []), newComment];
        return { ...t, comments, updatedAt: now };
      }),
    };
    emitChange();
  },

  deleteComment(taskId: string, commentId: string): void {
    const now = new Date().toISOString();
    currentState = {
      ...currentState,
      tasks: currentState.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const comments = (t.comments || []).filter((c) => c.id !== commentId);
        return { ...t, comments, updatedAt: now };
      }),
    };
    emitChange();
  },

  moveTask(taskId: string, targetColumnId: string, targetIndex?: number): void {
    const task = currentState.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const now = new Date().toISOString();
    const otherTasks = currentState.tasks.filter((t) => t.id !== taskId);

    const project = currentState.projects.find((p) => p.id === task.projectId);
    const targetColumn = project?.columns.find((c) => c.id === targetColumnId);
    const colName = targetColumn?.title || targetColumnId;

    let startedAt = task.startedAt;
    let completedAt = task.completedAt;

    if (isInProgressColumn(colName) && !startedAt) {
      startedAt = now;
    }
    if (isDoneColumn(colName)) {
      if (!startedAt) startedAt = task.createdAt;
      completedAt = now;
    } else if (!isDoneColumn(colName) && completedAt) {
      completedAt = undefined;
    }

    const updatedTask: Task = {
      ...task,
      columnId: targetColumnId,
      startedAt,
      completedAt,
      updatedAt: now,
    };

    // Get all tasks in the target column
    const targetColumnTasks = otherTasks.filter(
      (t) => t.projectId === task.projectId && t.columnId === targetColumnId
    );

    let newTargetList: Task[];
    if (targetIndex !== undefined && targetIndex >= 0 && targetIndex <= targetColumnTasks.length) {
      newTargetList = [
        ...targetColumnTasks.slice(0, targetIndex),
        updatedTask,
        ...targetColumnTasks.slice(targetIndex),
      ];
    } else {
      newTargetList = [...targetColumnTasks, updatedTask];
    }

    const otherTasksExcludingTarget = otherTasks.filter(
      (t) => !(t.projectId === task.projectId && t.columnId === targetColumnId)
    );

    currentState = {
      ...currentState,
      tasks: [...otherTasksExcludingTarget, ...newTargetList],
    };
    emitChange();
  },

  reorderTasks(columnId: string, taskIds: string[]): void {
    const now = new Date().toISOString();
    const taskMap = new Map(currentState.tasks.map((t) => [t.id, t]));
    const reorderedInColumn = taskIds
      .map((id) => taskMap.get(id))
      .filter((t): t is Task => !!t && t.columnId === columnId);

    const otherTasks = currentState.tasks.filter(
      (t) => t.columnId !== columnId || !taskIds.includes(t.id)
    );

    currentState = {
      ...currentState,
      tasks: [
        ...otherTasks,
        ...reorderedInColumn.map((t) => ({ ...t, updatedAt: now })),
      ],
    };
    emitChange();
  },

  // ---------------- Filters ----------------
  setFilter(filterUpdates: Partial<BoardFilter>): void {
    currentState = {
      ...currentState,
      filter: {
        ...currentState.filter,
        ...filterUpdates,
      },
    };
    emitChange();
  },

  resetFilter(): void {
    currentState = {
      ...currentState,
      filter: { ...INITIAL_FILTER },
    };
    emitChange();
  },

  // ---------------- Sample Data Reset ----------------
  resetToSampleData(): void {
    currentState = {
      projects: INITIAL_PROJECTS,
      activeProjectId: INITIAL_PROJECTS[0].id,
      tasks: INITIAL_TASKS,
      sprints: INITIAL_SPRINTS,
      filter: { ...INITIAL_FILTER },
    };
    emitChange();
  },
};

export function getFilteredTasks(
  tasks: Task[],
  activeProjectId: string,
  filter: BoardFilter
): Task[] {
  return tasks.filter((task) => {
    if (task.projectId !== activeProjectId) return false;

    // Search query filter
    if (filter.searchQuery.trim()) {
      const q = filter.searchQuery.toLowerCase().trim();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q) || false;
      const matchBranch = task.branchName?.toLowerCase().includes(q) || false;
      const matchIssue = task.githubIssueNumber !== undefined && String(task.githubIssueNumber).includes(q);
      const matchAssignee = task.assignees.some(
        (a) => a.username.toLowerCase().includes(q) || a.name?.toLowerCase().includes(q)
      );
      const matchTags = task.tags?.some((t) => t.toLowerCase().includes(q)) || false;

      if (!matchTitle && !matchDesc && !matchBranch && !matchIssue && !matchAssignee && !matchTags) {
        return false;
      }
    }

    // Priority filter
    if (filter.priority !== 'ALL') {
      if (task.priority !== filter.priority) return false;
    }

    // Assignee filter
    if (filter.assignee !== 'ALL') {
      const matchAssignee = task.assignees.some(
        (a) => a.username.toLowerCase() === filter.assignee.toLowerCase()
      );
      if (!matchAssignee) return false;
    }

    // Tag filter
    if (filter.tag && filter.tag !== 'ALL') {
      const matchTag = task.tags?.some((t) => t.toLowerCase() === filter.tag!.toLowerCase());
      if (!matchTag) return false;
    }

    // Milestone filter
    if (filter.milestone && filter.milestone !== 'ALL') {
      if (task.milestone?.toLowerCase() !== filter.milestone.toLowerCase()) {
        return false;
      }
    }

    // Blocker filter
    if (filter.onlyBlocked && !task.isBlocked) {
      return false;
    }

    // Sprint filter
    if (filter.sprintId && filter.sprintId !== 'ALL') {
      if (filter.sprintId === 'active') {
        const activeSprint = currentState.sprints.find(
          (s) => s.projectId === activeProjectId && s.status === 'active'
        );
        if (!activeSprint || task.sprintId !== activeSprint.id) return false;
      } else if (task.sprintId !== filter.sprintId) {
        return false;
      }
    }

    return true;
  });
}

export function useBoardStore() {
  const state = useSyncExternalStore(
    boardStore.subscribe,
    boardStore.getState,
    boardStore.getState
  );

  const activeProject =
    state.projects.find((p) => p.id === state.activeProjectId) || state.projects[0];

  const activeProjectTasks = state.tasks.filter(
    (t) => t.projectId === state.activeProjectId
  );

  const filteredTasks = getFilteredTasks(
    state.tasks,
    state.activeProjectId,
    state.filter
  );

  // Extract all distinct assignees in the active project for filter dropdown
  const projectAssignees = Array.from(
    new Map(
      activeProjectTasks
        .flatMap((t) => t.assignees)
        .map((a) => [a.username, a])
    ).values()
  );

  // Extract all distinct tags in the active project for filter dropdown
  const projectTags = Array.from(
    new Set(activeProjectTasks.flatMap((t) => t.tags || []))
  );

  // Extract all distinct milestones in the active project for filter dropdown
  const projectMilestones = Array.from(
    new Set(activeProjectTasks.map((t) => t.milestone).filter((m): m is string => Boolean(m)))
  );

  const activeProjectSprints = state.sprints.filter(
    (s) => s.projectId === state.activeProjectId
  );

  const activeSprint = activeProjectSprints.find((s) => s.status === 'active');

  return {
    ...state,
    activeProject,
    activeProjectTasks,
    activeProjectSprints,
    activeSprint,
    filteredTasks,
    projectAssignees,
    projectTags,
    projectMilestones,
    addProject: boardStore.addProject,
    updateProject: boardStore.updateProject,
    updateProjectDeadline: boardStore.updateProjectDeadline,
    deleteProject: boardStore.deleteProject,
    setActiveProject: boardStore.setActiveProject,
    addSprint: boardStore.addSprint,
    updateSprint: boardStore.updateSprint,
    startSprint: boardStore.startSprint,
    completeSprint: boardStore.completeSprint,
    deleteSprint: boardStore.deleteSprint,
    addColumn: boardStore.addColumn,
    updateColumn: boardStore.updateColumn,
    deleteColumn: boardStore.deleteColumn,
    reorderColumns: boardStore.reorderColumns,
    addTask: boardStore.addTask,
    updateTask: boardStore.updateTask,
    deleteTask: boardStore.deleteTask,
    toggleSubtask: boardStore.toggleSubtask,
    addSubtask: boardStore.addSubtask,
    removeSubtask: boardStore.removeSubtask,
    addComment: boardStore.addComment,
    deleteComment: boardStore.deleteComment,
    moveTask: boardStore.moveTask,
    reorderTasks: boardStore.reorderTasks,
    setFilter: boardStore.setFilter,
    resetFilter: boardStore.resetFilter,
    resetToSampleData: boardStore.resetToSampleData,
  };
}
