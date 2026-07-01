import { createServer as createHttpServer } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './server.js';
import { getCredentials, runWithCredentials } from './utils/client.js';
import { logger } from './utils/logger.js';

function startHttpServer(): void {
  const port = parseInt(process.env.MCP_HTTP_PORT || '8080', 10);
  const host = process.env.MCP_HTTP_HOST || '0.0.0.0';
  const isGatewayMode = process.env.AUTH_MODE === 'gateway';

  const httpServer = createHttpServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

    if (url.pathname === '/health') {
      // liveness: must NOT gate on credentials (ACA probe carries none) or the container crash-loops
      const creds = getCredentials();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        transport: 'http',
        credentials: { configured: !!creds },
        timestamp: new Date().toISOString(),
      }));
      return;
    }

    if (url.pathname !== '/mcp') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found', endpoints: ['/mcp', '/health'] }));
      return;
    }

    const apiKey = isGatewayMode ? (req.headers['x-domotz-api-key'] as string | undefined) : undefined;
    const region = isGatewayMode ? (req.headers['x-domotz-region'] as string | undefined) : undefined;

    if (isGatewayMode && !apiKey) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing X-Domotz-API-Key header' }));
      return;
    }

    const handle = async () => {
      const server = createServer();
      // SECURITY-CRITICAL invariant: this transport MUST stay stateless
      // (sessionIdGenerator: undefined + enableJsonResponse: true). Per-request
      // tenant credentials are carried in an AsyncLocalStorage context opened by
      // runWithCredentials() below. A stateless request->single-response flow
      // keeps the tool call inside that context. Switching to a stateful/SSE
      // transport (sessionIdGenerator set, persistent stream) would let a
      // long-lived connection serve later messages under a stale/foreign
      // credential context — re-review tenant isolation before changing this.
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
      res.on('close', () => { transport.close(); server.close(); });
      await server.connect(transport);
      await transport.handleRequest(req, res);
    };

    if (apiKey && region) {
      await runWithCredentials({ apiKey, region }, handle);
    } else if (apiKey) {
      await runWithCredentials({ apiKey, region: 'us-east-1' }, handle);
    } else {
      await handle();
    }
  });

  httpServer.listen(port, host, () => {
    logger.info(`Domotz MCP HTTP server listening on ${host}:${port}`);
  });
}

const transport = process.env.MCP_TRANSPORT;
if (transport === 'http') {
  startHttpServer();
} else {
  import('./index.js');
}
