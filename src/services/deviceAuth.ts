export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export type DeviceFlowStatus = 'idle' | 'requesting_code' | 'waiting_for_user' | 'slow_down' | 'success' | 'expired' | 'error';

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  signal?.throwIfAborted();
  return new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(new DOMException('Sign-in cancelled.', 'AbortError')); };
    const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, ms);
    signal?.addEventListener('abort', abort, { once: true });
  });
}

async function request(body: unknown, signal?: AbortSignal) {
  const response = await fetch('/api/device-auth', {
    method: 'POST', cache: 'no-store', signal,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('GitHub sign-in is unavailable on this site. Please use the Tasky Vercel app.');
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || `GitHub authorization failed (${response.status}). Please retry.`);
  return data;
}

export class DeviceAuthService {
  static async requestDeviceCode(signal?: AbortSignal): Promise<DeviceCodeResponse> {
    const data = await request({ action: 'code' }, signal);
    if (data.error) throw new Error(data.error_description || data.error);
    if (typeof data.device_code !== 'string' || typeof data.user_code !== 'string' ||
      data.verification_uri !== 'https://github.com/login/device' || !Number.isFinite(data.expires_in) || data.expires_in <= 0 ||
      !Number.isFinite(data.interval) || data.interval <= 0) throw new Error('GitHub returned an invalid device code. Please retry.');
    return data;
  }

  static async pollForToken(deviceCode: string, intervalSeconds = 5, expiresIn = 900, signal?: AbortSignal, onSlowDown?: () => void): Promise<string> {
    let interval = Math.max(intervalSeconds, 5);
    const expiresAt = Date.now() + expiresIn * 1000;
    while (Date.now() < expiresAt) {
      await wait(Math.min(interval * 1000, expiresAt - Date.now()), signal);
      if (Date.now() >= expiresAt) break;
      const data = await request({ action: 'token', device_code: deviceCode }, signal);
      if (typeof data.access_token === 'string' && data.access_token) return data.access_token;
      if (data.error === 'authorization_pending') continue;
      if (data.error === 'slow_down') { interval += 5; onSlowDown?.(); continue; }
      if (data.error === 'expired_token') throw new Error('Device code expired. Please restart sign-in.');
      if (data.error === 'access_denied') throw new Error('Access was denied on GitHub.');
      throw new Error(data.error_description || data.error || 'Authorization failed. Please retry.');
    }
    throw new Error('Device code expired. Please restart sign-in.');
  }
}
