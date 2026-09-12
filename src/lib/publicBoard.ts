import type { Project, Task } from '@/types';

export interface PublicBoardColumn {
  id: string;
  title: string;
  color?: string;
  tasks: Task[];
}

const columnKey = (title: string) => `public-column:${title.trim().toLowerCase()}`;

export function getPublicProjects(projects: Project[]): Project[] {
  return projects.filter((project) => !project.visibility || project.visibility === 'public');
}

export function buildPublicBoard(projects: Project[], tasks: Task[]): PublicBoardColumn[] {
  const publicProjects = getPublicProjects(projects);
  const projectsById = new Map(publicProjects.map((project) => [project.id, project]));
  const columns = new Map<string, PublicBoardColumn>();
  for (const project of publicProjects) {
    for (const column of [...project.columns].sort((a, b) => a.order - b.order)) {
      const id = columnKey(column.title);
      if (!columns.has(id)) {
        columns.set(id, { id, title: column.title.trim(), color: column.color, tasks: [] });
      }
    }
  }
  for (const task of tasks) {
    const project = projectsById.get(task.projectId);
    if (!project) continue;
    const sourceColumn = project.columns.find((column) => column.id === task.columnId);
    const id = sourceColumn ? columnKey(sourceColumn.title) : 'public-unassigned';
    if (!columns.has(id)) columns.set(id, { id, title: 'Unassigned', tasks: [] });
    columns.get(id)!.tasks.push(task);
  }
  return [...columns.values()];
}

/** Resolve a combined-board destination without moving tasks between projects. */
export function resolvePublicBoardColumn(projects: Project[], task: Task, destinationId: string): string | undefined {
  const project = getPublicProjects(projects).find((candidate) => candidate.id === task.projectId);
  return project?.columns.find((column) => columnKey(column.title) === destinationId)?.id;
}
