import { describe, it, expect, beforeEach } from 'vitest';
import { boardStore, getFilteredTasks, INITIAL_PROJECTS } from '@/store/boardStore';
import { getCleanRepoDetails } from '@/lib/githubUrl';
import { fetchBranchCommits } from '@/services/githubCommits';
import type { Task, BoardFilter } from '@/types';

describe('GitHub Dev Features (PR Linking, Auto-Move on Merge, Milestones, Commits)', () => {
  beforeEach(() => {
    boardStore.resetToSampleData();
  });

  it('generates correct clean PR URLs', () => {
    const details = getCleanRepoDetails({
      repoOwner: 'diogocsilva12',
      repoName: 'tasky.git',
      defaultBranch: 'main',
    });

    expect(details.prUrl(42)).toBe('https://github.com/diogocsilva12/tasky/pull/42');
  });

  it('automatically moves task to Done/Shipped column when PR status is merged', () => {
    const proj = INITIAL_PROJECTS[0];
    const task = boardStore.addTask({
      projectId: proj.id,
      title: 'Feature PR in Progress',
      columnId: 'col-2', // To Do
      priority: 'P1',
      assignees: [],
      githubPrNumber: 77,
      prStatus: 'open',
    });

    expect(task.columnId).toBe('col-2');

    // Update PR status to 'merged'
    boardStore.updateTask(task.id, {
      prStatus: 'merged',
    });

    const updated = boardStore.getState().tasks.find((t) => t.id === task.id)!;
    expect(updated.prStatus).toBe('merged');
    // col-5 is 'Done' in INITIAL_PROJECTS[0]
    expect(updated.columnId).toBe('col-5');
  });

  it('filters tasks by milestone in getFilteredTasks', () => {
    const activeProjId = 'proj-core-engine';
    const sampleTasks: Task[] = [
      {
        id: 't-m1',
        projectId: activeProjId,
        title: 'MVP Feature A',
        columnId: 'col-1',
        priority: 'P1',
        assignees: [],
        milestone: 'v1.0-mvp',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 't-m2',
        projectId: activeProjId,
        title: 'v2.0 Next Gen Feature',
        columnId: 'col-1',
        priority: 'P2',
        assignees: [],
        milestone: 'v2.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const filterAll: BoardFilter = {
      searchQuery: '',
      priority: 'ALL',
      assignee: 'ALL',
      milestone: 'ALL',
    };
    expect(getFilteredTasks(sampleTasks, activeProjId, filterAll)).toHaveLength(2);

    const filterMvp: BoardFilter = {
      ...filterAll,
      milestone: 'v1.0-mvp',
    };
    const mvpMatches = getFilteredTasks(sampleTasks, activeProjId, filterMvp);
    expect(mvpMatches).toHaveLength(1);
    expect(mvpMatches[0].id).toBe('t-m1');
  });

  it('fetches commits or returns fallback simulated commits', async () => {
    const commits = await fetchBranchCommits('diogocsilva12', 'tasky', 'main');
    expect(Array.isArray(commits)).toBe(true);
    expect(commits.length).toBeGreaterThan(0);
    expect(commits[0]).toHaveProperty('sha');
    expect(commits[0]).toHaveProperty('message');
    expect(commits[0]).toHaveProperty('authorName');
  });
});
