import { describe, it, expect, beforeEach } from 'vitest';
import { boardStore } from '@/store/boardStore';

describe('Comments Thread & Conversation Popup', () => {
  beforeEach(() => {
    boardStore.resetToSampleData();
  });

  it('adds a new comment to a task with author and timestamp', () => {
    const tasks = boardStore.getState().tasks;
    expect(tasks.length).toBeGreaterThan(0);
    const targetTask = tasks[0];

    const initialCommentCount = targetTask.comments?.length || 0;

    boardStore.addComment(
      targetTask.id,
      'Exploring performance bottlenecks in the rendering loop',
      'diogocsilva12',
      'https://github.com/diogocsilva12.png'
    );

    const updatedTask = boardStore.getState().tasks.find((t) => t.id === targetTask.id);
    expect(updatedTask).toBeDefined();
    expect(updatedTask?.comments?.length).toBe(initialCommentCount + 1);

    const lastComment = updatedTask?.comments?.[updatedTask.comments.length - 1];
    expect(lastComment?.content).toBe('Exploring performance bottlenecks in the rendering loop');
    expect(lastComment?.author).toBe('diogocsilva12');
    expect(lastComment?.avatarUrl).toBe('https://github.com/diogocsilva12.png');
    expect(lastComment?.id).toBeDefined();
    expect(lastComment?.createdAt).toBeDefined();
  });

  it('deletes a comment from a task conversation thread', () => {
    const tasks = boardStore.getState().tasks;
    const targetTask = tasks[0];

    // Add a comment first
    boardStore.addComment(
      targetTask.id,
      'Temporary comment to be deleted',
      'reviewer',
      'https://github.com/reviewer.png'
    );

    const taskWithComment = boardStore.getState().tasks.find((t) => t.id === targetTask.id);
    const commentToDelete = taskWithComment?.comments?.find(
      (c) => c.content === 'Temporary comment to be deleted'
    );
    expect(commentToDelete).toBeDefined();

    // Delete comment
    boardStore.deleteComment(targetTask.id, commentToDelete!.id);

    const finalTask = boardStore.getState().tasks.find((t) => t.id === targetTask.id);
    const exists = finalTask?.comments?.some((c) => c.id === commentToDelete!.id);
    expect(exists).toBe(false);
  });

  it('maintains multiple comments in chronological order', () => {
    const tasks = boardStore.getState().tasks;
    const targetTask = tasks[0];

    boardStore.addComment(targetTask.id, 'First message in thread', 'alice', '');
    boardStore.addComment(targetTask.id, 'Second message responding', 'bob', '');

    const taskWithThread = boardStore.getState().tasks.find((t) => t.id === targetTask.id);
    const thread = taskWithThread?.comments || [];
    const aliceMsg = thread.find((c) => c.content === 'First message in thread');
    const bobMsg = thread.find((c) => c.content === 'Second message responding');

    expect(aliceMsg).toBeDefined();
    expect(bobMsg).toBeDefined();
    expect(thread.indexOf(aliceMsg!)).toBeLessThan(thread.indexOf(bobMsg!));
  });
});
