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
import { useBoardStore } from '@/store/boardStore';
import type { Sprint, SprintStatus } from '@/types';
import { Zap, Calendar, Target } from 'lucide-react';

interface SprintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprintToEdit?: Sprint | null;
  projectId: string;
}

export const SprintModal: React.FC<SprintModalProps> = ({
  open,
  onOpenChange,
  sprintToEdit,
  projectId,
}) => {
  const { addSprint, updateSprint } = useBoardStore();

  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [velocityTarget, setVelocityTarget] = useState<number | ''>(25);
  const [status, setStatus] = useState<SprintStatus>('planned');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      if (sprintToEdit) {
        setName(sprintToEdit.name);
        setGoal(sprintToEdit.goal || '');
        setStartDate(sprintToEdit.startDate.split('T')[0]);
        setEndDate(sprintToEdit.endDate.split('T')[0]);
        setVelocityTarget(sprintToEdit.velocityTarget || 25);
        setStatus(sprintToEdit.status);
      } else {
        const now = new Date();
        const twoWeeks = new Date(now);
        twoWeeks.setDate(twoWeeks.getDate() + 14);

        setName('Sprint 15');
        setGoal('');
        setStartDate(now.toISOString().split('T')[0]);
        setEndDate(twoWeeks.toISOString().split('T')[0]);
        setVelocityTarget(25);
        setStatus('active');
      }
      setError('');
    }
  }, [open, sprintToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Sprint name is required');
      return;
    }
    if (!startDate || !endDate) {
      setError('Start date and end date are required');
      return;
    }

    const payload = {
      projectId,
      name: name.trim(),
      goal: goal.trim() || undefined,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate + 'T23:59:59').toISOString(),
      status,
      velocityTarget: velocityTarget ? Number(velocityTarget) : undefined,
    };

    if (sprintToEdit) {
      updateSprint(sprintToEdit.id, payload);
    } else {
      addSprint(payload);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card/95 backdrop-blur-md border border-border/70 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Zap className="h-4 w-4" />
            </div>
            <span>{sprintToEdit ? 'Edit Sprint' : 'Plan New Sprint'}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure iteration goals, timeline boundaries, and target story points velocity.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Sprint Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Sprint Name <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="e.g. Sprint 15: Automation & Webhooks"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              className="text-xs h-9"
              autoFocus
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          {/* Sprint Goal */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Sprint Goal</label>
            <Textarea
              placeholder="What is the primary deliverable or outcome of this sprint cycle?"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={2}
              className="text-xs"
            />
          </div>

          {/* Dates row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span>Start Date</span>
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span>End Date</span>
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </div>

          {/* Velocity Target & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Target className="h-3 w-3 text-primary" />
                <span>Target Points</span>
              </label>
              <Input
                type="number"
                min={1}
                max={500}
                placeholder="25"
                value={velocityTarget}
                onChange={(e) =>
                  setVelocityTarget(e.target.value ? parseInt(e.target.value, 10) : '')
                }
                className="text-xs h-9 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SprintStatus)}
                className="w-full h-9 rounded-md border border-border/80 bg-background/80 px-3 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="active">Active (Start Now)</option>
                <option value="planned">Planned (Future)</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" className="text-xs">
              {sprintToEdit ? 'Save Changes' : 'Create Sprint'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
