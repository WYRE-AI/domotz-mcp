import { describe, it, expect, vi, beforeEach } from 'vitest';
import { devicesHandler } from '../domains/devices.js';
import { domotzRequest } from '../utils/client.js';

vi.mock('../utils/client.js', () => ({ domotzRequest: vi.fn() }));
vi.mock('../utils/logger.js', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const mockedRequest = vi.mocked(domotzRequest);

beforeEach(() => {
  mockedRequest.mockReset();
});

describe('devicesHandler', () => {
  it('domotz_devices_list calls GET /agent/:agentId/device', async () => {
    const devices = [{ id: 1, ip: '10.0.0.5', online: true }];
    mockedRequest.mockResolvedValue(devices);

    const result = await devicesHandler.handleCall('domotz_devices_list', { agent_id: 7 });

    expect(mockedRequest).toHaveBeenCalledWith('/agent/7/device');
    expect(result.content[0]?.text).toBe(JSON.stringify(devices, null, 2));
  });

  it('domotz_devices_get calls GET /agent/:agentId/device/:deviceId', async () => {
    const device = { id: 3, vendor: 'Cisco', model: 'ISR4321' };
    mockedRequest.mockResolvedValue(device);

    const result = await devicesHandler.handleCall('domotz_devices_get', {
      agent_id: 7,
      device_id: 3,
    });

    expect(mockedRequest).toHaveBeenCalledWith('/agent/7/device/3');
    expect(result.content[0]?.text).toBe(JSON.stringify(device, null, 2));
  });

  it('domotz_devices_uptime calls GET /agent/:agentId/device/:deviceId/uptime', async () => {
    const uptime = { current_seconds: 86400 };
    mockedRequest.mockResolvedValue(uptime);

    const result = await devicesHandler.handleCall('domotz_devices_uptime', {
      agent_id: 7,
      device_id: 3,
    });

    expect(mockedRequest).toHaveBeenCalledWith('/agent/7/device/3/uptime');
    expect(result.content[0]?.text).toBe(JSON.stringify(uptime, null, 2));
  });

  it('domotz_devices_history calls GET /agent/:agentId/device/:deviceId/history/rtd', async () => {
    const history = [{ event: 'online', at: '2026-08-01T00:00:00Z' }];
    mockedRequest.mockResolvedValue(history);

    const result = await devicesHandler.handleCall('domotz_devices_history', {
      agent_id: 7,
      device_id: 3,
    });

    expect(mockedRequest).toHaveBeenCalledWith('/agent/7/device/3/history/rtd');
    expect(result.content[0]?.text).toBe(JSON.stringify(history, null, 2));
  });

  it('domotz_devices_inventory calls GET /agent/:agentId/device/:deviceId/inventory', async () => {
    const inventory = { owner: 'ops-team', location: 'rack-3' };
    mockedRequest.mockResolvedValue(inventory);

    const result = await devicesHandler.handleCall('domotz_devices_inventory', {
      agent_id: 7,
      device_id: 3,
    });

    expect(mockedRequest).toHaveBeenCalledWith('/agent/7/device/3/inventory');
    expect(result.content[0]?.text).toBe(JSON.stringify(inventory, null, 2));
  });

  it('returns an isError result for an unknown tool name', async () => {
    const result = await devicesHandler.handleCall('domotz_bogus', {});
    expect(result.isError).toBe(true);
    expect(mockedRequest).not.toHaveBeenCalled();
  });
});
