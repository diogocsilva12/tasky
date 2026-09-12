export type Priority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';

export interface Assignee {
  username: string;
  name?: string;
  avatarUrl?: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  columnId: string;
  priority: Priority;
  assignees: Assignee[];
  githubIssueNumber?: number;
  githubItemId?: string;
  githubUrl?: string;
  branchName?: string;
  isBlocked?: boolean;
  blockerReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  title: string;
  color?: string;
  order: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  repoOwner?: string;
  repoName?: string;
  defaultBranch?: string;
  activeBranch?: string;
  githubProjectId?: string;
  githubUrl?: string;
  columns: Column[];
  createdAt: string;
  updatedAt: string;
}

export interface BoardFilter {
  searchQuery: string;
  priority: Priority | 'ALL';
  assignee: string | 'ALL';
  onlyBlocked?: boolean;
}

export interface PassListEntry {
  username: string;
  approvedAt: string;
  approvedBy: string;
  avatarUrl?: string;
  role: 'admin' | 'member';
}

export interface AccessRequest {
  id: string;
  username: string;
  name?: string;
  avatarUrl?: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
}

export interface AuthUser {
  username: string;
  name?: string;
  avatarUrl?: string;
  token: string;
  isAdmin: boolean;
  isApproved: boolean;
  scopes: string[];
  isDemo?: boolean;
}

export type Theme =
  | 'dark'
  | 'light'
  | 'slate'
  | 'midnight'
  | 'zinc'
  | 'cyberpunk'
  | 'monokai';
