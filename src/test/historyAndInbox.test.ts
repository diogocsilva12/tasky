import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { boardStore } from '../store/boardStore';
import { organizationChanges, recordOrganizationChange, taskOrganizationChanges, validOrganizationHistory } from '../lib/organizationHistory';
import { buildPersonalInbox, mentionsUser, inboxStorageKey, saveInboxReadState, loadInboxReadState } from '../lib/personalInbox';
import { parseBoard, mergeBoards } from '../lib/boardSync';
import type { Project, Task } from '../types';
const project: Project = { id: 'p', name: 'Team', owner: 'alice', visibility: 'private', allowedUsers: ['bob'], columns: [{ id: 'todo', title: 'Todo', order: 0 }, { id: 'review', title: 'Review', order: 1 }, { id: 'done', title: 'Done', order: 2 }], createdAt: '2026-09-01', updatedAt: '2026-09-01' };
const task: Task = { id: 't', projectId: 'p', title: 'Work', columnId: 'review', priority: 'P2', assignees: [{ username: 'bob' }], createdAt: '2026-09-01', updatedAt: '2026-09-01' };
const now = new Date(2026, 8, 14, 12);
const inbox = (updates: Partial<Task> = {}, username = 'bob') => buildPersonalInbox([project], [{ ...task, ...updates }], { username }, now);
beforeEach(() => {
  const data = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => data.set(k, v), removeItem: (k: string) => data.delete(k) });
  boardStore.openSession('alice', true); boardStore.replaceBoard({ projects: [structuredClone(project)], tasks: [] }); boardStore.setActor({ username: 'alice' });
});
afterEach(() => { boardStore.setActor(); vi.unstubAllGlobals(); });
describe('organization history', () => {
  it('captures legacy baseline, author and before/after without inventing past events', () => {
    expect(boardStore.getState().projects[0].organizationHistory).toBeUndefined();
    boardStore.updateProject('p', { owner: 'bob', deadline: '2026-10-01' });
    const events = boardStore.getState().projects[0].organizationHistory!;
    expect(events).toHaveLength(1); expect(events[0].actor?.username).toBe('alice');
    expect(organizationChanges(events[0])).toEqual([{ field: 'Project owner', before: 'alice', after: 'bob' }, { field: 'Project deadline', before: 'Not set', after: '2026-10-01' }]);
    expect(validOrganizationHistory(events)).toBe(true);
  });
  it('ignores cosmetic updates, no-ops, project switching and remote hydration', () => {
    boardStore.updateProject('p', { name: 'Renamed' }); boardStore.setActiveProject('p');
    expect(boardStore.getState().projects[0].organizationHistory).toBeUndefined();
    boardStore.updateProject('p', { deadline: '2026-10-01' });
    boardStore.updateProject('p', { deadline: '2026-10-01' });
    const data = parseBoard(JSON.parse(JSON.stringify(boardStore.getState())));
    boardStore.replaceBoard(data); expect(boardStore.getState().projects[0].organizationHistory).toHaveLength(1);
  });
  it('records WIP, column order, additions, renames and access changes', () => {
    const changed = recordOrganizationChange(project, { ...project, allowedUsers: ['carol'], columns: [{ ...project.columns[1], order: 0, wipLimit: 2 }, { ...project.columns[0], order: 1, title: 'Backlog' }, { id: 'new', title: 'Shipped', order: 2 }] });
    const fields = organizationChanges(changed.organizationHistory![0]).map(c => c.field);
    expect(fields).toEqual(expect.arrayContaining(['Project members', 'Column renamed', 'Column added', 'Column removed', 'Column order', 'WIP limit · Review']));
  });
  it('persists creation history and preserves it through independent shared edits', () => {
    const created = boardStore.addProject({ name: 'New', owner: 'alice' });
    expect(created.organizationHistory?.[0].before).toBeNull();
    const base = { projects: [project], tasks: [task] };
    const local = { ...base, projects: [recordOrganizationChange(project, { ...project, deadline: '2026-10-01' })] };
    const remote = { ...base, tasks: [{ ...task, reviewers: [{ username: 'alice' }] }] };
    const merged = parseBoard(JSON.parse(JSON.stringify(mergeBoards(base, local, remote))));
    expect(merged.projects[0].organizationHistory).toHaveLength(1); expect(merged.tasks[0].reviewers?.[0].username).toBe('alice');
  });
  it('includes task ownership and deadline activity', () => {
    const t = boardStore.addTask({ ...task });
    boardStore.updateTask(t.id, { reviewers: [{ username: 'alice' }], dueDate: '2026-10-01' });
    const entries = taskOrganizationChanges(boardStore.getState().tasks);
    expect(entries.at(-1)?.changes.map(c => c.field)).toEqual(expect.arrayContaining(['reviewers', 'dueDate']));
  });
  it('rejects malformed history and reviewer data in shared backups', () => {
    expect(validOrganizationHistory([null])).toBe(false);
    expect(() => parseBoard({ projects: [{ ...project, organizationHistory: [{ id: 'bad' }] }], tasks: [] })).toThrow();
    expect(() => parseBoard({ projects: [project], tasks: [{ ...task, reviewers: [null] }] })).toThrow();
  });
});
describe('personal inbox', () => {
  it('shows assignments and fallback reviews only for accessible projects', () => {
    expect(inbox().map(i => i.kind)).toEqual(['review', 'assigned']);
    expect(inbox({}, 'stranger')).toEqual([]);
    expect(buildPersonalInbox([project], [task], null, now)).toEqual([]);
  });
  it('uses explicit reviewers and waits for a review stage', () => {
    expect(inbox({ reviewers: [{ username: 'alice' }] }).map(i => i.kind)).toEqual(['assigned']);
    expect(inbox({ reviewers: [{ username: 'ALICE' }] }, 'alice').map(i => i.kind)).toEqual(['review']);
    expect(inbox({ reviewers: [{ username: 'alice' }], columnId: 'todo' }, 'alice')).toEqual([]);
  });
  it('handles today, seven-day boundary, overdue and impossible dates', () => {
    expect(inbox({ dueDate: '2026-09-14' })[0].detail).toContain('Due today');
    expect(inbox({ dueDate: '2026-09-21' })[0].kind).toBe('due');
    expect(inbox({ dueDate: '2026-09-22' }).some(i => i.kind === 'due')).toBe(false);
    expect(inbox({ dueDate: '2026-09-13' })[0].overdue).toBe(true);
    expect(inbox({ dueDate: '2026-02-31' }).some(i => i.kind === 'due')).toBe(false);
  });
  it('removes completed work from actionable categories', () => {
    expect(inbox({ columnId: 'done', dueDate: '2026-09-13' })).toEqual([]);
    expect(inbox({ completedAt: '2026-09-14' })).toEqual([]);
  });
  it('matches exact mentions, excluding self mentions, emails and username prefixes', () => {
    expect(mentionsUser('Hello @BOB, please check.', 'bob')).toBe(true);
    for (const text of ['@bobby', 'email@bob.com', '@bob-other', '@bob_name']) expect(mentionsUser(text, 'bob')).toBe(false);
    const comments = [{ id: 'c', author: 'alice', content: '@bob check this', createdAt: '2026-09-14' }, { id: 'self', author: 'bob', content: '@bob', createdAt: '2026-09-14' }];
    expect(inbox({ comments }).filter(i => i.kind === 'mention')).toHaveLength(1);
    expect(inbox({ description: '@bob', creator: { username: 'bob' } }).filter(i => i.kind === 'mention')).toHaveLength(0);
  });
  it('keeps read versions stable for unrelated edits and renews on reassignment', () => {
    const original = inbox().find(i => i.kind === 'assigned')!;
    expect(inbox({ title: 'Renamed' }).find(i => i.kind === 'assigned')?.version).toBe(original.version);
    expect(inbox({ activity: [{ id: 'a', action: 'Edited task', at: '2026-09-14', changes: [{ field: 'assignees', before: 'alice', after: 'bob' }] }] }).find(i => i.kind === 'assigned')?.version).not.toBe(original.version);
  });
  it('isolates persisted read state by account and demo mode', () => {
    const item = inbox()[0], key = inboxStorageKey('BOB'); saveInboxReadState(key, { [item.id]: item.version });
    expect(loadInboxReadState(inboxStorageKey('bob'))[item.id]).toBe(item.version);
    expect(loadInboxReadState(inboxStorageKey('alice'))).toEqual({}); expect(loadInboxReadState(inboxStorageKey('bob', true))).toEqual({});
  });
});
