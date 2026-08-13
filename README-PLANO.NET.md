# 📝 Planejamento .NET — Teleprompt

> **Tema:** migração/reconstrução em **.NET (C#) + SQL Server**, mantendo **Next.js como frontend**.

Aplicação web para **criar, revisar, aprovar e gravar roteiros de vídeo** com teleprompter embutido (cenas com marcadores, edição colaborativa em tempo real, espelhos sincronizados, controle remoto, histórico de versões e exportação PPT/Word).

**Estado atual:** backend .NET em andamento · Fase 0-2 concluídas (solução, Identity, EF Core, controllers) · auth do frontend já aponta para a API .NET · **Greenfield** (sem migração de dados) · Realtime obrigatório · Zero Firebase · Deploy em **VM Azure** em ambiente controlado.

---

## Visão da Arquitetura

```
Navegador ──┬── HTTPS/REST ──► Next.js (frontend, só apresentação)
            └── WebSocket (SignalR) ─► ASP.NET Core API (C#) ─► SQL Server
```

- **Frontend:** Next.js + React + TypeScript — camada de apresentação; **sem acesso ao banco e sem regra de negócio**.
- **Backend:** ASP.NET Core Web API (.NET 10) — regras de negócio, autorização, validação e realtime (SignalR).
- **Banco:** SQL Server + EF Core — integridade, RLS por workspace, soft-delete, auditoria.
- **Auth:** ASP.NET Core Identity (e-mail/senha + Google OAuth).
- **Armazenamento:** Azure Blob Storage ou disco da VM.

---

## Stack de Decisão

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Frontend | Next.js 16 · React 19 · TypeScript · Tailwind · TanStack Query · SignalR client | Ecossistema maduro para a UI complexa (dnd, animação, exports, gráficos) |
| Backend | ASP.NET Core Web API · C# · EF Core · Identity · SignalR · FluentValidation · OpenXML | Padronização da empresa + SQL Server + realtime nativos |
| Banco | SQL Server | Integridade relacional, transações, RLS, auditoria |
| Infra | VM Azure (ambiente controlado) | Controle total; SQL Server (mesma VM ou Azure SQL) |
| Realtime | SignalR (WebSocket) | Edição colaborativa, espelhos do TP, controle remoto |

> Detalhamento técnico completo (decisões ADR, modelo de dados, endpoints, hubs, matriz de permissões, travas no banco, testes, segurança e cronograma) no documento: **[`PLANEJAMENTO-NET.md`](./PLANEJAMENTO-NET.md)**.

---

## Índice (Documento Completo)

| Seção | Conteúdo | Link |
|---|---|---|
| Resumo executivo | Decisões-chave e princípios | [§1](./PLANEJAMENTO-NET.md#1-resumo-executivo) |
| Decisões de arquitetura | ADR-01 a ADR-08 | [§2](./PLANEJAMENTO-NET.md#2-decisões-de-arquitetura-adrs) |
| Desenho da arquitetura | Diagrama de camadas + fluxos | [§3](./PLANEJAMENTO-NET.md#3-desenho-da-arquitetura) |
| Estrutura do projeto | Solução .NET em camadas + frontend | [§4](./PLANEJAMENTO-NET.md#4-estrutura-do-projeto) |
| Mapa do sistema | Rotas, endpoints REST, hubs SignalR | [§5](./PLANEJAMENTO-NET.md#5-mapa-do-sistema) |
| Modelo de dados | Entidades, índices, auditoria | [§6](./PLANEJAMENTO-NET.md#6-modelo-de-dados-sql-server) |
| Quem pode o quê | Matriz Papel × Permissão | [§7](./PLANEJAMENTO-NET.md#7-quem-pode-o-quê-matriz-de-permissões) |
| Travas no banco | Constraints, RLS, stored procedures | [§8](./PLANEJAMENTO-NET.md#8-travas-dentro-do-banco-defesa-em-profundidade) |
| Catálogo de funcionalidades | Editor, TP, organização, confiabilidade | [§9](./PLANEJAMENTO-NET.md#9-catálogo-de-funcionalidades) |
| Testes automatizados | xUnit, Playwright, Vitest | [§10](./PLANEJAMENTO-NET.md#10-testes-automatizados) |
| Auditoria de segurança | Checklist OWASP | [§11](./PLANEJAMENTO-NET.md#11-auditoria-de-segurança-checklist-owasp-aplicado) |
| Deploy e infra | Topologia de VM, requisitos | [§12](./PLANEJAMENTO-NET.md#12-deploy-e-infraestrutura) |
| Cronograma | 7 fases · ~9 semanas | [§13](./PLANEJAMENTO-NET.md#13-cronograma-em-fases-9-semanas-1-dev-full-time) |
| Riscos e decisões | Riscos + itens bloqueantes | [§14](./PLANEJAMENTO-NET.md#14-riscos-e-mitigações) · [§15](./PLANEJAMENTO-NET.md#15-decisões-pendentes-bloqueiam-fases-06) |

---

## Destaques

- ✅ **Realtime obrigatório coberto:** edição colaborativa, presença, comentários ao vivo, **espelhos do teleprompter** e controle remoto via **SignalR**.
- ✅ **Backend 100% .NET + SQL Server** — a padronização exigida pela empresa fica no backend e no dado.
- ✅ **Segurança em profundidade:** autorização em C# + **RLS por workspace no SQL** (defesa mesmo com SQL direto) + checklist OWASP.
- ✅ **Frontend sem Firebase:** auth, banco e storage migram para Identity, SQL Server e Azure Blob/disco.
- ✅ **Testes:** xUnit + Testcontainers (integração), Playwright (E2E com 2 espelhos), Vitest (mantém 71 casos atuais).

---

## Como Rodar Localmente

> Requer **.NET SDK 10+** e **Node.js 20+**.

```bash
# Backend (pasta backend/)
dotnet restore
dotnet ef database update        # cria o schema no SQL local (ou use SQLite em dev)
dotnet run                       # API em http://localhost:5026  (Swagger: /swagger)
```

- Em dev a API usa **SQLite** (`Database:Provider=Sqlite` no `appsettings.Development.json`) — sem precisar de SQL Server.
- Usuário demo criado no seed: `demo@teleprompt.app` / `Demo@12345`.
- JWT configurado em `Jwt:*` no `appsettings.json` (troque a chave em produção).

```bash
# Frontend (raiz do projeto)
npm install
# Crie um arquivo .env.local apontando para a API (ver .env.example):
#   NEXT_PUBLIC_API_URL=http://localhost:5026
npm run dev                      # Next.js em http://localhost:3000
```

- A camada `src/api/*` fala com o backend .NET (REST + SignalR). O login/registro usam `POST /api/v1/auth/*`.
- `@microsoft/signalr` conecta nos hubs `/hubs/script` e `/hubs/tp`.

### Testes

```bash
# Backend (xUnit — unit + integração via WebApplicationFactory)
dotnet test

# Frontend (Vitest — 71 casos atuais)
npm test
```

> SQL Server via Docker para integração/Testcontainers:
> `docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=REDACTED_SQL_CREDENTIAL" -p 1433:1433 -d mcr.microsoft.com/mssql/server:2022-latest`

---

## macOS — guia de instalação do ambiente

> O mesmo código roda igual no macOS; abaixo só a preparação da máquina. A API usa **SQLite em dev**,
> então dá para desenvolver **sem Docker**; o SQL Server (Linux) é opcional via container.

### 1. .NET SDK 10

```bash
# Opção A — Homebrew
brew install --cask dotnet-sdk

# Opção B — instalador oficial (dotnet-install)
curl -sSL https://dot.net/v1/dotnet-install.sh | bash -s -- --channel 10.0
# depois adicione ao ~/.zshrc:
#   export PATH="$HOME/.dotnet:$PATH"
#   export DOTNET_ROOT="$HOME/.dotnet"

# Ferramentas do EF Core (migrations)
dotnet tool install --global dotnet-ef
export PATH="$PATH:$HOME/.dotnet/tools"   # adicione ao ~/.zshrc
```

### 2. Node.js 20+ (recomendado: 22 LTS)

```bash
brew install node        # ou use nvm
node -v && npm -v
```

### 3. SQL Server via Docker (opcional — só se não usar SQLite em dev)

```bash
# SQL Server 2022 (Linux, suporta Apple Silicon)
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=REDACTED_SQL_CREDENTIAL" \
  -p 1433:1433 -d mcr.microsoft.com/mssql/server:2022-latest

# alternativa leve p/ dev: Azure SQL Edge
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=REDACTED_SQL_CREDENTIAL" \
  -p 1433:1433 -d mcr.microsoft.com/azure-sql-edge:latest
```

> Em dev basta deixar `Database:Provider=Sqlite` em
> `backend/src/Teleprompt.Api/appsettings.Development.json` (padrão) — sem container.

### 4. Rodar (igual ao Windows/Linux)

```bash
# Backend
cd backend
dotnet restore
dotnet run --project src/Teleprompt.Api        # http://localhost:5026

# Frontend (raiz do projeto)
cd ..
npm install
cp .env.example .env.local    # NEXT_PUBLIC_API_URL=http://localhost:5026
npm run dev                    # http://localhost:3000
```

### 5. Solução de problemas no macOS

| Problema | Solução |
|---|---|
| `dotnet: command not found` | Exporte o PATH/`DOTNET_ROOT` do `dotnet-install` no `~/.zshrc` (passo 1) |
| `dotnet ef: command not found` | `dotnet tool install --global dotnet-ef` e adicione `~/.dotnet/tools` ao PATH |
| Porta 5026 em uso | Altere `applicationUrl` em `launchSettings.json` e o `NEXT_PUBLIC_API_URL` |
| Apple Silicon + SQL Server | Use o container `mcr.microsoft.com/mssql/server:2022-latest` (tem imagem ARM) |
| Certificado HTTPS dev | `dotnet dev-certs https` |

---

## Próximos Passos

1. **Migrar o acesso a dados do frontend** (dashboard, projetos, editor, TP, relatórios, admin) do Firestore para a camada `src/api/*` — o backend já expõe os endpoints REST + hubs SignalR.
2. Definir as **decisões pendentes** (§15 do planejamento): OS da VM, SQL na mesma VM vs Azure SQL, storage.
3. POC de **1 semana** do realtime do teleprompter (2 abas sincronizadas) via SignalR antes da Fase 3.
4. Cronograma completo das 7 fases no §13 do [`PLANEJAMENTO-NET.md`](./PLANEJAMENTO-NET.md).

## Progresso

- ✅ **Fase 0** — solução .NET em camadas (Domain / Application / Infrastructure / Api), Identity, EF Core + modelo, Swagger.
- ✅ **Fase 1** — auth: register, login, me, refresh (rolling JWT), logout; roles e permissões; workspace via convite.
- ✅ **Fase 2** — controllers: workspaces, projects, scripts (+ parser, versões, comentários, checklist, export), tp sessions, teams, presenters, users/admin, reports, activities, upload; hubs SignalR (`/hubs/script`, `/hubs/tp`); RLS no SQL Server.
- ✅ **Build + testes** — `dotnet build` limpo (0 warnings), 14 testes xUnit verdes, smoke test E2E do fluxo completo na API.
- ✅ **Frontend** — auth trocado para a API .NET (`src/api/*` + `AuthContext`), tipo da sessão unificado, `middleware.ts` atualizado; 71 testes Vitest verdes + `tsc` limpo.

---

*README · Planejamento .NET · Teleprompt · v1.0 · Documentação de referência: [`PLANEJAMENTO-NET.md`](./PLANEJAMENTO-NET.md)*
