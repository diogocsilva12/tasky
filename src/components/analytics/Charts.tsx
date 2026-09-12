import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Task } from '../../types/index';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartsProps {
  tasks: Task[];
}

const PRIORITY_COLORS: Record<string, string> = {
  P0: '#ef4444', // red-500
  P1: '#f97316', // orange-500
  P2: '#eab308', // yellow-500
  P3: '#3b82f6', // blue-500
  P4: '#94a3b8', // slate-400
};

export const AnalyticsCharts: React.FC<ChartsProps> = ({ tasks }) => {
  const priorityData = ['P0', 'P1', 'P2', 'P3', 'P4'].map(p => ({
    name: p,
    value: tasks.filter(t => t.priority === p).length,
  })).filter(d => d.value > 0);

  const statusMap = {
    'todo': 'To Do',
    'in-progress': 'In Progress',
    'done': 'Done',
  };

  const statusData = Object.entries(statusMap).map(([key, label]) => ({
    name: label,
    count: tasks.filter(t => t.columnId === key).length,
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Priority Distribution</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
