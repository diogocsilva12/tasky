import { useState, useMemo } from 'react';
import { useBoardStore } from '@/store/boardStore';
import type { Task, Priority } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TaskModal } from '@/components/kanban/TaskModal';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Ban,
  CheckSquare,
  Milestone,
  Layers,
} from 'lucide-react';

interface TimelineViewProps {
  onOpenTask?: (task: Task) => void;
  onNewTask?: () => void;
}

type GroupBy = 'column' | 'priority';

const PRIORITY_THEME: Record<
  Priority,
  { bg: string; border: string; text: string; barBg: string }
> = {
  P0: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-600 dark:text-red-400',
    barBg: 'bg-red-500/80 hover:bg-red-500 text-white',
  },
  P1: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-600 dark:text-orange-400',
    barBg: 'bg-orange-500/80 hover:bg-orange-500 text-white',
  },
  P2: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-600 dark:text-amber-400',
    barBg: 'bg-amber-500/80 hover:bg-amber-500 text-foreground',
  },
  P3: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-600 dark:text-blue-400',
    barBg: 'bg-blue-500/80 hover:bg-blue-500 text-white',
  },
  P4: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    barBg: 'bg-emerald-500/80 hover:bg-emerald-500 text-white',
  },
};

export function TimelineView({ onOpenTask, onNewTask }: TimelineViewProps) {
  const { activeProject, filteredTasks } = useBoardStore();
  const [groupBy, setGroupBy] = useState<GroupBy>('column');
  const [daysWindow, setDaysWindow] = useState<number>(14);
  const [startDateOffset, setStartDateOffset] = useState<number>(-2); // Start 2 days in past
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleOpenTask = (task: Task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
    onOpenTask?.(task);
  };

  const handleNewTask = () => {
    setEditingTask(null);
    setTaskModalOpen(true);
    onNewTask?.();
  };

  // Calculate calendar days
  const baseDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + startDateOffset);
    return d;
  }, [startDateOffset]);

  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < daysWindow; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      days.push(d);
    }
    return days;
  }, [baseDate, daysWindow]);

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const formatDateYMD = (d: Date): string => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Split tasks into scheduled (with dueDate) and unscheduled
  const { scheduledTasks, unscheduledTasks } = useMemo(() => {
    const scheduled: Task[] = [];
    const unscheduled: Task[] = [];

    filteredTasks.forEach((t) => {
      if (t.dueDate) {
        scheduled.push(t);
      } else {
        unscheduled.push(t);
      }
    });

    return { scheduledTasks: scheduled, unscheduledTasks: unscheduled };
  }, [filteredTasks]);

  // Group tasks
  const groups = useMemo(() => {
    if (groupBy === 'column') {
      return (activeProject?.columns || []).map((col) => ({
        id: col.id,
        title: col.title,
        color: col.color,
        tasks: scheduledTasks.filter((t) => t.columnId === col.id),
      }));
    } else {
      const priorities: Priority[] = ['P0', 'P1', 'P2', 'P3', 'P4'];
      return priorities.map((p) => ({
        id: p,
        title: `${p} Priority`,
        color: undefined,
        tasks: scheduledTasks.filter((t) => t.priority === p),
      }));
    }
  }, [groupBy, activeProject, scheduledTasks]);

  // Navigate dates
  const handlePrev = () => setStartDateOffset((prev) => prev - 7);
  const handleNext = () => setStartDateOffset((prev) => prev + 7);
  const handleToday = () => setStartDateOffset(-2);

  // Helper to calculate bar grid position
  const getBarPosition = (task: Task) => {
    if (!task.dueDate) return null;

    const taskEnd = new Date(`${task.dueDate}T00:00:00`);
    let taskStart = new Date(task.createdAt);
    taskStart.setHours(0, 0, 0, 0);

    // If createdAt is after dueDate or invalid, make it 1 day
    if (taskStart > taskEnd) {
      taskStart = new Date(taskEnd);
    }

    const windowStart = calendarDays[0];
    const windowEnd = calendarDays[calendarDays.length - 1];

    // Check if task falls outside the visible window
    if (taskEnd < windowStart || taskStart > windowEnd) {
      return null;
    }

    const startDiff = Math.max(0, Math.floor((taskStart.getTime() - windowStart.getTime()) / (1000 * 60 * 60 * 24)));
    const endDiff = Math.min(daysWindow - 1, Math.floor((taskEnd.getTime() - windowStart.getTime()) / (1000 * 60 * 60 * 24)));

    const span = Math.max(1, endDiff - startDiff + 1);
    const leftPercent = (startDiff / daysWindow) * 100;
    const widthPercent = (span / daysWindow) * 100;

    return {
      left: `${leftPercent}%`,
      width: `${Math.max(widthPercent, 5)}%`, // minimum width
      isOverdue: task.dueDate < todayStr && task.columnId !== 'col-4' && task.columnId !== 'done',
      isDueToday: task.dueDate === todayStr,
    };
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background/40">
      {/* Timeline Controls & Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border/70 bg-card/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <CalendarIcon className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              <span>{activeProject?.name || 'Project'} Timeline</span>
              <Badge variant="outline" className="text-[10px] font-normal">
                {scheduledTasks.length} scheduled
              </Badge>
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Chronological roadmap & deadlines across sprint days
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Group By selector */}
          <div className="flex items-center rounded-lg border border-border/70 bg-background/70 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setGroupBy('column')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                groupBy === 'column' ? 'bg-muted text-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              By Column
            </button>
            <button
              type="button"
              onClick={() => setGroupBy('priority')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                groupBy === 'priority' ? 'bg-muted text-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              By Priority
            </button>
          </div>

          {/* Days window toggle */}
          <div className="flex items-center rounded-lg border border-border/70 bg-background/70 p-0.5 text-xs">
            {[7, 14, 21].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setDaysWindow(w)}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  daysWindow === w ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {w}d
              </button>
            ))}
          </div>

          {/* Date range navigators */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrev}
              className="h-7 w-7 cursor-pointer"
              title="Previous days"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="h-7 px-2.5 text-xs cursor-pointer"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              className="h-7 w-7 cursor-pointer"
              title="Next days"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Button
            size="sm"
            onClick={handleNewTask}
            className="h-7 px-2.5 text-xs gap-1.5 cursor-pointer ml-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Task</span>
          </Button>
        </div>
      </div>

      {/* Main Gantt Grid Area */}
      <div className="flex-1 overflow-x-auto overflow-y-auto p-4 space-y-4">
        <div className="min-w-[760px] bg-card/85 backdrop-blur-md border border-border/70 rounded-2xl shadow-xs overflow-hidden">
          {/* Timeline Calendar Header Row */}
          <div className="grid grid-cols-[220px_1fr] border-b border-border/70 bg-muted/40">
            <div className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-r border-border/60">
              <Layers className="h-3.5 w-3.5" />
              <span>Section / Task</span>
            </div>
            <div className="grid" style={{ gridTemplateColumns: `repeat(${daysWindow}, minmax(0, 1fr))` }}>
              {calendarDays.map((day) => {
                const dayStr = formatDateYMD(day);
                const isToday = dayStr === todayStr;
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                return (
                  <div
                    key={dayStr}
                    className={`py-2 px-1 text-center border-r border-border/40 last:border-r-0 ${
                      isToday ? 'bg-primary/15 text-primary font-bold' : isWeekend ? 'bg-muted/30 text-muted-foreground' : 'text-foreground'
                    }`}
                  >
                    <div className="text-[10px] font-medium text-muted-foreground uppercase">
                      {day.toLocaleDateString(undefined, { weekday: 'short' })}
                    </div>
                    <div className={`text-xs mt-0.5 ${isToday ? 'font-bold' : ''}`}>
                      {day.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Groups & Task Bars */}
          <div className="divide-y divide-border/60">
            {groups.map((group) => (
              <div key={group.id} className="bg-background/20">
                {/* Group Header */}
                <div className="grid grid-cols-[220px_1fr] bg-muted/20 border-b border-border/40">
                  <div className="px-3 py-2 text-xs font-bold text-foreground flex items-center gap-2 border-r border-border/60">
                    {group.color && (
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
                    )}
                    <span className="truncate">{group.title}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-auto">
                      {group.tasks.length}
                    </Badge>
                  </div>
                  <div className="grid" style={{ gridTemplateColumns: `repeat(${daysWindow}, minmax(0, 1fr))` }}>
                    {calendarDays.map((day) => {
                      const dayStr = formatDateYMD(day);
                      const isToday = dayStr === todayStr;
                      return (
                        <div
                          key={dayStr}
                          className={`border-r border-border/30 last:border-r-0 ${isToday ? 'bg-primary/5' : ''}`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Task rows */}
                {group.tasks.length === 0 ? (
                  <div className="grid grid-cols-[220px_1fr] py-3 text-xs text-muted-foreground/60 italic">
                    <div className="px-4 border-r border-border/60">No scheduled tasks</div>
                    <div className="grid" style={{ gridTemplateColumns: `repeat(${daysWindow}, minmax(0, 1fr))` }}>
                      {calendarDays.map((day) => (
                        <div key={formatDateYMD(day)} className="border-r border-border/20 last:border-r-0" />
                      ))}
                    </div>
                  </div>
                ) : (
                  group.tasks.map((task) => {
                    const pos = getBarPosition(task);
                    const completedSub = task.subtasks?.filter((s) => s.completed).length || 0;
                    const totalSub = task.subtasks?.length || 0;

                    return (
                      <div
                        key={task.id}
                        className="grid grid-cols-[220px_1fr] items-center hover:bg-muted/30 transition-colors group"
                      >
                        {/* Task Title & Metadata Column */}
                        <div
                          className="px-3 py-2 border-r border-border/60 flex items-center justify-between gap-2 cursor-pointer"
                          onClick={() => handleOpenTask(task)}
                        >
                          <div className="min-w-0 flex items-center gap-1.5">
                            <span
                              className={`text-[9px] font-bold px-1 py-0.5 rounded border shrink-0 ${
                                PRIORITY_THEME[task.priority].bg
                              } ${PRIORITY_THEME[task.priority].text} ${
                                PRIORITY_THEME[task.priority].border
                              }`}
                            >
                              {task.priority}
                            </span>
                            <span className="text-xs text-foreground font-medium truncate group-hover:text-primary transition-colors">
                              {task.title}
                            </span>
                          </div>
                          {task.isBlocked && (
                            <span title="Blocked">
                              <Ban className="h-3 w-3 text-red-500 shrink-0" />
                            </span>
                          )}
                        </div>

                        {/* Timeline Track & Bar */}
                        <div className="relative h-10 flex items-center">
                          {/* Vertical day columns backdrop */}
                          <div
                            className="absolute inset-0 grid pointer-events-none"
                            style={{ gridTemplateColumns: `repeat(${daysWindow}, minmax(0, 1fr))` }}
                          >
                            {calendarDays.map((day) => {
                              const dayStr = formatDateYMD(day);
                              const isToday = dayStr === todayStr;
                              return (
                                <div
                                  key={dayStr}
                                  className={`border-r border-border/30 last:border-r-0 ${
                                    isToday ? 'bg-primary/5' : ''
                                  }`}
                                />
                              );
                            })}
                          </div>

                          {/* Gantt Bar */}
                          {pos ? (
                            <div
                              onClick={() => handleOpenTask(task)}
                              className={`absolute h-7 rounded-lg shadow-xs px-2 flex items-center justify-between gap-1.5 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md z-10 ${
                                pos.isOverdue
                                  ? 'bg-red-500 text-white ring-2 ring-red-500/40'
                                  : pos.isDueToday
                                  ? 'bg-amber-500 text-black ring-2 ring-amber-500/40'
                                  : PRIORITY_THEME[task.priority].barBg
                              }`}
                              style={{
                                left: pos.left,
                                width: pos.width,
                              }}
                              title={`${task.title} • Due: ${task.dueDate}`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Clock className="h-3 w-3 shrink-0 opacity-80" />
                                <span className="text-xs font-semibold truncate leading-none">
                                  {task.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {totalSub > 0 && (
                                  <span className="text-[10px] font-mono opacity-90 flex items-center gap-0.5">
                                    <CheckSquare className="h-2.5 w-2.5" />
                                    <span>{completedSub}/{totalSub}</span>
                                  </span>
                                )}
                                {task.assignees.length > 0 && (
                                  <Avatar className="h-4 w-4 ring-1 ring-white/30 border-0">
                                    <AvatarImage src={task.assignees[0].avatarUrl} />
                                    <AvatarFallback className="text-[7px]">
                                      {task.assignees[0].username.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] text-muted-foreground/60 italic pl-3 z-10">
                              Due date ({task.dueDate}) outside current view window
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Unscheduled Backlog Drawer */}
        {unscheduledTasks.length > 0 && (
          <div className="bg-card/85 backdrop-blur-md border border-border/70 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-xs font-semibold text-foreground tracking-tight">
                  Unscheduled Tasks / Backlog
                </h3>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                  {unscheduledTasks.length}
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Click any task to assign a due date and schedule onto the timeline
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {unscheduledTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleOpenTask(task)}
                  className="p-2.5 rounded-xl border border-border/60 bg-background/70 hover:border-primary/60 hover:bg-muted/40 transition-all cursor-pointer space-y-1.5 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-[9px] font-bold px-1 py-0.5 rounded border shrink-0 ${
                        PRIORITY_THEME[task.priority].bg
                      } ${PRIORITY_THEME[task.priority].text} ${
                        PRIORITY_THEME[task.priority].border
                      }`}
                    >
                      {task.priority}
                    </span>
                    {task.milestone && (
                      <span className="text-[10px] font-mono text-muted-foreground truncate flex items-center gap-1">
                        <Milestone className="h-2.5 w-2.5" />
                        <span>{task.milestone}</span>
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-medium text-foreground line-clamp-1">
                    {task.title}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                    <span className="text-primary hover:underline flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      <span>Set Due Date</span>
                    </span>
                    {task.assignees.length > 0 && (
                      <span>@{task.assignees[0].username}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Embedded TaskModal */}
      {activeProject && (
        <TaskModal
          open={taskModalOpen}
          onOpenChange={(open) => {
            setTaskModalOpen(open);
            if (!open) setEditingTask(null);
          }}
          projectId={activeProject.id}
          columns={activeProject.columns}
          taskToEdit={editingTask}
          defaultBranch={activeProject.defaultBranch}
        />
      )}
    </div>
  );
}
