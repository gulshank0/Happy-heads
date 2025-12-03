# =============================================================================
# Backend Dockerfile for Happy-Heads Application
# =============================================================================
# Multi-stage build for optimal image size and security
# Stage 1: Dependencies installation
# Stage 2: Build TypeScript to JavaScript
# Stage 3: Production runtime
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
# Using Node.js 20 Alpine for smaller image size (~150MB vs ~1GB for full)
# Alpine Linux is security-focused and lightweight
FROM node:20-alpine AS deps

# Install dependencies required for node-gyp and native modules
# - python3, make, g++: Required for compiling native addons
# - openssl: Required for Prisma's query engine
RUN apk add --no-cache \
    g++ \
    make \
    openssl \
    openssl-dev \
    python3

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
# This means if only source code changes, we don't reinstall dependencies
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
# Using --legacy-peer-deps to handle potential peer dependency conflicts
RUN npm ci --legacy-peer-deps

# Copy Prisma schema for client generation
COPY prisma ./prisma/

# Generate Prisma client
# This creates the Prisma client in ./generated/client as specified in schema
RUN npx prisma generate

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy node_modules from deps stage (includes generated Prisma client)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/generated ./generated

# Copy source code and configuration
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src
COPY prisma ./prisma

# Build TypeScript to JavaScript
# Output goes to ./dist as specified in tsconfig.json
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3: Production Runtime
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner

# Security: Run as non-root user
# This is a best practice for container security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 backend

WORKDIR /app

# Install only OpenSSL for Prisma runtime (no build tools needed)
RUN apk add --no-cache openssl

# Copy package files for production dependencies
COPY package*.json ./

# Install ONLY production dependencies (smaller image)
RUN npm ci --only=production --legacy-peer-deps

# Copy Prisma schema and generated client from builder
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/generated ./generated

# Copy compiled JavaScript from builder stage
COPY --from=builder /app/dist ./dist

# Create uploads directory with proper permissions
# This directory stores user avatars and post images
RUN mkdir -p uploads/avatars uploads/posts && \
    chown -R backend:nodejs uploads

# Switch to non-root user for security
USER backend

# Expose the backend port (default 8000)
EXPOSE 8000

# Health check to ensure container is running properly
# Checks /health endpoint every 30 seconds
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8000/health || exit 1

# Default environment variables
# These can be overridden in docker-compose or at runtime
ENV NODE_ENV=production
ENV PORT=8000

# Start the application
# Using node directly instead of npm for better signal handling
CMD ["node", "dist/index.js"]
