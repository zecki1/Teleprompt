import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../api/auth.service';
import { getStoredToken, setStoredToken } from './token-store';
import type { LoginRequest, RegisterRequest, UserDto } from '../api/types';

export type AuthStatus =
  | 'idle'
  | 'loading'
  | 'authenticated'
  | 'anonymous';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly _user = signal<UserDto | null>(null);
  private readonly _status = signal<AuthStatus>('idle');

  readonly user = this._user.asReadonly();
  readonly status = this._status.asReadonly();

  get token(): string | null {
    return getStoredToken();
  }

  /** Restaura a sessão a partir do token salvo. Chamado uma vez no bootstrap. */
  async bootstrap(): Promise<void> {
    if (!getStoredToken()) {
      this._status.set('anonymous');
      return;
    }
    this._status.set('loading');
    try {
      const user = await this.auth.me();
      this._user.set(user);
      this._status.set('authenticated');
    } catch {
      setStoredToken(null);
      this._user.set(null);
      this._status.set('anonymous');
    }
  }

  /** Atualiza o usuário em memória (ex.: após editar o perfil). */
  refresh(user: UserDto): void {
    this._user.set(user);
    this._status.set('authenticated');
  }

  async login(input: LoginRequest): Promise<void> {
    const res = await this.auth.login(input);
    setStoredToken(res.token);
    this._user.set(res.user);
    this._status.set('authenticated');
  }

  async register(input: RegisterRequest): Promise<void> {
    const res = await this.auth.register(input);
    setStoredToken(res.token);
    this._user.set(res.user);
    this._status.set('authenticated');
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    setStoredToken(null);
    this._user.set(null);
    this._status.set('anonymous');
    void this.router.navigate(['/login']);
  }
}
