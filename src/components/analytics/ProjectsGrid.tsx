import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Project, Task } from '../../types/index';
import { ExternalLink, GitBranch, LayoutDashboard } from 'lucide-react';
import { getCleanRepoDetails } from '../../lib/githubUrl';

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
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span className="truncate">{project.name}</span>
                {repoDetails.repoUrl && (
                  <a
                    href={repoDetails.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                    title="Open repository on GitHub"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </CardTitle>
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
