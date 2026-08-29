// URL base da API em PRODUÇÃO (Vercel → GCP).
// Troque api.teleprompt.zecki1.com.br pelo domínio HTTPS que você apontar
// para a VM (nginx + certbot). Todas as chamadas dos 3 frontends vão pra cá.
const API_BASE = 'https://api.teleprompt.zecki1.com.br';

export const environment = {
  production: true,
  apiUrl: `${API_BASE}/api/v1`,
  signalR: {
    scriptHubUrl: `${API_BASE}/hubs/script`,
    tpHubUrl: `${API_BASE}/hubs/tp`
  },
  jwt: {
    tokenKey: 'teleprompt_token',
    refreshTokenKey: 'teleprompt_refresh_token'
  },
  observability: {
    enabled: true,
    grafanaEndpoint: '',
    dynatraceEnabled: true,
    dynatraceTenantId: '',
    dynatraceApiToken: ''
  },
  features: {
    microfrontendEnabled: true,
    pwaEnabled: true
  }
};