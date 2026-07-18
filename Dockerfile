# Adaptive Media MCP server (Streamable HTTP on /mcp, health at /health).
# Portable image for Fly / Railway / any container host.
FROM node:20-slim
WORKDIR /app

# Install deps (incl. dev deps: vite/tsx are needed to build widgets and run).
COPY package*.json ./
RUN npm ci

# Build the widget bundles the server reads at request time.
COPY . .
RUN npm run build:web && npm run build:nextbound && npm run build:feed

ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000

# tsx server/index.ts — binds 0.0.0.0:$PORT, serves /mcp and /health.
CMD ["npm", "start"]
