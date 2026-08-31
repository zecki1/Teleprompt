import {
  HttpErrorResponse,
  HttpRequest,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';

import { API_BASE_URL, API_PREFIX } from '../config';
import { getStoredToken, setStoredToken } from '../auth/token-store';

const AUTH_PATHS = [
  `${API_PREFIX}/auth/login`,
  `${API_PREFIX}/auth/register`,
  `${API_PREFIX}/auth/refresh`,
  `${API_PREFIX}/demo/`,
];

let refreshInFlight: Promise<string | null> | null = null;

function isAuthPath(url: string): boolean {
  return AUTH_PATHS.some((p) => url.includes(p)) || url.includes('/demo/');
}

/** Renova o JWT uma única vez mesmo com várias requisições 401 concorrentes. */
function refreshOnce(baseUrl: string): Promise<string | null> {
  refreshInFlight ??= (async () => {
    const token = getStoredToken();
    if (!token) return null;
    try {
      const res = await fetch(`${baseUrl}${API_PREFIX}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { token?: string };
      if (!data.token) return null;
      setStoredToken(data.token);
      return data.token;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const baseUrl = inject(API_BASE_URL);
  const router = inject(Router);

  const token = getStoredToken();
  const skip = isAuthPath(req.url) || !token;

  const authed: HttpRequest<unknown> = skip
    ? req
    : req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

  return next(authed).pipe(
    catchError((err: unknown) => {
      if (
        err instanceof HttpErrorResponse &&
        err.status === 401 &&
        !skip &&
        !authed.headers.has('X-Retried')
      ) {
        return from(refreshOnce(baseUrl)).pipe(
          switchMap((newToken) => {
            if (!newToken) {
              setStoredToken(null);
              void router.navigate(['/login']);
              return throwError(() => err);
            }
            const retry = req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}`, 'X-Retried': '1' },
            });
            return next(retry);
          }),
        );
      }
      return throwError(() => err);
    }),
  );
};
