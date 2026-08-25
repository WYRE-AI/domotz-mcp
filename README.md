# Domotz MCP Server

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

A Model Context Protocol (MCP) server for Domotz network monitoring and management. Enables AI assistants to monitor network devices, view alerts, check device status, and manage network infrastructure.

This is a [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that connects Claude (or any MCP-compatible AI) to your Domotz environment.

> **Part of the [MSP Claude Plugins](https://github.com/wyre-technology) ecosystem** — a growing suite of AI integrations for the MSP stack. Built by MSPs, for MSPs.

## Installation

```bash
npm install @wyre-ai/domotz-mcp
```

## Configuration

Set the following environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DOMOTZ_API_KEY` | Yes | Your Domotz API key |
| `DOMOTZ_REGION` | No | API region: us or eu (default: us) |
| `MCP_TRANSPORT` | No | Transport mode: stdio (default) or http |

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

```bash
docker build -t domotz-mcp .
docker run \
  -e DOMOTZ_API_KEY=your-value \
  -p 8080:8080 domotz-mcp
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
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) if present, or open an issue to discuss changes.

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.
