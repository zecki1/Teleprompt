# 📝 Planejamento .NET — Teleprompt

> **Tema:** migração/reconstrução em **.NET (C#) + SQL Server**, mantendo **Next.js como frontend**.

Aplicação web para **criar, revisar, aprovar e gravar roteiros de vídeo** com teleprompter embutido (cenas com marcadores, edição colaborativa em tempo real, espelhos sincronizados, controle remoto, histórico de versões e exportação PPT/Word).

**Estado atual:** em planejamento · **Greenfield** (sem migração de dados) · Realtime obrigatório · Zero Firebase · Deploy em **VM Azure** em ambiente controlado.

---

## Visão da Arquitetura

```
Navegador ──┬── HTTPS/REST ──► Next.js (frontend, só apresentação)
            └── WebSocket (SignalR) ─► ASP.NET Core API (C#) ─► SQL Server
```

- **Frontend:** Next.js + React + TypeScript — camada de apresentação; **sem acesso ao banco e sem regra de negócio**.
- **Backend:** ASP.NET Core Web API (.NET 9) — regras de negócio, autorização, validação e realtime (SignalR).
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

## Como Rodar Localmente (após implementação da Fase 0)

```bash
# Backend (pasta da solução .NET)
dotnet restore
dotnet ef database update        # cria o schema no SQL local
dotnet run                       # API em http://localhost:5000  (Swagger: /swagger)

# Frontend (pasta frontend/)
npm install
npm run dev                      # Next.js em http://localhost:3000
```

> SQL local via Docker: `docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=..." -p 1433:1433 -d mcr.microsoft.com/mssql/server:2022-latest`

---

## Próximos Passos

1. Definir as **decisões pendentes** (§15 do planejamento): OS da VM, SQL na mesma VM vs Azure SQL, storage.
2. Executar a **Fase 0** — solução .NET, Identity, EF Core + modelo SQL, Swagger.
3. POC de **1 semana** do realtime do teleprompter (2 abas sincronizadas) antes da Fase 3.
4. Cronograma completo das 7 fases no §13 do [`PLANEJAMENTO-NET.md`](./PLANEJAMENTO-NET.md).

---

*README · Planejamento .NET · Teleprompt · v1.0 · Documentação de referência: [`PLANEJAMENTO-NET.md`](./PLANEJAMENTO-NET.md)*
