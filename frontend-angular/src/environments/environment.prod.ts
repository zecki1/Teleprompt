export const environment = {
  production: true,
  apiUrl: '/api/v1',
  signalR: {
    scriptHubUrl: '/hubs/script',
    tpHubUrl: '/hubs/tp'
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
