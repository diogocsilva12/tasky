import { useState, useEffect } from 'react';
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
import { TimelineView } from './components/timeline/TimelineView';
import { CommandPalette } from './components/CommandPalette';
import { CreateProjectModal } from './components/projects/CreateProjectModal';
import { ExportModal } from './components/export/ExportModal';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import { useBoardStore } from './store/boardStore';
import { canUserAccessProject, getAccessibleProjects } from './lib/projectAccess';
import { GithubIcon } from './components/icons/GithubIcon';
import type { Task } from './types';
import {
  CheckSquare,
  LayoutDashboard,
  Calendar,
  BarChart3,
  ShieldCheck,
  LogOut,
  Lock,
  Command,
  Share2,
} from 'lucide-react';

type ActiveView = 'board' | 'timeline' | 'resume' | 'admin';

function MainApp() {
  const { user, authState, logout } = useAuth();
  const { projects, activeProject, setActiveProject } = useBoardStore();
  const [activeView, setActiveView] = useState<ActiveView>('board');
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedTaskForBoard, setSelectedTaskForBoard] = useState<Task | null>(null);

  const isAdmin = authState === 'admin' || user?.role === 'super-admin' || user?.role === 'admin';
  const accessibleProjects = getAccessibleProjects(projects, user);
  const canAccessCurrent = activeProject ? canUserAccessProject(activeProject, user) : false;

  useEffect(() => {
    if (activeProject && !canAccessCurrent && accessibleProjects.length > 0) {
      setActiveProject(accessibleProjects[0].id);
    }
  }, [activeProject, canAccessCurrent, accessibleProjects, setActiveProject]);

  return (
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
              className="h-7 px-2.5 text-xs gap-1.5 cursor-pointer"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Board</span>
            </Button>
            <Button
              variant={activeView === 'timeline' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('timeline')}
              className="h-7 px-2.5 text-xs gap-1.5 cursor-pointer"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Timeline</span>
            </Button>
            <Button
              variant={activeView === 'resume' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('resume')}
              className="h-7 px-2.5 text-xs gap-1.5 cursor-pointer"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Resume & Stats</span>
            </Button>
            {isAdmin && (
              <Button
                variant={activeView === 'admin' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('admin')}
                className="h-7 px-2.5 text-xs gap-1.5 text-primary cursor-pointer"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Admin Gate</span>
              </Button>
            )}
          </nav>

          {/* Project Switcher (When on Board or Timeline View) */}
          {(activeView === 'board' || activeView === 'timeline') && (
            <div className="hidden md:flex items-center">
              <div className="h-4 w-px bg-border/80 mx-2" />
              <ProjectSwitcher />
            </div>
          )}
        </div>

        {/* Right Nav Utilities */}
        <div className="flex items-center gap-2">
          {/* Spotlight / Command Palette trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCommandPaletteOpen(true)}
            className="h-8 px-2.5 text-xs gap-2 text-muted-foreground hover:text-foreground bg-muted/40 border-border/60 hidden lg:inline-flex cursor-pointer"
            title="Open Command Palette (⌘K)"
          >
            <Command className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs">Search...</span>
            <kbd className="text-[10px] font-mono px-1 py-0.2 rounded bg-muted border border-border/60">⌘K</kbd>
          </Button>

          {/* Export & Backup Suite Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportModalOpen(true)}
            className="h-8 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground bg-muted/40 border-border/60 hidden sm:inline-flex cursor-pointer"
            title="Export & Backup Data (JSON, CSV, Markdown)"
          >
            <Share2 className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs">Export</span>
          </Button>

          {/* Sync Button */}
          <div className="hidden sm:block">
            <SyncStatusButton />
          </div>

          {/* GitHub Repo Direct Link */}
          <a
            href="https://github.com/diogocsilva12/tasky"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="GitHub Repository"
          >
            <GithubIcon className="h-4 w-4" />
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
                  {isAdmin ? 'Admin' : 'Member'}
                </span>
              </div>
            </div>

            {isAdmin && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 hidden sm:inline-flex">
                Admin
              </Badge>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer"
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
          {canAccessCurrent ? (
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
                  selectedTask={selectedTaskForBoard}
                  onClearSelectedTask={() => setSelectedTaskForBoard(null)}
                />
              </main>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background/40">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-4 shadow-sm">
                <Lock className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold tracking-tight mb-2">Private Board Restricted</h2>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                This project board is private and restricted. You do not currently have permission to view or manage it.
              </p>
              {accessibleProjects.length > 0 ? (
                <Button
                  onClick={() => setActiveProject(accessibleProjects[0].id)}
                  className="gap-2 text-xs cursor-pointer"
                >
                  Switch to {accessibleProjects[0].name}
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Contact an administrator or project owner to request access to this board.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {activeView === 'timeline' && (
        <>
          {canAccessCurrent ? (
            <>
              <ProjectHeader
                onOpenNewTask={() => setTaskModalOpen(true)}
                onOpenAddColumn={() => setColumnModalOpen(true)}
              />
              <BoardFilters />
              <main className="flex-1 flex flex-col min-h-0 bg-background/40">
                <TimelineView
                  onNewTask={() => setTaskModalOpen(true)}
                />
              </main>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background/40">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-4 shadow-sm">
                <Lock className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold tracking-tight mb-2">Private Board Restricted</h2>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                This project board is private and restricted. You do not currently have permission to view or manage it.
              </p>
              {accessibleProjects.length > 0 ? (
                <Button
                  onClick={() => setActiveProject(accessibleProjects[0].id)}
                  className="gap-2 text-xs cursor-pointer"
                >
                  Switch to {accessibleProjects[0].name}
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Contact an administrator or project owner to request access to this board.
                </p>
              )}
            </div>
          )}
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

      {/* Global Command Palette (⌘K) */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onNavigate={(view) => setActiveView(view)}
        onSelectTask={(task) => {
          setSelectedTaskForBoard(task);
          setActiveView('board');
        }}
        onNewTask={() => {
          setActiveView('board');
          setTaskModalOpen(true);
        }}
        onNewProject={() => setCreateProjectModalOpen(true)}
        onExportData={() => setExportModalOpen(true)}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        open={createProjectModalOpen}
        onOpenChange={setCreateProjectModalOpen}
      />

      {/* Export & Backup Suite Modal */}
      <ExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
      />
    </div>
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
