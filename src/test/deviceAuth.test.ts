import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DeviceAuthService } from '../services/deviceAuth';
import { POST } from '../../api/device-auth';
const fetchMock = vi.fn();
const code = { device_code: 'test-device-code-123', user_code: 'TEST-CODE', verification_uri: 'https://github.com/login/device', expires_in: 900, interval: 5 };
beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
const reply = (data: unknown, status = 200) => Response.json(data, { status });
const apiRequest = (body: unknown, origin = 'https://tasky.test') => new Request('https://tasky.test/api/device-auth', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(body) });

describe('same-origin GitHub authorization', () => {
  it('requests codes through the Vercel API, never an external proxy', async () => {
    fetchMock.mockResolvedValueOnce(reply(code));
    expect(await DeviceAuthService.requestDeviceCode()).toEqual(code);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/device-auth');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ action: 'code' });
  });
  it('surfaces GitHub configuration errors even with HTTP 200', async () => {
    fetchMock.mockResolvedValueOnce(reply({ error: 'device_flow_disabled', error_description: 'Enable Device Flow' }));
    await expect(DeviceAuthService.requestDeviceCode()).rejects.toThrow('Enable Device Flow');
  });
  it('polls pending requests at the requested interval and returns the token', async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValueOnce(reply({ error: 'authorization_pending' })).mockResolvedValueOnce(reply({ access_token: 'test-token' }));
    const promise = DeviceAuthService.pollForToken(code.device_code);
    await vi.advanceTimersByTimeAsync(4999); expect(fetchMock).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1); expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(5000); expect(await promise).toBe('test-token');
  });
  it('adds five seconds to polling after slow_down', async () => {
    vi.useFakeTimers(); const slowed = vi.fn();
    fetchMock.mockResolvedValueOnce(reply({ error: 'slow_down' })).mockResolvedValueOnce(reply({ access_token: 'test-token' }));
    const promise = DeviceAuthService.pollForToken(code.device_code, 5, 900, undefined, slowed);
    await vi.advanceTimersByTimeAsync(5000); expect(slowed).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(9999); expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1); expect(await promise).toBe('test-token');
  });
  it('cancels the polling delay when the modal closes', async () => {
    vi.useFakeTimers(); const controller = new AbortController();
    const promise = DeviceAuthService.pollForToken(code.device_code, 5, 900, controller.signal);
    const result = expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    controller.abort(); await result;
    await vi.advanceTimersByTimeAsync(20000); expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each(['access_denied', 'incorrect_client_credentials', 'expired_token'])('stops polling on terminal error %s', async error => {
    vi.useFakeTimers(); fetchMock.mockResolvedValueOnce(reply({ error }));
    const result = expect(DeviceAuthService.pollForToken(code.device_code)).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(5000); await result;
    await vi.advanceTimersByTimeAsync(20000); expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('stops at the device expiry time', async () => {
    vi.useFakeTimers(); const result = expect(DeviceAuthService.pollForToken(code.device_code, 5, 5)).rejects.toThrow('expired');
    await vi.advanceTimersByTimeAsync(5000); await result; expect(fetchMock).not.toHaveBeenCalled();
  });
  it('surfaces API failures instead of polling forever', async () => {
    vi.useFakeTimers(); fetchMock.mockResolvedValueOnce(reply({ error_description: 'Service unavailable' }, 502));
    const result = expect(DeviceAuthService.pollForToken(code.device_code)).rejects.toThrow('Service unavailable');
    await vi.advanceTimersByTimeAsync(5000); await result; expect(fetchMock).toHaveBeenCalledOnce();
  });
});

describe('Vercel Device Flow relay', () => {
  it('uses the fixed Tasky client ID and GitHub code endpoint', async () => {
    fetchMock.mockResolvedValueOnce(reply(code));
    const result = await POST(apiRequest({ action: 'code', url: 'https://attacker.test', client_id: 'attacker' }));
    expect(result.status).toBe(200); expect(await result.json()).toEqual(code);
    expect(result.headers.get('cache-control')).toBe('no-store');
    expect(fetchMock.mock.calls[0][0]).toBe('https://github.com/login/device/code');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).client_id).toBe('Ov23liYCXe1qPYV6HjQp');
  });
  it('forwards pending responses and token exchanges without logging or caching tokens', async () => {
    fetchMock.mockResolvedValueOnce(reply({ error: 'authorization_pending' }));
    const result = await POST(apiRequest({ action: 'token', device_code: code.device_code }));
    expect(await result.json()).toEqual({ error: 'authorization_pending' });
    expect(fetchMock.mock.calls[0][0]).toBe('https://github.com/login/oauth/access_token');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).grant_type).toBe('urn:ietf:params:oauth:grant-type:device_code');
  });
  it('rejects unrelated origins before making upstream requests', async () => {
    expect((await POST(apiRequest({ action: 'code' }, 'https://attacker.test'))).status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each([{ action: 'anything' }, { action: 'token' }, { action: 'token', device_code: 123 }, null])('rejects malformed input %j', async input => {
    expect((await POST(apiRequest(input))).status).toBe(400); expect(fetchMock).not.toHaveBeenCalled();
  });
  it('reports upstream network failures', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network failure'));
    expect((await POST(apiRequest({ action: 'code' }))).status).toBe(502);
  });
});
