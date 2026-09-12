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
import { ProjectAccessModal } from './ProjectAccessModal';
import { ProjectDeadlineModal } from './ProjectDeadlineModal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { getCleanRepoDetails } from '@/lib/githubUrl';
import { getDeadlineStatus } from '@/lib/dateUtils';
import { useAuth } from '@/context/AuthContext';
import { canUserManageProject } from '@/lib/projectAccess';
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
  Ban,
  Globe,
  Lock,
  Shield,
  Calendar,
} from 'lucide-react';

interface ProjectHeaderProps {
  onOpenNewTask: () => void;
  onOpenAddColumn: () => void;
}

export function ProjectHeader({ onOpenNewTask, onOpenAddColumn }: ProjectHeaderProps) {
  const { activeProject, activeProjectTasks, deleteProject } = useBoardStore();
  const { user } = useAuth();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [deadlineModalOpen, setDeadlineModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  if (!activeProject) return null;

  const canManage = canUserManageProject(activeProject, user);
  const isPrivate = activeProject.visibility === 'private';
  const deadlineStatus = getDeadlineStatus(activeProject.deadline);

  const repoDetails = getCleanRepoDetails(activeProject);
  const repoUrl = repoDetails.repoUrl;
  const activeBranch = activeProject.activeBranch || activeProject.defaultBranch || 'main';
  const branchUrl = repoDetails.branchUrl(activeBranch);

  // Stats calculation
  const totalTasks = activeProjectTasks.length;
  const p0Count = activeProjectTasks.filter((t) => t.priority === 'P0').length;
  const blockedCount = activeProjectTasks.filter((t) => t.isBlocked).length;
  const doneColumnIds = activeProject.columns
    .filter((c) => c.title.toLowerCase().includes('done') || c.title.toLowerCase().includes('ship') || c.id === 'done')
    .map((c) => c.id);
  const doneTasks = activeProjectTasks.filter((t) => doneColumnIds.includes(t.columnId)).length;
  const completionPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const inProgressColumnIds = activeProject.columns
    .filter(
      (c) =>
        c.title.toLowerCase().includes('progress') ||
        c.title.toLowerCase().includes('dev') ||
        c.title.toLowerCase().includes('doing') ||
        c.id === 'in-progress'
    )
    .map((c) => c.id);
  const inProgressTasks = activeProjectTasks.filter((t) =>
    inProgressColumnIds.includes(t.columnId)
  ).length;

  return (
    <>
      <div className="border-b border-border/80 bg-card/75 px-4 py-4 sm:px-6 backdrop-blur-md">
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

              {/* Project Visibility Badge */}
              {isPrivate ? (
                <button
                  type="button"
                  onClick={() => canManage && setAccessModalOpen(true)}
                  className={`inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 shadow-xs transition-colors ${
                    canManage ? 'hover:bg-amber-500/20 cursor-pointer' : 'cursor-default'
                  }`}
                  title={canManage ? 'Private Project • Click to manage access' : 'Private Project'}
                >
                  <Lock className="h-3 w-3" />
                  <span>Private</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => canManage && setAccessModalOpen(true)}
                  className={`inline-flex items-center gap-1.5 rounded-md border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 shadow-xs transition-colors ${
                    canManage ? 'hover:bg-blue-500/20 cursor-pointer' : 'cursor-default'
                  }`}
                  title={canManage ? 'Public Project • Click to manage access' : 'Public Project'}
                >
                  <Globe className="h-3 w-3" />
                  <span>Public</span>
                </button>
              )}

              {/* Project Deadline Badge / Action */}
              {activeProject.deadline ? (
                <button
                  type="button"
                  onClick={() => canManage && setDeadlineModalOpen(true)}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs shadow-xs transition-colors ${
                    deadlineStatus.badgeClass
                  } ${canManage ? 'cursor-pointer hover:opacity-85' : 'cursor-default'}`}
                  title={
                    canManage
                      ? `Project Deadline: ${deadlineStatus.formattedDate} • ${deadlineStatus.label} • Click to change deadline`
                      : `Project Deadline: ${deadlineStatus.formattedDate} • ${deadlineStatus.label}`
                  }
                >
                  <Calendar className="h-3 w-3" />
                  <span>
                    Deadline: {deadlineStatus.formattedDate}
                    <span className="opacity-80 font-normal ml-1">({deadlineStatus.label})</span>
                  </span>
                </button>
              ) : canManage ? (
                <button
                  type="button"
                  onClick={() => setDeadlineModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border/80 bg-background/60 hover:bg-primary/10 hover:border-primary/40 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground shadow-xs transition-all cursor-pointer"
                  title="Add target deadline for this project board"
                >
                  <Calendar className="h-3 w-3 text-primary/80" />
                  <span>+ Set Deadline</span>
                </button>
              ) : null}

              {/* P0 Alert Badge if any exist */}
              {p0Count > 0 && (
                <Badge variant="p0" className="gap-1 animate-pulse">
                  <AlertTriangle className="h-3 w-3" />
                  {p0Count} Critical P0
                </Badge>
              )}

              {/* Blocked Badge if any exist */}
              {blockedCount > 0 && (
                <Badge variant="destructive" className="gap-1 bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30">
                  <Ban className="h-3 w-3" />
                  {blockedCount} Blocked
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
              {blockedCount > 0 && (
                <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                  <Ban className="h-3.5 w-3.5" />
                  <span className="font-semibold">{blockedCount}</span> blocked
                </span>
              )}
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
                {canManage && (
                  <DropdownMenuItem
                    onClick={() => setDeadlineModalOpen(true)}
                    className="gap-2 text-xs cursor-pointer"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{activeProject.deadline ? 'Change Deadline' : 'Set Deadline'}</span>
                  </DropdownMenuItem>
                )}
                {canManage && (
                  <DropdownMenuItem
                    onClick={() => setAccessModalOpen(true)}
                    className="gap-2 text-xs cursor-pointer"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    <span>Access & Visibility</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setConfirmDeleteOpen(true)}
                  className="gap-2 text-xs text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Project</span>
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

      <ProjectAccessModal
        open={accessModalOpen}
        onOpenChange={setAccessModalOpen}
        project={activeProject}
      />

      <ProjectDeadlineModal
        open={deadlineModalOpen}
        onOpenChange={setDeadlineModalOpen}
        project={activeProject}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete Project"
        description={`Are you sure you want to delete "${activeProject.name}"? All tasks and columns associated with this project will be deleted.`}
        confirmText="Delete Project"
        destructive
        onConfirm={() => deleteProject(activeProject.id)}
      />
    </>
  );
}
