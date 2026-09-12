import { useState } from 'react';
import type { Project } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TaskModal } from './TaskModal';

export function QuickCreateTask({ projects, onClose }: { projects: Project[]; onClose: () => void }) {
  const [projectId, setProjectId] = useState(projects.length === 1 ? projects[0].id : '');
  const [editing, setEditing] = useState(false);
  const project = projects.find((item) => item.id === projectId);
  if (editing && project) return <TaskModal open onOpenChange={(open) => { if (!open) onClose(); }} projectId={project.id} columns={project.columns} defaultBranch={project.activeBranch || project.defaultBranch} />;
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent>
    <DialogHeader><DialogTitle>New task</DialogTitle><DialogDescription>Choose the public project this task belongs to.</DialogDescription></DialogHeader>
    <label htmlFor="new-task-project" className="text-sm font-medium">Project</label>
    <select id="new-task-project" value={projectId} onChange={(event) => setProjectId(event.target.value)} className="rounded border border-border bg-background p-2">
      <option value="">Select a project</option>{projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
    </select>
    {project && project.columns.length === 0 && <p className="text-sm text-muted-foreground">Add a column in this project's board first.</p>}
    <Button disabled={!project?.columns.length} onClick={() => setEditing(true)}>Continue</Button>
  </DialogContent></Dialog>;
}
