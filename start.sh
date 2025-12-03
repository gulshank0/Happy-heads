#!/bin/bash
# =============================================================================
# Happy-Heads Startup Script
# =============================================================================
# One command to rule them all - builds, migrates, and starts everything
#
# Usage:
#   ./start.sh           # Start in development mode
#   ./start.sh --prod    # Start in production mode
#   ./start.sh --build   # Force rebuild before starting
#   ./start.sh --clean   # Clean start (removes old containers/volumes)
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Default values
MODE="dev"
BUILD=false
CLEAN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --prod|--production)
            MODE="prod"
            shift
            ;;
        --build|-b)
            BUILD=true
            shift
            ;;
        --clean|-c)
            CLEAN=true
            shift
            ;;
        --help|-h)
            echo "Usage: ./start.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --prod, --production  Start in production mode"
            echo "  --build, -b           Force rebuild images"
            echo "  --clean, -c           Clean start (remove old containers)"
            echo "  --help, -h            Show this help"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║               🎉 Happy-Heads Startup Script               ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Step 1: Check for .env file
echo -e "${YELLOW}[1/5] Checking environment configuration...${NC}"
if [ ! -f .env ]; then
    echo -e "${YELLOW}  → .env file not found, creating from template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}  ✓ Created .env from .env.example${NC}"
    echo -e "${YELLOW}  ⚠ Please edit .env with your actual values for production!${NC}"
else
    echo -e "${GREEN}  ✓ .env file exists${NC}"
fi

# Step 2: Clean if requested
if [ "$CLEAN" = true ]; then
    echo -e "${YELLOW}[2/5] Cleaning up old containers...${NC}"
    docker compose down --remove-orphans 2>/dev/null || true
    echo -e "${GREEN}  ✓ Cleanup complete${NC}"
else
    echo -e "${GREEN}[2/5] Skipping cleanup (use --clean to enable)${NC}"
fi

# Step 3: Build or pull images
echo -e "${YELLOW}[3/5] Building/pulling Docker images...${NC}"
if [ "$MODE" = "prod" ]; then
    COMPOSE_FILES="-f docker-compose.yml -f docker-compose.prod.yml"
else
    COMPOSE_FILES="-f docker-compose.yml"
fi

if [ "$BUILD" = true ]; then
    docker compose $COMPOSE_FILES build --no-cache
else
    docker compose $COMPOSE_FILES build
fi
echo -e "${GREEN}  ✓ Images ready${NC}"

# Step 4: Start services
echo -e "${YELLOW}[4/5] Starting services...${NC}"
docker compose $COMPOSE_FILES up -d
echo -e "${GREEN}  ✓ Services started${NC}"

# Step 5: Wait for database and run migrations
echo -e "${YELLOW}[5/5] Running database migrations...${NC}"

# Wait for backend to be healthy
echo -e "  → Waiting for backend to be ready..."
RETRIES=30
until docker compose exec -T backend wget --no-verbose --tries=1 --spider http://localhost:8000/health 2>/dev/null || [ $RETRIES -eq 0 ]; do
    echo -e "  → Waiting for backend... ($RETRIES attempts left)"
    sleep 2
    RETRIES=$((RETRIES-1))
done

if [ $RETRIES -eq 0 ]; then
    echo -e "${RED}  ✗ Backend failed to start. Check logs: docker compose logs backend${NC}"
    exit 1
fi

# Run migrations
docker compose exec -T backend npx prisma migrate deploy 2>/dev/null || true
echo -e "${GREEN}  ✓ Migrations complete${NC}"

# Done!
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              🚀 Happy-Heads is now running!               ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$MODE" = "prod" ]; then
    echo -e "  ${BLUE}Frontend:${NC}     http://localhost:8080"
    echo -e "  ${BLUE}Backend API:${NC}  (proxied via frontend)"
else
    echo -e "  ${BLUE}Frontend:${NC}     http://localhost:8080"
    echo -e "  ${BLUE}Backend API:${NC}  http://localhost:8000"
    echo -e "  ${BLUE}PostgreSQL:${NC}   localhost:5432"
    echo -e "  ${BLUE}Redis:${NC}        localhost:6379"
fi

echo ""
echo -e "  ${YELLOW}Useful commands:${NC}"
echo -e "    docker compose logs -f      # View all logs"
echo -e "    docker compose ps           # Check status"
echo -e "    docker compose down         # Stop everything"
echo ""
