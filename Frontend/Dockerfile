# =============================================================================
# Frontend Dockerfile for Happy-Heads Application
# =============================================================================
# Multi-stage build optimized for React/Vite applications
# Stage 1: Install dependencies with pnpm
# Stage 2: Build the production bundle
# Stage 3: Serve with Nginx for production
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps

# Install pnpm globally (project uses pnpm as package manager)
# Version matches packageManager field in package.json
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate

WORKDIR /app

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml* ./

# Install dependencies using pnpm
# Use --no-frozen-lockfile if lockfile doesn't exist (first build)
RUN pnpm install

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files needed for build
COPY package.json pnpm-lock.yaml* ./
COPY index.html ./
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./
COPY src ./src
COPY public ./public
COPY shared ./shared
COPY Matching ./Matching

# Build-time environment variables
# These are embedded into the static bundle during build
ARG VITE_BACKEND_URL=http://localhost:8000
ARG VITE_WS_URL=ws://localhost:8000

# Set environment variables for the build
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_WS_URL=$VITE_WS_URL

# Build the production bundle
# Output goes to ./dist as configured in vite.config.ts
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3: Production with Nginx
# -----------------------------------------------------------------------------
FROM nginx:alpine AS runner

# Install curl for health checks and clean up default content
RUN apk add --no-cache curl && \
    rm -rf /usr/share/nginx/html/*

# Copy built static files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Set proper ownership and permissions for nginx
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    mkdir -p /var/run && \
    chown -R nginx:nginx /var/cache/nginx /var/run

# Expose port 8080 for HTTP traffic
EXPOSE 8080

# Health check for the frontend
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/ || exit 1

# Start nginx in foreground (required for Docker)
# Using 'daemon off' to keep the container running
CMD ["nginx", "-g", "daemon off;"]
