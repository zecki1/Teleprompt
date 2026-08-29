# Teleprompt — Suíte de Teleprompter & Roteiros (SaaS)

Plataforma para **criar, revisar, aprovar e gravar roteiros de vídeo** com teleprompter embutido. Escrita estruturada em **cenas** com marcadores (locução, lettering, pronúncia, imagem, fonte, abertura/encerramento), revisão em fluxo, histórico de versões e gravação assistida com rolagem controlada (teclado/remoto), tela cheia e espelhos sincronizados.

Entrega em **3 versões de frontend** (Next.js e 2 Angulares) que consomem a **mesma API .NET** e os mesmos dados.

**Deploy:** Frontends na **Vercel** · Backend na **VM Google Cloud** (nginx + HTTPS). Chooser: `zecki1.com.br/teleprompt`.
**Repo:** `github.com/zecki1/Teleprompt` (branch `dotnet`)

---

## Arquitetura

```
┌─────────────┐  ┌───────────────┐  ┌───────────────┐
│ Next.js 16  │  │ Angular 22    │  │ Angular 17    │   ← 3 frontends (Vercel)
│ (raiz /src) │  │ (frontend/)   │  │ (frontend-    │
└──────┬──────┘  └───────┬───────┘  │   angular/)    │
       │                 │          └───────┬───────┘
       │      HTTPS + JWT + SignalR         │
       └─────────────► API .NET 10 ◄────────┘
                  (VM GCP — api.teleprompt.zecki1.com.br)
```
- **Backend:** ASP.NET Core Web API (porta local `5026`; Docker `127.0.0.1:5000`)
- **Frontends:** Next.js 16 (flagship), `frontend/` (Angular 22), `frontend-angular/` (Angular 17)
- **Chooser:** `chooser/index.html` — página que aponta para as 3 versões

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | **ASP.NET Core .NET 10** · EF Core · JWT Bearer · Swagger · SignalR (`ScriptHub`, `TpHub`) |
| Banco | **SQLite** (desenvolvimento, `teleprompt-dev.db`) · **SQL Server** (produção, `appsettings.json`) |
| Frontend 1 | **Next.js 16** (App Router, React 19, Tailwind v4, shadcn/ui, React Query, SignalR client) |
| Frontend 2 | **Angular 22** (`frontend/` — token `API_BASE_URL`, Vite/Vitest) |
| Frontend 3 | **Angular 17** (`frontend-angular/` — environments, NgRx, SignalR client, Karma) |
| Auth | Login JWT via API (e-mail/senha) — `api/v1/auth` |
| Testes | Vitest (Next + Angular 22) · Karma/Jasmine (Angular 17) |
| Infra | Docker · Vercel · GCP (VM e2-micro) |

---

## Rodando localmente

```bash
# 1. Backend (.NET) — porta http://localhost:5026
cd backend/src/Teleprompt.Api
dotnet run

# 2. Next.js — http://localhost:3000
npm install && npm run dev

# 3. Angular 22 (frontend/) — http://localhost:4200
cd frontend && npm install && npx ng serve

# 4. Angular 17 (frontend-angular/) — http://localhost:4201
cd frontend-angular && npm install && npx ng serve --port 4201

# 5. Tudo junto (Next + Angular 17)
npm run dev:all
```

**API base:** os frontends apontam para `http://localhost:5026` em dev (`NEXT_PUBLIC_API_URL` no Next; environments no Angular 17; token no Angular 22) e para `https://api.teleprompt.zecki1.com.br` em produção.

---

## Backend (ASP.NET Core)

**Projetos:** `Teleprompt.Api` · `Application` · `Domain` · `Infrastructure` · `Migration` (migração de dados do Firebase).

**Controllers (`api/v1/...`):** Auth, Users, Workspaces, Projects, Scripts, Teams, Activities, Reports, Presenters, Tp (teleprompter), Upload, Export, Admin.

**Extras:** Swagger (`/swagger`) · Autenticação **JWT** (chave em `appsettings.json`) · **SignalR**: `ScriptHub` + `TpHub` (sincronização em tempo real) · Middleware `WorkspaceContext` · **Serve build embarcado** em `/app/*` (fallback → `wwwroot/app/index.html`).

**Banco:** dev usa SQLite (basta `dotnet run`); produção usa SQL Server via `appsettings.json`. CORS controlado por `Cors__Origins` (origens dos 3 frontends + localhost).

---

## Funcionalidades principais

- **Editor de roteiro** — cenas com tempo; marcadores `[Cena] [Loc] [Let] [Pron] [Img] [Url] [Abe] [Enc]`; renumeração automática; ortografia pt-BR; comentários/checklist; histórico de versões; export PPT/Word/JSON.
- **Teleprompter** — rolagem por parágrafo/cena/avanço; atalhos configuráveis; velocidade persistente; **espelhos sincronizados** (operador + gravação); **controle remoto**; ordem de gravação por pasta; painel de pronúncia; tela cheia.
- **Organização** — workspaces, times, pastas/árvore, projetos com status e buckets.
- **Permissões** — papéis (`SuperAdmin … Estagiário`, `editor`, `validador`, …) com matriz de flags; reforço de segurança no banco (Firestore no legado; JWT/claims na API .NET).
- **Confiabilidade** — watchdog de carregamento (25s), login offline, "reportar erro" com print + logs, logging centralizado, error boundary.
- **Demonstração** — setup com credenciais fixas (`demo@teleprompt.app`) em um clique no admin.

---

## Deploy (atual)

| Aplicação | Onde | Domínio |
|---|---|---|
| Next.js | Vercel (projeto `teleprompt-next`) | `next.teleprompt.zecki1.com.br` |
| Angular 22 (`frontend/`) | Vercel (`teleprompt-angular22`) | `angular22.teleprompt.zecki1.com.br` |
| Angular 17 (`frontend-angular/`) | Vercel (`teleprompt-angular17`) | `angular17.teleprompt.zecki1.com.br` |
| Chooser | Vercel (`teleprompt-dun`) | `zecki1.com.br/teleprompt` (rewrite no site) |
| API .NET | VM GCP `34.45.21.180` (`docker compose`) | `api.teleprompt.zecki1.com.br` |

Config de infra: `docker-compose.api.yml` (backend-only), `deploy/api-nginx.conf` (proxy `/api` e `/hubs` → `127.0.0.1:5000`, websockets), `frontend/build-to-backend.sh` (embute build Angular em `wwwroot/app` para o formato legado).

### Integração Firebase → .NET (migração)

O backend conecta ao Firestore para migrar os dados existentes sem perder nada (depois o Firebase deixa de ser usado). O sync é **idempotente** e **automático no boot**:

- Config via `Firebase__ProjectId` (ex.: `teleprompt-1`), `Firebase__ServiceAccountKey` (caminho da service account JSON) e `Firebase__AutoImport` (padrão: `true`). Sem `ProjectId` válido o sync é pulado sem derrubar o boot.
- Na VM, monte a chave em `./secrets/firebase-service-account.json` (volume `:ro` já previsto no compose). Em dev local pode usar `dotnet user-secrets` ou `appsettings.Development.json`.
- Importa (por `Id` do doc Firestore, nunca sobrescreve): workspaces, usuários, projetos, scripts (+ subcoleções `versions` e `comments`), times, apresentadores e atividades.
- Usuários migrados ficam com senha temporária `Migrated@Temp123!` (troca obrigatória no login).
- Força bruta manual: `POST /api/v1/admin/firebase/sync` (exige `SuperAdmin`).

---

## Scripts e Docker

- `npm run dev / build / start / lint / test` (Next)
- `npm run dev:all` (Next + Angular 17 em paralelo)
- `frontend/build-to-backend.sh` — build do Angular 22 copiado p/ `backend/src/Teleprompt.Api/wwwroot/app`
- `docker compose -f docker-compose.api.yml up -d --build` (backend na VM)
- `docker compose -f docker-compose.min.yml` / `deploy.yml` (fluxos legados de container único)

---

## Testes

```bash
npm run test                       # Vitest (Next)
cd frontend && npm run test        # Angular 22
cd frontend-angular && npm run test   # Karma/Jasmine (Angular 17)
```

---

## Pendências / roadmap

- Criar os 3 projetos Vercel (branch `dotnet`) e registrar CNAMEs dos subdomínios
- Configurar HTTPS da API (certbot) + regra de firewall GCP (80/443)
- Renovar documentação de migração Firebase → .NET (`Teleprompt.Migration`)
- Ver `pessoal/STACK.md` para o mapa completo de domínios e infra

> —— README reescrito em 2026-08-29 (anterior descrevia a arquitetura Firebase já migrada para .NET).