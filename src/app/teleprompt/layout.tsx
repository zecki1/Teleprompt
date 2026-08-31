/**
 * Layout isolado para /teleprompt.
 *
 * Não herda header/footer/auth do layout raiz — a página chooser
 * é uma landing page standalone (pode ser acessada sem login
 * via proxy reverso do portfólio www.zecki1.com.br).
 */
export default function TelepromptLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
