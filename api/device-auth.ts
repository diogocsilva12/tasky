const CLIENT_ID = 'Ov23liYCXe1qPYV6HjQp';
const SCOPES = 'repo,gist,read:org,project';

// This endpoint only relays Tasky's two Device Flow operations, never arbitrary URLs.
export async function POST(request: Request): Promise<Response> {
  const reply = (data: unknown, status = 200) => Response.json(data, {
    status, headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' },
  });
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return reply({ error_description: 'Sign in from the Tasky app.' }, 403);
  try {
    const text = await request.text();
    if (text.length > 2048) return reply({ error_description: 'Invalid authorization request.' }, 400);
    let body;
    try { body = JSON.parse(text); } catch { return reply({ error_description: 'Invalid authorization request.' }, 400); }
    if (!body || !['code', 'token'].includes(body.action)) return reply({ error_description: 'Invalid authorization action.' }, 400);
    if (body.action === 'token' && (typeof body.device_code !== 'string' || !/^[a-zA-Z0-9_-]{10,256}$/.test(body.device_code))) {
      return reply({ error_description: 'Invalid device code.' }, 400);
    }
    const endpoint = body.action === 'code' ? 'device/code' : 'oauth/access_token';
    const payload = body.action === 'code'
      ? { client_id: CLIENT_ID, scope: SCOPES }
      : { client_id: CLIENT_ID, device_code: body.device_code, grant_type: 'urn:ietf:params:oauth:grant-type:device_code' };
    const upstream = await fetch(`https://github.com/login/${endpoint}`, {
      method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(15_000),
    });
    const data = await upstream.json();
    // GitHub returns pending/slow_down as JSON errors with HTTP 200; preserve them for polling.
    const fields = ['device_code', 'user_code', 'verification_uri', 'expires_in', 'interval', 'access_token', 'token_type', 'scope', 'error', 'error_description'];
    const result = Object.fromEntries(fields.filter(key => data[key] !== undefined).map(key => [key, data[key]]));
    if (!upstream.ok && !result.error_description) result.error_description = 'GitHub authorization is temporarily unavailable. Please retry.';
    return reply(result, upstream.ok ? 200 : upstream.status);
  } catch {
    return reply({ error_description: 'Could not reach GitHub authorization. Please retry.' }, 502);
  }
}
