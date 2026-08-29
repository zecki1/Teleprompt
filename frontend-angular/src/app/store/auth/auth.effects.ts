import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, exhaustMap, catchError, tap } from 'rxjs/operators';
import { AuthService } from '@core/auth/auth.service';
import { environment } from '@env/environment';
import { ObservabilityService } from '@core/services/observability.service';
import * as AuthActions from './auth.actions';

function friendlyAuthError(error: unknown, fallback: string): string {
  const status = (error as { status?: number }).status;
  // Erro de rede (status 0/undefined no HttpClient) → mostra a URL real da API.
  if (status === 0 || status === undefined) {
    return `Não foi possível conectar à API em ${environment.apiUrl}. Verifique sua internet ou se o backend está no ar.`;
  }
  return (error as { error?: { message?: string } }).error?.message || fallback;
}

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private router = inject(Router);
  private observability = inject(ObservabilityService);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ request }) =>
        this.authService.login(request).pipe(
          map(response => AuthActions.loginSuccess({ response })),
          catchError(error => {
            this.observability.trackError(error, { context: 'login' });
            return of(AuthActions.loginFailure({
              error: friendlyAuthError(error, 'Erro ao fazer login')
            }));
          })
        )
      )
    )
  );

  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(() => {
          this.observability.trackUserAction('login', 'auth');
          this.router.navigate(['/dashboard']);
        })
      ),
    { dispatch: false }
  );

  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      exhaustMap(({ request }) =>
        this.authService.register(request).pipe(
          map(response => AuthActions.registerSuccess({ response })),
          catchError(error => {
            this.observability.trackError(error, { context: 'register' });
            return of(AuthActions.registerFailure({
              error: friendlyAuthError(error, 'Erro ao criar conta')
            }));
          })
        )
      )
    )
  );

  registerSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.registerSuccess),
        tap(() => {
          this.observability.trackUserAction('register', 'auth');
          this.router.navigate(['/dashboard']);
        })
      ),
    { dispatch: false }
  );

  logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logout),
        tap(() => {
          this.authService.logout();
          this.observability.trackUserAction('logout', 'auth');
        })
      ),
    { dispatch: false }
  );

  loadUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadUser),
      exhaustMap(() =>
        this.authService.getMe().pipe(
          map(user => AuthActions.loadUserSuccess({ user })),
          catchError(() => of(AuthActions.loadUserFailure({ error: 'Session expired' })))
        )
      )
    )
  );

  refreshToken$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.refreshToken),
      exhaustMap(() =>
        this.authService.refreshToken().pipe(
          map(response => AuthActions.refreshTokenSuccess({ response })),
          catchError(() => of(AuthActions.refreshTokenFailure()))
        )
      )
    )
  );
}
