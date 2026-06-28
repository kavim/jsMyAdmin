# Feature Spec: SQL Console — Execução no cursor (DataGrip-style)

> **Status:** implemented
> **Created:** 2026-06-19
> **Updated:** 2026-06-19
> **Author:** AI-assisted

## Problem

O SQL Console é o foco central do produto. DBAs escrevem scripts com múltiplos statements separados por `;`. Hoje, sem seleção de texto, **Execute** / **Ctrl+Enter** envia o script inteiro para a API — comportamento diferente de DataGrip, que executa apenas o **statement onde está o cursor**.

Isso impede iterar rapidamente sobre queries individuais num script longo.

## Scope

### In scope
- Resolver SQL executável com prioridade DataGrip:
  1. Seleção não vazia → texto selecionado (trim)
  2. Sem seleção → statement que contém a posição do cursor
  3. Script sem `;` → script inteiro (único statement)
- Delimitador padrão `;` com parsing seguro para strings (`'`, `"`, `` ` ``) e comentários (`--`, `/* */`)
- Botão **Execute**, **Ctrl+Enter** e callback `onExecute` usam a mesma lógica
- Highlight visual do statement ativo ao mover o cursor (decoração Monaco)
- **Gutter DataGrip-style** no statement ativo: ▶ play, spinner ao executar, ✓ sucesso, ✕ erro
- Clique no gutter executa só aquele statement
- Status bar: `Ctrl+Enter execute statement · ...`
- History grava só o statement executado

### Out of scope
- Execute All (rodar todos os statements em sequência)
- `DELIMITER $$` / blocos `BEGIN...END` com `;` internos
- Mudanças de API server
- Testes automatizados (Vitest — fase posterior)
- Query Builder e outras páginas

## User stories

- Como DBA, quero `Ctrl+Enter` com o cursor num `SELECT` no meio de um script para executar só esse statement
- Como DBA, quero selecionar um trecho e executar só a seleção
- Como DBA, quero ver qual statement será executado antes de rodar (highlight)

## Technical design

### API changes

Nenhuma. Continua `POST /api/query/execute` com `{ database, sql }`.

### UI changes

- **SqlEditor:** `getExecutableSql()` / `getExecutableStatement()` no handle; highlight + gutter do statement ativo; `glyphMargin` com play/spinner/check
- **QueryConsole:** `handleExecute` usa statement do cursor; `statementExecution` state para feedback visual no gutter

### Nova lib

`client/src/lib/getStatementAtCursor.ts`

| Função | Responsabilidade |
|--------|------------------|
| `splitSqlStatements(sql)` | Ranges `{ start, end, text }` respeitando strings/comentários |
| `getStatementAtOffset(sql, offset)` | Statement no offset; fallback para anterior se cursor em gap vazio |
| `positionToOffset(line, column, sql)` | Line/col → offset UTF-16 safe |

### Fluxo

```
Ctrl+Enter / Execute → SqlEditor.getExecutableSql()
  → seleção? → trim e retorna
  → senão getStatementAtOffset(fullText, cursorOffset)
→ QueryConsole.handleExecute → POST /api/query/execute
```

## Files affected

```
docs/specs/features/sql-console-cursor-execution.md
client/src/lib/getStatementAtCursor.ts
client/src/components/query/SqlEditor.tsx
client/src/components/query/QueryConsole.tsx
docs/memory/STATE.md
docs/memory/PATTERNS.md
```

## Acceptance criteria

- [x] Com 2+ statements e cursor no segundo, Execute/Ctrl+Enter roda só o segundo
- [x] Com seleção ativa, executa seleção (ignora cursor statement)
- [x] `;` dentro de strings/comentários não quebra statement
- [x] Script single-statement sem `;` continua funcionando
- [x] History salva statement executado, não script completo
- [x] Statement ativo visualmente destacado no editor
- [x] Gutter no statement ativo: play → spinner → ✓/✕ após execução
- [x] Clique no gutter executa só aquele statement
- [x] Sem regressão: Format, autocomplete, schema insert, tabs, output panel
- [x] STATE.md atualizado após implementação

## Dependencies

- Requer SQL Console existente (`QueryConsole.tsx`, `SqlEditor.tsx`)

## Notes

- Follow-up: `sql-console-execute-all.md` para Execute All
- Highlight com debounce 100ms em scripts grandes
