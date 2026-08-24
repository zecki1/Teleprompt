import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthStore } from '../../core/auth/auth.store';
import { WorkspaceService } from '../../core/api/workspace.service';
import {
  ProjectsService,
  ScriptsService,
} from '../../core/api/projects.service';
import type { ProjectDto } from '../../core/api/types';
import { fromBackendStatus } from '../../shared/script-status';
import { ModalComponent } from '../../shared/ui/modal';

interface ProjectView extends ProjectDto {
  total: number;
  recorded: number;
  done: boolean;
  progress: number;
}

@Component({
  selector: 'app-projects-page',
  imports: [DatePipe, FormsModule, ModalComponent],
  templateUrl: './projects-page.html',
  styleUrl: './projects-page.css',
})
export class ProjectsPage {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly projectsApi = inject(ProjectsService);
  private readonly scriptsApi = inject(ScriptsService);
  private readonly workspacesApi = inject(WorkspaceService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly view = signal<'grid' | 'list'>('grid');
  protected readonly saving = signal(false);
  protected readonly items = signal<ProjectView[]>([]);

  protected readonly formOpen = signal<null | 'create' | 'edit'>(null);
  protected readonly editingId = signal<string | null>(null);
  protected readonly name = signal('');
  protected readonly code = signal('');
  protected readonly link = signal('');
  protected readonly deleteTarget = signal<ProjectView | null>(null);

  protected readonly activeStyle = {
    color: '#00c875',
    background: 'color-mix(in srgb, #00c875 16%, white)',
  };
  protected readonly doneStyle = {
    color: '#579bfc',
    background: 'color-mix(in srgb, #579bfc 16%, white)',
  };

  protected readonly sorted = computed(() =>
    [...this.items()].sort((a, b) => Number(a.done) - Number(b.done)),
  );

  protected readonly totals = computed(() => ({
    scripts: this.items().reduce((acc, p) => acc + p.total, 0),
    active: this.items().filter((p) => !p.done).length,
  }));

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const user = this.auth.user();
      let workspaceId = user?.workspaceId || null;
      if (!workspaceId) {
        const mine = await this.workspacesApi.mine().catch(() => []);
        workspaceId = mine[0]?.id ?? null;
      }
      const isSuper = user?.isSuperAdmin === true;
      const [projects, scripts] = await Promise.all([
        this.projectsApi.list(isSuper ? undefined : (workspaceId ?? undefined)),
        this.scriptsApi.list(isSuper ? {} : { workspaceId: workspaceId ?? '' }),
      ]);

      this.items.set(
        projects.map((p) => {
          const own = scripts.filter(
            (s) => s.projectId === p.id,
          );
          const recorded = own.filter(
            (s) => fromBackendStatus(s.status) === 'gravado',
          ).length;
          const total = own.length;
          return {
            ...p,
            total,
            recorded,
            done: total > 0 && recorded === total,
            progress: total ? Math.round((recorded / total) * 100) : 0,
          };
        }),
      );
    } catch (e) {
      this.error.set(
        `Erro ao carregar projetos (${(e as { status?: number }).status ?? 'conexão'}).`,
      );
    } finally {
      this.loading.set(false);
    }
  }

  /* ---------- Formulário ---------- */

  protected openCreate(): void {
    this.editingId.set(null);
    this.name.set('');
    this.code.set(this.autoCode('', this.items().length));
    this.link.set('');
    this.formOpen.set('create');
  }

  protected openEdit(p: ProjectView): void {
    this.editingId.set(p.id);
    this.name.set(p.name);
    this.code.set(p.code ?? '');
    this.link.set(p.externalLink ?? '');
    this.formOpen.set('edit');
  }

  protected nameChanged(value: string): void {
    this.name.set(value);
    if (!this.editingId() && !this.touchedCode) {
      this.code.set(this.autoCode(value, this.items().length));
    }
  }

  private touchedCode = false;

  protected codeChanged(value: string): void {
    this.touchedCode = true;
    this.code.set(value);
  }

  protected async save(): Promise<void> {
    if (!this.name().trim()) return;
    this.saving.set(true);
    try {
      if (this.formOpen() === 'create') {
        await this.projectsApi.create({
          name: this.name().trim(),
          code: this.code().trim() || undefined,
          externalLink: this.link().trim() || undefined,
          status: 'InProgress',
        });
      } else if (this.editingId()) {
        await this.projectsApi.update(this.editingId()!, {
          name: this.name().trim(),
          code: this.code().trim(),
          externalLink: this.link().trim(),
        });
      }
      this.formOpen.set(null);
      await this.load();
    } catch {
      this.error.set('Falha ao salvar o projeto.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async confirmDelete(): Promise<void> {
    const target = this.deleteTarget();
    if (!target) return;
    this.saving.set(true);
    try {
      await this.projectsApi.remove(target.id);
      this.deleteTarget.set(null);
      await this.load();
    } catch {
      this.error.set('Falha ao excluir o projeto.');
    } finally {
      this.saving.set(false);
    }
  }

  protected open(p: ProjectView): void {
    void this.router.navigate(['/dashboard'], { queryParams: { projectId: p.id } });
  }

  private autoCode(name: string, existing: number): string {
    if (!name) return '';
    const letters =
      name.replace(/[^a-zA-Zà-úÀ-Ú]/g, '').slice(0, 3).toUpperCase() || 'PRJ';
    return `${letters}-${String(existing + 1).padStart(3, '0')}`;
  }
}
