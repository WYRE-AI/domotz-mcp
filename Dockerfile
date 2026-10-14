FROM node:26-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

FROM node:26-alpine AS production
# OCI label links the GHCR package to this repository,
# enabling GITHUB_TOKEN write access from Actions workflows.
LABEL org.opencontainers.image.source="https://github.com/WYRE-AI/domotz-mcp"
LABEL io.modelcontextprotocol.server.name="io.github.WYRE-AI/domotz-mcp"
RUN addgroup -g 1001 -S appuser && adduser -S appuser -u 1001 -G appuser
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
RUN npm prune --omit=dev && npm cache clean --force
USER appuser
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1
# 0.0.0.0 is safe here only because startup refuses to listen without a real
# CONDUIT_S2S_SECRET. MCP_ALLOW_INSECURE_DEV=1 ignores this host and binds
# 127.0.0.1 only. AUTH_MODE=gateway never falls back to image env credentials.
ENV NODE_ENV=production \
    MCP_TRANSPORT=http \
    MCP_HTTP_PORT=8080 \
    MCP_HTTP_HOST=0.0.0.0 \
    LOG_LEVEL=info \
    AUTH_MODE=gateway
CMD ["node", "dist/http.js"]
