import type { Assignee, Project, Task, TaskActivity } from '@/types';

export function makeTaskActivity(action: string, actor: Assignee | undefined, before: Task | undefined, after: Task | undefined, projects: Project[]): TaskActivity {
  const ignored = new Set(['id', 'activity', 'updatedAt', 'createdAt']);
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  const value = (task: Task | undefined, key: string): string => {
    if (!task) return '—';
    const raw = task[key as keyof Task];
    if (raw === undefined) return '—';
    if (key === 'columnId') return projects.find((p) => p.id === task.projectId)?.columns.find((c) => c.id === raw)?.title || String(raw);
    if (key === 'assignees') return task.assignees.map((person) => `@${person.username}`).join(', ') || 'Unassigned';
    return typeof raw === 'string' ? raw : JSON.stringify(raw);
  };
  return {
    id: `activity-${crypto.randomUUID()}`,
    actor: actor ? { username: actor.username, name: actor.name, avatarUrl: actor.avatarUrl } : undefined,
    at: new Date().toISOString(),
    action,
    changes: [...keys].filter((key) => !ignored.has(key) && JSON.stringify(before?.[key as keyof Task]) !== JSON.stringify(after?.[key as keyof Task]))
      .map((field) => ({ field, before: value(before, field), after: value(after, field) })),
  };
}
