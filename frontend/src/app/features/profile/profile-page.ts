import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthStore } from '../../core/auth/auth.store';
import { UsersService } from '../../core/api/activities.service';
import { WorkspaceService } from '../../core/api/workspace.service';
import type { WorkspaceDto } from '../../core/api/types';

@Component({
  selector: 'app-profile-page',
  imports: [FormsModule],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
})
export class ProfilePage {
  protected readonly auth = inject(AuthStore);
  private readonly usersApi = inject(UsersService);
  private readonly workspacesApi = inject(WorkspaceService);

  protected readonly saving = signal(false);
  protected readonly message = signal<{ ok: boolean; text: string } | null>(null);
  protected readonly displayName = signal('');
  protected readonly workspaces = signal<WorkspaceDto[]>([]);

  constructor() {
    this.displayName.set(this.auth.user()?.displayName ?? '');
    void this.workspacesApi
      .mine()
      .then((ws) => this.workspaces.set(ws))
      .catch(() => undefined);
  }

  protected initials(): string {
    const name = this.auth.user()?.displayName ?? '';
    return name.split(' ').filter(Boolean).slice(0, 2)
      .map((p) => p[0]?.toUpperCase()).join('');
  }

  protected async saveName(): Promise<void> {
    const name = this.displayName().trim();
    if (!name) {
      this.message.set({ ok: false, text: 'O nome não pode ficar vazio.' });
      return;
    }
    this.saving.set(true);
    this.message.set(null);
    try {
      await this.usersApi.updateMe({ displayName: name });
      const fresh = await this.usersApi.me();
      await this.auth.refresh(fresh);
      this.message.set({ ok: true, text: 'Nome atualizado com sucesso!' });
    } catch {
      this.message.set({ ok: false, text: 'Erro ao atualizar o nome.' });
    } finally {
      this.saving.set(false);
    }
  }

  protected readonly perms = [
    { key: 'canViewAdmin', label: 'Admin' },
    { key: 'canViewReports', label: 'Relatórios' },
    { key: 'canViewActivityHistory', label: 'Histórico de Atividades' },
    { key: 'canRevert', label: 'Reverter Ações' },
    { key: 'isEditor', label: 'Editor' },
    { key: 'isRevisor', label: 'Revisor' },
  ] as const;

  protected has(key: (typeof this.perms)[number]['key']): boolean {
    return (this.auth.user() as Record<string, unknown> | null)?.[key] === true;
  }
}
