# JSMYADMIN Skill

<!-- caveman-compressed. human-readable backup: prompt.original.md -->

## Overview
phpMyAdmin-like DB admin tool. React + shadcn/ui frontend, Express.js backend. Supports MySQL, MariaDB, PostgreSQL.

## When to Use
Work on / ask about:
- DB management features
- SQL query exec / query builder
- Dump upload + import
- Auth + connection handling
- Frontend components/pages
- Backend API routes/services
- Docker deploy

## Project Structure
```
jsmyadmin/
├── client/                    # React + TypeScript + shadcn/ui
│   ├── src/
│   │   ├── components/ui/   # shadcn components (Button, Select, Table, etc.)
│   │   ├── components/layout/ # Sidebar, TopBar, MainLayout
│   │   ├── pages/           # LoginPage, DashboardPage, QueryPage, QueryBuilderPage, DumpPage
│   │   ├── stores/          # Zustand stores (authStore, databaseStore, queryStore)
│   │   ├── lib/            # API client, Socket client, utils
│   │   └── types/         # TypeScript interfaces
│   └── package.json
├── server/                    # Express + TypeScript
│   ├── src/
│   │   ├── routes/         # auth, database, query, table, upload routes
│   │   ├── db/           # Connection manager for MySQL/MariaDB/PostgreSQL
│   │   ├── middleware/    # Auth JWT, error handler
│   │   ├── socket/       # WebSocket handlers for progress
│   │   └── types/
│   └── package.json
├── docker-compose.yml
└── Dockerfile
```

## Key Tech
- Frontend: React 18, TypeScript, shadcn/ui, Tailwind, Zustand, Socket.io Client
- Backend: Express.js, TypeScript, mysql2, pg, mariadb, Multer, Socket.io
- State: Zustand (client), JWT (server)
- Progress: WebSocket via Socket.io

## Common Tasks

### 1. Add API Route
1. Add route to `server/src/routes/` w/ auth middleware
2. Add controller logic
3. Add frontend API fn in `client/src/lib/api.ts`

### 2. Add Page
1. Create component in `client/src/pages/`
2. Add route in `client/src/App.tsx`
3. Add nav link in `client/src/components/layout/Sidebar.tsx`

### 3. Add shadcn Component
```bash
cd client
npx shadcn-ui@latest add [component-name]
```

### 4. Run Dev
```bash
# Start both client and server
npm run dev

# Or separately:
npm run dev:client  # Frontend on port 5173
npm run dev:server  # Backend on port 3000
```

### 5. Build Prod
```bash
npm run build        # Build both
npm run build:client  # Frontend only
npm run build:server # Backend only
```

### 6. Docker Deploy
```bash
docker build -t jsmyadmin .
docker run -p 3000:3000 -e JWT_SECRET=your-secret jsmyadmin
```

## Code Conventions
- Backend: TypeScript CommonJS. Routes in `routes/`. DB drivers in `db/`.
- Frontend: React functional components, Tailwind, shadcn.
- State: Zustand stores, localStorage persist for auth.
- API: Axios w/ JWT interceptor. Responses use `.data`.

## Important Files
- `server/src/db/connection-manager.ts` — DB connection handling
- `server/src/routes/auth.routes.ts` — auth flow
- `client/src/stores/authStore.ts` — auth state
- `client/src/lib/api.ts` — API client config

## DB Support
- MySQL: mysql2
- MariaDB: mariadb
- PostgreSQL: pg

## WebSocket Events
- `upload:progress` — upload progress
- `import:progress` — import progress
- `upload:start` — start upload
- `import:start` — start import

## Testing
Run dev server:
```bash
npm run dev
```
Access http://localhost:5173 (client), backend http://localhost:3000
