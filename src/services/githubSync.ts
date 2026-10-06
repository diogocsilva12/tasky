import type { Task, Priority, Project } from '../types/index';
import { sameData, type BoardData } from '../lib/boardSync';
import { isDoneColumn } from '../lib/taskMetrics';

// A generic GitHub response type for issues
export interface GithubIssue {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  user?: { login: string; avatar_url: string };
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
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
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
      id: `issue-${projectId}-${issue.number}`,
      projectId,
      creator: issue.user ? { username: issue.user.login, avatarUrl: issue.user.avatar_url } : undefined,
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
    const issues: GithubIssue[] = [];
    for (let page = 1; ; page++) {
      const batch = await this.request<GithubIssue[]>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?state=all&per_page=100&page=${page}`);
      issues.push(...batch);
      if (batch.length < 100) break;
    }
    return issues.filter(i => !('pull_request' in i)).map(issue => GithubSyncEngine.mapIssueToTask(issue, projectId));
  }

  // Only linked tasks write to GitHub; local-only tasks are never published implicitly.
  async syncBoard(board: BoardData): Promise<BoardData> {
    const next = structuredClone(board);
    for (const project of next.projects) {
      if (!project.repoOwner || !project.repoName) continue;
      const repoUrl = `https://github.com/${project.repoOwner}/${project.repoName}/issues/`.toLowerCase();
      if (next.tasks.some(t => t.projectId === project.id && t.githubIssueNumber && t.githubUrl && !t.githubUrl.toLowerCase().startsWith(repoUrl))) {
        throw new Error(`${project.name}: linked tasks belong to another repository. Restore the repository link before syncing.`);
      }
      const columns = [...project.columns].sort((a, b) => a.order - b.order);
      const done = columns.find(c => isDoneColumn(c.title) || isDoneColumn(c.id));
      const todo = columns.find(c => /^to\s*do$/i.test(c.title)) || columns.find(c => !isDoneColumn(c.title) && !isDoneColumn(c.id));
      if (!done || !todo) throw new Error(`${project.name}: add To Do and Done columns to sync GitHub issues.`);
      const incoming = await this.pullIssues(project.repoOwner, project.repoName, project.id);
      for (const remote of incoming) {
        const index = next.tasks.findIndex(t => t.projectId === project.id && t.githubIssueNumber === remote.githubIssueNumber);
        const local = index < 0 ? undefined : next.tasks[index];
        const remoteState = this.fields(remote);
        let fields = { ...remoteState };
        if (local?.githubSyncBase) {
          const localState = this.fields(local, project);
          for (const key of Object.keys(fields) as Array<keyof typeof fields>) {
            if (sameData(localState[key], local.githubSyncBase[key])) continue;
            if (!sameData(remoteState[key], local.githubSyncBase[key]) && !sameData(remoteState[key], localState[key])) {
              throw new Error(`${project.name} #${remote.githubIssueNumber}: both GitHub and Tasky changed ${key}. Your local edits are preserved.`);
            }
          }
          fields = Object.fromEntries(Object.keys(fields).map(key => {
            const k = key as keyof typeof fields;
            return [key, sameData(localState[k], local.githubSyncBase![k]) ? remoteState[k] : localState[k]];
          })) as typeof fields;
          if (!sameData(fields, remoteState)) {
            const pushed = await this.pushTask(project.repoOwner, project.repoName, {
              ...remote, title: fields.title, description: fields.body,
              columnId: fields.state === 'closed' ? 'done' : 'todo', priority: fields.priority,
              assignees: fields.assignees.map(username => ({ username })),
            }, remote);
            Object.assign(remote, pushed);
          }
        }
        const completed = fields.state === 'closed';
        const keepColumn = local && this.fields(local, project).state === fields.state;
        const task: Task = { ...local, ...remote, id: local?.id || remote.id,
          columnId: keepColumn ? local.columnId : completed ? done.id : todo.id,
          githubSyncBase: fields,
          completedAt: completed ? local?.completedAt || remote.updatedAt : undefined,
        };
        if (index < 0) next.tasks.push(task); else next.tasks[index] = task;
      }
    }
    return next;
  }

  private fields(task: Task, project?: Project): NonNullable<Task['githubSyncBase']> {
    const column = project?.columns.find(c => c.id === task.columnId);
    return { title: task.title, body: task.description || '',
      state: isDoneColumn(column?.title || task.columnId) ? 'closed' : 'open',
      assignees: task.assignees.map(a => a.username.toLowerCase()).sort(), priority: task.priority };
  }

  async pushTask(owner: string, repo: string, task: Task, expected?: Task): Promise<Task> {
    const payload = {
      title: task.title,
      body: task.description || '',
      state: task.columnId === 'done' ? 'closed' : 'open',
      assignees: task.assignees.map(a => a.username),
      labels: [task.priority] as string[],
    };

    let issue: GithubIssue;

    if (task.githubIssueNumber) {
      const current = await this.request<GithubIssue>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${task.githubIssueNumber}`);
      if (expected && !sameData(this.fields(GithubSyncEngine.mapIssueToTask(current, task.projectId)), this.fields(expected))) {
        throw new Error(`GitHub issue #${task.githubIssueNumber} changed during sync. Retry; your local edits are preserved.`);
      }
      // Keep research/module labels when changing a task's priority.
      payload.labels = [...current.labels.filter(l => !/^(?:priority:?\s*)?p[0-4]$/i.test(l.name)).map(l => l.name), task.priority];
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
