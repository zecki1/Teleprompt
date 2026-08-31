/**
 * GET /teleprompt
 *
 * Route Handler que retorna HTML puro — sem runtime Next.js, sem /_next/static,
 * sem scripts de hydration. Funciona corretamente quando servido via proxy reverso
 * do portfólio (www.zecki1.com.br/teleprompt → teleprompt-dun.vercel.app/teleprompt)
 * porque o browser só recebe HTML+CSS autocontido, nada mais.
 */
export const dynamic = "force-static";

const HTML = /* html */ `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Teleprompt — Escolha a versão</title>
  <meta name="robots" content="noindex">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      background: #0f0f13;
      color: #e4e4e7;
      padding: 1rem;
    }
    .card {
      max-width: 560px;
      width: 100%;
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 16px;
      padding: 2rem;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,.6);
    }
    .logo { font-size: 1.6rem; font-weight: 800; letter-spacing: .5px; margin-bottom: .5rem; }
    .logo span { color: #6161ff; }
    .subtitle { margin: .5rem 0 1.75rem; color: #a1a1aa; font-size: .95rem; }
    .btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 1rem 1.25rem;
      margin-bottom: .75rem;
      border-radius: 12px;
      border: 1px solid #27272a;
      background: #212126;
      color: #e4e4e7;
      font-size: 1.05rem;
      font-weight: 600;
      text-decoration: none;
      transition: border-color .15s, background .15s, transform .1s;
    }
    .btn:hover { border-color: #6161ff; background: #2a2a31; transform: translateY(-1px); }
    .btn.primary { border-color: rgba(97,97,255,.25); }
    .btn small { display: block; font-weight: 400; color: #a1a1aa; margin-top: 2px; font-size: .85rem; }
    .arrow { font-size: 1.3rem; color: #6161ff; flex-shrink: 0; }
    .badge {
      display: inline-block;
      font-size: .65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .05em;
      background: rgba(97,97,255,.13);
      color: #8888ff;
      border: 1px solid rgba(97,97,255,.27);
      border-radius: 4px;
      padding: 1px 6px;
      margin-left: 8px;
      vertical-align: middle;
    }
    .divider { border: none; border-top: 1px solid #27272a; margin: 1rem 0; }
    .footer { margin-top: 1.5rem; font-size: .8rem; color: #71717a; }
  </style>
</head>
<body>
  <div class="card">
    <p class="logo">▸ Tele<span>prompt</span></p>
    <p class="subtitle">Escolha a versão que você quer acessar</p>

    <a class="btn primary" href="https://next.teleprompt.zecki1.com.br">
      <span>
        Aplicação Principal
        <span class="badge">Recomendado</span>
        <small>Next.js 15 — versão completa e atualizada</small>
      </span>
      <span class="arrow">→</span>
    </a>

    <div class="divider"></div>

    <a class="btn" href="https://angular22.teleprompt.zecki1.com.br">
      <span>
        Angular 22
        <small>Frontend novo (frontend/)</small>
      </span>
      <span class="arrow">→</span>
    </a>

    <a class="btn" href="https://angular17.teleprompt.zecki1.com.br">
      <span>
        Angular 17
        <small>Frontend legado (frontend-angular/)</small>
      </span>
      <span class="arrow">→</span>
    </a>

    <p class="footer">As versões usam a mesma API e os mesmos dados.</p>
  </div>
</body>
</html>`;

export async function GET() {
  return new Response(HTML, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
