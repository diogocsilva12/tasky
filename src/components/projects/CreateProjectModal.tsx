import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/input';
import { boardStore } from '@/store/boardStore';
import type { Project } from '@/types';
import { FolderGit2, GitBranch } from 'lucide-react';
import { GithubIcon } from '@/components/icons/GithubIcon';

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectToEdit?: Project | null;
}

export function CreateProjectModal({
  open,
  onOpenChange,
  projectToEdit,
}: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [repoOwner, setRepoOwner] = useState('');
  const [repoName, setRepoName] = useState('');
  const [defaultBranch, setDefaultBranch] = useState('main');
  const [activeBranch, setActiveBranch] = useState('main');
  const [error, setError] = useState('');

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name);
      setDescription(projectToEdit.description || '');
      setRepoOwner(projectToEdit.repoOwner || '');
      setRepoName(projectToEdit.repoName || '');
      setDefaultBranch(projectToEdit.defaultBranch || 'main');
      setActiveBranch(projectToEdit.activeBranch || projectToEdit.defaultBranch || 'main');
    } else {
      setName('');
      setDescription('');
      setRepoOwner('');
      setRepoName('');
      setDefaultBranch('main');
      setActiveBranch('main');
    }
    setError('');
  }, [projectToEdit, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    if (projectToEdit) {
      boardStore.updateProject(projectToEdit.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        repoOwner: repoOwner.trim() || undefined,
        repoName: repoName.trim() || undefined,
        defaultBranch: defaultBranch.trim() || 'main',
        activeBranch: activeBranch.trim() || defaultBranch.trim() || 'main',
      });
    } else {
      boardStore.addProject({
        name: name.trim(),
        description: description.trim() || undefined,
        repoOwner: repoOwner.trim() || undefined,
        repoName: repoName.trim() || undefined,
        defaultBranch: defaultBranch.trim() || 'main',
        activeBranch: activeBranch.trim() || defaultBranch.trim() || 'main',
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderGit2 className="h-5 w-5 text-primary" />
            {projectToEdit ? 'Edit Project' : 'Create New Project'}
          </DialogTitle>
          <DialogDescription>
            {projectToEdit
              ? 'Update project details and GitHub repository settings.'
              : 'Create a local project board and optionally bind it to a GitHub repository.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Project Name <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="e.g. Tasky Core Engine"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              autoFocus
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Description</label>
            <Textarea
              placeholder="Brief description of the project goals and workflow..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <GithubIcon className="h-4 w-4" />
              <span>GitHub Repository Association (Optional)</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">
                  Owner / Org
                </label>
                <Input
                  placeholder="e.g. diogocsilva12"
                  value={repoOwner}
                  onChange={(e) => setRepoOwner(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">
                  Repository Name
                </label>
                <Input
                  placeholder="e.g. tasky"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <GitBranch className="h-3 w-3" /> Default Branch
                </label>
                <Input
                  placeholder="main"
                  value={defaultBranch}
                  onChange={(e) => setDefaultBranch(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <GitBranch className="h-3 w-3 text-primary" /> Active Working Branch
                </label>
                <Input
                  placeholder="e.g. feature/kanban-board"
                  value={activeBranch}
                  onChange={(e) => setActiveBranch(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {projectToEdit ? 'Save Changes' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
