import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCredentials, getBaseUrl, domotzRequest } from '../utils/client.js';

// getCredentials / domotzRequest read process.env at call time, so each test
// starts from a clean slate and the originals are restored afterwards.
const ENV_KEYS = ['DOMOTZ_API_KEY', 'DOMOTZ_REGION'] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ENV_KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// Minimal stand-in for the global fetch Response that domotzRequest consumes:
// it only ever reads `ok`, `status`, and `text()`.
function fakeResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
  } as unknown as Response;
}

describe('getCredentials', () => {
  it('returns null when DOMOTZ_API_KEY is unset', () => {
    expect(getCredentials()).toBeNull();
  });

  it('defaults the region to us-east-1', () => {
    process.env.DOMOTZ_API_KEY = 'k';
    expect(getCredentials()).toEqual({ apiKey: 'k', region: 'us-east-1' });
  });

  it('honours DOMOTZ_REGION when set', () => {
    process.env.DOMOTZ_API_KEY = 'k';
    process.env.DOMOTZ_REGION = 'eu-west-1';
    expect(getCredentials()?.region).toBe('eu-west-1');
  });
});

describe('getBaseUrl', () => {
  it('defaults to the us-east-1 cell', () => {
    expect(getBaseUrl()).toBe('https://api-us-east-1-cell-1.domotz.com/public-api/v1');
  });

  it('builds the URL for an explicit region', () => {
    expect(getBaseUrl('eu-west-1')).toBe('https://api-eu-west-1-cell-1.domotz.com/public-api/v1');
  });
});

describe('domotzRequest', () => {
  it('throws when no credentials are configured', async () => {
    await expect(domotzRequest('/agent')).rejects.toThrow(/No Domotz credentials/);
  });

  it('sends the API key header to the right URL and resolves parsed JSON', async () => {
    process.env.DOMOTZ_API_KEY = 'secret';
    const fetchMock = vi.fn().mockResolvedValue(fakeResponse([{ id: 1 }]));
    vi.stubGlobal('fetch', fetchMock);

    const result = await domotzRequest<Array<{ id: number }>>('/agent');

    expect(result).toEqual([{ id: 1 }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api-us-east-1-cell-1.domotz.com/public-api/v1/agent');
    expect((init.headers as Record<string, string>)['X-Api-Key']).toBe('secret');
    expect(init.method).toBe('GET');
  });

  it('appends defined query params and skips undefined ones', async () => {
    process.env.DOMOTZ_API_KEY = 'k';
    const fetchMock = vi.fn().mockResolvedValue(fakeResponse({}));
    vi.stubGlobal('fetch', fetchMock);

    await domotzRequest('/device', { params: { status: 'ONLINE', limit: 10, cursor: undefined } });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('status=ONLINE');
    expect(url).toContain('limit=10');
    expect(url).not.toContain('cursor');
  });

  it('serializes a JSON body with the chosen method', async () => {
    process.env.DOMOTZ_API_KEY = 'k';
    const fetchMock = vi.fn().mockResolvedValue(fakeResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await domotzRequest('/device/1/note', { method: 'POST', body: { text: 'hi' } });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ text: 'hi' }));
  });

  it('returns raw text when the response body is not JSON', async () => {
    process.env.DOMOTZ_API_KEY = 'k';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fakeResponse('plain text')));
    await expect(domotzRequest<string>('/health')).resolves.toBe('plain text');
  });

  it('throws with the status and body on a non-2xx response', async () => {
    process.env.DOMOTZ_API_KEY = 'k';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fakeResponse('nope', false, 404)));
    await expect(domotzRequest('/agent')).rejects.toThrow(/Domotz API error 404: nope/);
  });
});
