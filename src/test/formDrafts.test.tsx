// @vitest-environment jsdom
import { act, StrictMode, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { TaskModal } from '../components/kanban/TaskModal';
import { ColumnModal } from '../components/kanban/ColumnModal';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import { ProjectAccessModal } from '../components/projects/ProjectAccessModal';
import { ProjectDeadlineModal } from '../components/projects/ProjectDeadlineModal';
import { boardStore, useBoardStore, INITIAL_PROJECTS, INITIAL_TASKS } from '../store/boardStore';

import { BoardCloud } from '../services/boardCloud';

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: null, passList: [] }) }));
let root: Root;
let host: HTMLDivElement;
const close = vi.fn();
const project = () => structuredClone(INITIAL_PROJECTS[0]);
const task = () => ({ ...structuredClone(INITIAL_TASKS[0]), projectId: project().id, columnId: project().columns[0].id });
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  close.mockReset();
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals();
});
async function render(element: ReactElement) { await act(async () => root.render(<StrictMode>{element}</StrictMode>)); }
function field(selector: string) {
  const input = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
  if (!input) throw new Error(`Missing field: ${selector}`);
  return input;
}
async function type(selector: string, text: string) {
  const input = field(selector);
  const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  await act(async () => {
    Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(input, text);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect(field(selector).value).toBe(text);
}
const title = 'input[placeholder="e.g. Implement client-side token encryption"]';
const description = 'textarea[placeholder^="Detailed description"]';
const subtask = 'input[placeholder="Add subtask or checklist item..."]';
const comment = 'textarea[placeholder^="Write a comment"]';

it('keeps a new task draft when refreshed columns arrive and saves the typed values', async () => {
  const p = project();
  await render(<TaskModal open onOpenChange={close} projectId={p.id} columns={p.columns} />);
  await type(title, 'My unsaved task'); await type(description, 'My description');
  await type(subtask, 'Checklist draft'); await type(comment, 'Comment draft');
  await render(<TaskModal open onOpenChange={close} projectId={p.id} columns={structuredClone(p.columns)} />);
  expect(field(title).value).toBe('My unsaved task');
  expect(field(description).value).toBe('My description');
  expect(field(subtask).value).toBe('Checklist draft'); expect(field(comment).value).toBe('Comment draft');
  const add = vi.spyOn(boardStore, 'addTask').mockImplementation(data => ({ ...task(), ...data }));
  await act(async () => field(title).closest('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  expect(add).toHaveBeenCalledWith(expect.objectContaining({ title: 'My unsaved task', description: 'My description' }));
  expect(close).toHaveBeenCalledWith(false);
});

it('keeps edited task text when a refreshed copy of the same task arrives', async () => {
  const p = project(), t = task();
  await render(<TaskModal open onOpenChange={close} projectId={p.id} columns={p.columns} taskToEdit={t} />);
  await type(title, 'Edited title');
  await render(<TaskModal open onOpenChange={close} projectId={p.id} columns={structuredClone(p.columns)} taskToEdit={structuredClone(t)} />);
  expect(field(title).value).toBe('Edited title');
});

it('resets on reopen and when switching tasks or projects, using the latest defaults', async () => {
  const p = project();
  await render(<TaskModal open onOpenChange={close} projectId={p.id} columns={p.columns} />);
  await type(title, 'Discard me');
  await render(<TaskModal open={false} onOpenChange={close} projectId={p.id} columns={p.columns} />);
  await render(<TaskModal open onOpenChange={close} projectId={p.id} columns={p.columns} />);
  expect(field(title).value).toBe('');
  await type(title, 'Another draft');
  await render(<TaskModal open onOpenChange={close} projectId="other-project" columns={p.columns} />);
  expect(field(title).value).toBe('');
  const t = task();
  await render(<TaskModal open onOpenChange={close} projectId={p.id} columns={p.columns} taskToEdit={t} />);
  expect(field(title).value).toBe(t.title);
  await type(title, 'Unsaved edit');
  await render(<TaskModal open onOpenChange={close} projectId={p.id} columns={p.columns} taskToEdit={{ ...t, id: 'other-task', title: 'Other task' }} />);
  expect(field(title).value).toBe('Other task');
});

it('keeps a column draft when the same column is refreshed', async () => {
  const p = project(), column = p.columns[0];
  const selector = 'input[placeholder="e.g. In Review, QA, Blocked..."]';
  await render(<ColumnModal open onOpenChange={close} projectId={p.id} columnToEdit={column} />);
  await type(selector, 'Draft column');
  await render(<ColumnModal open onOpenChange={close} projectId={p.id} columnToEdit={{ ...column }} />);
  expect(field(selector).value).toBe('Draft column');
});

it('keeps project settings edits across a background refresh', async () => {
  const p = project();
  await render(<CreateProjectModal open onOpenChange={close} projectToEdit={p} />);
  const selector = 'form input';
  await type(selector, 'Draft project name');
  await render(<CreateProjectModal open onOpenChange={close} projectToEdit={structuredClone(p)} />);
  expect(field(selector).value).toBe('Draft project name');
});

it('keeps the access username draft across a background refresh', async () => {
  const p = { ...project(), visibility: 'private' as const };
  await render(<ProjectAccessModal open onOpenChange={close} project={p} />);
  const selector = 'input';
  await type(selector, 'new-collaborator');
  await render(<ProjectAccessModal open onOpenChange={close} project={structuredClone(p)} />);
  expect(field(selector).value).toBe('new-collaborator');
});

it('keeps a deadline draft until reopening, then reads the latest saved deadline', async () => {
  const p = { ...project(), deadline: '2026-10-01' };
  await render(<ProjectDeadlineModal open onOpenChange={close} project={p} />);
  await type('input[type="date"]', '2026-11-01');
  const remote = { ...p, deadline: '2026-12-01' };
  await render(<ProjectDeadlineModal open onOpenChange={close} project={remote} />);
  expect(field('input[type="date"]').value).toBe('2026-11-01');
  await render(<ProjectDeadlineModal open={false} onOpenChange={close} project={remote} />);
  await render(<ProjectDeadlineModal open onOpenChange={close} project={remote} />);
  expect(field('input[type="date"]').value).toBe('2026-12-01');
});

// Exercise the actual cloud -> store -> subscribed editor path, including fresh object identities.
it.each([false, true])('preserves text, focus and caret during cloud sync (editing=%s)', async editing => {
  const p = project(), t = task();
  const data = { projects: [p], tasks: [t] };
  boardStore.replaceBoard(data);
  function Editor() {
    const { activeProject, tasks } = useBoardStore();
    return <TaskModal open onOpenChange={close} projectId={activeProject.id}
      columns={[...activeProject.columns]} taskToEdit={editing ? tasks[0] : undefined} />;
  }
  await render(<Editor />);
  await type(title, 'Keep typing through sync');
  const input = field(title);
  input.focus(); input.setSelectionRange(5, 5);
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(data)));
  const cloud = new BoardCloud({ token: 'test', base: data,
    getLocal: () => { const { projects, tasks } = boardStore.getState(); return { projects, tasks }; },
    apply: next => boardStore.replaceBoard(next), status: vi.fn(), saveBase: vi.fn(),
  });
  await act(async () => cloud.sync());
  expect(field(title)).toBe(input);
  expect(input.value).toBe('Keep typing through sync');
  expect(document.activeElement).toBe(input);
  expect(input.selectionStart).toBe(5);
  await type(title, 'Keep typing through sync successfully');
});
