import { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import type { Project, Task } from '../../types';
import { captureRetrospective, learnOrganization, PRACTICES, type ProjectRetrospective } from '../../lib/organizationLearning';
import { canUserManageProject } from '../../lib/projectAccess';
import { useAuth } from '../../context/AuthContext';
import { boardStore } from '../../store/boardStore';
import { useBoardSync } from '../../context/BoardSyncContext';
import { Button } from '../ui/button';
import { Textarea } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';

export function OrganizationLearning({ projects, tasks }: { projects: Project[]; tasks: Task[] }) {
  const { user, authState } = useAuth();
  const { sync } = useBoardSync();
  const learner = useMemo(() => learnOrganization(projects), [projects]);
  const [selected, setSelected] = useState<Project | null>(null);
  const [outcome, setOutcome] = useState<ProjectRetrospective['outcome']>('success');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const preview = selected ? captureRetrospective(selected, tasks, outcome, notes, user?.username || '') : null;
  const manageable = projects.filter(p => canUserManageProject(p, user ? { ...user, role: authState === 'admin' ? 'admin' : user.role } : null));
  return <section className="rounded-xl border border-border bg-card p-5 space-y-5">
    <div className="flex items-start gap-3"><BookOpen className="h-5 w-5 mt-1 text-primary" /><div><h2 className="text-xl font-semibold">Learn from our organization</h2><p className="text-sm text-muted-foreground mt-1">Record the outcome of each project and learn which working practices appear alongside successful results.</p></div></div>
    <p className="text-sm"><strong>{learner.reviewed}</strong> reviewed projects · learning from your team's experience</p>
    {learner.patterns.length === 0 ? <div className="rounded-lg bg-muted/60 p-4 text-sm text-muted-foreground">More examples are needed before comparing practices: at least three reviewed projects with a practice and three without it. Only outcomes explicitly recorded in project reviews are used.</div> : <div className="grid gap-3 sm:grid-cols-2">{learner.patterns.map(pattern => <div key={pattern.key} className="rounded-lg border border-border p-4 space-y-2"><h3 className="font-medium">{pattern.label}</h3><p className="text-sm">Successful with this practice: {pattern.withSuccesses}/{pattern.withCount}. Without it: {pattern.withoutSuccesses}/{pattern.withoutCount}.</p><p className="text-xs text-muted-foreground">Smoothed difference: {pattern.difference >= 0 ? '+' : ''}{Math.round(pattern.difference * 100)} percentage points. This is an association in your reviewed projects, not proof of cause.</p></div>)}</div>}
    <div className="space-y-2">{manageable.map(project => <div key={project.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"><div className="min-w-0"><p className="font-medium truncate text-sm">{project.name}</p>{project.retrospective && <p className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />{project.retrospective.outcome} · {new Date(project.retrospective.recordedAt).toLocaleDateString()}</p>}</div><Button variant="outline" size="sm" onClick={() => { setSelected(project); setOutcome(project.retrospective?.outcome || 'success'); setNotes(project.retrospective?.notes || ''); setError(''); }}>{project.retrospective ? 'Edit review' : 'Review outcome'}</Button></div>)}</div>
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open && !saving) setSelected(null); }}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Project retrospective</DialogTitle><DialogDescription>{selected?.name} · Capture what worked before planning the next project.</DialogDescription></DialogHeader>
      <form className="space-y-4" onSubmit={async event => {
        event.preventDefault(); if (!selected || !user) return;
        setSaving(true); setError('');
        try { boardStore.updateProject(selected.id, { retrospective: captureRetrospective(selected, tasks, outcome, notes, user.username) }); await sync(); setSelected(null); }
        catch (error) { setError(error instanceof Error ? error.message : 'Could not save the review.'); }
        finally { setSaving(false); }
      }}>
        <label className="block space-y-2 text-sm font-medium">How did this project go?<select value={outcome} onChange={event => setOutcome(event.target.value as ProjectRetrospective['outcome'])} className="block w-full rounded-md border border-input bg-background p-2"><option value="success">Successful</option><option value="partial">Partially successful</option><option value="unsuccessful">Unsuccessful</option></select></label>
        <label className="block space-y-2 text-sm font-medium">What worked, and what should we change?<Textarea value={notes} maxLength={5000} rows={4} onChange={event => setNotes(event.target.value)} placeholder="For example: one owner per task helped; too many items in review delayed delivery." /></label>
        {preview && <div className="rounded-lg bg-muted/50 p-3 space-y-2 text-xs"><p className="font-medium">Recorded with this review</p><p>{preview.metrics.completed}/{preview.metrics.total} tasks completed · {preview.metrics.blocked} currently blocked</p><p>{preview.metrics.datedCompletions ? `${preview.metrics.onTime}/${preview.metrics.datedCompletions} dated completions on time` : 'No dated completions available to measure punctuality.'}</p>{PRACTICES.map(p => <p key={p.key}>{preview.organization[p.key] ? '✓' : '—'} {p.label}</p>)}<p className="text-muted-foreground">Practices are captured as they stand at review time. Your outcome rating supplies the model's success label.</p></div>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={saving} className="w-full">{saving ? 'Saving…' : 'Save retrospective'}</Button>
      </form>
    </DialogContent></Dialog>
  </section>;
}
