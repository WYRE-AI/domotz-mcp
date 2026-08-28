import { describe, it, expect, vi, beforeEach } from 'vitest';
import { agentsHandler } from '../domains/agents.js';
import { domotzRequest } from '../utils/client.js';

vi.mock('../utils/client.js', () => ({ domotzRequest: vi.fn() }));
vi.mock('../utils/logger.js', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const mockedRequest = vi.mocked(domotzRequest);

beforeEach(() => {
  mockedRequest.mockReset();
});

describe('agentsHandler', () => {
  it('domotz_agents_list calls GET /agent and returns the response as formatted JSON', async () => {
    const agents = [{ id: 1, name: 'collector-1', status: 'online' }];
    mockedRequest.mockResolvedValue(agents);

    const result = await agentsHandler.handleCall('domotz_agents_list', {});

    expect(mockedRequest).toHaveBeenCalledWith('/agent');
    expect(result.isError).toBeUndefined();
    expect(result.content[0]?.text).toBe(JSON.stringify(agents, null, 2));
  });

  it('domotz_agents_get calls GET /agent/:id and returns the response as formatted JSON', async () => {
    const agent = { id: 42, name: 'collector-42', status: 'online' };
    mockedRequest.mockResolvedValue(agent);

    const result = await agentsHandler.handleCall('domotz_agents_get', { agent_id: 42 });

    expect(mockedRequest).toHaveBeenCalledWith('/agent/42');
    expect(result.content[0]?.text).toBe(JSON.stringify(agent, null, 2));
  });

  it('returns an isError result for an unknown tool name', async () => {
    const result = await agentsHandler.handleCall('domotz_bogus', {});
    expect(result.isError).toBe(true);
    expect(mockedRequest).not.toHaveBeenCalled();
  });
});
