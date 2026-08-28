import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { getState, getNavigationTools, getBackTool } from './domains/navigation.js';
import { getDomainHandler } from './domains/index.js';
import { getCredentials } from './utils/client.js';
import { logger } from './utils/logger.js';
import type { DomainName } from './utils/types.js';

export function createServer(): Server {
  const server = new Server(
    { name: 'domotz-mcp', version: '1.0.0' },
    { capabilities: { tools: {}, logging: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async (_request, extra) => {
    const sessionId = (extra as { sessionId?: string }).sessionId || 'default';
    const state = getState(sessionId);

    if (!state.currentDomain) {
      return { tools: getNavigationTools() };
    }

    const handler = await getDomainHandler(state.currentDomain);
    return { tools: [...handler.getTools(), getBackTool()] };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
    const { name, arguments: args } = request.params;
    const sessionId = (extra as { sessionId?: string }).sessionId || 'default';
    const state = getState(sessionId);

    if (name === 'domotz_navigate') {
      const domain = (args?.domain as DomainName);
      state.currentDomain = domain;
      const handler = await getDomainHandler(domain);
      const tools = handler.getTools().map(t => t.name);
      await server.sendToolListChanged();
      return {
        content: [{ type: 'text' as const, text: `Navigated to ${domain}. Available tools: ${tools.join(', ')}` }],
      };
    }

    if (name === 'domotz_back') {
      state.currentDomain = null;
      await server.sendToolListChanged();
      return { content: [{ type: 'text' as const, text: 'Returned to domain navigation.' }] };
    }

    if (name === 'domotz_status') {
      const creds = getCredentials();
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            connected: !!creds,
            region: creds?.region || 'not configured',
            domains: ['agents', 'devices', 'metrics', 'network', 'alerts', 'power'],
            currentDomain: state.currentDomain,
          }, null, 2),
        }],
      };
    }

    if (!state.currentDomain) {
      return {
        content: [{ type: 'text' as const, text: `Unknown tool: ${name}. Call conduit__my_access to see which tools are available to you.` }],
        isError: true,
      };
    }

    const handler = await getDomainHandler(state.currentDomain);
    try {
      return await handler.handleCall(name, args || {});
    } catch (error) {
      logger.error('Tool call failed', { tool: name, error: (error as Error).message });
      return {
        content: [{ type: 'text' as const, text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  });

  return server;
}
