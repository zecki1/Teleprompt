# Plano de Implementação - Sistema de Gestão de Roteiros

## Visão Geral do Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                      TELEPROMPT (teleprompt-1)                      │
├─────────────────────────────────────────────────────────────────────┤
│  Login (mesma conta Zecki) → Multi-workspace (como Zecki)         │
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐ │
│  │   PROJETOS   │    │   ROTEIROS   │    │       ADMIN          │ │
│  │              │    │              │    │                      │ │
│  │ - Módulos    │    │ - Rascunho   │    │ - Gerenciar usuários │ │
│  │ - Automático │    │ - Pendente   │    │ - Definir perfis     │ │
│  │   → Zecki    │    │ - Validado   │    │                      │ │
│  │              │    │ - Enviado    │    │                      │ │
│  └──────────────┘    └──────────────┘    └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ API (create project + task)
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   ZECKI (dashboard-64641)                          │
├─────────────────────────────────────────────────────────────────────┤
│  Workspace: Senai                                                   │
│                                                                      │
│  Projeto: [Nome do Projeto]                                         │
│  ├── Tarefa: Gravação de Vídeo                                      │
│  │   └── Subtarefa/Links: [Link Teleprompt 1], [Link Teleprompt 2]│
│  └── ...                                                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. Autenticação e Usuários

### Firebase Auth
- Usar mesmo Firebase Auth do Zecki (dashboard-64641)
- Coleção `users` no Firestore do Teleprompt com perfil

### Perfis de Usuário

| Perfil | Permissões |
|--------|------------|
| **Editor** | Criar, editar rascunhos e pendentes |
| **Validador** | Todas as permissões + validar/rejeitar roteiros + enviar |
| **Público (Link)** | Somente leitura do roteiro |

### Campos do Usuário
```typescript
{
  uid: string;          // Firebase Auth UID
  email: string;
  name: string;
  photoURL?: string;
  role: "editor" | "validador" | "publico";
  workspaceIds: string[];  // workspaces que tem acesso
  createdAt: timestamp;
}
```

---

## 2. Projetos (Teleprompt ↔ Zecki)

### Funcionalidades
- **Criar projeto**: Ao criar no Teleprompt, automaticamente cria no Zecki (workspace Senai)
- **Estrutura**: Com módulos (Matriz, Audiovisual, Visual, Extras)
- **Tarefa automática**: Já cria tarefa "Gravação de Vídeo" no projeto Zecki
- **Sincronização**: Roteiros validados/enviados adicionam links na tarefa

### API Route no Zecki: `POST /api/teleprompt/project`
```typescript
// Request (do Teleprompt)
{
  name: string;
  code: string;
  workspaceId: string; // "senai"
  createdBy: { uid: string; email: string };
}

// Response
{ projectId: string; taskId: string; }
```

---

## 3. Roteiros - Fluxo de Status

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│  RASCUNHO  │ ──► │  PENDENTE  │ ──► │ VALIDADO   │ ──► │  ENVIADO  │
└────────────┘     └────────────┘     └────────────┘     └────────────┘
      │                                    │                   │
      │ Editável                     Bloaqueado           + task Zecki
      │                          (só abre na data)      + links na
      │                                                 + subtarefa
```

### Regras por Status

| Status | Quem pode editar | Quem pode mudar status |
|--------|------------------|----------------------|
| Rascunho | Editor, Validador | → Pendente |
| Pendente | Validador | → Rascunho, Validado, Rejeitado |
| Validado | **Ninguém** (bloqueado) | → Enviado |
| Enviado | **Ninguém** (leitura only) | - |

### Bloqueio Especial
- Após "Validado", roteiro bloqueado para edição
- Pode desbloquear em data específica (dia da gravação)
- Campos: `lockedForEditing: boolean` + `unlockDate: timestamp`

---

## 4. Link Público (Visualização)

| Recurso | Descrição |
|---------|-----------|
| **Rota** | `/s/[id]` (somente leitura) |
| **Acesso** | Qualquer pessoa com o link |
| **Validação** | Roteiro deve ter `isPublic: true` |
| **Campos visíveis** | Title, Teleprompter, Imagens, Lettering |
| **Bloqueado** | Se `lockedForEditing: true` e ainda não chegou a data |

---

## 5. Estrutura de Dados

### Coleção: `projects`
```typescript
{
  id: string;
  name: string;
  code: string;
  workspaceId: string;
  zeckiProjectId?: string;  // ID do projeto no Zecki
  zeckiTaskId?: string;    // ID da tarefa de gravação no Zecki
  status: "active" | "completed" | "archived";
  modules: ModuleData[];
  createdBy: string;
  createdAt: timestamp;
}
```

### Coleção: `scripts`
```typescript
{
  id: string;
  projectId: string;
  title: string;
  status: "rascunho" | "pendente" | "validado" | "enviado" | "rejeitado";
  createdBy: string;
  createdByName: string;
  validatedBy?: string;
  validatedAt?: timestamp;
  sentAt?: timestamp;
  isPublic: boolean;
  lockedForEditing: boolean;
  unlockDate?: timestamp;
  rejectionReason?: string;
  // ... campos existentes do roteiro
}
```

---

## 6. Páginas a Criar/Atualizar

| Página | Caminho | Ação |
|--------|---------|------|
| Login | `/login` | Autenticação Firebase (Zecki) |
| Admin | `/admin` | Gerenciar usuários e perfis |
| Projetos | `/projects` | Lista + criar projetos (cria no Zecki) |
| Roteiros | `/scripts` | Lista com filtros por status |
| Editor | `/editor/[id]` | Editor com validação de perfil |
| Visualização | `/s/[id]` | Link público somente leitura |
| Dashboard | `/dashboard` | Painel com estatísticas |

---

## 7. Integração Zecki - API Routes

### Endpoint 1: Criar Projeto + Tarefa
```
POST /api/teleprompt/project
```

### Endpoint 2: Adicionar Link à Tarefa
```
POST /api/teleprompt/script-link
Body: { projectName, scriptTitle, scriptUrl }
```

### Endpoint 3: Atualizar Status
```
POST /api/teleprompt/status
Body: { scriptId, status, validatedBy }
```

---

## 8. Implementação por Fases

### Fase 1: Autenticação (2h)
- [ ] Criar AuthContext com Firebase Auth do Zecki
- [ ] Criar página de Login `/login`
- [ ] Criar proteção de rotas (Higher Order Component ou middleware)
- [ ] Criar coleção `users` com roles

### Fase 2: Admin - Gerenciamento de Usuários (2h)
- [ ] Criar página `/admin`
- [ ] Listar usuários
- [ ] Criar/editar usuário (definir role)
- [ ] Definir workspaces do usuário

### Fase 3: Projetos (3h)
- [ ] Criar página `/projects`
- [ ] Criar projeto no Teleprompt
- [ ] API Route no Zecki para criar projeto
- [ ] Ao criar, automaticamente cria no Zecki + tarefa Gravação

### Fase 4: Dashboard de Roteiros (2h)
- [ ] Atualizar `/dashboard` com filtros por status
- [ ] Cards com contagem por status
- [ ] Lista de roteiros com badges de status

### Fase 5: Fluxo de Validação (3h)
- [ ] Adicionar campos de status ao roteiro
- [ ] Botões para mudar status (Rascunho → Pendente → Validado → Enviado)
- [ ] Implementar lógica de bloqueio (lockedForEditing)
- [ ] Campo unlockDate para desbloquear

### Fase 6: Link Público (1h)
- [ ] Criar página `/s/[id]`
- [ ] Visualização somente leitura
- [ ] Verificar isPublic e lockedForEditing

### Fase 7: Integração Zecki - Enviar (3h)
- [ ] API Route no Zecki: adicionar link à tarefa
- [ ] Ao enviar, adicionar link do roteiro à tarefa de Gravação no Zecki
- [ ] Atualizar status do roteiro para "enviado"

### Fase 8: Testes e Ajustes (2h)
- [ ] Testar fluxo completo
- [ ] Ajustar UI/UX
- [ ] Corrigir bugs

---

## 9. Pré-requisitos

- [ ] API Routes no Zecki (3 endpoints)
- [ ] Credenciais Firebase Zecki no Teleprompt (.env)
- [ ] Criar workspace "Senai" no Teleprompt
- [ ] Migração ou criação de usuários iniciais

---

## 10. Variáveis de Ambiente (Teleprompt)

Adicionar ao `.env`:
```env
# Firebase Zecki (para Auth)
NEXT_PUBLIC_ZECKI_FIREBASE_API_KEY=...
NEXT_PUBLIC_ZECKI_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_ZECKI_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_ZECKI_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_ZECKI_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_ZECKI_FIREBASE_APP_ID=...

# Zecki API
NEXT_PUBLIC_ZECKI_API_URL=https://zecki1.com.br
ZECKI_API_KEY=...
```

---

## 11. Estrutura de Arquivos a Criar

```
src/
├── app/
│   ├── login/
│   │   └── page.tsx
│   ├── admin/
│   │   └── page.tsx
│   ├── projects/
│   │   └── page.tsx
│   ├── scripts/
│   │   └── page.tsx
│   ├── s/
│   │   └── [id]/
│   │       └── page.tsx
│   └── api/
│       └── teleprompt/
│           └── ...
├── components/
│   ├── auth/
│   │   └── AuthProvider.tsx
│   ├── admin/
│   │   ├── UserList.tsx
│   │   └── UserForm.tsx
│   ├── projects/
│   │   ├── ProjectList.tsx
│   │   └── ProjectForm.tsx
│   └── scripts/
│       ├── ScriptList.tsx
│       └── ScriptStatus.tsx
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   └── useAuth.ts
├── lib/
│   └── zecki.ts          # Cliente API para Zecki
└── services/
    └── users.ts           # CRUD de usuários
```

---

## 12. Ordem de Implementação Sugerida

1. **AuthContext** - Base de tudo
2. **Proteção de rotas** - Não deixar acessar sem login
3. **Login page** - Primeira página funcional
4. **Admin** - Criar usuários com perfis
5. **Projetos** - Criar/listar projetos
6. **Dashboard** - Lista de roteiros
7. **Editor** - Com validação de perfil
8. **Link público** - Visualização
9. **API Zecki** - Criar endpoints
10. **Integração** - Enviar roteiro

---

## Notas Importantes

- Firebase Auth usar projeto **dashboard-64641** (Zecki)
- Firestore do Teleprompt é **teleprompt-1** (separado)
- Workspace fixo: **Senai**
- Ao criar projeto no Teleprompt → cria projeto + tarefa "Gravação de Vídeo" no Zecki
- Ao enviar roteiro → adiciona link à subtarefa no Zecki
