# Planejamento .NET — Teleprompt

Estratégia técnica para reconstruir a aplicação **Teleprompt** em **greenfield** (do zero), mantendo **Next.js apenas como frontend** e levando **backend, regras de negócio, autenticação e banco de dados para .NET (C#) + SQL Server**.

> Documento de planejamento v1.0 — aprovado para execução em fases.
> Estado: **em planejamento** · Realtime obrigatório · Zero Firebase · Deploy em VM Azure.

---

## 1. Resumo Executivo

| Item | Decisão |
|---|---|
| **Arquitetura** | Frontend (Next.js) + API (ASP.NET Core) + SQL Server |
| **Frontend** | Next.js 16 + React 19 + TypeScript + Tailwind + TanStack Query |
| **Backend** | ASP.NET Core Web API (.NET 9), C# |
| **Banco de dados** | SQL Server + EF Core |
| **Realtime** | SignalR (WebSocket) para edição colaborativa e teleprompter |
| **Autenticação** | ASP.NET Core Identity (e-mail/senha + Google OAuth) |
| **Armazenamento de arquivos** | Azure Blob Storage ou disco da VM |
| **Hospedagem** | VM Azure em ambiente controlado (Windows/IIS ou Linux/Nginx) |
| **Dados** | Greenfield — sem migração do Firestore |
| **Firebase** | Removido por completo (auth, banco, storage) |

**Princípio central:** o frontend é apenas apresentação e **nunca acessa o banco nem executa regra de negócio**. Ele consome a API via REST (HTTPS) e recebe atualizações em tempo real via SignalR. Toda autorização, validação e integridade dos dados são garantidas no servidor (.NET) e no banco (SQL Server).

---

## 2. Decisões de Arquitetura (ADRs)

| # | Decisão | Alternativa descartada | Motivo |
|---|---|---|---|
| ADR-01 | **Frontend em Next.js/React** | Blazor Server / Razor Pages | A UI é pesada em interação (drag-and-drop, animação 60fps do teleprompter, exportação PPT/Word, gráficos). O ecossistema React/TS tem bibliotecas maduras para tudo isso; no .NET seriam reimplementações via JS Interop. |
| ADR-02 | **Backend em ASP.NET Core (C#)** | Node.js / Firebase | Padronização da empresa (obrigatório por contrato) + SQL Server + Identity + SignalR nativos. |
| ADR-03 | **SQL Server com EF Core** | NoSQL (Firestore) | Modelo relacional ideal para o domínio (usuários → workspaces → projetos → roteiros → versões → comentários); integridade, transações, RLS e auditoria. |
| ADR-04 | **Realtime via SignalR** | Polling / SSE | Edição colaborativa, espelhos do teleprompter e controle remoto exigem push bidirecional. SignalR é tecnologia do próprio .NET. |
| ADR-05 | **Auth com ASP.NET Core Identity** | Firebase Auth / JWT custom | Padrão empresarial, e-mail/senha + Google, pronto para SSO corporativo futuro. |
| ADR-06 | **Greenfield (sem migração)** | Migração Firestore → SQL | A base atual não tem volume crítico; recomeçar o schema do zero reduz risco e simplifica o versionamento. |
| ADR-07 | **VM própria** | PaaS (App Service/Vercel) | Requisito de ambiente controlado e controle total de infraestrutura. |
| ADR-08 | **Frontend sem acesso ao banco** | Queries diretas no client | Elimina a superfície de segurança do antigo modelo cliente-Firestore; autorização 100% server-side. |

---

## 3. Desenho da Arquitetura

```
┌──────────────────────────────────────────────────────────┐
│                        Navegador                         │
│   (2 abas: operador + espelho do teleprompter)           │
└──────────────────────┬───────────────────────────────────┘
                       │
        HTTPS/REST ─────┴───── WebSocket (SignalR)
                       │
┌──────────────────────▼───────────────────────────────────┐
│                 FRONTEND — Next.js                       │
│  • Páginas e componentes React (apresentação)            │
│  • Validação de formulário no client (Zod — UX)          │
│  • TanStack Query (cache, optimistic updates)            │
│  • @microsoft/signalr (client do realtime)               │
│  • SEM acesso a banco · SEM segredo · SEM regra de neg.  │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────┐
│            BACKEND — ASP.NET Core Web API                │
│  • Controllers (REST) + Hubs (SignalR)                   │
│  • ASP.NET Core Identity (authN)                         │
│  • Authorization: roles + claims + filters (authZ)       │
│  • FluentValidation (validação server-side)              │
│  • EF Core (repositórios) + Transações                   │
│  • Serviços de domínio (parser, versões, relatórios)     │
│  • Exportação PPT/Word (OpenXML SDK)                     │
│  • Upload → Azure Blob Storage / disco                    │
└──────────────────────┬───────────────────────────────────┘
                       │  (EF Core / ADO.NET, parametrizado)
┌──────────────────────▼───────────────────────────────────┐
│              SQL SERVER (Azure VM ou Azure SQL)          │
│  • Constraints, triggers, RLS por workspace              │
│  • Stored procedures p/ operações sensíveis              │
│  • Colunas de auditoria + soft-delete                    │
│  • Backups agendados                                     │
└──────────────────────────────────────────────────────────┘
```

### Fluxos principais

1. **Login:** Next → `POST /api/v1/auth/login` → Identity valida → emite cookie/JWT → frontend guarda no `httpOnly` cookie.
2. **CRUD:** Next → REST → API valida (FluentValidation + autorização) → EF Core persiste → resposta.
3. **Realtime:** cliente conecta no Hub (`/hubs/script`, `/hubs/tp`) → publica eventos → SignalR distribui para os assinantes (espelhos, presença de edição, controle remoto).

---

## 4. Estrutura do Projeto

### Solução .NET (backend)

```
Teleprompt/
├── src/
│   ├── Teleprompt.Api/                 # Web API, controllers, hubs, DI, middleware
│   │   ├── Controllers/
│   │   ├── Hubs/                       # ScriptHub, TpHub
│   │   ├── Middleware/                 # rate limit, exception handler, RLS context
│   │   └── Program.cs
│   ├── Teleprompt.Application/         # casos de uso, DTOs, validators
│   ├── Teleprompt.Domain/              # entidades, enums (Roles, Status, Bucket), regras puras
│   ├── Teleprompt.Infrastructure/      # EF Core, DbContext, migrations, repositórios, Blob
│   └── Teleprompt.Tests/               # unit (xUnit) + integração (Testcontainers)
├── frontend/                           # Next.js (extraído/recriado)
│   ├── src/
│   │   ├── app/                        # rotas/páginas
│   │   ├── api/                        # camada de consumo da API .NET
│   │   ├── components/
│   │   └── hooks/
└── deploy/                             # scripts de provisionamento da VM
```

### Frontend Next.js (camada de consumo da API)

```
src/api/
├── client.ts            # fetch wrapper com cookie + refresh + timeouts
├── auth.ts              # login, logout, me, google
├── users.ts  workspace.ts  teams.ts
├── projects.ts  scripts.ts  versions.ts  comments.ts
├── tp.ts  activities.ts  presenters.ts  reports.ts
└── realtime.ts          # @microsoft/signalr (connect, subscribe, call)
```

> Regra: os arquivos de `src/services/*` atuais (Firestore) são substituídos por esta camada `src/api/*` que fala com o backend .NET.

---

## 5. Mapa do Sistema

### 5.1 Rotas do Frontend (Next.js)

| Rota | Página | Acesso |
|---|---|---|
| `/` | Landing / redireciona | Público |
| `/login` | Autenticação (e-mail/senha, Google, demo) | Público |
| `/dashboard` | Visão geral: projetos, metas, atividades, tour | Usuário logado |
| `/projects` | Lista de projetos (filtro, busca, status, buckets) | Usuário logado |
| `/editor/[id]` | Editor de roteiro — cenas, marcadores, ortografia, comentários, versões | Quem pode editar |
| `/s/[id]` | Página pública de status/aprovação (link compartilhável) | Público (com link) |
| `/tp/[id]` | Teleprompter — rolagem, atalhos, espelhos, controle remoto, gravação | Dono/convidado |
| `/admin` | Painel administrativo: logs, permissões, demo setup | canViewAdmin |
| `/relatorio` | Relatórios | canViewReports |
| `/activities` | Histórico de atividades | canViewActivityHistory |
| `/profile` | Perfil do usuário | Usuário logado |

### 5.2 Endpoints REST (ASP.NET Core)

**Auth & Usuários**

| Verbo | Rota | Descrição |
|---|---|---|
| POST | `/api/v1/auth/register` | Criar conta (e-mail/senha) |
| POST | `/api/v1/auth/login` | Login, emite cookie/JWT |
| POST | `/api/v1/auth/google` | Login OAuth Google (troca do token do provider) |
| POST | `/api/v1/auth/refresh` | Renova sessão |
| POST | `/api/v1/auth/logout` | Encerra sessão |
| GET | `/api/v1/auth/me` | Perfil da sessão atual |
| GET | `/api/v1/users` | Lista usuários (admin/gestão) |
| GET/PUT | `/api/v1/users/{id}` | Perfil |
| PUT | `/api/v1/users/{id}/permissions` | Gerencia permissões (canManagePermissions) |
| DELETE | `/api/v1/users/{id}` | Exclusão (isSuperAdmin) |

**Workspaces & Times**

| Verbo | Rota | Descrição |
|---|---|---|
| POST | `/api/v1/workspaces` | Criar workspace |
| GET/PUT | `/api/v1/workspaces/{id}` | Detalhes/atualizar |
| GET | `/api/v1/workspaces/{id}/members` | Membros |
| POST | `/api/v1/workspaces/{id}/members` | Adicionar membro |
| POST | `/api/v1/workspaces/join` | Entrar via token/convite |
| GET/POST/PUT/DELETE | `/api/v1/teams` · `/api/v1/teams/{id}` | Times |
| GET/POST/DELETE | `/api/v1/teams/{id}/members` | Membros do time |

**Projetos & Roteiros**

| Verbo | Rota | Descrição |
|---|---|---|
| GET/POST | `/api/v1/projects` | Listar/criar projetos |
| GET/PUT/DELETE | `/api/v1/projects/{id}` | Detalhe/atualizar/excluir (soft-delete) |
| GET | `/api/v1/projects/{id}/scripts` | Roteiros do projeto |
| GET/POST | `/api/v1/scripts` | Listar/criar roteiros |
| GET/PUT/DELETE | `/api/v1/scripts/{id}` | Detalhe/atualizar/excluir |
| GET | `/api/v1/scripts/{id}/versions` | Histórico de versões |
| POST | `/api/v1/scripts/{id}/versions` | Criar versão |
| POST | `/api/v1/scripts/{id}/versions/{v}/revert` | Reverter (canRevert) |
| GET/POST | `/api/v1/scripts/{id}/comments` | Comentários |
| PUT | `/api/v1/scripts/{id}/comments/{c}` | Resolver/editar comentário |
| GET/PUT | `/api/v1/scripts/{id}/checklist` | Checklist de revisão |
| POST | `/api/v1/scripts/{id}/lock` · `/unlock` | Bloqueio de edição (editing session) |

**Teleprompter, Relatórios e Demais**

| Verbo | Rota | Descrição |
|---|---|---|
| POST/GET | `/api/v1/tp/sessions` · `/api/v1/tp/sessions/{id}` | Sessões de teleprompter |
| PUT | `/api/v1/tp/sessions/{id}` | Estado (velocidade, modo, posição) |
| POST | `/api/v1/tp/sessions/{id}/recorded` | "Marcar como gravado" |
| GET | `/api/v1/activities` | Histórico de atividades (paginado) |
| GET | `/api/v1/reports` | Relatório com métricas/taxa de crescimento |
| GET/POST/PUT/DELETE | `/api/v1/presenters` | Apresentadores |
| GET | `/api/v1/admin/debug-logs` | Logs de debug (canViewDebugLogs) |
| GET/POST/DELETE | `/api/v1/admin/error-reports` | Relatórios de erro |
| POST | `/api/v1/upload` | Upload seguro → Azure Blob/disco (auth JWT, tipo e 10MB) |
| GET | `/api/v1/export/scripts/{id}/ppt` · `/word` · `/json` | Exportações |

### 5.3 Hubs SignalR (Realtime)

**Hub `script` (`/hubs/script`) — edição colaborativa**

| Evento | Direção | Descrição |
|---|---|---|
| `JoinScript(scriptId)` | cliente → hub | Entrar na sessão do roteiro |
| `LeaveScript(scriptId)` | cliente → hub | Sair da sessão |
| `ContentChanged(scriptId, delta, user)` | cliente → hub | Atualização de conteúdo (broadcast) |
| `CursorMoved(scriptId, position, user)` | cliente → hub | Cursor/presença de edição |
| `PresenceChanged(scriptId, users)` | hub → clientes | Quem está online no roteiro |
| `CommentAdded(comment)` / `CommentResolved(id)` | cliente → hub | Comentários ao vivo |
| `VersionCreated(version)` | hub → clientes | Nova versão publicada |
| `LockChanged(scriptId, lockedBy)` | hub → clientes | Alguém bloqueou/liberou edição |
| `ChecklistUpdated(scriptId, items)` | hub → clientes | Checklist sincronizado |

**Hub `tp` (`/hubs/tp`) — teleprompter**

| Evento | Direção | Descrição |
|---|---|---|
| `JoinTp(tpSessionId, role)` | cliente → hub | Entrar (operador / espelho) |
| `ScrollStateChanged(position, speed)` | hub → clientes | Espelhos sincronizados |
| `ModeChanged(mode)` | hub → clientes | Modo de rolagem (parágrafo/cena/…) |
| `RemoteCommand(cmd)` | cliente → hub | Controle remoto da rolagem |
| `Recorded(scriptId)` | hub → clientes | "Marcar como gravado" + próximo passo |
| `OrderChanged(recordingOrder)` | hub → clientes | Ordem de gravação por pasta |

---

## 6. Modelo de Dados (SQL Server)

### 6.1 Entidades

```
workspaces ─┬─ projects ── scripts ──┬─ versions
            │    │                  ├─ comments
            │    │                  └─ checklist_items
            ├─ teams ── team_members
            ├─ users ── workspace_members (N:N)
            └─ presenters
users ────── scripts (created_by / locked_by)
activities ─ scripts (referência auditável)
tp_sessions ─ scripts
error_reports ─ users
debug_logs
```

### 6.2 Tabelas principais

| Tabela | Colunas essenciais | Notas |
|---|---|---|
| `users` | Id, Email (unique), PasswordHash, DisplayName, Role, PermissionFlags, Status, AvatarUrl, CreatedAt, UpdatedAt, DeletedAt | Identity + permissões |
| `workspaces` | Id, Name, OwnerId (FK), Plan, TrialEndsAt, RoleLabels (JSON), CreatedAt, UpdatedAt, DeletedAt | |
| `workspace_members` | WorkspaceId, UserId, JoinedAt | N:N |
| `teams` | Id, Name, Acronym, WorkspaceId (FK) | |
| `team_members` | TeamId, UserId | N:N |
| `presenters` | Id, Name, Email, Phone, WorkspaceId (FK), CreatedAt | |
| `projects` | Id, Name, Code, ExternalLink, Links (JSON), WorkspaceId (FK), Status, Bucket, CreatedAt, UpdatedAt, DeletedAt | |
| `scripts` | Id, ProjectId (FK), WorkspaceId (FK), Title, Content (NVARCHAR(MAX)), Status, IsLocked, LockedBy (FK), LockedUntil, CreatedBy (FK), Version, CreatedAt, UpdatedAt, DeletedAt | Contém o texto com marcadores |
| `versions` | Id, ScriptId (FK), VersionNumber, Content, CreatedBy (FK), CreatedAt | Imutável (append-only) |
| `comments` | Id, ScriptId (FK), AuthorId (FK), Body, IsResolved, CreatedAt, DeletedAt | |
| `checklist_items` | Id, ScriptId (FK), Label, Required, IsChecked, CheckedBy (FK), CheckedAt | |
| `activities` | Id, WorkspaceId (FK), UserId (FK), Type, Description, Metadata (JSON), CreatedAt | Append-only |
| `tp_sessions` | Id, ScriptId (FK), OwnerId (FK), Mode, Speed, ScrollState (JSON), CreatedAt, UpdatedAt | |
| `error_reports` | Id, UserId (FK), ScreenshotUrl, Description, Logs (JSON), Status, CreatedAt | |
| `debug_logs` | Id, Level, Source, Message, Metadata (JSON), CreatedAt | |

### 6.3 Índices recomendados

- `users(Email)` — unique
- `scripts(WorkspaceId, DeletedAt)`, `scripts(ProjectId)`
- `versions(ScriptId, VersionNumber DESC)`
- `comments(ScriptId, CreatedAt)`
- `activities(WorkspaceId, CreatedAt DESC)` — paginação de histórico
- `projects(WorkspaceId, Status)`, `projects(WorkspaceId, Bucket)`
- `tp_sessions(ScriptId)`

### 6.4 Auditoria

- Colunas `CreatedBy`, `CreatedAt`, `UpdatedAt`, `DeletedAt` em todas as tabelas de negócio.
- **Soft-delete** padrão (filtro global no EF Core): nada é apagado fisicamente, exceto logs/versões conforme política.
- **Versões append-only**: todo conteúdo alterado gera uma linha em `versions` antes do update.
- Trigger de auditoria opcional para tabelas críticas (`scripts`, `permissions`).

---

## 7. Quem Pode o Quê (Matriz de Permissões)

### 7.1 Papéis

`SuperAdmin, Diretor, Coordenador, Orientador, Docente, Especialista, Assistente, Analista, Tutor, Monitor, Técnico, Estagiário, editor, validador, publico`

### 7.2 Capacidades (claims/permission flags)

| Flag | Capacidade |
|---|---|
| `isSuperAdmin` | Acesso total; exclusões; gerenciamento de permissões; debug |
| `canManagePermissions` | Gerenciar usuários, times e permissões (admin) |
| `canCollaborate` | Participar e colaborar em roteiros |
| `isEditor` | Editar roteiros (papel `editor`) |
| `isRevisor` | Aprovar/revisar (papel `validador`) |
| `canRevert` | Reverter para versões anteriores |
| `canViewAdmin` | Acessar painel administrativo |
| `canViewReports` | Acessar relatórios |
| `canViewActivityHistory` | Ver histórico de atividades |
| `canViewDebugLogs` | Ler logs de debug e relatórios de erro |
| `canAssign` | Atribuir tarefas/projetos |
| `requiresChecklist` | Exige checklist antes de concluir |

### 7.3 Matriz Papel × Permissão

| Papel | Super | Perm. | Colab | Editor | Revisor | Revert | Admin | Reports | Atividades | Debug | Assign |
|---|---|---|---|---|---|---|---|---|---|---|---|
| SuperAdmin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Diretor | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Coordenador | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| Orientador | — | — | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | — | ✅ |
| Docente | — | — | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | — | ✅ |
| Especialista | — | — | ✅ | ✅ | ✅ | — | — | ✅ | ✅ | — | — |
| Assistente | — | — | ✅ | ✅ | — | — | — | — | — | — | — |
| Analista | — | — | ✅ | ✅ | — | — | — | ✅ | ✅ | — | — |
| Tutor | — | — | ✅ | ✅ | — | — | — | — | — | — | — |
| Monitor | — | — | ✅ | ✅ | — | — | — | — | — | — | — |
| Técnico | — | — | ✅ | ✅ | — | — | — | — | — | — | — |
| Estagiário | — | — | ✅ | ✅ | — | — | — | — | — | — | — |
| editor | — | — | — | ✅ | — | — | — | — | — | — | — |
| validador | — | — | — | — | ✅ | — | — | — | — | — | — |
| publico | — | — | — | — | — | — | — | — | — | — | — |

> Valores iniciais da matriz; o `SuperAdmin` pode conceder/revogar flags por usuário (overrides), como na lógica atual de `users`.

### 7.4 Lógica de edição (portada do app atual)

Quem pode editar um roteiro: `isSuperAdmin` **OU** papel de gestão/docência/técnica (Diretor, Coordenador, Orientador, Docente, Especialista, Assistente, Analista, Tutor, Monitor, Técnico, Estagiário, editor, validador) **E** o roteiro não está bloqueado (ou status = rascunho).

---

## 8. Travas Dentro do Banco (Defesa em Profundidade)

O banco é a **última barreira**. Mesmo que a API seja burlada, o SQL impede o erro.

| Camada | Mecanismo | Objetivo |
|---|---|---|
| **Integridade** | `FOREIGN KEY`, `CHECK`, `UNIQUE` constraints | Impedir dados órfãos/ inválidos (ex.: `users.Email` único) |
| **Auditoria** | Triggers + colunas `CreatedBy/At`, `UpdatedAt`, `DeletedAt` | Registro imutável de mudanças críticas |
| **Soft-delete** | Filtro global EF (`DeletedAt IS NULL`) + `INSTEAD OF DELETE` em tabelas críticas | Nada some; recuperação possível |
| **RLS (Row-Level Security)** | Security policy por `workspace_id` usando `SESSION_CONTEXT('WorkspaceId')`/`UserId` setado pela API após autenticação | **Isolamento por workspace**: cada query só enxerga linhas do seu workspace, mesmo com SQL direto |
| **Operações sensíveis** | Stored procedures (`sp_revert_version`, `sp_create_version`, `sp_delete_project_cascade`, `sp_grant_permissions`) | Regras críticas versionadas e aplicadas no banco, com `EXECUTE AS`/granularidade mínima |
| **Dados sensíveis** | `ENCRYPTED` colunas (Always Encrypted p/ dados sensíveis) | Proteção em repouso |
| **Tratamento de concorrência** | Rowversion/optimistic concurrency (token em `scripts`) | Duas edições simultâneas não se sobrescrevem |
| **Backups** | Plano agendado + restauração testada | RPO/RTO definidos |

> A autorização **em C#** (filters de claims) resolve o "quem"; a RLS no SQL resolve o "o que do workspace" mesmo em caso de bug na API. Juntas, replicam e superam o antigo `firestore.rules`.

---

## 9. Catálogo de Funcionalidades

### Editor de roteiro
- Roteiro dividido em **cenas** com campo **Tempo**.
- **Marcadores suportados** pelo parser (portar `parser.ts`): `[Cena]`, `[Loc]`, `[Let]`, `[Pron]`, `[Img]`, `[Url]`, `[Abe]`, `[Enc]`.
- Renumeração automática de letterings/pronúncias (Let1, Pron1, …).
- **Verificação ortográfica pt-BR** por cena (dicionário server-side via NHunspell ou endpoint dedicado).
- **Comentários + checklist de revisão** (obrigatório quando `requiresChecklist`).
- **Histórico de versões** com comparação, revert (se `canRevert`) e restaurar.
- Exportação/importação de texto e JSON; **geração de PPT** a partir do roteiro.

### Teleprompter (`/tp/[id]`)
- Rolagem por **parágrafo, cena, meio da cena ou avanço geral**.
- **Atalhos de teclado configuráveis**.
- **Velocidade** ajustável e persistente.
- **Espelhos sincronizados** (operador + tela de gravação) via SignalR.
- **Controle remoto** da rolagem.
- Árvore de pastas com **ordem de gravação por pasta**.
- **Painel de pronúncia** (fonética) antes de gravar.
- Modo tela cheia + "Marcar como gravado" (status + próximo passo).

### Organização
- **Workspaces** (membros, plano, `roleLabels`).
- **Times** e **pastas/árvore** de organização de roteiros.
- **Projetos** com status (aguardando, em andamento, concluído, pausado, atrasado, backlog) e **buckets** (Backlog, Em Andamento, Pausado, Em Revisão, Em Ajuste, Concluído).

### Confiabilidade
- **Watchdog de carregamento (25s)** + tela de erro sem conexão.
- **Reportar erro**: print da tela + logs recentes → `error_reports`.
- **Logging centralizado** → `debug_logs`.
- **Error boundary global**.

### Demonstração
- Setup de demo (`demo@teleprompt.app`) recriado no banco via seed/script.

---

## 10. Testes Automatizados

| Camada | Ferramenta | O que cobre |
|---|---|---|
| **Unit (backend)** | xUnit | Parser de marcadores, lógica de versões, permissões, cálculo de relatório, renumeração |
| **Integração (backend)** | xUnit + Testcontainers (SQL Server real em container) | EF Core mappings, transações, RLS por workspace, stored procedures |
| **API (contrato)** | WebApplicationFactory + Swagger/OpenAPI | Cada endpoint: 2xx/4xx, autorização por claim, validação FluentValidation |
| **E2E (frontend)** | Playwright | Login → criar projeto → roteiro com cenas → comentários → **teleprompter com 2 espelhos sincronizados** → exportação PPT |
| **Unit (frontend)** | Vitest (mantém os 71 casos atuais) | Utils, parser client, componentes isolados |
| **Realtime** | xUnit (SignalR client de teste) + Playwright (2 abas) | Concorrência de edição, espelho TP, controle remoto |

**Gate de qualidade (CI):** `dotnet test` + `vitest` + `playwright test` + lint obrigatórios antes de merge.

---

## 11. Auditoria de Segurança (Checklist OWASP aplicado)

| # | Controle | Implementação no novo backend |
|---|---|---|
| 1 | **Injeção SQL** | EF Core parametrizado; proibido SQL concat; stored procedures com `sp_executesql` parametrizado |
| 2 | **Autenticação** | Identity + política de senha forte + bloqueio após tentativas + MFA opcional |
| 3 | **Autorização** | Claims/roles + policy-based authorization + verificação por workspace |
| 4 | **RLS/defesa em profundidade** | Row-Level Security por `workspace_id` (ver seção 8) |
| 5 | **XSS** | React escapa output; CSP restritiva; `InputSanitizer` no server (HTML de conteúdo) |
| 6 | **CSRF** | Anti-forgery no cookie auth + SameSite=Strict |
| 7 | **CORS** | Origem restrita (domínio do frontend) |
| 8 | **Headers** | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` (câmera/mic/geo desabilitadas) |
| 9 | **Rate limiting** | Middleware (ex.: 20 req/min por IP em `/auth/*` e `/upload`) |
| 10 | **Upload seguro** | Validação de tipo + tamanho (10MB), armazenamento fora da web root (Blob), nome aleatório |
| 11 | **Segredos** | Azure Key Vault / secrets da VM; nunca no client; rotação periódica |
| 12 | **HTTPS/TLS** | Certificado real (Let's Encrypt ou Azure), HSTS |
| 13 | **Logging e monitoramento** | Logs estruturados (structured logging), alertas, telemetria |
| 14 | **Backup** | Agendado + restauração testada + retenção |
| 15 | **Dependências** | SCA (ex.: Dependabot/Snyk) + patch regular do .NET |

---

## 12. Deploy e Infraestrutura

### Opções de topologia (VM Azure — ambiente controlado)

| Topologia | Prós | Contras |
|---|---|---|
| **Windows + IIS** (API + Node/Next via iisnode/ARR) + SQL na mesma VM | Familiar para empresa Windows, tudo num lugar | Licença Windows; mais configuração p/ Node |
| **Linux + Nginx** (Kestrel + PM2/Next) + SQL (mesma VM ou Azure SQL) | Sem licença Windows; menor custo; containerização fácil | Menos familiar p/ equipe Windows |
| **SQL separado (Azure SQL)** | Backup/escala gerenciados; RLS nativo | Custo mensal; sai do "tudo na VM" |

### Requisitos mínimos da VM
- 2 vCPU / 8 GB RAM (início), expandível.
- SQL Server: considerar **Azure Hybrid Benefit** para licenciamento.
- HTTPS via reverse proxy (Nginx/IIS) com certificado real.
- **Backup** do SQL Server agendado (diário) + restore testado mensal.
- Monitoramento: Application Insights (API) + Uptime checks.

### Deploy do frontend na VM
- Build estático do Next (`next build`) servido por Nginx **ou** Node (`next start`) com PM2 atrás do reverse proxy.
- API em `/api/*` ou subdomínio próprio (configurar CORS).

---

## 13. Cronograma em Fases (~9 semanas, 1 dev full-time)

| Fase | Escopo | Entregável | Tempo |
|---|---|---|---|
| **0** | Solução .NET, Identity, EF Core, modelo SQL, seed, Swagger | Repo backend rodando + Swagger | 1 sem |
| **1** | Auth (e-mail/Google), usuários, permissões, workspaces, times, presenters | Login + gestão de usuários | 1 sem |
| **2** | CRUD REST: projects, scripts, versions, comments, activities, tp | API completa + camada `src/api/` no Next | 2 sem |
| **3** | **Realtime SignalR**: ScriptHub + TpHub, substituindo os 11+ `onSnapshot` | Edição colaborativa + espelhos do TP | 2 sem |
| **4** | Parser de marcadores, versões, ortografia, checklist, exportação PPT/Word | Editor + exportações | 1 sem |
| **5** | Relatórios, admin, demo setup, upload (Blob/disco), error reports | Telas restantes | 1 sem |
| **6** | RLS, autorização C#, testes (xUnit/Playwright/Vitest), deploy na VM | Homologação + produção | 1 sem |
| **Total** | | | **~9 semanas** |

> Com a equipe técnica ajudando no backend, pode cair para **5–7 semanas**. Com mais pessoas paralelizando frontend/backend, **4–6 semanas**.

---

## 14. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| **Realtime complexo** (concorrência de edição, espelhos) | Alto | SignalR + optimistic concurrency; POC de 1 semana do TP com 2 abas antes de seguir |
| **Portar parser/renumeração** | Médio | Portar `parser.ts` com testes unit idênticos (casos atuais) |
| **Exportação PPT/Word em C#** | Médio | OpenXML SDK + testes de snapshot; paralelizar com outras fases |
| **Corretor pt-BR** | Médio | NHunspell com dicionário pt-BR ou endpoint dedicado no parser |
| **Infraestrutura na VM** (SSL, Node, SQL) | Médio | Provisionamento com scripts IaC (`deploy/`) + runbook |
| **Curva de aprendizado .NET** | Médio | Time técnico já padroniza .NET; documentar padrões no repo |
| **Escopo contratual de frontend Razor** | Alto | Se o contrato exigir UI .NET, reavaliar Blazor — mas justificar com ADR-01 antes de aceitar |

---

## 15. Decisões Pendentes (bloqueiam fases 0/6)

1. **VM:** Windows + IIS ou Linux + Nginx?
2. **SQL Server:** mesma VM ou Azure SQL separado?
3. **Frontend Next.js:** na mesma VM ou mantido fora (Vercel)?
4. **Uploads:** Azure Blob Storage ou disco da VM?
5. **Google OAuth:** fluxo padrão (redirect) — confirmar se a empresa exige SSO corporativo no futuro.
6. **MFA:** exigido pelo contrato de segurança da empresa?

---

*Fim do documento — Planejamento .NET · Teleprompt · v1.0*
