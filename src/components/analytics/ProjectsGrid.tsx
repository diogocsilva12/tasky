import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import type { Project, Task } from '../../types/index';
import { ExternalLink, GitBranch, LayoutDashboard, Lock, Globe, Calendar } from 'lucide-react';
import { getCleanRepoDetails } from '../../lib/githubUrl';
import { getDeadlineStatus } from '../../lib/dateUtils';

interface ProjectsGridProps {
  projects: Project[];
  tasks: Task[];
  onSelectProject?: (projectId: string) => void;
}

export const ProjectsGrid: React.FC<ProjectsGridProps> = ({ projects, tasks, onSelectProject }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map(project => {
        const projectTasks = tasks.filter(t => t.projectId === project.id);
        const doneColumnIds = new Set(
          project.columns
            .filter(
              (c) =>
                c.title.toLowerCase().includes('done') ||
                c.title.toLowerCase().includes('ship') ||
                c.title.toLowerCase().includes('finish') ||
                c.id === 'done'
            )
            .map((c) => c.id)
        );
        const completed = projectTasks.filter((t) => doneColumnIds.has(t.columnId)).length;
        const progress = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;
        const blockedCount = projectTasks.filter((t) => t.isBlocked).length;

        const repoDetails = getCleanRepoDetails(project);
        const branchUrl = repoDetails.branchUrl();

        return (
          <Card key={project.id} className="flex flex-col bg-card/85 backdrop-blur-md border-border/70 hover:shadow-md transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="truncate text-base">{project.name}</CardTitle>
                <div className="flex items-center gap-2 shrink-0">
                  {project.visibility === 'private' ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                      <Lock className="h-2.5 w-2.5" /> Private
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                      <Globe className="h-2.5 w-2.5" /> Public
                    </span>
                  )}
                  {repoDetails.repoUrl && (
                    <a
                      href={repoDetails.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-accent transition-colors"
                      title="Open repository on GitHub"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center">
                  <GitBranch className="w-4 h-4 mr-2" />
                  {branchUrl ? (
                    <a
                      href={branchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors inline-flex items-center gap-1"
                      title="Open branch on GitHub"
                    >
                      <span>{project.activeBranch || project.defaultBranch || 'main'}</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  ) : (
                    <span>{project.activeBranch || project.defaultBranch || 'main'}</span>
                  )}
                </div>
                {blockedCount > 0 && (
                  <span className="text-xs text-red-600 dark:text-red-400 font-semibold">
                    {blockedCount} blocked
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Progress</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Target Deadline */}
              {project.deadline && (() => {
                const deadlineStatus = getDeadlineStatus(project.deadline);
                return (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                    <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span>Target Deadline</span>
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${deadlineStatus.badgeClass}`}>
                      {deadlineStatus.formattedDate} ({deadlineStatus.label})
                    </span>
                  </div>
                );
              })()}
            </CardContent>
            <CardFooter>
              <Button
                className="w-full cursor-pointer"
                variant="secondary"
                onClick={() => onSelectProject?.(project.id)}
              >
                <LayoutDashboard className="w-4 h-4 mr-2" /> Open Board
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};
