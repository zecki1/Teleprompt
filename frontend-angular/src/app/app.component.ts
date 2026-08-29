import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthService } from './core/auth/auth.service';
import * as AuthActions from './store/auth/auth.actions';
import { selectIsAuthenticated, selectDisplayName, selectUser } from './store/auth/auth.selectors';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    @if (isAuthenticated() && !isAuthPage()) {
      <header class="site-header">
        <div class="header-inner">
          <div class="header-left">
            <a routerLink="/dashboard" class="logo">
              <div class="logo-icon-box">
                <span class="logo-terminal-icon">▸</span>
              </div>
              <span class="logo-text">Teleprompt</span>
            </a>
          </div>

          <nav class="header-nav desktop-only">
            <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">Dashboard</a>
            <a routerLink="/projects" routerLinkActive="active" class="nav-link">Projetos</a>
            @if (user()?.canViewAdmin) {
              <a routerLink="/admin/users" routerLinkActive="active" class="nav-link nav-admin">Administração</a>
            }
            @if (user()?.canViewReports) {
              <a routerLink="/reports" routerLinkActive="active" class="nav-link">Relatórios</a>
            }
          </nav>

          <div class="header-right">
            @if (authService.isDemo()) {
              <span class="demo-badge">
                Demo: {{ authService.demoView() === 'admin' ? 'Admin' : 'Técnico' }}
              </span>
            }
            <button class="theme-toggle" (click)="toggleTheme()" [title]="isDark() ? 'Modo claro' : 'Modo escuro'">
              @if (isDark()) {
                <span class="icon-sun">☀</span>
              } @else {
                <span class="icon-moon">☾</span>
              }
            </button>

            @if (user()) {
              <div class="user-menu" (click)="menuOpen.set(!menuOpen())">
                <div class="user-info-desktop desktop-only">
                  <span class="user-name-sm">{{ user()!.displayName }}</span>
                  <span class="user-role-sm">{{ user()!.role }}</span>
                </div>
                <div class="avatar-circle">
                  {{ initials() }}
                </div>
              </div>
            } @else {
              <button class="btn-outline-header" routerLink="/auth/login">Entrar</button>
            }

            <div class="mobile-menu-trigger mobile-only">
              <button class="hamburger-btn" (click)="mobileOpen.set(!mobileOpen())">
                @if (mobileOpen()) { ✕ } @else { ☰ }
              </button>
            </div>
          </div>
        </div>

        @if (menuOpen()) {
          <div class="dropdown-backdrop" (click)="menuOpen.set(false)"></div>
          <div class="dropdown-menu animate-slide-down">
            <div class="dropdown-label">
              <p class="dropdown-display-name">{{ user()!.displayName }}</p>
              <p class="dropdown-email">{{ user()!.email }}</p>
            </div>
            <div class="dropdown-separator"></div>
            <a routerLink="/dashboard" class="dropdown-item" (click)="menuOpen.set(false)">Dashboard</a>
            <a routerLink="/projects" class="dropdown-item" (click)="menuOpen.set(false)">Projetos</a>
            <a routerLink="/profile" class="dropdown-item" (click)="menuOpen.set(false)">Perfil</a>
            <a routerLink="/workspaces" class="dropdown-item" (click)="menuOpen.set(false)">Workspaces</a>
            @if (user()?.canViewAdmin) {
              <a routerLink="/admin/users" class="dropdown-item" (click)="menuOpen.set(false)">Painel Admin</a>
            }
            @if (user()?.canViewReports) {
              <a routerLink="/reports" class="dropdown-item" (click)="menuOpen.set(false)">Relatórios</a>
            }
            <div class="dropdown-separator"></div>
            <button class="dropdown-item destructive" (click)="logout()">Sair</button>
          </div>
        }

        @if (mobileOpen()) {
          <div class="mobile-sheet animate-slide-down">
            <div class="mobile-sheet-header">
              <span class="logo-terminal-icon" style="font-size: 18px;">▸</span>
              <span style="font-weight: 700; font-size: 16px;">Navegação</span>
            </div>
            <nav class="mobile-nav">
              <a routerLink="/dashboard" routerLinkActive="active" (click)="mobileOpen.set(false)">Dashboard</a>
              <a routerLink="/projects" routerLinkActive="active" (click)="mobileOpen.set(false)">Projetos</a>
              @if (user()?.canViewAdmin) {
                <a routerLink="/admin/users" routerLinkActive="active" (click)="mobileOpen.set(false)">Administração</a>
              }
              @if (user()?.canViewReports) {
                <a routerLink="/reports" routerLinkActive="active" (click)="mobileOpen.set(false)">Relatórios</a>
              }
              <div class="mobile-separator"></div>
              <a routerLink="/profile" (click)="mobileOpen.set(false)">Perfil</a>
              <button class="destructive-text" (click)="logout()">Sair</button>
            </nav>
          </div>
        }
      </header>
    }

    <main [class.main-content]="isAuthenticated() && !isAuthPage()" [class.auth-layout]="!isAuthenticated() || isAuthPage()">
      <router-outlet></router-outlet>
    </main>

    @if (isAuthenticated() && !isAuthPage()) {
      <footer class="site-footer">
        <div class="footer-inner">
          <p class="footer-text">© {{ currentYear }} zecki1. Todos os direitos reservados.</p>
        </div>
      </footer>
    }
  `,
  styles: [`
    .site-header {
      position: sticky;
      top: 0;
      z-index: 50;
      width: 100%;
      border-bottom: 1px solid var(--border);
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }
    .dark .site-header {
      background: rgba(24,24,27,0.95);
    }

    .header-inner {
      max-width: 1280px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 4rem;
      padding: 0 1rem;
    }
    @media (min-width: 640px) { .header-inner { padding: 0 1.5rem; } }

    .header-left { display: flex; align-items: center; gap: 2rem; }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      color: var(--foreground);
    }
    .logo-icon-box {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      background: var(--primary);
      color: var(--primary-foreground);
      border-radius: 6px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    .logo-terminal-icon { font-size: 16px; font-weight: 900; }
    .logo-text {
      font-weight: 700;
      font-size: 1.125rem;
      color: var(--primary);
    }
    .dark .logo-text { color: var(--foreground); }

    .header-nav {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--muted-foreground);
    }
    .nav-link {
      color: var(--muted-foreground);
      text-decoration: none;
      transition: color 0.15s;
      white-space: nowrap;
    }
    .nav-link:hover, .nav-link.active {
      color: var(--primary);
    }
    .nav-link.nav-admin {
      font-weight: 700;
      color: var(--blue-500);
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .theme-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem;
      border-radius: 0.5rem;
      border: none;
      background: transparent;
      color: var(--zinc-400);
      cursor: pointer;
      transition: color 0.15s, background 0.15s;
    }
    .theme-toggle:hover { color: #fff; background: var(--zinc-800); }
    .dark .theme-toggle:hover { color: var(--zinc-900); background: var(--zinc-200); }
    .icon-sun, .icon-moon { font-size: 16px; }

    .demo-badge {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 0.25rem 0.625rem;
      border-radius: 999px;
      border: 1px solid #7c3aed;
      color: #a78bfa;
      background: rgb(124 58 237 / 0.15);
      white-space: nowrap;
    }
    .dark .demo-badge {
      color: #c4b5fd;
      background: rgb(139 92 246 / 0.18);
    }

    .user-menu {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      position: relative;
    }
    .user-info-desktop {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0;
    }
    .user-name-sm {
      font-size: 10px;
      font-weight: 700;
      color: var(--zinc-400);
      line-height: 1.2;
      transition: color 0.15s;
    }
    .user-menu:hover .user-name-sm { color: var(--primary); }
    .user-role-sm {
      font-size: 9px;
      color: var(--zinc-500);
      line-height: 1.2;
    }

    .avatar-circle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1px solid var(--border);
      background: var(--muted);
      color: var(--muted-foreground);
      font-size: 11px;
      font-weight: 600;
      transition: border-color 0.15s;
    }
    .user-menu:hover .avatar-circle { border-color: var(--primary); }

    .btn-outline-header {
      padding: 0.375rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: transparent;
      color: var(--foreground);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-outline-header:hover { background: var(--accent); }

    .dropdown-backdrop {
      position: fixed;
      inset: 0;
      z-index: 40;
    }

    .dropdown-menu {
      position: absolute;
      right: 0;
      top: calc(100% + 4px);
      min-width: 256px;
      background: var(--popover);
      color: var(--popover-foreground);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 0.25rem;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
      z-index: 50;
    }
    .dark .dropdown-menu {
      border-color: rgba(255,255,255,0.1);
    }

    .dropdown-label { padding: 0.75rem 0.5rem; }
    .dropdown-display-name { font-size: 0.875rem; font-weight: 500; color: var(--foreground); }
    .dropdown-email { font-size: 0.75rem; color: var(--zinc-500); margin-top: 2px; }

    .dropdown-separator { height: 1px; background: var(--border); margin: 0.25rem 0; }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.5rem 0.5rem;
      border: none;
      background: transparent;
      color: var(--foreground);
      font-size: 0.875rem;
      font-weight: 400;
      border-radius: 8px;
      cursor: pointer;
      text-align: left;
      text-decoration: none;
      transition: background 0.15s;
    }
    .dropdown-item:hover { background: var(--accent); }
    .dropdown-item.destructive { color: var(--red-500); }
    .dropdown-item.destructive:hover { background: rgba(239,68,68,0.1); }

    .hamburger-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: transparent;
      color: var(--foreground);
      font-size: 20px;
      cursor: pointer;
    }

    .mobile-sheet {
      border-top: 1px solid var(--border);
      padding: 1rem;
    }
    .mobile-sheet-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      margin-bottom: 1rem;
    }

    .mobile-nav {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .mobile-nav a, .mobile-nav button {
      display: block;
      padding: 0.75rem 0.75rem;
      border: none;
      background: transparent;
      color: var(--foreground);
      font-size: 1.125rem;
      font-weight: 500;
      border-radius: 8px;
      cursor: pointer;
      text-decoration: none;
      text-align: left;
      transition: background 0.15s;
    }
    .mobile-nav a:hover, .mobile-nav button:hover { background: var(--accent); }
    .mobile-nav a.active { color: var(--primary); }
    .mobile-separator { height: 1px; background: var(--border); margin: 0.5rem 0; }
    .destructive-text { color: var(--red-500); }

    .main-content {
      flex: 1;
      width: 100%;
      max-width: 100vw;
    }

    .auth-layout {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 1rem;
      background: var(--background);
    }

    .site-footer {
      border-top: 1px solid var(--border);
      padding: 1.5rem 0;
      margin-top: auto;
      background: oklch(0.967 0.001 286.375 / 0.2);
    }
    .dark .site-footer { background: transparent; }
    .footer-inner {
      max-width: 1280px;
      margin: 0 auto;
      text-align: center;
    }
    .footer-text {
      font-size: 0.875rem;
      color: var(--muted-foreground);
    }

    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .desktop-only { display: none; }
    .mobile-only { display: block; }
    @media (min-width: 1024px) {
      .desktop-only { display: flex; }
      .mobile-only { display: none !important; }
    }
  `]
})
export class AppComponent implements OnInit {
  private store = inject(Store);
  protected authService = inject(AuthService);
  private router = inject(Router);

  menuOpen = signal(false);
  mobileOpen = signal(false);
  isDark = signal(false);
  currentYear = new Date().getFullYear();

  isAuthenticated = signal(false);
  displayName = signal('');
  user = signal<any>(null);
  isAuthPage = signal(false);
  initials = signal('');

  ngOnInit(): void {
    const savedTheme = this.authService.getTheme();
    this.isDark.set(savedTheme === 'dark');
    this.applyTheme();

    this.store.select(selectIsAuthenticated).subscribe(v => this.isAuthenticated.set(v));
    this.store.select(selectDisplayName).subscribe(v => {
      this.displayName.set(v || '');
      this.initials.set(this.getInitials(v || ''));
    });
    this.store.select(selectUser).subscribe(u => this.user.set(u));

    const token = this.authService.getToken();
    if (token) {
      this.store.dispatch(AuthActions.loadUser());
    }

    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      this.isAuthPage.set(e.url.includes('/auth/'));
      this.menuOpen.set(false);
      this.mobileOpen.set(false);
    });

    this.isAuthPage.set(this.router.url.includes('/auth/'));
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu') && !target.closest('.dropdown-menu')) {
      this.menuOpen.set(false);
    }
  }

  toggleTheme(): void {
    this.isDark.set(!this.isDark());
    this.authService.setTheme(this.isDark() ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme(): void {
    document.documentElement.classList.toggle('dark', this.isDark());
  }

  private getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
    this.menuOpen.set(false);
    this.router.navigate(['/auth/login']);
  }
}
