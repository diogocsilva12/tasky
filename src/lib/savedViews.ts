import type { BoardFilter } from '@/types';

export interface ViewSettings { projectIds: string[] | null; filter: BoardFilter }
export interface SavedView extends ViewSettings { id: string; name: string }
export interface SavedViewsData { current: ViewSettings; views: SavedView[] }
export const defaultView = (): ViewSettings => ({ projectIds: null, filter: { searchQuery: '', priority: 'ALL', assignee: 'ALL' } });
const key = (username: string) => `tasky_views_v1:${username.toLowerCase()}`;

function validSettings(value: unknown): value is ViewSettings {
  if (!value || typeof value !== 'object') return false;
  const data = value as Partial<ViewSettings>;
  const filter = data.filter;
  return (data.projectIds === null || Array.isArray(data.projectIds) && data.projectIds.every((id) => typeof id === 'string')) &&
    !!filter && typeof filter.searchQuery === 'string' && typeof filter.assignee === 'string' &&
    ['ALL', 'P0', 'P1', 'P2', 'P3', 'P4'].includes(filter.priority) &&
    (filter.tag === undefined || typeof filter.tag === 'string') &&
    (filter.milestone === undefined || typeof filter.milestone === 'string') &&
    (filter.onlyBlocked === undefined || typeof filter.onlyBlocked === 'boolean') &&
    (filter.onlyOverdue === undefined || typeof filter.onlyOverdue === 'boolean');
}

export function loadSavedViews(username: string): SavedViewsData {
  try {
    const data = JSON.parse(localStorage.getItem(key(username)) || 'null');
    if (data && validSettings(data.current) && Array.isArray(data.views)) {
      return { current: data.current, views: data.views.filter((view: unknown) => validSettings(view) && typeof (view as SavedView).id === 'string' && typeof (view as SavedView).name === 'string') };
    }
  } catch { /* Missing or corrupt settings start with all projects. */ }
  return { current: defaultView(), views: [] };
}

export function saveViews(username: string, data: SavedViewsData): boolean {
  try { localStorage.setItem(key(username), JSON.stringify(data)); return true; } catch { return false; }
}

export function shortcutView(kind: 'mine' | 'blocked' | 'overdue', username: string, projectIds: string[] | null): ViewSettings {
  const settings = { ...defaultView(), projectIds };
  if (kind === 'mine') settings.filter.assignee = username;
  if (kind === 'blocked') settings.filter.onlyBlocked = true;
  if (kind === 'overdue') settings.filter.onlyOverdue = true;
  return settings;
}
