import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useBoardStore } from '@/store/boardStore';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/components/theme-provider';
import { getAccessibleProjects } from '@/lib/projectAccess';
import type { Task, Theme, Priority } from '@/types';
import {
  Search,
  LayoutDashboard,
  Calendar,
  BarChart3,
  ShieldCheck,
  Plus,
  FolderPlus,
  Palette,
  ArrowRight,
  X,
  Command,
  FileText,
  Share2,
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (view: 'board' | 'timeline' | 'resume' | 'admin') => void;
  onSelectTask: (task: Task) => void;
  onNewTask: () => void;
  onNewProject: () => void;
  onExportData?: () => void;
}

interface PaletteItem {
  id: string;
  category: 'views' | 'actions' | 'projects' | 'themes' | 'tasks';
  categoryLabel: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  action: () => void;
}

const THEMES: { id: Theme; label: string }[] = [
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
  { id: 'midnight', label: 'Midnight Blue' },
  { id: 'slate', label: 'Slate' },
  { id: 'zinc', label: 'Zinc Minimal' },
  { id: 'cyberpunk', label: 'Cyberpunk Neon' },
  { id: 'monokai', label: 'Monokai Pro' },
];

const PRIORITY_COLORS: Record<Priority, string> = {
  P0: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
  P1: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
  P2: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  P3: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  P4: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
};

export function CommandPalette({
  open,
  onOpenChange,
  onNavigate,
  onSelectTask,
  onNewTask,
  onNewProject,
  onExportData,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { projects, tasks, setActiveProject } = useBoardStore();
  const { user, authState } = useAuth();
  const { theme, setTheme } = useTheme();

  const isAdmin = authState === 'admin' || user?.role === 'super-admin' || user?.role === 'admin';
  const accessibleProjects = useMemo(() => getAccessibleProjects(projects, user), [projects, user]);

  // Global keydown listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      } else if (e.key === 'Escape' && open) {
        e.preventDefault();
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Build items list based on query
  const items = useMemo<PaletteItem[]>(() => {
    const q = query.trim().toLowerCase();
    const result: PaletteItem[] = [];

    // Views
    const views: PaletteItem[] = [
      {
        id: 'view-board',
        category: 'views',
        categoryLabel: 'Navigation',
        title: 'Kanban Board View',
        subtitle: 'Switch to interactive Kanban task board',
        icon: <LayoutDashboard className="h-4 w-4 text-primary" />,
        action: () => {
          onNavigate('board');
          onOpenChange(false);
        },
      },
      {
        id: 'view-timeline',
        category: 'views',
        categoryLabel: 'Navigation',
        title: 'Timeline & Gantt View',
        subtitle: 'View chronological schedule, deadlines & milestones',
        icon: <Calendar className="h-4 w-4 text-emerald-500" />,
        action: () => {
          onNavigate('timeline');
          onOpenChange(false);
        },
      },
      {
        id: 'view-resume',
        category: 'views',
        categoryLabel: 'Navigation',
        title: 'Executive Resume & Analytics',
        subtitle: 'Executive blockers summary and productivity charts',
        icon: <BarChart3 className="h-4 w-4 text-indigo-500" />,
        action: () => {
          onNavigate('resume');
          onOpenChange(false);
        },
      },
    ];

    if (isAdmin) {
      views.push({
        id: 'view-admin',
        category: 'views',
        categoryLabel: 'Navigation',
        title: 'Admin Gatekeeper & Pass-List',
        subtitle: 'Manage authorized users and approve access requests',
        icon: <ShieldCheck className="h-4 w-4 text-amber-500" />,
        action: () => {
          onNavigate('admin');
          onOpenChange(false);
        },
      });
    }

    result.push(...views.filter((v) => !q || v.title.toLowerCase().includes(q) || v.subtitle?.toLowerCase().includes(q)));

    // Actions
    const actions: PaletteItem[] = [
      {
        id: 'action-new-task',
        category: 'actions',
        categoryLabel: 'Actions',
        title: 'Create New Task',
        subtitle: 'Add a new ticket with priority and checklist',
        icon: <Plus className="h-4 w-4 text-emerald-500" />,
        action: () => {
          onNewTask();
          onOpenChange(false);
        },
      },
      {
        id: 'action-new-project',
        category: 'actions',
        categoryLabel: 'Actions',
        title: 'Create New Project',
        subtitle: 'Set up a new workspace board or connect a repository',
        icon: <FolderPlus className="h-4 w-4 text-primary" />,
        action: () => {
          onNewProject();
          onOpenChange(false);
        },
      },
      {
        id: 'action-export-suite',
        category: 'actions',
        categoryLabel: 'Actions',
        title: 'Export & Backup Suite',
        subtitle: 'Export workspace data to JSON backup, CSV spreadsheet, or Markdown changelog',
        icon: <Share2 className="h-4 w-4 text-purple-500" />,
        action: () => {
          onExportData?.();
          onOpenChange(false);
        },
      },
    ];

    result.push(...actions.filter((a) => !q || a.title.toLowerCase().includes(q) || a.subtitle?.toLowerCase().includes(q)));

    // Projects
    accessibleProjects.forEach((proj) => {
      if (!q || proj.name.toLowerCase().includes(q) || proj.description?.toLowerCase().includes(q)) {
        result.push({
          id: `proj-${proj.id}`,
          category: 'projects',
          categoryLabel: 'Projects',
          title: proj.name,
          subtitle: proj.description || (proj.repoName ? `${proj.repoOwner}/${proj.repoName}` : undefined),
          icon: <FolderPlus className="h-4 w-4 text-blue-500" />,
          badge: proj.visibility === 'private' ? 'Private' : 'Public',
          badgeColor: proj.visibility === 'private' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'bg-muted text-muted-foreground',
          action: () => {
            setActiveProject(proj.id);
            onNavigate('board');
            onOpenChange(false);
          },
        });
      }
    });

    // Themes (if query matches theme or query contains 'theme')
    if (q.includes('theme') || q.includes('color') || q.includes('dark') || q.includes('light')) {
      THEMES.forEach((t) => {
        result.push({
          id: `theme-${t.id}`,
          category: 'themes',
          categoryLabel: 'Themes',
          title: `Theme: ${t.label}`,
          subtitle: theme === t.id ? 'Currently active' : 'Click to apply theme',
          icon: <Palette className="h-4 w-4 text-purple-500" />,
          badge: theme === t.id ? 'Active' : undefined,
          action: () => {
            setTheme(t.id);
            onOpenChange(false);
          },
        });
      });
    }

    // Tasks (matching search query)
    if (q.length > 1) {
      const matchedTasks = tasks.filter((t) => {
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q);
        const matchesIssue = t.githubIssueNumber !== undefined && `#${t.githubIssueNumber}`.includes(q);
        const matchesPr = t.githubPrNumber !== undefined && `pr#${t.githubPrNumber}`.includes(q);
        const matchesBranch = t.branchName?.toLowerCase().includes(q);
        const matchesTag = t.tags?.some((tag) => tag.toLowerCase().includes(q));
        const matchesPriority = t.priority.toLowerCase() === q;
        return matchesTitle || matchesDesc || matchesIssue || matchesPr || matchesBranch || matchesTag || matchesPriority;
      });

      matchedTasks.slice(0, 10).forEach((t) => {
        const parentProject = projects.find((p) => p.id === t.projectId);
        result.push({
          id: `task-${t.id}`,
          category: 'tasks',
          categoryLabel: 'Tasks',
          title: t.title,
          subtitle: `${parentProject?.name || 'Project'} • ${t.branchName ? t.branchName : 'No branch'}`,
          icon: <FileText className="h-4 w-4 text-muted-foreground" />,
          badge: t.priority,
          badgeColor: PRIORITY_COLORS[t.priority],
          action: () => {
            if (t.projectId) {
              setActiveProject(t.projectId);
            }
            onSelectTask(t);
            onOpenChange(false);
          },
        });
      });
    }

    return result;
  }, [query, accessibleProjects, projects, tasks, isAdmin, theme, onNavigate, onNewTask, onNewProject, onSelectTask, onExportData, setActiveProject, setTheme, onOpenChange]);

  // Keep selected index within bounds
  useEffect(() => {
    if (selectedIndex >= items.length) {
      setSelectedIndex(Math.max(0, items.length - 1));
    }
  }, [items.length, selectedIndex]);

  // Handle arrow navigation and enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[selectedIndex]) {
        items[selectedIndex].action();
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl) return;
    const activeEl = listEl.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement | null;
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 p-4 animate-in fade-in duration-150"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-2xl bg-card/90 backdrop-blur-md border border-border/70 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/70 bg-background/50">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, task title, #issue, project, or view..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent border-none outline-hidden text-sm sm:text-base text-foreground placeholder:text-muted-foreground"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 divide-y divide-border/20">
          {items.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Command className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No matching commands or tasks found</p>
              <p className="text-xs text-muted-foreground/80 mt-1">
                Try searching for a view, task name, or type "theme" to switch colors
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {items.map((item, index) => {
                const isSelected = index === selectedIndex;
                const prevItem = items[index - 1];
                const showHeader = !prevItem || prevItem.categoryLabel !== item.categoryLabel;

                return (
                  <React.Fragment key={item.id}>
                    {showHeader && (
                      <div className="px-2 pt-2 pb-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase select-none">
                        {item.categoryLabel}
                      </div>
                    )}
                    <div
                      data-index={index}
                      onClick={() => item.action()}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'hover:bg-muted/70 text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                            isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted border border-border/60'
                          }`}
                        >
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium leading-tight">
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div
                              className={`truncate text-[11px] leading-tight mt-0.5 ${
                                isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                              }`}
                            >
                              {item.subtitle}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                              item.badgeColor || (isSelected ? 'bg-primary-foreground/20 text-primary-foreground border-transparent' : 'bg-muted border-border/60 text-muted-foreground')
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        <ArrowRight
                          className={`h-3 w-3 transition-opacity ${
                            isSelected ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border/60 bg-muted/30 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-muted border border-border/60 font-mono text-[9px]">↑↓</kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-muted border border-border/60 font-mono text-[9px]">↵</kbd>
              <span>Select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-muted border border-border/60 font-mono text-[9px]">ESC</kbd>
              <span>Close</span>
            </span>
          </div>
          <span className="font-medium text-primary flex items-center gap-1">
            <Command className="h-3 w-3" />
            <span>Tasky Spotlight</span>
          </span>
        </div>
      </div>
    </div>
  );
}
