import { useState } from 'react';
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
import { boardStore } from '@/store/boardStore';
import { GithubIcon } from '@/components/icons/GithubIcon';
import {
  Search,
  Star,
  GitBranch,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface ImportGithubModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FetchedRepo {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string; avatar_url: string };
  description: string | null;
  html_url: string;
  default_branch: string;
  stargazers_count: number;
  language: string | null;
}

export function ImportGithubModal({ open, onOpenChange }: ImportGithubModalProps) {
  const [repoInput, setRepoInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('diogocsilva12');
  const [loading, setLoading] = useState(false);
  const [fetchedRepos, setFetchedRepos] = useState<FetchedRepo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<FetchedRepo | null>(null);

  // Parse direct owner/repo or URL input
  const parseRepoString = (input: string): { owner: string; name: string } | null => {
    const trimmed = input.trim().replace(/\/+$/, '');
    if (!trimmed) return null;

    // Match full URL: https://github.com/owner/repo
    const urlMatch = trimmed.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (urlMatch) {
      return { owner: urlMatch[1], name: urlMatch[2] };
    }

    // Match owner/repo
    const parts = trimmed.split('/');
    if (parts.length === 2 && parts[0] && parts[1]) {
      return { owner: parts[0], name: parts[1] };
    }

    return null;
  };

  const handleFetchUserRepos = async (usernameToFetch: string) => {
    if (!usernameToFetch.trim()) return;
    setLoading(true);
    setError(null);
    setSelectedRepo(null);

    try {
      const response = await fetch(
        `https://api.github.com/users/${encodeURIComponent(usernameToFetch.trim())}/repos?sort=updated&per_page=8`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`GitHub user or organization '${usernameToFetch}' not found.`);
        }
        if (response.status === 403) {
          throw new Error('GitHub API rate limit exceeded. Please import via URL or Owner/Repo below.');
        }
        throw new Error(`Failed to fetch repositories (${response.statusText})`);
      }

      const data: FetchedRepo[] = await response.json();
      setFetchedRepos(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch repositories';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportDirect = async () => {
    const parsed = parseRepoString(repoInput);
    if (!parsed) {
      setError("Please enter a valid GitHub URL (e.g. 'https://github.com/owner/repo') or 'owner/repo'");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try to fetch repo metadata from GitHub API
      let repoDetails: Partial<FetchedRepo> = {
        name: parsed.name,
        full_name: `${parsed.owner}/${parsed.name}`,
        owner: { login: parsed.owner, avatar_url: '' },
        default_branch: 'main',
        html_url: `https://github.com/${parsed.owner}/${parsed.name}`,
        description: null,
      };

      try {
        const response = await fetch(
          `https://api.github.com/repos/${parsed.owner}/${parsed.name}`
        );
        if (response.ok) {
          const data = await response.json();
          repoDetails = data;
        }
      } catch {
        // Fallback to parsed string if offline or rate limited
      }

      boardStore.addProject({
        name: repoDetails.name || parsed.name,
        description: repoDetails.description || `Imported from GitHub: ${parsed.owner}/${parsed.name}`,
        repoOwner: parsed.owner,
        repoName: parsed.name,
        defaultBranch: repoDetails.default_branch || 'main',
        activeBranch: repoDetails.default_branch || 'main',
        githubUrl: repoDetails.html_url || `https://github.com/${parsed.owner}/${parsed.name}`,
      });

      onOpenChange(false);
      setRepoInput('');
      setSelectedRepo(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleImportSelected = (repo: FetchedRepo) => {
    boardStore.addProject({
      name: repo.name,
      description: repo.description || `Imported from GitHub: ${repo.full_name}`,
      repoOwner: repo.owner.login,
      repoName: repo.name,
      defaultBranch: repo.default_branch || 'main',
      activeBranch: repo.default_branch || 'main',
      githubUrl: repo.html_url,
    });

    onOpenChange(false);
    setSelectedRepo(null);
    setRepoInput('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GithubIcon className="h-5 w-5 text-primary" />
            Import from GitHub
          </DialogTitle>
          <DialogDescription>
            Bind a GitHub repository directly to Tasky. Project tasks and branches will be linked to this repository.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 overflow-y-auto flex-1 pr-1">
          {/* Option 1: Direct URL or owner/repo */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              Repository URL or Owner/Repo
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="https://github.com/diogocsilva12/tasky or diogocsilva12/tasky"
                value={repoInput}
                onChange={(e) => {
                  setRepoInput(e.target.value);
                  if (error) setError(null);
                }}
                className="text-xs"
              />
              <Button
                type="button"
                onClick={handleImportDirect}
                disabled={loading || !repoInput.trim()}
                className="shrink-0 text-xs"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                Import
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <span className="relative bg-card px-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Or Browse Repositories
            </span>
          </div>

          {/* Option 2: Search user repos */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="GitHub username or organization"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="pl-8 text-xs h-9"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleFetchUserRepos(usernameInput);
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleFetchUserRepos(usernameInput)}
                disabled={loading || !usernameInput.trim()}
                className="shrink-0 text-xs h-9"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : 'Fetch Repos'}
              </Button>
            </div>

            {/* Repos list */}
            {fetchedRepos.length > 0 && (
              <div className="mt-3 space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {fetchedRepos.map((repo) => {
                  const isSelected = selectedRepo?.id === repo.id;
                  return (
                    <div
                      key={repo.id}
                      onClick={() => setSelectedRepo(repo)}
                      className={`flex items-start justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border/60 hover:border-primary/40 hover:bg-accent/40'
                      }`}
                    >
                      <div className="space-y-1 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-xs text-foreground truncate">
                            {repo.full_name}
                          </span>
                          <a
                            href={repo.html_url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        {repo.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {repo.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 pt-0.5 text-[10px] text-muted-foreground">
                          {repo.language && (
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                              {repo.language}
                            </span>
                          )}
                          <span className="flex items-center gap-0.5">
                            <Star className="h-3 w-3" />
                            {repo.stargazers_count}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <GitBranch className="h-3 w-3" />
                            {repo.default_branch}
                          </span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant={isSelected ? 'default' : 'secondary'}
                        className="text-xs h-7 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImportSelected(repo);
                        }}
                      >
                        {isSelected ? <CheckCircle2 className="h-3 w-3 mr-1" /> : null}
                        Import
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
