import { useState } from 'react';
import type { Project, Task } from '../../types';
import { organizationChanges, taskOrganizationChanges } from '../../lib/organizationHistory';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';

export function OrganizationHistory({ project, tasks, open, onOpenChange }: { project: Project; tasks: Task[]; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [filter, setFilter] = useState<'all' | 'workflow' | 'tasks'>('all');
  const events = [
    ...(project.organizationHistory || []).map(event => ({ ...event, kind: 'workflow', title: 'Project organization', changes: organizationChanges(event) })),
    ...taskOrganizationChanges(tasks).map(event => ({ ...event, kind: 'tasks', title: event.taskTitle })),
  ].filter(event => filter === 'all' || event.kind === filter).sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  const labels: Record<string, string> = { assignees: 'Assignees', reviewers: 'Reviewers', dueDate: 'Task deadline', projectId: 'Project' };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
    <DialogHeader><DialogTitle>Organization history</DialogTitle><DialogDescription>{project.name} · Workflow, ownership and deadline changes, with their recorded author.</DialogDescription></DialogHeader>
    <div className="flex flex-wrap gap-2">{(['all', 'workflow', 'tasks'] as const).map(value => <Button key={value} size="sm" variant={filter === value ? 'default' : 'outline'} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value === 'all' ? 'All changes' : value === 'workflow' ? 'Project workflow' : 'Task ownership & dates'}</Button>)}</div>
    <p className="text-xs text-muted-foreground">Project history starts with changes recorded from now on. Earlier task activity is included where available; missing history cannot be reconstructed.</p>
    {events.length ? <ol className="space-y-4">{events.map(event => <li key={event.id} className="rounded-lg border border-border p-4 space-y-3">
      <div><p className="font-medium text-sm">{event.title}</p><p className="text-xs text-muted-foreground">{event.actor ? `@${event.actor.username}` : 'Author not recorded'} · <time dateTime={event.at}>{new Date(event.at).toLocaleString()}</time></p></div>
      {event.changes.map((change, index) => <div key={index} className="text-sm"><p className="font-medium">{labels[change.field] || change.field}</p><div className="grid grid-cols-2 gap-3 mt-1 break-words"><p className="text-muted-foreground"><span className="block text-xs">Before</span>{change.before}</p><p><span className="block text-xs text-muted-foreground">After</span>{change.after}</p></div></div>)}
    </li>)}</ol> : <p className="py-8 text-center text-sm text-muted-foreground">No changes recorded yet.</p>}
  </DialogContent></Dialog>;
}
