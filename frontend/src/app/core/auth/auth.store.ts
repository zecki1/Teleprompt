import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../api/auth.service';
import { getStoredToken, setStoredToken } from './token-store';
import type { LoginRequest, RegisterRequest, UserDto } from '../api/types';

export type AuthStatus =
  | 'idle'
  | 'loading'
  | 'authenticated'
  | 'anonymous';

export type DemoView = 'admin' | 'tecnico';

const DEMO_VIEW_KEY = 'tp_demo_view';

function readStoredDemo(): DemoView | null {
  try {
    const v = localStorage.getItem(DEMO_VIEW_KEY);
    return v === 'admin' || v === 'tecnico' ? v : null;
  } catch {
    return null;
  }
}

/** Usuário sintético da visualização demo (não toca o backend). */
function demoUser(view: DemoView): UserDto {
  const admin = view === 'admin';
  return {
    id: `demo-${view}`,
    email: 'demo@teleprompt.app',
    displayName: admin ? 'Demonstração — Admin' : 'Demonstração — Técnico',
    role: admin ? 'SuperAdmin' : 'Técnico',
    isSuperAdmin: admin,
    canManagePermissions: admin,
    canCollaborate: true,
    isEditor: true,
    isRevisor: admin,
    canRevert: admin,
    canViewAdmin: admin,
    canViewReports: admin,
    canViewActivityHistory: admin,
    canViewDebugLogs: admin,
    canAssign: admin,
    requiresChecklist: !admin,
    status: 'active',
    workspaceId: '',
  };
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly _real = signal<UserDto | null>(null);
  private readonly _demo = signal<DemoView | null>(readStoredDemo());
  private readonly _status = signal<AuthStatus>('idle');

  /** Usuário efetivo: a visualização demo (se ativa) sobrepõe o usuário real. */
  readonly user = computed<UserDto | null>(() => {
    const view = this._demo();
    return view ? demoUser(view) : this._real();
  });
  readonly isDemo = computed(() => this._demo() !== null);
  readonly demoView = this._demo.asReadonly();
  /**
   * Cliente de demonstração: visitante anônimo ou conta @teleprompt.app.
   * Botões "Ver como Admin/Técnico" e visões demo só existem para eles.
   */
  readonly isDemoCustomer = computed(() => {
    const real = this._real();
    return !real || /@teleprompt\.app$/i.test(real.email ?? '');
  });
  /** Demo conta como sessão autenticada para os guards. */
  readonly status = computed<AuthStatus>(() =>
    this._demo() ? 'authenticated' : this._status(),
  );

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
      this.applyRealUser(user);
      this._status.set('authenticated');
    } catch {
      setStoredToken(null);
      this._real.set(null);
      this._status.set('anonymous');
    }
  }

  /** Atualiza o usuário em memória (ex.: após editar o perfil). */
  refresh(user: UserDto): void {
    this.applyRealUser(user);
    this._status.set('authenticated');
  }

  /**
   * Aplica um usuário real à sessão. Clientes que não são de demonstração
   * (ex.: SESI/SENAI) nunca devem herdar uma visualização demo ativa.
   */
  private applyRealUser(user: UserDto): void {
    this._real.set(user);
    if (!/@teleprompt\.app$/i.test(user.email ?? '')) {
      this.exitDemo();
    }
  }

  /** Entra na visualização demo como admin/técnico (sem conta). */
  startDemo(view: DemoView): void {
    this._demo.set(view);
    try {
      localStorage.setItem(DEMO_VIEW_KEY, view);
    } catch {
      // ignore
    }
  }

  /** Sai da visualização demo. */
  exitDemo(): void {
    this._demo.set(null);
    try {
      localStorage.removeItem(DEMO_VIEW_KEY);
    } catch {
      // ignore
    }
  }

  async login(input: LoginRequest): Promise<void> {
    const res = await this.auth.login(input);
    setStoredToken(res.token);
    this.applyRealUser(res.user);
    this._status.set('authenticated');
  }

  async register(input: RegisterRequest): Promise<void> {
    const res = await this.auth.register(input);
    setStoredToken(res.token);
    this.applyRealUser(res.user);
    this._status.set('authenticated');
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    this.exitDemo();
    setStoredToken(null);
    this._real.set(null);
    this._status.set('anonymous');
    void this.router.navigate(['/login']);
  }
}
