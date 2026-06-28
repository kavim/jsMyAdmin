# JSMYADMIN - Database Administration Tool Specification

## 1. Project Overview

**Project Name:** JSMYADMIN  
**Project Type:** Full-stack Web Application (Database Administration Tool)  
**Core Functionality:** A phpMyAdmin-like database administration tool supporting MySQL, MariaDB, and PostgreSQL with real-time SQL execution, dump imports, and visual query building.  
**Target Users:** Database administrators, developers, and DevOps engineers who need a modern web-based interface for managing relational databases.

---

## 2. Architecture Overview

### 2.1 Monorepo Structure

\\\
jsmyadmin/
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── Dockerfile.client
├── Dockerfile.server
├── package.json                    # Root workspace config (npm workspaces)
├── tsconfig.json                  # Base TypeScript config
├── .env.example                   # Environment template
├── turbo.json                     # Turborepo config
├── .prettierrc
├── .eslintrc.js
├── README.md
├── client/                        # React Frontend (Vite + React 18)
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── .env.example
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── components.json            # shadcn/ui config
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── vite-env.d.ts
│   │   ├── lib/
│   │   │   ├── utils.ts
│   │   │   ├── axios.ts
│   │   │   └── socket.ts
│   │   ├── components/
│   │   │   │   ├── ui/                   # shadcn/ui components
│   │   │   │   │   ├── button.tsx
│   │   │   │   │   ├── input.tsx
│   │   │   │   │   ├── select.tsx
│   │   │   │   │   ├── dialog.tsx
│   │   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   │   ├── tabs.tsx
│   │   │   │   │   ├── table.tsx
│   │   │   │   │   ├── textarea.tsx
│   │   │   │   │   ├── card.tsx
│   │   │   │   │   ├── badge.tsx
│   │   │   │   │   ├── progress.tsx
│   │   │   │   │   ├── scroll-area.tsx
│   │   │   │   │   ├── separator.tsx
│   │   │   │   │   ├── skeleton.tsx
│   │   │   │   │   ├── tooltip.tsx
│   │   │   │   │   ├── popover.tsx
│   │   │   │   │   ├── checkbox.tsx
│   │   │   │   │   ├── label.tsx
│   │   │   │   │   └── toast.tsx
│   │   │   │   ├── layout/
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   ├── TopBar.tsx
│   │   │   │   │   └── MainLayout.tsx
│   │   │   │   ├── database/
│   │   │   │   │   ├── DatabaseSelector.tsx
│   │   │   │   │   ├── DatabaseList.tsx
│   │   │   │   │   ├── TableList.tsx
│   │   │   │   │   ├── TableBrowser.tsx
│   │   │   │   │   ├── TableStats.tsx
│   │   │   │   │   ├── ColumnInfo.tsx
│   │   │   │   │   └── TableActions.tsx
│   │   │   │   ├── query/
│   │   │   │   │   ├── SQLEditor.tsx
│   │   │   │   │   ├── QueryResult.tsx
│   │   │   │   │   ├── QueryHistory.tsx
│   │   │   │   │   ├── QueryToolbar.tsx
│   │   │   │   │   └── ResultPagination.tsx
│   │   │   │   ├── query-builder/
│   │   │   │   │   ├── QueryBuilder.tsx
│   │   │   │   │   ├── TableSelector.tsx
│   │   │   │   │   ├── JoinBuilder.tsx
│   │   │   │   │   ├── ColumnSelector.tsx
│   │   │   │   │   ├── ConditionBuilder.tsx
│   │   │   │   │   ├── QueryPreview.tsx
│   │   │   │   │   └── JoinTypeSelect.tsx
│   │   │   │   ├── dump/
│   │   │   │   │   ├── DumpUploader.tsx
│   │   │   │   │   ├── DumpProgress.tsx
│   │   │   │   │   ├── DumpHistory.tsx
│   │   │   │   │   └── DumpOptions.tsx
│   │   │   │   ├── crud/
│   │   │   │   │   ├── RowEditor.tsx
│   │   │   │   │   ├── RowCreate.tsx
│   │   │   │   │   ├── RowDelete.tsx
│   │   │   │   │   └── BulkActions.tsx
│   │   │   │   └── auth/
│   │   │   │       ├── LoginForm.tsx
│   │   │   │       ├── ConnectionForm.tsx
│   │   │   │       └── RecentConnections.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useDatabase.ts
│   │   │   │   ├── useQuery.ts
│   │   │   │   ├── useQueryBuilder.ts
│   │   │   │   ├── useDumpUpload.ts
│   │   │   │   ├── useSocket.ts
│   │   │   │   ├── useTable.ts
│   │   │   │   └── useAutocomplete.ts
│   │   │   ├── stores/
│   │   │   │   │   ├── authStore.ts
│   │   │   │   │   ├── databaseStore.ts
│   │   │   │   │   ├── queryStore.ts
│   │   │   │   │   └── appStore.ts
│   │   │   ├── types/
│   │   │   │   │   ├── database.ts
│   │   │   │   │   ├── query.ts
│   │   │   │   │   ├── table.ts
│   │   │   │   │   ├── dump.ts
│   │   │   │   │   ├── api.ts
│   │   │   │   │   └── index.ts
│   │   │   ├── services/
│   │   │   │   │   ├── database.service.ts
│   │   │   │   │   ├── query.service.ts
│   │   │   │   │   ├── dump.service.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   └── export.service.ts
│   │   │   └── pages/
│   │   │       ├── LoginPage.tsx
│   │   │       ├── DashboardPage.tsx
│   │   │       ├── QueryPage.tsx
│   │   │       ├── QueryBuilderPage.tsx
│   │   │       ├── DumpPage.tsx
│   │   │       └── ImportPage.tsx
│   │   └── public/
│   │       └── favicon.ico
├── server/                        # Express Backend
│   ├── package.json
│   ��── tsconfig.json
│   ├── jest.config.js
│   ├── .env.example
│   ├── src/
│   │   │   ├── index.ts              # Entry point
│   │   │   ├── app.ts                 # Express app config
│   │   │   ├── server.ts              # HTTP server
│   │   │   ├── types/
│   │   │   │   └── express.d.ts
│   │   │   ├── config/
│   │   │   │   ├── database.ts        # DB config
│   │   │   │   ├── cors.ts            # CORS config
│   │   │   │   └── env.ts              # Env vars
│   │   │   ├── db/
│   │   │   │   ├── connection-manager.ts
│   │   │   │   ├── mysql-connection.ts
│   │   │   │   ├── mariadb-connection.ts
│   │   │   │   ├── postgres-connection.ts
│   │   │   │   ├── connection-pool.ts
│   │   │   │   └── migrations/
│   │   │   │       ├── 001_create_connections.sql
│   │   │   │       └── 002_create_sessions.sql
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts
│   │   │   ├── error-handler.ts
│   │   │   │   ├── validation.ts
│   │   │   │   ├── rate-limiter.ts
│   │   │   │   └── upload.ts
│   │   │   ├── routes/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── database.routes.ts
│   │   │   │   ├── query.routes.ts
│   │   │   │   ├── table.routes.ts
│   │   │   │   ├── dump.routes.ts
│   │   │   │   ├── export.routes.ts
│   │   │   │   └── api.routes.ts
│   │   │   ├── controllers/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── database.controller.ts
│   │   │   │   ├── query.controller.ts
│   │   │   │   ├── table.controller.ts
│   │   │   │   ├── dump.controller.ts
│   │   │   │   └── export.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── session.service.ts
│   │   │   │   ├── query.service.ts
│   │   │   │   ├── dump.service.ts
│   │   │   │   ├── export.service.ts
│   │   │   │   ├── autocomplete.service.ts
│   │   │   │   └── analyze.service.ts
│   │   │   ├── socket/
│   │   │   │   ├── socket-handler.ts
│   │   │   │   ├── events.ts
│   │   │   │   └── namespace.ts
│   │   │   ├── utils/
│   │   │   │   ├── sql-parser.ts
│   │   │   │   ├── result-transformer.ts
│   │   │   │   ├── file-stream.ts
│   │   │   │   ├── logger.ts
│   │   │   │   └── crypto.ts
│   │   │   └── validators/
│   │   │       ├── auth.validator.ts
│   │   │       ├── database.validator.ts
│   │   │       └── query.validator.ts
│   └── uploads/                    # Temp upload storage
│       └── .gitkeep
\\\

