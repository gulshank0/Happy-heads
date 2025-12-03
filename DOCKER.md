# Docker Configuration for Happy-Heads

This document explains the Docker setup for the Happy-Heads full-stack application.

## 📁 File Structure

```plaintext
Happy-heads/
├── docker-compose.yml          # Base configuration
├── docker-compose.dev.yml      # Development overrides
├── docker-compose.prod.yml     # Production overrides
├── .env.example                # Environment template
├── Makefile                    # Convenient commands
├── Backend/
│   ├── Dockerfile              # Production build
│   ├── Dockerfile.dev          # Development build
│   └── .dockerignore
└── Frontend/
    ├── Dockerfile              # Production build (Nginx)
    ├── Dockerfile.dev          # Development build (Vite)
    ├── nginx.conf              # Nginx configuration
    └── .dockerignore
```

## 🚀 Quick Start

### Prerequisites

- Docker Engine 20.10+
- Docker Compose V2
- At least 4GB RAM available for Docker

### 1. Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your values
nano .env
```

### 2. Start Development Environment

```bash
# Using Make (recommended)
make dev

# Or using Docker Compose directly
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### 3. Start Production Environment

```bash
# Using Make
make prod

# Or using Docker Compose directly
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 🏗️ Architecture

```plaintext
                    ┌─────────────────────────────────────────┐
                    │              Docker Network             │
                    │          (happy-heads-network)          │
                    └─────────────────────────────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
        ▼                              ▼                              ▼
┌───────────────┐            ┌─────────────────┐            ┌─────────────────┐
│   Frontend    │            │     Backend     │            │    PostgreSQL   │
│   (Nginx)     │───────────▶│   (Node.js)     │───────────▶│    Database     │
│   Port: 80    │            │   Port: 8000    │            │   Port: 5432    │
└───────────────┘            └─────────────────┘            └─────────────────┘
        │                              │                              │
        │                              │                              ▼
        │                              │                    ┌─────────────────┐
        │                              └───────────────────▶│      Redis      │
        │                                                   │   Port: 6379    │
        │                                                   └─────────────────┘
        ▼
   HTTP/HTTPS
    Clients
```

## 📝 Service Details

### PostgreSQL Database

- **Image**: `postgres:16-alpine`
- **Port**: 5432 (exposed in dev, internal only in prod)
- **Volume**: `postgres_data` for persistence
- **Health Check**: `pg_isready` command

### Redis Cache

- **Image**: `redis:7-alpine`
- **Port**: 6379 (exposed in dev, internal only in prod)
- **Volume**: `redis_data` for persistence
- **Features**: AOF persistence, 256MB memory limit

### Backend API

- **Base Image**: `node:20-alpine`
- **Port**: 8000
- **Volume**: `uploads_data` for user uploads
- **Features**:
  - Multi-stage build for smaller image
  - Prisma ORM with PostgreSQL
  - WebSocket support
  - JWT authentication
  - Health check endpoint

### Frontend Web

- **Production**: Nginx serving static files
- **Development**: Vite dev server with HMR
- **Port**: 80 (prod) / 5173 (dev)
- **Features**:
  - API proxy to backend
  - WebSocket proxy for real-time
  - Gzip compression
  - Static asset caching

## 🔧 Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| Hot Reload | ✅ Yes | ❌ No |
| Debug Port | ✅ 9229 | ❌ No |
| Source Maps | ✅ Yes | ❌ No |
| Exposed Ports | All services | Frontend only |
| pgAdmin | ✅ Included | ❌ No |
| Redis Commander | ✅ Included | ❌ No |
| Resource Limits | ❌ No | ✅ Yes |
| Log Rotation | ❌ No | ✅ Yes |

## 🔐 Security Considerations

### Production Checklist

- [ ] Change all default passwords in `.env`
- [ ] Generate secure JWT_SECRET: `openssl rand -base64 32`
- [ ] Generate secure SESSION_SECRET: `openssl rand -base64 32`
- [ ] Configure HTTPS with SSL certificates
- [ ] Remove exposed database ports
- [ ] Enable rate limiting in nginx
- [ ] Set up log monitoring

### Environment Variables

Never commit `.env` files! Use Docker secrets or environment-specific configurations for production.

```bash
# Generate secure secrets
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For SESSION_SECRET
openssl rand -base64 24  # For POSTGRES_PASSWORD
```

## 📊 Useful Commands

```bash
# View container status
make status
docker compose ps

# View logs
make logs
docker compose logs -f

# Access container shells
make shell-backend
make shell-postgres

# Database operations
make db-migrate     # Run migrations
make db-studio      # Open Prisma Studio
make db-reset       # Reset database (caution!)

# Cleanup
make clean          # Remove containers and images
make clean-volumes  # Remove volumes (deletes data!)
```

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if postgres is healthy
docker compose ps postgres

# View postgres logs
docker compose logs postgres

# Test connection
docker compose exec postgres psql -U happyheads -d happyheads_db -c "SELECT 1"
```

### Backend Not Starting

```bash
# Check backend logs
docker compose logs backend

# Verify environment variables
docker compose exec backend env | grep DATABASE

# Manually run migrations
docker compose exec backend npx prisma migrate deploy
```

### Frontend Build Failures

```bash
# Rebuild without cache
docker compose build --no-cache frontend

# Check build logs
docker compose logs frontend
```

### Permission Issues with Uploads

```bash
# Fix upload directory permissions
docker compose exec backend chown -R 1001:1001 /app/uploads
```

## 🔄 Updating the Application

```bash
# Pull latest changes
git pull

# Rebuild and restart
make prod-build
# or
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Run any new migrations
make db-migrate
```

## 📈 Scaling (Advanced)

For horizontal scaling, consider:

1. Using Docker Swarm or Kubernetes
2. Adding a load balancer (Traefik, HAProxy)
3. Scaling backend replicas
4. Using Redis for session sharing across instances

```yaml
# Example scaling in docker-compose.prod.yml
services:
  backend:
    deploy:
      replicas: 3
```
