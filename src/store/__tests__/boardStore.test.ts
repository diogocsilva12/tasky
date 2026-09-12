import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { boardStore, getFilteredTasks, INITIAL_PROJECTS } from '../boardStore';

describe('boardStore', () => {
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

  it('initializes with sample projects and tasks', () => {
    const state = boardStore.getState();
    expect(state.projects.length).toBe(2);
    expect(state.tasks.length).toBeGreaterThan(10);
    expect(state.activeProjectId).toBe(INITIAL_PROJECTS[0].id);
    expect(state.projects[0].name).toBe('Tasky Core Engine');
    expect(state.projects[1].name).toBe('Frontend Redesign');
  });

  it('supports adding, updating, and deleting projects', () => {
    const newProj = boardStore.addProject({
      name: 'New Mobile App',
      description: 'React Native iOS and Android application',
      repoOwner: 'diogocsilva12',
      repoName: 'mobile-app',
      defaultBranch: 'main',
    });

    let state = boardStore.getState();
    expect(state.projects.length).toBe(3);
    expect(state.activeProjectId).toBe(newProj.id);
    expect(newProj.columns.length).toBe(5);
    expect(newProj.githubUrl).toBe('https://github.com/diogocsilva12/mobile-app');

    // Update project
    boardStore.updateProject(newProj.id, {
      name: 'Mobile App Pro',
      activeBranch: 'feature/push-notifs',
    });
    state = boardStore.getState();
    const updated = state.projects.find((p) => p.id === newProj.id);
    expect(updated?.name).toBe('Mobile App Pro');
    expect(updated?.activeBranch).toBe('feature/push-notifs');

    // Delete project
    boardStore.deleteProject(newProj.id);
    state = boardStore.getState();
    expect(state.projects.length).toBe(2);
    expect(state.projects.some((p) => p.id === newProj.id)).toBe(false);
  });

  it('supports column operations: add, update, reorder, delete', () => {
    const activeId = boardStore.getState().activeProjectId;
    const addedCol = boardStore.addColumn(activeId, {
      title: 'Testing',
      color: '#ec4899',
    });

    let state = boardStore.getState();
    let proj = state.projects.find((p) => p.id === activeId);
    expect(proj?.columns.length).toBe(6);
    expect(proj?.columns.some((c) => c.id === addedCol.id)).toBe(true);

    // Update column
    boardStore.updateColumn(activeId, addedCol.id, { title: 'Automated QA' });
    proj = boardStore.getState().projects.find((p) => p.id === activeId);
    const updatedCol = proj?.columns.find((c) => c.id === addedCol.id);
    expect(updatedCol?.title).toBe('Automated QA');

    // Reorder columns
    const columnIds = proj!.columns.map((c) => c.id).reverse();
    boardStore.reorderColumns(activeId, columnIds);
    proj = boardStore.getState().projects.find((p) => p.id === activeId);
    expect(proj?.columns[0].id).toBe(columnIds[0]);

    // Delete column
    boardStore.deleteColumn(activeId, addedCol.id);
    proj = boardStore.getState().projects.find((p) => p.id === activeId);
    expect(proj?.columns.some((c) => c.id === addedCol.id)).toBe(false);
  });

  it('supports task CRUD and moving tasks across columns', () => {
    const activeId = boardStore.getState().activeProjectId;
    const targetCol = boardStore.getState().projects[0].columns[0].id;

    // Add task
    const newTask = boardStore.addTask({
      projectId: activeId,
      columnId: targetCol,
      title: 'Fix edge case with offline sync',
      description: 'Queue mutations in IndexedDB when offline',
      priority: 'P0',
      assignees: [{ username: 'diogocsilva12' }],
      githubIssueNumber: 42,
      branchName: 'fix/offline-queue',
    });

    let state = boardStore.getState();
    expect(state.tasks.some((t) => t.id === newTask.id)).toBe(true);
    expect(newTask.githubUrl).toContain('/issues/42');

    // Update task
    boardStore.updateTask(newTask.id, {
      priority: 'P1',
      title: 'Fix edge case with offline sync (Updated)',
    });
    state = boardStore.getState();
    const updated = state.tasks.find((t) => t.id === newTask.id);
    expect(updated?.priority).toBe('P1');
    expect(updated?.title).toBe('Fix edge case with offline sync (Updated)');

    // Move task to another column
    const nextCol = boardStore.getState().projects[0].columns[1].id;
    boardStore.moveTask(newTask.id, nextCol, 0);
    state = boardStore.getState();
    const moved = state.tasks.find((t) => t.id === newTask.id);
    expect(moved?.columnId).toBe(nextCol);

    // Delete task
    boardStore.deleteTask(newTask.id);
    state = boardStore.getState();
    expect(state.tasks.some((t) => t.id === newTask.id)).toBe(false);
  });

  it('filters tasks accurately by query, priority, and assignee', () => {
    const tasks = boardStore.getState().tasks;
    const projId = 'proj-core-engine';

    // Query filter
    const queryFiltered = getFilteredTasks(tasks, projId, {
      searchQuery: 'GraphQL',
      priority: 'ALL',
      assignee: 'ALL',
    });
    expect(queryFiltered.length).toBe(1);
    expect(queryFiltered[0].title).toContain('GraphQL');

    // Priority filter
    const p0Tasks = getFilteredTasks(tasks, projId, {
      searchQuery: '',
      priority: 'P0',
      assignee: 'ALL',
    });
    expect(p0Tasks.every((t) => t.priority === 'P0')).toBe(true);
    expect(p0Tasks.length).toBeGreaterThan(0);

    // Assignee filter
    const diogoTasks = getFilteredTasks(tasks, projId, {
      searchQuery: '',
      priority: 'ALL',
      assignee: 'diogocsilva12',
    });
    expect(
      diogoTasks.every((t) =>
        t.assignees.some((a) => a.username === 'diogocsilva12')
      )
    ).toBe(true);
  });
});
