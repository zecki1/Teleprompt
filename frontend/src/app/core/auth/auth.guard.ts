import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthStore } from './auth.store';

/** Exige sessão autenticada; redireciona para /login caso contrário. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  if (auth.status() === 'authenticated') return true;

  if (auth.status() === 'idle' && auth.token) {
    // Bootstrap ainda não terminou: deixa passar e o /auth/me valida.
    return true;
  }

  return router.createUrlTree(['/login']);
};

/** Impede que usuários autenticados vejam login/registro. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  if (auth.status() === 'authenticated') {
    return router.createUrlTree(['/dashboard']);
  }
  return true;
};
