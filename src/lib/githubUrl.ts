export interface CleanRepoDetails {
  owner: string | null;
  name: string | null;
  repoUrl: string | null;
  branchUrl: (branch?: string) => string | null;
  issueUrl: (issueNumber: number) => string | null;
  prUrl: (prNumber: number) => string | null;
}

/**
 * Strips `.git`, trailing slashes, and leading URLs from repo names
 */
export function cleanRepoName(repoName?: string | null): string {
  if (!repoName) return '';
  return repoName
    .trim()
    .replace(/^https?:\/\/github\.com\/[^/]+\//i, '')
    .replace(/\.git$/i, '')
    .replace(/\/+$/, '');
}

/**
 * Strips leading '@', slashes, and protocol from repo owner
 */
export function cleanRepoOwner(repoOwner?: string | null): string {
  if (!repoOwner) return '';
  return repoOwner
    .trim()
    .replace(/^@/, '')
    .replace(/^https?:\/\/github\.com\//i, '')
    .replace(/\/.*$/, '')
    .replace(/\/+$/, '');
}

/**
 * Generates guaranteed clean GitHub URLs without `.git` or invalid tree paths
 */
export function getCleanRepoDetails(
  project?: {
    repoOwner?: string | null;
    repoName?: string | null;
    githubUrl?: string | null;
    defaultBranch?: string | null;
    activeBranch?: string | null;
  } | null
): CleanRepoDetails {
  if (!project) {
    return {
      owner: null,
      name: null,
      repoUrl: null,
      branchUrl: () => null,
      issueUrl: () => null,
      prUrl: () => null,
    };
  }

  let owner = project.repoOwner ? cleanRepoOwner(project.repoOwner) : null;
  let name = project.repoName ? cleanRepoName(project.repoName) : null;

  // Extract from githubUrl if owner or name is missing or has full URL
  if (project.githubUrl) {
    const rawUrl = project.githubUrl.trim().replace(/\.git$/i, '').replace(/\/+$/, '');
    const match = rawUrl.match(/github\.com\/([^/]+)\/([^/]+)/i);
    if (match) {
      if (!owner) owner = cleanRepoOwner(match[1]);
      if (!name) name = cleanRepoName(match[2]);
    }
  }

  if (owner && name) {
    const repoUrl = `https://github.com/${owner}/${name}`;
    return {
      owner,
      name,
      repoUrl,
      branchUrl: (branch?: string) => {
        const targetBranch = branch || project.activeBranch || project.defaultBranch || 'main';
        return `${repoUrl}/tree/${encodeURIComponent(targetBranch)}`;
      },
      issueUrl: (issueNumber: number) => `${repoUrl}/issues/${issueNumber}`,
      prUrl: (prNumber: number) => `${repoUrl}/pull/${prNumber}`,
    };
  }

  const fallbackRepoUrl = project.githubUrl
    ? project.githubUrl.trim().replace(/\.git$/i, '').replace(/\/+$/, '')
    : null;

  return {
    owner,
    name,
    repoUrl: fallbackRepoUrl,
    branchUrl: (branch?: string) => {
      if (!fallbackRepoUrl) return null;
      const targetBranch = branch || project.activeBranch || project.defaultBranch || 'main';
      return `${fallbackRepoUrl}/tree/${encodeURIComponent(targetBranch)}`;
    },
    issueUrl: (issueNumber: number) => {
      if (!fallbackRepoUrl) return null;
      return `${fallbackRepoUrl}/issues/${issueNumber}`;
    },
    prUrl: (prNumber: number) => {
      if (!fallbackRepoUrl) return null;
      return `${fallbackRepoUrl}/pull/${prNumber}`;
    },
  };
}
