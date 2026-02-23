# Artisan Commerce - Multi-stage Docker build
# Optimized for production deployment with minimal image size

# Stage 1: Base image with Node.js
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/adapters/package.json ./packages/adapters/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
COPY apps/web/package.json ./apps/web/
COPY apps/workers/package.json ./apps/workers/

# Stage 2: Install dependencies
FROM base AS deps

# Install production dependencies
RUN pnpm install --frozen-lockfile --prod

# Install all dependencies (including dev) for build
FROM base AS deps-build
RUN pnpm install --frozen-lockfile

# Stage 3: Build application
FROM deps-build AS builder

# Copy source code
COPY . .

# Build all packages
RUN pnpm run build

# Stage 4: Production image for Next.js
FROM node:20-alpine AS web

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

# Copy built Next.js app
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start Next.js
CMD ["pnpm", "--filter", "web", "start"]

# Stage 5: Production image for Workers (for local development)
FROM node:20-alpine AS workers

WORKDIR /app

# Install pnpm and wrangler
RUN npm install -g pnpm@8 wrangler@3

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

# Copy built Workers app
COPY --from=builder /app/apps/workers/dist ./apps/workers/dist
COPY --from=builder /app/apps/workers/wrangler.toml ./apps/workers/
COPY --from=builder /app/apps/workers/package.json ./apps/workers/

# Set environment
ENV NODE_ENV=production
ENV PORT=8787

# Expose port
EXPOSE 8787

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8787/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start Workers (local dev mode)
CMD ["wrangler", "dev", "--port", "8787", "--local"]
