// Ambiente de PRODUÇÃO (ng build --configuration production).
// API HTTPS na VM GCP (nginx + certbot) → frontends na Vercel.
export const environment = {
  production: true,
  apiUrl: 'https://api.teleprompt.zecki1.com.br',
};
