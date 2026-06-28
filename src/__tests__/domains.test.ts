import { describe, it, expect } from 'vitest';
import { getDomainHandler } from '../domains/index.js';
import type { DomainName } from '../utils/types.js';

const DOMAINS: DomainName[] = ['agents', 'devices', 'metrics', 'network', 'alerts', 'power'];

describe('getDomainHandler', () => {
  it('resolves a handler for every known domain', async () => {
    for (const domain of DOMAINS) {
      const handler = await getDomainHandler(domain);
      expect(typeof handler.getTools).toBe('function');
      expect(typeof handler.handleCall).toBe('function');
    }
  });

  it('caches handlers — repeat lookups return the same instance', async () => {
    const first = await getDomainHandler('devices');
    const second = await getDomainHandler('devices');
    expect(first).toBe(second);
  });

  it('throws on an unknown domain', async () => {
    await expect(getDomainHandler('bogus' as DomainName)).rejects.toThrow(/Unknown domain/);
  });
});

describe('domain handler contracts', () => {
  it('every handler exposes domotz_-prefixed tools with object input schemas', async () => {
    for (const domain of DOMAINS) {
      const tools = (await getDomainHandler(domain)).getTools();
      expect(tools.length).toBeGreaterThan(0);
      for (const tool of tools) {
        expect(tool.name).toMatch(/^domotz_/);
        expect(tool.inputSchema.type).toBe('object');
      }
    }
  });

  it('returns an isError result for an unrecognised tool name', async () => {
    for (const domain of DOMAINS) {
      const result = await (await getDomainHandler(domain)).handleCall('domotz_not_a_real_tool', {});
      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Unknown tool');
    }
  });
});
