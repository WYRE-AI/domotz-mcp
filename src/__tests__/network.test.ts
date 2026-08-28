import { describe, it, expect, vi, beforeEach } from 'vitest';
import { networkHandler } from '../domains/network.js';
import { domotzRequest } from '../utils/client.js';

vi.mock('../utils/client.js', () => ({ domotzRequest: vi.fn() }));
vi.mock('../utils/logger.js', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const mockedRequest = vi.mocked(domotzRequest);

beforeEach(() => {
  mockedRequest.mockReset();
});

describe('networkHandler', () => {
  it('domotz_network_topology calls GET /agent/:agentId/network-topology', async () => {
    const topology = { nodes: [], edges: [] };
    mockedRequest.mockResolvedValue(topology);

    const result = await networkHandler.handleCall('domotz_network_topology', { agent_id: 6 });

    expect(mockedRequest).toHaveBeenCalledWith('/agent/6/network-topology');
    expect(result.content[0]?.text).toBe(JSON.stringify(topology, null, 2));
  });

  it('domotz_network_interfaces calls GET /agent/:agentId/network/interfaces', async () => {
    const interfaces = [{ name: 'eth0', ip: '10.0.0.1' }];
    mockedRequest.mockResolvedValue(interfaces);

    const result = await networkHandler.handleCall('domotz_network_interfaces', { agent_id: 6 });

    expect(mockedRequest).toHaveBeenCalledWith('/agent/6/network/interfaces');
    expect(result.content[0]?.text).toBe(JSON.stringify(interfaces, null, 2));
  });

  it('domotz_network_ip_conflicts calls GET /agent/:agentId/ip-conflict', async () => {
    const conflicts = [{ ip: '10.0.0.9', devices: [1, 2] }];
    mockedRequest.mockResolvedValue(conflicts);

    const result = await networkHandler.handleCall('domotz_network_ip_conflicts', { agent_id: 6 });

    expect(mockedRequest).toHaveBeenCalledWith('/agent/6/ip-conflict');
    expect(result.content[0]?.text).toBe(JSON.stringify(conflicts, null, 2));
  });

  it('returns an isError result for an unknown tool name', async () => {
    const result = await networkHandler.handleCall('domotz_bogus', {});
    expect(result.isError).toBe(true);
    expect(mockedRequest).not.toHaveBeenCalled();
  });
});
