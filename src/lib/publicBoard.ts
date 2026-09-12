import type { Project, Task } from '@/types';

export interface PublicBoardColumn {
  id: string;
  title: string;
  color?: string;
  tasks: Task[];
}

const STATUS_GROUPS = [
  { title: 'Backlog', aliases: ['backlog'], color: '#64748b' },
  { title: 'To Do', aliases: ['to do', 'todo', 'ready', 'not started'], color: '#3b82f6' },
  { title: 'In Progress', aliases: ['in progress', 'in development', 'development', 'doing', 'in dev'], color: '#6366f1' },
  { title: 'Review', aliases: ['review', 'in review', 'code review', 'qa', 'qa & review', 'qa and review', 'testing'], color: '#f59e0b' },
  { title: 'Done', aliases: ['done', 'shipped', 'finished', 'complete', 'completed', 'closed'], color: '#10b981' },
];
const normalizeTitle = (title: string) => title.trim().toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ');

function groupedColumn(title: string) {
  const normalized = normalizeTitle(title);
  const order = STATUS_GROUPS.findIndex((group) => group.aliases.includes(normalized));
  const group = STATUS_GROUPS[order];
  return group
    ? { id: `public-status:${order}`, title: group.title, color: group.color, order }
    : { id: `public-column:${normalized}`, title: title.trim(), order: STATUS_GROUPS.length };
}

// null selects all, while an empty list explicitly selects none.
export function getPublicProjects(projects: Project[], selectedIds: readonly string[] | null = null): Project[] {
  return projects.filter((project) =>
    (!project.visibility || project.visibility === 'public') &&
    (selectedIds === null || selectedIds.includes(project.id))
  );
}

export function buildPublicBoard(projects: Project[], tasks: Task[]): PublicBoardColumn[] {
  const publicProjects = getPublicProjects(projects);
  const projectsById = new Map(publicProjects.map((project) => [project.id, project]));
  const columns = new Map<string, PublicBoardColumn>();
  for (const project of publicProjects) {
    for (const column of [...project.columns].sort((a, b) => a.order - b.order)) {
      const group = groupedColumn(column.title);
      const id = group.id;
      if (!columns.has(id)) {
        columns.set(id, { id, title: group.title, color: group.color || column.color, tasks: [] });
      }
    }
  }
  for (const task of tasks) {
    const project = projectsById.get(task.projectId);
    if (!project) continue;
    const sourceColumn = project.columns.find((column) => column.id === task.columnId);
    const id = sourceColumn ? groupedColumn(sourceColumn.title).id : 'public-unassigned';
    if (!columns.has(id)) columns.set(id, { id, title: 'Unassigned', tasks: [] });
    columns.get(id)!.tasks.push(task);
  }
  return [...columns.values()].sort((a, b) => {
    const rank = (column: PublicBoardColumn) => column.id === 'public-unassigned'
      ? STATUS_GROUPS.length + 1 : groupedColumn(column.title).order;
    return rank(a) - rank(b);
  });
}

/** Resolve a combined-board destination without moving tasks between projects. */
export function resolvePublicBoardColumn(projects: Project[], task: Task, destinationId: string): string | undefined {
  const project = getPublicProjects(projects).find((candidate) => candidate.id === task.projectId);
  const matches = project?.columns.filter((column) => groupedColumn(column.title).id === destinationId) || [];
  // Reordering within a shared status must preserve the task's original stage.
  const current = matches.find((column) => column.id === task.columnId);
  if (current) return current.id;
  // Multiple source stages require an explicit choice in the task's menu.
  return matches.length === 1 ? matches[0].id : undefined;
}
