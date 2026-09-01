# URLs públicas desejadas — `zecki1.com.br/teleprompt/*`

Objetivo: acessar as 3 versões por subrotas limpas no domínio raiz, em vez de subdomínios.

| Versão | URL desejada |
|---|---|
| Chooser (cards) | `https://zecki1.com.br/teleprompt` |
| Next.js | `https://zecki1.com.br/teleprompt/next` |
| Angular 22 | `https://zecki1.com.br/teleprompt/angular22` |
| Angular 17 | `https://zecki1.com.br/teleprompt/angular17` |

> ⚠️ O domínio `zecki1.com.br` **não está neste repositório** (é outro projeto Vercel).
> Por isso, a configuração abaixo é um **passo-a-passo para você aplicar no painel/Vercel daquele projeto**.
> Os arquivos são entregues prontos em `deploy/`.

---

## Opção A — Um único projeto Vercel agregador (recomendada)

Subir as builds dos 3 subapps **num único projeto Vercel** (`zecki1.com.br`) com `basePath`/`baseHref`
definidos para cada subrota. É a abordagem mais estável (não depende de proxy entre projetos).

### 1. Next.js — configurar `basePath`

No `next.config.ts`, o `basePath` é lido de uma env para não quebrar o deploy de subdomínio atual:

```ts
basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
```

No projeto Vercel, ao direcionar para a subrota, defina `NEXT_PUBLIC_BASE_PATH=/teleprompt/next`.
(Quando não definido, `basePath=""` → mantém o comportamento de subdomínio atual.)

### 2. Angular 22 e Angular 17 — configurar `baseHref`

O `baseHref` do Angular é definido no **build**. Use `ng build --base-href="/teleprompt/angular22/"`
(22) e `--base-href="/teleprompt/angular17/"` (17). Nos `vercel.json`:

```json
// frontend/vercel.json (Angular 22)
{
  "framework": "angular",
  "buildCommand": "ng build --configuration production --base-href /teleprompt/angular22/",
  "outputDirectory": "dist/frontend/browser"
}
```

```json
// frontend-angular/vercel.json (Angular 17)
{
  "framework": "angular",
  "buildCommand": "ng build --configuration production --base-href /teleprompt/angular17/",
  "outputDirectory": "dist/teleprompt-frontend/browser"
}
```

### 3. `vercel.json` do site `zecki1.com.br` (projeto agregador)

Veja `deploy/zecki1-site.vercel.json` e ajuste os caminhos de saída conforme as builds.

---

## Opção B — Proxy/rewrites para os subdomínios atuais (mais simples, aperfeiçoável)

Colar no `vercel.json` do projeto `zecki1.com.br` (só funciona por completo se cada subapp usar
`basePath`/`baseHref` conforme a Opção A; caso contrário os assets internos quebram):

```json
{
  "rewrites": [
    { "source": "/teleprompt/:path*", "destination": "/teleprompt/chooser/:path*" },
    { "source": "/teleprompt/next/:path*", "destination": "https://next.teleprompt.zecki1.com.br/teleprompt/next/:path*" },
    { "source": "/teleprompt/angular22/:path*", "destination": "https://angular22.teleprompt.zecki1.com.br/teleprompt/angular22/:path*" },
    { "source": "/teleprompt/angular17/:path*", "destination": "https://angular17.teleprompt.zecki1.com.br/teleprompt/angular17/:path*" }
  ]
}
```

> Ref: `deploy/SITE_URLS.md` (este arquivo).
