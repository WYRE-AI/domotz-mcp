## [Unreleased]

### Fixed

- `/health` liveness endpoint now returns an unconditional `200` instead of gating on request-scoped credentials. The Azure Container Apps liveness probe carries no credentials, so the credential gate introduced with the AsyncLocalStorage security fix (#40) made `/health` return `503`, causing ACA to crash-loop the container (ContainerBackOff). Credential state is still reported in the response body (`credentials.configured`), and the `/mcp` request-scoped credential isolation is unchanged.

## [1.0.4](https://github.com/wyre-technology/domotz-mcp/compare/v1.0.3...v1.0.4) (2026-04-07)


### Bug Fixes

* **ci:** deploy :latest tag, force revision via env var bump ([d4e2f5c](https://github.com/wyre-technology/domotz-mcp/commit/d4e2f5c77d2f1b2f42e71d65fc579abbd6b92bb4))

## [1.0.3](https://github.com/wyre-technology/domotz-mcp/compare/v1.0.2...v1.0.3) (2026-04-06)


### Bug Fixes

* per-request MCP Server+Transport for gateway compatibility ([a88a92b](https://github.com/wyre-technology/domotz-mcp/commit/a88a92bdca41c63bd972822baca2bc65b14988eb))

## [1.0.2](https://github.com/wyre-technology/domotz-mcp/compare/v1.0.1...v1.0.2) (2026-04-06)


### Bug Fixes

* **ci:** add OCI source label to Dockerfile for GHCR repo linkage ([9d65640](https://github.com/wyre-technology/domotz-mcp/commit/9d656409428fd2c83b5be0e957a3652b6bbb53fe))

## [1.0.1](https://github.com/wyre-technology/domotz-mcp/compare/v1.0.0...v1.0.1) (2026-04-06)


### Bug Fixes

* **ci:** remove Docker build cache options causing buildx failures ([5547f93](https://github.com/wyre-technology/domotz-mcp/commit/5547f930ba083c0a8a095f0669646badd1f6ebe1))

# 1.0.0 (2026-03-02)


### Features

* initial Domotz MCP server implementation ([0d125c7](https://github.com/wyre-technology/domotz-mcp/commit/0d125c7ff7ccc603878e58ea24f7dd70efbd77b2))
