# Architecture Decisions (ADR)

> Lightweight decision log. Add entries when choices affect future work.
> Format: ADR-NNN. Use skill `update-memory` to append.

## ADR-001: Spec Driven Development with Cursor

**Date:** 2026-06-18 | **Status:** accepted

**Context:** Project needs consistent AI-assisted development. Ad-hoc prompts waste context and produce inconsistent code.

**Decision:** Adopt SDD workflow:
- Master spec in `SPEC.md`
- Feature specs in `docs/specs/features/`
- Implementation truth in `docs/memory/STATE.md`
- Cursor rules in `.cursor/rules/` + skills in `.cursor/skills/`

**Consequences:**
- Extra upfront spec work, but faster/more accurate AI sessions
- Memory files must stay updated or context drifts

## ADR-002: Monorepo with npm workspaces

**Date:** (existing) | **Status:** accepted

**Context:** Full-stack app with shared TypeScript tooling.

**Decision:** Root `package.json` workspaces for `client/` and `server/`. Single `npm run dev` via concurrently.

**Consequences:** Simple setup. No Turborepo yet (SPEC.md mentions it as planned).

## ADR-003: Zustand + JWT for client auth

**Date:** (existing) | **Status:** accepted

**Context:** Need lightweight client state with auth persistence.

**Decision:** Zustand store with localStorage persist. JWT validated server-side via middleware.

**Consequences:** No refresh token flow yet. Token expiry handled on verify failure.

## ADR-004: Dark mode shadcn as default UI theme

**Date:** 2026-06-18 | **Status:** accepted

**Context:** SQL console used separate IDE hex colors; rest of app used shadcn light tokens. Inconsistent UX for DB admin tool used for long sessions.

**Decision:** Unified dark shadcn theme across all routes. `:root` holds dark CSS variables. Monaco uses `elendra-dark` theme aligned to slate palette.

**Consequences:** Superseded for theme selection by ADR-006. Preset system still builds on shadcn semantic tokens.

## ADR-006: DataGrip IDE shell + VS Code-style theme presets

**Date:** 2026-06-26 | **Status:** accepted

**Context:** App used page-based sidebar nav unlike DataGrip. Single dark theme. Users wanted IDE UX + selectable classic themes (Dark+, Darcula, Solarized, etc.).

**Decision:**
- Replace `MainLayout` with `IdeShell`: explorer (left) + workspace tabs (center) + notifications (right) + status bar
- `workspaceStore` unifies SQL and table-data tabs
- `themes/presets/` registry with 8 presets; `themeStore` + `ThemePicker`; Monaco sync per preset
- Query Builder / Dump as auxiliary routes inside IDE shell (Tools menu)

**Consequences:**
- `Sidebar`, `DashboardPage`, `QueryConsole` deprecated
- New IDE components must use semantic tokens (`--sidebar`, `--editor`, etc.)
- Table grid `where`/`orderBy` validated server-side with regex whitelist

## ADR-008: SQL script storage in DATA_DIR/scripts

**Date:** 2026-06-28 | **Status:** accepted

**Context:** SQL tabs were ephemeral (in-memory only). Users need persistent `.sql` files visible in the IDE explorer, like Laravel `storage/`.

**Decision:**
- `SCRIPTS_DIR` env var, default `${DATA_DIR}/scripts`
- Separate from `UPLOAD_DIR` (dump imports) — scripts are small working files
- REST API at `/api/scripts` with path traversal protection
- Explorer **Scripts** tree + Save/Ctrl+S in SqlTabView

**Consequences:**
- Docker: scripts persist in `data` volume automatically
- Dev: files land in `./data/scripts/` (gitignored via data/)
- Tabs track `filePath` + dirty state via `savedSql` baseline

## ADR-007: Docker single-image deployment (phpMyAdmin-like)

**Date:** 2026-06-28 | **Status:** accepted

**Context:** Project should be usable like phpMyAdmin — one `docker run` connects to any remote DB. Previously required docker-compose and path-based data dirs tied to project root.

**Decision:**
- Single `Dockerfile` with multi-stage build; no docker-compose required for production
- `DATA_DIR=/data` and `UPLOAD_DIR=/uploads` env vars for all persistent state (query history, upload progress, uploaded files)
- Image fails fast if `JWT_SECRET` not set (no insecure fallback in production)
- HEALTHCHECK at `/api/health`
- `dumb-init` for signal handling; ConnectionManager releases connections on shutdown
- All future code paths requiring persistence must use `DATA_DIR` or `UPLOAD_DIR` env vars

**Consequences:**
- `upload.routes.ts` and `query.routes.ts` now read `DATA_DIR` from env (fallback to `__dirname/../../data`)
- Docker compose simplified to two named volumes (`data`, `uploads`) and mandatory `JWT_SECRET`
- New Cursor rule (`.cursor/rules/docker-image.mdc`) enforces constraints on Docker-related changes
- Published images via GHCR on tag push (future step)

## ADR-005: React Query for server state, Zustand for UI state

**Date:** 2026-06-18 | **Status:** accepted

**Context:** Pages duplicated `useEffect` + axios fetch. React Query was installed but unused.

**Decision:** `hooks/` layer wraps API with React Query. Zustand keeps auth, selected DB, workspace tabs — not server cache.

**Consequences:** Invalidate queries after mutations (e.g. execute query → `['tables', db]`). Global toast on mutation errors in QueryClient config.
