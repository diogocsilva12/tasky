import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Task, Project } from '../../types/index';
import { CheckCircle, Clock, Ban, Layers, Timer, Zap } from 'lucide-react';
import { calculateTeamMetrics } from '../../lib/sprintMetrics';

interface KPICardsProps {
  tasks: Task[];
  projects?: Project[];
}

export const KPICards: React.FC<KPICardsProps> = ({ tasks, projects = [] }) => {
  const totalTasks = tasks.length;

  // Derive done and in-progress column IDs from projects
  const doneColumnIds = new Set<string>();
  const inProgressColumnIds = new Set<string>();

  projects.forEach((proj) => {
    proj.columns.forEach((col) => {
      const lower = col.title.toLowerCase();
      if (
        lower.includes('done') ||
        lower.includes('ship') ||
        lower.includes('finish') ||
        lower.includes('complete') ||
        col.id === 'done'
      ) {
        doneColumnIds.add(col.id);
      } else if (
        lower.includes('progress') ||
        lower.includes('dev') ||
        lower.includes('doing') ||
        lower.includes('review') ||
        col.id === 'in-progress'
      ) {
        inProgressColumnIds.add(col.id);
      }
    });
  });

  // Fallback if projects is empty: check task columnId string directly
  const inProgress = tasks.filter((t) =>
    inProgressColumnIds.size > 0
      ? inProgressColumnIds.has(t.columnId)
      : t.columnId === 'in-progress' || t.columnId.includes('dev') || t.columnId.includes('progress')
  ).length;

  const completed = tasks.filter((t) =>
    doneColumnIds.size > 0
      ? doneColumnIds.has(t.columnId)
      : t.columnId === 'done' || t.columnId.includes('done')
  ).length;

  const completionVelocity = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

  // Active Blockers: any task explicitly marked as blocked or P0 that is not yet completed
  const activeBlockers = tasks.filter((t) => {
    const isDone = doneColumnIds.size > 0 ? doneColumnIds.has(t.columnId) : t.columnId === 'done';
    return (t.isBlocked || t.priority === 'P0') && !isDone;
  }).length;

  const teamMetrics = calculateTeamMetrics(tasks);

  const kpis = [
    {
      title: 'Total Tasks',
      value: totalTasks,
      icon: <Layers className="h-4 w-4 text-muted-foreground" />,
      subtext: `${tasks.filter((t) => t.isBlocked).length} marked blocked`,
    },
    {
      title: 'In-Progress Tasks',
      value: inProgress,
      icon: <Clock className="h-4 w-4 text-blue-500" />,
      subtext: `${totalTasks > 0 ? Math.round((inProgress / totalTasks) * 100) : 0}% of active workload`,
    },
    {
      title: 'Completion Velocity',
      value: `${completionVelocity}%`,
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      subtext: `${completed} tasks completed`,
    },
    {
      title: 'Avg Lead Time',
      value: `${teamMetrics.avgLeadTimeDays}d`,
      icon: <Timer className="h-4 w-4 text-purple-500" />,
      subtext: `Creation to completion (${teamMetrics.cycleEfficiencyPercent}% efficiency)`,
    },
    {
      title: 'Avg Cycle Time',
      value: `${teamMetrics.avgCycleTimeDays}d`,
      icon: <Zap className="h-4 w-4 text-amber-500" />,
      subtext: `In dev to deployed`,
    },
    {
      title: 'Active Blockers & P0',
      value: activeBlockers,
      icon: <Ban className="h-4 w-4 text-red-500" />,
      subtext: activeBlockers > 0 ? 'Requires attention' : 'All clear',
      valueClass: activeBlockers > 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {kpis.map((kpi, idx) => (
        <Card
          key={idx}
          className="bg-card/85 backdrop-blur-md border-border/70 hover:shadow-md transition-all"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
            {kpi.icon}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${kpi.valueClass || ''}`}>{kpi.value}</div>
            {kpi.subtext && (
              <p className="text-[11px] text-muted-foreground mt-1">{kpi.subtext}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
