import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Task, Project } from '../../types/index';
import { ArrowRight, ExternalLink, GitBranch } from 'lucide-react';

interface ExecutiveResumeProps {
  tasks: Task[];
  projects: Project[];
}

export const ExecutiveResume: React.FC<ExecutiveResumeProps> = ({ tasks, projects }) => {
  const highPriorityTasks = tasks.filter(t => (t.priority === 'P0' || t.priority === 'P1') && t.columnId !== 'done');

  return (
    <Card className="border-red-500/20 shadow-md">
      <CardHeader className="bg-red-500/5 pb-4">
        <CardTitle className="text-xl flex items-center space-x-2 text-red-600 dark:text-red-400">
          <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
          <span>Executive High-Priority Resume</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {highPriorityTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No active critical tasks. All clear!</p>
        ) : (
          <div className="space-y-4">
            {highPriorityTasks.map(task => {
              const project = projects.find(p => p.id === task.projectId);
              return (
                <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 last:border-0 last:pb-0 gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant={task.priority === 'P0' ? 'destructive' : 'default'} className="uppercase">
                        {task.priority}
                      </Badge>
                      <span className="font-semibold text-sm">{task.title}</span>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground space-x-3">
                      <span>{project?.name || 'Unknown Project'}</span>
                      {task.branchName && (
                        <span className="flex items-center">
                          <GitBranch className="w-3 h-3 mr-1" />
                          {task.branchName}
                        </span>
                      )}
                      {task.assignees.length > 0 && (
                        <span>Assigned to: {task.assignees.map(a => a.username).join(', ')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {task.githubUrl && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={task.githubUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="whitespace-nowrap">
                      Jump to Board <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
