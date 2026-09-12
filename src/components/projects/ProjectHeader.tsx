import { useState } from 'react';
import { useBoardStore } from '@/store/boardStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateProjectModal } from './CreateProjectModal';
import { getCleanRepoDetails } from '@/lib/githubUrl';
import { GithubIcon } from '@/components/icons/GithubIcon';
import {
  GitBranch,
  ExternalLink,
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Columns,
} from 'lucide-react';

interface ProjectHeaderProps {
  onOpenNewTask: () => void;
  onOpenAddColumn: () => void;
}

export function ProjectHeader({ onOpenNewTask, onOpenAddColumn }: ProjectHeaderProps) {
  const { activeProject, activeProjectTasks, deleteProject } = useBoardStore();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  if (!activeProject) return null;

  const repoDetails = getCleanRepoDetails(activeProject);
  const repoUrl = repoDetails.repoUrl;
  const activeBranch = activeProject.activeBranch || activeProject.defaultBranch || 'main';
  const branchUrl = repoDetails.branchUrl(activeBranch);

  // Stats calculation
  const totalTasks = activeProjectTasks.length;
  const p0Count = activeProjectTasks.filter((t) => t.priority === 'P0').length;
  const doneColumnIds = activeProject.columns
    .filter((c) => c.title.toLowerCase().includes('done') || c.title.toLowerCase().includes('ship'))
    .map((c) => c.id);
  const doneTasks = activeProjectTasks.filter((t) => doneColumnIds.includes(t.columnId)).length;
  const completionPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const inProgressColumnIds = activeProject.columns
    .filter(
      (c) =>
        c.title.toLowerCase().includes('progress') ||
        c.title.toLowerCase().includes('dev') ||
        c.title.toLowerCase().includes('doing')
    )
    .map((c) => c.id);
  const inProgressTasks = activeProjectTasks.filter((t) =>
    inProgressColumnIds.includes(t.columnId)
  ).length;

  const handleDeleteProject = () => {
    if (confirmDeleteOpen) {
      deleteProject(activeProject.id);
      setConfirmDeleteOpen(false);
    } else {
      setConfirmDeleteOpen(true);
    }
  };

  return (
    <>
      <div className="border-b border-border/70 bg-card/60 px-4 py-4 sm:px-6 backdrop-blur-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Left Column: Project Name, Badges, and Description */}
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {activeProject.name}
              </h1>

              {/* GitHub Repo Badge / Link */}
              {repoUrl && (
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground shadow-xs group"
                  title="Open repository on GitHub"
                >
                  <GithubIcon className="h-3.5 w-3.5 opacity-80 group-hover:opacity-100" />
                  <span>
                    {repoDetails.owner}/{repoDetails.name}
                  </span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground opacity-60 group-hover:opacity-100" />
                </a>
              )}

              {/* Branch Badge / Link */}
              {branchUrl && (
                <a
                  href={branchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 shadow-xs group"
                  title="Open branch on GitHub"
                >
                  <GitBranch className="h-3.5 w-3.5 shrink-0" />
                  <span>{activeBranch}</span>
                  <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                </a>
              )}

              {/* P0 Alert Badge if any exist */}
              {p0Count > 0 && (
                <Badge variant="p0" className="gap-1 animate-pulse">
                  <AlertTriangle className="h-3 w-3" />
                  {p0Count} Critical P0
                </Badge>
              )}
            </div>

            {activeProject.description && (
              <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl line-clamp-2">
                {activeProject.description}
              </p>
            )}
          </div>

          {/* Right Column: Actions & Project Summary */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick Metrics */}
            <div className="hidden md:flex items-center gap-3 border-r border-border/60 pr-3 mr-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                <span className="font-semibold text-foreground">{inProgressTasks}</span> in progress
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span className="font-semibold text-foreground">{doneTasks}/{totalTasks}</span> done ({completionPercent}%)
              </span>
            </div>

            {/* Add Column Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenAddColumn}
              className="h-8 gap-1.5 text-xs border-border/80 hover:bg-accent"
            >
              <Columns className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add Column</span>
            </Button>

            {/* New Task Button */}
            <Button
              size="sm"
              onClick={onOpenNewTask}
              className="h-8 gap-1.5 text-xs font-medium shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Task</span>
            </Button>

            {/* Project Settings Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={() => setEditModalOpen(true)}
                  className="gap-2 text-xs cursor-pointer"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit Project</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDeleteProject}
                  className="gap-2 text-xs text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{confirmDeleteOpen ? 'Confirm Delete?' : 'Delete Project'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <CreateProjectModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        projectToEdit={activeProject}
      />
    </>
  );
}
