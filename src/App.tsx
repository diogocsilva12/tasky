<<<<<<< HEAD
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { AccessPendingPage } from './components/auth/AccessPendingPage';
import { AdminPage } from './pages/AdminPage';
import { LandingPage } from './pages/LandingPage';
import { ProjectSwitcher } from './components/projects/ProjectSwitcher';
import { ProjectHeader } from './components/projects/ProjectHeader';
import { BoardFilters } from './components/kanban/BoardFilters';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { ThemeToggle } from './components/ThemeToggle';
import { SyncStatusButton } from './components/sync/SyncStatusButton';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import { boardStore } from './store/boardStore';
import {
  CheckSquare,
  LayoutDashboard,
  BarChart3,
  ShieldCheck,
  RotateCcw,
  LogOut,
  Github,
} from 'lucide-react';

type ActiveView = 'board' | 'resume' | 'admin';

function MainApp() {
  const { user, authState, logout } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>('board');
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
=======
import LandingPage from './pages/LandingPage';
>>>>>>> feature/analytics-sync

  return (
<<<<<<< HEAD
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/80 bg-background/95 px-3 sm:px-6 backdrop-blur-md">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => setActiveView('board')}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <CheckSquare className="h-4 w-4" />
            </div>
            <span className="font-bold text-base tracking-tight hidden sm:inline">
              Tasky
            </span>
          </div>

          <div className="h-4 w-px bg-border/80 hidden sm:block" />

          {/* View Switcher Tabs */}
          <nav className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/40">
            <Button
              variant={activeView === 'board' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('board')}
              className="h-7 px-2.5 text-xs gap-1.5"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Board</span>
            </Button>
            <Button
              variant={activeView === 'resume' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('resume')}
              className="h-7 px-2.5 text-xs gap-1.5"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Resume & Stats</span>
            </Button>
            {(user?.isAdmin || authState === 'admin') && (
              <Button
                variant={activeView === 'admin' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('admin')}
                className="h-7 px-2.5 text-xs gap-1.5 text-primary"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Admin Gate</span>
              </Button>
            )}
          </nav>

          {/* Project Switcher (When on Board View) */}
          {activeView === 'board' && (
            <div className="hidden md:flex items-center">
              <div className="h-4 w-px bg-border/80 mx-2" />
              <ProjectSwitcher />
            </div>
          )}
        </div>

        {/* Right Nav Utilities */}
        <div className="flex items-center gap-2">
          {/* Sync Button */}
          <div className="hidden sm:block">
            <SyncStatusButton />
          </div>

          {/* Reset Demo Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => boardStore.resetToSampleData()}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground hidden lg:flex items-center gap-1"
            title="Reset board to sample seed data"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Demo</span>
          </Button>

          {/* GitHub Repo Direct Link */}
          <a
            href="https://github.com/diogocsilva12/tasky"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="GitHub Repository"
          >
            <Github className="h-4 w-4" />
          </a>

          {/* Multi-Theme Selector */}
          <ThemeToggle />

          <div className="h-4 w-px bg-border/80 mx-1" />

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Avatar className="h-7 w-7 border border-border">
                <AvatarImage src={user?.avatarUrl} alt={user?.username} />
                <AvatarFallback>
                  {user?.username?.slice(0, 2).toUpperCase() || 'US'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs font-semibold leading-tight line-clamp-1">
                  {user?.username}
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight">
                  {user?.isAdmin ? 'Admin' : 'Member'}
                </span>
              </div>
            </div>

            {user?.isAdmin && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 hidden sm:inline-flex">
                Admin
              </Badge>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              title="Log out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area based on Active View */}
      {activeView === 'board' && (
        <>
          <ProjectHeader
            onOpenNewTask={() => setTaskModalOpen(true)}
            onOpenAddColumn={() => setColumnModalOpen(true)}
          />
          <BoardFilters />
          <main className="flex-1 flex flex-col min-h-0 bg-background/40">
            <KanbanBoard
              taskModalOpen={taskModalOpen}
              setTaskModalOpen={setTaskModalOpen}
              columnModalOpen={columnModalOpen}
              setColumnModalOpen={setColumnModalOpen}
            />
          </main>
        </>
      )}

      {activeView === 'resume' && (
        <main className="flex-1 overflow-y-auto">
          <LandingPage onNavigateToBoard={() => setActiveView('board')} />
        </main>
      )}

      {activeView === 'admin' && (
        <main className="flex-1 overflow-y-auto">
          <AdminPage />
        </main>
      )}
    </div>
=======
    <LandingPage />
>>>>>>> feature/analytics-sync
  );
}

function AppContent() {
  const { authState } = useAuth();

  if (authState === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs text-muted-foreground tracking-wider uppercase">Loading Tasky...</span>
        </div>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return <LoginPage />;
  }

  if (authState === 'pending') {
    return <AccessPendingPage />;
  }

  return <MainApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
