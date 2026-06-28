# Elendra (JSMYADMIN)

Ferramenta web de administração de bancos relacionais — estilo DataGrip no fluxo, temas configuráveis estilo VS Code. Suporta **MySQL**, **MariaDB** e **PostgreSQL**.

---

## Requisitos

- **Node.js** 18+ (recomendado 20+)
- **npm** 9+
- Um servidor de banco acessível na rede (local ou remoto)

---

## Instalação

Na pasta raiz do projeto:

```bash
npm install
```

### Variáveis de ambiente (opcional em dev)

Copie o exemplo na raiz:

```bash
copy .env.example .env
```

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `JWT_SECRET` | (ver `.env.example`) | Segredo para tokens de sessão |
| `PORT` | `3000` | Porta da API |
| `CLIENT_URL` | `http://localhost:5173` | URL do frontend (CORS) |
| `UPLOAD_DIR` | `/tmp/jsmyadmin/uploads` | Pasta de uploads de dump |

---

## Como rodar

### Desenvolvimento (recomendado)

Sobe **API** e **client** ao mesmo tempo:

```bash
npm run dev
```

| Serviço | URL |
|---------|-----|
| Interface (client) | http://localhost:5173/ |
| API (server) | http://localhost:3000/ |

### Apenas um dos dois

```bash
npm run dev:client   # frontend → :5173
npm run dev:server   # backend  → :3000
```

### Produção (build)

```bash
npm run build
npm start
```

### Docker

```bash
docker-compose up --build
```

Acesso em http://localhost:3000 (imagem única conforme `Dockerfile`).

### Lint

```bash
npm run lint
```

---

## Primeiro acesso

1. Abra http://localhost:5173/
2. Na tela de **login**, informe:
   - Tipo: MySQL, MariaDB ou PostgreSQL
   - Host, porta, usuário, senha
   - Database (opcional — pode escolher depois no header)
3. Após conectar, você entra no **shell IDE**.

Não há usuário fixo do app: a autenticação usa as credenciais do **seu banco**.

---

## Guia de uso da interface

Layout inspirado no **DataGrip**:

```
┌─ Header (DB, ferramentas, tema, logout) ─────────────────────┐
├─ Explorer ─┬─ Workspace (abas) ─────────────┬─ Painel direito ┤
│  árvore DB │  SQL / grid de tabela          │  Notifications  │
│            │                                 │  Query Builder  │
│            │                                 │  Dump Import    │
├────────────┴─────────────────────────────────┴─────────────────┤
└─ Status bar (breadcrumb da seleção) ───────────────────────────┘
```

### Database Explorer (esquerda)

- Árvore: `@host` → database → **tables** → tabela → **columns**
- **Clique** na tabela: seleciona e atualiza o breadcrumb
- **Duplo-clique** na tabela: abre aba com **grid de dados**
- **Duplo-clique** na coluna: insere o nome no editor SQL ativo
- **Botão direito** na tabela: Open data, SELECT *, Copy name
- **Filtro** no topo: busca tabelas por nome
- **Refresh**: recarrega schema

### Workspace (centro)

- Sem abas abertas: tela de boas-vindas com atalhos
- **Abas SQL**: editor Monaco + painel de resultados
- **Abas de tabela**: grid com WHERE, ORDER BY, paginação, add/delete row
- **Arraste** um arquivo `.sql` para o workspace para abrir nova aba
- **+** na barra de abas: nova console SQL

#### SQL Console

- **Execute**: botão ou `Ctrl+Enter` — roda só o statement no cursor (estilo DataGrip)
- **Format**: formata o SQL da aba
- **History**: queries executadas recentemente
- Gutter verde no statement ativo: clique para executar

### Painel direito (Tools)

Abas no topo do painel:

| Aba | Função |
|-----|--------|
| **Notifications** | Timeline de eventos (queries, sync, uploads) |
| **Query Builder** | Montagem visual de SELECT |
| **Dump** | Upload e import de arquivos `.sql` |

Menu **Tools** no header também abre Query Builder e Dump.

### Temas

Ícone de **paleta** no header. Presets disponíveis:

- **Dark:** Dark+, Darcula, Dracula, One Dark, Solarized Dark  
- **Light:** Light+, Solarized Light, GitHub Light  

A escolha é salva no navegador (`localStorage`).

### Status bar (rodapé)

Mostra o caminho da seleção, por exemplo:

`Database › @localhost › meu_db › tables › users`

---

## Atalhos de teclado

| Atalho | Ação |
|--------|------|
| `Ctrl+Enter` | Executar statement no cursor |
| `Ctrl+Shift+N` | Nova aba SQL |
| `Ctrl+W` | Fechar aba ativa |
| `Ctrl+E` | Próxima aba |
| `Ctrl+B` | Mostrar/ocultar explorer |
| `Ctrl+Shift+B` | Mostrar/ocultar painel direito |
| `Ctrl+Shift+P` | Command palette (temas, ferramentas, etc.) |
| `Ctrl+Alt+L` | Formatar SQL (toolbar) |

---

## Rotas úteis

| URL | Comportamento |
|-----|----------------|
| `/` | IDE principal |
| `/login` | Tela de conexão |
| `/query` | Redireciona para `/?tab=sql` |
| `/query-builder` | Redireciona para `/?tool=query-builder` |
| `/dump` | Redireciona para `/?tool=dump` |

---

## Solução de problemas

### `EADDRINUSE` na porta 3000

Outro processo já usa a API. No Windows:

```powershell
netstat -ano | findstr ":3000"
taskkill /PID <pid> /F
npm run dev
```

### Client sobe mas API não responde

Confirme que o server está em http://localhost:3000 e que `.env` não define `PORT` conflitante.

### Sessão expirada

Faça login de novo em `/login`. O token JWT é invalidado após logout ou erro de verificação.

### Upload de dump falha

Verifique permissão da pasta `UPLOAD_DIR` e se o database de destino foi selecionado no painel Dump.

---

## Estrutura do monorepo

```
Elendra/
├── client/          # React + Vite (:5173)
├── server/          # Express + API (:3000)
├── docs/            # Specs e memória do projeto
└── package.json     # npm workspaces
```

Documentação técnica para contribuidores: [AGENTS.md](AGENTS.md), [SPEC.md](SPEC.md), [docs/memory/STATE.md](docs/memory/STATE.md).

---

## Stack

- **Client:** React 18, TypeScript, shadcn/ui, Tailwind, Zustand, React Query, Monaco Editor  
- **Server:** Express, TypeScript, mysql2 / pg / mariadb, Socket.io, JWT  
