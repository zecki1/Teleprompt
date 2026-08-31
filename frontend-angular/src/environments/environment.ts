const isBrowser = typeof window !== 'undefined';
const isLocal = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = isLocal || !isBrowser ? 'http://localhost:5026' : 'https://api.teleprompt.zecki1.com.br';

export const environment = {
  production: false,
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
    enabled: false,
    grafanaEndpoint: 'http://localhost:3000',
    dynatraceEnabled: false,
    dynatraceTenantId: '',
    dynatraceApiToken: ''
  },
  features: {
    microfrontendEnabled: false,
    pwaEnabled: false
  }
};
