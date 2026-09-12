import React from 'react';
import { KPICards } from '../components/analytics/KPICards';
import { AnalyticsCharts } from '../components/analytics/Charts';
import { ExecutiveResume } from '../components/analytics/ExecutiveResume';
import { ProjectsGrid } from '../components/analytics/ProjectsGrid';
import { mockTasks, mockProjects } from '../lib/mockData';
import { useBoardStore } from '../store/boardStore';
import { Button } from '../components/ui/button';
import { LayoutDashboard } from 'lucide-react';

interface LandingPageProps {
  onNavigateToBoard?: (projectId?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToBoard }) => {
  const { tasks, projects, setActiveProject } = useBoardStore();

  const displayTasks = tasks.length > 0 ? tasks : mockTasks;
  const displayProjects = projects.length > 0 ? projects : mockProjects;

  const handleSelectProject = (projectId: string) => {
    setActiveProject(projectId);
    onNavigateToBoard?.(projectId);
  };

  return (
    <div className="min-h-full bg-background text-foreground flex flex-col">
      <div className="container mx-auto px-4 py-6 flex items-center justify-between border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Executive Dashboard & Resume</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            High-priority tasks (P0/P1), productivity analytics, and active repository health
          </p>
        </div>
        {onNavigateToBoard && (
          <Button onClick={() => onNavigateToBoard()} className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span>Go to Kanban Board</span>
          </Button>
        )}
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        <section>
          <ExecutiveResume tasks={displayTasks} projects={displayProjects} />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Productivity Overview</h2>
          <KPICards tasks={displayTasks} />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Priority & Status Analytics</h2>
          <AnalyticsCharts tasks={displayTasks} />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Active Projects & Repositories</h2>
          <ProjectsGrid
            projects={displayProjects}
            tasks={displayTasks}
            onSelectProject={handleSelectProject}
          />
        </section>
      </div>
    </div>
  );
};

export default LandingPage;
