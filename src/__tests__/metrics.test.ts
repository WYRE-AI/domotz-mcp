import { describe, it, expect, vi, beforeEach } from 'vitest';
import { metricsHandler } from '../domains/metrics.js';
import { domotzRequest } from '../utils/client.js';

vi.mock('../utils/client.js', () => ({ domotzRequest: vi.fn() }));
vi.mock('../utils/logger.js', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const mockedRequest = vi.mocked(domotzRequest);

beforeEach(() => {
  mockedRequest.mockReset();
});

describe('metricsHandler', () => {
  it('domotz_metrics_variables_list calls GET /agent/:agentId/device/:deviceId/variable', async () => {
    const vars = [{ id: 1, name: 'cpu_load' }];
    mockedRequest.mockResolvedValue(vars);

    const result = await metricsHandler.handleCall('domotz_metrics_variables_list', {
      agent_id: 4,
      device_id: 8,
    });

    expect(mockedRequest).toHaveBeenCalledWith('/agent/4/device/8/variable');
    expect(result.content[0]?.text).toBe(JSON.stringify(vars, null, 2));
  });

  it('domotz_metrics_variable_history calls GET .../variable/:variableId/history', async () => {
    const history = [{ t: 1, v: 0.42 }];
    mockedRequest.mockResolvedValue(history);

    const result = await metricsHandler.handleCall('domotz_metrics_variable_history', {
      agent_id: 4,
      device_id: 8,
      variable_id: 11,
    });

    expect(mockedRequest).toHaveBeenCalledWith('/agent/4/device/8/variable/11/history');
    expect(result.content[0]?.text).toBe(JSON.stringify(history, null, 2));
  });

  it('domotz_metrics_snmp_sensors_list calls GET /agent/:agentId/device/:deviceId/eye/snmp', async () => {
    const sensors = [{ id: 21, name: 'temp-sensor' }];
    mockedRequest.mockResolvedValue(sensors);

    const result = await metricsHandler.handleCall('domotz_metrics_snmp_sensors_list', {
      agent_id: 4,
      device_id: 8,
    });

    expect(mockedRequest).toHaveBeenCalledWith('/agent/4/device/8/eye/snmp');
    expect(result.content[0]?.text).toBe(JSON.stringify(sensors, null, 2));
  });

  it('domotz_metrics_sensor_history calls GET .../eye/snmp/:sensorId/history', async () => {
    const history = [{ t: 1, v: 72 }];
    mockedRequest.mockResolvedValue(history);

    const result = await metricsHandler.handleCall('domotz_metrics_sensor_history', {
      agent_id: 4,
      device_id: 8,
      sensor_id: 21,
    });

    expect(mockedRequest).toHaveBeenCalledWith('/agent/4/device/8/eye/snmp/21/history');
    expect(result.content[0]?.text).toBe(JSON.stringify(history, null, 2));
  });

  it('returns an isError result for an unknown tool name', async () => {
    const result = await metricsHandler.handleCall('domotz_bogus', {});
    expect(result.isError).toBe(true);
    expect(mockedRequest).not.toHaveBeenCalled();
  });
});
