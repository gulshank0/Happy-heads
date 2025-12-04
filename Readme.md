# Happy Heads 🎓💕

A modern social matching platform for college students — connect, match, and chat with peers based on shared interests, personality, and preferences.

## ✨ Features

- **Smart Matching** — Algorithm-based matching using interests, personality traits, and preferences
- **Real-time Chat** — WebSocket-powered instant messaging with typing indicators
- **Social Feed** — Create and share posts, like, and comment
- **User Profiles** — Customizable profiles with avatars and detailed preferences
- **Notifications** — Real-time notifications for likes, matches, and messages
- **OAuth Login** — Google authentication support

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Radix UI, React Query, Framer Motion |
| **Backend** | Node.js, Express 5, TypeScript, Prisma ORM, WebSockets |
| **Database** | PostgreSQL, Redis (sessions/caching) |
| **Infrastructure** | Docker, Nginx, pnpm |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 16+
- pnpm (Frontend) / npm (Backend)

### Development (Docker)


```bash
# Start all services
make dev

# View logs
make logs
```

**Access:**

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`

### Manual Setup

**Backend:**

```bash
cd Backend
npm install
cp .env.example .env  # Configure DATABASE_URL, JWT_SECRET
npx prisma migrate deploy
npx prisma generate
npm run dev
```

**Frontend:**

```bash
cd Frontend
pnpm install
pnpm dev
```

## 📁 Project Structure

```text
├── Backend/
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── services/       # Business logic (matching, websocket)
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Auth, CORS, validation
│   │   └── websocket/      # Real-time messaging
│   └── prisma/             # Database schema & migrations
│
├── Frontend/
│   └── src/
│       ├── components/     # UI components (Matching, Messenger, Posts, etc.)
│       ├── pages/          # Route pages
│       ├── services/       # API calls
│       └── hooks/          # Custom React hooks
│
├── docker-compose.yml      # Docker orchestration
└── Makefile                # Development shortcuts
```

## 🔧 Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `CORS_ORIGIN` | Frontend URL for CORS |

## 📜 Available Scripts

```bash
make dev           # Start dev environment
make prod          # Start production
make logs          # View container logs
make db-studio     # Open Prisma Studio
make db-migrate    # Run migrations
make down          # Stop all services
```

## 📄 License

MIT
