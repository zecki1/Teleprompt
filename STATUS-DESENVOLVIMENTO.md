# Status do Desenvolvimento — Teleprompt

> Última atualização: **13/08/2026**
> Visão geral da migração para .NET e o estado atual do projeto (backend + frontend).

---

## 0. Fase em andamento — Remoção total do Firebase (Firestore/Auth)

> **Iniciada em 13/08/2026.** Objetivo: migrar TODAS as páginas, componentes, serviços e libs
> que ainda leem/escrevem no Firestore para a camada `src/api/*` (back-end .NET + SQL Server local /
> Azure SQL), para então **remover o pacote `firebase`** e os arquivos `src/lib/firebase*.ts`.
> Depois disso o app passa a depender 100% do backend local.

### 0.1 Escopo da remoção

| Item | Situação |
|---|---|
| Pacote `firebase-admin` | ✅ Removido |
| Pacote `@vercel/blob` | ✅ Removido |
| Rota `src/app/api/upload/route.ts` (Vercel Blob) | ✅ Removido |
| `src/lib/firebase-admin.ts`, `firestore-backup/restore.ts`, `migrate-scripts/workspace.ts` | ✅ Removidos |
| Pacote `firebase` (client) | 🔄 **A remover — pendente da migração** |
| Páginas com Firestore (dashboard, projects, editor, tp, s, relatorio, admin, activities, profile) | 🔄 **Em migração** |
| Componentes (DebugLogsPanel, BulkAssignDialog, CommentsPanel, VersionHistory, ErrorReporter, RecordingOrderPanel) | 🔄 **Em migração** |
| Services/libs Firestore (projects, users, presenters, workspaceService, demo, activity, debug-log, revert, versions, pathUtils, firebase, firebase-utils, migrate-activities) | 🔄 **Em migração** |
| `src/lib/node-empty.js` + shim no `next.config.ts` | ⏳ Remover após o pacote `firebase` |

> **Banco de dados**: a partir daqui o app usa somente o back-end .NET (SQLite em dev /
> SQL Server em prod — "pacote local com SQL Server"), **sem Firestore**.

---

## 1. O que foi feito

### 1.1 Separação frontend/backend

- O projeto agora tem **duas partes independentes**:
  - **`backend/`** — ASP.NET Core Web API (.NET 10, C#) em camadas:
    `Teleprompt.Domain` → `Teleprompt.Application` → `Teleprompt.Infrastructure` → `Teleprompt.Api`.
  - **raiz** — Next.js 16 / React 19 / TypeScript, agora **somente apresentação**.
- Criada a camada **`src/api/*`** no frontend: cliente HTTP tipado (REST) + wrapper SignalR,
  espelhando as DTOs do backend (`src/api/types.ts` ↔ `Teleprompt.Application/Dtos/Contracts.cs`).

### 1.2 Backend .NET (pasta `backend/`)

- **Auth (Identity + JWT)**: `register`, `login`, `me`, `refresh` (rolling JWT), `logout`;
  roles (Estagiário, Editor, Revisor, Admin, SuperAdmin) + matriz de permissões.
- **Workspaces**: criar, listar os meus, entrar via token/convite, adicionar/listar membros.
- **Projetos**: CRUD + listar roteiros de um projeto.
- **Roteiros (Scripts)**: CRUD, **parser de cenas** (marcadores `[Locução]`, `[Let]`, etc.),
  **versões** (snapshot append-only + revert), **comentários**, **checklist**, **lock/unlock** de edição.
- **Teleprompter (TP)**: criar/buscar/atualizar sessão, marcar como gravado.
- **Teams, Presenters**: CRUD + membros.
- **Usuários/Admin**: listar usuários, atualizar perfil e permissões; relatórios; atividades;
  debug-logs e error-reports (admin).
- **Export**: roteiro em JSON (implementado) e PPT/Word (esboço com endpoints).
- **Upload**: endpoint multipart implementado.
- **Realtime**: hubs SignalR `/hubs/script` (edição colaborativa) e `/hubs/tp` (teleprompter).
- **Segurança**: RLS (Row-Level Security) por workspace no SQL Server, soft-delete, CORS restrito,
  políticas de autorização, refresh automático no frontend.

### 1.3 Frontend

- **Autenticação trocada do Firebase para a API .NET**:
  - `src/contexts/AuthContext.tsx` agora usa `src/api/auth.ts` (login/registro/me/logout).
  - `src/components/auth/SigninWithPassword.tsx` e `SignupWithPassword.tsx` usam a API.
  - `src/middleware.ts` protege rotas com o cookie `tp_token` (gravado pelo `src/api/client.ts`).
  - Removida a dependência do `firebase/auth` do fluxo de login (o SDK ainda está instalado para
    dados — ver "O que falta").
- **Documentação**: `README.md` e `README-PLANO.NET.md` atualizados com o estado da migração.

### 1.5 Remoção de dependências Vercel/Firebase (parcial)

- **Removido** o pacote `@vercel/blob` e **removido** o pacote `firebase-admin`.
- **Removidos os arquivos mortos** que dependiam deles:
  - `src/app/api/upload/route.ts` (roteiro de upload Vercel Blob + Firebase — sem uso no app)
  - `src/lib/firebase-admin.ts`, `src/lib/firestore-backup.ts`, `src/lib/firestore-restore.ts`,
    `src/lib/migrate-scripts.ts`, `src/lib/migrate-workspace.ts` (utilitários não referenciados)
- **Foco em Azure**: a API .NET já expõe `UploadController` (disco/Azure Blob em `Storage:LocalPath`)
  para substituir o upload antigo. O pacote `firebase` (client) ainda está instalado e será removido
  quando a migração de dados das páginas terminar (ver §4).
- **Guias**: instruções de **macOS** adicionadas ao `README-PLANO.NET.md`.

### 1.4 Infra de desenvolvimento

- Instalado **.NET SDK 10** na máquina.
- Build da solução **limpo** (0 erros, 0 avisos) e **14/14 testes xUnit** verdes.
- Banco local **SQLite** (`backend/src/Teleprompt.Api/teleprompt-dev.db`) criado via migrations
  automáticas no startup (todas as tabelas presentes).
- Corrigidos avisos de build: nulidade em `WorkspacesController`, SQL injection em
  `RlsSetup.cs` (raw paramétrico) e vulnerabilidade SSH.NET (pacote atualizado nos testes).
- Adicionado `backend/.gitignore` (bin/obj, *.db) e removido do controle de versão os artefatos
  de build que haviam sido commitados (alterações em stage, **não commitadas**).

---

## 2. Backend × Frontend — verificação da comunicação

### 2.1 Status: conectados no que importa

- O **login/registro/perfil** do frontend **já conversa com o backend** (AuthContext → API .NET).
- A camada `src/api/*` está pronta e **o contrato foi verificado rota por rota** (tabela abaixo).
- **As páginas de dados (dashboard, projetos, editor, TP, relatórios, admin) ainda leem o
  Firebase** — a migração delas para `src/api/*` é o próximo passo (ver §4).

### 2.2 Contrato verificado (frontend `src/api/*` → backend `Controllers/*`)

| Módulo frontend | Rota(s) usada(s) | Controller backend | Status |
|---|---|---|---|
| `auth.ts` | POST `/auth/register`, `/auth/login`, GET `/auth/me`, POST `/auth/logout` | `AuthController` | ✅ |
| `client.ts` (refresh) | POST `/auth/refresh` | `AuthController` | ✅ |
| `workspace.ts` | `/workspaces/mine`, `/workspaces`, `/workspaces/{id}` (GET/PUT), `/workspaces/{id}/members` (GET/POST), POST `/workspaces/join` | `WorkspacesController` | ✅ |
| `projects.ts` | `/projects` CRUD + GET `/projects/{id}/scripts` | `ProjectsController` | ✅ |
| `scripts.ts` | `/scripts` CRUD, POST `/scripts/parse`, POST `/scripts/{id}/lock`, `/unlock` | `ScriptsController` | ✅ |
| `versions.ts` | GET/POST `/scripts/{id}/versions`, POST `.../versions/{n}/revert` | `ScriptsController` | ✅ |
| `comments.ts` | GET/POST `/scripts/{id}/comments`, PUT `.../comments/{cid}`, GET/PUT `.../checklist` | `ScriptsController` | ✅ |
| `tp.ts` | `/tp/sessions` (POST/GET/PUT), POST `/tp/sessions/{id}/recorded` | `TpController` | ✅ |
| `reports.ts` | GET `/reports` | `ReportsController` | ✅ |
| `activities.ts` | GET `/activities` | `ActivitiesController` | ✅ |
| `users.ts` | `/users`, `/users/{id}`, PUT `/users/me`, PUT `/users/{id}/permissions`, DELETE `/users/{id}` | `UsersController` | ✅ |
| `teams.ts` | `/teams` CRUD, `/teams/{id}/members` (GET/POST) | `TeamsController` | ✅ |
| `presenters.ts` | `/presenters` CRUD | `PresentersController` | ✅ |
| `realtime.ts` | hubs `/hubs/script` e `/hubs/tp` | `ScriptHub`, `TpHub` | ✅ (criados; ainda não consumidos) |

**Casamento dos tipos JSON**: o backend serializa em **camelCase** (padrão do ASP.NET Core MVC),
exatamente o que `src/api/types.ts` espera (`displayName`, `workspaceId`, `scrollStateJson`, …).
A serialização foi validada em teste E2E real da API.

**Campos opcionais alinhados**: `CreateScriptRequest.Content`, `CreateTpSessionRequest.Mode` e
`.Speed` foram ajustados no backend para aceitar omissão, casando com os tipos opcionais do frontend.

### 2.3 Como rodar os dois juntos (verificação manual)

```bash
# 1. Backend (porta 5026)
cd backend
dotnet run --project src/Teleprompt.Api

# 2. Frontend (Next.js, porta 3000)
# raiz do projeto
npm run dev
```

- Configure `.env.local` (copie de `.env.example`):
  `NEXT_PUBLIC_API_URL=http://localhost:5026`
- Acesse `http://localhost:3000/login`, crie uma conta → login → deve autenticar pela API .NET.
- Usuário demo do seed: `demo@teleprompt.app` / `Demo@12345`.

---

## 3. Como testar

### 3.1 Frontend (raiz do projeto)

```bash
npm run dev          # desenvolvimento
npx tsc --noEmit     # type-check
npm test             # 71 testes Vitest (9 arquivos) — verdes
npm run lint         # lint (8 erros pré-existentes em páginas antigas — não relacionados à migração)
```

### 3.2 Backend (pasta `backend/`)

```bash
dotnet build Teleprompt.slnx        # build limpo (0 avisos/erros)
dotnet test Teleprompt.slnx         # 14/14 testes xUnit verdes
dotnet run --project src/Teleprompt.Api   # API em http://localhost:5026
```

- **Smoke test E2E** (fluxo completo via HTTP): arquivo
  `backend/src/Teleprompt.Api/Teleprompt.Api.http` (registro → login → workspace → projeto →
  roteiro → versões → comentários → checklist → export → sessão TP → refresh).
- **Swagger**: com a API rodando, acesse `http://localhost:5026/swagger`.

### 3.3 SQL Server (produção/staging)

O ambiente de dev usa **SQLite** (sem dependência). Para SQL Server local (Testcontainers):

```bash
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=REDACTED_SQL_CREDENTIAL" -p 1433:1433 -d mcr.microsoft.com/mssql/server:2022-latest
```

- No SQL Server, o startup aplica migrations + RLS + seed automaticamente.

---

## 4. O que falta

### 4.1 Migração do acesso a dados das páginas (Firestore → `src/api/*`)

**Pré-requisito para remover o pacote `firebase`.** As páginas/componentes abaixo **ainda
leem/escrevem direto no Firestore** (importam `@/lib/firebase`) e devem migrar para a camada
`src/api/*` (todos os endpoints já existem no backend):

- `src/app/dashboard/page.tsx` · `src/app/projects/page.tsx` · `src/app/editor/[id]/page.tsx`
- `src/app/tp/[id]/page.tsx` · `src/app/s/[id]/page.tsx` · `src/app/relatorio/page.tsx`
- `src/app/admin/page.tsx` · `src/app/activities/page.tsx` · `src/app/profile/page.tsx`
- `src/components/admin/DebugLogsPanel.tsx`, `BulkAssignDialog.tsx`
- `src/components/tp/CommentsPanel.tsx`, `tp/VersionHistory.tsx`, `tp/ErrorReporter.tsx`,
  `tp/RecordingOrderPanel.tsx`
- `src/services/*` (projects.ts, users.ts, presenters.ts, workspaceService.ts, demo.ts)
- `src/lib/*` (activity.ts, debug-log.ts, revert.ts, versions.ts, pathUtils.ts, firebase.ts,
  firebase-utils.ts, migrate-activities.ts)

> **Atenção ao shape dos dados**: as páginas usam `ScriptDoc`/`Project`/`Workspace` (do Firestore)
> com campos que não existem nas DTOs do backend (`projectName`, `folder/path`, `editorName`,
> `status` em PT etc.). A migração deve incluir **mapeamento DTO → shape atual** para não quebrar
> a UI, e os `onSnapshot` (tempo real) precisam ser substituídos por polling ou por SignalR
> (`src/api/realtime.ts` já está pronto).

### 4.2 Consumir endpoints novos pelo frontend

- **Export PPT/Word** (`ExportController`) — frontend ainda não consome.
- **Upload** (`UploadController`) — a rota antiga (`/api/upload`, Vercel Blob/Firebase) foi
  removida; o componente que fará upload deve chamar `POST /api/v1/upload` (disco/Azure Blob).
- **Admin** (`AdminController` debug-logs / error-reports).
- **Realtime (SignalR)** — hubs prontos (`src/api/realtime.ts`), mas as páginas ainda usam
  `onSnapshot` do Firestore para sincronização.

### 4.3 Remoção completa do Firebase

- Após migrar as páginas/componentes/services (§4.1), remover o pacote `firebase` e os arquivos
  `src/lib/firebase.ts`, `src/lib/firebase-utils.ts`, `src/services/demo.ts` e
  `src/lib/migrate-activities.ts` (a seção demo do admin deve passar a criar o usuário demo via
  `POST /api/v1/auth/register` + seed no backend).
- **`firebase-admin` e `@vercel/blob` já foram removidos.**

### 4.4 Pendências de produto/infra (foco em Microsoft Azure)

- **Storage**: decidir/implementar **Azure Blob Storage** no `UploadController` (hoje grava em
  disco — `Storage:LocalPath`).
- **Deploy**: VM Azure + SQL Server (Azure SQL ou SQL Server na VM) — decisões §15 do
  `PLANEJAMENTO-NET.md`; nenhum deploy em Vercel.
- POC do realtime do teleprompter (2 abas sincronizadas) com SignalR.
- Cronograma completo das 7 fases (§13 do `PLANEJAMENTO-NET.md`).
- Lint do frontend: 8 erros pré-existentes em páginas antigas (não relacionados à migração).

---

## 5. Arquivos de referência

| Arquivo | Conteúdo |
|---|---|
| [`README-PLANO.NET.md`](./README-PLANO.NET.md) | Resumo do plano .NET + estado atual + próximos passos |
| [`PLANEJAMENTO-NET.md`](./PLANEJAMENTO-NET.md) | Planejamento técnico completo (ADR, modelo, endpoints, cronograma) |
| [`README.md`](./README.md) | Visão geral do produto |
| `backend/src/Teleprompt.Api/Teleprompt.Api.http` | Coleção de requisições para smoke test |
