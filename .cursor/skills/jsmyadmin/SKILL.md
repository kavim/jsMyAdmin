---
name: jsmyadmin
description: Domain knowledge for JSMYADMIN/Elendra database admin tool. Use when working on SQL queries, database connections, dump upload/import, query builder, auth, API routes, React pages, or Docker deployment for this project.
---

# JSMYADMIN / Elendra

phpMyAdmin-like DB admin. React + shadcn/ui + Express. MySQL, MariaDB, PostgreSQL.

## Quick reference

| Area | Key path |
|------|----------|
| DB connections | `server/src/db/connection-manager.ts` |
| Auth | `server/src/routes/auth.routes.ts`, `client/src/stores/authStore.ts` |
| API client | `client/src/lib/api.ts` |
| Socket progress | `client/src/lib/socket.ts`, `server/src/socket/socket-handler.ts` |
| Query UI | `client/src/components/query/` |
| Pages | `client/src/pages/` |

## API endpoints

- Auth: `POST /api/auth/login|logout`, `GET /api/auth/verify`
- DB: `GET /api/databases`, `.../tables`, `.../columns`
- Query: `POST /api/query/execute`
- Upload: `POST /api/upload`, `GET .../progress/:fileId`, `POST .../import`

## WebSocket events

`upload:start|progress|complete`, `import:start|progress`

## Common tasks

### Add API route
1. Route in `server/src/routes/` + auth middleware
2. Register in `server/src/app.ts`
3. Client fn in `client/src/lib/api.ts`

### Add page
1. `client/src/pages/NewPage.tsx`
2. Route in `App.tsx`
3. Link in `Sidebar.tsx`

### Add shadcn component
```bash
cd client && npx shadcn-ui@latest add [name]
```

## SDD integration

Before new features → read `docs/memory/STATE.md` and create feature spec via `spec-driven-dev` skill.
After completion → `update-memory` skill.

## Extended docs

Full project skill backup: [prompt.md](prompt.md)
