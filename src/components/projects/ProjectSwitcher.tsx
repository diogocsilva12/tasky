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
import { CreateProjectModal } from './CreateProjectModal';
import { ImportGithubModal } from './ImportGithubModal';
import { GithubIcon } from '@/components/icons/GithubIcon';
import {
  FolderGit2,
  ChevronDown,
  Check,
  Plus,
  Layers,
} from 'lucide-react';

export function ProjectSwitcher() {
  const { projects, activeProjectId, setActiveProject } = useBoardStore();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];

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
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-70" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-[260px]">
          <DropdownMenuLabel className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            <Layers className="h-3.5 w-3.5" />
            Projects ({projects.length})
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <div className="max-h-[220px] overflow-y-auto">
            {projects.map((project) => {
              const isActive = project.id === activeProjectId;
              return (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => setActiveProject(project.id)}
                  className="flex items-center justify-between text-xs py-2 cursor-pointer"
                >
                  <div className="flex flex-col truncate pr-2">
                    <span className={`truncate font-medium ${isActive ? 'text-primary font-semibold' : 'text-foreground'}`}>
                      {project.name}
                    </span>
                    {project.repoOwner && project.repoName && (
                      <span className="text-[10px] text-muted-foreground truncate">
                        {project.repoOwner}/{project.repoName}
                      </span>
                    )}
                  </div>
                  {isActive && <Check className="h-4 w-4 text-primary shrink-0" />}
                </DropdownMenuItem>
              );
            })}
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
