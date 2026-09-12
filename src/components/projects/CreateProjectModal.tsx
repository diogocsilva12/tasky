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
import { cleanRepoName, cleanRepoOwner } from '@/lib/githubUrl';
import { useAuth } from '@/context/AuthContext';
import type { Project, ProjectVisibility } from '@/types';
import { FolderGit2, GitBranch, Globe, Lock, Calendar } from 'lucide-react';
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
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [visibility, setVisibility] = useState<ProjectVisibility>('public');
  const [allowedUsersInput, setAllowedUsersInput] = useState('');
  const [repoOwner, setRepoOwner] = useState('');
  const [repoName, setRepoName] = useState('');
  const [defaultBranch, setDefaultBranch] = useState('main');
  const [activeBranch, setActiveBranch] = useState('main');
  const [error, setError] = useState('');

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name);
      setDescription(projectToEdit.description || '');
      setDeadline(projectToEdit.deadline ? projectToEdit.deadline.split('T')[0] : '');
      setVisibility(projectToEdit.visibility || 'public');
      setAllowedUsersInput((projectToEdit.allowedUsers || []).join(', '));
      setRepoOwner(projectToEdit.repoOwner || '');
      setRepoName(projectToEdit.repoName || '');
      setDefaultBranch(projectToEdit.defaultBranch || 'main');
      setActiveBranch(projectToEdit.activeBranch || projectToEdit.defaultBranch || 'main');
    } else {
      setName('');
      setDescription('');
      setDeadline('');
      setVisibility('public');
      setAllowedUsersInput('');
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

    const cleanOwner = cleanRepoOwner(repoOwner);
    const cleanName = cleanRepoName(repoName);
    const cleanRepoUrl = cleanOwner && cleanName ? `https://github.com/${cleanOwner}/${cleanName}` : undefined;

    const parsedAllowedUsers = allowedUsersInput
      .split(',')
      .map((s) => s.trim().replace(/^@/, ''))
      .filter(Boolean);

    const projectPayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      deadline: deadline ? deadline : undefined,
      visibility,
      allowedUsers: visibility === 'private' ? parsedAllowedUsers : [],
      owner: projectToEdit?.owner || user?.username || cleanOwner || 'diogocsilva12',
      repoOwner: cleanOwner || undefined,
      repoName: cleanName || undefined,
      githubUrl: cleanRepoUrl,
      defaultBranch: defaultBranch.trim() || 'main',
      activeBranch: activeBranch.trim() || defaultBranch.trim() || 'main',
    };

    if (projectToEdit) {
      boardStore.updateProject(projectToEdit.id, projectPayload);
    } else {
      boardStore.addProject(projectPayload);
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

          {/* Project Target Deadline */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>Project Target Deadline</span>
              </span>
              {deadline && (
                <button
                  type="button"
                  onClick={() => setDeadline('')}
                  className="text-[10px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="text-xs h-9 bg-background/80"
            />
            <p className="text-[10px] text-muted-foreground">
              Optional completion target date for the project and Kanban board.
            </p>
          </div>

          {/* Visibility Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Project Visibility</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  visibility === 'public'
                    ? 'border-primary bg-primary/10 text-primary shadow-xs'
                    : 'border-border/70 hover:bg-card/70 text-muted-foreground'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground mb-0.5">
                  <Globe className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>Public</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  Visible to all team members on the pass-list.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  visibility === 'private'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'border-border/70 hover:bg-card/70 text-muted-foreground'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground mb-0.5">
                  <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>Private</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  Restricted to owner and permitted members.
                </p>
              </button>
            </div>

            {visibility === 'private' && (
              <div className="rounded-lg border border-border/80 bg-muted/20 p-2.5 space-y-1.5 mt-2">
                <label className="text-[11px] font-medium text-foreground">
                  Allowed Members (GitHub Usernames)
                </label>
                <Input
                  placeholder="e.g. sarah-chen, alex-dev"
                  value={allowedUsersInput}
                  onChange={(e) => setAllowedUsersInput(e.target.value)}
                  className="h-8 text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  Comma-separated GitHub usernames who can view this private board.
                </p>
              </div>
            )}
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
