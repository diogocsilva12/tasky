import { describe, expect, it } from 'vitest';
import type { Project, Task } from '@/types';
import { buildPublicBoard, getPublicProjects, resolvePublicBoardColumn } from '@/lib/publicBoard';
import { getFilteredTasks } from '@/store/boardStore';

const projects: Project[] = [
  { id: 'a', name: 'Alpha', visibility: 'public', columns: [{ id: 'shared', title: 'To Do', order: 0 }, { id: 'a-done', title: 'Done', order: 1 }], createdAt: '', updatedAt: '' },
  { id: 'b', name: 'Beta', columns: [{ id: 'b-todo', title: ' to do ', order: 0 }, { id: 'shared', title: 'Research', order: 1 }, { id: 'b-done', title: 'Done', order: 2 }], createdAt: '', updatedAt: '' },
  { id: 'private', name: 'Private', visibility: 'private', columns: [{ id: 'secret', title: 'Secret', order: 0 }], createdAt: '', updatedAt: '' },
];
const task = (id: string, projectId: string, columnId: string): Task => ({ id, projectId, columnId, title: id, priority: 'P1', assignees: [], createdAt: '', updatedAt: '' });
const tasks = [task('a1', 'a', 'shared'), task('b1', 'b', 'b-todo'), task('b2', 'b', 'shared'), task('missing', 'b', 'deleted'), task('secret', 'private', 'secret'), task('orphan', 'deleted', 'shared')];

describe('All public projects board', () => {
  it('includes public and default-public projects only', () => {
    expect(getPublicProjects(projects).map((project) => project.id)).toEqual(['a', 'b']);
    const columns = buildPublicBoard(projects, tasks);
    expect(columns.flatMap((column) => column.tasks).map((task) => task.id).sort()).toEqual(['a1', 'b1', 'b2', 'missing']);
    expect(columns.some((column) => column.title === 'Secret')).toBe(false);
  });

  it('combines matching titles while resolving identical column IDs within their projects', () => {
    const columns = buildPublicBoard(projects, tasks);
    expect(columns.find((column) => column.title === 'To Do')?.tasks.map((task) => task.id)).toEqual(['a1', 'b1']);
    expect(columns.find((column) => column.title === 'Research')?.tasks.map((task) => task.id)).toEqual(['b2']);
    expect(columns.find((column) => column.title === 'Done')?.tasks).toEqual([]);
    expect(columns.find((column) => column.title === 'Unassigned')?.tasks.map((task) => task.id)).toEqual(['missing']);
  });

  it('maps drops to the source project and rejects unsupported or private destinations', () => {
    const columns = buildPublicBoard(projects, tasks);
    const done = columns.find((column) => column.title === 'Done')!;
    const research = columns.find((column) => column.title === 'Research')!;
    expect(resolvePublicBoardColumn(projects, tasks[0], done.id)).toBe('a-done');
    expect(resolvePublicBoardColumn(projects, tasks[1], done.id)).toBe('b-done');
    expect(resolvePublicBoardColumn(projects, tasks[0], research.id)).toBeUndefined();
    expect(resolvePublicBoardColumn(projects, tasks[4], done.id)).toBeUndefined();
    expect(resolvePublicBoardColumn(projects, tasks[0], 'public-unassigned')).toBeUndefined();
    expect(tasks[0].columnId).toBe('shared');
  });

  it('applies filters across public projects without depending on the active project', () => {
    const filter = { searchQuery: 'b', priority: 'ALL' as const, assignee: 'ALL' };
    const visibleTasks = getPublicProjects(projects).flatMap((project) => getFilteredTasks(tasks, project.id, filter));
    expect(buildPublicBoard(projects, visibleTasks).flatMap((column) => column.tasks).map((task) => task.id)).toEqual(['b1', 'b2']);
  });

  it('handles an empty store and visibility changes', () => {
    expect(buildPublicBoard([], tasks)).toEqual([]);
    const hidden = projects.map((project) => ({ ...project, visibility: 'private' as const }));
    expect(buildPublicBoard(hidden, tasks)).toEqual([]);
  });
});
