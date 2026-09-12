import type { Project } from '@/types';

export interface UserAccessInfo {
  username?: string;
  role?: string;
}

/**
 * Determines whether a user has permission to view and access a project board.
 * - Public projects (default): Accessible to all authenticated users on the pass-list.
 * - Private projects: Accessible only to:
 *   1. Super-admin ('diogocsilva12') or users with role 'admin' / 'super-admin'.
 *   2. The project owner ('project.owner').
 *   3. The repository owner ('project.repoOwner').
 *   4. Users explicitly included in 'project.allowedUsers'.
 */
export function canUserAccessProject(
  project: Project,
  user: UserAccessInfo | null | undefined
): boolean {
  // If project is public (or default undefined), everyone approved can access
  if (!project.visibility || project.visibility === 'public') {
    return true;
  }

  // Private project: user must be authenticated
  if (!user || !user.username) {
    return false;
  }

  const usernameLower = user.username.toLowerCase();

  // Super-admin & Admin bypass: god mode
  if (
    user.role === 'super-admin' ||
    user.role === 'admin' ||
    usernameLower === 'diogocsilva12'
  ) {
    return true;
  }

  // Project owner
  if (project.owner && project.owner.toLowerCase() === usernameLower) {
    return true;
  }

  // Repository owner
  if (project.repoOwner && project.repoOwner.toLowerCase() === usernameLower) {
    return true;
  }

  // Permitted member list
  if (
    Array.isArray(project.allowedUsers) &&
    project.allowedUsers.some((u) => u.toLowerCase() === usernameLower)
  ) {
    return true;
  }

  return false;
}

/**
 * Returns only the projects that the given user has permission to view.
 */
export function getAccessibleProjects(
  projects: Project[],
  user: UserAccessInfo | null | undefined
): Project[] {
  return projects.filter((project) => canUserAccessProject(project, user));
}

/**
 * Determines whether a user can manage project settings and membership access:
 * - Super-admins & Admins
 * - Project owner
 * - Repo owner
 */
export function canUserManageProject(
  project: Project,
  user: UserAccessInfo | null | undefined
): boolean {
  if (!user || !user.username) return false;
  const usernameLower = user.username.toLowerCase();

  if (
    user.role === 'super-admin' ||
    user.role === 'admin' ||
    usernameLower === 'diogocsilva12'
  ) {
    return true;
  }

  if (project.owner && project.owner.toLowerCase() === usernameLower) {
    return true;
  }

  if (project.repoOwner && project.repoOwner.toLowerCase() === usernameLower) {
    return true;
  }

  return false;
}
