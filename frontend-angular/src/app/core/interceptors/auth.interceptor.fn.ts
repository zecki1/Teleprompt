import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { environment } from '@env/environment';
import { switchMap, catchError, throwError, BehaviorSubject, filter, take } from 'rxjs';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const isDemo = authService.isDemo() || req.url.includes('/demo/');
  const token = isDemo ? null : authService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401 && !req.url.includes('/auth/') && !isDemo) {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          return authService.refreshToken().pipe(
            switchMap(response => {
              isRefreshing = false;
              refreshTokenSubject.next(response.token);
              return next(req.clone({
                setHeaders: { Authorization: `Bearer ${response.token}` }
              }));
            }),
            catchError(err => {
              isRefreshing = false;
              authService.logout();
              return throwError(() => err);
            })
          );
        }

        return refreshTokenSubject.pipe(
          filter(t => t !== null),
          take(1),
          switchMap(t => next(req.clone({
            setHeaders: { Authorization: `Bearer ${t}` }
          })))
        );
      }
      return throwError(() => error);
    })
  );
};
