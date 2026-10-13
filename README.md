# Domotz MCP Server

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

A Model Context Protocol (MCP) server for Domotz network monitoring and management. Enables AI assistants to monitor network devices, view alerts, check device status, and manage network infrastructure.

This is a [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that connects Claude (or any MCP-compatible AI) to your Domotz environment.

> **Part of the [MSP Claude Plugins](https://github.com/WYRE-AI) ecosystem** — a growing suite of AI integrations for the MSP stack. Built by MSPs, for MSPs.

## Installation

```bash
npm install @wyre-ai/domotz-mcp
```

## Configuration

Copy [`.env.example`](.env.example) and set the variables below.

| Variable | Required | Description |
|----------|----------|-------------|
| `DOMOTZ_API_KEY` | For stdio and `AUTH_MODE=env` | Domotz Public API key |
| `DOMOTZ_REGION` | No | API region cell label (default: `us-east-1`) |
| `MCP_TRANSPORT` | No | `stdio` (default) or `http` |
| `AUTH_MODE` | No | `gateway` (Docker image and Compose default) or `env`. Gateway mode requires `X-Domotz-API-Key` on each `/mcp` request and never falls back to `DOMOTZ_API_KEY`. `env` uses that variable only after S2S auth succeeds. |
| `CONDUIT_S2S_SECRET` | Yes for HTTP | Service-to-service secret. The HTTP server logs an error and exits non-zero when this is empty or a known placeholder (`changeme`, `secret`, `your-s2s-secret`, `replace-with-a-real-secret`, and the other values rejected in `src/http.ts`). Compose will not start without it. Never commit a real value. The value is never logged. |
| `MCP_ALLOW_INSECURE_DEV` | No | Set to exactly `1` only for local development to start HTTP without `CONDUIT_S2S_SECRET`. The process logs a warning, does not enforce `X-Gateway-S2S`, and binds `127.0.0.1` only. A non-loopback `MCP_HTTP_HOST` is ignored and the override is logged. A known placeholder secret is still refused. |
| `MCP_HTTP_HOST` | No | Bind address when `MCP_TRANSPORT=http`. Defaults to `127.0.0.1`. Honored when `CONDUIT_S2S_SECRET` is set. The container image sets `0.0.0.0`. |
| `MCP_HTTP_PORT` | No | HTTP port. Defaults to `8080`. |

`/health` stays unauthenticated and does not read credentials. The stdio transport does not use `CONDUIT_S2S_SECRET`.

### HTTP authentication

With `MCP_TRANSPORT=http` and `CONDUIT_S2S_SECRET` set, every `/mcp` request must include `X-Gateway-S2S`. The check is `verifyS2sHeader` in [`src/s2s-verify.ts`](src/s2s-verify.ts): the header value is `t=<unix seconds>,v1=<hex>`, where the hex is HMAC-SHA256 of the literal string `t=<unix seconds>` keyed with `CONDUIT_S2S_SECRET` (64 lowercase hex characters). The timestamp must be within 300 seconds of the server clock. A missing or invalid header returns 401 before vendor credentials are read.

```bash
TS=$(date +%s)
SIG=$(printf 't=%s' "$TS" | openssl dgst -sha256 -hmac "$CONDUIT_S2S_SECRET" -hex | awk '{print $NF}')
curl -sS http://127.0.0.1:8080/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H "X-Gateway-S2S: t=${TS},v1=${SIG}" \
  -H "X-Domotz-API-Key: $DOMOTZ_API_KEY" \
  -H 'X-Domotz-Region: us-east-1' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

In `AUTH_MODE=gateway`, `/mcp` also requires `X-Domotz-API-Key` (`X-Domotz-Region` is optional and defaults to `us-east-1`). That header is the only credential source for the request. In `AUTH_MODE=env`, a valid `X-Gateway-S2S` header is still required and vendor credentials come from `DOMOTZ_API_KEY`.

## Usage

### Running with Claude Desktop

Add to your Claude Desktop `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "domotz-mcp": {
      "command": "npx",
      "args": ["@wyre-ai/domotz-mcp"],
      "env": {
        "DOMOTZ_API_KEY": "your-domotz-api-key"
      }
    }
  }
}
```

### Running with Claude Code (CLI)

```bash
claude mcp add domotz-mcp \
  -e DOMOTZ_API_KEY=your-value \
  -- npx -y @wyre-ai/domotz-mcp
```

### Docker

The image listens on `0.0.0.0` inside the container (`MCP_HTTP_HOST`) and defaults to `AUTH_MODE=gateway`. Publish the port on loopback and pass the S2S secret. In gateway mode, the Domotz API key arrives on each request as `X-Domotz-API-Key`; it is not read from the environment. Compose does not set `DOMOTZ_API_KEY`.

```bash
docker build -t domotz-mcp .
docker run \
  -e CONDUIT_S2S_SECRET="$CONDUIT_S2S_SECRET" \
  -p 127.0.0.1:8080:8080 \
  domotz-mcp
```

Compose refuses to start when `CONDUIT_S2S_SECRET` is unset, sets `AUTH_MODE=gateway`, and publishes `127.0.0.1:8080:8080`. Generate the secret with `openssl rand -hex 32`; do not use a placeholder such as `your-s2s-secret`.

```bash
CONDUIT_S2S_SECRET="$(openssl rand -hex 32)" docker compose up
```

Single-tenant HTTP (`AUTH_MODE=env`) still requires the S2S secret, then uses `DOMOTZ_API_KEY`:

```bash
docker run \
  -e CONDUIT_S2S_SECRET="$CONDUIT_S2S_SECRET" \
  -e AUTH_MODE=env \
  -e DOMOTZ_API_KEY=your-value \
  -e DOMOTZ_REGION=us-east-1 \
  -p 127.0.0.1:8080:8080 \
  domotz-mcp
```

Local HTTP without a secret is development-only. It binds `127.0.0.1` only and logs a warning. A non-loopback `MCP_HTTP_HOST`, including `0.0.0.0`, is ignored:

```bash
MCP_TRANSPORT=http MCP_ALLOW_INSECURE_DEV=1 npm run start:http
```

## Available Domains

### Agents
Manage Domotz monitoring agents

### Alerts
View and manage network alerts

### Devices
Device discovery and status monitoring

### Metrics
Network performance metrics

### Network
Network topology and configuration

### Power
Power management for managed devices


## Development

```bash
# Clone the repository
git clone https://github.com/WYRE-AI/domotz-mcp.git
cd domotz-mcp

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# HTTP transport refuses to start until CONDUIT_S2S_SECRET is a real secret
CONDUIT_S2S_SECRET="$CONDUIT_S2S_SECRET" npm run start:http

# Local HTTP only, without a service-to-service secret (always binds 127.0.0.1)
MCP_ALLOW_INSECURE_DEV=1 npm run start:http
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) if present, or open an issue to discuss changes.

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.
