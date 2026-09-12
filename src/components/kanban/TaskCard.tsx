import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, Priority, Column } from '@/types';
import { Badge } from '@/components/ui/badge';
import { getCleanRepoDetails } from '@/lib/githubUrl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { boardStore } from '@/store/boardStore';
import {
  GitBranch,
  ExternalLink,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowRight,
  GripVertical,
  Ban,
  AlertCircle,
  CheckSquare,
  Calendar,
  Tag,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  projectColumns?: Column[];
  repoOwner?: string;
  repoName?: string;
  onEdit?: (task: Task) => void;
  isOverlay?: boolean;
}

const PRIORITY_BADGES: Record<
  Priority,
  { label: string; badgeVariant: 'p0' | 'p1' | 'p2' | 'p3' | 'p4' }
> = {
  P0: { label: 'P0 Critical', badgeVariant: 'p0' },
  P1: { label: 'P1 High', badgeVariant: 'p1' },
  P2: { label: 'P2 Medium', badgeVariant: 'p2' },
  P3: { label: 'P3 Low', badgeVariant: 'p3' },
  P4: { label: 'P4 Trivial', badgeVariant: 'p4' },
};

export function TaskCard({
  task,
  projectColumns = [],
  repoOwner,
  repoName,
  onEdit,
  isOverlay = false,
}: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
    disabled: isOverlay,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const priorityInfo = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.P2;
  const repoDetails = getCleanRepoDetails({ repoOwner, repoName, githubUrl: task.githubUrl });
  const branchUrl = task.branchName ? repoDetails.branchUrl(task.branchName) : null;
  const issueUrl =
    task.githubIssueNumber !== undefined
      ? repoDetails.issueUrl(task.githubIssueNumber)
      : task.githubUrl || null;

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const totalSubtasks = subtasks.length;

  const isOverdue = task.dueDate
    ? new Date(task.dueDate + 'T23:59:59').getTime() < Date.now()
    : false;
  const isDueToday = task.dueDate
    ? new Date(task.dueDate + 'T23:59:59').toDateString() === new Date().toDateString()
    : false;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`group relative rounded-xl border p-3 shadow-xs transition-all backdrop-blur-md ${
          task.isBlocked
            ? 'border-red-500/40 bg-card/90 shadow-red-500/5'
            : 'border-border/70 bg-card/85'
        } ${
          isDragging
            ? 'opacity-30 border-primary/50'
            : isOverlay
            ? 'shadow-2xl ring-2 ring-primary/60 scale-[1.02] rotate-1 cursor-grabbing bg-card/95 z-50'
            : 'hover:border-primary/40 hover:shadow-md hover:bg-card/95'
        }`}
        onClick={() => onEdit?.(task)}
      >
        {/* Top row: Priority badge, Blocked badge, Story Points, Branch tag / Issue #, Dropdown */}
        <div className="flex items-center justify-between gap-1.5 pb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Priority Badge */}
            <Badge variant={priorityInfo.badgeVariant} className="text-[10px] px-2 py-0.5">
              {priorityInfo.label}
            </Badge>

            {/* Story Points */}
            {task.storyPoints !== undefined && (
              <span
                className="inline-flex items-center text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border border-primary/30 bg-primary/10 text-primary"
                title={`${task.storyPoints} Story Points`}
              >
                {task.storyPoints} pts
              </span>
            )}

            {/* Blocked Badge */}
            {task.isBlocked && (
              <Badge
                variant="destructive"
                className="text-[10px] px-1.5 py-0.5 gap-1 font-semibold bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30"
              >
                <Ban className="h-2.5 w-2.5" />
                <span>Blocked</span>
              </Badge>
            )}

            {/* GitHub Issue Link / Badge */}
            {task.githubIssueNumber !== undefined && (
              <span
                onClick={(e) => {
                  if (issueUrl) {
                    e.stopPropagation();
                    window.open(issueUrl, '_blank', 'noopener,noreferrer');
                  }
                }}
                className={`inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded border border-border/60 bg-muted/60 text-muted-foreground ${
                  issueUrl ? 'hover:text-foreground hover:border-border cursor-pointer' : ''
                }`}
                title={issueUrl ? `Open issue #${task.githubIssueNumber} on GitHub` : undefined}
              >
                #{task.githubIssueNumber}
                {issueUrl && <ExternalLink className="h-2.5 w-2.5 opacity-60 ml-0.5" />}
              </span>
            )}
          </div>

          {/* Card Options Dropdown & Drag handle */}
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-40 hover:opacity-100 group-hover:opacity-80 transition-opacity"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={() => onEdit?.(task)}
                  className="gap-2 text-xs cursor-pointer"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit Task</span>
                </DropdownMenuItem>

                {projectColumns.length > 1 && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="gap-2 text-xs">
                      <ArrowRight className="h-3.5 w-3.5" />
                      <span>Move to Column</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-40">
                      {projectColumns
                        .filter((c) => c.id !== task.columnId)
                        .map((col) => (
                          <DropdownMenuItem
                            key={col.id}
                            onClick={() => boardStore.moveTask(task.id, col.id)}
                            className="text-xs cursor-pointer gap-2"
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: col.color || '#64748b' }}
                            />
                            <span>{col.title}</span>
                          </DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="gap-2 text-xs text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Task</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground/50 hover:text-muted-foreground touch-none"
              title="Drag card"
            >
              <GripVertical className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>

        {/* Task Title */}
        <h3 className="text-xs sm:text-sm font-semibold text-foreground leading-snug line-clamp-2">
          {task.title}
        </h3>

        {/* Description Preview */}
        {task.description && (
          <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2 leading-normal">
            {task.description}
          </p>
        )}

        {/* Blocker Callout */}
        {task.isBlocked && task.blockerReason && (
          <div className="mt-2 flex items-start gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] text-red-600 dark:text-red-400 font-medium">
            <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
            <span className="line-clamp-2 leading-tight">{task.blockerReason}</span>
          </div>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {task.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-secondary/80 text-secondary-foreground border border-border/50"
              >
                <Tag className="h-2 w-2 opacity-60" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Subtasks Progress */}
        {totalSubtasks > 0 && (
          <div className="mt-2.5 space-y-1 rounded-md bg-muted/40 p-1.5 border border-border/40">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1 font-medium">
                <CheckSquare className="h-3 w-3 text-primary" />
                <span>Subtasks</span>
              </span>
              <span className="font-mono text-[9px] font-semibold">
                {completedSubtasks}/{totalSubtasks}
              </span>
            </div>
            <div className="w-full bg-secondary/80 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{
                  width: `${Math.round((completedSubtasks / totalSubtasks) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Bottom row: Branch Link, Due Date & Assignee Avatars */}
        <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-border/40">
          {/* Branch Link */}
          {task.branchName ? (
            <span
              onClick={(e) => {
                if (branchUrl) {
                  e.stopPropagation();
                  window.open(branchUrl, '_blank', 'noopener,noreferrer');
                }
              }}
              className={`inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground truncate max-w-[120px] ${
                branchUrl ? 'hover:text-primary cursor-pointer' : ''
              }`}
              title={task.branchName}
            >
              <GitBranch className="h-3 w-3 shrink-0 text-primary/70" />
              <span className="truncate">{task.branchName}</span>
            </span>
          ) : (
            <span />
          )}

          {/* Due Date Badge */}
          {task.dueDate && (
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0 ${
                isOverdue
                  ? 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 font-semibold'
                  : isDueToday
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold'
                  : 'bg-muted/70 text-muted-foreground border-border/50'
              }`}
              title={isOverdue ? 'Overdue' : isDueToday ? 'Due today' : `Due: ${task.dueDate}`}
            >
              <Calendar className="h-2.5 w-2.5" />
              <span>{task.dueDate}</span>
            </span>
          )}

          {/* Assignees Avatars */}
          {task.assignees.length > 0 && (
            <div className="flex -space-x-1.5 overflow-hidden items-center shrink-0">
              {task.assignees.slice(0, 3).map((assignee) => (
                <Avatar
                  key={assignee.username}
                  className="h-5 w-5 ring-1 ring-background border border-border"
                  title={`@${assignee.username} ${assignee.name ? `(${assignee.name})` : ''}`}
                >
                  <AvatarImage src={assignee.avatarUrl} alt={assignee.username} />
                  <AvatarFallback className="text-[8px] bg-muted font-bold">
                    {getInitials(assignee.username)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {task.assignees.length > 3 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[8px] font-bold text-muted-foreground ring-1 ring-background">
                  +{task.assignees.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Deletion */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Task"
        description={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        confirmText="Delete Task"
        destructive
        onConfirm={() => boardStore.deleteTask(task.id)}
      />
    </>
  );
}
