# Multi-stage build for Node.js backend + React frontend (with SSR)

# ═══════════════════════════════════════════════════════════════════════════
# Stage 1: Build Client (React + Vite)
# ═══════════════════════════════════════════════════════════════════════════
FROM node:18-alpine AS client-builder

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./

# Install client dependencies
RUN npm ci --only=production

# Copy client source code
COPY client/ ./

# Build client for production (both CSR and SSR bundles)
RUN npm run build:all

# ═══════════════════════════════════════════════════════════════════════════
# Stage 2: Build Server
# ═══════════════════════════════════════════════════════════════════════════
FROM node:18-alpine AS server-builder

WORKDIR /app/server

# Copy server package files
COPY server/package*.json ./

# Install server dependencies (production only)
RUN npm ci --only=production

# ═══════════════════════════════════════════════════════════════════════════
# Stage 3: Runtime
# ═══════════════════════════════════════════════════════════════════════════
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy server dependencies from builder
COPY --from=server-builder /app/server/node_modules ./server/node_modules

# Copy server code
COPY server/ ./server/

# Copy client build artifacts from client-builder
COPY --from=client-builder /app/client/dist ./client/dist
COPY --from=client-builder /app/client/dist-ssr ./client/dist-ssr

# Set working directory to server
WORKDIR /app/server

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"]
