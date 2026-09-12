import React, { useState } from 'react';
import { useBoardStore } from '@/store/boardStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { calculateSprintProgress } from '@/lib/sprintMetrics';
import { SprintModal } from './SprintModal';
import { CompleteSprintModal } from './CompleteSprintModal';
import {
  Zap,
  Calendar,
  ChevronDown,
  Plus,
  Play,
  CheckCircle2,
  Settings,
  Flame,
  Layers,
  Sparkles,
} from 'lucide-react';

export const SprintBar: React.FC = () => {
  const {
    activeProject,
    activeSprint,
    activeProjectSprints,
    tasks,
    filter,
    setFilter,
    startSprint,
  } = useBoardStore();

  const [sprintModalOpen, setSprintModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);

  if (!activeProject) return null;

  const progress = activeSprint ? calculateSprintProgress(activeSprint, tasks) : null;
  const isFilteringActiveSprint = filter.sprintId === 'active';

  return (
    <>
      <div className="border-b border-border/70 bg-card/60 px-4 py-2 sm:px-6 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left Side: Sprint Name, Goal, Countdown */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
          {activeSprint ? (
            <>
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <Flame className="h-3 w-3" />
                </span>
                <span className="truncate max-w-[200px] sm:max-w-[320px]">
                  {activeSprint.name}
                </span>
              </div>

              {activeSprint.goal && (
                <span
                  className="hidden md:inline-block text-[11px] text-muted-foreground truncate max-w-xs"
                  title={`Goal: ${activeSprint.goal}`}
                >
                  • {activeSprint.goal}
                </span>
              )}

              {/* Countdown Pill */}
              {progress && (
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                    progress.isOverdue
                      ? 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30'
                      : progress.daysRemaining <= 3
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      : 'bg-primary/10 text-primary border-primary/20'
                  }`}
                >
                  <Calendar className="h-2.5 w-2.5" />
                  <span>
                    {progress.isOverdue
                      ? `${Math.abs(progress.daysRemaining)}d overdue`
                      : `${progress.daysRemaining}d remaining`}
                  </span>
                </span>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="h-3.5 w-3.5 opacity-60" />
              <span>No active sprint cycle for {activeProject.name}.</span>
            </div>
          )}
        </div>

        {/* Right Side: Velocity Progress, Filter Toggle, and Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
          {/* Velocity Progress Bar */}
          {activeSprint && progress && (
            <div className="hidden lg:flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>Velocity:</span>
              <div className="w-24 bg-secondary/80 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, progress.percentComplete)}%` }}
                />
              </div>
              <span className="font-mono font-medium text-foreground">
                {progress.completedPoints}/{progress.totalPoints || activeSprint.velocityTarget || 25} pts
              </span>
            </div>
          )}

          {/* Filter Toggle: All Tasks vs Active Sprint */}
          {activeSprint && (
            <div className="flex items-center rounded-lg border border-border/70 p-0.5 bg-background/50">
              <button
                type="button"
                onClick={() => setFilter({ sprintId: 'ALL' })}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  !isFilteringActiveSprint
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Tasks
              </button>
              <button
                type="button"
                onClick={() => setFilter({ sprintId: 'active' })}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  isFilteringActiveSprint
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Zap className="h-2.5 w-2.5" />
                <span>Sprint Only</span>
              </button>
            </div>
          )}

          {/* Sprint Menu Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs gap-1 border-border/70 hover:bg-accent"
              >
                <Layers className="h-3 w-3" />
                <span className="hidden sm:inline">Sprints</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {activeSprint && (
                <>
                  <DropdownMenuItem
                    onClick={() => setCompleteModalOpen(true)}
                    className="gap-2 text-xs cursor-pointer text-emerald-600 dark:text-emerald-400 focus:text-emerald-600"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Complete Sprint...</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSprintModalOpen(true)}
                    className="gap-2 text-xs cursor-pointer"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    <span>Edit Sprint Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              {/* Start Planned Sprint if any */}
              {activeProjectSprints
                .filter((s) => s.status === 'planned')
                .map((s) => (
                  <DropdownMenuItem
                    key={s.id}
                    onClick={() => startSprint(s.id)}
                    className="gap-2 text-xs cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5 text-primary" />
                    <span className="truncate">Start {s.name}</span>
                  </DropdownMenuItem>
                ))}

              {activeProjectSprints.some((s) => s.status === 'planned') && (
                <DropdownMenuSeparator />
              )}

              <DropdownMenuItem
                onClick={() => setSprintModalOpen(true)}
                className="gap-2 text-xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-primary" />
                <span>Plan New Sprint</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Primary Quick Button if no active sprint */}
          {!activeSprint && (
            <Button
              size="sm"
              onClick={() => setSprintModalOpen(true)}
              className="h-7 px-2.5 text-xs gap-1 shadow-xs"
            >
              <Sparkles className="h-3 w-3" />
              <span>Start a Sprint</span>
            </Button>
          )}
        </div>
      </div>

      {/* Sprints Modals */}
      <SprintModal
        open={sprintModalOpen}
        onOpenChange={setSprintModalOpen}
        sprintToEdit={activeSprint}
        projectId={activeProject.id}
      />

      {activeSprint && (
        <CompleteSprintModal
          open={completeModalOpen}
          onOpenChange={setCompleteModalOpen}
          sprint={activeSprint}
        />
      )}
    </>
  );
};
