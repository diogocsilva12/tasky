import { describe, it, expect, beforeEach } from 'vitest';
import { boardStore, getFilteredTasks, INITIAL_PROJECTS } from '@/store/boardStore';
import type { Task, BoardFilter } from '@/types';

describe('Task Power Features (Subtasks, Tags, Due Dates, Story Points, WIP Limits)', () => {
  beforeEach(() => {
    boardStore.resetToSampleData();
  });

  it('adds, toggles, and removes subtasks on a task', () => {
    const task = boardStore.addTask({
      projectId: 'proj-core-engine',
      title: 'Test Subtasks Task',
      columnId: 'col-1',
      priority: 'P2',
      assignees: [],
    });

    expect(task.subtasks).toBeUndefined();

    // Add subtask 1
    boardStore.addSubtask(task.id, 'First checklist item');
    let state = boardStore.getState();
    let updatedTask = state.tasks.find((t) => t.id === task.id)!;
    expect(updatedTask.subtasks).toHaveLength(1);
    expect(updatedTask.subtasks![0].title).toBe('First checklist item');
    expect(updatedTask.subtasks![0].completed).toBe(false);

    const subtaskId = updatedTask.subtasks![0].id;

    // Toggle subtask completion
    boardStore.toggleSubtask(task.id, subtaskId);
    state = boardStore.getState();
    updatedTask = state.tasks.find((t) => t.id === task.id)!;
    expect(updatedTask.subtasks![0].completed).toBe(true);

    // Toggle back
    boardStore.toggleSubtask(task.id, subtaskId);
    state = boardStore.getState();
    updatedTask = state.tasks.find((t) => t.id === task.id)!;
    expect(updatedTask.subtasks![0].completed).toBe(false);

    // Remove subtask
    boardStore.removeSubtask(task.id, subtaskId);
    state = boardStore.getState();
    updatedTask = state.tasks.find((t) => t.id === task.id)!;
    expect(updatedTask.subtasks).toHaveLength(0);
  });

  it('correctly filters tasks by tags in getFilteredTasks', () => {
    const activeProjId = 'proj-core-engine';
    const sampleTasks: Task[] = [
      {
        id: 't-1',
        projectId: activeProjId,
        title: 'Frontend Button Redesign',
        columnId: 'col-1',
        priority: 'P1',
        assignees: [],
        tags: ['frontend', 'ui'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 't-2',
        projectId: activeProjId,
        title: 'Backend API Auth Rate Limiting',
        columnId: 'col-1',
        priority: 'P0',
        assignees: [],
        tags: ['backend', 'security'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const filterAll: BoardFilter = {
      searchQuery: '',
      priority: 'ALL',
      assignee: 'ALL',
      tag: 'ALL',
    };
    expect(getFilteredTasks(sampleTasks, activeProjId, filterAll)).toHaveLength(2);

    const filterFrontend: BoardFilter = {
      ...filterAll,
      tag: 'frontend',
    };
    const frontendMatches = getFilteredTasks(sampleTasks, activeProjId, filterFrontend);
    expect(frontendMatches).toHaveLength(1);
    expect(frontendMatches[0].id).toBe('t-1');

    const filterSecurity: BoardFilter = {
      ...filterAll,
      tag: 'security',
    };
    const securityMatches = getFilteredTasks(sampleTasks, activeProjId, filterSecurity);
    expect(securityMatches).toHaveLength(1);
    expect(securityMatches[0].id).toBe('t-2');

    const filterNonExistent: BoardFilter = {
      ...filterAll,
      tag: 'devops',
    };
    expect(getFilteredTasks(sampleTasks, activeProjId, filterNonExistent)).toHaveLength(0);
  });

  it('stores due dates and story points on task creation and update', () => {
    const task = boardStore.addTask({
      projectId: 'proj-core-engine',
      title: 'Story Points & Due Date Task',
      columnId: 'col-2',
      priority: 'P1',
      assignees: [],
      dueDate: '2026-10-15',
      storyPoints: 8,
      tags: ['analytics', 'charts'],
    });

    let stored = boardStore.getState().tasks.find((t) => t.id === task.id)!;
    expect(stored.dueDate).toBe('2026-10-15');
    expect(stored.storyPoints).toBe(8);
    expect(stored.tags).toEqual(['analytics', 'charts']);

    boardStore.updateTask(task.id, {
      storyPoints: 13,
      dueDate: '2026-11-01',
    });

    stored = boardStore.getState().tasks.find((t) => t.id === task.id)!;
    expect(stored.storyPoints).toBe(13);
    expect(stored.dueDate).toBe('2026-11-01');
  });

  it('configures and persists column WIP limits', () => {
    const projId = INITIAL_PROJECTS[0].id;
    const colId = INITIAL_PROJECTS[0].columns[0].id;

    boardStore.updateColumn(projId, colId, {
      wipLimit: 3,
    });

    const project = boardStore.getState().projects.find((p) => p.id === projId)!;
    const column = project.columns.find((c) => c.id === colId)!;
    expect(column.wipLimit).toBe(3);
  });
});
