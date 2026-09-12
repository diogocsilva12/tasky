import { useEffect, useLayoutEffect, useState } from 'react';
import { toast } from 'sonner';
import { useBoardStore } from '@/store/boardStore';
import { loadSavedViews, saveViews, shortcutView, type SavedView, type ViewSettings } from '@/lib/savedViews';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SavedViews({ username, projectIds, onProjectIdsChange }: { username: string; projectIds: string[] | null; onProjectIdsChange: (ids: string[] | null) => void }) {
  const { filter, resetFilter, setFilter } = useBoardStore();
  const [views, setViews] = useState<SavedView[]>([]);
  const [name, setName] = useState('');
  const [ready, setReady] = useState(false);
  const apply = (settings: ViewSettings) => {
    onProjectIdsChange(settings.projectIds);
    resetFilter();
    setFilter(settings.filter);
  };
  useLayoutEffect(() => {
    const stored = loadSavedViews(username);
    setViews(stored.views);
    apply(stored.current);
    setReady(true);
  }, [username]);
  useEffect(() => {
    if (ready && !saveViews(username, { current: { projectIds, filter }, views })) {
      toast.error('Views could not be saved in this browser.');
    }
  }, [username, ready, projectIds, filter, views]);
  return (
    <div className="px-4 sm:px-6 py-3 border-b border-border flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold">Views</span>
      <Button size="sm" variant="outline" onClick={() => apply(shortcutView('mine', username, projectIds))}>My tasks</Button>
      <Button size="sm" variant="outline" onClick={() => apply(shortcutView('blocked', username, projectIds))}>Blocked</Button>
      <Button size="sm" variant="outline" onClick={() => apply(shortcutView('overdue', username, projectIds))}>Overdue</Button>
      {views.map((view) => <div key={view.id} className="flex items-center rounded border border-border"><Button variant="ghost" size="sm" onClick={() => apply(view)}>{view.name}</Button><button type="button" aria-label={`Delete saved view ${view.name}`} onClick={() => setViews((items) => items.filter((item) => item.id !== view.id))} className="px-2 text-muted-foreground hover:text-destructive">×</button></div>)}
      <form className="flex gap-1" onSubmit={(event) => {
        event.preventDefault();
        if (!name.trim()) return;
        setViews((items) => [...items, { id: crypto.randomUUID(), name: name.trim(), projectIds, filter: { ...filter } }]);
        setName('');
      }}><Input aria-label="Saved view name" placeholder="Name this view" value={name} onChange={(event) => setName(event.target.value)} className="w-36 h-8" maxLength={60} /><Button size="sm" type="submit" disabled={!name.trim()}>Save view</Button></form>
    </div>
  );
}
