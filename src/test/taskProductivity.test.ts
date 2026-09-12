import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { boardStore, getFilteredTasks } from '@/store/boardStore';
import { GithubSyncEngine } from '@/services/githubSync';
import { defaultView, loadSavedViews, saveViews, shortcutView } from '@/lib/savedViews';

beforeEach(() => {
  const data = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value), removeItem: (key: string) => data.delete(key) });
  boardStore.resetToSampleData();
  boardStore.setActor({ username: 'alice', avatarUrl: 'https://github.com/alice.png' });
});
afterEach(() => { boardStore.setActor(); vi.unstubAllGlobals(); });
const createTask = () => boardStore.addTask({ projectId: 'proj-core-engine', title: 'New task', priority: 'P2', assignees: [], columnId: 'col-1' });
const getTask = (id: string) => boardStore.getState().tasks.find((task) => task.id === id)!;

describe('Task creators and activity', () => {
  it('records the actor as creator and preserves creator when another user edits', () => {
    const task = createTask();
    expect(task.creator?.username).toBe('alice');
    expect(task.activity?.[0].action).toBe('Created task');
    boardStore.setActor({ username: 'bob' });
    boardStore.updateTask(task.id, { title: 'Changed', creator: { username: 'bob' } });
    expect(getTask(task.id).creator?.username).toBe('alice');
    const activity = getTask(task.id).activity!.at(-1)!;
    expect(activity.actor?.username).toBe('bob');
    expect(activity.changes).toContainEqual({ field: 'title', before: 'New task', after: 'Changed' });
    expect(activity.at).toMatch(/^\d{4}-/);
    expect(JSON.parse(localStorage.getItem('tasky_tasks_v1')!).find((item: { id: string }) => item.id === task.id).activity).toHaveLength(2);
  });

  it('records source column titles for moves and never attributes legacy tasks to their assignees', () => {
    const legacy = boardStore.getState().tasks[0];
    expect(legacy.creator).toBeUndefined();
    const task = createTask();
    boardStore.moveTask(task.id, 'col-5');
    expect(getTask(task.id).activity!.at(-1)!.changes).toContainEqual({ field: 'columnId', before: 'Backlog', after: 'Done' });
  });

  it('maps GitHub issue author independently of assignees', () => {
    const task = GithubSyncEngine.mapIssueToTask({ number: 2, title: 'Issue', body: '', state: 'open', user: { login: 'author', avatar_url: 'https://github.com/author.png' }, assignees: [{ login: 'assignee', avatar_url: '' }], labels: [], created_at: '', updated_at: '', html_url: '' }, 'project');
    expect(task.creator?.username).toBe('author');
    expect(task.assignees[0].username).toBe('assignee');
  });
});

describe('Task undo', () => {
  it('reverses edit and move while preserving timestamps, unrelated tasks, and accumulated history', () => {
    const task = createTask();
    const other = createTask();
    boardStore.updateTask(task.id, { title: 'Edited' });
    boardStore.moveTask(task.id, 'col-5');
    expect(getTask(task.id).completedAt).toBeDefined();
    boardStore.undo();
    expect(getTask(task.id).columnId).toBe('col-1');
    expect(getTask(task.id).completedAt).toBeUndefined();
    expect(getTask(task.id).title).toBe('Edited');
    boardStore.undo();
    expect(getTask(task.id).title).toBe('New task');
    expect(getTask(task.id).activity!.map((entry) => entry.action)).toEqual(['Created task', 'Edited task', 'Moved task', 'Undid: Moved task', 'Undid: Edited task']);
    expect(getTask(other.id).activity).toHaveLength(1);
  });

  it('restores deleted tasks with their creator, comments, and position; creation can also be undone', () => {
    const task = createTask();
    boardStore.addComment(task.id, 'Keep me', 'alice');
    const index = boardStore.getState().tasks.findIndex((item) => item.id === task.id);
    boardStore.deleteTask(task.id);
    expect(getTask(task.id)).toBeUndefined();
    boardStore.undo();
    expect(getTask(task.id).creator?.username).toBe('alice');
    expect(getTask(task.id).comments?.[0].content).toBe('Keep me');
    expect(boardStore.getState().tasks[index].id).toBe(task.id);
    boardStore.undo();
    expect(getTask(task.id).comments).toBeUndefined();
    boardStore.undo();
    expect(getTask(task.id)).toBeUndefined();
  });

  it('clears undo on user or project schema changes and ignores filter changes', () => {
    const task = createTask();
    boardStore.setFilter({ searchQuery: 'test' });
    boardStore.undo();
    expect(getTask(task.id)).toBeUndefined();
    const second = createTask();
    boardStore.setActor({ username: 'bob' });
    boardStore.undo();
    expect(getTask(second.id)).toBeDefined();
    boardStore.updateTask(second.id, { title: 'Keep' });
    boardStore.updateProject(second.projectId, { name: 'Renamed project' });
    boardStore.undo();
    expect(getTask(second.id).title).toBe('Keep');
  });
});

describe('Saved board views', () => {
  it('persists complete filters and project selection per user', () => {
    const settings = { projectIds: ['proj-core-engine'], filter: { ...defaultView().filter, priority: 'P1' as const, onlyBlocked: true } };
    saveViews('Alice', { current: settings, views: [{ id: 'one', name: 'Urgent', ...settings }] });
    expect(loadSavedViews('alice')).toEqual({ current: settings, views: [{ id: 'one', name: 'Urgent', ...settings }] });
    expect(loadSavedViews('bob')).toEqual({ current: defaultView(), views: [] });
  });

  it('handles invalid data and unavailable storage', () => {
    localStorage.setItem('tasky_views_v1:alice', '{broken');
    expect(loadSavedViews('alice').views).toEqual([]);
    localStorage.setItem('tasky_views_v1:alice', JSON.stringify({ current: { projectIds: null, filter: { searchQuery: 23 } }, views: [] }));
    expect(loadSavedViews('alice').current).toEqual(defaultView());
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error(); }, setItem: () => { throw new Error(); } });
    expect(loadSavedViews('alice').current).toEqual(defaultView());
    expect(saveViews('alice', { current: defaultView(), views: [] })).toBe(false);
  });

  it('shortcuts keep selected projects and overdue excludes completed tasks', () => {
    expect(shortcutView('mine', 'alice', ['a']).filter.assignee).toBe('alice');
    expect(shortcutView('blocked', 'alice', []).projectIds).toEqual([]);
    expect(shortcutView('blocked', 'alice', null).filter.onlyBlocked).toBe(true);
    const task = createTask();
    boardStore.updateTask(task.id, { dueDate: '2020-01-01' });
    const filter = shortcutView('overdue', 'alice', null).filter;
    expect(getFilteredTasks(boardStore.getState().tasks, task.projectId, filter).some((item) => item.id === task.id)).toBe(true);
    boardStore.moveTask(task.id, 'col-5');
    expect(getFilteredTasks(boardStore.getState().tasks, task.projectId, filter).some((item) => item.id === task.id)).toBe(false);
  });
});
