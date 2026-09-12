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
import { boardStore } from '@/store/boardStore';
import type { Task, Priority, Column, Assignee } from '@/types';
import {
  CheckSquare,
  GitBranch,
  Hash,
  User,
  Flame,
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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState('');
  const [priority, setPriority] = useState<Priority>('P2');
  const [assigneesInput, setAssigneesInput] = useState('');
  const [issueNumber, setIssueNumber] = useState('');
  const [branchName, setBranchName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setColumnId(taskToEdit.columnId);
      setPriority(taskToEdit.priority);
      setAssigneesInput(
        taskToEdit.assignees.map((a) => a.username).join(', ')
      );
      setIssueNumber(
        taskToEdit.githubIssueNumber !== undefined ? String(taskToEdit.githubIssueNumber) : ''
      );
      setBranchName(taskToEdit.branchName || '');
    } else {
      setTitle('');
      setDescription('');
      setColumnId(defaultColumnId || columns[0]?.id || '');
      setPriority('P2');
      setAssigneesInput('');
      setIssueNumber('');
      setBranchName(defaultBranch || '');
    }
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

    if (taskToEdit) {
      boardStore.updateTask(taskToEdit.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        columnId: targetColId,
        priority,
        assignees,
        githubIssueNumber: isNaN(parsedIssue as number) ? undefined : parsedIssue,
        branchName: branchName.trim() || undefined,
      });
    } else {
      boardStore.addTask({
        projectId,
        columnId: targetColId,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        assignees,
        githubIssueNumber: isNaN(parsedIssue as number) ? undefined : parsedIssue,
        branchName: branchName.trim() || undefined,
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
