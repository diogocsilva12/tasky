import { recordOrganizationChange } from '../lib/organizationHistory';
import { useSyncExternalStore } from 'react';
import { emptyBoard, parseBoard, sameData, type BoardData } from '../lib/boardSync';
import type { Project, Column, Task, BoardFilter, Assignee } from '@/types';
import { makeTaskActivity } from '@/lib/taskActivity';
import { getCleanRepoDetails } from '@/lib/githubUrl';
import { isInProgressColumn, isDoneColumn } from '@/lib/taskMetrics';

const STORAGE_KEYS = {
  PROJECTS: 'tasky_projects_v1',
  TASKS: 'tasky_tasks_v1',
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

export const INITIAL_TASKS: Task[] = [
  // Tasky Core Engine Tasks
  {
    id: 'task-core-1',
    projectId: 'proj-core-engine',
    title: 'Implement client-side encrypted PAT authentication and Gist pass-list validation',
    description: 'Secure the app with GitHub Personal Access Token authentication and encrypted Gist-backed pass-list for zero-cost static hosting.',
    priority: 'P0',
    columnId: 'col-3',
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
  filter: BoardFilter;
}

let sessionKey: string | null = null;
function loadInitialState(): BoardState {
  return { ...emptyBoard(), activeProjectId: '', filter: { ...INITIAL_FILTER } };
}
function saveState(state: BoardState): void {
  if (!sessionKey) return;
  try { localStorage.setItem(sessionKey, JSON.stringify(state)); }
  catch (error) { console.error('Could not save local board backup:', error); }
}

let currentState: BoardState = loadInitialState();
const listeners = new Set<() => void>();

let actor: Assignee | undefined;
let previousTasks = structuredClone(currentState.tasks);
let previousProjects = JSON.stringify(currentState.projects);
let previousProjectData = structuredClone(currentState.projects);
const taskContent = (task: Task) => JSON.stringify({ ...task, activity: undefined, updatedAt: undefined });
const undoStack: { label: string; tasks: Task[] }[] = [];

function emitChange(action?: string, trackOrganization = false): void {
  if (trackOrganization) currentState = { ...currentState, projects: currentState.projects.map(project => recordOrganizationChange(previousProjectData.find(p => p.id === project.id), project, actor)) };
  previousProjectData = structuredClone(currentState.projects);
  if (previousProjects !== JSON.stringify(currentState.projects)) undoStack.length = 0;
  previousProjects = JSON.stringify(currentState.projects);
  const tasksChanged = JSON.stringify(previousTasks) !== JSON.stringify(currentState.tasks);
  if (tasksChanged && action) {
    undoStack.push({ label: action, tasks: previousTasks });
    if (undoStack.length > 30) undoStack.shift();
    const beforeById = new Map(previousTasks.map((task) => [task.id, task]));
    currentState = { ...currentState, tasks: currentState.tasks.map((task) => {
      const before = beforeById.get(task.id);
      if (JSON.stringify(before) === JSON.stringify(task)) return task;
      const entry = makeTaskActivity(action, actor, before, task, currentState.projects);
      return { ...task, activity: [...(before?.activity || task.activity || []), entry] };
    }) };
  } else if (tasksChanged) {
    undoStack.length = 0;
  }
  previousTasks = structuredClone(currentState.tasks);
  saveState(currentState);
  listeners.forEach((listener) => listener());
}

export const boardStore = {
  openSession(username: string, demo: boolean): void {
    sessionKey = `tasky_board_v2:${demo ? 'demo' : 'github'}:${username.toLowerCase()}`;
    currentState = loadInitialState();
    try {
      const saved = localStorage.getItem(sessionKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        currentState = { ...currentState, ...parseBoard(parsed), activeProjectId: parsed.activeProjectId || '' };
      } else if (demo) {
        currentState = { ...currentState, projects: structuredClone(INITIAL_PROJECTS), tasks: structuredClone(INITIAL_TASKS) };
      } else if (username.toLowerCase() === 'diogocsilva12') {
        // Preserve the old owner browser's real data; never seed a fresh session with samples.
        const projects: Project[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
        const tasks: Task[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
        const realProjects = projects.filter(project => {
          const sample = INITIAL_PROJECTS.find(p => p.id === project.id);
          return !sample || !sameData(sample, project) || !sameData(tasks.filter(t => t.projectId === project.id), INITIAL_TASKS.filter(t => t.projectId === project.id));
        });
        currentState = { ...currentState, ...parseBoard({ projects: realProjects, tasks: tasks.filter(t => realProjects.some(p => p.id === t.projectId)) }) };
      }
    } catch { /* The old keys are retained for manual recovery if a backup is malformed. */ }
    currentState.activeProjectId = currentState.projects.some(p => p.id === currentState.activeProjectId) ? currentState.activeProjectId : currentState.projects[0]?.id || '';
    undoStack.length = 0;
    emitChange();
  },
  closeSession(): void {
    sessionKey = null;
    currentState = loadInitialState();
    actor = undefined;
    undoStack.length = 0;
    emitChange();
  },
  replaceBoard(data: BoardData): void {
    const activeProjectId = data.projects.some(p => p.id === currentState.activeProjectId) ? currentState.activeProjectId : data.projects[0]?.id || '';
    currentState = { ...currentState, ...structuredClone(data), activeProjectId };
    emitChange();
  },

  setActor(person?: Assignee): void {
    const changedUser = actor?.username !== person?.username;
    if (changedUser) undoStack.length = 0;
    actor = person ? { username: person.username, name: person.name, avatarUrl: person.avatarUrl } : undefined;
    if (changedUser) { currentState = { ...currentState }; emitChange(); }
  },

  undo(): void {
    const operation = undoStack.pop();
    if (!operation) return;
    const current = new Map(currentState.tasks.map((task) => [task.id, task]));
    const tasks = operation.tasks.map((task) => {
      const latest = current.get(task.id);
      if (latest && taskContent(latest) === taskContent(task)) return latest;
      const entry = makeTaskActivity(`Undid: ${operation.label}`, actor, latest, task, currentState.projects);
      return { ...task, activity: [...(latest?.activity || task.activity || []), entry], updatedAt: entry.at };
    });
    currentState = { ...currentState, tasks };
    previousTasks = structuredClone(tasks);
    emitChange();
  },
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
    emitChange(undefined, true);
    return currentState.projects.find(p => p.id === id)!;
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
          organizationHistory: p.organizationHistory,
          repoOwner,
          repoName,
          githubUrl,
          updatedAt: now,
        };
      }),
    };
    emitChange(undefined, true);
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
    emitChange(undefined, true);
  },

  setActiveProject(id: string): void {
    if (currentState.activeProjectId === id) return;
    if (currentState.projects.some((p) => p.id === id)) {
      currentState = {
        ...currentState,
        activeProjectId: id,
      };
      emitChange(undefined, true);
    }
  },

  updateProjectDeadline(id: string, deadline?: string): void {
    const project = currentState.projects.find((p) => p.id === id);
    if (!project) return;
    boardStore.updateProject(id, { deadline: deadline || undefined });
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
    emitChange(undefined, true);
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
    emitChange(undefined, true);
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
    emitChange(undefined, true);
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
    emitChange(undefined, true);
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
      creator: taskData.creator || actor,
      id,
      githubUrl,
      createdAt: now,
      updatedAt: now,
    };

    currentState = {
      ...currentState,
      tasks: [...currentState.tasks, newTask],
    };
    emitChange('Created task');
    return currentState.tasks.find((task) => task.id === id)!;
  },

  updateTask(id: string, updates: Partial<Task>): void {
    const now = new Date().toISOString();
    currentState = {
      ...currentState,
      tasks: currentState.tasks.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, ...updates, creator: t.creator || updates.creator, updatedAt: now };
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
    emitChange('Edited task');
  },

  deleteTask(id: string): void {
    currentState = {
      ...currentState,
      tasks: currentState.tasks.filter((t) => t.id !== id),
    };
    emitChange('Deleted task');
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
    emitChange('Updated subtask');
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
    emitChange('Added subtask');
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
    emitChange('Removed subtask');
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
    emitChange('Added comment');
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
    emitChange('Deleted comment');
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
    emitChange('Moved task');
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
    emitChange('Reordered tasks');
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
    undoStack.length = 0;
    currentState = {
      projects: INITIAL_PROJECTS,
      activeProjectId: INITIAL_PROJECTS[0].id,
      tasks: INITIAL_TASKS,
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

    if (filter.onlyOverdue) {
      const project = currentState.projects.find((p) => p.id === task.projectId);
      const column = project?.columns.find((c) => c.id === task.columnId);
      const done = Boolean(task.completedAt) || isDoneColumn(column?.title || task.columnId) || /complete/i.test(column?.title || '');
      if (!task.dueDate || new Date(task.dueDate + 'T23:59:59').getTime() >= Date.now() || done) return false;
    }

    // Blocker filter
    if (filter.onlyBlocked && !task.isBlocked) {
      return false;
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

  return {
    ...state,
    undo: boardStore.undo,
    undoLabel: undoStack.at(-1)?.label,
    activeProject,
    activeProjectTasks,
    filteredTasks,
    projectAssignees,
    projectTags,
    projectMilestones,
    addProject: boardStore.addProject,
    updateProject: boardStore.updateProject,
    updateProjectDeadline: boardStore.updateProjectDeadline,
    deleteProject: boardStore.deleteProject,
    setActiveProject: boardStore.setActiveProject,
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
