import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ActivitiesService } from '../../core/api/activities.service';
import { UsersService } from '../../core/api/activities.service';
import type { ActivityDto } from '../../core/api/types';
import { ModalComponent } from '../../shared/ui/modal';

interface ActionMeta {
  key: string;
  label: string;
  color: string;
}

@Component({
  selector: 'app-activities-page',
  imports: [DatePipe, FormsModule],
  templateUrl: './activities-page.html',
  styleUrl: './activities-page.css',
})
export class ActivitiesPage {
  private readonly activitiesApi = inject(ActivitiesService);
  private readonly usersApi = inject(UsersService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly items = signal<ActivityDto[]>([]);
  protected readonly userNames = signal<Map<string, string>>(new Map());
  protected readonly search = signal('');
  protected readonly action = signal('');

  protected readonly actions: ActionMeta[] = [
    { key: 'criacao', label: 'Criação', color: '#00c875' },
    { key: 'edicao', label: 'Edição', color: '#579bfc' },
    { key: 'revisao', label: 'Revisão', color: '#ffcb00' },
    { key: 'gravacao', label: 'Gravação', color: '#a25ddc' },
    { key: 'comentario', label: 'Comentário', color: '#fdab3d' },
    { key: 'exclusao', label: 'Exclusão', color: '#e2445c' },
    { key: 'exportacao', label: 'Exportação', color: '#00a9ff' },
    { key: 'restauracao', label: 'Restauração', color: '#00d0dd' },
    { key: 'entrou', label: 'Acesso', color: '#6161ff' },
  ];

  constructor() {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [items, users] = await Promise.all([
        this.activitiesApi.list(1, 100),
        this.usersApi.list().catch(() => [] as import('../../core/api/types').UserDto[]),
      ]);
      this.items.set(items);
      this.userNames.set(new Map(users.map((u) => [u.id, u.displayName])));
    } catch (e) {
      this.error.set(
        `Erro ao carregar atividades (${(e as { status?: number }).status ?? 'conexão'}).`,
      );
    } finally {
      this.loading.set(false);
    }
  }

  /** Traduz o tipo do backend para uma ação da UI. */
  private classify(type: string): ActionMeta {
    const map: Record<string, string> = {
      Create: 'criacao',
      Update: 'edicao',
      Delete: 'exclusao',
      Comment: 'comentario',
      Version: 'edicao',
      Revert: 'restauracao',
      Assign: 'edicao',
      Record: 'gravacao',
      Login: 'entrou',
      Permission: 'edicao',
      Other: 'entrou',
    };
    const key = map[type] ?? 'edicao';
    return this.actions.find((a) => a.key === key) ?? this.actions[1];
  }

  protected readonly rows = computed(() => {
    const names = this.userNames();
    const q = this.search().trim().toLowerCase();
    const filterKey = this.action();

    return this.items()
      .map((a) => {
        const meta = this.classify(a.type);
        const titleMatch = a.description.match(/"([^"]+)"/);
        return {
          ...a,
          action: meta,
          userName: a.userId ? (names.get(a.userId) ?? 'Usuário') : 'Sistema',
          targetTitle: titleMatch?.[1] ?? '',
        };
      })
      .filter((r) => !filterKey || r.action.key === filterKey)
      .filter(
        (r) =>
          !q ||
          r.targetTitle.toLowerCase().includes(q) ||
          r.userName.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q),
      );
  });
}
