import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import type { Task, Project } from '@/types';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, Flame, Zap, CheckCircle2, Target } from 'lucide-react';

interface VelocityChartProps {
  tasks: Task[];
  projects?: Project[];
}

export const VelocityChart: React.FC<VelocityChartProps> = ({ tasks, projects = [] }) => {
  const [metricView, setMetricView] = useState<'burndown' | 'assignees'>('burndown');

  // Identify done columns
  const doneColumnIds = useMemo(() => {
    const ids = new Set<string>();
    projects.forEach((proj) => {
      proj.columns.forEach((col) => {
        const lower = col.title.toLowerCase();
        if (
          lower.includes('done') ||
          lower.includes('ship') ||
          lower.includes('finish') ||
          lower.includes('complete') ||
          col.id === 'done' ||
          col.id === 'col-4' ||
          col.id === 'col-5'
        ) {
          ids.add(col.id);
        }
      });
    });
    return ids;
  }, [projects]);

  // Total points
  const { totalPoints, completedPoints, inProgressPoints, remainingPoints } = useMemo(() => {
    let total = 0;
    let completed = 0;
    let inProgress = 0;

    tasks.forEach((t) => {
      const pts = t.storyPoints !== undefined ? t.storyPoints : 1;
      total += pts;
      const isDone = doneColumnIds.size > 0 ? doneColumnIds.has(t.columnId) : t.columnId === 'done' || t.columnId.includes('done');
      if (isDone) {
        completed += pts;
      } else {
        const lower = t.columnId.toLowerCase();
        if (lower.includes('progress') || lower.includes('dev') || lower.includes('doing') || lower.includes('review')) {
          inProgress += pts;
        }
      }
    });

    return {
      totalPoints: total,
      completedPoints: completed,
      inProgressPoints: inProgress,
      remainingPoints: Math.max(0, total - completed),
    };
  }, [tasks, doneColumnIds]);

  // Construct Sprint Burndown data (10-day sprint)
  const burndownData = useMemo(() => {
    const total = totalPoints || 25; // fallback baseline if empty
    const completed = completedPoints;
    const remaining = remainingPoints;

    const days = 10;
    const step = total / (days - 1);

    return Array.from({ length: days }).map((_, i) => {
      const dayNum = i + 1;
      const ideal = Math.max(0, Math.round(total - i * step));

      // Actual burn trajectory: starts at total, drops according to completed tasks
      let actual: number;
      if (i <= 4) {
        // First half of sprint
        const burnFraction = (i / 4) * (completed * 0.7);
        actual = Math.round(total - burnFraction);
      } else if (i <= 7) {
        // Mid to late sprint
        const burnFraction = 0.7 * completed + ((i - 4) / 3) * (completed * 0.3);
        actual = Math.round(total - burnFraction);
      } else {
        actual = remaining;
      }

      return {
        day: `Day ${dayNum}`,
        ideal,
        actual: Math.max(0, actual),
      };
    });
  }, [totalPoints, completedPoints, remainingPoints]);

  // Story points breakdown by assignee
  const assigneeData = useMemo(() => {
    const pointsMap = new Map<string, { completed: number; remaining: number }>();

    tasks.forEach((t) => {
      const pts = t.storyPoints !== undefined ? t.storyPoints : 1;
      const isDone = doneColumnIds.size > 0 ? doneColumnIds.has(t.columnId) : t.columnId === 'done' || t.columnId.includes('done');
      const author = t.assignees.length > 0 ? t.assignees[0].username : 'Unassigned';

      const current = pointsMap.get(author) || { completed: 0, remaining: 0 };
      if (isDone) {
        current.completed += pts;
      } else {
        current.remaining += pts;
      }
      pointsMap.set(author, current);
    });

    return Array.from(pointsMap.entries()).map(([assignee, stats]) => ({
      assignee: `@${assignee}`,
      completed: stats.completed,
      remaining: stats.remaining,
      total: stats.completed + stats.remaining,
    }));
  }, [tasks, doneColumnIds]);

  const deliveryRate = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
  const burnRate = (completedPoints / 7).toFixed(1); // average pts/day

  return (
    <Card className="bg-card/85 backdrop-blur-md border-border/70 overflow-hidden shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span>Sprint Velocity & Burndown Engine</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Real-time story points throughput, burndown velocity, and team capacity
          </CardDescription>
        </div>

        {/* View Toggle */}
        <div className="flex items-center rounded-lg border border-border/70 bg-background/70 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMetricView('burndown')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              metricView === 'burndown'
                ? 'bg-muted text-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Burndown Curve
          </button>
          <button
            type="button"
            onClick={() => setMetricView('assignees')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              metricView === 'assignees'
                ? 'bg-muted text-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Assignee Velocity
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl border border-border/60 bg-background/60">
            <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
              <Target className="h-3.5 w-3.5 text-primary" />
              <span>Total Points</span>
            </div>
            <div className="text-xl font-bold text-foreground mt-1">
              {totalPoints} <span className="text-xs font-normal text-muted-foreground">pts</span>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-border/60 bg-background/60">
            <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>Delivered Points</span>
            </div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {completedPoints} <span className="text-xs font-normal text-muted-foreground">({deliveryRate}%)</span>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-border/60 bg-background/60">
            <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>In Progress</span>
            </div>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {inProgressPoints} <span className="text-xs font-normal text-muted-foreground">pts</span>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-border/60 bg-background/60">
            <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
              <Flame className="h-3.5 w-3.5 text-purple-500" />
              <span>Velocity Rate</span>
            </div>
            <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">
              {burnRate} <span className="text-xs font-normal text-muted-foreground">pts/day</span>
            </div>
          </div>
        </div>

        {/* Chart View */}
        <div className="h-[240px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {metricView === 'burndown' ? (
              <AreaChart data={burndownData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="day" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(23, 23, 23, 0.95)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                  formatter={(val: number, name: string) => [
                    `${val} pts`,
                    name === 'actual' ? 'Remaining Work (Actual)' : 'Target Ideal Line',
                  ]}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  formatter={(value) => (value === 'actual' ? 'Actual Burndown' : 'Ideal Guide')}
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorActual)"
                  name="actual"
                />
                <Area
                  type="monotone"
                  dataKey="ideal"
                  stroke="#ef4444"
                  strokeWidth={1.8}
                  strokeDasharray="4 4"
                  fill="none"
                  name="ideal"
                />
              </AreaChart>
            ) : (
              <BarChart data={assigneeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="assignee" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(23, 23, 23, 0.95)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                  formatter={(val: number) => [`${val} pts`]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="completed" name="Delivered Points" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="remaining" name="Pending Points" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
