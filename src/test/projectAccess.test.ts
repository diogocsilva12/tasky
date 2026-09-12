import { describe, it, expect } from 'vitest';
import {
  canUserAccessProject,
  getAccessibleProjects,
  canUserManageProject,
} from '../lib/projectAccess';
import type { Project } from '../types';

const samplePublicProject: Project = {
  id: 'proj-public',
  name: 'Public Team Project',
  visibility: 'public',
  owner: 'diogocsilva12',
  columns: [],
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

const samplePrivateProject: Project = {
  id: 'proj-private',
  name: 'Confidential Core Secret',
  visibility: 'private',
  owner: 'diogocsilva12',
  allowedUsers: ['sarah-chen', 'alex-dev'],
  columns: [],
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

describe('projectAccess control', () => {
  it('allows access to public projects for any user', () => {
    expect(canUserAccessProject(samplePublicProject, null)).toBe(true);
    expect(
      canUserAccessProject(samplePublicProject, { username: 'random-user', role: 'member' })
    ).toBe(true);
  });

  it('restricts private projects from unauthorized users', () => {
    expect(canUserAccessProject(samplePrivateProject, null)).toBe(false);
    expect(
      canUserAccessProject(samplePrivateProject, { username: 'unauthorized-user', role: 'member' })
    ).toBe(false);
  });

  it('grants access to private projects for users in allowedUsers list', () => {
    expect(
      canUserAccessProject(samplePrivateProject, { username: 'sarah-chen', role: 'member' })
    ).toBe(true);
    expect(
      canUserAccessProject(samplePrivateProject, { username: 'ALEX-DEV', role: 'member' })
    ).toBe(true);
  });

  it('grants access to private projects for project owner', () => {
    expect(
      canUserAccessProject(samplePrivateProject, { username: 'diogocsilva12', role: 'member' })
    ).toBe(true);
  });

  it('grants access to private projects for super-admin or admin role', () => {
    expect(
      canUserAccessProject(samplePrivateProject, { username: 'any-admin', role: 'admin' })
    ).toBe(true);
    expect(
      canUserAccessProject(samplePrivateProject, { username: 'diogocsilva12', role: 'super-admin' })
    ).toBe(true);
  });

  it('filters project list to only accessible projects for a user', () => {
    const all = [samplePublicProject, samplePrivateProject];
    const sarahAccessible = getAccessibleProjects(all, { username: 'sarah-chen', role: 'member' });
    expect(sarahAccessible.length).toBe(2);

    const strangerAccessible = getAccessibleProjects(all, { username: 'stranger', role: 'member' });
    expect(strangerAccessible.length).toBe(1);
    expect(strangerAccessible[0].id).toBe('proj-public');

    const adminAccessible = getAccessibleProjects(all, { username: 'stranger', role: 'admin' });
    expect(adminAccessible.length).toBe(2);
  });

  it('validates project management permissions', () => {
    expect(
      canUserManageProject(samplePrivateProject, { username: 'diogocsilva12', role: 'member' })
    ).toBe(true);
    expect(
      canUserManageProject(samplePrivateProject, { username: 'admin-user', role: 'admin' })
    ).toBe(true);
    expect(
      canUserManageProject(samplePrivateProject, { username: 'sarah-chen', role: 'member' })
    ).toBe(false);
  });
});
