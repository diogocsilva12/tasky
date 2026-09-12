import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useBoardStore } from '@/store/boardStore';

export function TaskActivityModal({ taskId, open, onOpenChange }: { taskId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { tasks } = useBoardStore();
  const task = tasks.find((item) => item.id === taskId);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>Task activity</DialogTitle><DialogDescription>{task?.title}</DialogDescription></DialogHeader>
        {!task?.activity?.length && <p className="text-sm text-muted-foreground">No recorded activity yet. Changes made in Tasky will appear here.</p>}
        {[...(task?.activity || [])].reverse().map((entry) => (
          <article key={entry.id} className="border-b border-border pb-3 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Avatar className="h-7 w-7"><AvatarImage src={entry.actor?.avatarUrl} alt={entry.actor?.username || 'Unknown user'} /><AvatarFallback>{entry.actor?.username.slice(0, 2).toUpperCase() || '?'}</AvatarFallback></Avatar>
              <div><p><strong>{entry.actor ? `@${entry.actor.username}` : 'Unknown user'}</strong> · {entry.action}</p><time className="text-xs text-muted-foreground" dateTime={entry.at}>{new Date(entry.at).toLocaleString()}</time></div>
            </div>
            <ul className="space-y-1 text-xs">
              {entry.changes.map((change) => <li key={change.field} className="break-words"><span className="font-semibold">{change.field}</span>: <span className="text-muted-foreground">{change.before}</span> → {change.after}</li>)}
            </ul>
          </article>
        ))}
      </DialogContent>
    </Dialog>
  );
}
