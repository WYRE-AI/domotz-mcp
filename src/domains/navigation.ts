import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { NavigationState } from '../utils/types.js';

const sessionStates = new Map<string, NavigationState>();

export function getState(sessionId: string = 'default'): NavigationState {
  if (!sessionStates.has(sessionId)) {
    sessionStates.set(sessionId, { currentDomain: null });
  }
  return sessionStates.get(sessionId)!;
}

export function getNavigationTools(): Tool[] {
  return [
    {
      name: 'domotz_navigate',
      description: 'Navigate to a domain to access Domotz tools. Domains: agents (collectors/sites), devices (network devices), metrics (SNMP/variables), network (topology/interfaces), alerts (alert profiles), power (PDU/outlets).',
      inputSchema: {
        type: 'object' as const,
        properties: {
          domain: {
            type: 'string',
            enum: ['agents', 'devices', 'metrics', 'network', 'alerts', 'power'],
            description: 'The domain to navigate to',
          },
        },
        required: ['domain'],
      },
    },
    {
      name: 'domotz_status',
      description: 'Check Domotz API connection status and available domains.',
      inputSchema: { type: 'object' as const, properties: {} },
    },
  ];
}

export function getBackTool(): Tool {
  return {
    name: 'domotz_back',
    description: 'Return to the domain navigation menu.',
    inputSchema: { type: 'object' as const, properties: {} },
  };
}
