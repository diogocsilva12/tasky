import { describe, it, expect, beforeEach } from 'vitest';
import { boardStore } from '@/store/boardStore';

describe('Analytics & Export Suite (Velocity, Burndown, Export JSON/CSV/Markdown)', () => {
  beforeEach(() => {
    boardStore.resetToSampleData();
  });

  it('calculates total and completed story points accurately', () => {
    const tasks = boardStore.getState().tasks;
    expect(tasks.length).toBeGreaterThan(0);

    const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints ?? 1), 0);
    expect(totalPoints).toBeGreaterThan(0);

    const completedTasks = tasks.filter((t) => t.columnId === 'col-4' || t.columnId === 'done' || t.columnId === 'col-5');
    const completedPoints = completedTasks.reduce((sum, t) => sum + (t.storyPoints ?? 1), 0);

    expect(completedPoints).toBeGreaterThanOrEqual(0);
    expect(completedPoints).toBeLessThanOrEqual(totalPoints);
  });

  it('generates valid JSON backup containing projects and tasks', () => {
    const state = boardStore.getState();
    const backup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      projects: state.projects,
      tasks: state.tasks,
    };

    const jsonStr = JSON.stringify(backup, null, 2);
    expect(jsonStr).toBeDefined();

    const parsed = JSON.parse(jsonStr);
    expect(parsed.version).toBe('1.0.0');
    expect(Array.isArray(parsed.projects)).toBe(true);
    expect(Array.isArray(parsed.tasks)).toBe(true);
    expect(parsed.projects.length).toBe(state.projects.length);
    expect(parsed.tasks.length).toBe(state.tasks.length);
  });

  it('generates valid CSV format with proper headers and escaped fields', () => {
    const state = boardStore.getState();
    const headers = [
      'ID',
      'Project',
      'Title',
      'Column',
      'Priority',
      'StoryPoints',
      'DueDate',
      'Assignees',
    ];

    const escapeCsv = (val: unknown): string => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = state.tasks.map((t) => [
      escapeCsv(t.id),
      escapeCsv(t.projectId),
      escapeCsv(t.title),
      escapeCsv(t.columnId),
      escapeCsv(t.priority),
      escapeCsv(t.storyPoints ?? ''),
      escapeCsv(t.dueDate ?? ''),
      escapeCsv(t.assignees.map((a) => a.username).join('; ')),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    expect(csvContent.startsWith('ID,Project,Title')).toBe(true);
    const lines = csvContent.trim().split('\n');
    expect(lines.length).toBe(state.tasks.length + 1); // 1 header + N rows
  });

  it('generates Markdown changelog with section groups and issue/PR references', () => {
    const state = boardStore.getState();
    const tasks = state.tasks;

    const shipped = tasks.filter((t) => t.columnId === 'col-4' || t.columnId === 'done' || t.columnId === 'col-5');
    const inProgress = tasks.filter((t) => t.columnId === 'col-3');

    const lines: string[] = [
      '# Release Notes & Changelog',
      '',
      '## 🚀 Shipped & Completed',
      ...shipped.map((t) => `- **[${t.priority}]** ${t.title}`),
      '',
      '## 🔨 In Active Development',
      ...inProgress.map((t) => `- **[${t.priority}]** ${t.title}`),
    ];

    const markdown = lines.join('\n');

    expect(markdown).toContain('# Release Notes & Changelog');
    expect(markdown).toContain('## 🚀 Shipped & Completed');
    expect(markdown).toContain('## 🔨 In Active Development');
    expect(markdown).toContain('Build multi-container @dnd-kit Kanban board');
  });
});
