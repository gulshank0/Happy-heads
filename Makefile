# =============================================================================
# Makefile for Happy-Heads Docker Operations
# =============================================================================
# Convenient shortcuts for common Docker operations
#
# Usage:
#   make help          - Show all available commands
#   make dev           - Start development environment
#   make prod          - Start production environment
#   make logs          - View all container logs
#   make down          - Stop all containers
# =============================================================================

.PHONY: help build dev prod down logs clean restart status db-migrate db-studio shell-backend shell-frontend

# Default target
help:
	@echo "Happy-Heads Docker Management Commands"
	@echo "======================================="
	@echo ""
	@echo "Development:"
	@echo "  make dev              - Start development environment with hot-reload"
	@echo "  make dev-build        - Rebuild and start development environment"
	@echo ""
	@echo "Production:"
	@echo "  make prod             - Start production environment"
	@echo "  make prod-build       - Rebuild and start production environment"
	@echo ""
	@echo "General:"
	@echo "  make build            - Build all Docker images"
	@echo "  make down             - Stop all containers"
	@echo "  make restart          - Restart all containers"
	@echo "  make status           - Show container status"
	@echo "  make logs             - View all container logs"
	@echo "  make logs-backend     - View backend logs"
	@echo "  make logs-frontend    - View frontend logs"
	@echo ""
	@echo "Database:"
	@echo "  make db-migrate       - Run Prisma migrations"
	@echo "  make db-studio        - Open Prisma Studio"
	@echo "  make db-reset         - Reset database (WARNING: deletes data!)"
	@echo ""
	@echo "Shell Access:"
	@echo "  make shell-backend    - Open shell in backend container"
	@echo "  make shell-frontend   - Open shell in frontend container"
	@echo "  make shell-postgres   - Open psql in postgres container"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean            - Remove all containers and images"
	@echo "  make clean-volumes    - Remove all volumes (WARNING: deletes data!)"
	@echo "  make prune            - Docker system prune"

# =============================================================================
# Build Commands
# =============================================================================

# Build all images
build:
	docker compose build

# Build without cache
build-no-cache:
	docker compose build --no-cache

# =============================================================================
# Development Commands
# =============================================================================

# Start development environment
dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
	@echo ""
	@echo "Development environment started!"
	@echo "================================"
	@echo "Frontend:     http://localhost:5173"
	@echo "Backend:      http://localhost:8000"
	@echo "pgAdmin:      http://localhost:5050"
	@echo "Redis Cmdr:   http://localhost:8081"
	@echo ""
	@echo "Run 'make logs' to view logs"

# Build and start development
dev-build:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

# =============================================================================
# Production Commands
# =============================================================================

# Start production environment
prod:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
	@echo ""
	@echo "Production environment started!"
	@echo "================================"
	@echo "Frontend:     http://localhost:80"
	@echo ""

# Build and start production
prod-build:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# =============================================================================
# Container Management
# =============================================================================

# Stop all containers
down:
	docker compose down

# Stop and remove volumes (WARNING: deletes data!)
down-volumes:
	docker compose down -v

# Restart all containers
restart:
	docker compose restart

# Show container status
status:
	docker compose ps

# =============================================================================
# Logging Commands
# =============================================================================

# View all logs
logs:
	docker compose logs -f

# View backend logs
logs-backend:
	docker compose logs -f backend

# View frontend logs
logs-frontend:
	docker compose logs -f frontend

# View database logs
logs-db:
	docker compose logs -f postgres

# =============================================================================
# Database Commands
# =============================================================================

# Run Prisma migrations
db-migrate:
	docker compose exec backend npx prisma migrate deploy

# Generate Prisma client
db-generate:
	docker compose exec backend npx prisma generate

# Open Prisma Studio
db-studio:
	docker compose exec backend npx prisma studio

# Reset database (WARNING: deletes all data!)
db-reset:
	@echo "WARNING: This will delete all data in the database!"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] && \
		docker compose exec backend npx prisma migrate reset --force

# Push schema to database (development only)
db-push:
	docker compose exec backend npx prisma db push

# =============================================================================
# Shell Access
# =============================================================================

# Open shell in backend container
shell-backend:
	docker compose exec backend sh

# Open shell in frontend container
shell-frontend:
	docker compose exec frontend sh

# Open psql in postgres container
shell-postgres:
	docker compose exec postgres psql -U happyheads -d happyheads_db

# Open Redis CLI
shell-redis:
	docker compose exec redis redis-cli

# =============================================================================
# Cleanup Commands
# =============================================================================

# Remove all containers and images
clean:
	docker compose down --rmi all --remove-orphans

# Remove all volumes (WARNING: deletes data!)
clean-volumes:
	docker compose down -v --remove-orphans

# Docker system prune
prune:
	docker system prune -f

# Full cleanup (WARNING: removes everything!)
clean-all:
	docker compose down -v --rmi all --remove-orphans
	docker system prune -af --volumes
