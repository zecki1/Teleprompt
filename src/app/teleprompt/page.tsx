/**
 * /teleprompt — Página chooser (seletor de versão)
 *
 * Servida via rewrite do portfólio:
 *   www.zecki1.com.br/teleprompt → teleprompt-dun.vercel.app/teleprompt
 *
 * IMPORTANTE: todo o estilo é inline (sem classes Tailwind, sem imports de CSS)
 * porque essa rota é acessada via proxy reverso do portfólio — o browser
 * vê o domínio www.zecki1.com.br e tentaria buscar /_next/static/ no portfólio
 * (onde esses arquivos não existem). Inline CSS garante render correto em
 * qualquer domínio proxy.
 */
export const dynamic = "force-static";

export const metadata = {
  title: "Teleprompt — Escolha a versão",
  description: "Acesse o Teleprompt: aplicação principal ou versões Angular.",
  robots: "noindex",
};

export default function TelepromptChooserPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif',
        background: "#0f0f13",
        color: "#e4e4e7",
        padding: "1rem",
        boxSizing: "border-box",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            /* reset do body que o layout raiz impõe */
            body { background: #0f0f13 !important; }
            header, footer { display: none !important; }
            main { display: contents !important; }
            .chooser-btn:hover {
              border-color: #6161ff !important;
              background: #2a2a31 !important;
              transform: translateY(-1px);
            }
          `,
        }}
      />
      <div
        style={{
          maxWidth: 560,
          width: "100%",
          background: "#18181b",
          border: "1px solid #27272a",
          borderRadius: 16,
          padding: "2rem",
          textAlign: "center",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,.6)",
        }}
      >
        {/* Logo */}
        <p style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: ".5px", marginBottom: ".5rem" }}>
          ▸ Tele<span style={{ color: "#6161ff" }}>prompt</span>
        </p>
        <p style={{ margin: ".5rem 0 1.75rem", color: "#a1a1aa", fontSize: ".95rem" }}>
          Escolha a versão que você quer acessar
        </p>

        {/* Botão principal */}
        <a
          href="https://next.teleprompt.zecki1.com.br"
          className="chooser-btn"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "1rem 1.25rem",
            marginBottom: ".75rem",
            borderRadius: 12,
            border: "1px solid #6161ff40",
            background: "#212126",
            color: "#e4e4e7",
            fontSize: "1.05rem",
            fontWeight: 600,
            textDecoration: "none",
            transition: "border-color .15s, background .15s, transform .1s",
          }}
        >
          <span style={{ textAlign: "left" }}>
            Aplicação Principal
            <span
              style={{
                display: "inline-block",
                fontSize: ".65rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: ".05em",
                background: "#6161ff22",
                color: "#8888ff",
                border: "1px solid #6161ff44",
                borderRadius: 4,
                padding: "1px 6px",
                marginLeft: 8,
                verticalAlign: "middle",
              }}
            >
              Recomendado
            </span>
            <small style={{ display: "block", fontWeight: 400, color: "#a1a1aa", marginTop: 2, fontSize: ".85rem" }}>
              Next.js 15 — versão completa e atualizada
            </small>
          </span>
          <span style={{ fontSize: "1.3rem", color: "#6161ff", flexShrink: 0 }}>→</span>
        </a>

        {/* Divisor */}
        <div style={{ borderTop: "1px solid #27272a", margin: "1rem 0" }} />

        {/* Angular 22 */}
        <a
          href="https://angular22.teleprompt.zecki1.com.br"
          className="chooser-btn"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "1rem 1.25rem",
            marginBottom: ".75rem",
            borderRadius: 12,
            border: "1px solid #27272a",
            background: "#212126",
            color: "#e4e4e7",
            fontSize: "1.05rem",
            fontWeight: 600,
            textDecoration: "none",
            transition: "border-color .15s, background .15s, transform .1s",
          }}
        >
          <span style={{ textAlign: "left" }}>
            Angular 22
            <small style={{ display: "block", fontWeight: 400, color: "#a1a1aa", marginTop: 2, fontSize: ".85rem" }}>
              Frontend novo (frontend/)
            </small>
          </span>
          <span style={{ fontSize: "1.3rem", color: "#6161ff", flexShrink: 0 }}>→</span>
        </a>

        {/* Angular 17 */}
        <a
          href="https://angular17.teleprompt.zecki1.com.br"
          className="chooser-btn"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "1rem 1.25rem",
            marginBottom: ".75rem",
            borderRadius: 12,
            border: "1px solid #27272a",
            background: "#212126",
            color: "#e4e4e7",
            fontSize: "1.05rem",
            fontWeight: 600,
            textDecoration: "none",
            transition: "border-color .15s, background .15s, transform .1s",
          }}
        >
          <span style={{ textAlign: "left" }}>
            Angular 17
            <small style={{ display: "block", fontWeight: 400, color: "#a1a1aa", marginTop: 2, fontSize: ".85rem" }}>
              Frontend legado (frontend-angular/)
            </small>
          </span>
          <span style={{ fontSize: "1.3rem", color: "#6161ff", flexShrink: 0 }}>→</span>
        </a>

        <p style={{ marginTop: "1.5rem", fontSize: ".8rem", color: "#71717a" }}>
          As versões usam a mesma API e os mesmos dados.
        </p>
      </div>
    </div>
  );
}
