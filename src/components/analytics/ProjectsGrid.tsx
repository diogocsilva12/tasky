import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Project, Task } from '../../types/index';
import { ExternalLink, GitBranch, LayoutDashboard } from 'lucide-react';

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
        const completed = projectTasks.filter(t => t.columnId === 'done').length;
        const progress = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;

        return (
          <Card key={project.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span className="truncate">{project.name}</span>
                {project.githubUrl && (
                  <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <GitBranch className="w-4 h-4 mr-2" />
                {project.activeBranch || project.defaultBranch || 'main'}
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
