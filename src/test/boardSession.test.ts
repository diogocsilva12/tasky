import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { boardStore, INITIAL_PROJECTS, INITIAL_TASKS } from '../store/boardStore';
const storage = new Map<string, string>();
beforeEach(() => {
  storage.clear();
  vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) });
});
afterEach(() => { boardStore.closeSession(); vi.unstubAllGlobals(); });
it('starts fresh real accounts empty, while demos have isolated samples', () => {
  boardStore.openSession('alice', true); expect(boardStore.getState().projects.length).toBeGreaterThan(0);
  boardStore.openSession('alice', false); expect(boardStore.getState().projects).toEqual([]);
  boardStore.openSession('alice', true); expect(boardStore.getState().projects.length).toBeGreaterThan(0);
});
it('keeps one account local projects out of another account and clears state on logout', () => {
  boardStore.openSession('alice', false); boardStore.addProject({ name: 'Real', owner: 'alice' });
  boardStore.openSession('bob', false); expect(boardStore.getState().projects).toEqual([]);
  boardStore.openSession('alice', false); expect(boardStore.getState().projects[0].name).toBe('Real');
  boardStore.closeSession(); expect(boardStore.getState().projects).toEqual([]);
});
it('preserves old owner data without copying untouched samples into shared storage', () => {
  storage.set('tasky_projects_v1', JSON.stringify([...INITIAL_PROJECTS, { ...INITIAL_PROJECTS[0], id: 'real', name: 'My real project' }]));
  storage.set('tasky_tasks_v1', JSON.stringify(INITIAL_TASKS));
  boardStore.openSession('diogocsilva12', false);
  expect(boardStore.getState().projects.map(p => p.id)).toEqual(['real']);
  expect(storage.has('tasky_projects_v1')).toBe(true);
});
it('never assigns legacy owner data to another approved account', () => {
  storage.set('tasky_projects_v1', JSON.stringify([{ ...INITIAL_PROJECTS[0], id: 'real' }]));
  boardStore.openSession('bob', false); expect(boardStore.getState().projects).toEqual([]);
});
