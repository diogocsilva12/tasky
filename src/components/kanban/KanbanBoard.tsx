import { useState, useMemo, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { useBoardStore } from '@/store/boardStore';
import type { Column, Task } from '@/types';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { ColumnModal } from './ColumnModal';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface KanbanBoardProps {
  taskModalOpen: boolean;
  setTaskModalOpen: (open: boolean) => void;
  columnModalOpen: boolean;
  setColumnModalOpen: (open: boolean) => void;
  selectedTask?: Task | null;
  onClearSelectedTask?: () => void;
}

export function KanbanBoard({
  taskModalOpen,
  setTaskModalOpen,
  columnModalOpen,
  setColumnModalOpen,
  selectedTask,
  onClearSelectedTask,
}: KanbanBoardProps) {
  const {
    activeProject,
    filteredTasks,
    reorderColumns,
    moveTask,
  } = useBoardStore();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);

  // Modals state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedColumnIdForNewTask, setSelectedColumnIdForNewTask] = useState<string | undefined>();
  const [editingColumn, setEditingColumn] = useState<Column | null>(null);

  useEffect(() => {
    if (selectedTask) {
      setEditingTask(selectedTask);
      setTaskModalOpen(true);
    }
  }, [selectedTask, setTaskModalOpen]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6, // 6px threshold avoids accidental drags when clicking links/buttons
      },
    }),
    useSensor(KeyboardSensor)
  );

  const columns = useMemo(() => {
    if (!activeProject) return [];
    return [...activeProject.columns].sort((a, b) => a.order - b.order);
  }, [activeProject]);

  const columnIds = useMemo(() => columns.map((c) => c.id), [columns]);

  // Map tasks by columnId
  const tasksByColumn = useMemo(() => {
    const map = new Map<string, Task[]>();
    columns.forEach((c) => map.set(c.id, []));

    filteredTasks.forEach((task) => {
      const list = map.get(task.columnId);
      if (list) {
        list.push(task);
      } else {
        // If task belongs to deleted or missing column, group in first column
        const first = map.get(columns[0]?.id);
        if (first) first.push(task);
      }
    });

    return map;
  }, [columns, filteredTasks]);

  // Drag and Drop Event Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;

    if (activeData?.type === 'Column') {
      setActiveColumn(activeData.column as Column);
      setActiveTask(null);
    } else if (activeData?.type === 'Task') {
      setActiveTask(activeData.task as Task);
      setActiveColumn(null);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Moving tasks between different columns during drag
    if (activeData?.type === 'Task') {
      const draggedTask = activeData.task as Task;
      const overId = over.id as string;

      let targetColumnId: string | null = null;

      if (overData?.type === 'Column') {
        targetColumnId = overId;
      } else if (overData?.type === 'Task') {
        targetColumnId = (overData.task as Task).columnId;
      }

      if (targetColumnId && draggedTask.columnId !== targetColumnId) {
        const columnTasks = tasksByColumn.get(targetColumnId) || [];
        let targetIndex = columnTasks.length;
        if (overData?.type === 'Task') {
          const index = columnTasks.findIndex((t) => t.id === overId);
          if (index !== -1) targetIndex = index;
        }

        moveTask(draggedTask.id, targetColumnId, targetIndex);
        draggedTask.columnId = targetColumnId;
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveColumn(null);
    setActiveTask(null);

    if (!over || !activeProject) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Handling Column reorder
    if (activeData?.type === 'Column') {
      if (active.id !== over.id) {
        const oldIndex = columns.findIndex((c) => c.id === active.id);
        const newIndex = columns.findIndex((c) => c.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(columns, oldIndex, newIndex);
          reorderColumns(activeProject.id, reordered.map((c) => c.id));
        }
      }
      return;
    }

    // Handling Task drop
    if (activeData?.type === 'Task') {
      const activeId = active.id as string;
      const overId = over.id as string;

      if (overData?.type === 'Task') {
        const overTask = overData.task as Task;
        const targetColumnId = overTask.columnId;
        const tasksInColumn = tasksByColumn.get(targetColumnId) || [];
        const targetIndex = tasksInColumn.findIndex((t) => t.id === overId);

        moveTask(activeId, targetColumnId, targetIndex >= 0 ? targetIndex : 0);
      } else if (overData?.type === 'Column') {
        const targetColumnId = overId;
        const tasksInColumn = tasksByColumn.get(targetColumnId) || [];
        moveTask(activeId, targetColumnId, tasksInColumn.length);
      }
    }
  };

  // Quick action triggers
  const handleOpenAddTask = (columnId?: string) => {
    setSelectedColumnIdForNewTask(columnId);
    setEditingTask(null);
    setTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  const handleEditColumn = (column: Column) => {
    setEditingColumn(column);
    setColumnModalOpen(true);
  };

  if (!activeProject) {
    return (
      <div className="flex flex-1 items-center justify-center p-12 text-center text-muted-foreground">
        <p>No project selected. Create or select a project to view the Kanban board.</p>
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto p-4 sm:p-6">
          <div className="flex items-start gap-4 pb-4 min-w-max">
            {/* Columns Sortable Context */}
            <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  tasks={tasksByColumn.get(column.id) || []}
                  allColumns={columns}
                  repoOwner={activeProject.repoOwner}
                  repoName={activeProject.repoName}
                  onAddTask={handleOpenAddTask}
                  onEditTask={handleEditTask}
                  onEditColumn={handleEditColumn}
                />
              ))}
            </SortableContext>

            {/* Add Column Button Card */}
            <div className="flex flex-col flex-shrink-0 w-72 sm:w-80">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingColumn(null);
                  setColumnModalOpen(true);
                }}
                className="h-14 border-dashed border-border/80 hover:border-primary/50 hover:bg-accent/40 rounded-xl gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all shadow-none"
              >
                <Plus className="h-4 w-4" />
                <span>Add Column</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Drag Overlay for smooth preview */}
        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <TaskCard
              task={activeTask}
              projectColumns={columns}
              repoOwner={activeProject.repoOwner}
              repoName={activeProject.repoName}
              isOverlay
            />
          ) : null}

          {activeColumn ? (
            <KanbanColumn
              column={activeColumn}
              tasks={tasksByColumn.get(activeColumn.id) || []}
              allColumns={columns}
              repoOwner={activeProject.repoOwner}
              repoName={activeProject.repoName}
              onAddTask={() => {}}
              onEditTask={() => {}}
              onEditColumn={() => {}}
              isOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Task Dialog */}
      <TaskModal
        open={taskModalOpen}
        onOpenChange={(open) => {
          setTaskModalOpen(open);
          if (!open) {
            setEditingTask(null);
            setSelectedColumnIdForNewTask(undefined);
            onClearSelectedTask?.();
          }
        }}
        projectId={activeProject.id}
        columns={columns}
        taskToEdit={editingTask}
        defaultColumnId={selectedColumnIdForNewTask}
        defaultBranch={activeProject.activeBranch || activeProject.defaultBranch}
      />

      {/* Column Dialog */}
      <ColumnModal
        open={columnModalOpen}
        onOpenChange={setColumnModalOpen}
        projectId={activeProject.id}
        columnToEdit={editingColumn}
      />
    </>
  );
}
