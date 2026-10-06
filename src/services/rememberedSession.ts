async function request(method: string, token?: string) {
  const response = await fetch('/api/session', { method, credentials: 'same-origin', cache: 'no-store', headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: AbortSignal.timeout(20_000) });
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Remember me is available on the Tasky Vercel app.');
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not update the remembered session.');
  return data;
}
export async function restoreSession(): Promise<string | null> { const data = await request('GET'); return typeof data.token === 'string' ? data.token : null; }
export async function rememberSession(token: string): Promise<void> { await request('POST', token); }
export async function forgetSession(): Promise<void> { await request('DELETE'); }
