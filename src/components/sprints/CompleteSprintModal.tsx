import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useBoardStore } from '@/store/boardStore';
import type { Sprint } from '@/types';
import { calculateSprintProgress } from '@/lib/sprintMetrics';
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Archive,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

interface CompleteSprintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprint: Sprint;
}

export const CompleteSprintModal: React.FC<CompleteSprintModalProps> = ({
  open,
  onOpenChange,
  sprint,
}) => {
  const { tasks, completeSprint, activeProjectSprints } = useBoardStore();
  const [rolloverAction, setRolloverAction] = useState<'nextSprint' | 'backlog'>('nextSprint');

  const progress = calculateSprintProgress(sprint, tasks);
  const nextSprint = activeProjectSprints.find(
    (s) => s.id !== sprint.id && s.status === 'planned'
  );

  const handleComplete = () => {
    completeSprint(sprint.id, rolloverAction);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card/95 backdrop-blur-md border border-border/70 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <span>Complete {sprint.name}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Review iteration performance and choose where to rollover remaining open tasks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Performance Summary Banner */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-border/70 bg-muted/20">
            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>Tasks Completed</span>
              </span>
              <p className="text-lg font-bold text-foreground">
                {progress.completedTasks}{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  / {progress.totalTasks} ({progress.percentComplete}%)
                </span>
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                <span>Velocity Achieved</span>
              </span>
              <p className="text-lg font-bold text-foreground">
                {progress.completedPoints}{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  / {progress.totalPoints || sprint.velocityTarget || 25} pts
                </span>
              </p>
            </div>
          </div>

          {/* Rollover Incomplete Tasks Options */}
          {progress.remainingTasks > 0 ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                <span>{progress.remainingTasks} incomplete task{progress.remainingTasks > 1 ? 's' : ''} remaining</span>
              </label>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setRolloverAction('nextSprint')}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    rolloverAction === 'nextSprint'
                      ? 'border-primary bg-primary/10 text-primary shadow-xs'
                      : 'border-border/70 hover:bg-card/70 text-muted-foreground'
                  }`}
                >
                  <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-foreground">
                      Move to Next Sprint {nextSprint ? `(${nextSprint.name})` : '(Auto-create Sprint)'}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Recommended: carry forward unfinished work into the upcoming sprint iteration.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRolloverAction('backlog')}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    rolloverAction === 'backlog'
                      ? 'border-primary bg-primary/10 text-primary shadow-xs'
                      : 'border-border/70 hover:bg-card/70 text-muted-foreground'
                  }`}
                >
                  <Archive className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-foreground">
                      Move to Project Backlog
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Unassign from sprint and return tasks to general backlog for future prioritization.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-center text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>All tasks in this sprint were completed! Outstanding execution!</span>
            </div>
          )}
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
          <Button
            size="sm"
            onClick={handleComplete}
            className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Complete Sprint</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
