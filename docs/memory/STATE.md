# Project Memory — Implementation State

> **Last updated:** 2026-06-28
> Source of truth for what exists **today**. Update via skill `update-memory` after each feature.

## Client — Pages

| Path | Route | Status |
|------|-------|--------|
| `pages/LoginPage.tsx` | `/login` | implemented (rhf + zod) |
| `pages/QueryBuilderPage.tsx` | tool panel | implemented |
| `pages/DumpPage.tsx` | tool panel | implemented |
| `pages/ImportPage.tsx` | — | planned (in SPEC.md) |

## Client — Layout (IDE Shell)

| Path | Purpose |
|------|---------|
| `components/layout/IdeShell.tsx` | DataGrip-style IDE shell (explorer + workspace + tools + status) |
| `components/layout/AppHeader.tsx` | DB selector, tools menu, theme picker, logout |
| `components/layout/StatusBar.tsx` | Breadcrumb + connection status |
| `components/layout/ToolPanel.tsx` | Collapsible right panel — notifications, query builder, dump |

## Client — Explorer & Workspace

| Path | Purpose |
|------|---------|
| `components/explorer/DatabaseExplorer.tsx` | Global tree: connection → DB → tables → columns |
| `components/workspace/TabBar.tsx` | Unified workspace tabs (SQL + table data) |
| `components/workspace/WorkspaceArea.tsx` | Renders active tab by kind |
| `components/workspace/SqlTabView.tsx` | SQL editor + results (from QueryConsole) |
| `components/workspace/TableDataView.tsx` | DataGrip-style data grid with WHERE/ORDER BY |
| `components/workspace/WelcomeTab.tsx` | Empty state + shortcuts |
| `components/workspace/CommandPalette.tsx` | Ctrl+Shift+P command palette |
| `components/notifications/NotificationPanel.tsx` | Timeline panel (right) |

## Client — Theme System

| Path | Purpose |
|------|---------|
| `themes/` | VS Code-style presets (Dark+, Darcula, Dracula, Solarized, etc.) |
| `stores/themeStore.ts` | Active theme + localStorage persist |
| `components/theme/ThemeProvider.tsx` | Applies CSS vars + `data-theme` on `<html>` |
| `components/theme/ThemePicker.tsx` | Header theme selector |

## Client — Components (query)

| Path | Purpose |
|------|---------|
| `components/query/SqlEditor.tsx` | SQL editor — cursor exec + Monaco theme sync |
| `components/query/ResultsPanel.tsx` | Query results display |
| `components/query/QueryConsole.tsx` | deprecated redirect to `/?tab=sql` |
| `components/ui/context-menu.tsx` | shadcn context menu (explorer right-click) |
| `components/ui/split-pane.tsx` | Drag resize split panes |

## Client — Hooks

| Path | Purpose |
|------|---------|
| `hooks/useDatabases.ts` | React Query — list databases |
| `hooks/useTables.ts` | React Query — tables per DB |
| `hooks/useColumns.ts` | React Query — columns per table |
| `hooks/useAllTableColumns.ts` | React Query — all columns for query builder |
| `hooks/useExecuteQuery.ts` | React Query mutation — execute SQL |
| `hooks/useQueryHistory.ts` | React Query — query history |
| `hooks/useTableData.ts` | React Query — table grid data |
| `hooks/useIdeShortcuts.ts` | IDE keyboard shortcuts |
| `hooks/useAuth.ts` | Login/logout mutations |
| `hooks/useDumpUpload.ts` | Upload/import/delete dump mutations |

## Client — Stores & Lib

| Path | Purpose |
|------|---------|
| `stores/authStore.ts` | JWT auth, localStorage persist |
| `stores/databaseStore.ts` | DB/table selection UI state |
| `stores/workspaceStore.ts` | Unified workspace tabs + IDE panel state |
| `stores/queryStore.ts` | deprecated alias → workspaceStore |
| `stores/notificationStore.ts` | Notification timeline buffer |
| `lib/api.ts` | Typed Axios client + JWT interceptor |
| `lib/notifications.ts` | Bridge sonner + notification store |
| `lib/socket.ts` | Typed Socket.io client |
| `lib/errors.ts` | getErrorMessage helper |
| `lib/formatSql.ts` | SQL formatting |
| `lib/getStatementAtCursor.ts` | Split SQL script / resolve statement at cursor |
| `lib/sqlKeywords.ts` | SQL autocomplete keywords |

## Client — Tooling

| Path | Purpose |
|------|---------|
| `eslint.config.js` | ESLint flat config (TS + react-hooks) |

## Server — Routes

| File | Mount | Endpoints |
|------|-------|-----------|
| `routes/auth.routes.ts` | `/api/auth` | login (rate-limited), logout, verify |
| `routes/database.routes.ts` | `/api/databases` | list DBs, tables, columns, schema (tables+columns) |
| `routes/query.routes.ts` | `/api/query` | execute, history (GET/DELETE), export (CSV/JSON) |
| `routes/table.routes.ts` | `/api/tables` | CRUD rows + grid data (parameterized queries, dynamic PK) |
| `routes/upload.routes.ts` | `/api/upload` | upload, progress, import, delete |

## Server — Core

| Path | Purpose |
|------|---------|
| `db/connection-manager.ts` | Multi-DB (MySQL/MariaDB/PostgreSQL) + max 50 connections + getPrimaryKey |
| `middleware/auth.ts` | JWT validation (warns on hardcoded fallback) |
| `middleware/error-handler.ts` | Error responses |
| `socket/socket-handler.ts` | Upload/import progress WS |
| `index.ts` | Static serving of client build in production |

## API Summary

```
POST   /api/auth/login                          # local, no rate limit
POST   /api/auth/logout
GET    /api/auth/verify
GET    /api/databases
GET    /api/databases/:db/tables
GET    /api/databases/:db/tables/:table/columns
GET    /api/databases/:db/schema                # tables + columns (Phase 3)
POST   /api/query/execute
GET    /api/query/history                       # ?database= filter
DELETE /api/query/history                       # clear history
POST   /api/query/export                        # { format: 'csv'|'json' } → download
GET    /api/tables/data?where=&orderBy=&page=&limit=  # parameterized, dynamic PK
POST   /api/tables/row                          # parameterized
PATCH  /api/tables/row                          # parameterized, dynamic PK
DELETE /api/tables/row                          # parameterized, dynamic PK
POST   /api/upload
GET    /api/upload/progress/:fileId
POST   /api/upload/import
DELETE /api/upload/:fileId
```

## WebSocket Events

| Event | Status |
|-------|--------|
| `upload:start` | implemented |
| `upload:progress` | implemented |
| `upload:complete` | implemented |
| `import:start` | implemented |
| `import:progress` | implemented |

## Planned (from SPEC.md, not yet built)

- `components/database/*` — legacy SPEC paths (explorer covers most)
- `components/query-builder/*` — dedicated visual query builder UI components
- `components/dump/*` — dedicated dump components
- `components/crud/*` — RowEditor, BulkActions
- `components/auth/*` — ConnectionForm, RecentConnections
- `server/src/controllers/*` — controller layer split
- `server/src/services/*` — business logic layer
- Vitest + RTL tests
- Dump export (SQL dump download)
- Connection pool cleanup on session expiry

## Feature Specs Index

| Spec | Status |
|------|--------|
| `docs/specs/features/modernize-ui-and-stack.md` | implemented |
| `docs/specs/features/modernize-server-architecture.md` | draft |
| `docs/specs/features/sql-console-cursor-execution.md` | implemented |
| `docs/specs/features/datagrip-ux-and-theme-system.md` | implemented |
