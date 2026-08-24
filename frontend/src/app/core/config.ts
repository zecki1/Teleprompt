import { InjectionToken } from '@angular/core';

/**
 * URL base da API (sem barra final).
 *
 * Default: mesma origem ('') — o dev-server do Angular encaminha /api e /hubs
 * ao backend em http://localhost:5026 via proxy.conf.json, eliminando CORS.
 * Em produção com API em outro domínio, sobrescreva:
 *   { provide: API_BASE_URL, useValue: 'https://api.seudominio.com' }
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => '',
});

export const API_PREFIX = '/api/v1';
