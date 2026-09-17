import type { Assignee, Project } from '../types';
import { canUserAccessProject } from './projectAccess';

export function parseAssigneeNames(value: string): string[] {
  const seen = new Set<string>();
  return value.split(',').map(name => name.trim().replace(/^@/, '')).filter(name => {
    if (!name || seen.has(name.toLowerCase())) return false;
    seen.add(name.toLowerCase()); return true;
  });
}
export function toggleAssignee(value: string, username: string): string {
  const selected = parseAssigneeNames(value);
  return (selected.some(name => name.toLowerCase() === username.toLowerCase())
    ? selected.filter(name => name.toLowerCase() !== username.toLowerCase())
    : [...selected, username]).join(', ');
}
export function projectMembers(project: Project | undefined, members: (Assignee & { role?: string })[]): Assignee[] {
  if (!project) return [];
  const seen = new Set<string>();
  return members.filter(member => {
    const key = member.username.toLowerCase();
    if (seen.has(key) || !canUserAccessProject(project, member)) return false;
    seen.add(key); return true;
  }).sort((a, b) => a.username.localeCompare(b.username));
}
