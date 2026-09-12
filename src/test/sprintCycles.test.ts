import { describe, it, expect, beforeEach } from 'vitest';
import { boardStore, getFilteredTasks } from '@/store/boardStore';
import {
  getTaskLeadTimeDays,
  getTaskCycleTimeDays,
  calculateTeamMetrics,
  calculateSprintProgress,
} from '@/lib/sprintMetrics';
import type { Task, Sprint } from '@/types';

describe('Sprint Cycles & Lead/Cycle Time Metrics', () => {
  beforeEach(() => {
    boardStore.resetToSampleData();
  });

  describe('Lead Time & Cycle Time Calculations', () => {
    it('calculates lead time and cycle time in days', () => {
      const mockTask: Task = {
        id: 'test-1',
        projectId: 'proj-core-engine',
        title: 'Metric Test Task',
        columnId: 'col-done',
        priority: 'P1',
        assignees: [],
        createdAt: '2026-09-01T10:00:00.000Z',
        startedAt: '2026-09-03T10:00:00.000Z',
        completedAt: '2026-09-05T10:00:00.000Z',
        updatedAt: '2026-09-05T10:00:00.000Z',
      };

      const leadTime = getTaskLeadTimeDays(mockTask);
      const cycleTime = getTaskCycleTimeDays(mockTask);

      expect(leadTime).toBe(4);
      expect(cycleTime).toBe(2);
    });

    it('calculates team-wide lead and cycle time metrics', () => {
      const tasks: Task[] = [
        {
          id: 't-1',
          projectId: 'proj-1',
          title: 'Task 1',
          columnId: 'done',
          priority: 'P2',
          assignees: [],
          storyPoints: 5,
          createdAt: '2026-09-01T00:00:00.000Z',
          startedAt: '2026-09-02T00:00:00.000Z',
          completedAt: '2026-09-04T00:00:00.000Z',
          updatedAt: '2026-09-04T00:00:00.000Z',
        },
        {
          id: 't-2',
          projectId: 'proj-1',
          title: 'Task 2',
          columnId: 'done',
          priority: 'P3',
          assignees: [],
          storyPoints: 3,
          createdAt: '2026-09-01T00:00:00.000Z',
          startedAt: '2026-09-01T12:00:00.000Z',
          completedAt: '2026-09-02T00:00:00.000Z',
          updatedAt: '2026-09-02T00:00:00.000Z',
        },
      ];

      const metrics = calculateTeamMetrics(tasks);
      expect(metrics.completedTasksCount).toBe(2);
      expect(metrics.totalStoryPoints).toBe(8);
      expect(metrics.completedStoryPoints).toBe(8);
      expect(metrics.avgLeadTimeDays).toBeGreaterThan(0);
      expect(metrics.avgCycleTimeDays).toBeGreaterThan(0);
      expect(metrics.cycleEfficiencyPercent).toBeGreaterThan(0);
    });

    it('computes sprint progress and remaining velocity', () => {
      const sprint: Sprint = {
        id: 'sprint-demo',
        projectId: 'proj-core-engine',
        name: 'Sprint Demo',
        startDate: '2026-09-01T00:00:00.000Z',
        endDate: '2026-09-20T00:00:00.000Z',
        status: 'active',
        velocityTarget: 20,
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z',
      };

      const sprintTasks: Task[] = [
        {
          id: 's-1',
          projectId: 'proj-core-engine',
          sprintId: 'sprint-demo',
          title: 'Sprint Task 1',
          columnId: 'col-done',
          priority: 'P1',
          assignees: [],
          storyPoints: 8,
          completedAt: '2026-09-10T00:00:00.000Z',
          createdAt: '2026-09-01T00:00:00.000Z',
          updatedAt: '2026-09-10T00:00:00.000Z',
        },
        {
          id: 's-2',
          projectId: 'proj-core-engine',
          sprintId: 'sprint-demo',
          title: 'Sprint Task 2',
          columnId: 'col-3',
          priority: 'P2',
          assignees: [],
          storyPoints: 5,
          createdAt: '2026-09-01T00:00:00.000Z',
          updatedAt: '2026-09-01T00:00:00.000Z',
        },
      ];

      const progress = calculateSprintProgress(sprint, sprintTasks);
      expect(progress.totalTasks).toBe(2);
      expect(progress.completedTasks).toBe(1);
      expect(progress.remainingTasks).toBe(1);
      expect(progress.completedPoints).toBe(8);
      expect(progress.totalPoints).toBe(13);
      expect(progress.percentComplete).toBe(62); // 8/13 * 100
    });
  });

  describe('BoardStore Sprint Lifecycle & Rollovers', () => {
    it('creates, starts, and switches active sprint', () => {
      const newSprint = boardStore.addSprint({
        projectId: 'proj-core-engine',
        name: 'Sprint 16: Future Horizon',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 14 * 86400000).toISOString(),
        status: 'planned',
        velocityTarget: 30,
      });

      expect(newSprint.id).toBeDefined();
      expect(newSprint.status).toBe('planned');

      // Start new sprint
      boardStore.startSprint(newSprint.id);

      const state = boardStore.getState();
      const updatedSprint = state.sprints.find((s) => s.id === newSprint.id);
      expect(updatedSprint?.status).toBe('active');

      // Previous active sprint should be marked completed
      const prevActive = state.sprints.find((s) => s.id === 'sprint-core-1');
      expect(prevActive?.status).toBe('completed');
    });

    it('completes sprint and rolls over incomplete tasks to next sprint', () => {
      const activeSprint = boardStore
        .getState()
        .sprints.find((s) => s.id === 'sprint-core-1')!;
      expect(activeSprint.status).toBe('active');

      const initialTasks = boardStore.getState().tasks;
      const sprintIncompleteTasks = initialTasks.filter(
        (t) => t.sprintId === activeSprint.id && t.columnId !== 'col-5'
      );
      expect(sprintIncompleteTasks.length).toBeGreaterThan(0);

      // Complete with rollover to nextSprint
      boardStore.completeSprint(activeSprint.id, 'nextSprint');

      const state = boardStore.getState();
      const completedSprint = state.sprints.find((s) => s.id === activeSprint.id);
      expect(completedSprint?.status).toBe('completed');
      expect(completedSprint?.completedAt).toBeDefined();

      // Next planned sprint should now inherit uncompleted tasks
      const nextSprint = state.sprints.find((s) => s.id === 'sprint-core-2');
      expect(nextSprint).toBeDefined();

      const rolledOverTask = state.tasks.find((t) => t.id === sprintIncompleteTasks[0].id);
      expect(rolledOverTask?.sprintId).toBe(nextSprint?.id);
    });

    it('completes sprint and rolls over incomplete tasks to backlog', () => {
      const activeSprint = boardStore
        .getState()
        .sprints.find((s) => s.id === 'sprint-core-1')!;

      const incompleteTask = boardStore
        .getState()
        .tasks.find((t) => t.sprintId === activeSprint.id && t.columnId !== 'col-5')!;

      boardStore.completeSprint(activeSprint.id, 'backlog');

      const state = boardStore.getState();
      const updatedTask = state.tasks.find((t) => t.id === incompleteTask.id);
      expect(updatedTask?.sprintId).toBeUndefined();
    });

    it('automatically sets startedAt and completedAt timestamps on moveTask', () => {
      const tasks = boardStore.getState().tasks;
      const targetTask = tasks.find((t) => t.projectId === 'proj-core-engine' && t.columnId === 'col-1')!;

      expect(targetTask.startedAt).toBeUndefined();
      expect(targetTask.completedAt).toBeUndefined();

      // Move to In Progress (col-3)
      boardStore.moveTask(targetTask.id, 'col-3');
      let updatedTask = boardStore.getState().tasks.find((t) => t.id === targetTask.id)!;
      expect(updatedTask.startedAt).toBeDefined();
      expect(updatedTask.completedAt).toBeUndefined();

      // Move to Done (col-5)
      boardStore.moveTask(targetTask.id, 'col-5');
      updatedTask = boardStore.getState().tasks.find((t) => t.id === targetTask.id)!;
      expect(updatedTask.completedAt).toBeDefined();

      // Move back to Review (col-4)
      boardStore.moveTask(targetTask.id, 'col-4');
      updatedTask = boardStore.getState().tasks.find((t) => t.id === targetTask.id)!;
      expect(updatedTask.completedAt).toBeUndefined();
    });

    it('filters tasks by active sprint', () => {
      const state = boardStore.getState();
      const allTasks = state.tasks.filter((t) => t.projectId === 'proj-core-engine');

      const sprintOnly = getFilteredTasks(
        state.tasks,
        'proj-core-engine',
        { ...boardStore.getState().filter, sprintId: 'active' }
      );

      expect(sprintOnly.length).toBeGreaterThan(0);
      expect(sprintOnly.every((t) => t.sprintId === 'sprint-core-1')).toBe(true);
      expect(sprintOnly.length).toBeLessThanOrEqual(allTasks.length);
    });
  });
});
