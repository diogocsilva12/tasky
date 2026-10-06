import { describe, it, expect, vi, afterEach } from 'vitest';
import { BoardCloud } from '../services/boardCloud';
import { parseBoard, emptyBoard, type BoardData } from '../lib/boardSync';
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

    expect(task.id).toBe('issue-proj-1-42');
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

const issue = (number = 1, state: 'open' | 'closed' = 'open'): GithubIssue => ({
  number, title: `Issue ${number}`, body: 'Details', state, assignees: [],
  labels: [{ name: 'research' }, { name: 'P2' }], created_at: '2026-10-01', updated_at: '2026-10-06',
  html_url: `https://github.com/alice/repo/issues/${number}`,
});
const board = (): BoardData => ({ projects: [{ id: 'project', name: 'Research', repoOwner: 'alice', repoName: 'repo',
  columns: [{ id: 'c1', title: 'To Do', order: 0 }, { id: 'c2', title: 'In Progress', order: 1 }, { id: 'c3', title: 'Done', order: 2 }],
  createdAt: '', updatedAt: '' }], tasks: [] });
afterEach(() => vi.unstubAllGlobals());

describe('GitHub sync in the shared board flow', () => {
  it('imports every page, ignores PRs, maps real columns and keeps local-only tasks', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json(Array.from({ length: 100 }, (_, i) => issue(i + 1))))
      .mockResolvedValueOnce(Response.json([issue(101, 'closed'), { ...issue(102), pull_request: {} }]));
    vi.stubGlobal('fetch', fetcher);
    const data = board(); data.tasks.push({ ...GithubSyncEngine.mapIssueToTask(issue(500), 'project'), id: 'local', githubIssueNumber: undefined, columnId: 'c2' });
    const next = await new GithubSyncEngine('token').syncBoard(data);
    expect(next.tasks).toHaveLength(102);
    expect(next.tasks.find(t => t.githubIssueNumber === 101)?.columnId).toBe('c3');
    expect(next.tasks.find(t => t.githubIssueNumber === 1)?.columnId).toBe('c1');
    expect(next.tasks[0].id).toBe('local'); expect(fetcher.mock.calls[1][0]).toContain('page=2');
    expect(() => parseBoard(next)).not.toThrow();
    expect(GithubSyncEngine.mapIssueToTask(issue(), 'other').id).not.toBe(next.tasks[1].id);
  });

  it('pushes linked edits, preserves other labels and board metadata without feedback writes', async () => {
    const engine = new GithubSyncEngine('token'); const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    fetcher.mockResolvedValueOnce(Response.json([issue()]));
    const initial = await engine.syncBoard(board());
    initial.tasks[0].columnId = 'c3'; initial.tasks[0].title = 'Edited in Tasky';
    initial.tasks[0].storyPoints = 8; initial.tasks[0].comments = [{ id: 'comment', author: 'alice', content: 'Keep me', createdAt: '' }];
    const changed = { ...issue(), title: 'Edited in Tasky', state: 'closed' as const };
    fetcher.mockResolvedValueOnce(Response.json([issue()])).mockResolvedValueOnce(Response.json(issue())).mockResolvedValueOnce(Response.json(changed));
    const next = await engine.syncBoard(initial);
    const payload = JSON.parse(fetcher.mock.calls[3][1].body);
    expect(payload).toMatchObject({ title: 'Edited in Tasky', state: 'closed', labels: ['research', 'P2'] });
    expect(next.tasks[0]).toMatchObject({ id: initial.tasks[0].id, storyPoints: 8, columnId: 'c3', comments: initial.tasks[0].comments });
    fetcher.mockResolvedValueOnce(Response.json([changed])); await engine.syncBoard(next);
    expect(fetcher.mock.calls.filter(([, options]) => options.method === 'PATCH')).toHaveLength(1);
    fetcher.mockResolvedValueOnce(Response.json([changed])); next.tasks[0].columnId = 'c1';
    fetcher.mockResolvedValueOnce(Response.json(changed)).mockResolvedValueOnce(Response.json({ ...changed, state: 'open' }));
    expect((await engine.syncBoard(next)).tasks[0].completedAt).toBeUndefined();
  });

  it('pulls remote closures and preserves in-progress columns on unchanged open issues', async () => {
    const engine = new GithubSyncEngine('token'); const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    fetcher.mockResolvedValueOnce(Response.json([issue()])); const initial = await engine.syncBoard(board());
    initial.tasks[0].columnId = 'c2'; initial.tasks[0].subtasks = [{ id: 's', title: 'Keep', completed: false }];
    fetcher.mockResolvedValueOnce(Response.json([issue()])); const progress = await engine.syncBoard(initial);
    expect(progress.tasks[0].columnId).toBe('c2');
    fetcher.mockResolvedValueOnce(Response.json([issue(1, 'closed')])); const closed = await engine.syncBoard(progress);
    expect(closed.tasks[0].columnId).toBe('c3'); expect(closed.tasks[0].subtasks).toEqual(initial.tasks[0].subtasks);
    expect(fetcher.mock.calls.every(([, options]) => !options.method)).toBe(true);
  });

  it('preserves conflicting edits and surfaces private repo failures instead of claiming success', async () => {
    const engine = new GithubSyncEngine('token'); const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    fetcher.mockResolvedValueOnce(Response.json([issue()])); const initial = await engine.syncBoard(board()); initial.tasks[0].title = 'Local';
    fetcher.mockResolvedValueOnce(Response.json([{ ...issue(), title: 'Remote' }]));
    await expect(engine.syncBoard(initial)).rejects.toThrow('both GitHub and Tasky changed title');
    expect(initial.tasks[0].title).toBe('Local');
    fetcher.mockResolvedValueOnce(Response.json({}, { status: 403 }));
    await expect(engine.syncBoard(initial)).rejects.toThrow('403');
    expect(fetcher.mock.calls.every(([, options]) => !options.method)).toBe(true);
  });

  it('uses the production cloud sync path to import issues and persist them before success', async () => {
    let local = emptyBoard(); let base = emptyBoard(); const status = vi.fn();
    const fetcher = vi.fn(async (url: string, options: RequestInit) => {
      if (url === '/api/board' && options.method === 'GET') return Response.json(base.projects.length ? base : board());
      if (url.includes('/issues?')) return Response.json([issue(), issue(2, 'closed')]);
      if (url === '/api/board' && options.method === 'PUT') return Response.json(JSON.parse(options.body as string).next);
      throw new Error(`Unexpected request ${url}`);
    }); vi.stubGlobal('fetch', fetcher);
    const cloud = new BoardCloud({ token: 'token', getLocal: () => local, apply: data => { local = data; }, status,
      saveBase: data => { base = data; }, syncIssues: data => new GithubSyncEngine('token').syncBoard(data) });
    await cloud.sync();
    expect(local.tasks).toHaveLength(2); expect(base).toEqual(local); expect(cloud.dirty()).toBe(false);
    expect(status.mock.lastCall?.[0]).toMatchObject({ syncing: false, error: '', lastSynced: expect.any(Date) });
    await cloud.sync(); expect(fetcher.mock.calls.filter(([url, options]) => url === '/api/board' && options.method === 'PUT')).toHaveLength(1);
  });

  it('does not report success when GitHub or the imported-issue save fails', async () => {
    const status = vi.fn(); let local = emptyBoard();
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json(board())).mockResolvedValueOnce(Response.json({}, { status: 403 }));
    vi.stubGlobal('fetch', fetcher);
    const cloud = new BoardCloud({ token: 'token', getLocal: () => local, apply: data => { local = data; }, status,
      saveBase: vi.fn(), syncIssues: data => new GithubSyncEngine('token').syncBoard(data) });
    await expect(cloud.sync()).rejects.toThrow('403');
    expect(status.mock.lastCall?.[0]).toMatchObject({ syncing: false, lastSynced: null, error: expect.stringContaining('403') });
    fetcher.mockResolvedValueOnce(Response.json(board())).mockResolvedValueOnce(Response.json([issue()])).mockResolvedValueOnce(Response.json({ error: 'Save failed' }, { status: 503 }));
    await expect(cloud.sync()).rejects.toThrow('Save failed');
    expect(local.tasks).toHaveLength(1); expect(cloud.dirty()).toBe(true);
    expect(status.mock.lastCall?.[0].lastSynced).toBeNull();
  });
});
