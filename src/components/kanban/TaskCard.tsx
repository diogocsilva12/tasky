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
import { BranchCommitsModal } from './BranchCommitsModal';
import { TaskActivityModal } from './TaskActivityModal';
import { TaskCommentsModal } from './TaskCommentsModal';
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
  GitPullRequest,
  GitMerge,
  Milestone,
  MessageSquare,
  History,
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

  const [activityOpen, setActivityOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [commitsModalOpen, setCommitsModalOpen] = useState(false);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);

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
        <div className="flex items-center gap-1.5 mb-2 text-[10px] text-muted-foreground" title={task.creator ? `Created by @${task.creator.username}` : 'Creator not recorded for this task'}>
          <Avatar className="h-6 w-6 border border-border"><AvatarImage src={task.creator?.avatarUrl || (task.creator ? `https://github.com/${task.creator.username}.png` : undefined)} alt={task.creator ? `Creator ${task.creator.username}` : 'Creator unknown'} /><AvatarFallback>{task.creator?.username.slice(0, 2).toUpperCase() || '?'}</AvatarFallback></Avatar>
          <span>{task.creator ? `Created by @${task.creator.username}` : 'Creator unknown'}</span>
        </div>
        {/* Top row: Priority badge, Blocked badge, Story Points, PR badge, Milestone, Issue #, Dropdown */}
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

            {/* GitHub PR Link / Badge */}
            {task.githubPrNumber !== undefined && (
              <span
                onClick={(e) => {
                  const prUrl = repoDetails.prUrl(task.githubPrNumber!);
                  if (prUrl) {
                    e.stopPropagation();
                    window.open(prUrl, '_blank', 'noopener,noreferrer');
                  }
                }}
                className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                  task.prStatus === 'merged'
                    ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 font-semibold'
                    : task.prStatus === 'open'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-medium'
                    : task.prStatus === 'closed'
                    ? 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 font-medium'
                    : 'bg-muted text-muted-foreground border-border/60'
                } hover:opacity-80 cursor-pointer`}
                title={`PR #${task.githubPrNumber} (${task.prStatus || 'open'}) • Click to open on GitHub`}
              >
                {task.prStatus === 'merged' ? (
                  <GitMerge className="h-2.5 w-2.5" />
                ) : (
                  <GitPullRequest className="h-2.5 w-2.5" />
                )}
                <span>#{task.githubPrNumber}</span>
              </span>
            )}

            {/* Milestone Badge */}
            {task.milestone && (
              <span
                className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-medium"
                title={`Milestone: ${task.milestone}`}
              >
                <Milestone className="h-2.5 w-2.5" />
                <span>{task.milestone}</span>
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

                <DropdownMenuItem
                  onClick={() => setCommentsModalOpen(true)}
                  className="gap-2 text-xs cursor-pointer"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Comments Thread {task.comments?.length ? `(${task.comments.length})` : ''}</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setActivityOpen(true)} className="gap-2 text-xs cursor-pointer">
                  <History className="h-3.5 w-3.5" /><span>Activity history</span>
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
            <div className="space-y-0.5 pt-0.5">
              {subtasks.slice(0, 3).map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex min-w-0 items-center gap-1.5 text-[10px] leading-tight text-muted-foreground"
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-3 w-3 shrink-0 items-center justify-center rounded border text-[8px] font-bold ${
                      subtask.completed
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border/70 bg-background/50'
                    }`}
                  >
                    {subtask.completed ? '✓' : ''}
                  </span>
                  <span className={`truncate ${subtask.completed ? 'text-muted-foreground/70 line-through' : 'text-foreground/80'}`}>
                    {subtask.title}
                  </span>
                </div>
              ))}
              {totalSubtasks > 3 && (
                <span className="block pl-[18px] text-[9px] text-muted-foreground/70">
                  +{totalSubtasks - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Bottom row: Branch Link, Due Date & Assignee Avatars */}
        <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-border/40">
          {/* Branch Link & Commit Activity Preview */}
          {task.branchName ? (
            <div className="flex items-center gap-1 min-w-0 max-w-[140px]">
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setCommitsModalOpen(true);
                }}
                className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors truncate cursor-pointer"
                title={`${task.branchName} • Click to view branch commits`}
              >
                <GitBranch className="h-3 w-3 shrink-0 text-primary/70" />
                <span className="truncate">{task.branchName}</span>
              </span>
              {branchUrl && (
                <a
                  href={branchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground/60 hover:text-primary p-0.5 rounded transition-colors shrink-0"
                  title="Open branch on GitHub"
                >
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
            </div>
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

          {/* Comments Count Badge */}
          {task.comments && task.comments.length > 0 && (
            <span
              className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer shrink-0 px-1 py-0.5 rounded hover:bg-muted/60"
              onClick={(e) => {
                e.stopPropagation();
                setCommentsModalOpen(true);
              }}
              title={`${task.comments.length} comment${task.comments.length > 1 ? 's' : ''} • Click to open conversation thread`}
            >
              <MessageSquare className="h-2.5 w-2.5" />
              <span>{task.comments.length}</span>
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

      <TaskActivityModal taskId={task.id} open={activityOpen} onOpenChange={setActivityOpen} />

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

      {/* Branch Commits Preview Modal */}
      {task.branchName && (
        <BranchCommitsModal
          open={commitsModalOpen}
          onOpenChange={setCommitsModalOpen}
          repoOwner={repoOwner || 'diogocsilva12'}
          repoName={repoName || 'tasky'}
          branchName={task.branchName}
        />
      )}

      {/* Task Comments Conversation Thread Modal */}
      <TaskCommentsModal
        open={commentsModalOpen}
        onOpenChange={setCommentsModalOpen}
        taskId={task.id}
      />
    </>
  );
}
