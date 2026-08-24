import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthStore } from '../../core/auth/auth.store';
import { WorkspaceService } from '../../core/api/workspace.service';
import {
  ProjectsService,
  ScriptsService,
} from '../../core/api/projects.service';
import type { ProjectDto, ScriptDto } from '../../core/api/types';
import {
  SCRIPT_STATUSES,
  fromBackendStatus,
  statusMeta,
  statusSortPriority,
  toBackendStatus,
  type LocalStatus,
} from '../../shared/script-status';
import { ModalComponent } from '../../shared/ui/modal';

interface ScriptView extends ScriptDto {
  localStatus: LocalStatus;
}

interface ProjectGroup {
  project: ProjectDto;
  scripts: ScriptView[];
}

@Component({
  selector: 'app-dashboard-page',
  imports: [DatePipe, FormsModule, ModalComponent, RouterLink],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.css',
})
export class DashboardPage {
  protected readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly workspacesApi = inject(WorkspaceService);
  private readonly projectsApi = inject(ProjectsService);
  private readonly scriptsApi = inject(ScriptsService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly projects = signal<ProjectDto[]>([]);
  protected readonly scripts = signal<ScriptView[]>([]);
  protected readonly statuses = SCRIPT_STATUSES;

  /* Filtros */
  protected readonly search = signal('');
  protected readonly activeStatuses = signal<Set<LocalStatus>>(new Set());
  protected readonly openProjectId = signal<string | null>(null);

  /* Modais */
  protected readonly showNewProject = signal(false);
  protected readonly saving = signal(false);
  protected readonly newProjectName = signal('');
  protected readonly newProjectCode = signal('');

  protected readonly scriptModal = signal<{ project: ProjectDto } | null>(null);
  protected readonly newScriptTitle = signal('');
  protected readonly deleteTarget = signal<ScriptView | null>(null);

  /* ---------- Derivados ---------- */

  protected readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const allowed = this.activeStatuses();
    const projectFilter = this.openProjectFilter();
    let list = this.scripts();

    if (projectFilter) list = list.filter((s) => s.projectId === projectFilter);
    if (allowed.size > 0) list = list.filter((s) => allowed.has(s.localStatus));
    if (q) {
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          this.projectNameOf(s.projectId).toLowerCase().includes(q),
      );
    }

    return [...list].sort(
      (a, b) =>
        statusSortPriority(a.localStatus) - statusSortPriority(b.localStatus) ||
        a.title.localeCompare(b.title),
    );
  });

  protected readonly groups = computed<ProjectGroup[]>(() => {
    const byId = new Map(this.projects().map((p) => [p.id, p]));
    const map = new Map<string, ProjectGroup>();
    for (const s of this.filtered()) {
      const key = s.projectId;
      if (!map.has(key)) {
        map.set(key, {
          project: byId.get(key) ?? ({
            id: key,
            name: 'Sem projeto',
          } as ProjectDto),
          scripts: [],
        });
      }
      map.get(key)!.scripts.push(s);
    }
    return [...map.values()];
  });

  protected readonly stats = computed(() => {
    const all = this.scripts();
    const gravados = all.filter((s) => s.localStatus === 'gravado').length;
    return {
      projects: this.projects().length,
      scripts: all.length,
      recorded: gravados,
      reviewing: all.filter((s) => s.localStatus === 'em_revisao' || s.localStatus === 'rascunho')
        .length,
      progress: all.length ? Math.round((gravados / all.length) * 100) : 0,
    };
  });

  protected readonly counts = computed(() => {
    const map = new Map<LocalStatus, number>();
    for (const s of this.scripts()) {
      map.set(s.localStatus, (map.get(s.localStatus) ?? 0) + 1);
    }
    return map;
  });

  constructor() {
    // Filtro opcional por projeto vindo de /projects (?projectId=…)
    const projectId = this.route.snapshot.queryParamMap.get('projectId');
    if (projectId) this.openProjectFilter.set(projectId);
    void this.load();
  }

  protected readonly openProjectFilter = signal<string | null>(null);

  /** Modo de exibição da faixa de projetos (persistido no navegador). */
  protected readonly viewMode = signal<'carrossel' | 'lista'>(
    this.readViewMode(),
  );

  protected setViewMode(mode: 'carrossel' | 'lista'): void {
    this.viewMode.set(mode);
    try {
      localStorage.setItem('teleprompt_view_mode', mode);
    } catch {
      /* storage indisponível */
    }
  }

  private readViewMode(): 'carrossel' | 'lista' {
    try {
      return localStorage.getItem('teleprompt_view_mode') === 'lista'
        ? 'lista'
        : 'carrossel';
    } catch {
      return 'carrossel';
    }
  }

  protected toggleProjectFilter(id: string): void {
    this.openProjectFilter.update((v) => (v === id ? null : id));
  }

  /** Quantidade de roteiros por projeto (para a lista). */
  protected readonly scriptCountByProject = computed(() => {
    const map = new Map<string, number>();
    for (const s of this.scripts()) {
      map.set(s.projectId, (map.get(s.projectId) ?? 0) + 1);
    }
    return map;
  });

  protected scriptCountOf(projectId: string): number {
    return this.scriptCountByProject().get(projectId) ?? 0;
  }

  /* ---------- Carregamento ---------- */

  protected async load(): Promise<void> {
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
        this.scriptsApi.list(
          isSuper ? {} : { workspaceId: workspaceId ?? '' },
        ),
      ]);
      this.projects.set(projects);
      this.scripts.set(
        scripts.map((s) => ({ ...s, localStatus: fromBackendStatus(s.status) })),
      );
    } catch (e) {
      const status = (e as { status?: number }).status;
      this.error.set(
        status === 0
          ? 'Não foi possível conectar à API. Verifique se o backend está rodando.'
          : `Erro ao carregar dados (${status ?? 'desconhecido'}).`,
      );
    } finally {
      this.loading.set(false);
    }
  }

  /* ---------- Filtros ---------- */

  protected toggleStatus(value: LocalStatus): void {
    this.activeStatuses.update((set) => {
      const next = new Set(set);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });
  }

  protected clearFilters(): void {
    this.activeStatuses.set(new Set());
    this.search.set('');
  }

  protected projectNameOf(projectId: string): string {
    return this.projects().find((p) => p.id === projectId)?.name ?? '';
  }

  /* ---------- CRUD ---------- */

  protected async createProject(): Promise<void> {
    const name = this.newProjectName().trim();
    if (!name) return;
    this.saving.set(true);
    try {
      await this.projectsApi.create({
        name,
        code: this.autoCode(name),
        status: 'InProgress',
      });
      this.showNewProject.set(false);
      this.newProjectName.set('');
      this.newProjectCode.set('');
      await this.load();
    } catch {
      this.error.set('Falha ao criar o projeto.');
    } finally {
      this.saving.set(false);
    }
  }

  private autoCode(name: string): string {
    const letters =
      name.replace(/[^a-zA-Zà-úÀ-Ú]/g, '').slice(0, 3).toUpperCase() || 'PRJ';
    return `${letters}-${Math.floor(100 + Math.random() * 900)}`;
  }

  protected async createScript(): Promise<void> {
    const target = this.scriptModal();
    const title = this.newScriptTitle().trim() || 'Roteiro Inicial';
    if (!target) return;
    this.saving.set(true);
    try {
      const script = await this.scriptsApi.create({
        projectId: target.project.id,
        title,
        content: '',
      });
      this.scriptModal.set(null);
      this.newScriptTitle.set('');
      void this.router.navigate(['/editor', script.id]);
    } catch {
      this.error.set('Falha ao criar o roteiro.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async changeStatus(
    script: ScriptView,
    event: Event,
  ): Promise<void> {
    const value = (event.target as HTMLSelectElement).value as LocalStatus;
    try {
      await this.scriptsApi.update(script.id, { status: toBackendStatus(value) });
      this.scripts.update((list) =>
        list.map((s) =>
          s.id === script.id ? { ...s, localStatus: value } : s,
        ),
      );
    } catch {
      this.error.set('Falha ao alterar o status.');
    }
  }

  protected async confirmDelete(): Promise<void> {
    const target = this.deleteTarget();
    if (!target) return;
    this.saving.set(true);
    try {
      await this.scriptsApi.remove(target.id);
      this.deleteTarget.set(null);
      await this.load();
    } catch {
      this.error.set('Falha ao excluir o roteiro.');
    } finally {
      this.saving.set(false);
    }
  }

  protected canAssign(): boolean {
    const u = this.auth.user();
    return u?.isSuperAdmin === true || u?.canAssign === true;
  }

  protected pillStyle(status: LocalStatus): Record<string, string> {
    const meta = statusMeta(status);
    return {
      color: meta.color,
      background: `color-mix(in srgb, ${meta.color} 16%, white)`,
    };
  }

  protected meta(status: LocalStatus) {
    return statusMeta(status);
  }
}
