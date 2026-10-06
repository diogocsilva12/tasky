import { useEffect, useMemo, useState } from 'react';
import { useBoardStore } from '../store/boardStore';
import { useAuth } from '../context/AuthContext';
import { buildPersonalInbox, inboxStorageKey, loadInboxReadState, saveInboxReadState, type InboxItem } from '../lib/personalInbox';

export function usePersonalInbox() {
  const { projects, tasks } = useBoardStore();
  const { user, authState } = useAuth();
  const key = inboxStorageKey(user?.username || '', user?.isDemo);
  const [stored, setStored] = useState(() => ({ key, read: loadInboxReadState(key) }));
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    setStored({ key, read: loadInboxReadState(key) });
    const listener = (event: StorageEvent) => { if (event.key === key) setStored({ key, read: loadInboxReadState(key) }); };
    window.addEventListener('storage', listener);
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => { clearInterval(timer); window.removeEventListener('storage', listener); };
  }, [key]);
  const items = useMemo(() => buildPersonalInbox(projects, tasks, user ? { ...user, role: authState === 'admin' ? 'admin' : user.role } : null, now), [projects, tasks, user, authState, now]);
  const read = stored.key === key ? stored.read : {};
  const isUnread = (item: InboxItem) => read[item.id] !== item.version;
  const mark = (targets: InboxItem[], unread = false) => setStored(previous => {
    const next = { ...(previous.key === key ? previous.read : {}) };
    for (const item of targets) { if (unread) delete next[item.id]; else next[item.id] = item.version; }
    // Drop entries that no longer exist; no hidden project metadata is retained here.
    const current = new Set(items.map(item => item.id));
    const pruned = Object.fromEntries(Object.entries(next).filter(([id]) => current.has(id)));
    saveInboxReadState(key, pruned); return { key, read: pruned };
  });
  return { items, isUnread, unreadCount: items.filter(isUnread).length, mark };
}
