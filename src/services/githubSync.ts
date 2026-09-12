import { Task, Priority } from '../types/index';

// A generic GitHub response type for issues
export interface GithubIssue {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  assignees: Array<{ login: string; avatar_url: string; name?: string }>;
  labels: Array<{ name: string }>;
  created_at: string;
  updated_at: string;
  html_url: string;
}

export class GithubSyncEngine {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`https://api.github.com${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Parse priority from labels
  static mapLabelsToPriority(labels: Array<{ name: string }>): Priority {
    const pLabel = labels.find(l => l.name.toLowerCase().match(/^priority:?\s*p[0-4]$/i) || l.name.toLowerCase().match(/^p[0-4]$/i));
    if (pLabel) {
      const match = pLabel.name.toLowerCase().match(/p[0-4]/i);
      if (match) {
        return match[0].toUpperCase() as Priority;
      }
    }
    return 'P4';
  }

  // Map GitHub Issue to Task
  static mapIssueToTask(issue: GithubIssue, projectId: string): Task {
    return {
      id: `issue-${issue.number}`,
      projectId,
      title: issue.title,
      description: issue.body || '',
      columnId: issue.state === 'closed' ? 'done' : 'todo', // basic mapping, can be refined based on project state
      priority: this.mapLabelsToPriority(issue.labels),
      assignees: issue.assignees.map(a => ({
        username: a.login,
        avatarUrl: a.avatar_url,
        name: a.name || a.login,
      })),
      githubIssueNumber: issue.number,
      githubUrl: issue.html_url,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
    };
  }

  async pullIssues(owner: string, repo: string, projectId: string): Promise<Task[]> {
    const issues = await this.request<GithubIssue[]>(`/repos/${owner}/${repo}/issues?state=all&per_page=100`);
    return issues.filter(i => !('pull_request' in i)).map(issue => GithubSyncEngine.mapIssueToTask(issue, projectId));
  }

  async pushTask(owner: string, repo: string, task: Task): Promise<Task> {
    const payload = {
      title: task.title,
      body: task.description || '',
      state: task.columnId === 'done' ? 'closed' : 'open',
      assignees: task.assignees.map(a => a.username),
      labels: [task.priority],
    };

    let issue: GithubIssue;

    if (task.githubIssueNumber) {
      // Update existing issue
      issue = await this.request<GithubIssue>(`/repos/${owner}/${repo}/issues/${task.githubIssueNumber}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    } else {
      // Create new issue
      issue = await this.request<GithubIssue>(`/repos/${owner}/${repo}/issues`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    return GithubSyncEngine.mapIssueToTask(issue, task.projectId);
  }
}
