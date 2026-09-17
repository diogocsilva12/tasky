import { useFormSession } from '@/hooks/useFormSession';
import React, { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { boardStore } from '@/store/boardStore';
import { useAuth } from '@/context/AuthContext';
import type { Project, ProjectVisibility } from '@/types';
import {
  Shield,
  Globe,
  Lock,
  UserPlus,
  UserCheck,
  X,
  Users,
} from 'lucide-react';

interface ProjectAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
}

export const ProjectAccessModal: React.FC<ProjectAccessModalProps> = ({
  open,
  onOpenChange,
  project,
}) => {
  const { passList } = useAuth();
  const [visibility, setVisibility] = useState<ProjectVisibility>('public');
  const [allowedUsers, setAllowedUsers] = useState<string[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [error, setError] = useState<string | null>(null);

  useFormSession(open, project.id, () => {
    if (project && open) {
      setVisibility(project.visibility || 'public');
      setAllowedUsers(project.allowedUsers || []);
      setNewUsername('');
      setError(null);
    }
  });

  const handleAddUser = (usernameToAdd: string) => {
    const clean = usernameToAdd.trim().replace(/^@/, '');
    if (!clean) return;

    const lower = clean.toLowerCase();
    if (allowedUsers.some((u) => u.toLowerCase() === lower)) {
      setError(`@${clean} is already permitted.`);
      return;
    }
    if (project.owner && project.owner.toLowerCase() === lower) {
      setError(`@${clean} is the project owner.`);
      return;
    }

    setAllowedUsers([...allowedUsers, clean]);
    setNewUsername('');
    setError(null);
  };

  const handleRemoveUser = (usernameToRemove: string) => {
    setAllowedUsers(
      allowedUsers.filter((u) => u.toLowerCase() !== usernameToRemove.toLowerCase())
    );
  };

  const handleSave = () => {
    boardStore.updateProject(project.id, {
      visibility,
      allowedUsers: visibility === 'private' ? allowedUsers : [],
    });
    onOpenChange(false);
  };

  // Team pass-list suggestions that are not yet added and not the owner
  const suggestions = passList.filter(
    (entry) =>
      entry.username.toLowerCase() !== (project.owner || '').toLowerCase() &&
      !allowedUsers.some((u) => u.toLowerCase() === entry.username.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            Project Board Access & Visibility
          </DialogTitle>
          <DialogDescription>
            Configure who can view and collaborate on &ldquo;{project.name}&rdquo;.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Visibility Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Project Visibility</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  visibility === 'public'
                    ? 'border-primary bg-primary/10 text-primary shadow-xs'
                    : 'border-border/70 hover:bg-card/70 text-muted-foreground'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground mb-1">
                  <Globe className="h-4 w-4 text-blue-500 shrink-0" />
                  <span>Public Project</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Visible to all team members authorized in the pass-list.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  visibility === 'private'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'border-border/70 hover:bg-card/70 text-muted-foreground'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground mb-1">
                  <Lock className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>Private Project</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Restricted strictly to the project owner and permitted members.
                </p>
              </button>
            </div>
          </div>

          {/* Private Settings: Members & Permissions */}
          {visibility === 'private' && (
            <div className="space-y-4 rounded-xl border border-border/80 bg-card/60 p-3.5 backdrop-blur-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  <span>Allowed Members</span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {allowedUsers.length + 1} user{allowedUsers.length + 1 === 1 ? '' : 's'} with access
                </span>
              </div>

              {/* Owner Display */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-background/80 border border-border/70">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={`https://github.com/${project.owner || 'diogocsilva12'}.png`} />
                    <AvatarFallback className="text-[9px]">
                      {(project.owner || 'DI').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium text-foreground">
                    @{project.owner || 'diogocsilva12'}
                  </span>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  Owner
                </Badge>
              </div>

              {/* Add User Input */}
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter GitHub username..."
                    value={newUsername}
                    onChange={(e) => {
                      setNewUsername(e.target.value);
                      if (error) setError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddUser(newUsername);
                      }
                    }}
                    className="h-8 text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleAddUser(newUsername)}
                    disabled={!newUsername.trim()}
                    className="h-8 text-xs gap-1 shrink-0"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </Button>
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>

              {/* Quick-add team suggestions from pass-list */}
              {suggestions.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Quick add team member from pass-list:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.slice(0, 6).map((member) => (
                      <button
                        key={member.username}
                        type="button"
                        onClick={() => handleAddUser(member.username)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/80 hover:bg-accent px-2 py-0.5 text-[11px] font-medium text-foreground transition-colors cursor-pointer"
                      >
                        <UserCheck className="h-3 w-3 text-primary" />
                        <span>@{member.username}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Allowed Users List */}
              <div className="space-y-1.5 pt-1">
                {allowedUsers.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-2 bg-muted/20 rounded-md">
                    No additional members allowed yet. Only you and admins can access this board.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                    {allowedUsers.map((username) => (
                      <div
                        key={username}
                        className="flex items-center justify-between p-2 rounded-lg border border-border/60 bg-background/80"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={`https://github.com/${username}.png`} />
                            <AvatarFallback className="text-[9px]">
                              {username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium text-foreground">
                            @{username}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveUser(username)}
                          className="h-6 w-6 text-muted-foreground hover:text-destructive cursor-pointer"
                          title={`Remove @${username}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Access Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
