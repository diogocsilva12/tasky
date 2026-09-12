import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { boardStore, getFilteredTasks } from '../boardStore';
import type { Task } from '@/types';

describe('Kanban and Project Management Deep Operations', () => {
  beforeAll(() => {
    const memoryStore: Record<string, string> = {};
    const mockStorage = {
      getItem: (key: string) => memoryStore[key] ?? null,
      setItem: (key: string, value: string) => {
        memoryStore[key] = value;
      },
      removeItem: (key: string) => {
        delete memoryStore[key];
      },
      clear: () => {
        Object.keys(memoryStore).forEach((k) => delete memoryStore[k]);
      },
      get length() {
        return Object.keys(memoryStore).length;
      },
      key: (i: number) => Object.keys(memoryStore)[i] ?? null,
    };
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      writable: true,
    });
  });

  beforeEach(() => {
    globalThis.localStorage.clear();
    boardStore.resetToSampleData();
  });

  it('correctly maps GitHub repository and branch URLs', () => {
    const project = boardStore.getState().projects[0];
    expect(project.githubUrl).toBe('https://github.com/diogocsilva12/tasky');
    expect(project.defaultBranch).toBe('main');
    expect(project.activeBranch).toBe('feature/kanban-board');

    // Auto-generates githubUrl if repoOwner and repoName are provided
    const newProj = boardStore.addProject({
      name: 'Custom Sync Engine',
      repoOwner: 'octocat',
      repoName: 'hello-world',
      defaultBranch: 'master',
    });

    expect(newProj.githubUrl).toBe('https://github.com/octocat/hello-world');
  });

  it('handles column deletion with task reallocation to a target column', () => {
    const activeId = boardStore.getState().activeProjectId;
    const project = boardStore.getState().projects.find((p) => p.id === activeId)!;
    const sourceColId = project.columns[1].id; // col-2 (To Do)
    const targetColId = project.columns[0].id; // col-1 (Backlog)

    // Add tasks to source column
    const taskA = boardStore.addTask({
      projectId: activeId,
      columnId: sourceColId,
      title: 'Task in col-2',
      priority: 'P2',
      assignees: [],
    });

    // Delete column with targetColumnId
    boardStore.deleteColumn(activeId, sourceColId, targetColId);

    const updatedTask = boardStore.getState().tasks.find((t) => t.id === taskA.id);
    expect(updatedTask?.columnId).toBe(targetColId);

    const updatedProject = boardStore.getState().projects.find((p) => p.id === activeId)!;
    expect(updatedProject.columns.some((c) => c.id === sourceColId)).toBe(false);
    // Verify columns order normalized
    expect(updatedProject.columns.map((c) => c.order)).toEqual(
      updatedProject.columns.map((_, i) => i)
    );
  });

  it('reorders tasks within the same column and moves to specific index', () => {
    const activeId = boardStore.getState().activeProjectId;
    const project = boardStore.getState().projects.find((p) => p.id === activeId)!;
    const columnId = project.columns[0].id;

    // Create 3 tasks in columnId
    boardStore.addTask({ projectId: activeId, columnId, title: 'T1', priority: 'P1', assignees: [] });
    boardStore.addTask({ projectId: activeId, columnId, title: 'T2', priority: 'P2', assignees: [] });
    const t3 = boardStore.addTask({ projectId: activeId, columnId, title: 'T3', priority: 'P3', assignees: [] });

    // Move t3 to index 0
    boardStore.moveTask(t3.id, columnId, 0);

    const tasksInCol = boardStore
      .getState()
      .tasks.filter((t) => t.projectId === activeId && t.columnId === columnId);

    const indexOfT3 = tasksInCol.findIndex((t) => t.id === t3.id);
    expect(indexOfT3).toBe(0);
  });

  it('supports all priority levels P0 to P4 in filtering', () => {
    const tasks: Task[] = [
      { id: '1', projectId: 'p1', title: 'Critical', columnId: 'c1', priority: 'P0', assignees: [], createdAt: '', updatedAt: '' },
      { id: '2', projectId: 'p1', title: 'High', columnId: 'c1', priority: 'P1', assignees: [], createdAt: '', updatedAt: '' },
      { id: '3', projectId: 'p1', title: 'Medium', columnId: 'c1', priority: 'P2', assignees: [], createdAt: '', updatedAt: '' },
      { id: '4', projectId: 'p1', title: 'Low', columnId: 'c1', priority: 'P3', assignees: [], createdAt: '', updatedAt: '' },
      { id: '5', projectId: 'p1', title: 'Trivial', columnId: 'c1', priority: 'P4', assignees: [], createdAt: '', updatedAt: '' },
    ];

    (['P0', 'P1', 'P2', 'P3', 'P4'] as const).forEach((p) => {
      const res = getFilteredTasks(tasks, 'p1', {
        searchQuery: '',
        priority: p,
        assignee: 'ALL',
      });
      expect(res.length).toBe(1);
      expect(res[0].priority).toBe(p);
    });
  });

  it('searches across branchName and issue numbers accurately', () => {
    const tasks = boardStore.getState().tasks;
    const projId = 'proj-core-engine';

    // Search by branch name
    const branchRes = getFilteredTasks(tasks, projId, {
      searchQuery: 'feature/auth-admin',
      priority: 'ALL',
      assignee: 'ALL',
    });
    expect(branchRes.length).toBeGreaterThan(0);
    expect(branchRes.every((t) => t.branchName?.includes('auth-admin'))).toBe(true);

    // Search by issue number
    const issueRes = getFilteredTasks(tasks, projId, {
      searchQuery: '2',
      priority: 'ALL',
      assignee: 'ALL',
    });
    expect(issueRes.some((t) => t.githubIssueNumber === 2)).toBe(true);
  });
});
