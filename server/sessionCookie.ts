import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
export const SESSION_COOKIE = '__Host-tasky-session';
export const SESSION_SECONDS = 30 * 24 * 60 * 60;
function key(): Buffer {
  const secret = process.env.TASKY_SESSION_SECRET;
  if (!secret) throw new Error('Persistent sessions are not configured.');
  const value = Buffer.from(secret, 'base64url');
  if (value.length !== 32) throw new Error('Invalid session encryption key.');
  return value;
}
export function sealSession(token: string, now = Date.now()): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify({ token, expires: now + SESSION_SECONDS * 1000 }), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url');
}
export function openSession(value: string, now = Date.now()): string | null {
  try {
    const buffer = Buffer.from(value, 'base64url');
    if (buffer.length < 29 || buffer.length > 3500) return null;
    const cipher = createDecipheriv('aes-256-gcm', key(), buffer.subarray(0, 12));
    cipher.setAuthTag(buffer.subarray(12, 28));
    const data = JSON.parse(Buffer.concat([cipher.update(buffer.subarray(28)), cipher.final()]).toString('utf8'));
    return typeof data.token === 'string' && Number.isFinite(data.expires) && data.expires > now ? data.token : null;
  } catch { return null; }
}
export function sessionCookie(value: string): string {
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${value ? SESSION_SECONDS : 0}`;
}
