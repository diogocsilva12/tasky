import type { Project, Task } from '../types/index.js';

export interface ProjectRetrospective {
  recordedAt: string;
  recordedBy: string;
  outcome: 'success' | 'partial' | 'unsuccessful';
  notes: string;
  organization: { wipLimits: boolean; reviewStage: boolean; explicitOwners: boolean; plannedDates: boolean };
  metrics: { total: number; completed: number; blocked: number; onTime: number; datedCompletions: number };
}
export const PRACTICES = [
  { key: 'wipLimits', label: 'Limits on work in progress' },
  { key: 'reviewStage', label: 'A dedicated review stage' },
  { key: 'explicitOwners', label: 'An owner assigned to every task' },
  { key: 'plannedDates', label: 'Due dates on most tasks' },
] as const;

export function captureRetrospective(project: Project, allTasks: Task[], outcome: ProjectRetrospective['outcome'], notes: string, username: string, now = new Date()): ProjectRetrospective {
  const tasks = allTasks.filter(t => t.projectId === project.id);
  const done = new Set(project.columns.filter(c => /done|closed|finished|shipped|conclu[ií]d|terminad/i.test(c.title)).map(c => c.id));
  const completed = tasks.filter(t => done.has(t.columnId));
  const dated = completed.filter(t => t.dueDate && t.completedAt && Number.isFinite(Date.parse(t.dueDate)) && Number.isFinite(Date.parse(t.completedAt)));
  return {
    recordedAt: now.toISOString(), recordedBy: username, outcome, notes: notes.trim(),
    organization: {
      wipLimits: project.columns.some(c => typeof c.wipLimit === 'number' && c.wipLimit > 0),
      reviewStage: project.columns.some(c => /review|revis[aã]o|qa|quality/i.test(c.title)),
      explicitOwners: tasks.length > 0 && tasks.every(t => t.assignees.length > 0),
      plannedDates: tasks.length > 0 && tasks.filter(t => t.dueDate).length / tasks.length >= 0.8,
    },
    metrics: { total: tasks.length, completed: completed.length, blocked: tasks.filter(t => t.isBlocked).length,
      datedCompletions: dated.length,
      onTime: dated.filter(t => t.completedAt!.slice(0, 10) <= t.dueDate!.slice(0, 10)).length },
  };
}
export function isRetrospective(value: unknown): value is ProjectRetrospective {
  const r = value as ProjectRetrospective | null;
  return Boolean(r && ['success', 'partial', 'unsuccessful'].includes(r.outcome) && typeof r.notes === 'string' && r.notes.length <= 5000 &&
    typeof r.recordedBy === 'string' && typeof r.recordedAt === 'string' && Number.isFinite(Date.parse(r.recordedAt)) &&
    r.organization && PRACTICES.every(p => typeof r.organization[p.key] === 'boolean') && r.metrics &&
    ['total', 'completed', 'blocked', 'onTime', 'datedCompletions'].every(key => Number.isInteger(r.metrics[key as keyof typeof r.metrics]) && r.metrics[key as keyof typeof r.metrics] >= 0) &&
    r.metrics.completed <= r.metrics.total && r.metrics.blocked <= r.metrics.total && r.metrics.onTime <= r.metrics.datedCompletions && r.metrics.datedCompletions <= r.metrics.completed);
}

// A small supervised model: each reviewed project supplies an explicit success label.
// Beta(1,1) smoothing avoids claiming certainty from a handful of examples.
export function learnOrganization(projects: Project[]) {
  const records = [...new Map(projects.map(p => [p.id, p.retrospective])).values()].filter(isRetrospective);
  const patterns = PRACTICES.flatMap(practice => {
    const withPractice = records.filter(r => r.organization[practice.key]);
    const without = records.filter(r => !r.organization[practice.key]);
    if (withPractice.length < 3 || without.length < 3) return [];
    const successes = (rows: ProjectRetrospective[]) => rows.filter(r => r.outcome === 'success').length;
    const estimate = (rows: ProjectRetrospective[]) => (successes(rows) + 1) / (rows.length + 2);
    return [{ ...practice, withCount: withPractice.length, withoutCount: without.length, withSuccesses: successes(withPractice), withoutSuccesses: successes(without), difference: estimate(withPractice) - estimate(without) }];
  }).sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
  return { reviewed: records.length, patterns };
}
