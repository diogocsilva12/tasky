import { isDoneColumn } from './taskMetrics';
import type { Project, Task } from '../types';
import { canUserAccessProject, type UserAccessInfo } from './projectAccess';

export type InboxKind = 'assigned' | 'mention' | 'due' | 'review';
export interface InboxItem {
  id: string; version: string; kind: InboxKind; task: Task; project: Project;
  detail: string; at: string; overdue?: boolean;
}
export type InboxReadState = Record<string, string>;
const hash = (text: string) => { let value = 2166136261; for (const char of text) value = Math.imul(value ^ char.charCodeAt(0), 16777619); return (value >>> 0).toString(36); };
const member = (people: { username: string }[] | undefined, username: string) => Boolean(people?.some(p => p.username.toLowerCase() === username));
const closed = (title: string) => /(^|\b)(done|closed|finished|shipped|conclu[ií]do|terminado)(\b|$)/i.test(title);
export const isReviewStage = (title: string) => /(^|\b)(review|qa|revis[aã]o|approval)(\b|$)/i.test(title);
export function mentionsUser(text: string, username: string): boolean {
  return [...text.matchAll(/(?:^|[^a-z0-9_@])@([a-z0-9][a-z0-9-]*)(?![a-z0-9_-])/gi)].some(match => match[1].toLowerCase() === username.toLowerCase());
}
function latestChange(task: Task, fields: string[]): string {
  return [...(task.activity || [])].reverse().find(a => a.changes.some(c => fields.includes(c.field)))?.at || task.createdAt;
}
export function buildPersonalInbox(projects: Project[], tasks: Task[], user: UserAccessInfo | null, now = new Date()): InboxItem[] {
  if (!user?.username) return [];
  const username = user.username.toLowerCase();
  const accessible = new Map(projects.filter(p => canUserAccessProject(p, user)).map(p => [p.id, p]));
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const soon = new Date(today); soon.setDate(soon.getDate() + 7);
  const items: InboxItem[] = [];
  for (const task of tasks) {
    const project = accessible.get(task.projectId); if (!project) continue;
    const column = project.columns.find(c => c.id === task.columnId);
    const done = Boolean(task.completedAt) || isDoneColumn(column?.title || task.columnId) || closed(column?.title || '');
    const assigned = member(task.assignees, username), reviewer = member(task.reviewers, username);
    const add = (kind: InboxKind, detail: string, at: string, extra = '', overdue = false) => {
      items.push({ id: `${kind}:${task.id}${extra ? ':' + extra : ''}`, version: hash(`${at}:${detail}`), kind, task, project, detail, at, overdue });
    };
    if (!done && assigned) add('assigned', 'Assigned to you', latestChange(task, ['assignees', 'columnId']));
    if (!done && isReviewStage(column?.title || '') && (reviewer || (!task.reviewers?.length && assigned))) {
      add('review', task.reviewers?.length ? 'Your review was requested' : 'Assigned to you in a review stage', latestChange(task, ['reviewers', 'columnId']));
    }
    if (!done && (assigned || reviewer) && task.dueDate) {
      const day = task.dueDate.slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(day)) {
        const due = new Date(`${day}T00:00:00`);
        if (Number.isFinite(due.getTime()) && due.getFullYear() === Number(day.slice(0, 4)) && due.getMonth() + 1 === Number(day.slice(5, 7)) && due.getDate() === Number(day.slice(8, 10)) && due <= soon) add('due', `${due < today ? 'Overdue' : due.getTime() === today.getTime() ? 'Due today' : 'Due soon'} · ${day}`, `${day}T00:00:00`, '', due < today);
      }
    }
    if (task.creator?.username.toLowerCase() !== username && mentionsUser(task.description || '', username)) add('mention', 'You were mentioned in the task description', latestChange(task, ['description']), `description-${hash(task.description || '')}`);
    for (const comment of task.comments || []) {
      if (comment.author.toLowerCase() !== username && mentionsUser(comment.content, username)) add('mention', `@${comment.author}: ${comment.content}`, comment.createdAt, `comment-${comment.id}-${hash(comment.content)}`);
    }
  }
  const order: Record<InboxKind, number> = { due: 0, review: 1, mention: 2, assigned: 3 };
  return items.sort((a, b) => Number(Boolean(b.overdue)) - Number(Boolean(a.overdue)) || order[a.kind] - order[b.kind] ||
    (a.kind === 'due' && b.kind === 'due' ? Date.parse(a.at) - Date.parse(b.at) : (Date.parse(b.at) || 0) - (Date.parse(a.at) || 0)) || a.id.localeCompare(b.id));
}
export function inboxStorageKey(username: string, demo = false) { return `tasky_inbox_v1:${demo ? 'demo' : 'github'}:${username.toLowerCase()}`; }
export function loadInboxReadState(key: string): InboxReadState {
  try { const data = JSON.parse(localStorage.getItem(key) || '{}'); return data && !Array.isArray(data) && typeof data === 'object' ? Object.fromEntries(Object.entries(data).filter(([, v]) => typeof v === 'string')) as InboxReadState : {}; }
  catch { return {}; }
}
export function saveInboxReadState(key: string, data: InboxReadState) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* Read state remains usable for this tab. */ }
}
