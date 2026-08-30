import { describe, it, expect, vi, beforeEach } from 'vitest';
import { alertsHandler } from '../domains/alerts.js';
import { domotzRequest } from '../utils/client.js';

vi.mock('../utils/client.js', () => ({ domotzRequest: vi.fn() }));
vi.mock('../utils/logger.js', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const mockedRequest = vi.mocked(domotzRequest);

beforeEach(() => {
  mockedRequest.mockReset();
});

describe('alertsHandler', () => {
  it('domotz_alerts_profiles_list calls GET /alert-profile and returns the response as formatted JSON', async () => {
    const profiles = [{ id: 1, name: 'Device offline' }];
    mockedRequest.mockResolvedValue(profiles);

    const result = await alertsHandler.handleCall('domotz_alerts_profiles_list', {});

    expect(mockedRequest).toHaveBeenCalledWith('/alert-profile');
    expect(result.content[0]?.text).toBe(JSON.stringify(profiles, null, 2));
  });

  it('domotz_alerts_device_list calls GET /agent/:agentId/device/:deviceId/alert-profile', async () => {
    const bindings = [{ profile_id: 1, enabled: true }];
    mockedRequest.mockResolvedValue(bindings);

    const result = await alertsHandler.handleCall('domotz_alerts_device_list', {
      agent_id: 5,
      device_id: 9,
    });

    expect(mockedRequest).toHaveBeenCalledWith('/agent/5/device/9/alert-profile');
    expect(result.content[0]?.text).toBe(JSON.stringify(bindings, null, 2));
  });

  it('returns an isError result for an unknown tool name', async () => {
    const result = await alertsHandler.handleCall('domotz_bogus', {});
    expect(result.isError).toBe(true);
    expect(mockedRequest).not.toHaveBeenCalled();
  });
});
