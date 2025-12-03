# Deployment Guide for Happy-Heads

## Quick Comparison

| Platform | Monthly Cost | Deploy Time | Best For |
|----------|-------------|-------------|----------|
| Railway | $5-20 | 5 min | Beginners, fast deploy |
| Render | Free-$25 | 10 min | Free tier, simplicity |
| VPS | $4-10 | 30 min | Full control, cheapest |

---

## Option 1: Railway (Recommended - Easiest)

Railway is the fastest way to deploy. It handles PostgreSQL, Redis, and auto-scaling.

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/happy-heads.git
git push -u origin main
```

### Step 2: Deploy on Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository

### Step 3: Add Services

In Railway dashboard, add these services:

#### PostgreSQL
- Click **"+ New"** → **"Database"** → **"PostgreSQL"**
- Railway auto-configures `DATABASE_URL`

#### Redis
- Click **"+ New"** → **"Database"** → **"Redis"**
- Railway auto-configures `REDIS_URL`

#### Backend
- Click **"+ New"** → **"GitHub Repo"** → Select repo
- Set **Root Directory**: `Backend`
- Add environment variables:
  ```
  PORT=8000
  NODE_ENV=production
  JWT_SECRET=<generate with: openssl rand -base64 32>
  SESSION_SECRET=<generate with: openssl rand -base64 32>
  FRONTEND_URL=https://your-frontend.railway.app
  BACKEND_URL=https://your-backend.railway.app
  GOOGLE_CLIENT_ID=your-google-client-id
  GOOGLE_CLIENT_SECRET=your-google-client-secret
  GOOGLE_CALLBACK_URL=https://your-backend.railway.app/auth/google/callback
  ```

#### Frontend
- Click **"+ New"** → **"GitHub Repo"** → Select repo
- Set **Root Directory**: `Frontend`
- Add build arguments:
  ```
  VITE_BACKEND_URL=https://your-backend.railway.app
  VITE_WS_URL=wss://your-backend.railway.app
  ```

### Step 4: Configure Domains
- Click on each service → **Settings** → **Generate Domain**
- Or add custom domain

### Step 5: Update Google OAuth
In [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
- Add Railway URLs to **Authorized JavaScript origins**
- Add callback URL to **Authorized redirect URIs**

---

## Option 2: Render (Free Tier Available)

### Step 1: Create render.yaml
```yaml
# render.yaml (create in project root)
services:
  - type: web
    name: happy-heads-backend
    env: docker
    dockerfilePath: ./Backend/Dockerfile
    dockerContext: ./Backend
    healthCheckPath: /health
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: happy-heads-db
          property: connectionString
      - key: NODE_ENV
        value: production
      # Add other env vars...

  - type: web
    name: happy-heads-frontend
    env: docker
    dockerfilePath: ./Frontend/Dockerfile
    dockerContext: ./Frontend

databases:
  - name: happy-heads-db
    plan: free
```

### Step 2: Deploy
1. Go to [render.com](https://render.com)
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub repo
4. Render will read `render.yaml` and deploy

---

## Option 3: VPS (DigitalOcean/Hetzner - Cheapest)

Best for: Full control, custom domains, lowest cost long-term.

### Step 1: Get a VPS

**DigitalOcean**: $4-6/mo
- [Create Droplet](https://www.digitalocean.com/products/droplets)
- Choose Ubuntu 24.04, Basic, $6/mo (1GB RAM)

**Hetzner**: €3.79/mo (cheapest)
- [Create Server](https://www.hetzner.com/cloud)
- Choose Ubuntu 24.04, CX11

### Step 2: Point Domain
Add these DNS records:
```
A    @      YOUR_SERVER_IP
A    www    YOUR_SERVER_IP
```

### Step 3: SSH into Server
```bash
ssh root@YOUR_SERVER_IP
```

### Step 4: Run Deployment Script
```bash
# Set your domain and email
export DOMAIN="yourdomain.com"
export EMAIL="your@email.com"
export REPO_URL="https://github.com/YOUR_USERNAME/Happy-heads.git"

# Download and run script
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/Happy-heads/main/deploy-vps.sh | bash
```

### Step 5: Configure SSL
```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com --email your@email.com
```

### Step 6: Update Google OAuth
Add your domain to Google Cloud Console credentials.

### Step 7: Edit Environment
```bash
cd /opt/happy-heads
nano .env
# Add your Google OAuth credentials
docker compose restart
```

---

## Post-Deployment Checklist

- [ ] Update Google OAuth URLs in Google Cloud Console
- [ ] Test Google Sign-in
- [ ] Test WebSocket connection (messaging)
- [ ] Upload test image (avatar/post)
- [ ] Set up monitoring (optional)

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection | `redis://host:6379` |
| `JWT_SECRET` | JWT signing key | 32+ char random string |
| `SESSION_SECRET` | Session encryption | 32+ char random string |
| `FRONTEND_URL` | Frontend URL | `https://yourdomain.com` |
| `BACKEND_URL` | Backend URL | `https://api.yourdomain.com` |
| `GOOGLE_CLIENT_ID` | Google OAuth ID | From Google Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | From Google Console |
| `GOOGLE_CALLBACK_URL` | OAuth callback | `https://api.domain.com/auth/google/callback` |

---

## Troubleshooting

### Backend won't start
```bash
docker compose logs backend
```

### Database connection issues
```bash
docker compose exec backend npx prisma migrate status
```

### SSL certificate issues
```bash
certbot renew --dry-run
```

### Check all services
```bash
docker compose ps
docker compose logs -f
```
