import { describe, it, expect } from 'vitest';
import { GithubSyncEngine, GithubIssue } from '../services/githubSync';

describe('GithubSyncEngine', () => {
  it('maps labels to priority correctly', () => {
    expect(GithubSyncEngine.mapLabelsToPriority([{ name: 'priority:P0' }])).toBe('P0');
    expect(GithubSyncEngine.mapLabelsToPriority([{ name: 'p1' }])).toBe('P1');
    expect(GithubSyncEngine.mapLabelsToPriority([{ name: 'Priority: P2' }])).toBe('P2');
    expect(GithubSyncEngine.mapLabelsToPriority([{ name: 'bug' }])).toBe('P4');
    expect(GithubSyncEngine.mapLabelsToPriority([])).toBe('P4');
  });

  it('maps GitHub Issue to Task correctly', () => {
    const issue: GithubIssue = {
      number: 42,
      title: 'Fix auth bug',
      body: 'The auth is broken',
      state: 'open',
      assignees: [{ login: 'johndoe', avatar_url: 'http://avatar.com/johndoe' }],
      labels: [{ name: 'priority:p0' }],
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      html_url: 'https://github.com/owner/repo/issues/42',
    };

    const task = GithubSyncEngine.mapIssueToTask(issue, 'proj-1');

    expect(task.id).toBe('issue-42');
    expect(task.projectId).toBe('proj-1');
    expect(task.title).toBe('Fix auth bug');
    expect(task.description).toBe('The auth is broken');
    expect(task.columnId).toBe('todo');
    expect(task.priority).toBe('P0');
    expect(task.assignees.length).toBe(1);
    expect(task.assignees[0].username).toBe('johndoe');
    expect(task.githubIssueNumber).toBe(42);
    expect(task.githubUrl).toBe('https://github.com/owner/repo/issues/42');
  });

  it('maps closed issues to done column', () => {
    const issue: GithubIssue = {
      number: 43,
      title: 'Setup CI',
      body: 'Github actions',
      state: 'closed',
      assignees: [],
      labels: [],
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      html_url: 'https://github.com/owner/repo/issues/43',
    };

    const task = GithubSyncEngine.mapIssueToTask(issue, 'proj-1');
    expect(task.columnId).toBe('done');
  });
});
