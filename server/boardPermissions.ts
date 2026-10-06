import type { BoardData } from '../src/lib/boardSync.js';
import { sameData } from '../src/lib/boardSync.js';
import { canUserAccessProject, canUserManageProject, type UserAccessInfo } from '../src/lib/projectAccess.js';

export function visibleBoard(board: BoardData, user: UserAccessInfo): BoardData {
  const projects = board.projects.filter(p => canUserAccessProject(p, user));
  return { projects, tasks: board.tasks.filter(t => projects.some(p => p.id === t.projectId)) };
}
export function authorizeChanges(current: BoardData, next: BoardData, user: UserAccessInfo): void {
  for (const id of new Set([...current.projects, ...next.projects].map(p => p.id))) {
    const before = current.projects.find(p => p.id === id), after = next.projects.find(p => p.id === id);
    if (sameData(before, after)) continue;
    if (before ? !canUserManageProject(before, user) : after?.owner?.toLowerCase() !== user.username?.toLowerCase() && user.role !== 'super-admin') {
      throw new Error('You cannot change this project or its access settings.');
    }
  }
  for (const id of new Set([...current.tasks, ...next.tasks].map(t => t.id))) {
    const before = current.tasks.find(t => t.id === id), after = next.tasks.find(t => t.id === id);
    if (sameData(before, after)) continue;
    for (const task of [before, after]) {
      if (!task) continue;
      const project = current.projects.find(p => p.id === task.projectId) || next.projects.find(p => p.id === task.projectId);
      if (!project || !canUserAccessProject(project, user)) throw new Error('You cannot change tasks in this project.');
    }
  }
}
