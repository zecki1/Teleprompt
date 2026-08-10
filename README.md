# Teleprompt — Criação e gravação de roteiros com teleprompter integrado

Aplicação web completa para **criar, revisar, aprovar e gravar roteiros de vídeo** com teleprompter embutido. O texto é estruturado em **cenas** com marcadores especiais (locução, lettering, pronúncia, imagem, fonte e abertura/encerramento), com revisão em fluxo, histórico de versões e gravação assistida com rolagem controlada por teclado, tela cheia e espelhos sincronizados.

- **Stack:** Next.js 15 (App Router) + TypeScript + Firebase (Auth, Firestore, Storage/Blob) + Tailwind CSS + Vitest
- **Idioma da interface:** Português (Brasil)
- **Deploy:** Vercel + Cloudflare (recomendado em frente)

---

## 1. Mapa do Sistema (rotas)

| Rota | Página | Acesso |
|---|---|---|
| `/` | Landing / redireciona para dashboard ou login | Público |
| `/login` | Autenticação (e-mail/senha, Google, demo) | Público |
| `/dashboard` | Visão geral: projetos, metas, atividades recentes, tour guiado | Usuário logado |
| `/projects` | Lista de projetos (filtro, busca, status, buckets) | Usuário logado |
| `/editor/[id]` | **Editor de roteiro** — cenas, marcadores, ortografia, comentários, versões | Quem pode editar |
| `/s/[id]` | Página pública de status/aprovação (link compartilhável) | Público (só com link) |
| `/tp/[id]` | **Teleprompter** — rolagem, atalhos, espelhos, controle remoto, gravação | Dono/convidado |
| `/admin` | Painel administrativo: logs de debug, permissões, demo setup | canManagePermissions |
| `/relatorio` | Relatórios | canViewReports |
| `/activities` | Histórico de atividades | canViewActivityHistory |
| `/profile` | Perfil do usuário | Usuário logado |
| `/api/upload` | Upload de arquivos (Vercel Blob, com auth via Admin SDK) | Autenticado |

---

## 2. Catálogo de Funcionalidades

### Editor de roteiro
- Roteiro dividido em **cenas** com campo **Tempo** (ex.: "45 segundos").
- **Marcadores suportados** pelo parser (`src/lib/parser.ts`):
  `[Cena]`, `[Loc]` (locução), `[Let]` (lettering), `[Pron]` (pronúncia), `[Img]` (imagem), `[Url]` (fonte), `[Abe]`/`[Enc]` (abertura/encerramento).
- Renumeração automática de letterings/pronúncias ao inserir (ex.: `Let1`, `Let2`, `Pron1`...).
- **Verificação ortográfica em pt-BR** embutida (dicionário por cena).
- **Comentários e checklist de revisão** (obrigatório conforme `requiresChecklist`).
- **Histórico de versões** com comparação, reverter (se `canRevert`) e restaurar.
- Exportação/importação de texto e JSON; **geração de PPT** a partir do roteiro.

### Teleprompter (`/tp/[id]`)
- Rolagem automática por **parágrafo, cena, meio da cena ou avanço geral** (`src/lib/tp-controls.ts`).
- **Atalhos de teclado configuráveis** (dialog de atalhos) — espaço, setas, W/S/A/D, F5 etc.
- Controle de **velocidade** ajustável e persistente.
- **Espelhos sincronizados** (tela do operador + tela de gravação).
- **Controle remoto** da rolagem por outra pessoa.
- Árvore de pastas com **ordem de gravação por pasta** (`RecordingOrderPanel`).
- **Painel de pronúncia** para conferir fonética antes de gravar.
- Modo tela cheia e botão "Marcar como gravado" (marca status e dispara o próximo passo).

### Organização
- **Workspaces** (membros, plano, `roleLabels`).
- **Times** e **pastas/árvore** de organização de roteiros.
- **Projetos** com status (aguardando, em andamento, concluído, pausado, atrasado, backlog), **buckets** (Backlog, Em Andamento, Pausado, Em Revisão, Em Ajuste, Concluído).

### Confiabilidade (novo nesta atualização)
- **Tela de carregamento com watchdog (25s)** e detecção de conexão: se o Firestore estiver offline, em vez de "Carregando..." infinito aparece uma tela de erro com **"Recarregar página"** e **"Reportar erro"**.
- **Botão de reportar erro**: captura **print da tela** (modern-screenshot), coleta **logs recentes** e dados do usuário, e grava um `error_reports` no Firestore (qualquer usuário autenticado pode criar; leitura só para quem gerencia permissões). Se o print não puder ser gerado, inclui uma **descrição estruturada da tela** (títulos, botões, links e campos) no relatório.
- **Logging centralizado** (`src/lib/debug-log.ts`): erros e eventos de depuração gravados em `debug_logs` (visíveis apenas com `canViewDebugLogs`).
- **Error boundary global** (`AppErrorHandler`) com opção de reportar o erro.

### Demonstração
- **Setup de demonstração** (`src/services/demo.ts`): cria usuário/workspace/projeto/roteiro de exemplo com credenciais fixas (`demo@teleprompt.app`), usado para testar o app com um clique no admin.

---

## 3. Permissões — quem pode o que

As capacidades são controladas por **flags no perfil do usuário** (`src/services/schemas.ts`) e reforçadas **dentro do banco** (ver seção 4).

### Papéis (`ROLES`)
`SuperAdmin, Diretor, Coordenador, Orientador, Docente, Especialista, Assistente, Analista, Tutor, Monitor, Técnico, Estagiário, editor, validador, publico`

### Tabela de permissões

| Flag | Capacidade |
|---|---|
| `isSuperAdmin` | Acesso total; exclusões; gerenciamento de permissões; debug |
| `canManagePermissions` (derivado) | Gerenciar usuários, times e permissões (admin) |
| `canCollaborate` | Participar e colaborar em roteiros |
| `isEditor` | Editar roteiros (papel `editor`) |
| `isRevisor` | Aprovar/revisar (papel `validador`) |
| `canRevert` | Reverter para versões anteriores |
| `canViewAdmin` | Acessar painel administrativo |
| `canViewReports` | Acessar relatórios (`/relatorio`) |
| `canViewActivityHistory` | Ver histórico de atividades (`/activities`) |
| `canViewDebugLogs` | Ler logs de debug e relatórios de erro |
| `canAssign` | Atribuir tarefas/projetos |
| `requiresChecklist` | Exige checklist de revisão antes de concluir |
| `status` | `active` / `inactive` / `pending` |

### Lógica de edição no editor
Quem pode editar: `isSuperAdmin` OU papéis de gestão/docência/técnica (`Docente, Especialista, Coordenador, Diretor, Orientador, Assistente, Analista, Tutor, Monitor, Técnico, Estagiário, editor, validador`) **e** o roteiro não esteja bloqueado (ou o status seja rascunho).

---

## 4. Regras de Segurança do Banco (RLS — `firestore.rules`)

Toda a proteção é **reforçada no banco**, independente da interface. Resumo das regras:

| Coleção | Leitura | Escrita |
|---|---|---|
| `users` | própio usuário; quem gerencia permissões lê todos | próprio perfil; admin gerencia |
| `workspaces` | membro do workspace | dono/gerência |
| `projects` | membro/colaborador com permissão | dono ou quem gerencia |
| `scripts` | quem tem acesso ao projeto | editor habilitado |
| `tp` (teleprompter) | membro do projeto | dono/convidado do TP |
| `activities` | quem tem `canViewActivityHistory` | autenticado (append) |
| `debug_logs` | `canManagePermissions` ou `canViewDebugLogs` | autenticado (criar); admin exclui |
| `error_reports` | `canManagePermissions` ou `canViewDebugLogs` | **qualquer autenticado (criar)**; admin exclui |
| `versions` | quem pode ver o script | editor com `canRevert` |

> **Atenção:** `firestore.rules` está no `.gitignore` (linha 43) — o arquivo **não entra no versionamento**, é aplicado manualmente via Firebase CLI (`firebase deploy --only firestore:rules`). Recomendado: remover do `.gitignore` para versionar as regras.

---

## 5. Segurança & Auditoria

### Já implementado
- **CSP (Content-Security-Policy)** via `next.config.ts` com diretivas restritivas (script/style self, `img-src` com `data:`/`blob:` para captura de tela, etc.).
- **Headers de segurança** no middleware (`src/middleware.ts`):
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (câmera/mic/geo desabilitadas).
- **Upload protegido**: `/api/upload` valida tamanho (10 MB), tipos permitidos e exige token JWT do **Firebase Admin SDK**.
- **CORS controlado** na rota de upload (origem restrita).
- **Autenticação por e-mail/senha + Google**; acesso às rotas protegidas verificando login.
- **RLS no Firestore** (seção 4) como última barreira.
- **Sem segredos no cliente**: as credenciais demo são constantes no código e não ficam no banco; variáveis sensíveis em `process.env`.

### Recomendado (documentado)
- **WAF (Cloudflare/Web Application Firewall)** na frente do domínio — regras gerenciadas (OWASP, SQLi/XSS) + **Bot Fight Mode ON**.
- **Rate Limiting** no Cloudflare (ex.: 20 req/min por IP em `/login` e `/api/upload`).
- Middleware com **session cookie + verificação do Admin SDK** (já há TODO em `src/middleware.ts`) para auth server-side real.
- Remover `firestore.rules` do `.gitignore` para versionar as regras.
- Rotação periódica de credenciais e revisão de acesso dos "demo".

---

## 6. Testes Automatizados (Vitest)

| Arquivo | Cobre |
|---|---|
| `src/lib/parser.test.ts` | Parser de roteiro: cenas, tempos, marcadores `[Loc]/[Let]/[Pron]/[Img]/[Url]/[Abe]/[Enc]`, renumeração |
| `src/lib/tp-controls.test.ts` | Modos de rolagem, atalhos por `KeyboardEvent.code`, mapeamento de ações |
| `src/lib/versions.test.ts` | Histórico de versões, comparação e restauração |
| `src/lib/pathUtils.test.ts` | Caminhos e chaves de pastas da árvore de organização |
| `src/lib/tour-steps.test.ts` | Passos do tour guiado do dashboard |
| `src/lib/utils.test.ts` | Utilitários (merge de classes, datas, formatação) |
| `src/lib/spellcheck/spellcheck.test.ts` | Correção ortográfica pt-BR |
| `src/services/schemas.test.ts` | Validação Zod de usuários, workspaces, times e papéis |
| `src/services/demo.test.ts` | Fluxo de criação da conta/workspace/projeto de demonstração |

Rodar: `npm run test`

---

## 7. Nota de Atualizações (últimos ~35 arquivos)

### Editor, parser e qualidade de texto
- `src/lib/parser.ts` — suporte completo aos marcadores + renumeração automática.
- `src/lib/spellcheck/index.ts` — verificação ortográfica pt-BR por cena.
- `src/app/editor/[id]/page.tsx` — reescrita: comments, checklist, versões, PPT, ortografia, bloqueio de edição.

### Teleprompter
- `src/lib/tp-controls.ts` — modos de rolagem e atalhos configuráveis.
- `src/components/tp/ShortcutSettingsDialog.tsx` — dialog de personalização de atalhos.
- `src/components/tp/RecordingOrderPanel.tsx` — ordem de gravação por pasta.
- `src/components/tp/PronunciationPanel.tsx` — conferência de fonética.
- `src/components/tp/RemoteControlUI.tsx` — controle remoto da rolagem.
- `src/app/tp/[id]/page.tsx` — espelhos sincronizados, gravação, "marcar como gravado".

### Segurança e confiabilidade
- `src/middleware.ts` / `next.config.ts` — headers de segurança + CSP.
- `src/components/PageTransitionLoader.tsx` — **watchdog 25s** + tela de erro sem conexão + barra de progresso opcional.
- `src/components/AppErrorHandler.tsx` — error boundary global.
- `src/components/tp/ErrorReporter.tsx` — **botão reportar erro** (print + logs + Firestore).
- `src/lib/debug-log.ts` — logging centralizado.
- `firestore.rules` — regras RLS incluindo `error_reports` e `debug_logs`.
- `src/app/api/upload/route.ts` — upload seguro via Admin SDK.

### Organização e admin
- `src/services/users.ts`, `src/contexts/AuthContext.tsx`, `src/services/workspaceService.ts` — permissões, workspaces e sessão.
- `src/app/admin/page.tsx` — painel admin (permissões, logs, demo setup).
- `src/components/admin/DebugLogsPanel.tsx` — leitura/filtro de logs.
- `src/components/admin/DemoSetupPanel.tsx` — botão "montar demonstração".
- `src/services/demo.ts` — setup automático de demonstração.
- `src/lib/versions.ts`, `src/lib/tour-steps.ts`, `src/lib/pathUtils.ts` — versões, tour guiado, caminhos.

### Testes e infra
- `vitest.config.ts`, 9 arquivos de teste (71 casos), `src/types/window-management.d.ts`.
- `package.json` — novas dependências (Vitest, modern-screenshot, etc.).

---

## 8. Comparativo de Tempo: Teleprompt vs PowerPoint

Estimativas para um roteiro típico de 10 cenas (apresentação de ~3 min):

| Atividade | Teleprompt | PowerPoint | Economia |
|---|---|---|---|
| Estruturar roteiro em cenas + tempo | ~10 min (template + parser automático) | ~40 min (montar slides, copiar de texto, formatar) | ~75% |
| Lettering / pronúncia / fontes | ~10 min (campos estruturados + renumeração automática) | ~45 min (criar caixas de texto e revisar manualmente) | ~78% |
| Revisão e aprovação | ~10 min (comentários, checklist, status, link `/s/[id]`) | ~90 min (e-mails, arquivos de versão, reuniões) | ~89% |
| Gravação com teleprompter | ~15 min (rolagem controlada + espelhos + ordem de gravação) | N/A — precisa app externo de teleprompter + setup | — |
| Exportar material final | Exportação PPT/Word/JSON integrada | Manual (reorganizar tudo) | ~70% |
| **Total aproximado** | **~45–60 min** | **~3–4 h** | **~70–75%** |

> Nota: valores são estimativas de fluxo; o ganho principal vem de eliminar retrabalho manual (renumeração, versionamento, revisão descentralizada e gravação integrada).

---

## 9. Histórico de Versões (git)

- `git log --oneline` para ver as versões completas.
- Última atualização registrada no README (ver seção 7) abrange os ~35 arquivos mais recentes entre editor, teleprompter, segurança e testes.

---

## 10. Rodando localmente

```bash
npm install
npm run dev        # http://localhost:3000
npm run test       # Vitest (63 casos)
npm run build      # build de produção
npm run lint       # ESLint
```

Variáveis de ambiente necessárias (`.env.local`): configuração do Firebase (client) e, para uploads, `FIREBASE_SERVICE_ACCOUNT` + `BLOB_READ_WRITE_TOKEN`.

---

## 11. Próximos passos

- Auth server-side via session cookie (TODO em `src/middleware.ts`).
- Versionar `firestore.rules` (remover do `.gitignore`).
- Rate limiting em `/api/upload` e `/login` (Cloudflare + middleware).
- Disponibilizar link público de demonstração com credenciais demo.
