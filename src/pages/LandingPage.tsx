import React from 'react';
import { SyncStatusButton } from '../components/sync/SyncStatusButton';
import { KPICards } from '../components/analytics/KPICards';
import { AnalyticsCharts } from '../components/analytics/Charts';
import { ExecutiveResume } from '../components/analytics/ExecutiveResume';
import { ProjectsGrid } from '../components/analytics/ProjectsGrid';
import { mockTasks, mockProjects } from '../lib/mockData';
import { ThemeToggle } from '../components/ThemeToggle';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold tracking-tight">Tasky</h1>
            <span className="text-muted-foreground text-sm hidden sm:inline-block">Executive Dashboard</span>
          </div>
          <div className="flex items-center space-x-4">
            <SyncStatusButton />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 space-y-8">
        <section>
          <ExecutiveResume tasks={mockTasks} projects={mockProjects} />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Productivity Overview</h2>
          <KPICards tasks={mockTasks} />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Analytics</h2>
          <AnalyticsCharts tasks={mockTasks} />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Active Projects</h2>
          <ProjectsGrid projects={mockProjects} tasks={mockTasks} />
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
