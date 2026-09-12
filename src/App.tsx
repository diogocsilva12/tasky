import { useState } from 'react';
import { ProjectSwitcher } from './components/projects/ProjectSwitcher';
import { ProjectHeader } from './components/projects/ProjectHeader';
import { BoardFilters } from './components/kanban/BoardFilters';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { ThemeToggle } from './components/ThemeToggle';
import { CheckSquare, RotateCcw } from 'lucide-react';
import { GithubIcon } from './components/icons/GithubIcon';
import { Button } from './components/ui/button';
import { boardStore } from './store/boardStore';

export default function App() {
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [columnModalOpen, setColumnModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/80 bg-background/95 px-4 sm:px-6 backdrop-blur-md">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <CheckSquare className="h-4 w-4" />
            </div>
            <span className="font-bold text-base tracking-tight hidden sm:inline">
              Tasky
            </span>
          </div>

          <div className="h-4 w-px bg-border/80" />

          {/* Project Switcher */}
          <ProjectSwitcher />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => boardStore.resetToSampleData()}
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground hidden md:flex items-center gap-1.5"
            title="Reset to sample seed data"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Demo</span>
          </Button>

          <a
            href="https://github.com/diogocsilva12/tasky"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="GitHub repository"
          >
            <GithubIcon className="h-4 w-4" />
          </a>

          <ThemeToggle />
        </div>
      </header>

      {/* Project Header Bar */}
      <ProjectHeader
        onOpenNewTask={() => setTaskModalOpen(true)}
        onOpenAddColumn={() => setColumnModalOpen(true)}
      />

      {/* Board Filter Bar */}
      <BoardFilters />

      {/* Main Kanban Board */}
      <main className="flex-1 flex flex-col min-h-0 bg-background/40">
        <KanbanBoard
          taskModalOpen={taskModalOpen}
          setTaskModalOpen={setTaskModalOpen}
          columnModalOpen={columnModalOpen}
          setColumnModalOpen={setColumnModalOpen}
        />
      </main>
    </div>
  );
}
