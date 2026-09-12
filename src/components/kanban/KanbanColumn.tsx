import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Column, Task } from '@/types';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { boardStore } from '@/store/boardStore';
import {
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  GripVertical,
} from 'lucide-react';

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  allColumns: Column[];
  repoOwner?: string;
  repoName?: string;
  onAddTask: (columnId: string) => void;
  onEditTask: (task: Task) => void;
  onEditColumn: (column: Column) => void;
  isOverlay?: boolean;
}

export function KanbanColumn({
  column,
  tasks,
  allColumns,
  repoOwner,
  repoName,
  onAddTask,
  onEditTask,
  onEditColumn,
  isOverlay = false,
}: KanbanColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
    disabled: isOverlay,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (confirmDelete) {
      const activeProjId = boardStore.getState().activeProjectId;
      boardStore.deleteColumn(activeProjId, column.id);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
    }
  };

  const taskIds = tasks.map((t) => t.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col flex-shrink-0 w-80 sm:w-84 rounded-xl border bg-muted/20 pb-3 transition-colors ${
        isDragging
          ? 'opacity-30 border-primary/50'
          : isOverlay
          ? 'shadow-2xl ring-2 ring-primary bg-card z-50'
          : 'border-border/60'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-border/50 select-none">
        <div className="flex items-center gap-2 min-w-0">
          {/* Drag Handle for Column */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-0.5 text-muted-foreground/40 hover:text-muted-foreground touch-none"
            title="Drag column"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </div>

          {/* Color Accent Indicator */}
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs"
            style={{ backgroundColor: column.color || '#64748b' }}
          />

          {/* Column Title */}
          <h2 className="font-semibold text-xs sm:text-sm text-foreground truncate">
            {column.title}
          </h2>

          {/* Task Count Badge */}
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-mono font-medium text-muted-foreground">
            {tasks.length}
          </span>
        </div>

        {/* Action buttons: + Add Task, More Options */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onAddTask(column.id)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title="Add task to this column"
          >
            <Plus className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() => onEditColumn(column)}
                className="gap-2 text-xs cursor-pointer"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit Column</span>
              </DropdownMenuItem>

              {allColumns.length > 1 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="gap-2 text-xs text-destructive focus:text-destructive cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{confirmDelete ? 'Confirm Delete?' : 'Delete Column'}</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Task List (Droppable area) */}
      <div className="flex-1 px-2.5 py-2.5 space-y-2.5 min-h-[300px] overflow-y-auto max-h-[calc(100vh-250px)]">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              projectColumns={allColumns}
              repoOwner={repoOwner}
              repoName={repoName}
              onEdit={onEditTask}
            />
          ))}
        </SortableContext>

        {/* Empty state */}
        {tasks.length === 0 && (
          <div
            onClick={() => onAddTask(column.id)}
            className="flex flex-col items-center justify-center p-6 rounded-lg border border-dashed border-border/60 hover:border-primary/40 hover:bg-card/40 transition-colors cursor-pointer text-center text-muted-foreground"
          >
            <Plus className="h-5 w-5 mb-1.5 opacity-60" />
            <p className="text-xs font-medium">No tasks</p>
            <p className="text-[11px] text-muted-foreground/80 mt-0.5">
              Click to add or drop cards here
            </p>
          </div>
        )}
      </div>

      {/* Quick Add at bottom */}
      {tasks.length > 0 && (
        <div className="px-2.5 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddTask(column.id)}
            className="w-full justify-start h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5 border border-transparent hover:border-border/60"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add task</span>
          </Button>
        </div>
      )}
    </div>
  );
}
