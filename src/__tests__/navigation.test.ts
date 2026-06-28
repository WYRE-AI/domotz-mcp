import { describe, it, expect } from 'vitest';
import { getNavigationTools, getBackTool, getState } from '../domains/navigation.js';

describe('navigation tools', () => {
  it('exposes domotz_navigate and domotz_status', () => {
    expect(getNavigationTools().map((t) => t.name)).toEqual(['domotz_navigate', 'domotz_status']);
  });

  it('domotz_navigate enumerates all six domains and requires the domain arg', () => {
    const nav = getNavigationTools().find((t) => t.name === 'domotz_navigate');
    expect(nav).toBeDefined();
    const props = nav!.inputSchema.properties as Record<string, { enum?: string[] }>;
    expect(props.domain?.enum).toEqual(['agents', 'devices', 'metrics', 'network', 'alerts', 'power']);
    expect(nav!.inputSchema.required).toEqual(['domain']);
  });

  it('getBackTool returns the domotz_back tool', () => {
    expect(getBackTool().name).toBe('domotz_back');
  });
});

describe('navigation state', () => {
  it('starts a session with no current domain', () => {
    expect(getState('session-a').currentDomain).toBeNull();
  });

  it('returns the same mutable state object for a given session', () => {
    const state = getState('session-b');
    state.currentDomain = 'devices';
    expect(getState('session-b').currentDomain).toBe('devices');
  });

  it('keeps state isolated between sessions', () => {
    getState('session-c').currentDomain = 'alerts';
    expect(getState('session-d').currentDomain).toBeNull();
  });
});
