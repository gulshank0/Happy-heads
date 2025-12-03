#!/bin/bash
# =============================================================================
# VPS Deployment Script for Happy-Heads
# =============================================================================
# Run this on a fresh Ubuntu 22.04/24.04 VPS
# 
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/YOUR_REPO/main/deploy-vps.sh | bash
#   or
#   wget -O - https://raw.githubusercontent.com/YOUR_REPO/main/deploy-vps.sh | bash
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║          Happy-Heads VPS Deployment Script                ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Configuration - CHANGE THESE!
DOMAIN=${DOMAIN:-"your-domain.com"}
EMAIL=${EMAIL:-"your-email@example.com"}
APP_DIR="/opt/happy-heads"
REPO_URL=${REPO_URL:-"https://github.com/YOUR_USERNAME/Happy-heads.git"}

echo -e "${YELLOW}[1/7] Updating system...${NC}"
apt update && apt upgrade -y

echo -e "${YELLOW}[2/7] Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# Install Docker Compose plugin
apt install -y docker-compose-plugin

echo -e "${YELLOW}[3/7] Installing Nginx and Certbot...${NC}"
apt install -y nginx certbot python3-certbot-nginx

echo -e "${YELLOW}[4/7] Cloning repository...${NC}"
if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR"
    git pull
else
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

echo -e "${YELLOW}[5/7] Setting up environment...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    
    # Generate secure secrets
    JWT_SECRET=$(openssl rand -base64 32)
    SESSION_SECRET=$(openssl rand -base64 32)
    POSTGRES_PASSWORD=$(openssl rand -base64 24)
    
    # Update .env with secure values
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" .env
    sed -i "s|SESSION_SECRET=.*|SESSION_SECRET=$SESSION_SECRET|g" .env
    sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|g" .env
    sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://$DOMAIN|g" .env
    sed -i "s|BACKEND_URL=.*|BACKEND_URL=https://$DOMAIN|g" .env
    sed -i "s|VITE_BACKEND_URL=.*|VITE_BACKEND_URL=https://$DOMAIN|g" .env
    sed -i "s|VITE_WS_URL=.*|VITE_WS_URL=wss://$DOMAIN|g" .env
    sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=https://$DOMAIN|g" .env
    sed -i "s|GOOGLE_CALLBACK_URL=.*|GOOGLE_CALLBACK_URL=https://$DOMAIN/auth/google/callback|g" .env
    
    echo -e "${YELLOW}⚠ Please edit .env with your Google OAuth credentials!${NC}"
    echo -e "${YELLOW}  nano $APP_DIR/.env${NC}"
fi

echo -e "${YELLOW}[6/7] Setting up Nginx reverse proxy...${NC}"
cat > /etc/nginx/sites-available/happy-heads << EOF
# Happy-Heads Nginx Configuration
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect HTTP to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL certificates (will be added by certbot)
    # ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Frontend (static files)
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Auth routes
    location /auth/ {
        proxy_pass http://127.0.0.1:8000/auth/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # WebSocket
    location /ws {
        proxy_pass http://127.0.0.1:8000/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;
    }
    
    # Uploads
    location /uploads/ {
        proxy_pass http://127.0.0.1:8000/uploads/;
        proxy_http_version 1.1;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
    
    # File upload size
    client_max_body_size 10M;
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/happy-heads /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t

echo -e "${YELLOW}[7/7] Starting application...${NC}"
cd "$APP_DIR"
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Restart nginx
systemctl restart nginx

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              🚀 Deployment Complete!                       ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. Point your domain DNS to this server's IP"
echo -e "  2. Run SSL setup: ${YELLOW}certbot --nginx -d $DOMAIN -d www.$DOMAIN --email $EMAIL${NC}"
echo -e "  3. Edit Google OAuth: ${YELLOW}nano $APP_DIR/.env${NC}"
echo -e "  4. Restart app: ${YELLOW}cd $APP_DIR && docker compose restart${NC}"
echo ""
echo -e "Your app will be available at: ${BLUE}https://$DOMAIN${NC}"
echo ""
