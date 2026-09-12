import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GitBranch, GitCommit, ExternalLink, RefreshCw } from 'lucide-react';
import { fetchBranchCommits, type BranchCommit } from '@/services/githubCommits';
import { getToken } from '@/services/githubAuth';

interface BranchCommitsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repoOwner: string;
  repoName: string;
  branchName: string;
}

export const BranchCommitsModal: React.FC<BranchCommitsModalProps> = ({
  open,
  onOpenChange,
  repoOwner,
  repoName,
  branchName,
}) => {
  const [commits, setCommits] = useState<BranchCommit[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCommits = async () => {
    if (!repoOwner || !repoName || !branchName) return;
    setLoading(true);
    try {
      const token = getToken() || undefined;
      const data = await fetchBranchCommits(repoOwner, repoName, branchName, token);
      setCommits(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadCommits();
    }
  }, [open, repoOwner, repoName, branchName]);

  const formatRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 1) return 'just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <div className="flex items-center justify-between pr-4">
            <DialogTitle className="flex items-center gap-2 text-base">
              <GitBranch className="h-4 w-4 text-primary" />
              <span>Branch Commits: {branchName}</span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={loadCommits}
              disabled={loading}
              className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Refresh commits"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <DialogDescription className="text-xs">
            Recent commit activity in{' '}
            <span className="font-mono text-foreground font-medium">
              {repoOwner}/{repoName}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {loading && commits.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Fetching branch commits...</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {commits.map((commit) => (
                <div
                  key={commit.sha}
                  className="flex items-start justify-between gap-3 p-2.5 rounded-lg border border-border/60 bg-card/60 backdrop-blur-xs hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <Avatar className="h-6 w-6 mt-0.5 shrink-0 border border-border">
                      <AvatarImage src={commit.authorAvatar} alt={commit.authorName} />
                      <AvatarFallback className="text-[9px]">
                        {commit.authorName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-xs font-medium text-foreground leading-snug break-words">
                        {commit.message}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {commit.authorUsername ? `@${commit.authorUsername}` : commit.authorName}
                        </span>
                        <span>•</span>
                        <span>{formatRelativeTime(commit.date)}</span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={commit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded border border-primary/20 transition-colors shrink-0"
                    title="View commit on GitHub"
                  >
                    <GitCommit className="h-3 w-3" />
                    <span>{commit.shortSha}</span>
                    <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
