# Elendra (JSMYADMIN) — AI Agent Entry Point

> Start here. This file is optimized for Cursor Agent context.

## What is this project?

phpMyAdmin-like database admin tool. React + Express monorepo. MySQL, MariaDB, PostgreSQL.

## Spec Driven Development (SDD)

**Always follow SDD for features and refactors.**

```
Before code → Read STATE.md + feature spec
After code  → Update memory (skill: update-memory)
```

| Resource | Path |
|----------|------|
| Master spec | `SPEC.md` |
| Feature specs | `docs/specs/features/` |
| Implementation state | `docs/memory/STATE.md` |
| Decisions (ADR) | `docs/memory/DECISIONS.md` |
| Code patterns | `docs/memory/PATTERNS.md` |
| SDD workflow | `.cursor/skills/spec-driven-dev/SKILL.md` |

## Stack

- **Client:** React 18, TS, shadcn/ui, Tailwind, Zustand, Socket.io, Axios — `:5173`
- **Server:** Express, TS, mysql2/pg/mariadb, Multer, Socket.io, JWT — `:3000`
- **Infra:** Docker, docker-compose

## Layout

```
client/src/ → components/, pages/, stores/, lib/, types/
server/src/ → routes/, db/, middleware/, socket/, types/
docs/       → specs/, memory/
.cursor/    → rules/, skills/
```

## Key paths

- `server/src/db/connection-manager.ts` — multi-DB connections
- `server/src/routes/auth.routes.ts` — JWT auth
- `client/src/stores/authStore.ts` — auth state (localStorage)
- `client/src/lib/api.ts` — Axios + JWT interceptor

## Cursor rules (auto-applied)

| Rule | Scope |
|------|-------|
| `spec-driven.mdc` | SDD workflow — always |
| `elendra-core.mdc` | Project conventions — always |
| `memory-evolution.mdc` | When to update memory — always |
| `client-react.mdc` | `client/**/*.{ts,tsx}` |
| `server-express.mdc` | `server/**/*.{ts,js}` |

## Skills

| Skill | When |
|-------|------|
| `spec-driven-dev` | New feature, planning, writing specs |
| `update-memory` | After completing work |
| `jsmyadmin` | Domain-specific DB admin tasks |

## Commands

```bash
npm run dev          # client + server
npm run dev:client   # :5173
npm run dev:server   # :3000
npm run build
docker build -t jsmyadmin .
```

## Conventions

- API responses: `{ data: ... }`
- New page: `pages/` → `App.tsx` → `Sidebar.tsx`
- New API: `server/routes/` + auth → `client/lib/api.ts`
- shadcn: `cd client && npx shadcn-ui@latest add [name]`

## Quick start for AI

**Bug fix:** Read relevant code + PATTERNS.md → fix → update STATE if behavior changed.

**New feature:**
1. Read `docs/memory/STATE.md`
2. Skill `spec-driven-dev` → create `docs/specs/features/<name>.md`
3. User approves spec
4. Implement per spec + rules
5. Skill `update-memory`

**Refactor:** Check DECISIONS.md for constraints. Spec if scope > 3 files.
