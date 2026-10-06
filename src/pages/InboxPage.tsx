import { useState } from 'react';
import { Inbox, CheckCheck, AtSign, CalendarClock, UserRoundCheck, ClipboardCheck } from 'lucide-react';
import type { Task } from '../types';
import type { usePersonalInbox } from '../hooks/usePersonalInbox';
import type { InboxKind } from '../lib/personalInbox';
import { Button } from '../components/ui/button';
const filters: { id: InboxKind | 'all'; title: string }[] = [{ id: 'all', title: 'All' }, { id: 'assigned', title: 'Assigned' }, { id: 'mention', title: 'Mentions' }, { id: 'due', title: 'Due soon' }, { id: 'review', title: 'Reviews' }];
const icons = { assigned: UserRoundCheck, mention: AtSign, due: CalendarClock, review: ClipboardCheck };
export function InboxPage({ inbox, onOpenTask }: { inbox: ReturnType<typeof usePersonalInbox>; onOpenTask: (task: Task) => void }) {
  const [filter, setFilter] = useState<InboxKind | 'all'>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const visible = inbox.items.filter(item => (filter === 'all' || item.kind === filter) && (!unreadOnly || inbox.isUnread(item)));
  return <main className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="flex items-center gap-2 text-2xl font-semibold"><Inbox className="h-6 w-6 text-primary" /> Personal inbox</h1><p className="mt-2 text-sm text-muted-foreground">Your assignments, mentions, upcoming deadlines and reviews across accessible projects.</p></div><Button variant="outline" size="sm" disabled={!visible.some(inbox.isUnread)} onClick={() => inbox.mark(visible)}><CheckCheck className="h-4 w-4" />Mark visible as read</Button></div>
    <div className="flex flex-wrap items-center gap-2" aria-label="Inbox filters">{filters.map(tab => <Button key={tab.id} size="sm" variant={filter === tab.id ? 'default' : 'outline'} aria-pressed={filter === tab.id} onClick={() => setFilter(tab.id)}>{tab.title} <span className="opacity-70">{inbox.items.filter(item => tab.id === 'all' || item.kind === tab.id).length}</span></Button>)}<label className="ml-auto flex items-center gap-2 text-sm"><input type="checkbox" checked={unreadOnly} onChange={event => setUnreadOnly(event.target.checked)} />Unread only</label></div>
    <p className="text-xs text-muted-foreground">Due soon includes overdue work and the next seven days. Read status is saved for your account on this device.</p>
    {visible.length ? <div className="space-y-2">{visible.map(item => { const Icon = icons[item.kind]; const unread = inbox.isUnread(item); return <article key={item.id} className={`flex items-center gap-3 rounded-xl border p-4 ${unread ? 'border-primary/30 bg-card' : 'border-border bg-muted/20'}`}>
      <Icon className={`h-5 w-5 shrink-0 ${item.overdue ? 'text-destructive' : 'text-primary'}`} />
      <button className="min-w-0 flex-1 text-left" onClick={() => { inbox.mark([item]); onOpenTask(item.task); }}><span className="text-xs text-muted-foreground">{item.project.name} · {item.task.priority}</span><span className={`block mt-1 ${unread ? 'font-semibold' : 'font-medium'}`}>{item.task.title}</span><span className={`block text-sm mt-1 whitespace-pre-wrap break-words ${item.overdue ? 'text-destructive' : 'text-muted-foreground'}`}>{item.detail}</span></button>
      <Button variant="ghost" size="sm" className="shrink-0" onClick={() => inbox.mark([item], !unread)} aria-label={`${unread ? 'Mark as read' : 'Mark as unread'}: ${item.task.title}`}>{unread ? 'Mark read' : 'Unread'}</Button>
    </article>; })}</div> : <div className="rounded-xl border border-dashed border-border p-12 text-center"><Inbox className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-medium">Nothing needs your attention here</h2><p className="mt-1 text-sm text-muted-foreground">New assignments, mentions and review requests will appear automatically.</p></div>}
  </main>;
}
