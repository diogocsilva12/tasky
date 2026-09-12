import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Task, Project } from '../../types/index';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ChartsProps {
  tasks: Task[];
  projects?: Project[];
}

const PRIORITY_COLORS: Record<string, string> = {
  P0: '#ef4444', // red-500
  P1: '#f97316', // orange-500
  P2: '#eab308', // yellow-500
  P3: '#3b82f6', // blue-500
  P4: '#10b981', // emerald-500
};

export const AnalyticsCharts: React.FC<ChartsProps> = ({ tasks, projects = [] }) => {
  const priorityData = ['P0', 'P1', 'P2', 'P3', 'P4']
    .map((p) => ({
      name: p,
      value: tasks.filter((t) => t.priority === p).length,
    }))
    .filter((d) => d.value > 0);

  // Map column IDs to column titles from projects
  const columnTitleById = new Map<string, string>();
  projects.forEach((p) => {
    p.columns.forEach((c) => {
      columnTitleById.set(c.id, c.title);
    });
  });

  // Calculate dynamic status counts
  const statusCounts = new Map<string, number>();

  if (tasks.length > 0) {
    tasks.forEach((t) => {
      let colName = columnTitleById.get(t.columnId);
      if (!colName) {
        if (t.columnId.toLowerCase().includes('done')) colName = 'Done';
        else if (t.columnId.toLowerCase().includes('progress')) colName = 'In Progress';
        else colName = 'To Do';
      }
      statusCounts.set(colName, (statusCounts.get(colName) || 0) + 1);
    });
  }

  const statusData = Array.from(statusCounts.entries()).map(([name, count]) => ({
    name,
    count,
  }));

  if (tasks.length === 0) {
    return (
      <Card className="p-8 text-center bg-card/85 backdrop-blur-md border-border/70">
        <p className="text-sm text-muted-foreground">
          No tasks found. Add tasks to your projects or import from GitHub to view priority and status charts.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="bg-card/85 backdrop-blur-md border-border/70">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Priority Distribution</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-[220px] w-full flex items-center justify-center">
            {priorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-muted-foreground">No priority data</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/85 backdrop-blur-md border-border/70">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Status & Workflow Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] w-full flex items-center justify-center">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <XAxis
                    dataKey="name"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    stroke="currentColor"
                    className="opacity-70"
                  />
                  <YAxis
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    stroke="currentColor"
                    className="opacity-70"
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="currentColor" className="text-primary" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-muted-foreground">No workflow data</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
