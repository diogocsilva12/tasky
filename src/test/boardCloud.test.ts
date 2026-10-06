import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { emptyBoard, mergeBoards, parseBoard, type BoardData } from '../lib/boardSync';
import { BoardCloud } from '../services/boardCloud';
import { authorizeChanges, visibleBoard } from '../../server/boardPermissions';
import { GET, PUT } from '../../api/board';

const project = (id = 'real', visibility: 'public' | 'private' = 'public') => ({ id, name: 'Real project', owner: 'alice', visibility, columns: [{ id: 'todo', title: 'Todo', order: 0 }], createdAt: '2026-09-14', updatedAt: '2026-09-14' });
const board = (): BoardData => ({ projects: [project()], tasks: [{ id: 'task', projectId: 'real', columnId: 'todo', title: 'Real task', priority: 'P2', assignees: [], createdAt: '2026-09-14', updatedAt: '2026-09-14' }] });
const fetchMock = vi.fn();
beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const response = (data: unknown, status = 200) => Response.json(data, { status });

describe('shared board merging and permissions', () => {
  it('loads real projects for a fresh member and never adds demos', () => {
    expect(mergeBoards(emptyBoard(), emptyBoard(), board())).toEqual(board());
  });
  it('preserves independent task and project edits from two users', () => {
    const base = board(), a = board(), b = board(); a.tasks[0].title = 'Alice edit'; b.projects[0].name = 'Bob edit';
    const result = mergeBoards(base, a, b);
    expect(result.tasks[0].title).toBe('Alice edit'); expect(result.projects[0].name).toBe('Bob edit');
  });
  it('detects overlapping edits and delete/edit races', () => {
    const base = board(), a = board(), b = board(); a.tasks[0].title = 'Alice'; b.tasks[0].title = 'Bob';
    expect(() => mergeBoards(base, a, b)).toThrow('same item');
    a.tasks = []; expect(() => mergeBoards(base, a, b)).toThrow('same item');
  });
  it('preserves task reordering across sync', () => {
    const base = board(); base.tasks.push({ ...base.tasks[0], id: 'second' });
    const next = structuredClone(base); next.tasks.reverse();
    expect(mergeBoards(base, next, base).tasks.map(t => t.id)).toEqual(['second', 'task']);
  });
  it('propagates deletions without resurrecting tasks', () => {
    const base = board(), next = board(); next.tasks = [];
    expect(mergeBoards(base, next, base).tasks).toEqual([]);
  });
  it('does not return private projects or their tasks to an unrelated approved member', () => {
    const data = board(); data.projects[0].visibility = 'private';
    expect(visibleBoard(data, { username: 'bob', role: 'member' })).toEqual(emptyBoard());
    data.projects[0].allowedUsers = ['BOB'];
    expect(visibleBoard(data, { username: 'bob', role: 'member' })).toEqual(data);
  });
  it('retains hidden projects during another member save', () => {
    const current = board(); current.projects.push(project('hidden', 'private'));
    const base = visibleBoard(current, { username: 'bob' }); const next = structuredClone(base); next.tasks[0].title = 'Member edit';
    const merged = mergeBoards(base, next, current);
    expect(merged.projects).toHaveLength(2);
    expect(() => authorizeChanges(current, merged, { username: 'bob', role: 'member' })).not.toThrow();
  });
  it('rejects forged ownership, private task writes, and unauthorized visibility changes', () => {
    const current = board(), next = board(); next.projects[0].visibility = 'private';
    expect(() => authorizeChanges(current, next, { username: 'bob' })).toThrow();
    expect(() => authorizeChanges(emptyBoard(), current, { username: 'bob' })).toThrow();
    current.projects[0].visibility = 'private'; next.tasks[0].title = 'attack';
    expect(() => authorizeChanges(current, next, { username: 'bob' })).toThrow();
  });
  it('rejects duplicate ids and broken column references', () => {
    const data = board(); data.tasks.push(data.tasks[0]); expect(() => parseBoard(data)).toThrow();
    data.tasks.pop(); data.tasks[0].columnId = 'missing'; expect(() => parseBoard(data)).toThrow();
  });
});

describe('cloud sync lifecycle', () => {
  it('reads shared projects for a new browser and pushes subsequent edits', async () => {
    let local = emptyBoard(); let base = emptyBoard();
    const cloud = new BoardCloud({ token: 'member', getLocal: () => local, apply: data => { local = data; }, status: vi.fn(), saveBase: data => { base = data; } });
    fetchMock.mockResolvedValueOnce(response(board())); await cloud.sync();
    expect(local).toEqual(board()); expect(fetchMock.mock.calls[0][1].method).toBe('GET');
    local.tasks[0].title = 'Saved edit'; fetchMock.mockResolvedValueOnce(response(local)); await cloud.sync();
    expect(fetchMock.mock.calls[1][1].method).toBe('PUT'); expect(base.tasks[0].title).toBe('Saved edit');
  });
  it('keeps edits made while a save is in flight and syncs them next', async () => {
    let local = board(); const base = board(); local.tasks[0].title = 'First';
    const cloud = new BoardCloud({ token: 'member', base, getLocal: () => local, apply: data => { local = data; }, status: vi.fn(), saveBase: vi.fn() });
    let finish!: (r: Response) => void;
    fetchMock.mockImplementationOnce(() => new Promise<Response>(resolve => { finish = resolve; }));
    const pending = cloud.sync(); const saved = structuredClone(local); local.tasks[0].title = 'Second'; finish(response(saved)); await pending;
    expect(local.tasks[0].title).toBe('Second'); expect(cloud.dirty()).toBe(true);
  });
  it('keeps local edits on failed saves and does not claim success', async () => {
    let local = board(); const status = vi.fn();
    const cloud = new BoardCloud({ token: 'member', getLocal: () => local, apply: data => { local = data; }, status, saveBase: vi.fn() });
    fetchMock.mockResolvedValueOnce(response({ error: 'Conflict' }, 409));
    await expect(cloud.sync()).rejects.toThrow('Conflict'); expect(local).toEqual(board()); expect(status.mock.lastCall?.[0].lastSynced).toBeNull();
  });
  it('discards responses after logout', async () => {
    const apply = vi.fn(); const cloud = new BoardCloud({ token: 'member', getLocal: emptyBoard, apply, status: vi.fn(), saveBase: vi.fn() });
    fetchMock.mockResolvedValueOnce(response(board())); const pending = cloud.sync(); cloud.stop(); await pending; expect(apply).not.toHaveBeenCalled();
  });
});

describe('Vercel API authentication and persistence', () => {
  function authenticated(data = board(), login = 'bob', role = 'member') {
    vi.stubEnv('TASKY_STORAGE_TOKEN', 'server-only');
    fetchMock.mockResolvedValueOnce(response({ login }));
    fetchMock.mockResolvedValueOnce(response({ owner: { login: 'diogocsilva12' }, files: { 'tasky-passlist.json': { content: JSON.stringify([{ username: login, role }]) } } }));
    fetchMock.mockResolvedValueOnce(response({ sha: 'current-sha', encoding: 'base64', content: Buffer.from(JSON.stringify(data)).toString('base64') }));
  }
  it('rejects unauthenticated and demo requests before touching storage', async () => {
    expect((await GET(new Request('https://tasky.test/api/board'))).status).toBe(401);
    expect((await GET(new Request('https://tasky.test/api/board', { headers: { Authorization: 'Bearer demo-admin' } }))).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('rejects non-approved GitHub accounts', async () => {
    vi.stubEnv('TASKY_STORAGE_TOKEN', 'server-only');
    fetchMock.mockResolvedValueOnce(response({ login: 'stranger' }));
    fetchMock.mockResolvedValueOnce(response({ owner: { login: 'diogocsilva12' }, files: { 'tasky-passlist.json': { content: '[]' } } }));
    expect((await GET(new Request('https://tasky.test/api/board', { headers: { Authorization: 'Bearer user-token' } }))).status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('filters private data on the server', async () => {
    const data = board(); data.projects[0].visibility = 'private'; authenticated(data);
    const result = await GET(new Request('https://tasky.test/api/board', { headers: { Authorization: 'Bearer user-token' } }));
    expect(result.status).toBe(200); expect(await result.json()).toEqual(emptyBoard());
  });
  it('saves member edits with a SHA precondition and server-only storage credential', async () => {
    const base = board(), next = board(); next.tasks[0].title = 'Member edit'; authenticated(); fetchMock.mockResolvedValueOnce(response({}));
    const result = await PUT(new Request('https://tasky.test/api/board', { method: 'PUT', headers: { Authorization: 'Bearer user-token' }, body: JSON.stringify({ base, next }) }));
    expect(result.status).toBe(200);
    const options = fetchMock.mock.calls[3][1]; expect(JSON.parse(options.body).sha).toBe('current-sha'); expect(options.headers.Authorization).toBe('Bearer server-only');
    expect(await result.json()).toEqual(next);
  });
  it('rejects stale simultaneous saves instead of overwriting storage', async () => {
    const base = board(), next = board(); next.tasks[0].title = 'Edit'; authenticated(); fetchMock.mockResolvedValueOnce(response({}, 409));
    const result = await PUT(new Request('https://tasky.test/api/board', { method: 'PUT', headers: { Authorization: 'Bearer user-token' }, body: JSON.stringify({ base, next }) }));
    expect(result.status).toBe(409);
  });
});
