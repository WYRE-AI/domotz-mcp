import { describe, it, expect, vi, beforeEach } from 'vitest';
import { powerHandler } from '../domains/power.js';
import { domotzRequest } from '../utils/client.js';

vi.mock('../utils/client.js', () => ({ domotzRequest: vi.fn() }));
vi.mock('../utils/logger.js', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const mockedRequest = vi.mocked(domotzRequest);

beforeEach(() => {
  mockedRequest.mockReset();
});

describe('powerHandler', () => {
  it('domotz_power_outlets_list calls GET /agent/:agentId/device/:deviceId/power-outlet', async () => {
    const outlets = [{ id: 1, state: 'on' }];
    mockedRequest.mockResolvedValue(outlets);

    const result = await powerHandler.handleCall('domotz_power_outlets_list', {
      agent_id: 2,
      device_id: 3,
    });

    expect(mockedRequest).toHaveBeenCalledWith('/agent/2/device/3/power-outlet');
    expect(result.content[0]?.text).toBe(JSON.stringify(outlets, null, 2));
  });

  it('domotz_power_outlet_control refuses to run without confirm: true, and never calls the API', async () => {
    const result = await powerHandler.handleCall('domotz_power_outlet_control', {
      agent_id: 2,
      device_id: 3,
      outlet_id: 5,
      action: 'off',
      confirm: false,
    });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('confirm: true');
    expect(mockedRequest).not.toHaveBeenCalled();
  });

  it('domotz_power_outlet_control POSTs to the action endpoint when confirmed', async () => {
    mockedRequest.mockResolvedValue(undefined);

    const result = await powerHandler.handleCall('domotz_power_outlet_control', {
      agent_id: 2,
      device_id: 3,
      outlet_id: 5,
      action: 'cycle',
      confirm: true,
    });

    expect(mockedRequest).toHaveBeenCalledWith('/agent/2/device/3/power-outlet/5/action/cycle', {
      method: 'POST',
    });
    expect(result.isError).toBeUndefined();
    expect(result.content[0]?.text).toContain("outlet 5 action 'cycle' executed successfully");
  });

  it('returns an isError result for an unknown tool name', async () => {
    const result = await powerHandler.handleCall('domotz_bogus', {});
    expect(result.isError).toBe(true);
    expect(mockedRequest).not.toHaveBeenCalled();
  });
});
