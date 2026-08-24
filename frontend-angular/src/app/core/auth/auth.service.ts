import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '@env/environment';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUser = signal<User | null>(null);
  private readonly token = signal<string | null>(null);
  private readonly isLoading = signal<boolean>(false);

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this.token());
  readonly loading = this.isLoading.asReadonly();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadFromStorage();
  }

  loadFromStorage(): void {
    const storedToken = localStorage.getItem(environment.jwt.tokenKey);
    const storedUser = localStorage.getItem('teleprompt_user');
    if (storedToken && storedUser) {
      this.token.set(storedToken);
      this.currentUser.set(JSON.parse(storedUser));
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
    this.token.set(null);
    this.currentUser.set(null);
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
        localStorage.setItem('teleprompt_user', JSON.stringify(user));
      })
    );
  }

  getToken(): string | null {
    return this.token();
  }

  hasPermission(permission: keyof User): boolean {
    const user = this.currentUser();
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
  }
}
