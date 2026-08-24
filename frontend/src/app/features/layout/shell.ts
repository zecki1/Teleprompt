import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthStore } from '../../core/auth/auth.store';

interface NavItem {
  label: string;
  route: string;
  exact?: boolean;
  color: string;
  icon: 'home' | 'board' | 'pulse' | 'user' | 'mic' | 'pen';
}

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  protected readonly auth = inject(AuthStore);
  protected readonly loggingOut = signal(false);

  protected readonly navItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', exact: true, color: '#6161ff', icon: 'home' },
    { label: 'Projetos', route: '/projects', color: '#00c875', icon: 'board' },
    { label: 'Atividades', route: '/activities', color: '#fdab3d', icon: 'pulse' },
    { label: 'Perfil', route: '/profile', color: '#579bfc', icon: 'user' },
  ];

  protected initials(): string {
    const name = this.auth.user()?.displayName ?? '';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('');
  }

  protected async logout(): Promise<void> {
    this.loggingOut.set(true);
    try {
      await this.auth.logout();
    } finally {
      this.loggingOut.set(false);
    }
  }
}
