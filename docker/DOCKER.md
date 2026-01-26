# Docker Configuration for Happy-Heads

Complete Docker setup to run the full-stack application (Frontend + Backend + PostgreSQL + Redis).

## Quick Start

### From docker/ directory:

```bash
cd docker

# Development (with hot-reload)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

# Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### From project root:

```bash
make dev        # Development environment
make prod       # Production environment
make logs       # View logs
make down       # Stop all containers
```

## Services

| Service         | Dev Port | Prod Port | Description                |
| --------------- | -------- | --------- | -------------------------- |
| Frontend        | 5173     | 80/443    | React/Vite (Nginx in prod) |
| Backend         | 8000     | internal  | Node.js/Express API        |
| PostgreSQL      | 5432     | internal  | Database                   |
| Redis           | 6379     | internal  | Cache/Sessions             |
| pgAdmin         | 5050     | N/A       | DB Admin (dev only)        |
| Redis Commander | 8081     | N/A       | Redis UI (dev only)        |

## File Structure

```
Happy-heads/
├── docker/
│   ├── docker-compose.yml      # Base configuration
│   ├── docker-compose.dev.yml  # Development overrides
│   ├── docker-compose.prod.yml # Production overrides
│   └── DOCKER.md
├── Backend/
│   ├── Dockerfile              # Production build
│   └── Dockerfile.dev          # Development build
├── Frontend/
│   ├── Dockerfile              # Production build
│   └── Dockerfile.dev          # Development build
├── .env.example                # Environment template
└── Makefile                    # Helper commands
```

## Environment Setup

1. Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

2. Generate secure secrets for production:

```bash
openssl rand -base64 32  # JWT_SECRET
openssl rand -base64 32  # SESSION_SECRET
```

## Common Commands

```bash
# View container status
docker compose ps

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Access container shell
docker compose exec backend sh
docker compose exec frontend sh

# Database operations
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma studio

# Full cleanup
docker compose down -v --rmi all
```

## Troubleshooting

**Backend won't start:**

```bash
docker compose logs backend
docker compose exec backend npx prisma migrate deploy
```

**Database connection failed:**

```bash
docker compose ps postgres
docker compose exec postgres psql -U happyheads -d happyheads_db -c "SELECT 1"
```

**Rebuild from scratch:**

```bash
docker compose down -v
docker compose up -d --build
```
