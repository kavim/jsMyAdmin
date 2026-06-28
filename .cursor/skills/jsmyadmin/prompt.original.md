# JSMYADMIN Skill

## Overview
This skill provides specialized instructions for working with the JSMYADMIN project - a phpMyAdmin-like database administration tool built with React + shadcn/ui frontend and Express.js backend, supporting MySQL, MariaDB, and PostgreSQL.

## When to Use
Use this skill when working on or asking about:
- Database management features
- SQL query execution or the query builder
- Dump file upload and import functionality
- Authentication and connection handling
- Frontend components and pages
- Backend API routes and services
- Docker deployment

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

## Key Technologies
- **Frontend:** React 18, TypeScript, shadcn/ui, Tailwind CSS, Zustand, Socket.io Client
- **Backend:** Express.js, TypeScript, mysql2, pg, mariadb, Multer, Socket.io
- **State Management:** Zustand (client), JWT tokens (server)
- **Progress Updates:** WebSocket via Socket.io

## Common Tasks

### 1. Adding a New API Route
1. Add route to `server/src/routes/` with authentication middleware
2. Add controller logic
3. Add frontend API function in `client/src/lib/api.ts`

### 2. Adding a New Page
1. Create component in `client/src/pages/`
2. Add route in `client/src/App.tsx`
3. Add navigation link in `client/src/components/layout/Sidebar.tsx`

### 3. Adding a New shadcn Component
```bash
cd client
npx shadcn-ui@latest add [component-name]
```

### 4. Running Development
```bash
# Start both client and server
npm run dev

# Or separately:
npm run dev:client  # Frontend on port 5173
npm run dev:server  # Backend on port 3000
```

### 5. Building for Production
```bash
npm run build        # Build both
npm run build:client  # Frontend only
npm run build:server # Backend only
```

### 6. Docker Deployment
```bash
docker build -t jsmyadmin .
docker run -p 3000:3000 -e JWT_SECRET=your-secret jsmyadmin
```

## Code Conventions
- **Backend:** TypeScript with CommonJS, Express routes in `routes/`, DB drivers in `db/`
- **Frontend:** React functional components, Tailwind CSS, shadcn components
- **State:** Zustand stores with localStorage persistence for auth
- **API:** Axios with JWT interceptor, responses use `.data` property

## Important Files
- `server/src/db/connection-manager.ts` - Database connection handling
- `server/src/routes/auth.routes.ts` - Authentication flow
- `client/src/stores/authStore.ts` - Auth state management
- `client/src/lib/api.ts` - API client configuration

## Database Support
- **MySQL:** mysql2 package
- **MariaDB:** mariadb package  
- **PostgreSQL:** pg package

## WebSocket Events
- `upload:progress` - Upload progress updates
- `import:progress` - Import progress updates
- `upload:start` - Start upload
- `import:start` - Start import

## Testing
Run development server:
```bash
npm run dev
```

Access at http://localhost:5173 (client) with backend at http://localhost:3000