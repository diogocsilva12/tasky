import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { boardStore } from '@/store/boardStore';
import type { Task, Priority, Column, Assignee, Subtask, PrStatus, TaskComment } from '@/types';
import {
  CheckSquare,
  GitBranch,
  Hash,
  User,
  Flame,
  Ban,
  Calendar,
  Tag,
  Plus,
  Trash2,
  ListTodo,
  GitPullRequest,
  GitMerge,
  Milestone,
  MessageSquare,
  Send,
} from 'lucide-react';

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  columns: Column[];
  taskToEdit?: Task | null;
  defaultColumnId?: string;
  defaultBranch?: string;
}

const PRIORITY_OPTIONS: {
  value: Priority;
  label: string;
  desc: string;
  colorClass: string;
  bgSelected: string;
}[] = [
  {
    value: 'P0',
    label: 'P0 Critical',
    desc: 'Blocker / Urgent',
    colorClass: 'text-red-500 border-red-500/40 bg-red-500/10',
    bgSelected: 'bg-red-500 text-white font-bold border-red-600',
  },
  {
    value: 'P1',
    label: 'P1 High',
    desc: 'High priority',
    colorClass: 'text-orange-500 border-orange-500/40 bg-orange-500/10',
    bgSelected: 'bg-orange-500 text-white font-semibold border-orange-600',
  },
  {
    value: 'P2',
    label: 'P2 Medium',
    desc: 'Normal sprint task',
    colorClass: 'text-amber-500 border-amber-500/40 bg-amber-500/10',
    bgSelected: 'bg-amber-500 text-white font-medium border-amber-600',
  },
  {
    value: 'P3',
    label: 'P3 Low',
    desc: 'Minor feature / chore',
    colorClass: 'text-blue-500 border-blue-500/40 bg-blue-500/10',
    bgSelected: 'bg-blue-500 text-white font-medium border-blue-600',
  },
  {
    value: 'P4',
    label: 'P4 Trivial',
    desc: 'Nice-to-have / polish',
    colorClass: 'text-emerald-500 border-emerald-500/40 bg-emerald-500/10',
    bgSelected: 'bg-emerald-500 text-white font-normal border-emerald-600',
  },
];

export function TaskModal({
  open,
  onOpenChange,
  projectId,
  columns,
  taskToEdit,
  defaultColumnId,
  defaultBranch,
}: TaskModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState('');
  const [priority, setPriority] = useState<Priority>('P2');
  const [assigneesInput, setAssigneesInput] = useState('');
  const [issueNumber, setIssueNumber] = useState('');
  const [prNumber, setPrNumber] = useState('');
  const [prStatus, setPrStatus] = useState<PrStatus | 'none'>('none');
  const [milestone, setMilestone] = useState('');
  const [branchName, setBranchName] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockerReason, setBlockerReason] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [storyPoints, setStoryPoints] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setColumnId(taskToEdit.columnId);
      setPriority(taskToEdit.priority);
      setIsBlocked(Boolean(taskToEdit.isBlocked));
      setBlockerReason(taskToEdit.blockerReason || '');
      setAssigneesInput(
        taskToEdit.assignees.map((a) => a.username).join(', ')
      );
      setIssueNumber(
        taskToEdit.githubIssueNumber !== undefined ? String(taskToEdit.githubIssueNumber) : ''
      );
      setPrNumber(
        taskToEdit.githubPrNumber !== undefined ? String(taskToEdit.githubPrNumber) : ''
      );
      setPrStatus(taskToEdit.prStatus || 'none');
      setMilestone(taskToEdit.milestone || '');
      setBranchName(taskToEdit.branchName || '');
      setDueDate(taskToEdit.dueDate || '');
      setStoryPoints(taskToEdit.storyPoints !== undefined ? String(taskToEdit.storyPoints) : '');
      setTagsInput((taskToEdit.tags || []).join(', '));
      setSubtasks(taskToEdit.subtasks ? [...taskToEdit.subtasks] : []);
      setComments(taskToEdit.comments ? [...taskToEdit.comments] : []);
    } else {
      setTitle('');
      setDescription('');
      setColumnId(defaultColumnId || columns[0]?.id || '');
      setPriority('P2');
      setIsBlocked(false);
      setBlockerReason('');
      setAssigneesInput('');
      setIssueNumber('');
      setPrNumber('');
      setPrStatus('none');
      setMilestone('');
      setBranchName(defaultBranch || '');
      setDueDate('');
      setStoryPoints('');
      setTagsInput('');
      setSubtasks([]);
      setComments([]);
    }
    setNewSubtaskTitle('');
    setNewCommentText('');
    setError('');
  }, [taskToEdit, defaultColumnId, defaultBranch, columns, open]);

  const parseAssignees = (raw: string): Assignee[] => {
    return raw
      .split(',')
      .map((s) => s.trim().replace(/^@/, ''))
      .filter(Boolean)
      .map((username) => ({
        username,
        avatarUrl: `https://github.com/${username}.png`,
      }));
  };

  const handleAddSubtask = () => {
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;
    setSubtasks([
      ...subtasks,
      {
        id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: trimmed,
        completed: false,
      },
    ]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (subtaskId: string) => {
    setSubtasks(
      subtasks.map((st) =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      )
    );
  };

  const handleRemoveSubtask = (subtaskId: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== subtaskId));
  };

  const handleAddComment = () => {
    const trimmed = newCommentText.trim();
    if (!trimmed) return;
    const author = user?.username || 'diogocsilva12';
    const avatarUrl = user?.avatarUrl || `https://github.com/${author}.png`;
    const newC: TaskComment = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      author,
      avatarUrl,
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    const updated = [...comments, newC];
    setComments(updated);
    if (taskToEdit) {
      boardStore.addComment(taskToEdit.id, trimmed, author, avatarUrl);
    }
    setNewCommentText('');
  };

  const handleDeleteComment = (commentId: string) => {
    setComments(comments.filter((c) => c.id !== commentId));
    if (taskToEdit) {
      boardStore.deleteComment(taskToEdit.id, commentId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    const targetColId = columnId || columns[0]?.id;
    if (!targetColId) {
      setError('A valid column must be selected');
      return;
    }

    const assignees = parseAssignees(assigneesInput);
    const parsedIssue = issueNumber.trim() ? parseInt(issueNumber.trim(), 10) : undefined;
    const parsedPr = prNumber.trim() ? parseInt(prNumber.trim(), 10) : undefined;
    const cleanPrStatus = prStatus !== 'none' ? (prStatus as PrStatus) : undefined;
    const parsedStoryPoints = storyPoints.trim() ? parseInt(storyPoints.trim(), 10) : undefined;
    const tags = tagsInput
      .split(',')
      .map((s) => s.trim().replace(/^#/, ''))
      .filter(Boolean);

    const taskPayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      columnId: targetColId,
      priority,
      assignees,
      githubIssueNumber: isNaN(parsedIssue as number) ? undefined : parsedIssue,
      githubPrNumber: isNaN(parsedPr as number) ? undefined : parsedPr,
      prStatus: cleanPrStatus,
      milestone: milestone.trim() || undefined,
      branchName: branchName.trim() || undefined,
      isBlocked,
      blockerReason: isBlocked ? (blockerReason.trim() || undefined) : undefined,
      subtasks,
      tags: tags.length > 0 ? tags : undefined,
      dueDate: dueDate || undefined,
      storyPoints: isNaN(parsedStoryPoints as number) ? undefined : parsedStoryPoints,
      comments: comments.length > 0 ? comments : undefined,
    };

    if (taskToEdit) {
      boardStore.updateTask(taskToEdit.id, taskPayload);
    } else {
      boardStore.addTask({
        projectId,
        ...taskPayload,
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <CheckSquare className="h-5 w-5 text-primary" />
            {taskToEdit ? 'Edit Task' : 'Create Task'}
          </DialogTitle>
          <DialogDescription>
            {taskToEdit
              ? 'Update task properties, priority rating, and GitHub associations.'
              : 'Add a new task card to the Kanban board.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Task Title <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="e.g. Implement client-side token encryption"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              autoFocus
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Description</label>
            <Textarea
              placeholder="Detailed description, acceptance criteria, or notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-y"
            />
          </div>

          {/* Priority P0-P4 Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-orange-500" />
              Priority Level
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {PRIORITY_OPTIONS.map((opt) => {
                const isSelected = priority === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer ${
                      isSelected
                        ? opt.bgSelected
                        : `hover:bg-accent border-border/60 ${opt.colorClass}`
                    }`}
                  >
                    <span className="text-xs font-bold">{opt.value}</span>
                    <span className="text-[10px] opacity-80 leading-tight">
                      {opt.label.split(' ')[1]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Workflow Column</label>
            <Select value={columnId} onValueChange={setColumnId}>
              <SelectTrigger className="w-full text-xs">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((col) => (
                  <SelectItem key={col.id} value={col.id} className="text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: col.color || '#64748b' }}
                      />
                      <span>{col.title}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assignees */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              Assignees (GitHub Usernames)
            </label>
            <Input
              placeholder="e.g. diogocsilva12, sarah-chen"
              value={assigneesInput}
              onChange={(e) => setAssigneesInput(e.target.value)}
              className="text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Comma-separated list of GitHub usernames.
            </p>
          </div>

          {/* GitHub Metadata Row */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                GitHub Issue #
              </label>
              <Input
                type="number"
                placeholder="e.g. 5"
                value={issueNumber}
                onChange={(e) => setIssueNumber(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                Working Branch
              </label>
              <Input
                placeholder="e.g. feature/kanban-board"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          {/* GitHub PR & Milestone Row */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <GitPullRequest className="h-3.5 w-3.5 text-muted-foreground" />
                Pull Request #
              </label>
              <Input
                type="number"
                placeholder="e.g. 12"
                value={prNumber}
                onChange={(e) => setPrNumber(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <GitMerge className="h-3.5 w-3.5 text-muted-foreground" />
                PR Status
              </label>
              <Select
                value={prStatus}
                onValueChange={(val) => setPrStatus(val as PrStatus | 'none')}
              >
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">None</SelectItem>
                  <SelectItem value="open" className="text-xs text-emerald-500">Open</SelectItem>
                  <SelectItem value="merged" className="text-xs text-purple-500 font-semibold">Merged (Auto-Done)</SelectItem>
                  <SelectItem value="closed" className="text-xs text-red-500">Closed</SelectItem>
                  <SelectItem value="draft" className="text-xs text-muted-foreground">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Milestone className="h-3.5 w-3.5 text-muted-foreground" />
                Milestone
              </label>
              <Input
                placeholder="e.g. v1.0-mvp"
                value={milestone}
                onChange={(e) => setMilestone(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          {/* Due Date & Story Points */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Due Date
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                Story Points
              </label>
              <Select
                value={storyPoints || 'none'}
                onValueChange={(val) => setStoryPoints(val === 'none' ? '' : val)}
              >
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">None</SelectItem>
                  <SelectItem value="1" className="text-xs">1 pt (Tiny)</SelectItem>
                  <SelectItem value="2" className="text-xs">2 pts (Small)</SelectItem>
                  <SelectItem value="3" className="text-xs">3 pts (Medium)</SelectItem>
                  <SelectItem value="5" className="text-xs">5 pts (Large)</SelectItem>
                  <SelectItem value="8" className="text-xs">8 pts (Complex)</SelectItem>
                  <SelectItem value="13" className="text-xs">13 pts (Epic)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              Tags & Labels
            </label>
            <Input
              placeholder="e.g. frontend, auth, bug, performance (comma-separated)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* Subtasks / Checklist */}
          <div className="space-y-2 rounded-xl border border-border/70 bg-card/60 p-3 backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <ListTodo className="h-4 w-4 text-primary" />
                <span>Checklist / Subtasks</span>
              </label>
              <span className="text-[11px] text-muted-foreground">
                {subtasks.filter((s) => s.completed).length}/{subtasks.length} completed
              </span>
            </div>

            {/* Existing subtasks list */}
            {subtasks.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between gap-2 p-1.5 rounded-lg border border-border/50 bg-background/70 text-xs"
                  >
                    <label className="flex items-center gap-2 flex-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={st.completed}
                        onChange={() => handleToggleSubtask(st.id)}
                        className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer shrink-0"
                      />
                      <span className={`${st.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {st.title}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors cursor-pointer"
                      title="Delete subtask"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new subtask row */}
            <div className="flex gap-2">
              <Input
                placeholder="Add subtask or checklist item..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                className="h-8 text-xs"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddSubtask}
                disabled={!newSubtaskTitle.trim()}
                className="h-8 text-xs gap-1 shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </Button>
            </div>
          </div>

          {/* Blocker Settings */}
          <div className={`rounded-xl border p-3 transition-colors ${
            isBlocked
              ? 'border-red-500/40 bg-red-500/10'
              : 'border-border/70 bg-card/60'
          } backdrop-blur-xs space-y-2`}>
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="modal-blocked-toggle" className="flex items-center gap-2 cursor-pointer select-none">
                <Ban className={`h-4 w-4 shrink-0 ${isBlocked ? 'text-destructive' : 'text-muted-foreground'}`} />
                <div>
                  <span className="text-xs font-semibold text-foreground">Mark as Blocked</span>
                  <p className="text-[11px] text-muted-foreground">
                    Flag this task as blocked by an impediment, dependency, or pending review
                  </p>
                </div>
              </label>
              <input
                id="modal-blocked-toggle"
                type="checkbox"
                checked={isBlocked}
                onChange={(e) => setIsBlocked(e.target.checked)}
                className="h-4 w-4 rounded border-border text-destructive focus:ring-destructive accent-red-600 cursor-pointer shrink-0"
              />
            </div>

            {isBlocked && (
              <div className="pt-1.5 space-y-1">
                <label className="text-xs font-medium text-foreground">Blocker Reason / Impediment Details</label>
                <Input
                  placeholder="e.g. Waiting on API response schema, blocked by PR #42, external dependency..."
                  value={blockerReason}
                  onChange={(e) => setBlockerReason(e.target.value)}
                  className="text-xs"
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Discussion & Activity Thread */}
          <div className="space-y-3 rounded-xl border border-border/70 bg-card/60 p-3.5 backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span>Discussion & Comments</span>
              </label>
              <span className="text-[11px] text-muted-foreground">
                {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
              </span>
            </div>

            {/* Comments List */}
            {comments.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-2.5 rounded-lg border border-border/60 bg-background/80 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5 border border-border">
                          <AvatarImage src={comment.avatarUrl} alt={comment.author} />
                          <AvatarFallback className="text-[8px] font-bold">
                            {comment.author.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-foreground text-[11px]">
                          @{comment.author}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-muted-foreground hover:text-destructive p-0.5 rounded transition-colors cursor-pointer"
                        title="Delete comment"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed pl-7">
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic py-0.5">
                No comments yet. Start a discussion on this task.
              </p>
            )}

            {/* Add Comment Input */}
            <div className="flex gap-2 items-end pt-1">
              <Textarea
                placeholder="Write a comment... (Press Enter to post, Shift+Enter for new line)"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                rows={2}
                className="text-xs resize-none"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddComment}
                disabled={!newCommentText.trim()}
                className="h-14 px-3 text-xs gap-1.5 shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Post</span>
              </Button>
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {taskToEdit ? 'Update Task' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
