import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useBoardStore } from '@/store/boardStore';
import { useAuth } from '@/context/AuthContext';
import { canUserAccessProject } from '@/lib/projectAccess';
import { CreateProjectModal } from './CreateProjectModal';
import { ImportGithubModal } from './ImportGithubModal';
import { GithubIcon } from '@/components/icons/GithubIcon';
import { formatDeadlineDate } from '@/lib/dateUtils';
import {
  FolderGit2,
  ChevronDown,
  Check,
  Plus,
  Layers,
  Lock,
  Calendar,
} from 'lucide-react';

export function ProjectSwitcher() {
  const { user } = useAuth();
  const { projects, activeProjectId, setActiveProject } = useBoardStore();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Filter projects by current user access permissions
  const accessibleProjects = projects.filter((p) => canUserAccessProject(p, user));
  const activeProject =
    accessibleProjects.find((p) => p.id === activeProjectId) || accessibleProjects[0];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-9 px-3 gap-2 border-border/80 bg-background/80 hover:bg-accent font-medium text-xs max-w-[220px] sm:max-w-[260px] justify-between shadow-none"
          >
            <div className="flex items-center gap-2 truncate">
              <FolderGit2 className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">{activeProject ? activeProject.name : 'Select Project'}</span>
              {activeProject?.visibility === 'private' && (
                <span title="Private project">
                  <Lock className="h-3 w-3 text-amber-500 shrink-0" />
                </span>
              )}
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-70" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-[260px]">
          <DropdownMenuLabel className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            <Layers className="h-3.5 w-3.5" />
            Projects ({accessibleProjects.length})
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <div className="max-h-[220px] overflow-y-auto">
            {accessibleProjects.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted-foreground">
                No accessible projects found.
              </div>
            ) : (
              accessibleProjects.map((project) => {
                const isActive = activeProject && project.id === activeProject.id;
                const isPrivate = project.visibility === 'private';
                return (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() => setActiveProject(project.id)}
                    className="flex items-center justify-between text-xs py-2 cursor-pointer"
                  >
                    <div className="flex flex-col truncate pr-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className={`truncate font-medium ${
                            isActive ? 'text-primary font-semibold' : 'text-foreground'
                          }`}
                        >
                          {project.name}
                        </span>
                        {isPrivate && (
                          <span title="Private project">
                            <Lock className="h-3 w-3 text-amber-500 shrink-0" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-1 text-[10px] text-muted-foreground truncate mt-0.5">
                        {project.repoOwner && project.repoName ? (
                          <span className="truncate">
                            {project.repoOwner}/{project.repoName}
                          </span>
                        ) : (
                          <span />
                        )}
                        {project.deadline && (
                          <span
                            className="shrink-0 flex items-center gap-1 text-primary/80 font-mono text-[9px] bg-primary/10 px-1 py-0.2 rounded border border-primary/20"
                            title={`Deadline: ${formatDeadlineDate(project.deadline)}`}
                          >
                            <Calendar className="h-2.5 w-2.5" />
                            <span>{formatDeadlineDate(project.deadline)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    {isActive && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </DropdownMenuItem>
                );
              })
            )}
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 text-xs py-2 cursor-pointer font-medium"
          >
            <Plus className="h-4 w-4 text-primary" />
            <span>Create New Project</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-2 text-xs py-2 cursor-pointer font-medium"
          >
            <GithubIcon className="h-4 w-4" />
            <span>Import from GitHub...</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateProjectModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />

      <ImportGithubModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
      />
    </>
  );
}
