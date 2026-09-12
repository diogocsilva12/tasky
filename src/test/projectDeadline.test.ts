import { describe, it, expect, beforeEach } from 'vitest';
import { boardStore } from '@/store/boardStore';
import {
  getDeadlineStatus,
  formatDeadlineDate,
  getPresetDeadline,
} from '@/lib/dateUtils';

describe('Project Deadline Feature', () => {
  beforeEach(() => {
    boardStore.resetToSampleData();
  });

  describe('Date & Deadline Calculations', () => {
    it('returns empty/fallback status when deadline is undefined or empty', () => {
      const status = getDeadlineStatus(undefined);
      expect(status.hasDeadline).toBe(false);
      expect(status.formattedDate).toBe('');
      expect(status.label).toBe('No deadline set');
    });

    it('formats deadline date into human readable month and day', () => {
      const formatted = formatDeadlineDate('2026-10-31');
      expect(formatted).toContain('Oct');
      expect(formatted).toContain('31');
      expect(formatted).toContain('2026');
    });

    it('calculates overdue deadline correctly', () => {
      // 5 days in the past
      const past = new Date();
      past.setDate(past.getDate() - 5);
      const isoDate = past.toISOString().split('T')[0];

      const status = getDeadlineStatus(isoDate);
      expect(status.hasDeadline).toBe(true);
      expect(status.isOverdue).toBe(true);
      expect(status.daysRemaining).toBeLessThan(0);
      expect(status.label).toContain('overdue');
      expect(status.badgeVariant).toBe('destructive');
    });

    it('calculates due today correctly', () => {
      const today = new Date().toISOString().split('T')[0];
      const status = getDeadlineStatus(today);

      expect(status.hasDeadline).toBe(true);
      expect(status.isDueToday).toBe(true);
      expect(status.label).toBe('Due today');
    });

    it('calculates upcoming future deadline correctly', () => {
      // 30 days in the future
      const future = new Date();
      future.setDate(future.getDate() + 30);
      const isoDate = future.toISOString().split('T')[0];

      const status = getDeadlineStatus(isoDate);
      expect(status.hasDeadline).toBe(true);
      expect(status.isOverdue).toBe(false);
      expect(status.daysRemaining).toBeGreaterThanOrEqual(29);
      expect(status.label).toContain('days left');
    });

    it('generates valid preset deadline dates', () => {
      const week = getPresetDeadline('1week');
      const twoWeeks = getPresetDeadline('2weeks');
      const threeWeeks = getPresetDeadline('3weeks');
      const monthEnd = getPresetDeadline('endOfMonth');
      const quarterEnd = getPresetDeadline('endOfQuarter');

      expect(week).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(twoWeeks).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(threeWeeks).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(monthEnd).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(quarterEnd).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('Board Store Project Deadline Persistence', () => {
    it('initializes sample projects with deadlines', () => {
      const state = boardStore.getState();
      const coreEngine = state.projects.find((p) => p.id === 'proj-core-engine');
      expect(coreEngine).toBeDefined();
      expect(coreEngine?.deadline).toBe('2026-10-31');
    });

    it('updates a project deadline via updateProjectDeadline', () => {
      const state = boardStore.getState();
      const project = state.projects[0];

      boardStore.updateProjectDeadline(project.id, '2026-12-25');

      const updated = boardStore.getState().projects.find((p) => p.id === project.id);
      expect(updated?.deadline).toBe('2026-12-25');
    });

    it('removes a project deadline by setting undefined or empty', () => {
      const state = boardStore.getState();
      const project = state.projects[0];

      boardStore.updateProjectDeadline(project.id, '2026-12-25');
      expect(boardStore.getState().projects.find((p) => p.id === project.id)?.deadline).toBe('2026-12-25');

      // Clear
      boardStore.updateProjectDeadline(project.id, undefined);
      const cleared = boardStore.getState().projects.find((p) => p.id === project.id);
      expect(cleared?.deadline).toBeUndefined();
    });

    it('creates a new project with a deadline', () => {
      const newProj = boardStore.addProject({
        name: 'Mobile App Launch',
        deadline: '2026-11-30',
        visibility: 'public',
      });

      expect(newProj.id).toBeDefined();
      expect(newProj.deadline).toBe('2026-11-30');

      const retrieved = boardStore.getState().projects.find((p) => p.id === newProj.id);
      expect(retrieved?.deadline).toBe('2026-11-30');
    });
  });
});
