# Feature Spec: SQL Script Storage

> **Status:** implemented
> **Created:** 2026-06-28
> **Updated:** 2026-06-28
> **Author:** AI-assisted

## Problem

Hoje o workspace suporta abas SQL em memória (`createSqlTab`, drag `.sql` do disco local), mas:

1. **Nova aba SQL não é óbvia** — `TabBar` some quando não há abas; usuário precisa achar atalho no Welcome ou `Ctrl+Shift+N`.
2. **Nada persiste** — fechar aba ou recarregar página perde o SQL.
3. **Explorer só mostra schema** — não há lugar no projeto para guardar e reabrir scripts `.sql`.
4. **Sem Save/Save As** — diferente de um IDE real (DataGrip, phpMyAdmin bookmarks).

Usuário quer pasta tipo **Laravel `storage/`** dentro do projeto: scripts `.sql` salvos no servidor, visíveis no explorer, abertos como abas.

## Scope

### In scope

- Pasta persistente `data/scripts/` (via `SCRIPTS_DIR`, default `${DATA_DIR}/scripts`)
- API CRUD de arquivos/pastas `.sql` com proteção path traversal
- Seção **Scripts** no explorer (árvore de pastas + arquivos)
- Abas SQL vinculadas a arquivo (`filePath`, `isDirty`)
- **Save** (`Ctrl+S`) e **Save As** (dialog escolhe pasta + nome)
- **New SQL** sempre visível (TabBar mesmo sem abas; botão no Welcome)
- Duplo-clique em `.sql` no explorer abre aba (reusa aba se já aberta)
- Context menu: New file, New folder, Rename, Delete
- Dot indicador `*` no título da aba quando dirty

### Out of scope

- Git sync / versionamento
- Colaboração multi-usuário
- Syntax highlighting por dialect além do atual
- Mover arquivos via drag-and-drop no explorer (fase 2)
- Commit automático no repo do usuário

## User stories

- Como DBA, quero clicar **+** e ter aba SQL vazia imediatamente, sem procurar atalho.
- Como DBA, quero salvar meu SQL em `reports/users.sql` e reabrir depois.
- Como DBA, quero ver meus scripts no explorer ao lado das tabelas.
- Como DBA, quero `Ctrl+S` salvar o arquivo atual sem dialog.

## Technical design

### Storage layout

```
data/                          # DATA_DIR (volume Docker)
  scripts/                     # SCRIPTS_DIR (default: DATA_DIR/scripts)
    reports/
      active-users.sql
    ad-hoc/
      console_1.sql
```

Env: `SCRIPTS_DIR` — default `path.join(DATA_DIR, 'scripts')`. Criado no startup se ausente.

### API changes

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| GET | `/api/scripts` | yes | `?path=` (optional subfolder) | `{ data: ScriptNode[] }` |
| GET | `/api/scripts/file` | yes | `?path=reports/users.sql` | `{ data: { path, content, updatedAt } }` |
| PUT | `/api/scripts/file` | yes | `{ path, content }` | `{ data: { path, updatedAt } }` |
| POST | `/api/scripts/folder` | yes | `{ path }` | `{ data: { path } }` |
| DELETE | `/api/scripts` | yes | `?path=` | `{ data: { deleted: true } }` |

`ScriptNode`:
```ts
{ name: string; path: string; kind: 'file' | 'folder'; children?: ScriptNode[] }
```

**Segurança:**
- Resolver path com `path.resolve` + verificar prefixo `SCRIPTS_DIR`
- Rejeitar `..`, paths absolutos, extensões ≠ `.sql` para arquivos
- Nomes sanitizados: `[a-zA-Z0-9_\-./]` apenas

### UI changes

- **Explorer:** nova seção `Scripts` acima ou abaixo de `tables` (ícone `FileCode`)
- **SqlTabView:** botões Save / Save As na toolbar; `Ctrl+S` shortcut
- **TabBar:** sempre renderiza (mesmo 0 abas) com botão `+`
- **WelcomeTab:** botão primário "New SQL console"
- **workspaceStore:** `SqlTab` ganha `filePath?: string`, `isDirty?: boolean`, `savedSql?: string` (baseline para dirty check)

### Store changes

```ts
interface SqlTab {
  // existing...
  filePath?: string;   // e.g. "reports/users.sql"
  isDirty?: boolean;
}

openScriptTab(path: string, content: string): string  // dedupe by filePath
markTabSaved(id: string, path: string): void
```

## Files affected

```
.env.example
server/src/routes/scripts.routes.ts          # new
server/src/app.ts
client/src/lib/api.ts
client/src/types/index.ts                    # ScriptNode type
client/src/hooks/useScripts.ts               # new
client/src/stores/workspaceStore.ts
client/src/components/explorer/ScriptsTree.tsx   # new
client/src/components/explorer/DatabaseExplorer.tsx
client/src/components/workspace/SqlTabView.tsx
client/src/components/workspace/TabBar.tsx
client/src/components/workspace/WelcomeTab.tsx
client/src/components/workspace/SaveScriptDialog.tsx  # new
client/src/hooks/useIdeShortcuts.ts
docs/specs/features/sql-script-storage.md
docs/memory/STATE.md
docs/memory/DECISIONS.md
```

## Acceptance criteria

- [x] `data/scripts/` criada automaticamente no startup (dev + Docker)
- [x] GET `/api/scripts` lista árvore; PUT salva `.sql`; DELETE remove
- [x] Path traversal bloqueado (tentativa `../etc/passwd` → 400)
- [x] Explorer mostra pasta Scripts com subpastas e arquivos
- [x] Duplo-clique abre aba SQL com conteúdo do arquivo
- [x] `Ctrl+S` salva aba com `filePath`; sem path abre Save As
- [x] Aba mostra `*` no título quando conteúdo ≠ último save
- [x] TabBar visível com `+` mesmo sem abas abertas
- [x] Welcome tem botão óbvio "New SQL console"
- [x] `npm run build` passa
- [x] STATE.md atualizado

## Dependencies

- Requer: auth middleware existente, `DATA_DIR` pattern de `upload.routes.ts`
- Blocks: nada

## Notes

- Segue padrão Laravel `storage/` mas usa `data/scripts/` para alinhar com `DATA_DIR` já montado no Docker.
- Upload de dumps (`.sql` gigantes) continua em `UPLOAD_DIR` — scripts são arquivos de trabalho pequenos/médios.
- ADR: `SCRIPTS_DIR` separado de `UPLOAD_DIR` para não misturar dumps de import com scripts do usuário.
