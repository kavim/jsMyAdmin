# Code Patterns

> Reusable patterns discovered in this codebase. Tag with area prefix.
> Add via skill `update-memory`. Remove stale patterns.

## [api] Response wrapper

All API responses use `{ data: T }`:

```typescript
res.json({ data: tables });
```

Client reads via Axios: `response.data.data`

## [api] Protected route registration

Routes requiring auth apply middleware at router level or per-route in `server/src/routes/`.

## [client] Protected pages

```tsx
<ProtectedRoute>
  <MainLayout />
</ProtectedRoute>
```

Auth check via `useAuthStore((s) => s.isAuthenticated)`.

## [client] React Query hook for server state

When: fetching data from API in pages/components

```typescript
// hooks/useTables.ts
export function useTables(database: string | null) {
  return useQuery({
    queryKey: ['tables', database],
    queryFn: () => databaseApi.listTables(database!).then((r) => r.data),
    enabled: !!database,
  });
}
```

Zustand = UI/auth state only. React Query = server state. Do not duplicate.

## [client] API error feedback

When: mutation or manual catch needs user feedback

```typescript
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';

toast.error(getErrorMessage(error));
toast.success('Action completed');
```

Global mutation errors also handled in `main.tsx` QueryClient defaults.

## [client] 401 unauthorized

`lib/api.ts` calls `setOnUnauthorized` callback. Wired in `App.tsx` via `AuthHandler` → React Router navigate.

## [client] New endpoint integration

1. Add typed fn in `client/src/lib/api.ts`
2. Create hook in `hooks/` with React Query
3. Call hook from page/component — never inline axios + useEffect

## [client] Forms with validation

Login and similar forms use react-hook-form + zod:

```typescript
const schema = z.object({ host: z.string().min(1) });
const form = useForm({ resolver: zodResolver(schema) });
```

## [server] DB access

Always through `connection-manager.ts`:

```typescript
const conn = connectionManager.getConnection();
// driver-specific queries via manager methods
```

Never import mysql2/pg/mariadb directly in routes.

## [server] Error forwarding

```typescript
try { ... } catch (err) { next(err); }
```

Centralized in `middleware/error-handler.ts`.

## [socket] Progress events

Upload/import emit progress via Socket.io. Client subscribes in `lib/socket.ts`, typically from DumpPage or upload components.

## [client] Page registration (IDE shell)

New auxiliary page (tool window):
- `pages/NewPage.tsx`
- Nested route in `App.tsx` under `IdeShell`
- Link in `AppHeader` Tools menu or Command Palette

Main workspace features use `workspaceStore` tabs — no new route needed.

## [client] Multi-theme system

When: any UI color — use semantic tokens, never hardcoded hex

```typescript
// stores/themeStore.ts — persist theme id
// themes/presets/*.ts — maps to CSS vars + Monaco colors
// ThemeProvider applies via document.documentElement.style.setProperty
```

IDE-specific tokens: `--sidebar`, `--editor`, `--status-bar`, `--tab-active`, `--tree-selected`. Utility classes in `index.css`: `.bg-sidebar`, `.bg-editor`, etc.

## [client] Workspace tabs

When: SQL console or table data view in IDE

```typescript
// stores/workspaceStore.ts
createSqlTab() | openTableTab(table, db) | openSqlWithQuery(sql, title)
// components/workspace/WorkspaceArea.tsx renders by tab.kind
```

## [client] Notifications bridge

When: user-facing event should appear in timeline + toast

```typescript
import { notifyQuerySuccess, notifyUpload } from '@/lib/notifications';
// writes to notificationStore + sonner
```

## [client] Dark theme

Superseded by multi-theme — see **Multi-theme system**. Default preset: `dark-plus`. `ThemeProvider` sets `class="dark"|"light"` from preset type.

## [client] SQL statement at cursor (DataGrip-style)

When: SQL Console execute must run one statement, not whole script

```typescript
// lib/getStatementAtCursor.ts — split by ; respecting strings/comments
const { sql, key } = trimStatementRange(fullText, getStatementRangeAtOffset(fullText, offset));

// SqlEditorHandle.getExecutableStatement() priority:
// 1. non-empty selection  2. statement at cursor  3. full script trim
```

Monaco: highlight via `deltaDecorations` + `.sql-active-statement`; gutter via `glyphMarginClassName` (`sql-gutter-play` → `sql-gutter-running` → `sql-gutter-success`). `SqlTabView` passes `statementExecution` state. Monaco theme syncs via `registerMonacoThemes` + `useThemeStore`. Debounce 100ms on cursor move.
