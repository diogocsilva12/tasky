import type { OrganizationEvent } from '../lib/organizationHistory.js';
import type { ProjectRetrospective } from '../lib/organizationLearning.js';
export type Priority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';

export interface Assignee {
  username: string;
  name?: string;
  avatarUrl?: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export type PrStatus = 'open' | 'merged' | 'closed' | 'draft';

export interface TaskComment {
  id: string;
  author: string;
  avatarUrl?: string;
  content: string;
  createdAt: string;
}

export interface TaskActivity {
  id: string;
  actor?: Assignee;
  at: string;
  action: string;
  changes: { field: string; before: string; after: string }[];
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  columnId: string;
  priority: Priority;
  assignees: Assignee[];
  reviewers?: Assignee[];
  creator?: Assignee;
  activity?: TaskActivity[];
  githubIssueNumber?: number;
  githubSyncBase?: { title: string; body: string; state: 'open' | 'closed'; assignees: string[]; priority: Priority };
  githubPrNumber?: number;
  prStatus?: PrStatus;
  milestone?: string;
  githubItemId?: string;
  githubUrl?: string;
  branchName?: string;
  isBlocked?: boolean;
  blockerReason?: string;
  subtasks?: Subtask[];
  tags?: string[];
  dueDate?: string;
  storyPoints?: number;
  startedAt?: string;
  completedAt?: string;
  comments?: TaskComment[];
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  title: string;
  color?: string;
  order: number;
  wipLimit?: number;
}

export type ProjectVisibility = 'public' | 'private';

export interface Project {
  organizationHistory?: OrganizationEvent[];
  retrospective?: ProjectRetrospective;
  id: string;
  name: string;
  description?: string;
  deadline?: string;
  startDate?: string;
  visibility?: ProjectVisibility;
  owner?: string;
  allowedUsers?: string[];
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
  tag?: string | 'ALL';
  milestone?: string | 'ALL';
  onlyBlocked?: boolean;
  onlyOverdue?: boolean;
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
  | 'sand'
  | 'mint'
  | 'lavender'
  | 'slate'
  | 'midnight'
  | 'zinc'
  | 'cyberpunk'
  | 'monokai';
