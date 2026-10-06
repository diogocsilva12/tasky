import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getToken } from '../services/githubAuth';
import { BoardCloud, type CloudStatus } from '../services/boardCloud';
import { boardStore } from '../store/boardStore';
import { emptyBoard, parseBoard } from '../lib/boardSync';

const Context = createContext<{ sync: () => Promise<void>; status: CloudStatus; demo: boolean } | null>(null);
export function BoardSyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const cloud = useRef<BoardCloud | null>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<CloudStatus>({ syncing: false, error: '', lastSynced: null });
  useEffect(() => {
    if (!user) return;
    setReady(false);
    boardStore.openSession(user.username, user.isDemo);
    if (user.isDemo) { setReady(true); return () => boardStore.closeSession(); }
    const key = `tasky_cloud_base_v1:${user.username.toLowerCase()}`;
    let base = emptyBoard();
    try { const saved = localStorage.getItem(key); if (saved) base = parseBoard(JSON.parse(saved)); } catch { /* Keep local edits available. */ }
    const engine = new BoardCloud({
      token: getToken() || '', base,
      getLocal: () => { const { projects, tasks } = boardStore.getState(); return { projects, tasks }; },
      apply: data => boardStore.replaceBoard(data), status: setStatus,
      saveBase: data => { try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* Local storage can be disabled. */ } },
    });
    cloud.current = engine;
    let disposed = false;
    let applying = false;
    const run = async () => {
      if (disposed || applying) return;
      applying = true;
      try { await engine.sync(); } catch { /* Status displays the error. */ }
      finally { applying = false; if (!disposed) setReady(true); }
    };
    let debounce: ReturnType<typeof setTimeout>;
    const unsubscribe = boardStore.subscribe(() => {
      clearTimeout(debounce);
      if (engine.dirty()) debounce = setTimeout(() => { void run(); }, 2000);
    });
    void run();
    // Poll visible sessions; writes are debounced separately.
    const interval = setInterval(() => { if (document.visibilityState !== 'hidden') void run(); }, 60_000);
    const focus = () => { void run(); };
    window.addEventListener('focus', focus);
    const beforeUnload = (event: BeforeUnloadEvent) => { if (engine.dirty()) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      disposed = true; engine.stop(); cloud.current = null;
      clearInterval(interval); clearTimeout(debounce); unsubscribe();
      window.removeEventListener('focus', focus); window.removeEventListener('beforeunload', beforeUnload);
      boardStore.closeSession();
    };
  }, [user?.username, user?.isDemo]);
  return <Context.Provider value={{ sync: () => cloud.current?.sync() || Promise.resolve(), status, demo: Boolean(user?.isDemo) }}>
    {ready ? <>{status.error && <div role="alert" className="bg-destructive/10 text-destructive p-3 text-sm">Sync failed: {status.error} <button className="underline ml-2" onClick={() => { void cloud.current?.sync().catch(() => {}); }}>Retry</button> <button className="underline ml-2" disabled={status.syncing} onClick={() => {
      if (window.confirm('Replace your local edits with the shared version? Export a JSON backup first if you want to keep them.')) void cloud.current?.sync(true).catch(() => {});
    }}>Reload shared version</button></div>}{children}</> : <div className="p-12 text-center">Loading shared projects…</div>}
  </Context.Provider>;
}
export function useBoardSync() { const value = useContext(Context); if (!value) throw new Error('Missing board sync provider.'); return value; }
