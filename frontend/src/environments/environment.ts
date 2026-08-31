// Ambiente de DESENVOLVIMENTO (ng serve / build development).
// Em dev, o dev-server do Angular encaminha /api e /hubs para o backend
// via proxy.conf.json (http://127.0.0.1:5026), então a origem é '' (mesma).
export const environment = {
  production: false,
  apiUrl: '',
};
