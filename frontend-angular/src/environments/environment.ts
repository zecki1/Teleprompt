export const environment = {
  production: false,
  apiUrl: 'http://localhost:5026/api/v1',
  signalR: {
    scriptHubUrl: 'http://localhost:5026/hubs/script',
    tpHubUrl: 'http://localhost:5026/hubs/tp'
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
