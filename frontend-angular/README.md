# Teleprompt - Frontend Angular

Frontend Angular 17+ para o sistema Teleprompt, conectando ao backend ASP.NET Core.

## Stack

- **Angular 17+** com Standalone Components
- **TypeScript 5.4** com strict mode
- **NgRx** para gerenciamento de estado
- **SignalR** para comunicação em tempo real
- **Jasmine/Karma** para testes unitários
- **Docker** para containerização
- **Kubernetes** para orquestração
- **GitHub Actions** para CI/CD
- **Grafana/Prometheus** para observabilidade

## Estrutura do Projeto

```
frontend-angular/
├── src/
│   ├── app/
│   │   ├── core/                    # Core module (singleton services)
│   │   │   ├── auth/               # Autenticação + JWT
│   │   │   ├── guards/             # AuthGuard, PermissionGuard, RoleGuard
│   │   │   ├── interceptors/       # Auth, Error, Loading interceptors
│   │   │   ├── models/             # TypeScript interfaces
│   │   │   ├── realtime/           # SignalR (ScriptHub + TpHub)
│   │   │   └── services/           # API, Loading, Observability services
│   │   ├── shared/                  # Shared module
│   │   │   ├── components/         # Loading, ErrorBanner
│   │   │   ├── directives/         # AutoFocus, DebounceClick
│   │   │   └── pipes/              # EllipsisPipe
│   │   ├── features/               # Feature modules (lazy loaded)
│   │   │   ├── auth/               # Login, Register
│   │   │   ├── dashboard/          # Dashboard principal
│   │   │   ├── projects/           # Lista + Detalhe
│   │   │   ├── scripts/            # Lista + Editor
│   │   │   ├── teleprompter/       # Player com rolagem
│   │   │   ├── admin/              # Usuários + Debug Logs
│   │   │   ├── teams/              # Times
│   │   │   ├── workspaces/         # Workspaces
│   │   │   ├── reports/            # Relatórios
│   │   │   └── profile/            # Perfil do usuário
│   │   └── store/                   # NgRx store
│   │       └── auth/               # Auth state (actions, reducer, effects, selectors)
│   ├── environments/               # Environment configs
│   └── styles.scss                 # Global styles
├── docker/                          # Docker configs
│   ├── Dockerfile
│   ├── nginx.conf
│   └── docker-compose.yml
├── k8s/                             # Kubernetes manifests
│   ├── deployment.yaml
│   └── configmap.yaml
├── monitoring/                      # Observability configs
│   ├── prometheus.yml
│   └── grafana/
└── .github/workflows/               # CI/CD
    └── ci-cd.yaml
```

## Tecnologias da Vaga Demonstradas

### Angular 17+
- Standalone components (sem NgModules)
- New control flow (@if, @for, @switch)
- Signals para reatividade
- Lazy loading com `loadComponent`

### TypeScript
- Strict mode habilitado
- Interfaces e types para todos os modelos
- Generics em services
- Path aliases (@core/*, @shared/*, @env/*)

### Arquitetura
- Core module com services singleton
- Feature modules com lazy loading
- NgRx para state management (actions, reducers, effects, selectors)
- Functional interceptors (Angular 17+ style)

### Microfrontends
- Configuração para Module Federation
- Feature modules independentes
- Compartilhamento de dependências

### SignalR (Realtime)
- ScriptHub: edição colaborativa,Presence, Comments, Versions, Locks
- TpHub: sincronização de teleprompter, controle remoto
- Reconexão automática com backoff exponencial
- NgZone.run() para change detection

### Testes Unitários (Jasmine/Karma)
- AuthService spec (login, logout, permissions)
- ApiService spec (CRUD operations)
- AuthGuard spec (auth flow)
- AuthReducer spec (state transitions)
- AuthEffects spec (async flows com marble testing)
- Code coverage habilitado

### Docker
- Multi-stage build (node → nginx)
- Nginx config com proxy reverso para API e SignalR
- docker-compose com backend, SQL Server, Prometheus, Grafana

### Kubernetes
- Deployment com replicas, resource limits
- readinessProbe e livenessProbe
- Ingress com TLS e WebSocket support
- ConfigMap para nginx config

### CI/CD (GitHub Actions)
- Jobs: lint → test → build → docker → deploy
- Code coverage upload
- Docker image push para GitHub Container Registry
- Deploy para staging

### Observabilidade
- ObservabilityService: metrics, traces, page views, user actions
- Integração com Grafana/Prometheus
- Integração com Dynatrace (metrics API)
- Dashboard no Grafana com painéis de frontend e SignalR

## Rodando Localmente

```bash
# Instalar dependências
npm install

# Desenvolvimento
npm start          # http://localhost:4200

# Testes
npm run test       # Watch mode
npm run test:ci    # CI mode com coverage

# Build
npm run build:prod

# Lint
npm run lint

# Docker
npm run docker:up
npm run docker:down
```

## Variáveis de Ambiente

Em `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api/v1',
  signalR: {
    scriptHubUrl: 'http://localhost:5000/hubs/script',
    tpHubUrl: 'http://localhost:5000/hubs/tp'
  },
  observability: {
    enabled: false,
    grafanaEndpoint: 'http://localhost:3000',
    dynatraceEnabled: false
  }
};
```

## Endpoints da API

O frontend consome a API .NET em `http://localhost:5000/api/v1/`:

- **Auth**: login, register, me, refresh, logout
- **Users**: CRUD + permissions
- **Workspaces**: CRUD + members
- **Teams**: CRUD + members
- **Projects**: CRUD + scripts
- **Scripts**: CRUD + versions + comments + checklist + lock/unlock
- **Teleprompter**: sessions + recorded
- **Reports**: summary
- **Admin**: debug-logs + error-reports
- **Upload**: file upload
- **Export**: JSON, PPT, Word

## SignalR Hubs

- **ScriptHub** (`/hubs/script`): JoinScript, ContentChanged, CursorMoved, CommentAdded, CommentResolved, VersionCreated, LockChanged, ChecklistUpdated
- **TpHub** (`/hubs/tp`): JoinTp, ScrollStateChanged, ModeChanged, SpeedChanged, RemoteCommand, Recorded, OrderChanged
