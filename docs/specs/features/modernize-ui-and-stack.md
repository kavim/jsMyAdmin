# Feature Spec: Modernização UI e Stack

> **Status:** implemented
> **Created:** 2026-06-18
> **Updated:** 2026-06-18
> **Author:** AI-assisted

## Problem

Interface mistura dois sistemas visuais (shell shadcn vs console IDE com hex hardcoded). Fetch manual em cada página. Feedback de erro só inline/`console.error`. Tipos com `any` em socket e catch blocks. ESLint script existe mas config ausente. React Query instalado mas não usado.

Projeto já está 100% TypeScript — gap é consistência e arquitetura client, não migração JS.

## Scope

### In scope (Fase 1 — Client)
- Design system dark default com tokens shadcn unificados
- Componentes shadcn faltantes + sonner
- Refator layout + query console para shadcn tokens
- Camada `hooks/` com React Query
- Toast global (sonner)
- Forms com react-hook-form + zod (login, query builder)
- ESLint flat config + tipos estritos
- Navegação 401 via React Router

### Out of scope (Fase 1)
- Refator server (spec separada `modernize-server-architecture.md`)
- Novas features (ImportPage, export, CRUD dedicado)
- Testes automatizados (Vitest — Fase 3)
- Renomear JSMYADMIN → Elendra

## User stories

- Como DBA, quero interface dark consistente em todas telas para uso prolongado
- Como dev, quero erros de API como toast para não perder feedback
- Como dev, quero hooks reutilizáveis para não repetir fetch em cada página
- Como maintainer, quero ESLint + tipos estritos para evitar regressões

## Decisões

| Decisão | Escolha |
|---------|---------|
| Tema | Dark mode shadcn unificado — console incluído |
| Fase 1 | Client completo — UI + React Query + hooks + toast + tipos + ESLint |
| Server state | React Query; UI/auth state permanece Zustand |

## Technical design

### API changes

Nenhuma mudança de API na Fase 1.

### UI changes

- **Theme:** `:root` dark tokens + `ThemeProvider` aplica `class="dark"` no `<html>`
- **Componentes novos:** dialog, dropdown-menu, tooltip, scroll-area, separator, popover, sonner, badge, skeleton
- **Layout:** Sidebar, TopBar — shadcn Button, Badge
- **Query:** QueryConsole, SchemaBrowser, ResultsPanel, SqlEditor — tokens shadcn, sem hex
- **Pages:** Login (rhf+zod), Dashboard, QueryBuilder, Dump — hooks React Query

### Hooks

| Hook | Responsabilidade |
|------|------------------|
| `useDatabases` | GET /api/databases |
| `useTables` | tables por DB |
| `useColumns` | columns por table |
| `useExecuteQuery` | mutation execute |
| `useQueryHistory` | history fetch |
| `useUploadDump` | upload mutation |
| `useImportDump` | import mutation |
| `useAuth` | login/logout mutations |

## Files affected

```
client/eslint.config.js
client/package.json
client/src/index.css
client/src/main.tsx
client/src/App.tsx
client/src/lib/api.ts
client/src/lib/socket.ts
client/src/lib/errors.ts
client/src/hooks/*
client/src/components/theme/ThemeProvider.tsx
client/src/components/ui/*
client/src/components/layout/*
client/src/components/query/*
client/src/pages/*
client/src/types/index.ts
docs/specs/features/modernize-ui-and-stack.md
docs/memory/STATE.md
docs/memory/PATTERNS.md
docs/memory/DECISIONS.md
```

## Acceptance criteria

- [x] App renderiza dark mode shadcn por default em todas rotas
- [x] Zero cores hex hardcoded em `components/query/*` e `components/layout/*` (Tailwind classes)
- [x] Monaco editor usa tema alinhado aos tokens shadcn dark
- [x] Todas páginas usam hooks React Query — zero `useEffect` + axios para fetch server
- [x] Erros de API mostram toast; sucesso em login, execute, upload
- [x] Login usa react-hook-form + zod
- [x] `socket.ts` e `api.ts` sem `any`
- [x] `npm run lint` client passa
- [x] `npm run build` client passa
- [x] STATE.md, PATTERNS.md, DECISIONS.md atualizados

## Dependencies

- Requires: nenhuma
- Blocks: `modernize-server-architecture.md` (Fase 2)

## Notes

Fase 2 (server) documentada em `docs/specs/features/modernize-server-architecture.md`.
