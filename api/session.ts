import { openSession, sealSession, sessionCookie, SESSION_COOKIE } from '../server/sessionCookie.js';
async function handle(request: Request): Promise<Response> {
  const reply = (data: unknown, status = 200, cookie?: string) => Response.json(data, {
    status, headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache', ...(cookie ? { 'Set-Cookie': cookie } : {}) },
  });
  const origin = request.headers.get('origin');
  const site = request.headers.get('sec-fetch-site');
  if ((origin && origin !== new URL(request.url).origin) || (site && !['same-origin', 'none'].includes(site))) return reply({ error: 'Use Tasky to manage your session.' }, 403);
  if (request.method === 'DELETE') return reply({ ok: true }, 200, sessionCookie(''));
  if (request.method === 'GET') {
    const encoded = request.headers.get('cookie')?.split(';').map(part => part.trim()).find(part => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
    const token = encoded ? openSession(encoded) : null;
    return reply({ token }, 200, encoded && !token ? sessionCookie('') : undefined);
  }
  const token = request.headers.get('authorization')?.match(/^Bearer ([^\r\n]+)$/)?.[1];
  if (!token || token.length > 2048 || token.startsWith('demo-')) return reply({ error: 'A valid GitHub session is required.' }, 401);
  try {
    const response = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(15_000) });
    if (!response.ok) return reply({ error: 'Could not validate your GitHub session.' }, response.status === 401 ? 401 : 503);
    return reply({ ok: true }, 200, sessionCookie(sealSession(token)));
  } catch { return reply({ error: 'Could not remember this session. Please retry.' }, 503); }
}
export const GET = handle;
export const POST = handle;
export const DELETE = handle;
