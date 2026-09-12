import { describe, it, expect, beforeEach } from 'vitest';
import { boardStore } from '@/store/boardStore';

describe('Views & Collaboration (Command Palette, Timeline, Task Comments)', () => {
  beforeEach(() => {
    boardStore.resetToSampleData();
  });

  it('adds comments to a task with author, avatarUrl, and timestamp', () => {
    const task = boardStore.getState().tasks[0];
    expect(task).toBeDefined();

    const initialCommentsCount = task.comments?.length || 0;
    boardStore.addComment(
      task.id,
      'Testing real-time collaboration comment thread!',
      'diogocsilva12',
      'https://github.com/diogocsilva12.png'
    );

    const updatedTask = boardStore.getState().tasks.find((t) => t.id === task.id);
    expect(updatedTask).toBeDefined();
    expect(updatedTask?.comments).toBeDefined();
    expect(updatedTask?.comments?.length).toBe(initialCommentsCount + 1);

    const lastComment = updatedTask?.comments?.[updatedTask.comments.length - 1];
    expect(lastComment?.content).toBe('Testing real-time collaboration comment thread!');
    expect(lastComment?.author).toBe('diogocsilva12');
    expect(lastComment?.avatarUrl).toBe('https://github.com/diogocsilva12.png');
    expect(lastComment?.createdAt).toBeDefined();
  });

  it('deletes a comment from a task', () => {
    const task = boardStore.getState().tasks[0];
    boardStore.addComment(task.id, 'Comment to be removed', 'guest');

    let updated = boardStore.getState().tasks.find((t) => t.id === task.id);
    const commentToDelete = updated?.comments?.find((c) => c.content === 'Comment to be removed');
    expect(commentToDelete).toBeDefined();

    boardStore.deleteComment(task.id, commentToDelete!.id);

    updated = boardStore.getState().tasks.find((t) => t.id === task.id);
    const stillExists = updated?.comments?.some((c) => c.id === commentToDelete!.id);
    expect(stillExists).toBe(false);
  });

  it('preserves comments when moving tasks between columns', () => {
    const task = boardStore.getState().tasks[0];
    boardStore.addComment(task.id, 'Comment that should persist on move', 'diogocsilva12');

    const targetColumn = 'col-4'; // Shipped
    boardStore.moveTask(task.id, targetColumn);

    const movedTask = boardStore.getState().tasks.find((t) => t.id === task.id);
    expect(movedTask?.columnId).toBe(targetColumn);
    expect(movedTask?.comments?.some((c) => c.content === 'Comment that should persist on move')).toBe(true);
  });

  it('filters and matches tasks by query for Command Palette search', () => {
    const state = boardStore.getState();
    const tasks = state.tasks;

    const query = 'dnd';
    const matches = tasks.filter((t) => {
      const q = query.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    });

    expect(matches.length).toBeGreaterThan(0);
    expect(matches.some((t) => t.title.toLowerCase().includes('dnd') || t.tags?.includes('dnd'))).toBe(true);
  });
});
