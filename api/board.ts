import { Buffer } from 'node:buffer';
import { mergeBoards, parseBoard, sameData, SyncConflict } from '../src/lib/boardSync.js';
import { authorizeChanges, visibleBoard } from '../server/boardPermissions.js';

const OWNER = 'diogocsilva12';
const GIST = '1cf8b94ee4ce2b16db050183d7d093b6';
class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }

async function github(token: string, path: string, init: RequestInit = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init, cache: 'no-store', signal: AbortSignal.timeout(15_000),
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new ApiError(response.status === 409 || response.status === 422 ? 409 : 503, 'Shared storage is unavailable. Please retry.');
  return response.json();
}

async function handle(request: Request): Promise<Response> {
  const reply = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
  try {
    if (!['GET', 'PUT'].includes(request.method)) return reply({ error: 'Method not allowed.' }, 405);
    const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if (!token || token.startsWith('demo-')) return reply({ error: 'Sign in with GitHub.' }, 401);
    const identity = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(15_000) });
    if (!identity.ok) return reply({ error: 'GitHub session expired. Sign in again.' }, identity.status === 401 ? 401 : 503);
    const { login } = await identity.json();
    const storageToken = process.env.TASKY_STORAGE_TOKEN;
    if (!storageToken) throw new ApiError(503, 'Shared storage is not configured.');
    const gist = await github(storageToken, `/gists/${GIST}`);
    if (gist.owner?.login?.toLowerCase() !== OWNER) throw new ApiError(503, 'Invalid access storage.');
    const members = JSON.parse(gist.files['tasky-passlist.json'].content) as { username: string; role: string }[];
    const member = members.find(m => m.username.toLowerCase() === login.toLowerCase());
    if (!member && login.toLowerCase() !== OWNER) return reply({ error: 'Administrator approval is required.' }, 403);
    const user = { username: login, role: login.toLowerCase() === OWNER ? 'super-admin' : member?.role };
    const repo = process.env.TASKY_STORAGE_REPO || `${OWNER}/tasky-data`;
    const path = `/repos/${repo}/contents/board.json`;
    const file = await github(storageToken, path);
    if (file.encoding !== 'base64' || !file.content) throw new ApiError(503, 'Shared storage cannot be read.');
    const current = parseBoard(JSON.parse(Buffer.from(file.content, 'base64').toString('utf8')));
    if (request.method === 'GET') return reply(visibleBoard(current, user));
    const bodyText = await request.text();
    if (bodyText.length > 750_000) return reply({ error: 'Workspace update is too large.' }, 413);
    let base, next;
    try {
      const body = JSON.parse(bodyText);
      base = parseBoard(body.base); next = parseBoard(body.next);
    } catch { return reply({ error: 'Invalid workspace update.' }, 400); }
    // The full remote workspace participates in merging; hidden projects cannot be erased by omission.
    const merged = mergeBoards(base, next, current);
    try { authorizeChanges(current, merged, user); }
    catch { return reply({ error: 'You do not have permission to make these changes.' }, 403); }
    if (!sameData(current, merged)) {
      const content = JSON.stringify(merged);
      if (Buffer.byteLength(content) > 700_000) return reply({ error: 'Workspace storage limit reached.' }, 413);
      await github(storageToken, path, {
        method: 'PUT', body: JSON.stringify({ message: `Update workspace by @${login}`, sha: file.sha, content: Buffer.from(content).toString('base64') }),
      });
    }
    return reply(visibleBoard(merged, user));
  } catch (error) {
    if (error instanceof SyncConflict) return reply({ error: error.message }, 409);
    if (error instanceof ApiError) return reply({ error: error.message }, error.status);
    return reply({ error: 'Could not sync the workspace. Your local edits are preserved.' }, 503);
  }
}
export const GET = handle;
export const PUT = handle;
