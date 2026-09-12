import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Task } from '../../types/index';
import { CheckCircle, Clock, AlertTriangle, Layers } from 'lucide-react';

interface KPICardsProps {
  tasks: Task[];
}

export const KPICards: React.FC<KPICardsProps> = ({ tasks }) => {
  const totalTasks = tasks.length;
  const inProgress = tasks.filter(t => t.columnId === 'in-progress').length;
  const completed = tasks.filter(t => t.columnId === 'done').length;
  const completionVelocity = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
  const openBlockers = tasks.filter(t => t.priority === 'P0' && t.columnId !== 'done').length;

  const kpis = [
    {
      title: 'Total Tasks',
      value: totalTasks,
      icon: <Layers className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: 'In-Progress Tasks',
      value: inProgress,
      icon: <Clock className="h-4 w-4 text-blue-500" />,
    },
    {
      title: 'Completion Velocity',
      value: `${completionVelocity}%`,
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
    },
    {
      title: 'Open P0 Blockers',
      value: openBlockers,
      icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi, idx) => (
        <Card key={idx}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {kpi.title}
            </CardTitle>
            {kpi.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
