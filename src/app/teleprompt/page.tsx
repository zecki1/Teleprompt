import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Teleprompt — Escolha a versão",
  description: "Escolha a versão da suíte de teleprompter para acessar.",
};

const versions = [
  {
    href: "https://next.teleprompt.zecki1.com.br",
    name: "Next.js",
    detail: "Aplicação principal (recomendada)",
  },
  {
    href: "https://angular22.teleprompt.zecki1.com.br",
    name: "Angular 22",
    detail: "Frontend novo (frontend/)",
  },
  {
    href: "https://angular17.teleprompt.zecki1.com.br",
    name: "Angular 17",
    detail: "Frontend antigo (frontend-angular/)",
  },
];

export default function TelepromptChooserPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f0f13",
        color: "#e4e4e7",
        padding: "1rem",
        fontFamily:
          '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif',
      }}
    >
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
        <p style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: ".5px" }}>
          {"\u25B8 "}Tele
          <span style={{ color: "#6161ff" }}>prompt</span>
        </p>
        <p
          style={{
            margin: ".5rem 0 1.75rem",
            color: "#a1a1aa",
            fontSize: ".95rem",
          }}
        >
          Escolha a versão que você quer acessar
        </p>

        {versions.map((v) => (
          <Link
            key={v.href}
            href={v.href}
            target="_blank"
            rel="noopener noreferrer"
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
              transition:
                "border-color .15s, background .15s, transform .1s",
              boxSizing: "border-box",
            }}
          >
            <span>
              {v.name}
              <small
                style={{
                  display: "block",
                  fontWeight: 400,
                  color: "#a1a1aa",
                  marginTop: 2,
                }}
              >
                {v.detail}
              </small>
            </span>
            <span style={{ fontSize: "1.3rem", color: "#6161ff" }}>
              {"\u2192"}
            </span>
          </Link>
        ))}

        <p style={{ marginTop: "1.5rem", fontSize: ".8rem", color: "#71717a" }}>
          As três versões usam a mesma API e os mesmos dados.
        </p>
      </div>
    </main>
  );
}
