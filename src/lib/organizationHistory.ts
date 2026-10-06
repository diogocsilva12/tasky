import type { Assignee, Column, Project, Task } from '../types/index.js';

export interface OrganizationSnapshot {
  owner: string | null;
  deadline: string | null;
  startDate: string | null;
  visibility: 'public' | 'private';
  allowedUsers: string[];
  columns: Pick<Column, 'id' | 'title' | 'order' | 'wipLimit'>[];
}
export interface OrganizationEvent {
  id: string;
  at: string;
  actor?: Assignee;
  before: OrganizationSnapshot | null;
  after: OrganizationSnapshot;
}
export function organizationSnapshot(project: Project): OrganizationSnapshot {
  return {
    owner: project.owner || null, deadline: project.deadline || null, startDate: project.startDate || null,
    visibility: project.visibility || 'public', allowedUsers: [...(project.allowedUsers || [])].sort(),
    columns: project.columns.map(c => ({ id: c.id, title: c.title, order: c.order, ...(c.wipLimit !== undefined ? { wipLimit: c.wipLimit } : {}) })),
  };
}
export function recordOrganizationChange(before: Project | undefined, after: Project, actor?: Assignee): Project {
  const old = before ? organizationSnapshot(before) : null;
  const next = organizationSnapshot(after);
  if (JSON.stringify(old) === JSON.stringify(next)) return after;
  return { ...after, organizationHistory: [...(before?.organizationHistory || []), {
    id: `organization-${crypto.randomUUID()}`, at: new Date().toISOString(),
    ...(actor ? { actor: { ...actor } } : {}), before: old, after: next,
  }] };
}
export function organizationChanges(event: OrganizationEvent): { field: string; before: string; after: string }[] {
  const { before, after } = event;
  const changes: { field: string; before: string; after: string }[] = [];
  if (!before) return [{ field: 'Project created', before: '—', after: `${after.columns.length} workflow columns; owner ${after.owner || 'unassigned'}` }];
  const fields = [['owner', 'Project owner'], ['deadline', 'Project deadline'], ['startDate', 'Project start'], ['visibility', 'Visibility'], ['allowedUsers', 'Project members']] as const;
  for (const [key, label] of fields) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) changes.push({ field: label, before: Array.isArray(before[key]) ? before[key].join(', ') || 'None' : String(before[key] || 'Not set'), after: Array.isArray(after[key]) ? after[key].join(', ') || 'None' : String(after[key] || 'Not set') });
  }
  for (const id of new Set([...before.columns, ...after.columns].map(c => c.id))) {
    const old = before.columns.find(c => c.id === id), next = after.columns.find(c => c.id === id);
    if (!old || !next) { changes.push({ field: next ? 'Column added' : 'Column removed', before: old?.title || '—', after: next?.title || '—' }); continue; }
    if (old.title !== next.title) changes.push({ field: 'Column renamed', before: old.title, after: next.title });
    if (old.wipLimit !== next.wipLimit) changes.push({ field: `WIP limit · ${next.title}`, before: String(old.wipLimit || 'Unlimited'), after: String(next.wipLimit || 'Unlimited') });
  }
  const common = before.columns.filter(c => after.columns.some(n => n.id === c.id)).map(c => c.id);
  const reordered = after.columns.filter(c => common.includes(c.id)).map(c => c.id);
  if (JSON.stringify(common) !== JSON.stringify(reordered)) changes.push({ field: 'Column order', before: before.columns.map(c => c.title).join(' → '), after: after.columns.map(c => c.title).join(' → ') });
  return changes;
}
export function validOrganizationHistory(value: unknown): value is OrganizationEvent[] {
  if (!Array.isArray(value)) return false;
  const snapshot = (s: OrganizationSnapshot | null) => Boolean(s && (s.owner === null || typeof s.owner === 'string') &&
    (s.deadline === null || typeof s.deadline === 'string') && (s.startDate === null || typeof s.startDate === 'string') &&
    ['public', 'private'].includes(s.visibility) && Array.isArray(s.allowedUsers) && s.allowedUsers.every(u => typeof u === 'string') &&
    Array.isArray(s.columns) && s.columns.every(c => c && typeof c.id === 'string' && typeof c.title === 'string' && Number.isFinite(c.order) && (c.wipLimit === undefined || Number.isFinite(c.wipLimit))));
  const ids = new Set<string>();
  return value.every(e => {
    if (!e || typeof e.id !== 'string' || ids.has(e.id) || typeof e.at !== 'string' || !Number.isFinite(Date.parse(e.at)) || (e.actor && typeof e.actor.username !== 'string') || (e.before !== null && !snapshot(e.before)) || !snapshot(e.after)) return false;
    ids.add(e.id); return true;
  });
}
export function taskOrganizationChanges(tasks: Task[]) {
  return tasks.flatMap(task => (task.activity || []).flatMap(event => {
    const changes = event.changes.filter(c => ['assignees', 'reviewers', 'dueDate', 'projectId'].includes(c.field));
    return changes.length ? [{ ...event, taskId: task.id, taskTitle: task.title, changes }] : [];
  }));
}
