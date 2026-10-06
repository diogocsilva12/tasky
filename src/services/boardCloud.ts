import { emptyBoard, mergeBoards, parseBoard, sameData, type BoardData } from '../lib/boardSync';

export interface CloudStatus { syncing: boolean; error: string; lastSynced: Date | null }
interface SyncOptions {
  token: string;
  getLocal: () => BoardData;
  apply: (data: BoardData) => void;
  status: (state: CloudStatus) => void;
  base?: BoardData;
  saveBase: (data: BoardData) => void;
}
export class BoardCloud {
  private base: BoardData;
  private running: Promise<void> | null = null;
  private stopped = false;
  private lastSynced: Date | null = null;
  constructor(private options: SyncOptions) { this.base = structuredClone(options.base || emptyBoard()); }
  stop() { this.stopped = true; }
  dirty() { return !sameData(this.base, this.options.getLocal()); }
  sync(discardLocal = false): Promise<void> {
    if (this.stopped) return Promise.resolve();
    if (this.running) return this.running;
    this.running = this.perform(discardLocal).finally(() => { this.running = null; });
    return this.running;
  }
  private async request(method: 'GET' | 'PUT', body?: unknown): Promise<BoardData> {
    const response = await fetch('/api/board', {
      method, cache: 'no-store', signal: AbortSignal.timeout(60_000),
      headers: { Authorization: `Bearer ${this.options.token}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Shared sync requires the Vercel app. This site does not have a sync API.');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not sync. Your edits remain saved locally.');
    return parseBoard(data);
  }
  private async perform(discardLocal: boolean) {
    this.options.status({ syncing: true, error: '', lastSynced: this.lastSynced });
    try {
      const sent = structuredClone(this.options.getLocal());
      // PUT uses a three-way merge on the server. GET is read-only when nothing changed.
      const write = !discardLocal && this.dirty();
      const remote = await this.request(write ? 'PUT' : 'GET', write ? { base: this.base, next: sent } : undefined);
      if (this.stopped) return;
      const next = mergeBoards(sent, this.options.getLocal(), remote);
      this.base = structuredClone(remote);
      this.options.saveBase(remote);
      this.options.apply(next);
      this.lastSynced = new Date();
      this.options.status({ syncing: false, error: '', lastSynced: this.lastSynced });
    } catch (error) {
      if (this.stopped) return;
      const message = error instanceof Error ? error.message : 'Could not sync. Your edits remain saved locally.';
      this.options.status({ syncing: false, error: message, lastSynced: this.lastSynced });
      throw error;
    }
  }
}
