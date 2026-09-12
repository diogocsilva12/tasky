import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Task, Project } from '../../types/index';
import { ArrowRight, ExternalLink, GitBranch, Ban, AlertCircle } from 'lucide-react';
import { getCleanRepoDetails } from '../../lib/githubUrl';

interface ExecutiveResumeProps {
  tasks: Task[];
  projects: Project[];
  onNavigateToBoard?: (projectId: string) => void;
}

export const ExecutiveResume: React.FC<ExecutiveResumeProps> = ({
  tasks,
  projects,
  onNavigateToBoard,
}) => {
  // Collect all done columns across projects
  const doneColumnIds = new Set(
    projects
      .flatMap((p) => p.columns)
      .filter(
        (c) =>
          c.title.toLowerCase().includes('done') ||
          c.title.toLowerCase().includes('ship') ||
          c.title.toLowerCase().includes('finish') ||
          c.id === 'done'
      )
      .map((c) => c.id)
  );

  // High-priority or blocked tasks that are not done
  const highPriorityTasks = tasks.filter((t) => {
    const isDone = doneColumnIds.has(t.columnId);
    return !isDone && (t.priority === 'P0' || t.priority === 'P1' || t.isBlocked);
  });

  return (
    <Card className="border border-red-500/30 bg-card/85 backdrop-blur-md shadow-md overflow-hidden">
      <CardHeader className="bg-red-500/10 border-b border-red-500/20 pb-4">
        <CardTitle className="text-xl flex items-center space-x-2 text-red-600 dark:text-red-400">
          <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse"></span>
          <span>Executive High-Priority & Blockers Resume</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5">
        {highPriorityTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No active blockers or critical P0/P1 tasks. All systems running smoothly!
          </p>
        ) : (
          <div className="space-y-4">
            {highPriorityTasks.map((task) => {
              const project = projects.find((p) => p.id === task.projectId);
              const repoDetails = project ? getCleanRepoDetails(project) : null;
              const branchUrl =
                repoDetails && task.branchName ? repoDetails.branchUrl(task.branchName) : null;
              const directUrl = task.githubUrl
                ? getCleanRepoDetails({ githubUrl: task.githubUrl }).repoUrl
                : repoDetails?.repoUrl;

              return (
                <div
                  key={task.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0 gap-4"
                >
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <Badge
                        variant={task.priority === 'P0' ? 'destructive' : 'default'}
                        className="uppercase text-[10px]"
                      >
                        {task.priority}
                      </Badge>

                      {task.isBlocked && (
                        <Badge
                          variant="destructive"
                          className="gap-1 text-[10px] bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30"
                        >
                          <Ban className="h-2.5 w-2.5" />
                          <span>Blocked</span>
                        </Badge>
                      )}

                      <span className="font-semibold text-sm truncate">{task.title}</span>
                    </div>

                    {task.isBlocked && task.blockerReason && (
                      <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-0.5 max-w-xl font-medium">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span className="truncate">Blocker: {task.blockerReason}</span>
                      </div>
                    )}

                    <div className="flex items-center text-xs text-muted-foreground space-x-3 flex-wrap gap-y-1">
                      <span className="font-medium text-foreground/80">
                        {project?.name || 'Tasky Project'}
                      </span>
                      {task.branchName && (
                        <span className="flex items-center">
                          <GitBranch className="w-3 h-3 mr-1 text-primary/80" />
                          {branchUrl ? (
                            <a
                              href={branchUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-primary transition-colors inline-flex items-center gap-0.5"
                            >
                              <span>{task.branchName}</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                            </a>
                          ) : (
                            <span>{task.branchName}</span>
                          )}
                        </span>
                      )}
                      {task.assignees.length > 0 && (
                        <span>Assigned to: {task.assignees.map((a) => a.username).join(', ')}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {directUrl && (
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={directUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open repo on GitHub"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigateToBoard?.(task.projectId)}
                      className="whitespace-nowrap cursor-pointer text-xs"
                    >
                      Jump to Board <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
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
