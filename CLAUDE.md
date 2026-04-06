# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack & Architecture

**Frontend**: React 19 + TypeScript + Vite 8 + PWA (vite-plugin-pwa)
- State: Dexie.js (IndexedDB) with `dexie-react-hooks` for reactive queries
- Sync: Socket.io client with custom sync engine
- UI: Feature-based structure under `client/src/features/`

**Backend**: Node.js + Express + Socket.io
- Database: PostgreSQL
- Auth: JWT (access token 15 min, refresh token 30 days)
- Sync: Incremental sync with `sync_events` table, Last-Write-Wins conflict resolution

**Key Patterns**:
- Offline-first: Client uses IndexedDB, changes queued for sync when online
- Real-time: Socket.io rooms per couple ID for instant sync
- Data isolation: `coupleGuard` middleware ensures users only access their couple's data

## Project Structure

```
/d/wedding-planner/
├── client/               # React PWA frontend
│   ├── src/
│   │   ├── db/          # Dexie database definitions (index.ts)
│   │   ├── sync/        # Sync client implementation
│   │   ├── hooks/       # Custom React hooks (useSync, useLiveQuery wrappers)
│   │   ├── features/    # Feature modules (auth, tasks, calendar, budget, guests, etc.)
│   │   ├── lib/         # API client, utilities
│   │   └── App.tsx      # Main app with auth state management
│   ├── vite.config.ts   # Vite + PWA config
│   └── dist/            # Production build
└── server/              # Node.js backend
    └── src/
        ├── server.js          # Entry point, Express + Socket.io setup
        ├── routes/            # API routes (auth.js, couple.js, sync.js)
        ├── middleware/        # auth.js, coupleGuard.js
        ├── db/                # schema.sql, migrations
        ├── services/          # tokenService.js
        └── sockets/           # syncHandler.js (WebSocket real-time)
```

## Common Development Commands

### Frontend (client/)
```bash
cd client

# Install dependencies
npm install

# Development server (hot reload)
npm run dev

# Build for production
npm run build

# TypeScript type check
npm run build  # uses tsc -b

# Lint code
npm run lint

# Preview production build locally
npm run preview
```

### Backend (server/)
```bash
cd server

# Install dependencies
npm install

# Development server with hot reload
npm run dev

# Production start
npm start

# Run database migrations
npm run db:migrate
```

### Database Setup (PostgreSQL 12+ required)
```bash
# Start PostgreSQL via Docker (recommended)
docker run -d \
  --name wedding-db \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=wedding_planner \
  postgres:15

# Initialize schema
cd server
psql -U postgres -d wedding_planner -f src/db/schema.sql
```

## Environment Configuration

**Backend** (server/.env):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_ACCESS_SECRET` - Secret for access tokens (15 min)
- `JWT_REFRESH_SECRET` - Secret for refresh tokens (30 days)
- `NODE_ENV` - development/production
- `PORT` - Server port (default 3000)
- `FRONTEND_URL` - CORS origin (default http://localhost:5173)

**Frontend** (optional):
- `VITE_API_URL` - Override API base URL (defaults to http://localhost:3000/api)

A `.env.example` is provided in both projects.

## Testing Workflow

### Manual Testing Checklist
1. Register two users (Alice & Bob)
2. Alice logs in → generates invite code
3. Bob uses invite code → couple becomes active
4. Alice creates task → Bob receives real-time update (WebSocket)
5. Disconnect Bob's network, create task, reconnect → verify auto-sync

### Automated Tests
No test framework configured yet. Consider:
- Frontend: Vitest + React Testing Library
- Backend: Jest + Supertest

## Key Architecture Concepts

### Sync Mechanism
- **Database**: Client uses Dexie IndexedDB; server uses PostgreSQL
- **Protocol**: REST for bulk sync + WebSocket for real-time events
- **Conflict Resolution**: Last-Write-Wins based on client `updatedAt` timestamp
- **Offline Support**: Client queues changes; on reconnect, client pushes queued changes then fetches server updates
- **Tables**: All data tables include `updatedAt` (timestamp) and `_deleted` (soft delete)

### Data Flow
1. Client mutation → Update IndexedDB → Queue for sync → Emit to server
2. Server receives → DB update → Broadcast to other client in couple room
3. Other client receives WebSocket event → Update IndexedDB → UI auto-updates via useLiveQuery

### Authentication Flow
- Register creates user + pending couple
- Login returns access token + refresh token
- Access token contains `sub` (userId) and `coupleId`
- Socket.io handshake requires access token in `auth.token`
- Couple pairing: one user generates invite code (`POST /api/couple/invite`), other joins (`POST /api/couple/join`)

## Important Files

### Backend
- `server/src/server.js` - Express + Socket.io setup, middleware wiring
- `server/src/routes/auth.js` - Register, login, token refresh
- `server/src/routes/couple.js` - Invite code generation/join
- `server/src/routes/sync.js` - Incremental sync API (`GET/POST /api/couple/:id/sync`)
- `server/src/sockets/syncHandler.js` - Real-time broadcast logic
- `server/src/middleware/coupleGuard.js` - Ensures couple data isolation
- `server/src/db/schema.sql` - PostgreSQL schema

### Frontend
- `client/src/db/index.ts` - All Dexie data models and table definitions
- `client/src/App.tsx` - Auth state, route guard, sync initialization
- `client/src/features/tasks/` - Task management implementation (complete reference)
- `client/src/features/calendar/` - Calendar with task deadline display
- `client/src/lib/api.ts` - Axios/fetch wrapper with auth headers
- `client/vite.config.ts` - PWA configuration

## Deployment Notes

### Frontend
- Build: `cd client && npm run build` → outputs to `client/dist/`
- Deploy `dist/` to Vercel, Netlify, or any static host
- PWA manifest auto-generated by vite-plugin-pwa

### Backend
- Deploy to Railway, Render, or any Node.js host
- Required: PostgreSQL database, environment variables set
- Ensure Redis not needed (in-memory Socket.io rooms)
- Command: `npm start` (production) or `npm run dev` (development)

## Development Phases (Roadmap)

- ✅ **Phase 0**: Infrastructure + Sync Engine (complete)
- ✅ **Phase 1**: Task Management + Calendar (complete)
- ⏳ **Phase 2**: Budget, Guests, Seating (in progress)
- ⏳ **Phase 3**: Mood Tracker + Memories
- ⏳ **Phase 4**: Import/Export, Notifications, Reports

Feature modules mirror structure under `client/src/features/`.

## Miscellaneous

- All timestamps: Unix timestamps (milliseconds) for consistency across clients
- Soft deletes: `_deleted` boolean, filtered out in queries
- IDs: Client-generated UUIDs (no DB auto-increment on client)
- React 19 features: `use` for async data loading (where applicable)
- PWA: Works offline, cached assets, can be installed on mobile

## Git Workflow

- Main branch: `main`
- Commit style: Conventional Commits recommended (feat, fix, chore)
- No pull request template yet
