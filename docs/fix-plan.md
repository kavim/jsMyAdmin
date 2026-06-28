# JSMYADMIN — Plano de Correção v2

## 🚨 Críticos (P0)

| # | Problema | Causa | Solução | Arquivos | Esforço |
|---|----------|-------|---------|----------|---------|
| C1 | **WHERE/ORDER BY aceita SQL arbitrário** | `table.routes.ts` permite raw SQL nos params `where` e `orderBy` vindos do cliente — token comprometido = `DROP DATABASE` | Validar caractere por caractere (só `a-z`, `0-9`, `=`, `>`, `<`, `LIKE`, `AND`, `OR`, parênteses, `.`, `,`, `'`) ou usar whitelist de colunas + operadores seguros | `server/src/routes/table.routes.ts` | 30min |
| C2 | **Query history volátil** | Histórico em array in-memory no server — todo restart apaga | Adicionar SQLite (better-sqlite3) para persistência + migração automática | `server/src/db/history-store.ts`, `server/src/routes/query.routes.ts` | 30min |
| C3 | **Progresso upload não sobrevive restart** | `uploadProgress` Map in-memory — se servidor cai durante import de 5GB, orfão | Migrar `uploadProgress` para SQLite + cleanup task em startup | `server/src/db/progress-store.ts`, `server/src/routes/upload.routes.ts` | 30min |
| C4 | **tableApi client desalinhado com server** | Client chama `PATCH /tables/row/:id` e `DELETE /tables/row/:id`, mas server mudou para receber PK via `req.body` (sem `:id` na URL) | Corrigir `client/src/lib/api.ts` → `updateRow(id, data)` vira `PATCH /tables/row` com `{ ...data, [pk]: id }` no body. `deleteRow(id)` vira `DELETE /tables/row` com body. | `client/src/lib/api.ts`, `client/src/hooks/useTableData.ts` | 15min |

## ⚠️ Médios (P1)

| # | Problema | Causa | Solução | Arquivos | Esforço |
|---|----------|-------|---------|----------|---------|
| M1 | **Sem testes** | Projeto novo, zero testes | Adicionar Vitest + supertest para server, Testing Library para client. Testes críticos: auth, CRUD, import | `server/src/**/*.test.ts`, `client/src/**/*.test.tsx` | 2h |
| M2 | **Error handling inconsistente** | Mistura de `{ error }`, `{ data }`, `AppError`, `new Error` | Middleware de response wrapper: `res.success(data)`, `res.fail(error, status)`. Refatorar todas as routes. | `server/src/middleware/response.ts`, + rotas | 1h |
| M3 | **Controllers/Services layer ausente** | Toda lógica nas routes (~100+ linhas em table.routes.ts) | Extrair: `services/query.service.ts`, `services/table.service.ts`, `controllers/query.controller.ts` | `server/src/controllers/`, `server/src/services/` | 1h30min |
| M4 | **Socket disconnect global inseguro** | `disconnectSocket()` fecha socket singleton que outras features usam | Remover `disconnectSocket()` da DumpPage. Adicionar `socket.connect()` / `disconnect()` por namespace ou reconnect automático. | `client/src/lib/socket.ts`, `client/src/pages/DumpPage.tsx` | 15min |

## 🟢 Leves (P2)

| # | Problema | Solução | Arquivos | Esforço |
|---|----------|---------|----------|---------|
| L1 | **Favicon ausente** | Adicionar SVG favicon | `client/public/favicon.svg` | 5min |
| L2 | **Spec draft abandonado** | Finalizar ou arquivar `modernize-server-architecture.md` | Atualizar spec com status ou mover para archive | `docs/specs/features/` | 15min |
| L3 | **Client não valida tamanho antes de upload** | Validar `file.size` ≤ 10GB antes de enviar | `client/src/pages/DumpPage.tsx` + toast de erro | 10min |
| L4 | **Porta hardcoded no docker-compose** | Mudar para `${PORT:-3000}:3000` | `docker-compose.yml` | 5min |

## Ordem de Execução

```
C4 → C1 → C2 → C3   (P0 — quebra funcionalidade)
M4                   (P1 — risco silencioso)
M2 → M3              (P1 — dívida técnica)
M1                   (P1 — qualidade)
L1-L4                (P2 — polish)
```
