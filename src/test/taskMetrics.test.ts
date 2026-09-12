import { describe, it, expect, beforeEach } from 'vitest';
import { boardStore } from '@/store/boardStore';
import {
  getTaskLeadTimeDays,
  getTaskCycleTimeDays,
  calculateTeamMetrics,
} from '@/lib/taskMetrics';
import type { Task } from '@/types';

describe('Task Lead/Cycle Time Metrics', () => {
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

  });

  describe('Task lifecycle timestamps', () => {
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

  });
});
