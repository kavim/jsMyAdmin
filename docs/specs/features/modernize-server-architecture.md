# Feature Spec: Modernização Server Architecture

> **Status:** draft
> **Created:** 2026-06-18
> **Updated:** 2026-06-18
> **Author:** AI-assisted

## Problem

Server is 100% TypeScript but architecture is flat (routes-only). Type safety undermined by `any` casts. SQL built via string concat in table routes. API responses inconsistent with `{ data }` convention. Auth gaps on `/verify` and `/logout`. No structured logging or tests.

## Scope

### In scope
- Split `controllers/` + `services/` layer
- Typed `req.connectionId` (remove `as any`)
- Parameterized SQL in table CRUD routes
- Consistent `{ data: T }` API wrapper
- Zod validation on all routes
- Fix auth middleware on verify/logout
- Structured logger (pino)
- ESLint + tests for server

### Out of scope
- New product features (export, import page backend)
- Database schema migrations
- Refresh token flow

## User stories

- Como maintainer, quero camada service para testar lógica sem HTTP
- Como dev, quero SQL parametrizado para reduzir risco de injection
- Como client, quero respostas API consistentes `{ data }`

## Technical design

### Layer structure

```
routes/*.routes.ts  → thin: parse req, call controller
controllers/*.ts    → HTTP orchestration, status codes
services/*.ts       → business logic, DB calls via connection-manager
```

### API changes

Wrap all responses:

```typescript
res.json({ data: result });
```

Align client hooks to read `response.data.data` (breaking change — coordinate with client update).

### Security

- Parameterized queries for table CRUD
- Zod schemas per endpoint
- `authMiddleware` on all protected routes including verify/logout

## Files affected

```
server/src/controllers/*
server/src/services/*
server/src/routes/*.routes.ts
server/src/middleware/auth.ts
server/src/types/express.d.ts
server/eslint.config.js
server/package.json
docs/memory/STATE.md
docs/memory/DECISIONS.md
```

## Acceptance criteria

- [ ] All routes return `{ data }` wrapper
- [ ] Zero `(req as any).connectionId` in server
- [ ] Table CRUD uses parameterized SQL
- [ ] Zod on every route handler input
- [ ] `npm run lint` server passes
- [ ] `npm run build` server passes
- [ ] Client hooks updated for `{ data }` wrapper

## Dependencies

- Requires: `modernize-ui-and-stack.md` (implemented)
- Blocks: production hardening, Vitest integration tests

## Notes

Implement after Fase 1 client modernization is stable. Client currently reads `response.data` directly from Axios (server returns unwrapped JSON today).
