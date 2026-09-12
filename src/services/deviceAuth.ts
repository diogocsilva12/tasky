export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

export type DeviceFlowStatus =
  | 'idle'
  | 'requesting_code'
  | 'waiting_for_user'
  | 'slow_down'
  | 'success'
  | 'expired'
  | 'error';

// Default OAuth App Client ID (can be overridden in settings or localStorage)
export const DEFAULT_CLIENT_ID = 'Ov23liYCXe1qPYV6HjQp';
export const DEFAULT_PROXY_URL = 'https://tasky-auth.diogo-coelho-silva.workers.dev';

export class DeviceAuthService {
  private static clientIdKey = 'tasky_github_client_id';
  private static proxyUrlKey = 'tasky_oauth_proxy_url';

  public static getClientId(): string {
    const saved = localStorage.getItem(this.clientIdKey);
    return saved && saved !== 'Iv23li12taskyauth0' ? saved : DEFAULT_CLIENT_ID;
  }

  public static setClientId(id: string): void {
    localStorage.setItem(this.clientIdKey, id.trim());
  }

  public static getProxyUrl(): string {
    return localStorage.getItem(this.proxyUrlKey) || DEFAULT_PROXY_URL;
  }

  public static setProxyUrl(url: string): void {
    localStorage.setItem(this.proxyUrlKey, url.trim());
  }

  /**
   * Helper to format request URL through an optional CORS proxy if needed
   */
  private static buildUrl(targetUrl: string): string {
    const proxy = this.getProxyUrl();
    if (proxy) {
      return `${proxy.replace(/\/+$/, '')}/${encodeURIComponent(targetUrl)}`;
    }
    return targetUrl;
  }

  /**
   * Request device code from GitHub
   */
  public static async requestDeviceCode(
    clientId?: string,
    scopes = 'repo,gist,read:org,project'
  ): Promise<DeviceCodeResponse> {
    const cid = clientId || this.getClientId();
    const endpoint = this.buildUrl('https://github.com/login/device/code');

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: cid,
        scope: scopes,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.error_description ||
          errorData.message ||
          `GitHub Device Code request failed with status ${res.status}`
      );
    }

    const data: DeviceCodeResponse = await res.json();
    return data;
  }

  /**
   * Poll GitHub until the user approves or the code expires
   */
  public static async pollForToken(
    deviceCode: string,
    intervalSeconds = 5,
    clientId?: string,
    onSlowDown?: () => void
  ): Promise<string> {
    const cid = clientId || this.getClientId();
    const endpoint = this.buildUrl('https://github.com/login/oauth/access_token');
    let currentInterval = intervalSeconds;

    while (true) {
      await new Promise((resolve) => setTimeout(resolve, currentInterval * 1000));

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: cid,
            device_code: deviceCode,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
          }),
        });

        const data = await res.json();

        if (data.access_token) {
          return data.access_token;
        }

        if (data.error === 'authorization_pending') {
          // Continue polling
          continue;
        }

        if (data.error === 'slow_down') {
          currentInterval += 5;
          onSlowDown?.();
          continue;
        }

        if (data.error === 'expired_token') {
          throw new Error('Device code expired. Please restart sign-in.');
        }

        if (data.error === 'access_denied') {
          throw new Error('Access was denied on GitHub.');
        }

        throw new Error(data.error_description || data.error || 'Authorization failed.');
      } catch (err: any) {
        if (
          err.message.includes('expired') ||
          err.message.includes('denied')
        ) {
          throw err;
        }
        // Network blip, continue polling
        console.warn('Polling network retry:', err);
      }
    }
  }
}
