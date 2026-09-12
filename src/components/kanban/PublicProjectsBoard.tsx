import { useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, KeyboardSensor, useSensor, useSensors, useDroppable, closestCorners, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import type { Project, Task } from '@/types';
import { getFilteredTasks, useBoardStore } from '@/store/boardStore';
import { buildPublicBoard, getPublicProjects, resolvePublicBoardColumn, type PublicBoardColumn } from '@/lib/publicBoard';
import { BoardFilters } from './BoardFilters';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';

function PublicColumn({ column, projects, onEdit, onOpenProject }: {
  column: PublicBoardColumn;
  projects: Project[];
  onEdit: (task: Task) => void;
  onOpenProject: (projectId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <section ref={setNodeRef} className={`flex flex-col shrink-0 w-80 sm:w-84 rounded-xl border bg-card/75 shadow-xs ${isOver ? 'border-primary' : 'border-border/70'}`}>
      <div className="flex items-center gap-2 px-3.5 py-3 border-b border-border/50">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: column.color || '#64748b' }} />
        <h2 className="font-semibold text-sm">{column.title}</h2>
        <span className="rounded-full bg-muted px-2 text-xs text-muted-foreground">{column.tasks.length}</span>
      </div>
      <div className="space-y-3 p-2.5 min-h-[300px] max-h-[calc(100vh-250px)] overflow-y-auto">
        <SortableContext items={column.tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => {
            const project = projects.find((candidate) => candidate.id === task.projectId)!;
            return (
              <div key={task.id}>
                <button type="button" onClick={() => onOpenProject(project.id)} className="mb-1 px-1 text-xs font-medium text-primary hover:underline" title={`Open ${project.name} board`}>
                  {project.name}
                </button>
                <TaskCard task={task} projectColumns={project.columns} repoOwner={project.repoOwner} repoName={project.repoName} onEdit={onEdit} />
              </div>
            );
          })}
        </SortableContext>
        {column.tasks.length === 0 && <p className="p-6 text-center text-xs text-muted-foreground">No tasks</p>}
      </div>
    </section>
  );
}

export function PublicProjectsBoard({ onOpenProject }: { onOpenProject: (projectId: string) => void }) {
  const { projects, tasks, filter, moveTask } = useBoardStore();
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const publicProjects = getPublicProjects(projects);
  const publicIds = new Set(publicProjects.map((project) => project.id));
  const publicTasks = tasks.filter((task) => publicIds.has(task.projectId));
  const filteredTasks = publicProjects.flatMap((project) => getFilteredTasks(publicTasks, project.id, filter));
  const columns = buildPublicBoard(publicProjects, filteredTasks);
  const editingTask = publicTasks.find((task) => task.id === editingTaskId);
  const editingProject = publicProjects.find((project) => project.id === editingTask?.projectId);
  const draggingTask = publicTasks.find((task) => task.id === draggingTaskId);
  const draggingProject = publicProjects.find((project) => project.id === draggingTask?.projectId);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setDraggingTaskId(null);
    if (!over || active.id === over.id) return;
    const task = publicTasks.find((candidate) => candidate.id === active.id);
    const destination = columns.find((column) => column.id === over.id || column.tasks.some((candidate) => candidate.id === over.id));
    if (!task || !destination) return;
    const targetColumnId = resolvePublicBoardColumn(publicProjects, task, destination.id);
    if (!targetColumnId) {
      toast.info(`This task's project has no ${destination.title} column. Use the card menu to choose one of its columns.`);
      return;
    }
    const targetTasks = tasks.filter((candidate) => candidate.id !== task.id && candidate.projectId === task.projectId && candidate.columnId === targetColumnId);
    const targetIndex = targetTasks.findIndex((candidate) => candidate.id === over.id);
    moveTask(task.id, targetColumnId, targetIndex < 0 ? targetTasks.length : targetIndex);
  };

  return (
    <>
      <div className="px-4 sm:px-6 py-5 border-b border-border/70">
        <h1 className="text-xl font-bold">All public projects</h1>
        <p className="mt-1 text-sm text-muted-foreground">{publicProjects.length} projects · {publicTasks.length} tasks · {filteredTasks.length} shown</p>
      </div>
      <BoardFilters tasks={publicTasks} />
      <main className="flex-1 min-w-0 bg-background/40">
        {publicTasks.length === 0 || filteredTasks.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">
            {publicProjects.length === 0 ? 'No public projects yet. Create or import a public project to see its tasks here.' : publicTasks.length === 0 ? 'No tasks in public projects yet.' : 'No tasks match your filters.'}
          </p>
        ) : null}
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={({ active }) => setDraggingTaskId(String(active.id))} onDragCancel={() => setDraggingTaskId(null)} onDragEnd={handleDragEnd}>
          <div className="overflow-x-auto p-4 sm:p-6">
            <div className="flex items-start gap-4 min-w-max pb-4">
              {columns.map((column) => <PublicColumn key={column.id} column={column} projects={publicProjects} onEdit={(task) => setEditingTaskId(task.id)} onOpenProject={onOpenProject} />)}
            </div>
          </div>
          <DragOverlay dropAnimation={null}>
            {draggingTask && draggingProject ? <TaskCard task={draggingTask} projectColumns={draggingProject.columns} repoOwner={draggingProject.repoOwner} repoName={draggingProject.repoName} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </main>
      {editingTask && editingProject && (
        <TaskModal key={editingTask.id} open onOpenChange={(open) => { if (!open) setEditingTaskId(null); }} projectId={editingProject.id} columns={editingProject.columns} taskToEdit={editingTask} defaultBranch={editingProject.activeBranch || editingProject.defaultBranch} />
      )}
    </>
  );
}
