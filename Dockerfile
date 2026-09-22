# Multi-stage build for Node.js backend

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy server files only
COPY server/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy built node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy server code
COPY server/ ./

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"]
