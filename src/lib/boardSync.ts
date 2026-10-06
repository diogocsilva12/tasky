import { validOrganizationHistory } from './organizationHistory.js';
import { isRetrospective } from './organizationLearning.js';
import type { Project, Task } from '../types/index.js';

export interface BoardData { projects: Project[]; tasks: Task[] }
export const emptyBoard = (): BoardData => ({ projects: [], tasks: [] });
export const sameData = (a: unknown, b: unknown): boolean => canonical(a) === canonical(b);
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
  return JSON.stringify(value) ?? 'undefined';
}
export class SyncConflict extends Error {
  constructor() { super('Another user changed the same item. Your edits are saved locally. Export a backup before reloading the shared version.'); }
}
// Three-way merge preserves independent edits and deletions; overlapping edits never silently win.
export function mergeBoards(base: BoardData, local: BoardData, remote: BoardData): BoardData {
  function merge<T extends { id: string }>(before: T[], ours: T[], theirs: T[]): T[] {
    const b = new Map(before.map(x => [x.id, x]));
    const l = new Map(ours.map(x => [x.id, x]));
    const r = new Map(theirs.map(x => [x.id, x]));
    const result: T[] = [];
    const common = before.map(x => x.id).filter(id => l.has(id) && r.has(id));
    const commonIds = new Set(common);
    const localOrder = ours.map(x => x.id).filter(id => commonIds.has(id));
    const remoteOrder = theirs.map(x => x.id).filter(id => commonIds.has(id));
    const reordered = !sameData(common, localOrder);
    if (reordered && !sameData(common, remoteOrder) && !sameData(localOrder, remoteOrder)) throw new SyncConflict();
    const keys = reordered ? [...l.keys(), ...r.keys(), ...b.keys()] : [...r.keys(), ...l.keys(), ...b.keys()];
    for (const id of new Set(keys)) {
      const original = b.get(id), next = l.get(id), current = r.get(id);
      let value;
      if (sameData(next, original)) value = current;
      else if (sameData(current, original) || sameData(next, current)) value = next;
      else throw new SyncConflict();
      if (value) result.push(value);
    }
    return result;
  }
  const projects = merge(base.projects, local.projects, remote.projects);
  const tasks = merge(base.tasks, local.tasks, remote.tasks);
  // A project deletion racing with a newly added task must also conflict.
  if (tasks.some(t => !projects.some(p => p.id === t.projectId))) throw new SyncConflict();
  return { projects, tasks };
}

export function parseBoard(value: unknown): BoardData {
  const data = value as BoardData | null;
  if (!data || !Array.isArray(data.projects) || !Array.isArray(data.tasks)) throw new Error('Invalid project backup.');
  if (data.projects.length > 1000 || data.tasks.length > 20000) throw new Error('Workspace is too large.');
  const text = (v: unknown) => typeof v === 'string' && v.length > 0;
  const ids = new Set<string>();
  for (const p of data.projects) {
    if (!p || !text(p.id) || !text(p.name) || ids.has(p.id) || !Array.isArray(p.columns) ||
      (p.visibility !== undefined && !['public', 'private'].includes(p.visibility)) ||
      (p.owner !== undefined && !text(p.owner)) || (p.repoOwner !== undefined && !text(p.repoOwner)) ||
      (p.allowedUsers !== undefined && (!Array.isArray(p.allowedUsers) || !p.allowedUsers.every(text)))) throw new Error('Invalid project data.');
    if (p.retrospective !== undefined && !isRetrospective(p.retrospective)) throw new Error('Invalid project retrospective.');
    if (p.organizationHistory !== undefined && !validOrganizationHistory(p.organizationHistory)) throw new Error('Invalid organization history.');
    ids.add(p.id);
    const columns = new Set<string>();
    for (const c of p.columns) {
      if (!c || !text(c.id) || !text(c.title) || columns.has(c.id) || !Number.isFinite(c.order)) throw new Error('Invalid project columns.');
      columns.add(c.id);
    }
  }
  ids.clear();
  for (const t of data.tasks) {
    if (!t || !text(t.id) || !text(t.title) || ids.has(t.id) || !data.projects.some(p => p.id === t.projectId && p.columns.some(c => c.id === t.columnId)) ||
      !['P0', 'P1', 'P2', 'P3', 'P4'].includes(t.priority) || !Array.isArray(t.assignees) || !t.assignees.every(a => a && text(a.username))) throw new Error('Invalid task data.');
    if (t.reviewers !== undefined && (!Array.isArray(t.reviewers) || !t.reviewers.every(a => a && text(a.username)))) throw new Error('Invalid reviewers.');
    ids.add(t.id);
  }
  return structuredClone({ projects: data.projects, tasks: data.tasks });
}
