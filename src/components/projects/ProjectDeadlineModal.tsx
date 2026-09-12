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
import { Input } from '@/components/ui/input';
import { boardStore } from '@/store/boardStore';
import type { Project } from '@/types';
import {
  Calendar,
  Clock,
  Trash2,
  Check,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import {
  getDeadlineStatus,
  getPresetDeadline,
} from '@/lib/dateUtils';

interface ProjectDeadlineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
}

export const ProjectDeadlineModal: React.FC<ProjectDeadlineModalProps> = ({
  open,
  onOpenChange,
  project,
}) => {
  const [deadlineDate, setDeadlineDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setDeadlineDate(project.deadline ? project.deadline.split('T')[0] : '');
      setError('');
    }
  }, [open, project.deadline]);

  const previewStatus = getDeadlineStatus(deadlineDate);

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();
    boardStore.updateProject(project.id, {
      deadline: deadlineDate ? deadlineDate : undefined,
    });
    onOpenChange(false);
  };

  const handleRemoveDeadline = () => {
    boardStore.updateProject(project.id, {
      deadline: undefined,
    });
    onOpenChange(false);
  };

  const handlePresetSelect = (
    preset: '1week' | '2weeks' | '3weeks' | 'endOfMonth' | 'endOfQuarter'
  ) => {
    const calculated = getPresetDeadline(preset);
    setDeadlineDate(calculated);
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card/95 backdrop-blur-md border border-border/70 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Calendar className="h-4 w-4" />
            </div>
            <span>Set Project Deadline</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Define a delivery or target release date for{' '}
            <strong className="text-foreground">{project.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-2">
          {/* Date Picker Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Target Deadline Date</span>
              {deadlineDate && (
                <button
                  type="button"
                  onClick={() => setDeadlineDate('')}
                  className="text-[10px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                >
                  Clear date
                </button>
              )}
            </label>
            <div className="relative">
              <Input
                type="date"
                value={deadlineDate}
                onChange={(e) => {
                  setDeadlineDate(e.target.value);
                  if (error) setError('');
                }}
                className="text-xs h-9 bg-background/80"
              />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" />
              <span>Quick Presets</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePresetSelect('1week')}
                className="text-[11px] h-7 px-2 border-border/70 hover:border-primary/40 hover:bg-primary/5"
              >
                +1 Week
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePresetSelect('2weeks')}
                className="text-[11px] h-7 px-2 border-border/70 hover:border-primary/40 hover:bg-primary/5"
              >
                +2 Weeks
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePresetSelect('3weeks')}
                className="text-[11px] h-7 px-2 border-border/70 hover:border-primary/40 hover:bg-primary/5"
              >
                3 Weeks
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePresetSelect('endOfMonth')}
                className="text-[11px] h-7 px-2 border-border/70 hover:border-primary/40 hover:bg-primary/5"
              >
                Month End
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePresetSelect('endOfQuarter')}
                className="text-[11px] h-7 px-2 border-border/70 hover:border-primary/40 hover:bg-primary/5"
              >
                Quarter End
              </Button>
            </div>
          </div>

          {/* Live Status Preview Box */}
          {deadlineDate ? (
            <div
              className={`rounded-xl border p-3 flex items-center justify-between text-xs transition-all ${
                previewStatus.isOverdue
                  ? 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
                  : previewStatus.isDueToday
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'border-primary/25 bg-primary/5 text-primary'
              }`}
            >
              <div className="flex items-center gap-2">
                {previewStatus.isOverdue ? (
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                ) : (
                  <Clock className="h-4 w-4 shrink-0" />
                )}
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">
                    {previewStatus.formattedDate}
                  </span>
                  <span className="text-[11px] opacity-90">{previewStatus.label}</span>
                </div>
              </div>

              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${previewStatus.badgeClass}`}
              >
                {previewStatus.isOverdue ? 'Overdue' : `${previewStatus.daysRemaining}d`}
              </span>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/70 p-3 text-center text-xs text-muted-foreground bg-muted/20">
              No target deadline selected. Choose a date above or click a preset.
            </div>
          )}

          <DialogFooter className="pt-2 flex sm:justify-between items-center gap-2">
            {project.deadline ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveDeadline}
                className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 cursor-pointer mr-auto"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove Deadline</span>
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs gap-1.5 shadow-xs">
                <Check className="h-3.5 w-3.5" />
                <span>Save Deadline</span>
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
