import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AuthStore } from './core/auth/auth.store';
import { API_BASE_URL } from './core/config';
import { environment } from '../environments/environment';

function resolveApiUrl(): string {
  if (typeof window !== 'undefined') {
    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
    if (
      !isLocal &&
      (!environment.apiUrl ||
        environment.apiUrl.includes('localhost') ||
        environment.apiUrl.includes('127.0.0.1'))
    ) {
      return 'https://api.teleprompt.zecki1.com.br';
    }
  }
  return environment.apiUrl;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAppInitializer(() => inject(AuthStore).bootstrap()),
    { provide: API_BASE_URL, useFactory: resolveApiUrl },
  ],
};
