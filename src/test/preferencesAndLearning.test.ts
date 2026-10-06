import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { THEMES, themeClasses, resolveTheme } from '../lib/themes';
import { projectMembers, toggleAssignee, parseAssigneeNames } from '../lib/projectMembers';
import { captureRetrospective, learnOrganization, isRetrospective } from '../lib/organizationLearning';
import { sealSession, openSession, SESSION_SECONDS, SESSION_COOKIE } from '../../server/sessionCookie';
import { GET, POST, DELETE } from '../../api/session';
import type { Project, Task } from '../types';
const project: Project = { id: 'p', name: 'Project', owner: 'alice', visibility: 'private', allowedUsers: ['BOB'], columns: [{ id: 'doing', title: 'In progress', order: 0, wipLimit: 3 }, { id: 'done', title: 'Done', order: 1 }], createdAt: '2026-09-01', updatedAt: '2026-09-14' };
const task: Task = { id: 't', projectId: 'p', title: 'Work', columnId: 'done', priority: 'P2', assignees: [{ username: 'alice' }], dueDate: '2026-09-10', completedAt: '2026-09-10T15:00:00Z', createdAt: '2026-09-01', updatedAt: '2026-09-10' };
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe('theme modes', () => {
  it('offers multiple light and dark themes and applies the right base class', () => {
    expect(THEMES.filter(t => t.mode === 'light')).toHaveLength(4);
    expect(THEMES.filter(t => t.mode === 'dark')).toHaveLength(6);
    for (const theme of THEMES) expect(themeClasses(theme.id)[0]).toBe(theme.mode);
    expect(themeClasses('mint')).not.toContain('dark');
  });
  it('recovers from stale or invalid stored themes', () => {
    expect(resolveTheme('unknown')).toBe('dark'); expect(resolveTheme(null, 'light')).toBe('light');
  });
});
describe('project assignee choices', () => {
  const people = [{ username: 'alice' }, { username: 'bob' }, { username: 'stranger' }, { username: 'admin', role: 'admin' }, { username: 'BOB' }];
  it('includes private project members and administrators, excluding unrelated users', () => {
    expect(projectMembers(project, people).map(p => p.username)).toEqual(['admin', 'alice', 'bob']);
  });
  it('offers all approved users on a public project without duplicates', () => {
    expect(projectMembers({ ...project, visibility: 'public' }, people)).toHaveLength(4);
  });
  it('appends comma-separated usernames and toggles without duplicates', () => {
    expect(toggleAssignee('alice', 'bob')).toBe('alice, bob');
    expect(toggleAssignee('alice, BOB', 'bob')).toBe('alice');
    expect(parseAssigneeNames(' @alice, Alice, ,bob ')).toEqual(['alice', 'bob']);
  });
});
describe('organization learning from project outcomes', () => {
  it('records organization and observed metrics with the user outcome', () => {
    const result = captureRetrospective(project, [task], 'success', ' Clear owners helped ', 'alice');
    expect(result.organization).toEqual({ wipLimits: true, reviewStage: false, explicitOwners: true, plannedDates: true });
    expect(result.metrics).toEqual({ total: 1, completed: 1, blocked: 0, onTime: 1, datedCompletions: 1 });
    expect(result.notes).toBe('Clear owners helped'); expect(isRetrospective(result)).toBe(true);
  });
  it('does not invent completion dates or include other project tasks', () => {
    const result = captureRetrospective(project, [{ ...task, completedAt: undefined }, { ...task, id: 'other', projectId: 'other' }], 'partial', '', 'alice');
    expect(result.metrics.total).toBe(1); expect(result.metrics.datedCompletions).toBe(0);
  });
  it('waits for sufficient contrasting examples and learns when outcomes arrive', () => {
    const projects = Array.from({ length: 6 }, (_, i) => {
      const p = { ...project, id: `p-${i}`, columns: project.columns.map(c => ({ ...c, wipLimit: i < 3 ? 3 : undefined })) };
      return { ...p, retrospective: captureRetrospective(p, [], i < 3 ? 'success' : 'unsuccessful', '', 'alice') };
    });
    expect(learnOrganization(projects.slice(0, 5)).patterns).toEqual([]);
    const result = learnOrganization(projects);
    expect(result.reviewed).toBe(6); expect(result.patterns[0].key).toBe('wipLimits');
    expect(result.patterns[0].difference).toBeCloseTo(0.6);
    expect(learnOrganization([...projects, projects[0]]).reviewed).toBe(6);
  });
  it('never invents a result for unreviewed projects or empty tasks', () => {
    expect(learnOrganization([project])).toEqual({ reviewed: 0, patterns: [] });
    expect(captureRetrospective(project, [], 'unsuccessful', '', 'alice').organization.explicitOwners).toBe(false);
  });
  it('rejects corrupt reviews and impossible metrics', () => {
    const result = captureRetrospective(project, [task], 'success', '', 'alice');
    expect(isRetrospective({ ...result, metrics: { ...result.metrics, completed: 10 } })).toBe(false);
  });
});
describe('remembered session protection', () => {
  beforeEach(() => vi.stubEnv('TASKY_SESSION_SECRET', Buffer.alloc(32, 7).toString('base64url')));
  it('encrypts the token with randomized authenticated encryption', () => {
    const cookie = sealSession('private-test-token', 1000);
    expect(cookie).not.toContain('private-test-token'); expect(openSession(cookie, 1001)).toBe('private-test-token');
    expect(sealSession('private-test-token', 1000)).not.toBe(cookie);
  });
  it('rejects modified and expired cookies', () => {
    const cookie = sealSession('test-token', 1000);
    const bytes = Buffer.from(cookie, 'base64url'); bytes[30] ^= 1;
    expect(openSession(bytes.toString('base64url'), 1001)).toBeNull();
    expect(openSession(cookie, 1000 + SESSION_SECONDS * 1000)).toBeNull();
  });
  it('sets an HttpOnly Secure Strict cookie only after validating GitHub credentials', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ login: 'alice' })));
    const response = await POST(new Request('https://tasky.test/api/session', { method: 'POST', headers: { Authorization: 'Bearer test-token', Origin: 'https://tasky.test' } }));
    expect(response.status).toBe(200); const cookie = response.headers.get('set-cookie')!;
    expect(cookie).toContain('HttpOnly; Secure; SameSite=Strict'); expect(cookie).toContain(`Max-Age=${SESSION_SECONDS}`); expect(cookie).not.toContain('test-token');
    const restored = await GET(new Request('https://tasky.test/api/session', { headers: { Cookie: cookie.split(';')[0] } }));
    expect(await restored.json()).toEqual({ token: 'test-token' }); expect(restored.headers.get('cache-control')).toBe('no-store');
  });
  it('clears the cookie on sign-out and rejects cross-site requests', async () => {
    const response = await DELETE(new Request('https://tasky.test/api/session', { method: 'DELETE' }));
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
    const blocked = await GET(new Request('https://tasky.test/api/session', { headers: { Origin: 'https://attacker.test' } }));
    expect(blocked.status).toBe(403);
  });
  it('does not remember invalid or demo tokens', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({}, { status: 401 })));
    expect((await POST(new Request('https://tasky.test/api/session', { method: 'POST', headers: { Authorization: 'Bearer bad' } }))).status).toBe(401);
    expect((await POST(new Request('https://tasky.test/api/session', { method: 'POST', headers: { Authorization: 'Bearer demo-admin' } }))).status).toBe(401);
  });
  it('treats malformed cookies as signed out and removes them', async () => {
    const response = await GET(new Request('https://tasky.test/api/session', { headers: { Cookie: `${SESSION_COOKIE}=broken` } }));
    expect(await response.json()).toEqual({ token: null }); expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
  });
});
