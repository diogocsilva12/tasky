import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { fetchGistData, PASSLIST_GIST_ID, submitAccessRequest, updateGistData, type AccessRequest } from '../services/gistPasslist';

const request: AccessRequest = { username: 'alice', avatarUrl: 'avatar', requestedAt: '2026-09-14T00:00:00Z', status: 'pending', note: 'Please add me' };
const member = { username: 'Alice', approvedAt: request.requestedAt, approvedBy: 'diogocsilva12', avatarUrl: 'avatar', role: 'member' };
const gist = (passList: unknown[] = [member], requests: unknown[] = []) => ({
  owner: { login: 'diogocsilva12' },
  files: {
    'tasky-passlist.json': { content: JSON.stringify(passList) },
    'tasky-requests.json': { content: JSON.stringify(requests) },
  },
});
const comment = (login = 'bob') => ({ body: JSON.stringify({ type: 'tasky-access-request-v1', note: 'Access please', username: 'forged-admin', status: 'approved' }), user: { login, avatar_url: 'verified-avatar' }, created_at: request.requestedAt });
const mockFetch = vi.fn();
const reply = (data: unknown, status = 200) => mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(data), { status }));
beforeEach(() => { mockFetch.mockReset(); vi.stubGlobal('fetch', mockFetch); });
afterEach(() => vi.unstubAllGlobals());

describe('shared access storage', () => {
  it('loads existing approvals from the same Gist for owner and member tokens', async () => {
    for (const token of ['owner-token', 'member-token']) {
      reply(gist()); reply([]);
      expect((await fetchGistData(token)).passList).toEqual([member]);
    }
    expect(mockFetch.mock.calls.filter(([url]) => url.endsWith(PASSLIST_GIST_ID))).toHaveLength(2);
    expect(mockFetch.mock.calls.every(([, options]) => !options.method)).toBe(true);
  });
  it('submits requests as comments without writing the pass-list', async () => {
    reply({ id: 1 }, 201);
    await submitAccessRequest('member-token', request);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe(`https://api.github.com/gists/${PASSLIST_GIST_ID}/comments`);
    expect(options.method).toBe('POST');
    expect(JSON.parse(JSON.parse(options.body).body)).toEqual({ type: 'tasky-access-request-v1', note: request.note });
  });
  it('shows incoming requests using GitHub author identity, never caller-supplied roles', async () => {
    reply(gist()); reply([comment()]);
    expect((await fetchGistData('owner-token')).requests).toEqual([{ username: 'bob', avatarUrl: 'verified-avatar', requestedAt: request.requestedAt, status: 'pending', note: 'Access please' }]);
  });
  it('preserves decisions and ignores comments from already approved members', async () => {
    reply(gist([member], [{ ...request, username: 'bob', status: 'rejected' }]));
    reply([comment('BOB'), comment('ALICE')]);
    const data = await fetchGistData('owner-token');
    expect(data.requests).toHaveLength(1);
    expect(data.requests[0].status).toBe('rejected');
  });
  it('paginates comments and deduplicates requests by username', async () => {
    reply(gist()); reply(Array.from({ length: 100 }, () => comment())); reply([comment('charlie')]);
    expect((await fetchGistData('owner-token')).requests.map(r => r.username)).toEqual(['bob', 'charlie']);
    expect(mockFetch.mock.calls[2][0]).toContain('page=2');
  });
  it('ignores unrelated or malformed comments', async () => {
    reply(gist()); reply([{ ...comment(), body: 'hello' }, { ...comment(), body: 'null' }, { ...comment(), user: null }]);
    expect((await fetchGistData('owner-token')).requests).toEqual([]);
  });
  it.each([401, 403, 404, 500])('reports read failures (%s) instead of returning empty approvals', async status => {
    reply({}, status);
    await expect(fetchGistData('member-token')).rejects.toThrow(String(status));
  });
  it('reports failed request submission and approval saves', async () => {
    reply({}, 403);
    await expect(submitAccessRequest('member-token', request)).rejects.toThrow('403');
    reply({}, 403);
    await expect(updateGistData('owner-token', { passList: [], requests: [] })).rejects.toThrow('403');
  });
  it('rejects data from a different owner', async () => {
    reply({ ...gist(), owner: { login: 'attacker' } });
    await expect(fetchGistData('member-token')).rejects.toThrow('owner');
  });
  it('keeps demo access local without sending demo credentials to GitHub', async () => {
    await submitAccessRequest('demo-member', request);
    expect((await fetchGistData('demo-admin')).requests).toContainEqual(request);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
