import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { AccessPendingPage } from '../components/auth/AccessPendingPage';
const auth = vi.hoisted(() => ({ user: { username: 'alice' }, authState: 'pending', pendingRequests: [] as { username: string; status: string }[], requestAccess: vi.fn(), logout: vi.fn(), refreshPassList: vi.fn() }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => auth }));
describe('access request page', () => {
  it('offers submission for an unapproved user who has not requested access', () => {
    auth.pendingRequests = [];
    const html = renderToString(<AccessPendingPage />);
    expect(html).toContain('Request Access');
    expect(html).not.toContain('Your request is awaiting');
    expect(html).toContain('Check approval status');
  });
  it('shows waiting state only for a recorded request belonging to the user', () => {
    auth.pendingRequests = [{ username: 'ALICE', status: 'pending' }];
    const html = renderToString(<AccessPendingPage />);
    expect(html).toContain('Your request is awaiting admin approval');
    expect(html).not.toContain('Request Access');
  });
  it('does not mistake another user request for the current user request', () => {
    auth.pendingRequests = [{ username: 'bob', status: 'pending' }];
    expect(renderToString(<AccessPendingPage />)).toContain('Request Access');
  });
});
