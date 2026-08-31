import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '@env/environment';
import { User, AuthResponse, LoginRequest, RegisterRequest, Role, UserStatus } from '../models/user.model';
import * as AuthActions from '@store/auth/auth.actions';

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
function demoUser(view: DemoView): User {
  const admin = view === 'admin';
  return {
    id: `demo-${view}`,
    email: 'demo@teleprompt.app',
    displayName: admin ? 'Demonstração — Admin' : 'Demonstração — Técnico',
    role: admin ? Role.SuperAdmin : Role.Tecnico,
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
    status: UserStatus.Active,
    avatarUrl: '',
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUser = signal<User | null>(null);
  private readonly token = signal<string | null>(null);
  private readonly isLoading = signal<boolean>(false);
  private readonly demo = signal<DemoView | null>(readStoredDemo());

  readonly user = computed<User | null>(() => {
    const view = this.demo();
    return view ? demoUser(view) : this.currentUser();
  });
  readonly isDemo = computed(() => this.demo() !== null);
  readonly demoView = this.demo.asReadonly();
  /** Visitante anônimo ou conta @teleprompt.app: única parcela com recursos demo. */
  readonly isDemoCustomer = computed(() => {
    const real = this.currentUser();
    return !real || /@teleprompt\.app$/i.test(real.email ?? '');
  });
  readonly isAuthenticated = computed(() => !!this.token() || !!this.demo());
  readonly loading = this.isLoading.asReadonly();

  constructor(
    private http: HttpClient,
    private router: Router,
    private store: Store
  ) {
    this.loadFromStorage();
  }

  /** Entra na visualização demo como admin/técnico (sem conta). */
  startDemo(view: DemoView): void {
    localStorage.removeItem(environment.jwt.tokenKey);
    localStorage.removeItem(environment.jwt.refreshTokenKey);
    localStorage.removeItem('teleprompt_user');
    this.token.set(null);
    this.currentUser.set(null);
    this.demo.set(view);
    try {
      localStorage.setItem(DEMO_VIEW_KEY, view);
    } catch {
      // ignore
    }
    this.store.dispatch(AuthActions.loadUserSuccess({ user: demoUser(view) }));
  }

  /** Sai da visualização demo. */
  exitDemo(): void {
    this.demo.set(null);
    try {
      localStorage.removeItem(DEMO_VIEW_KEY);
    } catch {
      // ignore
    }
    this.store.dispatch(AuthActions.logout());
  }

  loadFromStorage(): void {
    const storedToken = localStorage.getItem(environment.jwt.tokenKey);
    const storedUser = localStorage.getItem('teleprompt_user');
    if (storedToken && storedUser) {
      this.token.set(storedToken);
      this.currentUser.set(JSON.parse(storedUser));
      this.ensureNoDemoForRealUser();
    }
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    this.isLoading.set(true);
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, request).pipe(
      tap(response => {
        this.setSession(response);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    this.isLoading.set(true);
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, request).pipe(
      tap(response => {
        this.setSession(response);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(environment.jwt.tokenKey);
    localStorage.removeItem(environment.jwt.refreshTokenKey);
    localStorage.removeItem('teleprompt_user');
    localStorage.removeItem(DEMO_VIEW_KEY);
    this.token.set(null);
    this.currentUser.set(null);
    this.demo.set(null);
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<AuthResponse> {
    const currentToken = this.token();
    if (!currentToken) {
      return throwError(() => new Error('No token available'));
    }
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, { token: currentToken }).pipe(
      tap(response => this.setSession(response))
    );
  }

  getMe(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/auth/me`).pipe(
      tap(user => {
        this.currentUser.set(user);
        this.ensureNoDemoForRealUser();
        localStorage.setItem('teleprompt_user', JSON.stringify(user));
      })
    );
  }

  getToken(): string | null {
    return this.token();
  }

  hasPermission(permission: keyof User): boolean {
    const user = this.user();
    if (!user) return false;
    return !!user[permission];
  }

  getTheme(): string {
    return localStorage.getItem('teleprompt_theme') || 'light';
  }

  setTheme(theme: string): void {
    localStorage.setItem('teleprompt_theme', theme);
  }

  private setSession(response: AuthResponse): void {
    localStorage.setItem(environment.jwt.tokenKey, response.token);
    localStorage.setItem('teleprompt_user', JSON.stringify(response.user));
    this.token.set(response.token);
    this.currentUser.set(response.user);
    this.ensureNoDemoForRealUser();
  }

  /**
   * Clientes reais fora do domínio da demonstração não herdam uma visão demo
   * ativa de sessões anteriores.
   */
  private ensureNoDemoForRealUser(): void {
    if (!/@teleprompt\.app$/i.test(this.currentUser()?.email ?? '')) {
      this.demo.set(null);
      try {
        localStorage.removeItem(DEMO_VIEW_KEY);
      } catch {
        // ignore
      }
    }
  }
}
